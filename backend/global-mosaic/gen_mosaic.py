"""Generate global mosaic tiles using TiTiler.

We use different approaches at different zoom levels:
- Zooms 0-10 --> Pre-generated "coverage mask".
    NOTE we do this because seeing a blob of high res imagery on
    a tiny zoom level 0 tile is pretty useless.
- Zooms 11-14 --> Mosaicked imagery from high-res COGs.
- Zooms 14-22 --> The actual TMS from TiTiler.

NOTE it would probably be best to use cogeo-mosaic with mosaicJSON
NOTE so consider updating this script.
"""

import os
import time
import json
from concurrent.futures import ThreadPoolExecutor

import mercantile
import affine
import numpy as np
from psycopg import connect
from shapely.geometry import shape, box
from shapely.strtree import STRtree
from rasterio import features
from rio_tiler.mosaic import mosaic_reader
from rio_tiler.io import COGReader
from rio_tiler.models import ImageData
from rio_tiler.utils import render
from pmtiles.writer import write
from pmtiles.tile import zxy_to_tileid, TileType, Compression

PG_DSN = os.getenv("PG_DSN", "postgresql://user:pass@host:port/pgstac")
COLLECTION = "openaerialmap"
ZOOM_MIN, ZOOM_MAX = 0, 13  # Zoom range to mosaic
OUTPUT_PM = "/app/output/global_mosaic.pmtiles"
TILE_SIZE = 256
MAX_COGS_PER_TILE = 5  # Limit number of COGs mosaicked per tile
THREADS = int(os.getenv("THREADS", 8))

TEST_MODE = bool(os.getenv("TEST_MODE", False))
BBOX = (-14.00, 4.00, -8.00, 10.00) if TEST_MODE else (-180, -90, 180, 90)

band_count_cache: dict[str, int] = {}
failure_cache: set[str] = set()  # Tracks COGs that failed to open
cog_readers_cache: dict[str, COGReader] = {}  # Cache opened COG readers


def get_features() -> list[dict]:
    """Query PgSTAC for imagery features in BBOX."""
    where_bbox = ""
    params = [COLLECTION]
    if TEST_MODE:
        where_bbox = "AND geometry && ST_MakeEnvelope(%s, %s, %s, %s, 4326)"
        params.extend(BBOX)

    query = f"""
    SELECT id::text AS id,
        content->'assets'->'visual'->>'href' AS url,
        ST_AsGeoJSON(geometry) AS geom
    FROM pgstac.items
    WHERE collection = %s
    {where_bbox}
    ORDER BY (content->>'datetime')::timestamptz DESC
    """

    with connect(PG_DSN) as conn, conn.cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()

    features = [
        {"geometry": shape(json.loads(geom)), "url": url, "id": id_}
        for id_, url, geom in rows
        if url
    ]
    print(f"Found {len(features)} items in pgSTAC for given BBOX")
    return features


def get_band_count_lazy(url: str) -> int | None:
    """
    Get band count for a COG URL, checking cache first.

    Returns None if COG failed to open or is not RGB.
    """
    if url in failure_cache:
        return None

    if url in band_count_cache:
        return band_count_cache[url]

    try:
        with COGReader(url) as cog:
            count = cog.dataset.count
            band_count_cache[url] = count
            return count if count == 3 else None  # Only return RGB COGs
    except Exception:
        failure_cache.add(url)
        return None


def filter_rgb_features_for_tile(
    feature_indices: list[int], features: list[dict]
) -> list[str]:
    """
    Filter features to only RGB COGs for a specific tile.
    Only checks band counts for COGs that intersect this tile.
    """
    rgb_urls = []
    for idx in feature_indices:
        url = features[idx]["url"]
        if get_band_count_lazy(url) == 3:
            rgb_urls.append(url)
            if len(rgb_urls) >= MAX_COGS_PER_TILE:
                break
    return rgb_urls


def group_tiles_by_zoom(
    tiles: list[mercantile.Tile],
) -> dict[int, list[mercantile.Tile]]:
    """Group tiles by zoom level for more efficient processing."""
    tiles_by_zoom = {}
    for tile in tiles:
        if tile.z not in tiles_by_zoom:
            tiles_by_zoom[tile.z] = []
        tiles_by_zoom[tile.z].append(tile)
    return tiles_by_zoom


def get_tile_list(features: list[dict]) -> list[mercantile.Tile]:
    """
    Generate a list of Web Mercator tiles that cover all provided imagery features.

    This function:
    1. Extracts geometries from the input features.
    2. Builds a spatial index (STRtree) for fast intersection queries.
    3. Iterates through zoom levels from `ZOOM_MIN` to `ZOOM_MAX`.
    4. For each tile in the BBOX at that zoom, checks if the tile bounds intersect
       with any imagery geometry.
    5. Returns a flat list of all tiles that intersect at least one feature.

    Args:
        features: List of dicts containing:
            - geometry (shapely geometry): footprint of the imagery.
            - url (str): link to the COG imagery file.
            - id (str): unique identifier for the feature.

    Returns:
        List of mercantile.Tile objects representing the tiles to render.
    """
    geoms = [f["geometry"] for f in features]
    tree = STRtree(geoms)

    tiles: list[mercantile.Tile] = []

    for z in range(ZOOM_MIN, ZOOM_MAX + 1):
        zoom_tiles = []
        for tile in mercantile.tiles(*BBOX, [z]):
            tile_geom = box(*mercantile.bounds(tile))
            intersect_indices = tree.query(tile_geom)
            if len(intersect_indices) > 0:  # At least one feature intersects
                zoom_tiles.append(tile)

        print(f"Zoom {z}: {len(zoom_tiles)} tiles")
        tiles.extend(zoom_tiles)

    return tiles


