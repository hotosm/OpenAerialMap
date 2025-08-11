#!/usr/bin/env python3
"""
Generate a PMTiles archive at /app/output/global_mosaic.pmtiles by:
 1. Querying PgSTAC for imagery footprints within a bbox
 2. Generating grey coverage tiles (z 0-10) by rasterizing footprints into the tile
 3. Downloading real tiles for z 11-14 from TiTiler and inserting into PMTiles
 - Skipping z > 14 (these are served upstream by TiTiler directly)

Configuration (env):
 - PG_DSN: Postgres DSN for PgSTAC (e.g. postgresql://user:pass@host:port/db)
 - COLLECTION: collection name in pgstac.items (default: "openaerialmap")
 - TILE_URL_TEMPLATE: tile URL template with {z},{x},{y},{collection} e.g.
     https://.../raster/collections/{collection}/tiles/WebMercatorQuad/
     {z}/{x}/{y}.png?assets=visual&bidx=1&bidx=2&bidx=3
 - THREADS: number of concurrent HTTP workers (default 16)
 - HTTP_TIMEOUT: request timeout seconds (default 30)
 - RETRIES: per-tile retries (default 2)
 - TEST_MODE: if set => uses small BBOX; otherwise global BBOX
 - LOG_LEVEL: the log level to use, from "DEBUG" or "INFO"
"""

import asyncio
import json
import logging
import os
import sys
import time
from dataclasses import dataclass
from typing import Optional
from pathlib import Path

import aiohttp
import mercantile
import numpy as np
import affine
from psycopg import connect
from shapely.geometry import shape, box
from shapely.strtree import STRtree
from rasterio import features
from rio_tiler.utils import render
from pmtiles.writer import write
from pmtiles.tile import zxy_to_tileid, TileType, Compression
from minio import Minio
from minio.error import S3Error


PG_DSN = os.getenv("PG_DSN", "postgresql://user:pass@host:port/pgstac")
COLLECTION = os.getenv("COLLECTION", "openaerialmap")
# NOTE here we specify the bands to select manually to avoid errors
# NOTE RGB = param `bidx=1&bidx=2&bidx=3`
TILE_URL_TEMPLATE = os.getenv(
    "TILE_URL_TEMPLATE",
    "https://oam-eoapi-prod.imagery-services.k8s-prod.hotosm.org/raster/collections"
    "/{collection}/tiles/WebMercatorQuad/{z}/{x}/{y}.png?assets=visual&bidx=1&bidx=2&bidx=3",
)
THREADS = int(os.getenv("THREADS", "16"))
HTTP_TIMEOUT = int(os.getenv("HTTP_TIMEOUT", "30"))
RETRIES = int(os.getenv("RETRIES", "2"))

TEST_MODE = bool(os.getenv("TEST_MODE", False))
BBOX: tuple[float, float, float, float] = (
    (-14.0, 4.0, -8.0, 10.0)
    if TEST_MODE
    else (-180.0, -85.05112878, 180.0, 85.05112878)
)

OUTPUT_PM = "/app/output/global_mosaic.pmtiles"
TILE_SIZE = 256

ZOOM_MIN = 0
ZOOM_MAX = 14  # we produce coverage 0-10, tiles 11-14, skip >14

logging.basicConfig(
    stream=sys.stdout,
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s: %(message)s",
)
log = logging.getLogger("gen_mosaic")


@dataclass
class TileJob:
    z: int
    x: int
    y: int


