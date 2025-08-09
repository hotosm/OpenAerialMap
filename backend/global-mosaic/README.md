# OpenAerialMap Global Mosaic

On a 24hr schedule:

- Generates global mosaic tiles at zoom levels 1-9 from TiTiler.
- Save and package as PMTiles.
- Make the PMTiles accessible via S3.
- Serve TMS via lightweight Martin server, for clients that don't support PMTiles.

## Getting Started

This project uses [uv](https://docs.astral.sh/uv/getting-started/installation/)
to manage Python dependencies.

Once `uv` is installed, you can install the dependencies by,

```bash
uv sync --all-groups
```
