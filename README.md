OpenAerialMap (OAM)
===

OpenAerialMap (OAM) is an open-source platform that provides a simple and open way to host, share, and access high-resolution aerial imagery from various sources, including satellites, drones, and other aircraft. The platform is designed to make it easier for humanitarian organizations, disaster response teams, and researchers to access and use aerial imagery for a wide range of applications, including disaster response, urban planning, environmental monitoring, and more.

## Getting Started
To get started with OpenAerialMap (OAM), you will need to install the OAM software on your computer or server. The easiest way to install OAM is to use Docker, which will handle all the dependencies and configurations for you.

### Installing OAM with Docker
To install OAM with Docker, follow these steps:

- Install Docker on your computer or server
You can download Docker from the official website: https://www.docker.com/get-started

- Clone the OAM repository from GitHub:

    `git clone https://github.com/hotosm/OpenAerialMap.git`
 
- Change into the OpenAerialMap directory:

    `cd OpenAerialMap`
    
- Build the Docker container:

    `docker-compose build`
    
- Start the Docker container:

    `docker-compose up`
  
Open your web browser and go to http://localhost:8080. You should see the OAM landing page.

## Repositories 

The following repositories are part of the OAM project:

| | |
| --- | --- |
| [oam-api](https://github.com/hotosm/oam-api) | Catalog for indexing open imagery | 
| [oam-browser](https://github.com/hotosm/oam-browser) | Imagery browser for searching available imagery |
| [oam-uploader](https://github.com/hotosm/oam-uploader) | The web frontend to the OAM Uploader API |
| [oam-uploader-api](https://github.com/hotosm/oam-uploader-api) | The OAM Uploader API server |
| [oam-docs](https://github.com/hotosm/oam-docs) | OAM Documentation |
| [openaerialmap.org](https://github.com/hotosm/openaerialmap.org) | Code for the OpenAerialMap.org Website |
| [oam-design-system](https://github.com/hotosm/oam-design-system) | Style guide and UI components library |


Repositories maintained outside of the HOT Github:

| | |
| --- | --- |
| [marblecutter-openaerialmap](https://github.com/mojodna/marblecutter-openaerialmap) | Python, Flask and Lambda-based dynamic tiler for S3-hosted GeoTIFFs |
| [oam-qgis-plugin](https://github.com/yojiyojiyoji/oam_qgis3_express) | An experimental plugin for QGIS v3 to access OAM |


### Deprecated repositories

| | |
| --- | --- |
| [oam-server](https://github.com/hotosm/oam-server) | Main repository for imagery processing and tile service creation tools |
| [oam-server-tiler](https://github.com/hotosm/oam-server-tiler) | OAM Server tile engine |
| [oam-server-activities](https://github.com/hotosm/oam-server-activities) | SWFR Activities component for OAM Server |
| [oam-server-decider](https://github.com/hotosm/oam-server-decider) | SWF Decider component of OAM Server (using oam-server-tiler instead) |
| [oam-server-api](https://github.com/hotosm/oam-server-api) | OAM Server API |
| [oam-server-cli](https://github.com/hotosm/oam-server-cli) | A command line utility for interacting with the OAM Server API |
| [oam-server-deployment](https://github.com/hotosm/oam-server-deployment) | Amazon Web Services deployment tooling OAM Server |
| [oam-server-publisher](https://github.com/hotosm/oam-server-publisher) | Status publishing component of OAM Server |
| [oam-catalog-grid](https://github.com/hotosm/oam-catalog-grid) | Generate a vector tile grid from the OAM catalog |
| [oam-browser-filters](https://github.com/hotosm/oam-browser-filters) | The grid filters used by the oam-browser front end |
| [oam-uploader-admin](https://github.com/hotosm/oam-uploader-admin) | OAM uploader admin interface |
| [oam-status](https://github.com/hotosm/oam-status) | A simple status dashboard for oam-catalog |
| [oam-dynamic-tiler](https://github.com/hotosm/oam-dynamic-tiler) | Python, Flask and Lambda-based dynamic tiler for S3-hosted GeoTIFFs
| [oam-qgis-plugin](https://github.com/hotosm/oam-qgis-plugin) | An experimental plugin for QGIS to access OAM |

## Getting Involved

There are plenty of ways to get involved in OpenAerialMap! First of all, if
you're new to the project and want to learn a bit more about its current
design and architecture, head over to the
[docs](http://docs.openaerialmap.org/) for an overview.

### Ideas, Issue and Discussions

The best place to jump into discussions about OpenAerialMap is on the main [issue
tracker](https://github.com/hotosm/OpenAerialMap/issues) or individual ones for repos listed above.

Ongoing and past converations about the project take place in the project's
[Gitter](https://gitter.im/hotosm/OpenAerialMap?) chat room, and periodic
updates go out on the [OAM-Talk mailing
list](https://groups.google.com/a/hotosm.org/forum/#!forum/openaerialmap).)

Please come join the discussion and share your ideas!

[![Join the chat at https://gitter.im/hotosm/OpenAerialMap](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/hotosm/OpenAerialMap?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)  

### Product Roadmap
We have included below a reference to OAM Product Roadmap [subject to change]. We hope it is a useful reference for anyone wanting to get involved.
![image](https://user-images.githubusercontent.com/98902727/218772260-a0d7d4cf-bd1b-46f1-83e3-d4ba44aeaf4d.png)