def get_features() -> list[dict]:
    """
    Query PgSTAC for imagery features in BBOX (synchronous).
    Returns list of dicts: {"geometry": shapely.geometry, "url": <asset url or None>, "id": <id>}
    """
    where_bbox = ""
    params = [COLLECTION]
    where_bbox = "AND geometry && ST_MakeEnvelope(%s, %s, %s, %s, 4326)"
    params.extend(BBOX)

    query = f"""
        SELECT id::text AS id,
            content->'assets'->'visual'->>'href' AS url,
            ST_AsGeoJSON(geometry) AS geom
        FROM pgstac.items
        WHERE collection = %s
        {where_bbox}
        ORDER BY (content->>'datetime')::timestamptz DESC;
    """

    log.info(f"Querying PgSTAC for features (bbox={BBOX})...")
    features = []
    with connect(PG_DSN) as conn, conn.cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()

    for id_, url, geom in rows:
        if geom is None:
            continue
        try:
            geom_json = json.loads(geom)
            features.append({"geometry": shape(geom_json), "url": url, "id": id_})
        except Exception as e:
            log.warning(f"Failed to parse geometry for {id_}: {e}")

    log.debug(f"Query: {query}")
    log.info(f"Found {len(features)} items in pgSTAC for bbox")
    return features


def get_tile_list(features: list[dict]) -> list[mercantile.Tile]:
    """
    Build spatial index of feature footprints and return list of tiles intersecting them
    for zooms ZOOM_MIN..ZOOM_MAX.
    """
    geoms = [f["geometry"] for f in features]
    tree = STRtree(geoms)

    tiles: list[mercantile.Tile] = []
    for z in range(ZOOM_MIN, ZOOM_MAX + 1):
        zoom_tiles = []
        # iterate only within bbox (default is global)
        for tile in mercantile.tiles(*BBOX, [z]):
            tile_geom = box(*mercantile.bounds(tile))
            intersect_indices = tree.query(tile_geom)
            if len(intersect_indices) > 0:
                zoom_tiles.append(tile)
        log.info(f"Zoom {z}: {len(zoom_tiles)} tiles")
        tiles.extend(zoom_tiles)
    return tiles


def make_coverage_tile_for_geom(
    tile_bounds: tuple[float, float, float, float],
    geoms: list,
    color: tuple[int, int, int, int] = (128, 128, 128, 102),  # 102/255 ≈ 40% opacity
) -> bytes:
    """
    Create a PNG tile (256x256) with translucent coverage where imagery exists,
    transparent elsewhere. Returns PNG bytes.
    """
    # Early return for empty geometry list -> fully transparent tile
    if not geoms:
        arr = np.zeros((TILE_SIZE, TILE_SIZE, 4), dtype=np.uint8)
        return render(arr.transpose(2, 0, 1), img_format="PNG")

    # build transform from tile bounds to pixel grid
    west, south, east, north = tile_bounds
    transform = affine.Affine(
        (east - west) / TILE_SIZE, 0, west, 0, (south - north) / TILE_SIZE, north
    )

    # rasterize geometries to mask
    mask = features.rasterize(
        [(geom, 1) for geom in geoms],
        out_shape=(TILE_SIZE, TILE_SIZE),
        transform=transform,
        fill=0,
        all_touched=True,
        dtype="uint8",
    )

    # build RGBA array: color where mask==1, else transparent
    arr = np.zeros((TILE_SIZE, TILE_SIZE, 4), dtype=np.uint8)
    # assign RGBA to masked pixels
    r, g, b, a = color
    arr[mask == 1, 0] = r
    arr[mask == 1, 1] = g
    arr[mask == 1, 2] = b
    arr[mask == 1, 3] = a

    return render(arr.transpose(2, 0, 1), img_format="PNG")


async def fetch_tile_bytes(
    session: aiohttp.ClientSession, url: str, timeout: int, retries: int
) -> Optional[bytes]:
    """
    Fetch single tile as bytes. Return None for missing (404) or non-200.
    Retries transient network/server errors.
    """
    attempt = 0
    while attempt <= retries:
        try:
            async with session.get(url, timeout=timeout) as resp:
                if resp.status == 200:
                    return await resp.read()
                if resp.status == 404:
                    log.debug(f"Tile not found (404): {url}")
                    return None
                if 500 <= resp.status < 600:
                    log.warning(
                        f"Server error {resp.status} for {url} (attempt {attempt + 1}/{retries})"
                    )
                else:
                    log.warning(f"Unexpected status {resp.status} for {url}")
                    return None
        except asyncio.CancelledError:
            raise
        except Exception as e:
            log.warning(f"Error fetching {url}: {e} (attempt {attempt + 1}/{retries})")

        attempt += 1
        await asyncio.sleep(0.5 * attempt)

    log.error(f"Failed to fetch {url} after {retries} attempts")
    return None


