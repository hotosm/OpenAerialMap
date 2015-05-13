# Metadata Specification

This folder contains the specification of metadata that will be used for Open Imagery Network and OpenAerialMap.

A metadata file is required for each "image" file. An image file is an RGB GeoTIFF.

Below is a table of metadata values and where they would be required:

| Element       | Type         | Sample Value                                            | Description                                                                                           | OIN      | OAM      | Apply to TMS? |
|---------------|--------------|---------------------------------------------------------|-------------------------------------------------------------------------------------------------------|----------|----------|---------------|
| UUID          | URI          | http://bucket/file.tif                                  | Unique URI to file                                                                                    | Auto     | Auto     | Yes           |
| Title         | string       | San Diego 2015 orthomosaic                              | Human friendly title of the image                                                                     | Optional | Optional | Yes           |
| Projection    | string       | EPSG:4326                                               | CRS of the datasource in EPSG format                                                                  | Yes      | Yes      | Yes           |
| BBox          | string       | -180,-90,180,90                                         | Pair of min and max coordinates in CRS units, (min_x, min_y, max_x, max_y)                            | Yes?     | Yes      | Yes           |
| Footprint     | string (WKT) | POLYGON((-180 -90, -180 90, 180 90, 180 -90, -180 -90)) | Datasource footprint. WKT format, describing the actual footprint of the imagery                      | Yes?     | Yes      | Yes           |
| GSD           | double       | 0.35                                                    | Average ground spatial distance (resolution) of the datasource imagery, expressed in meters           | Yes      | Yes      | Yes           |
| File size     | double       | 1024                                                    | File size on disk in bytes                                                                            | Yes?     | Yes      | No            |
| License       | string       | Nextview                                                | Usage license of the datasource. This determines visibility of the datasource for authenticated users | No       | Yes      | Yes           |
| Sense Start   | Date         | 2015-05-03T13:00:00.000                                 | First date of acquisition in UTC (Combined date and time representation)                              | Yes      | Yes      |               |
| Sense End     | Date         | 2015-05-04T13:00:00.000                                 | Last date of acquisition in UTC (Combined date and time representation)                               | Yes      | Yes      |               |
| Platform      | string       | Satellite                                               | List of possible platform sources limited to satellite, aircraft, UAV, balloon, kite                  | Yes      | Yes      |               |
| Sensor        | string       | WV-3                                                    | How the data was collected? (image aquisition device... camera, radar, ...)                           | Optional | Yes      |               |
| Tags          | string       | #nepal_earthquake_2015                                  | Any user provided tag                                                                                 | No       | Optional | Yes           |
| Provider      | string       | Digital Globe                                           | Provider/owner of the OIN bucket                                                                      | No       | Yes      | Yes           |
| Contact Email | string       | contact@email.com                                       | Name and email address of the data provider                                                           | Yes      | Yes      | Yes           |
