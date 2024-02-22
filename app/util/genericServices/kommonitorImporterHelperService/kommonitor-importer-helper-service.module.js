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

      this.availableConverters = undefined;

      this.availableDatasourceTypes = undefined;

      this.attributeMapping_attributeTypes = [
        {
          displayName: "Text/String",
          apiName: "string"
        },
        {
          displayName: "Ganzzahl",
          apiName: "integer"
        },
        {
          displayName: "Gleitkommazahl",
          apiName: "float"
        },
        {
          displayName: "Datum",
          apiName: "date"
        },
      ];

      this.mappingConfigStructure = {
          "converter": {
            "encoding": "string",
            "mimeType": "string",
            "name": "string",
            "parameters": [
            {
              "name": "string",
              "value": "string"
            }
            ],
            "schema": "string"
          },
          "dataSource": {
            "parameters": [
            {
              "name": "string",
              "value": "string"
            }
            ],
            "type": "FILE" // FILE|HTTP|INLINE
          },
          "propertyMapping": {
            "arisenFromProperty": "string",
            "attributes": [
            {
              "mappingName": "string", // target name
              "name": "string", // source name
              "type": "string" // dataType, [string|integer|float|date]
            }
            ],
            "identifierProperty": "string",
            "keepAttributes": true, // if true, then mapping under attributes is ignored and all attributes are imported with the same attribute name
            "nameProperty": "string",
            "validEndDateProperty": "string",
            "validStartDateProperty": "string"
          },
          "periodOfValidity":{
            "startDate": "yyyy-mm-tt",
            "endDate": "yyyy-mm-tt"
          }
        };

        this.mappingConfigStructure_indicator = {
          "converter": {
            "encoding": "string",
            "mimeType": "string",
            "name": "string",
            "parameters": [
            {
              "name": "string",
              "value": "string"
            }
            ],
            "schema": "string"
          },
          "dataSource": {
            "parameters": [
            {
              "name": "string",
              "value": "string"
            }
            ],
            "type": "FILE" // FILE|HTTP|INLINE
          },
          "propertyMapping": {
            "attributeMappings": [
              {
                "mappingName": "string",
                "name": "string",
                "type": "string"
              }
            ],
            "spatialReferenceKeyProperty": "string",
            "timeseriesMappings": [
              {
                "indicatorValueProperty": "string",
                "timestamp": "string",
                "timestampProperty": "string"
              }
            ]
          },
          "targetSpatialUnitName": "string"
        }; 

      this.converterDefinition_singleFeatureImport = {
        "encoding": "UTF-8",
        "mimeType": "application/geo+json",
        "name": "GeoJSON",
        "parameters": [
          {
            "name": "CRS",
            "value": "EPSG:4326"
          }
        ]
      }; 
      
      this.datasourceDefinition_singleFeatureImport = {
        "parameters": [
          {
            "name": "payload",
            "value": "geojsonValue"
          }
        ],
        "type": "INLINE"
      };
      
      this.propertyMappingDefinition_singleFeatureImport = {
        "identifierProperty": "ID",
        "nameProperty": "NAME",
        "keepAttributes": true,
        "keepMissingOrNullValueAttributes": true,
        "attributes": []
      };

      this.fetchResourcesFromImporter = async function(){
        console.log("Trying to fetch converters and datasourceTypes from importer service");
        this.availableConverters = await this.fetchConverters();
        this.availableDatasourceTypes = await this.fetchDatasourceTypes();

        if(! this.availableConverters || ! this.availableDatasourceTypes){

          kommonitorDataExchangeService.displayMapApplicationError("Notwendige Anbindung an Importer-Service ist fehlerhaft. Bitte wenden Sie sich an Ihren Administrator.");

          return;
        }

        for (let index = 0; index < this.availableConverters.length; index++) {
          var converter = this.availableConverters[index];
          
          converter = await this.fetchConverterDetails(converter);
          this.availableConverters[index] = converter;
        }

        for (let k = 0; k < this.availableDatasourceTypes.length; k++) {
          this.availableDatasourceTypes[k] = await this.fetchDatasourceTypeDetails(this.availableDatasourceTypes[k]);          
        }

        setTimeout(() => {
          $rootScope.$apply();
        }, 1500);

      };

      this.filterConverters = function(resourceType) {
        // remove csvLatLon for indicators
        // and csv_onlyIndicator for georesources
        return function (converter) {
            if(resourceType === "georesource" && converter.name.includes("Indikator"))
                return false;
            if(resourceType === "spatialUnit" && (converter.name.includes("Indikator") || converter.name.includes("Tabelle")))
                return false;
            if(resourceType === "indicator" && (converter.name.includes("Geokodierung") || converter.name.includes("Koordinate")) )
                return false;    
            
            return true;
        };
      };

      this.fetchConverters = async function(){
        return await $http({
          url: this.targetUrlToImporterService + "converters",
          method: "GET"
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while fetching converters from importer.");
            kommonitorDataExchangeService.displayMapApplicationError(error);

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
  
          }, function errorCallback(error) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while fetching datasourceTypes from importer.");
            kommonitorDataExchangeService.displayMapApplicationError(error);
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
          headers: {"Content-Type": undefined, "Accept": "text/plain" },
          responseType: 'text'
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            throw response;
        });        
      };

      this.buildConverterDefinition = function(selectedConverter, converterParameterPrefix, schema, mimeType){
        var converterDefinition = {
          "encoding": selectedConverter.encodings[0],
          "mimeType": selectedConverter.mimeTypes.filter(element => element == mimeType)[0],
          "name": selectedConverter.name,
          "parameters": [
            
          ],
          "schema": undefined
          };
  
        if(selectedConverter.schemas){
          if (schema === undefined || schema === null){
            return null;
          }
          else{
            converterDefinition.schema = schema;
          }
        }

        if (selectedConverter.name === "OGC API - Features") {
            converterDefinition.parameters.push({
              "name": "CRS",
              "value": "EPSG:4326"
            });
        }
  
        if(selectedConverter.parameters && selectedConverter.parameters.length > 0){
          for (const parameter of selectedConverter.parameters) {
            var parameterName = parameter.name;
            var parameterValue = $("#" + converterParameterPrefix + parameterName).val();

            if (parameter.mandatory && (parameterValue === undefined || parameterValue === null || parameterValue === "")){
              return null;
            }
            else{
              if(parameterValue && !(parameterValue === "")){
                converterDefinition.parameters.push({
                  "name": parameterName,
                  "value": parameterValue
                });
              }
              
            }
          }
        }
  
        return converterDefinition;
      };

      this.buildDatasourceTypeDefinition = async function(selectedDatasourceType, datasourceTypeParameterPrefix, datasourceFileInputId){
        var datasourceTypeDefinition = {
          "parameters": [
            
          ],
          "type": selectedDatasourceType.type
          };
  
        if(selectedDatasourceType.type === "FILE"){
          // get file if present
  
          // upload it to importer
  
          // use file reference name for datasourceType definition
  
          
          var file = document.getElementById(datasourceFileInputId).files[0];
  
          if(file === null || file === undefined){
            return null;
          }
  
          var fileUploadName;
          try {
            fileUploadName = await this.uploadNewFile(file, file.name);	
          } catch (error) {
            console.error("Error while uploading file to importer.");
            console.error(error);
            kommonitorDataExchangeService.displayMapApplicationError(error);
            throw error;
          }
  
          datasourceTypeDefinition.parameters.push({
            "name": "NAME",
            "value": fileUploadName
          });
        }  
        else{
          if(selectedDatasourceType.parameters.length > 0){
            for (const parameter of selectedDatasourceType.parameters) {
              var parameterName = parameter.name;
              if (parameterName === "bbox") {
                var bboxType = $("#" + datasourceTypeParameterPrefix + "bboxType").val();
                datasourceTypeDefinition.parameters.push({
                  "name": "bboxType",
                  "value": bboxType
                });
                var value = undefined;
                if (bboxType === 'ref') {
                    value = $("#" + datasourceTypeParameterPrefix + "bboxRef").val()
                } else {
                    var minx = $("#" + datasourceTypeParameterPrefix + "bbox_minx").val();
                    var miny = $("#" + datasourceTypeParameterPrefix + "bbox_miny").val();
                    var maxx= $("#" + datasourceTypeParameterPrefix + "bbox_maxx").val();
                    var maxy = $("#" + datasourceTypeParameterPrefix + "bbox_maxy").val();
                    value = minx + "," + miny + "," + maxx + "," + maxy
                };
                datasourceTypeDefinition.parameters.push({
                  "name": "bbox",
                  "value": value
                });
              } else {
                  var parameterValue = $("#" + datasourceTypeParameterPrefix + parameterName).val();

                  if (parameterValue === undefined || parameterValue === null){
                    return datasourceTypeDefinition;
                  }
                  else {
                    datasourceTypeDefinition.parameters.push({
                      "name": parameterName,
                      "value": parameterValue
                    });
                  }
              }
            }
          }
        }
  
        return datasourceTypeDefinition;
      };

      this.buildPutBody_georesources = function(scopeProperties) {

        var putBody =
        {
            "geoJsonString": "",
            "periodOfValidity": {
                "endDate": scopeProperties.periodOfValidity.endDate,
                "startDate": scopeProperties.periodOfValidity.startDate
            },
            "isPartialUpdate": scopeProperties.isPartialUpdate
        };

        return putBody;
      }

      this.buildPutBody_indicators = function(scopeProperties){
        
        var putBody =
        {
          "indicatorValues": [],
          "applicableSpatialUnit": scopeProperties.targetSpatialUnitMetadata.spatialUnitLevel,
          "defaultClassificationMapping": scopeProperties.currentIndicatorDataset.defaultClassificationMapping,
          "permissions": scopeProperties.permissions,
          "ownerId": scopeProperties.ownerId
          };

        return putBody;
      };

      this.buildPropertyMapping_spatialResource = function(nameProperty, idPropety, validStartDateProperty, validEndDateProperty, arisenFromProperty, keepAttributes, keepMissingValues, attributeMappings_adminView){
        if(validStartDateProperty === ""){
          validStartDateProperty = undefined;
        }
        if(validEndDateProperty === ""){
          validEndDateProperty = undefined;
        }
        if(arisenFromProperty === ""){
          arisenFromProperty = undefined;
        }
        
        var propertyMapping = {
          "arisenFromProperty": arisenFromProperty,
          "identifierProperty": idPropety,
          "nameProperty": nameProperty,
          "validEndDateProperty": validEndDateProperty,
          "validStartDateProperty": validStartDateProperty,
          "keepAttributes": keepAttributes,
          "keepMissingOrNullValueAttributes": keepMissingValues,
          "attributes": []
        };

        if (! keepAttributes){
          // add attribute mappings
          attributeMappings_adminView.forEach(attributeMapping_adminView => {
            propertyMapping.attributes.push({
              name: attributeMapping_adminView.sourceName,
              mappingName: attributeMapping_adminView.destinationName,
              type: attributeMapping_adminView.dataType.apiName
            }); 
          });
        }

        return propertyMapping;

      };

      this.buildPropertyMapping_indicatorResource = function(spatialReferenceKeyProperty, timeseriesMappings, keepMissingOrNullValueIndicator){
        console.log(spatialReferenceKeyProperty);
        console.log(timeseriesMappings);
        console.log(keepMissingOrNullValueIndicator);
        // attributeMapping is undefined for indicators
        return {
          "spatialReferenceKeyProperty": spatialReferenceKeyProperty,
          "timeseriesMappings": timeseriesMappings,
          "keepMissingOrNullValueIndicator": keepMissingOrNullValueIndicator,
          "attributeMappings": undefined
        };
      };

      this.registerNewSpatialUnit = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, spatiaUnitPostBody_managementAPI, isDryRun){
        console.log("Trying to POST to importer service to register new spatial unit.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "spatialUnitPostBody": spatiaUnitPostBody_managementAPI,
          "dryRun": isDryRun
        };        

        return await $http({
          url: this.targetUrlToImporterService + "spatial-units",
          method: "POST",
          data: postBody,
          headers: {
            'Content-Type': "application/json"
          }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            throw response;
        });        
      };

      this.updateSpatialUnit = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, spatialUnitId, spatialUnitPutBody_managementAPI, isDryRun){
        console.log("Trying to POST to importer service to update spatial unit with id '" + spatialUnitId + "'.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "spatialUnitId": spatialUnitId,
          "spatialUnitPutBody": spatialUnitPutBody_managementAPI,
          "dryRun": isDryRun
        };        

        return await $http({
          url: this.targetUrlToImporterService + "spatial-units/update",
          method: "POST",
          data: postBody,
          headers: {
            'Content-Type': "application/json"
          }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            throw response;
        });        
      };



      this.registerNewGeoresource = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, georesourcePostBody_managementAPI, isDryRun){
        console.log("Trying to POST to importer service to register new georesource.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "georesourcePostBody": georesourcePostBody_managementAPI,
          "dryRun": isDryRun
        };        

        return await $http({
          url: this.targetUrlToImporterService + "georesources",
          method: "POST",
          data: postBody,
          headers: {
            'Content-Type': "application/json"
          }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            throw response;
        });        
      };

      this.updateGeoresource = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, georesourceId, georesourcePutBody_managementAPI, isDryRun){
        console.log("Trying to POST to importer service to update georesource with id '" + georesourceId + "'.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "georesourceId": georesourceId,
          "georesourcePutBody": georesourcePutBody_managementAPI,
          "dryRun": isDryRun
        };        

        return await $http({
          url: this.targetUrlToImporterService + "georesources/update",
          method: "POST",
          data: postBody,
          headers: {
            'Content-Type': "application/json"
          }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            throw response;
        });        
      };



      this.registerNewIndicator = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, indicatorPostBody_managementAPI, isDryRun){
        console.log("Trying to POST to importer service to register new indicator.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "indicatorPostBody": indicatorPostBody_managementAPI,
          "dryRun": isDryRun
        };        

        return await $http({
          url: this.targetUrlToImporterService + "indicators",
          method: "POST",
          data: postBody,
          headers: {
            'Content-Type': "application/json"
          }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            throw response;
        });        
      };

      this.updateIndicator = async function(converterDefinition, datasourceTypeDefinition, propertyMappingDefinition, indicatorId, indicatorPutBody_managementAPI, isDryRun){
        console.log("Trying to POST to importer service to update indicator with id '" + indicatorId + "'.");

        var postBody = {
          "converter": converterDefinition,
          "dataSource": datasourceTypeDefinition,
          "propertyMapping": propertyMappingDefinition,
          "indicatorId": indicatorId,
          "indicatorPutBody": indicatorPutBody_managementAPI,
          "dryRun": isDryRun
        };        

        return await $http({
          url: this.targetUrlToImporterService + "indicators/update",
          method: "POST",
          data: postBody,
          headers: {
            'Content-Type': "application/json"
          }
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            //$scope.error = response.statusText;
            console.error("Error while posting to importer service.");
            throw response;
        });        
      };

      this.importerResponseContainsErrors = function (importerResponse){
        if (importerResponse.errors && importerResponse.errors.length > 0){
          return true;
        }
        return false;
      };

      this.getIdFromImporterResponse = function (importerResponse){
        if (importerResponse.uri){
          return importerResponse.uri;
        }
        return undefined;
      };

      this.getErrorsFromImporterResponse = function (importerResponse){
        if (importerResponse.errors){
          return importerResponse.errors;
        }
        return undefined;
      };

      this.getImportedFeaturesFromImporterResponse = function (importerResponse){
        if (importerResponse.importedFeatures){
          return importerResponse.importedFeatures;
        }
        return undefined;
      };


    }]);
