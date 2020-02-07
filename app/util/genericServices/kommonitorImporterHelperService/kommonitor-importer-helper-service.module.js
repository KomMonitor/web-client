angular.module('kommonitorImporterHelper', ['kommonitorDataExchange']);

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
  .module('kommonitorImporterHelper', [])
  .service(
    'kommonitorImporterHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', '__env',
    function ($rootScope, $timeout,
      kommonitorDataExchangeService, $http, __env) {

      this.targetUrlToImporterService = __env.targetUrlToImporterService;
      this.prefix_converterName = "org.n52.kommonitor.importer.converter.";

      this.availableConverters = [];

      this.availableDatasourceTypes = [];

      this.fetchResourcesFromImporter = async function(){
        console.log("Trying to fetch converters and datasourceTypes from importer service");
        this.availableConverters = await this.fetchConverters();
        this.availableDatasourceTypes = await this.fetchDatasourceTypes();

        this.availableConverters.forEach(async (converter) => {
          converter = await this.fetchConverterDetails(converter);
          converter.simpleName = converter.name.replace(this.prefix_converterName, "");
        });

        this.availableDatasourceTypes.forEach(async (datasourceType) => {
          datasourceType = await this.fetchDatasourceTypeDetails(datasourceType);
        });

      };

      this.fetchConverters = async function(){
        return await $http({
          url: this.targetUrlToImporterService + "converters",
          method: "GET"
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while fetching converters from importer.");
        });
      };

      this.fetchConverterDetails = async function(converter){
        return await $http({
          url: this.targetUrlToImporterService + "converters/" + converter.name,
          method: "GET"
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;            
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while fetching converter for name '" + converter.name + "' from importer.");
        });
      };

      this.fetchDatasourceTypes = async function(){
        return await $http({
          url: this.targetUrlToImporterService + "datasourceTypes",
          method: "GET"
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while fetching datasourceTypes from importer.");
        });
      };

      this.fetchDatasourceTypeDetails = async function(datasourceType){
        return await $http({
          url: this.targetUrlToImporterService + "datasourceTypes/" + datasourceType.type,
          method: "GET"
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while fetching datasourceType for type '" + datasource.type + "' from importer.");
        });
      };

      // load data
      this.fetchResourcesFromImporter();


    }]);
