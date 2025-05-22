# Adding a new data provider

This document walks through the process of adding a new data provider to the HOT OpenAerialMap (HOT OAM) STAC Catalog.
At a high level:

1. Write the code to [create STAC items](https://github.com/hotosm/stactools-hotosm/)
2. Create an ingestion lambda
3. Set up a "cronjob" to run the lambda on regular intervals

## Creating STAC items

The code to create STAC items for the OpenAerialMap STAC Catalog lives in [stactools-hotosm](https://github.com/hotosm/stactools-hotosm/).
For an example of creating HOT OAM STAC item from existing Maxar items, see [this script](https://github.com/hotosm/stactools-hotosm/blob/main/src/stactools/hotosm/maxar/stac.py).
Create a new branch, create a new directory for your provider, and write the code.
Be sure to include tests.
When it's ready, open a pull request (PR) with your changes.

See the [stactools-hotosm README](https://github.com/hotosm/stactools-hotosm/blob/main/README.md) for more.

## Create an ingestion lambda

TODO (<https://github.com/hotosm/OpenAerialMap/issues/182>)

## Set up a "cronjob"

TODO (<https://github.com/hotosm/OpenAerialMap/issues/182>)
