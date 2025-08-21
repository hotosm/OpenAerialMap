# Global TMS Service

- For clients that can use the PMTiles global coverage from
  generated from the `global-mosaic` directory, this is the
  most efficient.
- For clients that can't, e.g. QGIS etc, we should:
  - z0-15: use maptiler/tileserver-gl tile server to serve a TMS of rendered
    raster tiles (including styling) from the PMTiles.
  - z16+: switch to TiTiler for these zooms levels.
  - Also offer a Martin tile server, for a vector tiles TMS from the
    same PMTiles source (e.g. for QGIS)

This directory contains test configuration for doing this behind an
Nginx proxy, with URL routing.

In production, the set for this would be bundled with eoAPI in the
[Kubernetes cluster](https://github.com/hotosm/k8s-info)
