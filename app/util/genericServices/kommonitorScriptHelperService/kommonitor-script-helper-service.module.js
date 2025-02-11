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

      this.availableScriptTypeOptions = [
        {
					"displayName": "Test Dynamischer Skripttyp",
					"apiName": "test"
				},
				{
					"displayName": "Generische Definition",
					"apiName": "generic"
				},
				{
					"displayName": "Indikatoren - Summe aller Indikatoren",
					"apiName": "indicator_sum"
        },
				{
					"displayName": "Indikatoren - Subtraktion von Basis-Indikatoren von einem Referenzindikator",
					"apiName": "indicator_subtract"
        },
        {
					"displayName": "Indikatoren - Prozentualer Anteil (Quotient zwischen Basis-Indikatoren und einem Referenzindikator)",
					"apiName": "indicator_percentage"
        },
        {
					"displayName": "Indikatoren - Anteil (Quotient zwischen Basis-Indikatoren und einem Referenzindikator)",
					"apiName": "indicator_share"
        },
        {
					"displayName": "Indikatoren - Division (Quotient zweier Indikatoren)",
					"apiName": "indicator_division"
        },
        {
					"displayName": "Indikatoren - Trend (mittels linearer Regression)",
					"apiName": "indicator_trend"
        },
        {
					"displayName": "Indikatoren - Kontinuität (mittels Pearson Korrelation)",
					"apiName": "indicator_continuity"
        },
        {
					"displayName": "Indikatoren - Veränderung absolut",
					"apiName": "indicator_change_absolute"
        },
        {
					"displayName": "Indikatoren - Veränderung absolut mit festem Referenz-Zeitpunkt",
					"apiName": "indicator_change_absolute_refDate"
        },
        {
					"displayName": "Indikatoren - Veränderung prozentual mit festem Referenz-Zeitpunkt",
					"apiName": "indicator_change_relative_refDate"
        },
        {
					"displayName": "Indikatoren - Veränderung prozentual",
					"apiName": "indicator_change_relative"
        },
        {
					"displayName": "Indikatoren - Promille-Wert (Quotient zwischen Basis-Indikatoren und einem Referenzindikator)",
					"apiName": "indicator_promille"
        },        
        {
					"displayName": "Leitindikator - verkettete Berechnung (Rank, Min-Max-Normalisierung, Aggregation)",
					"apiName": "indicator_headlineIndicator"
        },
        {
					"displayName": "Indikatoren - Produkt aller Indikatoren",
					"apiName": "indicator_multiplication"
        },
        {
					"displayName": "Georessourcen - Anzahl Punkte in Polygon",
					"apiName": "georesource_pointsInPolygon"
				},
        {
					"displayName": "Georessourcen - Statistiken anhand Objekteigenschaft (Punktdatensätze)",
					"apiName": "georesource_statistics"
				},
        {
					"displayName": "Georessourcen - Prozentualer Anteil anhand Objekteigenschaft (Punktdatensätze)",
					"apiName": "georesource_subsetShare"
				},
        {
					"displayName": "Georessourcen - Summierte Linienlänge je Polygon",
					"apiName": "lineSegmentInPolygon"
				}             
			];

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
        "georesource_id",
        "comp_filter",
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
              "datasetName": targetIndicatorMetadata.indicatorName,
              "abbreviation": targetIndicatorMetadata.abbreviation || null,
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
              "defaultClassificationMapping": targetIndicatorMetadata.defaultClassificationMapping
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

      this.postNewScript = async function(scriptName, description, targetIndicatorMetadata){
        console.log("Trying to POST to management service to register new script.");

        /*	POST BODY
				{
						"scriptCodeBase64": "scriptCodeBase64",
						"requiredIndicatorIds": [
							"requiredIndicatorIds",
							"requiredIndicatorIds"
						],
						"variableProcessParameters": [
							{
							"minParameterValueForNumericInputs": 6.027456183070403,
							"maxParameterValueForNumericInputs": 0.8008281904610115,
							"defaultValue": "defaultValue",
							"dataType": "string",
							"name": "name",
							"description": "description"
							},
							{
							"minParameterValueForNumericInputs": 6.027456183070403,
							"maxParameterValueForNumericInputs": 0.8008281904610115,
							"defaultValue": "defaultValue",
							"dataType": "string",
							"name": "name",
							"description": "description"
							}
						],
						"associatedIndicatorId": "associatedIndicatorId",
						"name": "name",
						"description": "description",
						"requiredGeoresourceIds": [
							"requiredGeoresourceIds",
							"requiredGeoresourceIds"
						]
						}
			*/

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
