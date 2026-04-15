angular.module('kommonitorScriptHelper', ['kommonitorDataExchange', 'kommonitorToastHelper']);

angular
  .module('kommonitorScriptHelper', [])
  .service(
    'kommonitorScriptHelperService', ['$rootScope', '$timeout', 'kommonitorDataExchangeService', '$http', '__env', 'kommonitorToastHelperService',
    function ($rootScope, $timeout,
      kommonitorDataExchangeService, $http, __env, kommonitorToastHelperService) {

      var self = this;

      // map to store jobIds created on demand for specific schedule
      this.onDemandJobPerScheduleIdMap = new Map();

      this.targetUrlToManagementService = __env.apiUrl + __env.basePath + "/";

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
        "computation_ids_with_polarity",
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
      this.scriptFormulaHTML_overwriteTargetIndicatorMethod = true;

      this.scriptFormulaExplanation = undefined;

      this.targetIndicatorOldProcessDescription = undefined;

      let errorCounter = 0;

      this.reset = function(){
        this.requiredIndicators_tmp = [];
        this.requiredGeoresources_tmp = [];
        this.requiredScriptParameters_tmp = [];
        this.scriptCode_base64String = undefined;
        this.scriptCode_readableString = undefined;
        this.scriptFormulaHTML = undefined;
        this.scriptFormulaHTML_overwriteTargetIndicatorMethod = true;
        this.scriptFormulaExplanation = undefined;
        this.targetIndicatorOldProcessDescription = undefined;

        errorCounter = 0
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
            console.error("Error while patching indicator metadata to replace process description.");
            throw error;  
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

      this.triggerJobForSchedule = async function(scheduleId){
        return await $http({
          url: __env.targetUrlToProcessesApi + "schedules/" + scheduleId + "/execution",
          method: "POST"
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
  
            return response.data;
  
          }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.error("Error while posting to processes api service.");
            throw response;
        });
      }

      this.initJobWatchingForSchedule = function(scheduleId, scriptMetadata_old){      
        
        self.onDemandJobPerScheduleIdMap.set(scheduleId, false);

        // basic idea: have a deep copy of current scriptMetadata
        // then periodically fetch new process script metadata
        // check if there is a new jobId
        // if not then wait and repeat
        setTimeout(async function(){
          let jobResponse = await self.checkForNewJob(scheduleId, scriptMetadata_old);
          self.onDemandJobPerScheduleIdMap.set(scheduleId, jobResponse);

          // if map has valid job as object
          // then enable button again

          if(jobResponse){
            $("#" + "btnExecuteScript_" + scheduleId).removeAttr("disabled");
            $("#" + "btnExecuteScript_" + scheduleId  + "_span").css({'display': 'none'});    
            $("#" + "btnExecuteScript_" + scheduleId  + "_span").innerHTML = "Berechnung starten";        
          }
          else{
            $("#" + "btnExecuteScript_" + scheduleId).attr("disabled", "disabled");
            $("#" + "btnExecuteScript_" + scheduleId + "_span").css({'display': 'inline-block'});
          }
          
                    
          if (jobResponse){
            // check job status and inform user
            // there is a new job            
            $rootScope.$broadcast("refreshScriptOverviewTable", "edit", scheduleId);
            // $rootScope.$broadcast("refreshJobOverviewTable");
            kommonitorToastHelperService.displayInfoToast_lowerLeft("Manuelle Indikatorenberechnung", "Neuer Berechnungs-Job gestartet. Auf Job Abschluss warten.");
            
            errorCounter = 0;
            // also trigger watching for job completion
            self.waitForJobCompletion(jobResponse.jobID, scheduleId, scriptMetadata_old.inputs.target_indicator_id);
            return;
          }
          else{
            //continue jobWatching
            self.initJobWatchingForSchedule(scheduleId, scriptMetadata_old);
            
          }
        }, 1000);
      };

      this.checkForNewJob = async function(scheduleId, scriptMetadata_old){

        return await kommonitorDataExchangeService.fetchSingleIndicatorScriptMetadata(scheduleId).then(function successCallback(scriptMetadata) {

              // check if there is a new jobId
              if(scriptMetadata.jobIDs.length > scriptMetadata_old.jobIDs.length)
              {

                // noe get first jobId and fetch job description
                let newJobID = scriptMetadata.jobIDs[0];

                return self.fetchSingleJobDescription(newJobID);      
              }              
	
						}, function errorCallback(response) {
              kommonitorToastHelperService.displayErrorToast_lowerLeft("Fehler beim Abruf der Skript-Metadaten", "Die Metadaten des Skripts konnten nicht abgerufen werden.");
					});
      }

      this.waitForJobCompletion = function(jobID, scheduleId, targetIndicatorId){

        setTimeout(async function(){  
          try {
            let jobDescription = await self.fetchSingleJobDescription(jobID);

            if(jobDescription.status == "successful"){
              // job finished
              kommonitorToastHelperService.displaySuccessToast_lowerLeft("Indikatorenberechnung abgeschlossen", "Skripte Jobs und berechneter Zielindikator werden neu geladen.");  
              // $rootScope.$broadcast("refreshJobOverviewTable");
              $rootScope.$broadcast("refreshScriptOverviewTable", "edit", scheduleId);
              // also refresh indicator overview table to show new indicator values
              $rootScope.$broadcast("refreshIndicatorOverviewTable", "edit", targetIndicatorId);
              return;
            }
            else if(jobDescription.status == "failed"){
              // job failed
              kommonitorToastHelperService.displayErrorToast_lowerLeft("Fehler bei Indikatorenberechnung", "Die Berechnung des Indikators ist fehlgeschlagen. Bitte prüfen Sie die Job-Details.");
              return;
            } 
            else{
              // job still running
              self.waitForJobCompletion(jobID, scheduleId, targetIndicatorId);
            }
          } catch (error) {
            errorCounter++;
            if(errorCounter >= 5){
              // after 5 failed tries, we stop checking for job completion  
              kommonitorToastHelperService.displayErrorToast_lowerLeft("Fehler bei Indikatorenberechnung", "Die Berechnung des Indikators konnte nicht überwacht werden. Bitte prüfen Sie die Job-Details.");
              return;
            }

            self.waitForJobCompletion(jobID, scheduleId, targetIndicatorId);
          }
          
        }, 3000);
      }

      this.fetchSingleJobDescription = async function (jobID) {

        return await $http({
            url: __env.targetUrlToProcessesApi + "jobs/" + jobID,
            method: "GET"
          }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available

            return response.data;
          }).catch(function errorCallback(response) {
            console.error("Error while fetching job description from processes api service.");
            throw response;
        });
      };
      


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

      // processing JOBS related data for modal display
      this.selectedStatus = "";

      this.statusDescriptions = {
        accepted: {
          title: "wartende Jobs",
          backgroundClass: "bg-orange",
        },
        // delayed: { // not supported by pyGeoAPI as of July 2025
        // 	title: "verzögerte Jobs",
        // 	backgroundClass: "bg-gray",
        // },
        running: {
          title: "laufende Jobs",
          backgroundClass: "bg-aqua",
        },
        failed: {
          title: "gescheiterte Jobs",
          backgroundClass: "bg-red",
        },
        successful: {
          title: "abgeschlossene Jobs",
          backgroundClass: "bg-green",
        },
        schedule: {
          title: "Jobs zur Berechnung von <Indikator>",
          backgroundClass: "bg-blue",
        }
      }

      this.initJobDescriptionMap = function(jobDescriptions){
			this.jobDescriptionAndScheduleMap = new Map();
			// init map to quickly access job descriptions by their ID and find related schedule
			for (const job of jobDescriptions) {
				self.jobDescriptionAndScheduleMap.set(job.jobID, "");
			}

			for (const processScript of kommonitorDataExchangeService.availableProcessScripts) {
					// iterate over jobIDs of schedule and map jobID to schedule ID
					if(processScript.jobIDs && processScript.jobIDs.length>0){
						for (const jobID of processScript.jobIDs) {
							if(self.jobDescriptionAndScheduleMap.has(jobID)){
								self.jobDescriptionAndScheduleMap.set(jobID, processScript);
							}
						}
					}
			}
		  }

    }]);