def cog_reader(url: str, x: int, y: int, z: int):
    """Read COGs that are RGBA."""
    if url in failure_cache:
        return None

    if url in band_count_cache and band_count_cache[url] != 3:
        return None

    try:
        with COGReader(url) as cog:
            if url not in band_count_cache:
                band_count_cache[url] = cog.dataset.count
                if cog.dataset.count != 3:
                    return None

            # Read RGB bands and get the mask
            tile_data = cog.tile(x, y, z, indexes=(1, 2, 3))

            # Create alpha channel from the mask
            # The mask is True where data is valid, False where it should be transparent
            alpha = (tile_data.mask[0] == False).astype(np.uint8) * 255

            # Stack RGB + Alpha to create RGBA
            rgba_data = np.concatenate(
                [
                    tile_data.data,  # RGB bands
                    alpha[np.newaxis, :, :],  # Alpha band
                ],
                axis=0,
            )

            # Return ImageData-like object with RGBA data
            return ImageData(
                data=rgba_data,
                mask=tile_data.mask,
                assets=[url],
                crs=tile_data.crs,
                bounds=tile_data.bounds,
            )

    except Exception as e:
        failure_cache.add(url)
        print(f"Failed to read COG {url}: {e}")
        return None


def make_coverage_tile_for_geom(
    tile_bounds: tuple[float, float, float, float],
    geoms: list,
    color: tuple[int, int, int, int] = (128, 128, 128, 128),
) -> bytes:
    """
    Create a PNG tile with grey translucent coverage where imagery exists,
    transparent elsewhere.

    Args:
        tile_bounds: (west, south, east, north) bounds of the tile
        geoms: List of shapely geometries to rasterize
        color: RGBA color tuple for coverage areas

    Returns:
        PNG bytes for the coverage tile
    """
    # Early return for empty geometry list
    if not geoms:
        # Return fully transparent tile
        arr = np.zeros((TILE_SIZE, TILE_SIZE, 4), dtype=np.uint8)
        return render(arr.transpose(2, 0, 1), img_format="PNG")

    # Tile size and transform
    transform = affine.Affine(
        (tile_bounds[2] - tile_bounds[0]) / TILE_SIZE,
        0,
        tile_bounds[0],
        0,
        (tile_bounds[1] - tile_bounds[3]) / TILE_SIZE,
        tile_bounds[3],
    )

    # Rasterize geometry mask (1 where covered, 0 elsewhere)
    mask = features.rasterize(
        [(geom, 1) for geom in geoms],
        out_shape=(TILE_SIZE, TILE_SIZE),
        transform=transform,
        fill=0,
        all_touched=True,
        dtype="uint8",
    )

    # Create RGBA array with coverage color where mask is 1
    arr = np.zeros((TILE_SIZE, TILE_SIZE, 4), dtype=np.uint8)
    arr[mask == 1, :4] = color
    return render(arr.transpose(2, 0, 1), img_format="PNG")


def process_tile(
    tile: mercantile.Tile, features: list[dict], tree: STRtree
) -> tuple[int, bytes]:
    """
    Process global tile, reading COG if there is a hit.

    Args:
        tile: Mercantile tile to process
        features: List of all imagery features
        tree: Spatial index of feature geometries

    Returns:
        Tuple of (tileid, PNG bytes) for the rendered tile
    """
    x, y, z = tile.x, tile.y, tile.z

    tile_geom = box(*mercantile.bounds(tile))
    candidate_indices = tree.query(tile_geom)

    if len(candidate_indices) == 0:
        # No coverage at all - return transparent tile
        return zxy_to_tileid(z, x, y), make_coverage_tile_for_geom(
            mercantile.bounds(tile), []
        )

    # For low zoom levels (0-10), just show coverage mask
    if z <= 10:
        covered_geoms = [tree.geometries[i] for i in candidate_indices]
        return zxy_to_tileid(z, x, y), make_coverage_tile_for_geom(
            mercantile.bounds(tile), covered_geoms
        )

    # For higher zoom levels (11+), try to mosaic actual imagery
    # Only check band counts for COGs that intersect this specific tile
    tile_cogs = filter_rgb_features_for_tile(candidate_indices, features)

    if not tile_cogs:
        # No valid RGB imagery --> fallback to coverage tile
        covered_geoms = [tree.geometries[i] for i in candidate_indices]
        return zxy_to_tileid(z, x, y), make_coverage_tile_for_geom(
            mercantile.bounds(tile), covered_geoms
        )

    try:
        # Attempt to mosaic the RGB COGs
        image, _ = mosaic_reader(tile_cogs, lambda url: cog_reader(url, x, y, z))

        return zxy_to_tileid(z, x, y), render(
            image.data,
            img_format="PNG",
            # Force RGBA output to preserve transparency
            colormap=None,
        )

    except Exception as e:
        print(f"Mosaic failed for tile {z}/{x}/{y}: {e}")
        # Fallback to coverage tile
        covered_geoms = [tree.geometries[i] for i in candidate_indices]
        return zxy_to_tileid(z, x, y), make_coverage_tile_for_geom(
            mercantile.bounds(tile), covered_geoms
        )


