#!/usr/bin/env python3
"""
Generate simple coverage vector tiles, based on GeoJSON output
from pgSTAC catalogue.
"""

import json
import logging
import os
import sys
import subprocess
from pathlib import Path
from typing import Tuple
from psycopg import connect
from minio import Minio
from minio.error import S3Error


PG_DSN = os.getenv("PG_DSN")
if not PG_DSN:
    PGHOST = os.getenv("PGHOST")
    PGUSER = os.getenv("PGUSER")
    PGPASSWORD = os.getenv("PGPASSWORD")
    PGPORT = int(os.getenv("PGPORT", 5432))
    PGDATABASE = os.getenv("PGDATABASE", "eoapi")

    if not (PGHOST and PGUSER and PGPASSWORD):
        raise ValueError("Must set either PG_DSN, or (PGHOST,PGUSER,PGPASSWORD)")

    PG_DSN = f"postgresql://{PGUSER}:{PGPASSWORD}@{PGHOST}:{PGPORT}/{PGDATABASE}"

COLLECTION = os.getenv("COLLECTION", "openaerialmap")
OUTPUT_GEOJSON = os.getenv("OUTPUT_GEOJSON", "/app/output/global-coverage.geojson")
OUTPUT_PMTILES = os.getenv("OUTPUT_PMTILES", "/app/output/global-coverage.pmtiles")
ZOOM_MIN = int(os.getenv("ZOOM_MIN", "0"))
ZOOM_MAX = int(os.getenv("ZOOM_MAX", "15"))

TEST_MODE = os.getenv("TEST_MODE", "").lower() in {"true", "1", "yes"}

BBOX: Tuple[float, float, float, float] = (
    (-20.0, 0.0, 10.0, 30.0)  # large test bbox
    if TEST_MODE
    else (-180.0, -85.05112878, 180.0, 85.05112878)
)


logging.basicConfig(
    stream=sys.stdout,
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s: %(message)s",
)
log = logging.getLogger("gen_mosaic")


def get_features() -> None:
    """
    Query PgSTAC for imagery features in BBOX and write them as newline-delimited GeoJSON.

    Returns:
        None. Writes OUTPUT_GEOJSON file for Tippecanoe ingestion.
    """
    where_bbox = "AND geometry && ST_MakeEnvelope(%s, %s, %s, %s, 4326)"
    params = [COLLECTION] + list(BBOX)

    query = f"""
        SELECT
            id::text AS id,
            ST_AsGeoJSON(geometry) AS geom
        FROM pgstac.items
        WHERE collection = %s
        {where_bbox}
        ORDER BY (content->>'datetime')::timestamptz DESC;
    """

    log.info(f"Querying PgSTAC for features (bbox={BBOX})...")
    row_count = 0
    try:
        with (
            connect(PG_DSN) as conn,
            conn.cursor() as cur,
            open(OUTPUT_GEOJSON, "w") as f,
        ):
            cur.execute(query, params)
            for row in cur:
                feature_id, geom_json = row
                if not geom_json:
                    continue
                try:
                    geom = json.loads(geom_json)
                    feature = {
                        "type": "Feature",
                        "geometry": geom,
                        "properties": {"id": feature_id},
                    }
                    f.write(json.dumps(feature))
                    f.write("\n")
                    row_count += 1
                except json.JSONDecodeError:
                    log.warning(f"Invalid geometry for {feature_id}, skipping.")
    except Exception as e:
        log.error(f"PgSTAC query failed: {e}")
        raise

    log.info(f"Wrote {row_count} features to {OUTPUT_GEOJSON}")


def geojson_to_pmtiles() -> None:
    """
    Use Tippecanoe to generate PMTiles from GeoJSON.
    """
    log.info("Generating vector tiles with tippecanoe...")
    try:
        subprocess.run(
            [
                "tippecanoe",
                "-o",
                OUTPUT_PMTILES,
                f"--minimum-zoom={ZOOM_MIN}",
                f"--maximum-zoom={ZOOM_MAX}",
                "--drop-densest-as-needed",
                OUTPUT_GEOJSON,
            ],
            check=True,
        )
    except subprocess.CalledProcessError as e:
        log.error(f"Tippecanoe failed with exit code {e.returncode}")
        raise
    log.info(f"PMTiles written to {OUTPUT_PMTILES}")


def upload_to_s3() -> None:
    """
    Upload the generated PMTiles to S3 (or S3-compatible) using MinIO client.
    Skips upload if required environment variables are not present.
    """
    endpoint = os.getenv("S3_ENDPOINT", "s3.amazonaws.com")
    bucket = os.getenv("S3_BUCKET", "oin-hotosm-temp")
    access_key = os.getenv("S3_ACCESS_KEY")
    secret_key = os.getenv("S3_SECRET_KEY")
    region = os.getenv("S3_REGION", "us-east-1")
    pmtiles_obj_key = Path(OUTPUT_PMTILES).name

    if not (access_key and secret_key):
        log.warning("S3 upload skipped: missing required env vars.")
        return

    client = Minio(
        endpoint,
        access_key=access_key,
        secret_key=secret_key,
        region=region,
        secure=True,
    )

    try:
        if not client.bucket_exists(bucket):
            log.error(f"Bucket {bucket} does not exist. Exiting upload.")
            return
    except S3Error as e:
        log.error(f"Error checking bucket: {e}")
        return

    log.info(f"Uploading {OUTPUT_PMTILES} to s3://{bucket}/{pmtiles_obj_key}")
    try:
        client.fput_object(
            bucket,
            pmtiles_obj_key,
            OUTPUT_PMTILES,
            content_type="application/vnd.pmtiles",
            metadata={"x-amz-acl": "public-read"},
        )
        log.info(f"Upload complete: s3://{bucket}/{pmtiles_obj_key}")
    except S3Error as e:
        log.error(f"S3 upload failed: {e}")


if __name__ == "__main__":
    log.info(f"Starting global coverage PMTiles generation (TEST_MODE={TEST_MODE})")

    if not Path(OUTPUT_PMTILES).exists():
        get_features()
        geojson_to_pmtiles()
    else:
        log.info(f"{OUTPUT_PMTILES} already exists, skipping generation.")

    upload_to_s3()
