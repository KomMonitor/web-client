# KomMonitor Web Client

This project is part of the [KomMonitor](http://kommonitor.de) spatial data infrastructure. As web client it acts as the main platform to display and analyze indicator and other georesource data of municipal interest, combine cartographic and statistical visualizations and offer exploration tools to gain insight within the scope of city planning.

## Quick Links And Further Information on KomMonitor
   - [DockerHub repositories of KomMonitor Stack](https://hub.docker.com/orgs/kommonitor/repositories)
   - [Github Repositories of KomMonitor Stack](https://github.com/KomMonitor)
   - [Github Wiki for KomMonitor Guidance and central Documentation](https://github.com/KomMonitor/KomMonitor-Docs/wiki)
   - [Technical Guidance](https://github.com/KomMonitor/KomMonitor-Docs/wiki/Technische-Dokumentation) and [Deployment Information](https://github.com/KomMonitor/KomMonitor-Docs/wiki/Setup-Guide) for complete KomMonitor stack on Github Wiki
   - [KomMonitor Website](https://kommonitor.de/)  


## Overview
This **Web client** is specially designed to consume the remaining components of the **KomMonitor spatial data infrastructure**, i.e. the [Data Management API](https://gitlab.fbg-hsbo.de/kommonitor/kommonitor-data-management-api) and [Processing Engine](https://gitlab.fbg-hsbo.de/kommonitor/kommonitor-script-execution-api) as well as **Reachability Service - e.g. Open Route Service** and **GeoServer**. With the scope of a spatial decision support system, it consumes the relevant municipal geospatial and statistical data for systematical display, exploration and analyzation. As described in section [Features](#features) dedicated tools are developed to support city planners and other employees of local authorities in their daily work.

The Web client is based on Angular and Bootstrap and hence uses a modular project structure for the implementation of the dedicated tools (i.e. map module for cartographic display; charting tools for bar, line or radar charts; etc...).

## Dependencies to other KomMonitor Components
KomMonitor Web client requires 
   - a running instance of KomMonitor **Data Management** for main data retrieval and data modification within administration pages    
   - a running instance of KomMonitor **Client Config Service** in order to fetch various config files on application startup (app parameters, keycloak connection, role-based element visibility settings) - if non provided/accessible the app will use default backup files stored at `app/config`
   - a running instance of KomMonitor **Importer** in order to perform spatial insert/update operation for *spatial-units*, *georesources* and *indicator data* via administration pages
   - a running instance of KomMonitor **Processing Engine** in order to query and trigger indicator computations 
   - a running instance of **Open Route Service**, where all KomMonitor-relevant data is managed. The database can be a docker container or an external database server reachable via URL.
   - an optional and configurable connection to a running **Keycloak** server, if role-based data access is activated via configuration of KomMonitor stack

## Features

The following non-exclusive list of features presents key features of the **KomMonitor Web Client**. Note that it is still under development, so some mentioned features are currently not implemented and the list might be extended in the future.

**<u>Key Features</u>**:

 - linked combination of cartographic and statistical display of indicators (i.e. hover over map features to highlight corresponding diagram elements and vice versa)
 - typical map interactions (pan, zoom, measure, search, etc.)
 - multiple diagrams to support indicator analysis
    - histogram chart for value distribution
    - bar chart for feature comparison
    - line chart for indicator time series display
    - radar chart for indicator comparison (create a "profile" for certain features)
    - scatter chart comparing all features of two indicators
    - maybe more in the future...
 - adjustable classification options for indicator display
 - add POIs (Points of Interest), LOIs (Lines of Interest), AOIs (Areas of Interest) to map
 - various filter techniques (spatial, attributive, value range, etc.)
 - balance computation regarding time series of indicators
 - reachability analysis
    - routing
    - distance and time isochrones
 - customizable indicator computation with individually set process parameters (i.e. change relevant radius of reachability indicator and compare result to "default" indicator)
 - export data
    - metadata
    - spatial data
    - statistical diagrams as image or get the actual values as data table.
 - ...       

## Exemplar docker-compose File with explanatory comments

Only contains subset of whole KomMonitor stack to focus on the config parameters of this component

```yml

version: '2.1'

networks:
  kommonitor:
      name: kommonitor

services:
  # web map client - main user interface of KomMonitor
    kommonitor-client:       
      image: 'kommonitor/web-client'
      container_name: kommonitor-client
      #restart: unless-stopped
      volumes:
       - ./app/config/config-storage-server.json:/usr/share/nginx/html/config/config-storage-server.json    # mount config for client-config-service 
      ports:
        - 8089:80
      networks:
       - kommonitor

    # simple REST service that stores and serves various config files for KomMonitor clients (i.e. web-client)   
    kommonitor-client-config:          
      image: 'kommonitor/client-config'
      container_name: kommonitor-client-config
      #restart: unless-stopped
      ports:
        - 8088:8088
      networks:
       - kommonitor 
      volumes:
       - client_config_storage:/code/configStorage        # persist web client config files on disk
      environment:
       - PORT=8088  

volumes:
 client_config_storage:


```

## Contact
|    Name   |   Organization    |    Mail    |
| :-------------: |:-------------:| :-----:|
| Christian Danowski-Buhren | Bochum University of Applied Sciences | christian.danowski-buhren@hs-bochum.de |
| Andreas Wytzisk  | Bochum University of Applied Sciences | Andreas-Wytzisk@hs-bochum.de |

## Credits and Contributing Organizations
- Department of Geodesy, Bochum University of Applied Sciences
- Department for Cadastre and Geoinformation, Essen
- Department for Geodata Management, Surveying, Cadastre and Housing Promotion, Mülheim an der Ruhr
- Department of Geography, Ruhr University of Bochum
- 52°North GmbH, Münster
- Kreis Recklinghausen
