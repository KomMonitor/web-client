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
    'kommonitorCacheHelperService', [ 
    '$http', '__env', 'Auth',
    function ($http, __env, Auth) {

      this.lastDatabaseModificationInfo;
      this.baseUrlToKomMonitorDataAPI = __env.apiUrl + __env.basePath;
      let self = this;

      const localStorageKey_prefix = __env.localStoragePrefix;

      const localStorageKey_roles = localStorageKey_prefix + "_lastModification_roles"; 
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
              const rolesEndpoint = "/roles";

              var georesourcesEndpoint = georesourcesProtectedEndpoint;
              var spatialUnitsEndpoint = spatialUnitsProtectedEndpoint;
              var indicatorsEndpoint = indicatorsProtectedEndpoint;
              var scriptsEndpoint = scriptsProtectedEndpoint;
              this.spatialResourceGETUrlPath_forAuthentication = "/public";

              this.checkAuthentication = function() {
                if (Auth.keycloak.authenticated) {
                  georesourcesEndpoint = georesourcesProtectedEndpoint;
                  spatialUnitsEndpoint = spatialUnitsProtectedEndpoint;
                  indicatorsEndpoint = indicatorsProtectedEndpoint;
                  scriptsEndpoint = scriptsProtectedEndpoint;
                  this.spatialResourceGETUrlPath_forAuthentication = "";
                } else{
                  georesourcesEndpoint = georesourcesPublicEndpoint;
                  spatialUnitsEndpoint = spatialUnitsPublicEndpoint;
                  indicatorsEndpoint = indicatorsPublicEndpoint;
                  scriptsEndpoint = scriptsPublicEndpoint;
                  this.spatialResourceGETUrlPath_forAuthentication = "/public";
                }
    
              };

      this.fetchLastDatabaseModificationObject = async function(){
        await $http({
          url: this.baseUrlToKomMonitorDataAPI + "/public/database/last-modification",
          method: "GET"
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available

            self.lastDatabaseModificationInfo = response.data;
            
          });
      };

      this.fetchResource_fromCacheOrServer = async function(localStorageKey, resourceEndpoint, lastModificationResourceName){
        // check if the last modification date within local storage is the same as on the server

        // if YES, then try to use data from cache

        // else set new last modification date, fetch data from server and set that also within localStorage

        await this.fetchLastDatabaseModificationObject();        

        let timestampKey = localStorageKey + "_timestamp";

        let lastModTimestamp_fromCache_string = localStorage.getItem(timestampKey);

        if(lastModTimestamp_fromCache_string){
          let lastModTimestamp_fromCache = JSON.parse(lastModTimestamp_fromCache_string);

          if(lastModTimestamp_fromCache){

            let lastModTimestamp_fromServer = this.lastDatabaseModificationInfo[lastModificationResourceName]; 

            if(lastModTimestamp_fromCache == lastModTimestamp_fromServer){
              let storageObject_string = localStorage.getItem(localStorageKey);

              if (storageObject_string){
                let storageObject = JSON.parse(storageObject_string); 
                return storageObject;
              }
            }
          }
        }

        // when code reaches this place we must overwrite/set timestamp and actual metadata

        // persist last modification timestamp object as String in local storage
        localStorage.setItem(timestampKey, JSON.stringify(this.lastDatabaseModificationInfo[lastModificationResourceName]));
        
        return await $http({
          url: this.baseUrlToKomMonitorDataAPI + resourceEndpoint,
          method: "GET"
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available

            localStorage.setItem(localStorageKey, JSON.stringify(response.data));

            return response.data;
          });
      };

      this.fetchRolesMetadata = async function(){

        return await this.fetchResource_fromCacheOrServer(localStorageKey_roles, rolesEndpoint, "roles");

      };

      this.fetchTopicsMetadata = async function(){

        return await this.fetchResource_fromCacheOrServer(localStorageKey_topics, topicsPublicEndpoint, "topics");

      };

      this.fetchSpatialUnitsMetadata = async function(){

        return await this.fetchResource_fromCacheOrServer(localStorageKey_spatialUnits, spatialUnitsEndpoint, "spatial-units");

      };

      this.fetchIndicatorsMetadata = async function(){

        return await this.fetchResource_fromCacheOrServer(localStorageKey_indicators, indicatorsEndpoint, "indicators");

      };

      this.fetchGeoresourceMetadata = async function(){

        return await this.fetchResource_fromCacheOrServer(localStorageKey_georesources, georesourcesEndpoint, "georesources");

      };

      this.fetchProcessScriptsMetadata = async function(){

        return await this.fetchResource_fromCacheOrServer(localStorageKey_processScripts, scriptsEndpoint, "process-scripts");

      };

      this.init = async function(){
        this.checkAuthentication();

        await this.fetchLastDatabaseModificationObject();
      };

      this.init();

    }]);
