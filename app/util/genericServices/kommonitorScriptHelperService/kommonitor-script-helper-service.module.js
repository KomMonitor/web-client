angular.module('kommonitorScriptHelper', ['kommonitorDataExchange']);

angular
  .module('kommonitorScriptHelper', [])
  .service(
    'kommonitorScriptHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', '__env',
    function ($rootScope, $timeout,
      kommonitorDataExchangeService, $http, __env) {

      this.targetUrlToManagementService = __env.apiUrl + __env.basePath + "/";

      this.availableScriptDataTypes = [
        {
					"displayName": "Textuell (String)",
					"apiName": "string"
				},
				{
					"displayName": "Wahrheitswert (Boolean)",
					"apiName": "boolean"
        },
        {
					"displayName": "Ganzzahl (Integer)",
					"apiName": "integer"
				},
				{
					"displayName": "Gleitkommazahl (Double)",
					"apiName": "double"
				}
      ];

      this.availableScriptTypeOptions = [
				{
					"displayName": "Generische Definition",
					"apiName": "generic"
				},
				{
					"displayName": "Summe aller Indikatoren",
					"apiName": "sum"
				}
			];

      this.requiredIndicators_tmp = [];
      this.requiredGeoresources_tmp = [];
      this.requiredScriptParameters_tmp = [];
      this.scriptCode_base64String = undefined;
      this.scriptCode_readableString = undefined;

      this.reset = function(){
        this.requiredIndicators_tmp = [];
        this.requiredGeoresources_tmp = [];
        this.requiredScriptParameters_tmp = [];
        this.scriptCode_base64String = undefined;
        this.scriptCode_readableString = undefined;
      };

      this.addBaseIndicator = function(indicatorMetadata){
				for (const baseIndicator of this.requiredIndicators_tmp) {
					if (baseIndicator.indicatorId === indicatorMetadata.indicatorId){
						// already inserted as base indicator, hence add not allowed
						return;
					}
				}
				this.requiredIndicators_tmp.push(indicatorMetadata);
      };
      
      this.removeBaseIndicator = function(indicatorMetadata){
				for (let index = 0; index < this.requiredIndicators_tmp.length; index++) {
				
          if (this.requiredIndicators_tmp[index].indicatorId === indicatorMetadata.indicatorId){
            // remove object
            this.requiredIndicators_tmp.splice(index, 1);
            break;
          }
        }	
      };
      
      this.addBaseGeoresource = function(georesourceMetadata){
				for (const baseGeoresource of this.requiredGeoresources_tmp) {
					if (baseGeoresource.georesourceId === georesourceMetadata.georesourceId){
						// already inserted as base georesource, hence add not allowed
						return;
					}
				}
				this.requiredGeoresources_tmp.push(georesourceMetadata);
      };
      
      this.removeBaseGeoresource = function(georesourceMetadata){
				for (let index = 0; index < this.requiredGeoresources_tmp.length; index++) {
				
          if (this.requiredGeoresources_tmp[index].georesourceId === georesourceMetadata.georesourceId){
            // remove object
            this.requiredGeoresources_tmp.splice(index, 1);
            break;
          }
        }	
      };
      
      this.addScriptParameter = function(parameterName, parameterDescription, parameterDataType, parameterDefaultValue, parameterNumericMinValue, parameterNumericMaxValue){
        for (const scriptParameter of this.requiredScriptParameters_tmp) {
					if (scriptParameter.name === parameterName){
						// already inserted as script parameter, hence add not allowed
						return;
					}
        }
        
        var scriptParameter = {
          "name": parameterName,
          "description": parameterDescription,
          "dataType": parameterDataType.apiName,
          "defaultValue": parameterDefaultValue,
          "minParameterValueForNumericInputs": parameterNumericMinValue || 0,
          "maxParameterValueForNumericInputs": parameterNumericMaxValue || 1

        };
				this.requiredScriptParameters_tmp.push(scriptParameter);
      };

      this.removeScriptParameter = function(scriptParameter){
				for (let index = 0; index < this.requiredScriptParameters_tmp.length; index++) {
				
          if (this.requiredScriptParameters_tmp[index].name === scriptParameter.name){
            // remove object
            this.requiredScriptParameters_tmp.splice(index, 1);
            break;
          }
        }	
      };

      this.postNewScript = async function(scriptName, description, targetIndicatorMetadata){
        console.log("Trying to POST to management service to register new script.");

        var postBody = {
          "name": scriptName,
          "description": description,
          "associatedIndicatorId": targetIndicatorMetadata.indicatorId,
          "requiredIndicatorIds": this.requiredIndicators_tmp.map(indicatorMetadata => indicatorMetadata.indicatorId),
          "requiredGeoresourceIds": this.requiredGeoresources_tmp.map(georesourceMetadata => georesourceMetadata.georesourceId),
          "variableProcessParameters": this.requiredScriptParameters_tmp,
          "scriptCodeBase64": window.btoa(this.scriptCode_readableString)
        };             

        return await $http({
          url: this.targetUrlToManagementService + "process-scripts",
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

      this.updateScript = async function(scriptName, description, scriptId){
        console.log("Trying to POST to importer service to update spatial unit with id '" + spatialUnitId + "'.");

        var putBody = {
          "name": scriptName,
          "description": description,
          "requiredIndicatorIds": this.requiredIndicators_tmp,
          "requiredGeoresourceIds": this.requiredGeoresources_tmp,
          "variableProcessParameters": this.requiredScriptParameters_tmp,
          "scriptCodeBase64": window.btoa(this.scriptCode_readableString)
        };       

        return await $http({
          url: this.targetUrlToManagementService + "process-scripts/" + scriptId,
          method: "PUT",
          data: putBody,
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

    }]);