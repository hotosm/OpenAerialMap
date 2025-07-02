# OpenAerialMap STAC API

This directory contains a customized version of the
[STAC FastAPI PgSTAC](https://github.com/stac-utils/stac-fastapi-pgstac)
for OpenAerialMap. The only customization so far is to disable the "transaction"
extension endpoints, but in the future this could enabled after adding in authorization
logic to enable adding, updating, or deleting STAC records for certain users.

## Getting Started

This project uses [uv](https://docs.astral.sh/uv/getting-started/installation/)
to manage Python dependencies.

Once `uv` is installed, you can install the dependencies by,

```bash
uv sync --all-groups
```

You can spin up the STAC FastAPI PgSTAC application using Docker Compose,

```bash
docker compose up app
```

Once the API is ready you can visit the OpenAPI documentation on your local
machine by visiting, <http://0.0.0.0:8082/api.html>.
