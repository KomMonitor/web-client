angular.module('kobotoolboxHelper', ['kommonitorDataExchange', 'kommonitorFileHelper']);

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
  .module('kobotoolboxHelper', [])
  .service(
    'kobotoolboxHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', 
      '__env', 'kommonitorFileHelperService',
    function ($rootScope, $timeout,
      kommonitorDataExchangeService, $http, __env, kommonitorFileHelperService) {

        let self = this;

        this.targetURLToKobotoolboxHelper = "http://localhost:8086/processing/kobotoolbox";

      this.loadNoisePlaces = async function(){
        let geoJSON = await self.fetchNoisePlaces();

        console.log(geoJSON);
      }

      this.loadQuietPlaces = async function(){
        let geoJSON = await self.fetchQuietPlaces();

        console.log(geoJSON);
      }

      this.fetchNoisePlaces = async function(token){
        return await $http({
          url: this.targetURLToKobotoolboxHelper + "/lap-bochum/noise-places",
          method: "GET",
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            let geoJSON = response.data;
            let customColor = `#00AABB`;
					  let customMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[0];
            let datasetName = "Laute Orte";
            let customIcon = "bullhorn"; // bullhorn, volume-up
            
            let tmpGeoresource_fromKobo = kommonitorFileHelperService.makeGeoresourceMetadata_fromKobotoolboxDataset(datasetName, customColor, customMarkerColor, customIcon, "GeoJSON", geoJSON);
            
            $rootScope.$broadcast("GeoJSONFromFileFinished", tmpGeoresource_fromKobo);
  
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            kommonitorDataExchangeService.displayMapApplicationError(error);

        });
      }

      this.fetchQuietPlaces = async function(token){
        return await $http({
          url: this.targetURLToKobotoolboxHelper + "/lap-bochum/quiet-places",
          method: "GET",
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            let geoJSON = response.data;
            let customColor = `#00AABB`;
					  let customMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[4];
            let datasetName = "Ruhige Orte";
            let customIcon = "volume-down"; // volume-off
            
            let tmpGeoresource_fromKobo = kommonitorFileHelperService.makeGeoresourceMetadata_fromKobotoolboxDataset(datasetName, customColor, customMarkerColor, customIcon, "GeoJSON", geoJSON);
            
            $rootScope.$broadcast("GeoJSONFromFileFinished", tmpGeoresource_fromKobo);
  
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            kommonitorDataExchangeService.displayMapApplicationError(error);

        });
      }

    }]);
