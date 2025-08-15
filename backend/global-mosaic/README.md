# OpenAerialMap Global Mosaic

On a 24hr schedule:

- Generates global mosaic in PMTiles format, serving via S3.
- Also server TMS via a lightweight Martin server, for clients that
  don't support PMTiles.

## Getting Started

This project uses [uv](https://docs.astral.sh/uv/getting-started/installation/)
to manage Python dependencies.

Once `uv` is installed, you can install the dependencies by,

```bash
uv sync --all-groups
```

## Note On Various Scripts

The following `scripts` share a lot of code, and were developed iteratively:

- Attempt 1: `gen_mosaic_manual.py` - manually generate mosaics from COGs.
- Attempt 2: `gen_mosaic_hybrid.py` - hybrid coverage for zooms 0-10 + mosaic
  for zooms 11-14 (from TiTiler instance). This is similar to the approach from
  the original <https://github.com/konturio/oam-mosaic-map>, but uses our eoAPI
  pgstac and TiTiler instead.
- Attempt 3: `gen_coverage_raster.py` - simple grey coverage pixels indicating
  where we have imagery.
- Attempt 4: `gen_coverage_vector.py` - just use Tippecanoe for vector tiles 🤦‍♂️
  All the approaches above need significant memory optimisation to run on
  limited system resources / will require a bit more work. This approach
  is much more efficient and simple.

> [!NOTE]
> For coverage tiles there are two approaches:
>
> 1. Colour all pixels in the tile grey, meaning we massively reduce the
>    PMTiles size, due to internal tile deduplication.
> 2. Partially colour pixels where appropriate, giving a more accurate
>    representation of coverage (more space, but looks nicer).
>    The gen_mosaic_raster.py script currently does approach 2.

As of 2025-08-12 we are using `gen_coverage_vector.py` as the
simplest approach, and is well optimised C++ code
(low memory footprint). **It generates tiles for zooms 0-15**.

## Note On S3 Permissions

- There is an IAM policy `oam-bucket-upload` with permission to upload
  to the `oin-hotosm-temp` bucket.
  - We must ensure this policy also has `"s3:PutObjectAcl"` set, to allow
    setting the global-mosaic.pmtiles file permission to public.
- We have a user `hotosm-oam-global-mosaic-upload` that assigned this
  IAM policy, plus access/secret key for uploading to the bucket.

> [!NOTE]
> There are no doubt better ways to do this from EKS, but using key/secret
> pairs for access is pretty simple and transferable amongst providers,
> rather than being AWS specific.

## Development Testing

- See [doc for loading prod pgSTAC into development](../../docs/backup-prod-pgstac.md)
- Add a `.env` to this directory, with content:

  ```dotenv
  S3_ACCESS_KEY=KEY_FOR_OAM_BUCKET
  S3_SECRET_KEY=SECRET_FOR_OAM_BUCKET/zyalRchM+7
  ```

- Run the script:

  ```bash
  docker compose run --rm mosaicker
  ```
