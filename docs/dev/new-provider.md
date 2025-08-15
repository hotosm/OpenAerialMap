# Adding a new data provider

This document walks through the process of adding a new data provider to the HOT
OpenAerialMap (HOT OAM) STAC Catalog.

## Creating STAC items

The code to create STAC items for the OpenAerialMap STAC Catalog lives in
[stactools-hotosm](https://github.com/hotosm/stactools-hotosm/). For an example
of creating HOT OAM STAC item from existing Maxar items, see [this
file](https://github.com/hotosm/stactools-hotosm/blob/main/src/stactools/hotosm/maxar/stac.py).
Create a new branch, create a new directory for your provider, and write the
code. Be sure to include tests. When it's ready, open a pull request (PR) with
your changes.

See the [stactools-hotosm
README](https://github.com/hotosm/stactools-hotosm/blob/main/README.md) for
more.

## Add ingestion

Create a PR on [hotosm/k8s-infra](https://github.com/hotosm/k8s-infra/pulls)
to add a new
[manifest](https://github.com/hotosm/k8s-infra/tree/main/kubernetes/manifests)
that syncs your data on a schedule.
See
[sync-maxar](https://github.com/hotosm/k8s-infra/blob/main/kubernetes/manifests/sync-maxar.yaml)
for a representative example.
