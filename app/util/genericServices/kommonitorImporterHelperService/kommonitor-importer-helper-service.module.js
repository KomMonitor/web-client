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


      this.uploadNewFile = async function(fileData, fileName){
        console.log("Trying to POST to importer service to upload a new file.");

        var formdata = new FormData();
        formdata.append("filename", fileName); 
        formdata.append("file", fileData);       

        return await $http({
          url: this.targetUrlToImporterService + "upload",
          method: "POST",
          data: formdata,
          // must set header content-type to undefined in order to send as multipart-formdata
          headers: {"Content-Type": undefined },
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            return false;
        });        
      };



      this.buildPropertyMapping_spatialResource = function(nameProperty, idPropety, validStartDateProperty, validEndDateProperty, arisenFromProperty){
        return {
          "arisenFromProperty": arisenFromProperty,
          "identifierProperty": idPropety,
          "nameProperty": nameProperty,
          "validEndDateProperty": validStartDateProperty,
          "validStartDateProperty": validEndDateProperty
        };
      };

      this.buildPropertyMapping_indicatorResource = function(spatialReferenceKeyProperty, timeseriesMappings){
        return {
          "spatialReferenceKeyProperty": spatialReferenceKeyProperty,
          "timeseriesMappings": timeseriesMappings
        };
      };

      this.registerNewSpatialUnit = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, spatiaUnitPostBody_managementAPI){
        console.log("Trying to POST to importer service to register new spatial unit.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "spatialUnitPostBody": spatiaUnitPostBody_managementAPI
        };        

        return await $http({
          url: this.targetUrlToImporterService + "spatial-units",
          method: "POST",
          data: postBody
				// headers: {
				//    'Content-Type': undefined
				// }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            return false;
        });        
      };

      this.updateSpatialUnit = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, spatialUnitId, spatiaUnitPutBody_managementAPI){
        console.log("Trying to POST to importer service to update spatial unit with id '" + spatialUnitId + "'.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "spatialUnitId": spatialUnitId,
          "spatialUnitPutBody": spatiaUnitPutBody_managementAPI
        };        

        return await $http({
          url: this.targetUrlToImporterService + "spatial-units/update",
          method: "POST",
          data: postBody
				// headers: {
				//    'Content-Type': undefined
				// }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            return false;
        });        
      };



      this.registerNewGeoresource = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, georesourcePostBody_managementAPI){
        console.log("Trying to POST to importer service to register new georesource.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "georesourcePostBody": georesourcePostBody_managementAPI
        };        

        return await $http({
          url: this.targetUrlToImporterService + "georesources",
          method: "POST",
          data: postBody
				// headers: {
				//    'Content-Type': undefined
				// }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            return false;
        });        
      };

      this.updateGeoresource = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, georesourceId, georesourcePutBody_managementAPI){
        console.log("Trying to POST to importer service to update georesource with id '" + georesourceId + "'.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "georesourceId": georesourceId,
          "georesourcePutBody": georesourcePutBody_managementAPI
        };        

        return await $http({
          url: this.targetUrlToImporterService + "georesources/update",
          method: "POST",
          data: postBody
				// headers: {
				//    'Content-Type': undefined
				// }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            return false;
        });        
      };



      this.registerNewIndicator = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, indicatorPostBody_managementAPI){
        console.log("Trying to POST to importer service to register new indicator.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "indicatorPostBody": indicatorPostBody_managementAPI
        };        

        return await $http({
          url: this.targetUrlToImporterService + "indicators",
          method: "POST",
          data: postBody
				// headers: {
				//    'Content-Type': undefined
				// }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            return false;
        });        
      };

      this.updateIndicator = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, indicatorId, indicatorPutBody_managementAPI){
        console.log("Trying to POST to importer service to update indicator with id '" + indicatorId + "'.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "indicatorId": indicatorId,
          "indicatorPutBody": indicatorPutBody_managementAPI
        };        

        return await $http({
          url: this.targetUrlToImporterService + "indicators/update",
          method: "POST",
          data: postBody
				// headers: {
				//    'Content-Type': undefined
				// }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            return false;
        });        
      };


    }]);
