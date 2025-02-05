# OpenAerialMap

[![License](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](https://opensource.org/licenses/BSD-2-Clause)

## Introduction

OpenAerialMap (OAM) is the largest public repository of openly licensed high-resolution satellite and drone imagery, fostering a community dedicated to improving access to critical geospatial data. OAM provides a simple, sustainable, and scalable platform for hosting, sharing, and discovering imagery, empowering humanitarian responders, disaster preparedness efforts, and countless other applications.

## Goals

*   Provide a **centralized platform** for accessing openly licensed satellite and aerial imagery.
*   **Simplify the discovery** of imagery through a user-friendly interface and API.
*   Allow contributors to **easily upload and share** their imagery.
*   **Enable collaboration** among organizations and individuals working with aerial imagery.
*   **Ensure long-term sustainability** through a distributed and scalable architecture.
*   **Promote the use of open imagery** for mapping in OpenStreetMap.

## Features

*   **Search and Discovery:** Easily find imagery based on location, date, sensor, provider, and other metadata.
*   **API:** Access imagery and metadata through a standardized API.
*   **Data Upload:** Contribute your own openly licensed imagery to the platform.
*   **Tiling Services:** Efficiently visualize large imagery datasets using dynamic tiling.
*   **Open Source:** The entire platform is built with open-source technologies and is available for community contributions.

## Technology Stack

OAM is built on a cloud-native architecture leveraging the following technologies:

*   **Backend:** Node.js, MongoDB
*   **Frontend:** React, Redux, Mapbox GL JS
*   **Infrastructure:** AWS (including S3, EC2, Batch, Lambda)
*   **COG (Cloud Optimized GeoTIFF):** For efficient imagery storage and access

Please note: The aging OAM system presents increasing maintenance challenges due to its outdated design and technology. This impacts system reliability and maintainability. HOT and its partners are actively pursuing resources to modernize OAM.

## Current Status

In December 2024, HOT received a Cisco CyberGrant to modernize OAM.  This grant will fund the upgrading to a fully STAC-compliant architecture, improving scalability, interoperability, and maintainability.

**Key planned efforts include:**

*   Migrating the existing metadata database to a STAC catalog.
*   Developing a new STAC-based API.
*   Rebuilding the frontend to interact with the new API.
*   Updating the documentation.

**Future improvements will focus on:**
*   Improving the upload and processing pipeline.
*   Integrating OAM with other imagery processing software.
*   Supporting other imagery formats and raster data types (e.g. DTMs, DSMs, multispectral imagery, etc).

## Roadmap

<!-- prettier-ignore-start -->
| Status | Feature |
|:--:| :-- |
|⚙️| Implement STAC API |
|⚙️| Migrate existing imagery to STAC |
|⚙️| Implement tiling services with TiTiler |
| | Frontend rebuild using new STAC based API |
| | 📢 Release of new STAC based API and frontend |
| | Documentation updates |
| | Testing and training |
| | Revamped uploader and uploader API |
| | New user management system |
| | Improved statistics and user engagement |
| | Add support for other EO data |

<!-- prettier-ignore-end -->

## How to Contribute

We welcome contributions from the community! There are many ways to get involved:

*   **Code Contributions:** Help us develop new features, improve existing code, and fix bugs.
*   **Documentation:** Improve the [documentation](https://docs.openaerialmap.org/ecosystem/) to make it easier for others to use and contribute to OAM.
*   **Testing:** Help us test the platform and report any issues you find.
*   **Feedback:** Share your ideas and suggestions for improving OAM.
*   **Imagery Contribution:** Share your openly licensed imagery through the [OAM uploader](https://map.openaerialmap.org/#/upload?).

The best place to jump into discussions about OpenAerialMap is on the [main issue tracker](https://github.com/hotosm/OpenAerialMap/issues) or individual ones for repos listed below.

Ongoing and past converations about the project take place in the OpenAerialMap Slack channel at https://slack.hotosm.org

## Getting Started

*   **Website:** [www.openaerialmap.org](https://openaerialmap.org/)
*   **Documentation:** [docs.openaerialmap.org](https://docs.openaerialmap.org/ecosystem/)
*   **Source Code:** active and archived [repositories](https://github.com/orgs/hotosm/repositories?language=&q=oam&sort=&type=all) part of OAM

## License

The OAM software is licensed under the BSD 2-Clause License, unless otherwise specified.

All imagery is publicly licensed and made available through the Humanitarian OpenStreetMap Team's [Open Imagery Network](https://openimagerynetwork.github.io/) (OIN) Node. All imagery contained in OIN is licensed CC-BY 4.0, with attribution as contributors of Open Imagery Network. All imagery is available to be traced in OpenStreetMap.

## Contact

*   **Slack:** #OpenAerialMap and #oam-dev on the [HOT Slack](https://slack.hotosm.org)
*   **Email:** info [at] openaerialmap.org

  
## Acknowledgements

OAM is a project of the [Humanitarian OpenStreetMap Team (HOT)](https://www.hotosm.org/) and is developed in collaboration with [Development Seed](https://developmentseed.org/), [Kontur](https://www.kontur.io/) and other [partners](https://openaerialmap.org/about/). Imagery is hosted on the [AWS Open Data Program](https://aws.amazon.com/opendata). We gratefully acknowledge the support of our funders and contributors.
