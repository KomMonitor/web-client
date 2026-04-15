# KomMonitor Web Client

This project is part of the [KomMonitor](http://kommonitor.de) spatial data infrastructure. As web client it acts as the main platform to display and analyze indicator and other georesource data of municipal interest, combine cartographic and statistical visualizations and offer exploration tools to gain insight within the scope of city planning.

**Table of Content**

<!-- TOC depthFrom:1 depthTo:6 withLinks:1 updateOnSave:0 orderedList:0 -->

- [KomMonitor Web Client](#kommonitor-web-client)
  - [Quick Links And Further Information on KomMonitor](#quick-links-and-further-information-on-kommonitor)
  - [Overview](#overview)
  - [Dependencies to other KomMonitor Components](#dependencies-to-other-kommonitor-components)
  - [Features](#features)
  - [Installation / Building Information](#installation--building-information)
    - [Configuration](#configuration)
      - [`/app/config/config-storage-server.json`](#appconfigconfig-storage-serverjson)
      - [`/app/config/env_backup.js` - Backup Configuration of Deployment Details of other Services and App Properties](#appconfigenv_backupjs---backup-configuration-of-deployment-details-of-other-services-and-app-properties)
      - [`/app/config/keycloak_backup.json` - Backup Configuration of Keycloak Connection (only relevant when role-based Data Access via Keycloak is enabled)](#appconfigkeycloak_backupjson---backup-configuration-of-keycloak-connection-only-relevant-when-role-based-data-access-via-keycloak-is-enabled)
      - [`/app/config/controls-config_backup.json` - Backup Configuration of role-based Element Visibility (only relevant when role-based Data Access via Keycloak is enabled)](#appconfigcontrols-config_backupjson---backup-configuration-of-role-based-element-visibility-only-relevant-when-role-based-data-access-via-keycloak-is-enabled)
    - [Running the NodeJS KomMonitor Web Client](#running-the-nodejs-kommonitor-web-client)
      - [Local Manual Startup and Shutdown](#local-manual-startup-and-shutdown)
      - [Production Startup and Shutdown](#production-startup-and-shutdown)
    - [Docker](#docker)
  - [Exemplar docker-compose File with explanatory comments](#exemplar-docker-compose-file-with-explanatory-comments)
  - [User Guide](#user-guide)
  - [Contribution - Developer Information](#contribution---developer-information)
    - [How to Contribute](#how-to-contribute)
    - [Hints on how to integrate a new Module](#hints-on-how-to-integrate-a-new-module)
    - [Branching](#branching)
  - [Third Party Dependencies](#third-party-dependencies)
  - [Contact](#contact)
  - [Credits and Contributing Organizations](#credits-and-contributing-organizations)

<!-- /TOC -->

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
   - a running instance of **Open Route Service** in oder to compute on-the-fly isochrone and routing computations.
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

## Installation / Building Information
Currently a combination of `npm`, `webpack` and `grunt` is used to build the Angular-based application.

`NOTE: THIS SHOULD BE CHANGED IN THE FUTURE TO ONLY USE ONE BUILD TOOL.`

In short, after downloading the project you should run the following command in that order from project root (you must have `git` installed to fetch all required dependencies):

1. The easiest way to build the client for production usage within one command is `npm run build`. This performs all susequently listed steps as a sequence (`npm install --force && webpack && grunt`)

of course you could perform each step individually, as follows:

1. `npm install` to fetch all required node modules.
2. `webpack` or `npx webpack` (depending on you system environment) to copy used libraries into `./app/dependencies`, from where they will be linked in `./app/index.html`
3. `grunt` to bundle and minify app script code and create a ready-to-deploy `./dist`, which you can simply copy into any application server like Tomcat.
4. (optional) `grunt buildWar` to perform the same as in step 3. but in addition create a `./build/kommonitor-webclient.WAR` WAR file for deployment in a web application server.

Even Docker images can be acquired with ease, as described below. However, depending on your environment configuration aspects have to be adjusted first.

### Configuration
Similar to other **KomMonitor** components, some settings are required, especially to adjust connection details to other linked services to your local environment. KomMonitor Web Client uses a separate **Client Config Service** to retrieve config parameters on startup. The connection to this service as well as backup config files if the service cannot be reached are located at `/app/config`.

#### `/app/config/config-storage-server.json`
Config file to set the connection to the **Client Config Service** component, from which the subsequent config files are fetched. I.e. in local setup the file has following content (administration pages also allow dynamic modification of the config parameters):

```json
{
    "targetUrlToConfigStorageServer_appConfig" : "http://localhost:8088/config/client-app-config",
    "targetUrlToConfigStorageServer_keycloakConfig" : "http://localhost:8088/config/client-keycloak-config",
    "targetUrlToConfigStorageServer_controlsConfig" : "http://localhost:8088/config/client-controls-config"
}

```

#### `/app/config/env_backup.js` - Backup Configuration of Deployment Details of other Services and App Properties
The main app configuration file is located at [app/config/env_backup.js](./app/config/env_backup.js). The same structure is returned by **Client Config Service** on app startup. So once the previously described `/app/config/config-storage-server.json` is configured, the administration pages of KomMonitor web client allow dynamic modification of the application config files. The most important parameters to setup the connection to other components of the KomMonitor stack are:

- customization of upper left header logo and greetings information

```javascript

  /*
  PROPERTIES used within greetings window (infoModal component)
  to insert custom LOGO by URL with custom width
  and adjust individual information text
  as well as contact information
  */
 window.__env.customLogoURL = "https://eabg.essen.de/ueber-uns/unsere-partner/logo-stadt-essen.jpg"; // image format allows all types usable within HTML <img> tag
 window.__env.customLogo_onClickURL = "https://www.essen.de/"; // uses <a> tag to insert clickable link on logo
 window.__env.customLogoWidth = "35px"; // height is fixed to 35px; so adjust your custom width to keep aspect ratio
 window.__env.customGreetingsContact_name = "Christian Danowski-Buhren";
 window.__env.customGreetingsContact_organisation = "Hochschule Bochum, Fachbereich Geod&auml;sie";
 window.__env.customGreetingsContact_mail = "christian.danowski-buhren@hs-bochum.de";
 window.__env.customGreetingsTextInfoMessage = ""; // as HTML; only set if you want to give users some extra hints; if empty will be ignored

```

- connection to KomMonitor Data Management API:
```javascript

  // enable/disable role based access using keycloak
  window.__env.enableKeycloakSecurity = false;

  // encrypted data transfer from Data Management API settings
  window.__env.encryption = {
    enabled: false,
    password: "password", // this is shared secret between all components (hence must be set to the exact same value for all participating components)
    ivLength_byte: 16
  };

  // admin user credentials to log into admin view in No-Keycloak-Settings
  window.__env.adminUserName = "Admin";
  window.__env.adminPassword = "kmAdmin";

  // property names of feature id and name (relevant for all spatial features) - KomMonitor specific
  // DO NOT CHANGE THEM - ONLY IF YOU REALLY KNOW WHAT YOU ARE DOING
  window.__env.FEATURE_ID_PROPERTY_NAME = "ID";
  window.__env.FEATURE_NAME_PROPERTY_NAME = "NAME";
  window.__env.VALID_START_DATE_PROPERTY_NAME = "validStartDate";
  window.__env.VALID_END_DATE_PROPERTY_NAME = "validEndDate";
  window.__env.indicatorDatePrefix = "DATE_";

  // Data Management API URL
  // window.__env.apiUrl = 'http://kommonitor.fbg-hsbo.de/';
  window.__env.apiUrl = 'http://localhost:8085/';
  // Base url for Data Management API
  window.__env.basePath = 'management';


  // Open Route Service URL
  window.__env.targetUrlToReachabilityService_ORS = 'https://ors5.fbg-hsbo.de';

  // Data Imporret URL
  window.__env.targetUrlToImporterService = 'http://localhost:8087/importer/';


```

The config file contains many more items that are explained by comments within the source file [app/config/env_backup.js](./app/config/env_backup.js). Please study it's content for any more information.

#### `/app/config/keycloak_backup.json` - Backup Configuration of Keycloak Connection (only relevant when role-based Data Access via Keycloak is enabled)
Connection parameters to running Keycloak server are stored in the file [app/config/keycloak_backup.json](./app/config/keycloak_backup.json). It contains the following items (here described via comments for explanatory purposes; note that JSON does not allow comments)

```json

{ // COMMENTS NOT ALLOWED IN JSON, BUT USED HERE TO EXPLAIN PROPERTIES
  "realm": "kommonitor", // Keycloak Realm name used for all KomMonitor components
  "auth-server-url": "https://keycloak.url/auth/", // keycloak server URL inluding "/auth/"
  "ssl-required": "external",  // SSL Setting, leave it to "external"
  "resource": "kommonitor-web-client",  // Keycloak resource/client name within upper realm
  "public-client": true, // Keycloak setting that client itself does not require authentication to access page
  "confidential-port": 0 // Keycloak setting that should not be modifed
}

```

#### `/app/config/controls-config_backup.json` - Backup Configuration of role-based Element Visibility (only relevant when role-based Data Access via Keycloak is enabled)
In a Keycloak-active setup of KomMonitor, certain app elements can be configured to only appear if logged-in users have certain roles. This mapping between HTML element IDs and allowed roles is specifed in the file [app/config/controls-config_backup.json](./app/config/controls-config_backup.json). It contains the following exemplar items demonstrating the basic mechanism. The actual file might include more mapping items (here described via comments for explanatory purposes; note that JSON does not allow comments)

```json

[
    {
        "id": "indicatorConfig",   // HTML element id (here left-handed sidebar indicator data catalog)
        "roles": []  // empty array of roles --> no access restrictions; everyone can see it including anonymous user
    },
    {
        "id": "poi",
        "roles": ["internalRole1", "internalRole2"]   // as soon as any rolename is set in roles array the element is only visible to users with at leat one of the specified roles 
    },
    {
        "id": "dataImport",
        "roles": []
    }
    
	// more items exist in actual file but are omitted here
]

```

After adjusting the configuration to your target environment, you may continue to build and run the service as described below.

### Running the NodeJS KomMonitor Web Client

#### Local Manual Startup and Shutdown
In a local setup (i.e. for test purposes), you only must ensure that all dependencies are installed and put where expected. Hence, only the two first installation steps from above must be run:

1. `npm install` to fetch all required node modules.
2. `webpack` or `npx webpack` (depending on you system environment) to copy used libraries into `./app/dependencies`, from where they will be linked in `./app/index.html`

To locally start the app, simply navigate to project root and execute `npm start`, which will host the app at `localhost:8000` (<u>of course you must ensure, that the associated remaining KomMonitor components - Data Management API, Processing Engine, Open Route Service and optional GeoServer - are setup and started also</u>).
In this test environment, changes to the underlying sources are automatically reflected to the running test instance. So any tests or modifications can be tested locally before building the app for production. To shutdown simply hit `CTRL+c` in the terminal.

#### Production Startup and Shutdown

As described above the following steps must be executed to build the project completely:

1. `npm install` to fetch all required node modules.
2. `webpack` or `npx webpack` (depending on you system environment) to copy used libraries into `./app/dependencies`, from where they will be linked in `./app/index.html`
3. `grunt` to bundle and minify app script code and create a ready-to-deploy `./dist`, which you can simply copy into any application server like Tomcat.
4. (optional) `grunt buildWar` to perform the same as in step 3. but in addition create a `./build/kommonitor-webclient.WAR` WAR file for deployment in a web application server.

Either the `dist` folder with all its contents or the `build/kommonitor-webclient.WAR` file can then be deployed using a standard web application server like Tomcat.
Assuming the WAR file is named `kommonitor-webclient.WAR` and Tomcat is started locally on port 8080, you may reach the web app via `localhost:8080/kommonitor-webclient`.

### Docker
The **KomMonitor Web Client** can also be build and deployed as Docker image (i.e. `docker build -t kommonitor/web-client:latest .`). The project contains the associated `Dockerfile` and an exemplar `docker-compose.yml` on project root level.

The exemplar [docker-compose.yml](./docker-compose.yml) file specifies only the `kommonitor-client` service and `kommonitor-client-config` service as all required connections to the respective components of KomMonitor are configured in `./app/config/env_backup.js` (connection details to other services etc. according to the [Configuration section](#configuration) mentioned above).

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

## User Guide
The User Guide is written in a separate [ReadMe](./documentation/README.md).

## Contribution - Developer Information
This section contains information for developers.

### How to Contribute
The technical lead of the whole [KomMonitor](http://kommonitor.de) spatial data infrastructure currently lies at the Bochum University of Applied Sciences, Department of Geodesy. We invite you to participate in the project and in the software development process. If you are interested, please contact any of the persons listed in the [Contact section](#contact)

### Hints on how to integrate a new Module
TODO

Things to mention:
- hierarchical code structure
   - put new module where it is integrated within the application
- how to write module, controller and template
- how to take care of dependency injection (inject angular-internal modules as well as other depending app modules in new module; inject new module in HTML and module of superior module where it shall be placed)   
- add new codefiles to build tools etc. (beware of order of integration with regard to what module depends on what other module etc.)
- how to add new libraries and integrate them to build tools
- ...

`MAYBE AS SEPARATE DOCUMENTATION TO KEEP THIS README SHORT`

### Branching
The `master` branch contains latest stable releases. The `develop` branch is the main development branch that will be merged into the `master` branch from time to time. Any other branch focuses certain bug fixes or feature requests.

## Third Party Dependencies
We use [license-checker](https://www.npmjs.com/package/license-checker) to gain insight about used third party libs. I.e. install globally via ```npm install -g license-checker```, navigate to root of the project and then perform ```license-checker --json --out ThirdParty.json``` to create/overwrite the respective file in JSON format.

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