def generate_mosaic() -> None:
    """
    Main entrypoint (synchronous). Queries PG, builds tile list, and writes PMTiles.
    Uses an asyncio loop internally to download 11-14 tiles concurrently.
    """
    # 1) get footprint of all items from database, within bbox
    features = get_features()
    if not features:
        log.warning("No features found - nothing to do.")
        return

    # spatial index for lookups and tile selection
    geoms = [f["geometry"] for f in features]
    tree = STRtree(geoms)

    # 2) get all mercator tiles that overlap the feature geoms
    tiles = get_tile_list(features)
    if not tiles:
        log.info("No tiles to render for bbox")
        return

    # group tiles by zoom for processing order
    tiles_by_zoom: dict[int, list[mercantile.Tile]] = {}
    for t in tiles:
        tiles_by_zoom.setdefault(t.z, []).append(t)

    total_tiles = len(tiles)
    log.info(f"Total tiles to render (z 0-14): {total_tiles}")

    # 3) prepare pmtiles writer
    header = {
        "version": 3,
        "tile_type": TileType.PNG,
        "tile_compression": Compression.NONE,
    }
    metadata = {
        "name": COLLECTION,
        "bounds": list(BBOX),
        "minzoom": ZOOM_MIN,
        "maxzoom": ZOOM_MAX,
        "description": f"Global mosaic (coverage z0-10; tiles z11-14) from {COLLECTION}",
    }

    start_time = time.time()
    with write(OUTPUT_PM) as writer:
        processed = 0
        written = 0
        skipped = 0

        # Part A: coverage tiles (z 0-10, indicating where imagery exists)
        for z in sorted(k for k in tiles_by_zoom.keys() if k <= 10):
            zs = tiles_by_zoom[z]
            log.info(f"Processing coverage zoom {z}: {len(zs)} tiles")
            for tile in zs:
                tile_geom = box(*mercantile.bounds(tile))
                candidate_idx = tree.query(tile_geom)
                if len(candidate_idx) == 0:
                    # fully transparent
                    data = make_coverage_tile_for_geom(mercantile.bounds(tile), [])
                else:
                    covered_geoms = [tree.geometries[i] for i in candidate_idx]
                    data = make_coverage_tile_for_geom(
                        mercantile.bounds(tile), covered_geoms
                    )
                writer.write_tile(zxy_to_tileid(tile.z, tile.x, tile.y), data)
                written += 1
                processed += 1
                if processed % 500 == 0:
                    log.info(
                        f"Processed {processed}/{total_tiles} (written={written} skipped={skipped})"
                    )

        # Part B: TiTiler tiles (z 11-14, mosaicked from TiTiler)
        download_tiles_list: list[mercantile.Tile] = []
        for z in sorted(k for k in tiles_by_zoom.keys() if 11 <= k <= 14):
            download_tiles_list.extend(tiles_by_zoom[z])

        if download_tiles_list:
            log.info(
                f"Downloading {len(download_tiles_list)} tiles for zooms 11-14 using {THREADS} workers"
            )

            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            queue: asyncio.Queue[
                tuple[Optional[int], Optional[bytes], Optional[mercantile.Tile]]
            ] = asyncio.Queue()

            async def producer():
                connector = aiohttp.TCPConnector(limit_per_host=THREADS)
                timeout = aiohttp.ClientTimeout(total=HTTP_TIMEOUT)
                sem = asyncio.Semaphore(THREADS)
                async with aiohttp.ClientSession(
                    connector=connector, timeout=timeout
                ) as session:

                    async def fetch_and_enqueue(tile: mercantile.Tile):
                        url = TILE_URL_TEMPLATE.format(
                            collection=COLLECTION, z=tile.z, x=tile.x, y=tile.y
                        )
                        async with sem:
                            data = await fetch_tile_bytes(
                                session, url, HTTP_TIMEOUT, RETRIES
                            )
                            tid = zxy_to_tileid(tile.z, tile.x, tile.y)
                            await queue.put(
                                (tid, data, tile)
                            )  # include tile for fallback

                    tasks = [
                        asyncio.create_task(fetch_and_enqueue(t))
                        for t in download_tiles_list
                    ]
                    # wait for all to complete
                    await asyncio.gather(*tasks)
                # signal completion
                await queue.put((None, None, None))

            producer_task = loop.create_task(producer())

            try:
                while True:
                    tid, data, tile = loop.run_until_complete(queue.get())
                    if tid is None and data is None and tile is None:
                        break
                    if data:
                        writer.write_tile(tid, data)
                        written += 1
                    else:
                        # fallback: coverage tile for that tile area
                        tile_geom = box(*mercantile.bounds(tile))
                        candidate_idx = tree.query(tile_geom)
                        if len(candidate_idx) == 0:
                            fallback = make_coverage_tile_for_geom(
                                mercantile.bounds(tile), []
                            )
                        else:
                            covered_geoms = [tree.geometries[i] for i in candidate_idx]
                            fallback = make_coverage_tile_for_geom(
                                mercantile.bounds(tile), covered_geoms
                            )
                        writer.write_tile(tid, fallback)
                        written += 1
                    processed += 1
                    if processed % 500 == 0:
                        log.info(
                            f"Processed {processed}/{total_tiles} (written={written} skipped={skipped})"
                        )
            finally:
                loop.run_until_complete(producer_task)
                loop.close()

        writer.finalize(header, metadata)

    elapsed = time.time() - start_time
    log.info(f"PMTiles archive written: {OUTPUT_PM}")
    log.info(f"Total processing time: {elapsed:.1f} s ({elapsed / 60.0:.1f} min)")
    log.info(f"Tiles processed: {processed} (written={written} skipped={skipped})")


