angular.module('kommonitorScriptHelper', ['kommonitorDataExchange']);

angular
  .module('kommonitorScriptHelper', [])
  .service(
    'kommonitorScriptHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', '__env',
    function ($rootScope, $timeout,
      kommonitorDataExchangeService, $http, __env) {

      var self = this;

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

      this.availableScriptTypeOptions = [];

      this.temporalOptions = [
				{
					"apiName": "YEARS",
					"displayName": "Jahr(e)"
				},
				{
					"apiName": "MONTHS",
					"displayName": "Monat(e)"
				},
				{
					"apiName": "DAYS",
					"displayName": "Tag(e)"
				}
			];

      this.predefinedInputNames = [
        "computation_id",
        "computation_ids",
        "reference_id",
        "reference_date",
        "georesource_id",
        "georesource_id_line",
        "comp_filter",
        "compProp",
        "target_spatial_units",
        "execution_interval",
        "target_time",
        "target_indicator_id"
      ];

      this.targetTimeOptions = [
        {
          "apiName": "MISSING",
          "displayName": "Fehlende Zeitpunkte berechnen"
        },
        {
          "apiName": "ALL",
          "displayName": "Alle Zeitpunkte berechnen"
        },
        {
          "apiName": "DATES",
          "displayName": "Zeitpunkte einzeln auswählen"
        }
      ];

      this.processParameters = {};

      this.requiredIndicators_tmp = [];
      this.requiredGeoresources_tmp = [];
      this.requiredScriptParameters_tmp = [];
      this.scriptCode_base64String = undefined;
      this.scriptCode_readableString = undefined;

      this.scriptFormulaHTML = undefined;
      this.scriptFormulaHTML_successToastDisplay = this.scriptFormulaHTML;
      this.scriptFormulaHTML_overwriteTargetIndicatorMethod = false;

      this.scriptFormulaExplanation = undefined;

      this.targetIndicatorOldProcessDescription = undefined;

      this.reset = function(){
        this.requiredIndicators_tmp = [];
        this.requiredGeoresources_tmp = [];
        this.requiredScriptParameters_tmp = [];
        this.scriptCode_base64String = undefined;
        this.scriptCode_readableString = undefined;
        this.scriptFormulaHTML = undefined;
        this.scriptFormulaHTML_overwriteTargetIndicatorMethod = false;
        this.scriptFormulaExplanation = undefined;
        this.targetIndicatorOldProcessDescription = undefined;
      };

      this.getScriptTypes = async function(){

          return await $http({
            url: __env.targetUrlToProcessesApi + "processes/",
            method: "GET"
          }).then(function successCallback(response) {
              return response.data.processes;
    
            }, function errorCallback(response) {
              console.error("Error getting script types.");
              throw response;
          });
      }

      this.getProcessDescription = async function(processId) {

        var self = this;
        await $http({
          url: __env.targetUrlToProcessesApi + "processes/" + processId,
          method: "GET",
          data: {
            'f': 'json'
          }
        }).then(function successCallback(response) {            
            self.scriptData = response.data;
            $rootScope.$broadcast("processDescriptionFetched");
          }, function errorCallback(response) {
            console.error("Error getting process description.");
            throw response;
        });
      }

      this.addBaseIndicator = function(indicatorMetadata){
        if(!indicatorMetadata){
          return;
        }
				// for (const baseIndicator of this.requiredIndicators_tmp) {
				// 	if (baseIndicator.indicatorId === indicatorMetadata.indicatorId){
				// 		// already inserted as base indicator, hence add not allowed
				// 		return;
				// 	}
				// }
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
				// for (const baseGeoresource of this.requiredGeoresources_tmp) {
				// 	if (baseGeoresource.georesourceId === georesourceMetadata.georesourceId){
				// 		// already inserted as base georesource, hence add not allowed
				// 		return;
				// 	}
				// }
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
          "dataType": parameterDataType,
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

      this.removeScriptParameter_byName = function(scriptParameterName){
				for (let index = 0; index < this.requiredScriptParameters_tmp.length; index++) {
				
          if (this.requiredScriptParameters_tmp[index].name === scriptParameterName){
            // remove object
            this.requiredScriptParameters_tmp.splice(index, 1);
            break;
          }
        }	
      };

      this.prettifyScriptCodePreview = function(htmlDomElementId){

        $timeout(function(){

          $(htmlDomElementId).removeClass("prettyprinted");
    
          PR.prettyPrint();
          
        }, 250);

      };

      this.buildPatchBody_indicators = function(targetIndicatorMetadata){
        var patchBody =
          {
            "metadata": {
              "note": targetIndicatorMetadata.metadata.note || null,
              "literature": targetIndicatorMetadata.metadata.literature || null,
              "updateInterval": targetIndicatorMetadata.metadata.updateInterval,
              "sridEPSG": targetIndicatorMetadata.metadata.sridEPSG || 4326,
              "datasource": targetIndicatorMetadata.metadata.datasource,
              "contact": targetIndicatorMetadata.metadata.contact,
              "lastUpdate": targetIndicatorMetadata.metadata.lastUpdate,
              "description": targetIndicatorMetadata.metadata.description || null,
              "databasis": targetIndicatorMetadata.metadata.databasis || null
            },
            "refrencesToOtherIndicators": [], // filled directly after
              "allowedRoles": targetIndicatorMetadata.allowedRoles,
              "regionalReferenceValues": targetIndicatorMetadata.regionalReferenceValues,
              "datasetName": targetIndicatorMetadata.indicatorName,
              "abbreviation": targetIndicatorMetadata.abbreviation || null,
              "precision": targetIndicatorMetadata.precision,
              "characteristicValue": targetIndicatorMetadata.characteristicValue || null,
              "tags": targetIndicatorMetadata.tags, 
              "creationType": targetIndicatorMetadata.creationType,
              "unit": targetIndicatorMetadata.unit,
              "topicReference": targetIndicatorMetadata.topicReference,
              "refrencesToGeoresources": [], // filled directly after
              "indicatorType": targetIndicatorMetadata.indicatorType,
              "interpretation": targetIndicatorMetadata.interpretation || "",
              "isHeadlineIndicator": targetIndicatorMetadata.isHeadlineIndicator || false,
              "processDescription": this.scriptFormulaHTML || targetIndicatorMetadata.processDescription,
              "lowestSpatialUnitForComputation": targetIndicatorMetadata.lowestSpatialUnitForComputation,
              "defaultClassificationMapping": targetIndicatorMetadata.defaultClassificationMapping,
              "referenceDateNote": targetIndicatorMetadata.referenceDateNote || "",
				      "displayOrder": targetIndicatorMetadata.displayOrder,
				  
          };

          // REFERENCES

          if(targetIndicatorMetadata.referencedIndicators && targetIndicatorMetadata.referencedIndicators.length > 0){
            patchBody.refrencesToOtherIndicators = [];

            for (const indicRef of targetIndicatorMetadata.referencedIndicators) {
              patchBody.refrencesToOtherIndicators.push({
                "indicatorId": indicRef.referencedIndicatorId,
                "referenceDescription": indicRef.referencedIndicatorDescription
              });
            }
          }

          if(targetIndicatorMetadata.referencedGeoresources && targetIndicatorMetadata.referencedGeoresources.length > 0){
            patchBody.refrencesToGeoresources = [];

            for (const geoRef of targetIndicatorMetadata.referencedGeoresources) {
              patchBody.refrencesToGeoresources.push({
                "georesourceId": geoRef.referencedGeoresourceId,
                "referenceDescription": geoRef.referencedGeoresourceDescription
              });
            }
          }	

          return patchBody;
      };

      this.replaceMethodMetadataForTargetIndicator = async function(targetIndicatorMetadata){
        var patchBody = this.buildPatchBody_indicators(targetIndicatorMetadata);

        this.targetIndicatorOldProcessDescription = targetIndicatorMetadata.processDescription;

        $http({
          url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + targetIndicatorMetadata.indicatorId,
          method: "PATCH",
          data: patchBody
          // headers: {
          //    'Content-Type': undefined
          // }
        }).then(function successCallback(response) {

            $rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", targetIndicatorMetadata.indicatorId);

          }, function errorCallback(error) {

        });
      };

      this.postNewScript = async function(scheduleId){ 

        // if(this.processParameters.computation_id) {
        //   this.processParameters.computation_ids = [this.processParameters.computation_id];
        //   this.processParameters.computation_id = undefined;
        // }

        function wrapObjectsInValue(obj) {
           // process inputs are often delivered as key value pairs.
          // for all non-special inputs (all except those from this.predefinedInputNames) we want to
          // reduce input value object to key value pairs
          // enumeration have to be treated specifically

          const result = {};
          for (const [key, value] of Object.entries(obj)) {
            // selected enumeration entry
            // we only need apiName value here
            if(value && value.apiName){
              result[key] = value.apiName;
            }
            // entry has own value property
            else if (
              value !== null &&
              typeof value === 'object' &&
              !Array.isArray(value)
            ) {
              result[key] = { value };
            // all other cases
            } else {
              result[key] = value;
            }
          }
          return result;
        }

        this.processParameters = wrapObjectsInValue(this.processParameters);


        var postBody = {
          inputs: this.processParameters,
        }


        //postBody = angular.toJson( this.processParameters ); // remove hash keys

        // postBody = {
        //   "inputs": {
        //     "target_indicator_id": "8146f4ad-8db2-45de-aa4d-a9ce59c68f83",            
        //     "target_spatial_units": [
        //         "4154115f-3fa8-4fb9-9d7a-593ed0885e6c"
        //     ],
        //     "target_time": {
        //         "value": {
        //             "mode": "DATES",
        //             "includeDates": ["2019-12-31", "2020-12-31"]    
        //         }
        //     },
        //     "execution_interval":  {
        //         "value": {
        //             "cron": "*/1 * * * *"
        //         }
        //     },
        //     "computation_id_numerator": "905b3c1b-0b1c-49d0-99e5-b327b7b085c2",
        //     "computation_id_denominator": "baad078b-8e91-4999-aa94-0fee5a50cec6",
        //   }
        // }

        return await $http({
          url: __env.targetUrlToProcessesApi + "processes/" + scheduleId + "/schedule",
          method: "POST",
          data: postBody
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

      this.deleteScript = async function(scheduleId){

          return await $http({
            url: __env.targetUrlToProcessesApi + "schedules/" + scheduleId,
            method: "DELETE"
          }).then(function successCallback(response) {
              
    
            }, function errorCallback(response) {
              console.error("Error deleting script schedule.");
              throw response;
          });
      }

      this.updateScript = async function(scriptName, description, scheduleId){

        var putBody = {
          "name": scriptName,
          "description": description,
          "requiredIndicatorIds": this.requiredIndicators_tmp,
          "requiredGeoresourceIds": this.requiredGeoresources_tmp,
          "variableProcessParameters": this.requiredScriptParameters_tmp,
          "scriptCodeBase64": window.btoa(this.scriptCode_readableString)
        };       

        return await $http({
          url: this.targetUrlToManagementService + "process-scripts/" + scheduleId,
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

      this.getAlphabetLetterFromNumber = function(number){
        return String.fromCharCode(Number(number) + 'A'.charCodeAt(0));
      };

      this.styleMathFormula = function(domOutputElementId){
        var output = document.getElementById(domOutputElementId);
        output.innerHTML = this.scriptFormulaHTML;

        // MathJax.texReset();
        // MathJax.typesetClear();
        MathJax.typesetPromise([output]).then(function(){

        }).catch(function (err) {
          output.innerHTML = '';
          output.appendChild(document.createTextNode(err.message));
          console.error(err);
        }).then(function () {

        });
      };

      this.styleMathFormula_forExplanation = function(domOutputElementId){
        var output = document.getElementById(domOutputElementId);

        // MathJax.texReset();
        // MathJax.typesetClear();
        MathJax.typesetPromise([output]).then(function(){
          $timeout(function(){
            self.scriptFormulaExplanation = "" + output.innerHTML;
            $rootScope.$apply();
          });
        }).catch(function (err) {
          output.innerHTML = '';
          output.appendChild(document.createTextNode(err.message));
          console.error(err);
        }).then(function () {
          $timeout(function(){
            self.scriptFormulaExplanation = "" + output.innerHTML;
            $rootScope.$apply();
          });
        });
      };

      this.typesetContainerByClass = function(className){
        var domElements = document.getElementsByClassName(className);
        
        for (const domElement of domElements) {
          MathJax.typesetPromise([domElement]).then(function(){
            $timeout(function(){
            });
          }).catch(function (err) {
            console.error(err);
          }).then(function () {
            $timeout(function(){
            });
          });
        }
      };

    }]);