def render_pmtiles_optimized(
    features: list[dict], tiles: list[mercantile.Tile]
) -> None:
    """
    Render tiles to PMTiles archive.

    Processes tiles in zoom-level order to take advantage of spatial locality
    and optimize caching behavior.
    """
    metadata = {
        "name": COLLECTION,
        "bounds": list(BBOX),
        "minzoom": ZOOM_MIN,
        "maxzoom": ZOOM_MAX,
        "description": f"Global mosaic from {COLLECTION}",
    }
    header = {
        "version": 3,
        "tile_type": TileType.PNG,
        "tile_compression": Compression.NONE,  # Prioritize speed over size
    }

    geoms = [f["geometry"] for f in features]
    tree = STRtree(geoms)

    # Group tiles by zoom level for better processing order
    tiles_by_zoom = group_tiles_by_zoom(tiles)

    total_tiles = len(tiles)
    processed_tiles = 0

    with write(OUTPUT_PM) as writer:
        # Process tiles zoom by zoom for better cache locality
        for zoom in sorted(tiles_by_zoom.keys()):
            zoom_tiles = tiles_by_zoom[zoom]
            print(f"Processing zoom {zoom}: {len(zoom_tiles)} tiles")

            with ThreadPoolExecutor(max_workers=THREADS) as executor:
                # Process tiles in batches to avoid overwhelming memory
                batch_size = min(100, len(zoom_tiles))
                for i in range(0, len(zoom_tiles), batch_size):
                    batch = zoom_tiles[i : i + batch_size]

                    # Process batch
                    results = list(
                        executor.map(lambda t: process_tile(t, features, tree), batch)
                    )

                    # Write results
                    for tileid, data in results:
                        writer.write_tile(tileid, data)
                        processed_tiles += 1

                    if processed_tiles % 500 == 0:
                        print(
                            f"Processed {processed_tiles}/{total_tiles} tiles "
                            f"({processed_tiles / total_tiles * 100:.1f}%)"
                        )

        writer.finalize(header, metadata)
        print(
            f"Cache stats: {len(band_count_cache)} COGs checked, "
            f"{len(failure_cache)} failed"
        )


def estimate_processing_time(tiles: list[mercantile.Tile]) -> None:
    """Provide user with estimated processing time based on tile count."""
    # Rough estimates based on zoom level complexity
    coverage_tiles = sum(1 for t in tiles if t.z <= 5)
    mosaic_tiles = sum(1 for t in tiles if t.z > 5)

    # Rough time estimates (seconds per tile)
    coverage_time = coverage_tiles * 0.1  # Coverage tiles are fast
    mosaic_time = mosaic_tiles * 2.0  # Mosaic tiles are slower

    total_estimate = coverage_time + mosaic_time

    print("Processing estimate:")
    print(
        f"  - Coverage tiles (zoom 0-10): {coverage_tiles} tiles (~{coverage_time:.1f}s)"
    )
    print(f"  - Mosaic tiles (zoom 11+): {mosaic_tiles} tiles (~{mosaic_time:.1f}s)")
    print(f"  - Total estimated time: {total_estimate / 60:.1f} minutes")


def main():
    """Generate the global mosaic."""
    print(f"Starting global mosaic generation for {BBOX}")
    print(f"Target zoom range: {ZOOM_MIN}-{ZOOM_MAX}")
    print(f"Using {THREADS} threads")

    # Load features from database
    features = get_features()
    if not features:
        print("No imagery found. Exiting.")
        return

    print("Calculating tiles to render...")
    tiles = get_tile_list(features)
    print(f"Total tiles to render: {len(tiles)}")

    # Provide time estimate
    estimate_processing_time(tiles)

    # Start processing
    start = time.time()
    render_pmtiles_optimized(features, tiles)

    elapsed = time.time() - start
    print(f"PMTiles archive written: {OUTPUT_PM}")
    print(f"Total processing time: {elapsed:.2f} seconds ({elapsed / 60:.1f} minutes)")
    print(f"Average time per tile: {elapsed / len(tiles):.3f} seconds")

    # Final cache statistics
    print("Final stats:")
    print(f"  - COGs with cached band counts: {len(band_count_cache)}")
    print(f"  - Failed COGs: {len(failure_cache)}")
    print(
        f"  - Cache hit rate: {len(band_count_cache) / (len(band_count_cache) + len(failure_cache)) * 100:.1f}%"
    )


if __name__ == "__main__":
    main()