def upload_to_s3():
    endpoint = os.getenv("S3_ENDPOINT", "s3.amazonaws.com")
    bucket = os.getenv("S3_BUCKET", "oin-hotosm-temp")
    access_key = os.getenv("S3_ACCESS_KEY")
    secret_key = os.getenv("S3_SECRET_KEY")
    region = os.getenv("S3_REGION", "us-east-1")
    object_key = os.getenv("S3_OBJECT_KEY", "global-mosaic.pmtiles")

    if not all([endpoint, bucket, access_key, secret_key]):
        log.warning("S3 upload skipped: missing required env vars.")
        return

    log.debug(f"Initialising Minio client for {endpoint}")
    client = Minio(
        endpoint,
        access_key=access_key,
        secret_key=secret_key,
        region=region,
        secure=True,
    )

    # NOTE this requires IAM permission ListAllBuckets on the account
    try:
        log.info(f"Checking the bucket {bucket} exists")
        if not client.bucket_exists(bucket):
            log.exception(f"Bucket {bucket} does not exist. Exiting")
            return
    except S3Error as e:
        log.error(f"Error checking bucket: {e}")
        return

    log.info(f"Uploading {OUTPUT_PM} to s3://{bucket}/{object_key}")
    try:
        client.fput_object(
            bucket,
            object_key,
            OUTPUT_PM,
            content_type="application/vnd.pmtiles",
            # Important to ensure the object is public readable
            metadata={"x-amz-acl": "public-read"},
        )
        log.info(f"Upload complete: s3://{bucket}/{object_key}")
    except S3Error as e:
        log.error(f"S3 upload failed: {e}")


if __name__ == "__main__":
    if Path(OUTPUT_PM).exists():
        log.info(
            f"PMTiles archive at {OUTPUT_PM} already exists, skipping straight to upload"
        )
    else:
        log.info(f"Starting PMTiles generation (TEST_MODE={TEST_MODE})")
        generate_mosaic()

    upload_to_s3()
