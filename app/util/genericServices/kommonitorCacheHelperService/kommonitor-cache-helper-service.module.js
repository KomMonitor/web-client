angular.module('kommonitorCacheHelper', []);

/**
 * a common serviceInstance that holds all needed properties for a WPS service.
 *
 * This service represents a shared object ´which is used across the different
 * application tabs/components like Setup, Capabilities, Execute etc.
 *
 * This way, one single service instance can be used to easily share values and
 * parameters for each WPS operation represented by different Angular components
 */
angular
  .module('kommonitorCacheHelper', [])
  .service(
    'kommonitorCacheHelperService', ['$http', '__env', 'Auth',
    function ($http, __env, Auth) {

      this.lastDatabaseModificationInfo;
      this.baseUrlToKomMonitorDataAPI = __env.apiUrl + __env.basePath;
      let self = this;

      const localStorageKey_prefix = __env.localStoragePrefix;

      const localStorageKey_accessControl = localStorageKey_prefix + "_lastModification_accessControl";
      const localStorageKey_topics = localStorageKey_prefix + "_lastModification_topics";
      const localStorageKey_spatialUnits = localStorageKey_prefix + "_lastModification_spatialUnits";
      const localStorageKey_georesources = localStorageKey_prefix + "_lastModification_georesources";
      const localStorageKey_indicators = localStorageKey_prefix + "_lastModification_indicators";
      const localStorageKey_processScripts = localStorageKey_prefix + "_lastModification_processScripts";

      const georesourcesPublicEndpoint = "/public/georesources";
      const georesourcesProtectedEndpoint = "/georesources";
      const spatialUnitsPublicEndpoint = "/public/spatial-units";
      const spatialUnitsProtectedEndpoint = "/spatial-units";
      const indicatorsPublicEndpoint = "/public/indicators";
      const indicatorsProtectedEndpoint = "/indicators";
      const scriptsPublicEndpoint = "/public/process-scripts";
      const scriptsProtectedEndpoint = "/process-scripts";
      const topicsPublicEndpoint = "/public/topics";
      // only resource that has no public endpoint
      const accessControlEndpoint = "/organizationalUnits";

      var georesourcesEndpoint = georesourcesProtectedEndpoint;
      var spatialUnitsEndpoint = spatialUnitsProtectedEndpoint;
      var indicatorsEndpoint = indicatorsProtectedEndpoint;
      var scriptsEndpoint = scriptsProtectedEndpoint;
      this.spatialResourceGETUrlPath_forAuthentication = "/public";

      this.checkAuthentication = function () {
        if (Auth.keycloak.authenticated) {
          georesourcesEndpoint = georesourcesProtectedEndpoint;
          spatialUnitsEndpoint = spatialUnitsProtectedEndpoint;
          indicatorsEndpoint = indicatorsProtectedEndpoint;
          scriptsEndpoint = scriptsProtectedEndpoint;
          this.spatialResourceGETUrlPath_forAuthentication = "";
        } else {
          georesourcesEndpoint = georesourcesPublicEndpoint;
          spatialUnitsEndpoint = spatialUnitsPublicEndpoint;
          indicatorsEndpoint = indicatorsPublicEndpoint;
          scriptsEndpoint = scriptsPublicEndpoint;
          this.spatialResourceGETUrlPath_forAuthentication = "/public";
        }

      };

      this.fetchLastDatabaseModificationObject = async function () {
        await $http({
          url: this.baseUrlToKomMonitorDataAPI + "/public/database/last-modification",
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          self.lastDatabaseModificationInfo = response.data;

        });
      };

      this.fetchResource_fromCacheOrServer = async function (localStorageKey, resourceEndpoint, lastModificationResourceName, keycloakRolesArray, filter) {
        // check if the last modification date within local storage is the same as on the server

        // if YES, then try to use data from cache

        // else set new last modification date, fetch data from server and set that also within localStorage

        await this.fetchLastDatabaseModificationObject();

        let timestampKey = localStorageKey + "_timestamp";
        let metadataKey = localStorageKey + "_metadata";

        //TODO: why do we need this? There is ever only a single rolesArray why do we need to differentiate between different roles?
        
        if(keycloakRolesArray && keycloakRolesArray.length > 0){
          // admin role is kommonitor-creator
          if(keycloakRolesArray.includes(__env.keycloakKomMonitorAdminRoleName)){
            metadataKey += "_" + __env.keycloakKomMonitorAdminRoleName;
            timestampKey += "_" + __env.keycloakKomMonitorAdminRoleName;
          }
          else{
            metadataKey += "_" + JSON.stringify(keycloakRolesArray);
            timestampKey += "_" + JSON.stringify(keycloakRolesArray);
          }
        }
        else{
          metadataKey += "_public";
          timestampKey += "_public";
        }
        

        let lastModTimestamp_fromCache_string = localStorage.getItem(timestampKey);

        if (lastModTimestamp_fromCache_string && !filter) {
          let lastModTimestamp_fromCache = JSON.parse(lastModTimestamp_fromCache_string);

          if (lastModTimestamp_fromCache) {

            let lastModTimestamp_fromServer = this.lastDatabaseModificationInfo[lastModificationResourceName];

            if (lastModTimestamp_fromCache == lastModTimestamp_fromServer) {
              let storageObject_string = localStorage.getItem(metadataKey);

              if (storageObject_string) {
                let storageObject = JSON.parse(storageObject_string);
                return storageObject;
              }
            }
          }
        }


        if(filter) {
          return await $http({
            url: this.baseUrlToKomMonitorDataAPI + resourceEndpoint + '/filter',
            method: "POST",
            data: filter,
            headers: {
              'Content-Type': "application/json"
            }
          }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
          });
        } else {
          // when code reaches this place we must overwrite/set timestamp and actual metadata

          // persist last modification timestamp object as String in local storage
          localStorage.setItem(timestampKey, JSON.stringify(this.lastDatabaseModificationInfo[lastModificationResourceName]));

          return await $http({
            url: this.baseUrlToKomMonitorDataAPI + resourceEndpoint,
            method: "GET"
          }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            localStorage.setItem(metadataKey, JSON.stringify(response.data));
  
            return response.data;
          }, function errorCallback(error) {
            console.log("Unable to read OrgainzationalUnit data");
            return [];
        });
        }
      };

      this.fetchAccessControlMetadata = async function (keycloakRolesArray) {
        return await this.fetchResource_fromCacheOrServer(localStorageKey_accessControl, accessControlEndpoint, "access-control", keycloakRolesArray);
      };

      this.fetchTopicsMetadata = async function (keycloakRolesArray) {
        return await this.fetchResource_fromCacheOrServer(localStorageKey_topics, topicsPublicEndpoint, "topics", keycloakRolesArray);
      };

      this.fetchSpatialUnitsMetadata = async function (keycloakRolesArray) {
        return await this.fetchResource_fromCacheOrServer(localStorageKey_spatialUnits, spatialUnitsEndpoint, "spatial-units", keycloakRolesArray);
      };

      this.fetchIndicatorsMetadata = async function (keycloakRolesArray, filter) {
        if (filter) {
          const filterBody = {
            topicIds: filter.indicatorTopics,
            ids: filter.indicators
          } 
          return await this.fetchResource_fromCacheOrServer(localStorageKey_indicators, indicatorsEndpoint, "indicators", keycloakRolesArray, filterBody);
        } else {
          return await this.fetchResource_fromCacheOrServer(localStorageKey_indicators, indicatorsEndpoint, "indicators", keycloakRolesArray);
        }
        
      };

      this.fetchGeoresourceMetadata = async function (keycloakRolesArray, filter) {
        if (filter) {
          const filterBody = {
            topicIds: filter.georesourceTopics,
            ids: filter.georesources
          } 
          return await this.fetchResource_fromCacheOrServer(localStorageKey_georesources, georesourcesEndpoint, "georesources", keycloakRolesArray, filterBody);
        } else {
          return await this.fetchResource_fromCacheOrServer(localStorageKey_georesources, georesourcesEndpoint, "georesources", keycloakRolesArray);
        }
      };

      this.fetchProcessScriptsMetadata = async function (keycloakRolesArray) {
        return await this.fetchResource_fromCacheOrServer(localStorageKey_processScripts, scriptsEndpoint, "process-scripts", keycloakRolesArray);
      };

      this.fetchSingleAccessControlMetadata = function (targetId, keycloakRolesArray) {
        return $http({
          url: this.baseUrlToKomMonitorDataAPI + accessControlEndpoint + "/" + targetId,
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          // let cache be checked, but in the background, do not wait for it
          self.fetchAccessControlMetadata(keycloakRolesArray);
          return response.data;
        });
      };

      this.fetchSingleSpatialUnitMetadata = function (targetSpatialUnitId, keycloakRolesArray) {
        return $http({
          url: this.baseUrlToKomMonitorDataAPI + spatialUnitsEndpoint + "/" + targetSpatialUnitId,
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          self.fetchSpatialUnitsMetadata(keycloakRolesArray);
          return response.data;

        });
      };

      this.fetchSingleGeoresourceMetadata = function (targetGeoresourceId, keycloakRolesArray) {
        return $http({
          url: this.baseUrlToKomMonitorDataAPI + georesourcesEndpoint + "/" + targetGeoresourceId,
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          self.fetchGeoresourceMetadata(keycloakRolesArray);
          return response.data;

        });
      };

      this.fetchSingleIndicatorMetadata = function (targetIndicatorId, keycloakRolesArray) {
        return $http({
          url: this.baseUrlToKomMonitorDataAPI + indicatorsEndpoint + "/" + targetIndicatorId,
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          self.fetchIndicatorsMetadata(keycloakRolesArray);
          return response.data;

        });
      };

      this.fetchSingleIndicatorScriptMetadata = function (targetScriptId, keycloakRolesArray) {
        return $http({
          url: this.baseUrlToKomMonitorDataAPI + scriptsEndpoint + "/" + targetScriptId,
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available

          self.fetchProcessScriptsMetadata(keycloakRolesArray);
          return response.data;

        });
      };

      this.fetchSingleGeoresourceSchema = function (targetGeoresourceId) {
        return $http({
          url: this.baseUrlToKomMonitorDataAPI + georesourcesEndpoint + "/" + targetGeoresourceId + "/schema",
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          return response.data;

        });
      };

      this.fetchSingleGeoresourceWithoutGeometry = function (targetGeoresourceId) {
        return $http({
          url: this.baseUrlToKomMonitorDataAPI + georesourcesEndpoint + "/" + targetGeoresourceId + "/allFeatures/without-geometry",
          method: "GET"
        }).then(function successCallback(response) {
          // this callback will be called asynchronously
          // when the response is available
          return response.data;

        });
      };

      this.init = async function () {
        this.checkAuthentication();

        await this.fetchLastDatabaseModificationObject();
      };

      this.init();

    }]);