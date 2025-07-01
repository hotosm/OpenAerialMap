# OpenAerialMap STAC API

This directory contains a customized version of the
[STAC FastAPI PgSTAC](https://github.com/stac-utils/stac-fastapi-pgstac)
for OpenAerialMap.

## Getting Started

This project uses [uv](https://docs.astral.sh/uv/getting-started/installation/) to manage Python
dependencies.

You can spin up the STAC FastAPI PgSTAC application using Docker Compose,
```
docker compose up app
```

Once the API is ready you can visit the OpenAPI documentation on your local machine by visiting
<http://0.0.0.0:8082/api.html>.
