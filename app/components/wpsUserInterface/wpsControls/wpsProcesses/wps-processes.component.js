angular
		.module('wpsProcesses')
		.component(
				'wpsProcesses',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsProcesses/wps-processes.template.html",
					controller : ['wpsPropertiesService', 'wpsFormControlService', '$scope', '$http','wpsMapService', function WpsProcessesController(
							wpsPropertiesService, wpsFormControlService, $scope, $http, wpsMapService) {

						this.wpsPropertiesServiceInstance = wpsPropertiesService;
						this.wpsFormControlServiceInstance = wpsFormControlService;

						$scope.loadingData = false;

						this.targetIndicator;
						this.targetDate;
						this.targetSpatialUnit;
						this.targetScriptMetadata;
						$scope.jobInfoText;
						$scope.computedCustomizedIndicatorGeoJSON;

						this.onTargetDateChange = function(){
							console.log(this.targetDate);

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.resetProgressBar();

							var date = new Date(this.targetDate);

							var month = date.getMonth()+1;
							var day = date.getDate();

							if (month < 10)
								month = "0" + month;

							if (day < 10)
								day = "0" + day;

							this.targetDate = date.getFullYear() + "-" + month  + "-" + day;

							console.log(date);
							console.log(this.targetDate);

							$scope.$apply();
						};

						var createInputAsString = function(parameterData){
							// {
							// 	 "minParameterValueForNumericInputs": 6.027456183070403,
							// 	 "maxParameterValueForNumericInputs": 0.8008281904610115,
							// 	 "defaultValue": "defaultValue",
							// 	 "dataType": "string",
							// 	 "name": "name",
							// 	 "description": "description"
							//  }

							var inputElement = document.createElement("input");
							inputElement.setAttribute("id", parameterData.name);
							inputElement.setAttribute("type", "text");
							inputElement.setAttribute("value", parameterData.defaultValue);
							inputElement.value = parameterData.defaultValue;

							return inputElement;
						};

						var createInputAsBoolean = function(parameterData){
							// {
							// 	 "minParameterValueForNumericInputs": 6.027456183070403,
							// 	 "maxParameterValueForNumericInputs": 0.8008281904610115,
							// 	 "defaultValue": "defaultValue",
							// 	 "dataType": "string",
							// 	 "name": "name",
							// 	 "description": "description"
							//  }

							var inputElement = document.createElement("input");
							inputElement.setAttribute("id", parameterData.name);
							inputElement.setAttribute("type", "checkbox");
							inputElement.setAttribute("value", parameterData.name);

							if(parameterData.defaultValue === 'true')
								inputElement.setAttribute("checked", "checked");

							return inputElement;
						};

						var createInputAsInteger = function(parameterData){
							// {
							// 	 "minParameterValueForNumericInputs": 6.027456183070403,
							// 	 "maxParameterValueForNumericInputs": 0.8008281904610115,
							// 	 "defaultValue": "defaultValue",
							// 	 "dataType": "string",
							// 	 "name": "name",
							// 	 "description": "description"
							//  }

							// <input ng-model="$ctrl.radiusSmall" type="range" min="100" max="1000" step="50" ng-init="300" class="slider" id="rangeRadiusSmall">

							var inputElement = document.createElement("input");
							inputElement.setAttribute("id", parameterData.name);
							inputElement.setAttribute("type", "range");
							inputElement.setAttribute("value", parameterData.defaultValue);
							inputElement.value = parameterData.defaultValue;
							inputElement.setAttribute("class", "slider");
							inputElement.setAttribute("min", parameterData.minParameterValueForNumericInputs);
							inputElement.setAttribute("max", parameterData.maxParameterValueForNumericInputs);
							inputElement.setAttribute("data-show-value", "true");

							return inputElement;
						};

						var createInputAsDouble = function(parameterData){
							// {
							// 	 "minParameterValueForNumericInputs": 6.027456183070403,
							// 	 "maxParameterValueForNumericInputs": 0.8008281904610115,
							// 	 "defaultValue": "defaultValue",
							// 	 "dataType": "string",
							// 	 "name": "name",
							// 	 "description": "description"
							//  }

							// <input type="number" step="0.01">

							var inputElement = document.createElement("input");
							inputElement.setAttribute("id", parameterData.name);
							inputElement.setAttribute("type", "number");
							inputElement.setAttribute("value", parameterData.defaultValue);
							inputElement.value = parameterData.defaultValue;
							inputElement.setAttribute("min", parameterData.minParameterValueForNumericInputs);
							inputElement.setAttribute("max", parameterData.maxParameterValueForNumericInputs);
							inputElement.setAttribute("step", "0.001");

							return inputElement;
						};

						function sleep(ms) {
						  return new Promise(resolve => setTimeout(resolve, ms));
						}

						var buildParameterFormHtml = function(targetScriptMetadata){

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.resetProgressBar();

							// await sleep(1000);

							try{
								var processInputFormNode = document.getElementById("processInputForm");
								// remove old content
								while (processInputFormNode.firstChild) {
								  processInputFormNode.removeChild(processInputFormNode.firstChild);
								}
							}
							catch(error){
								console.error("DOM Element with ID 'processInputForm' was not found");
							}



							//example to create elements via code

							// we must iterate over all process parameters and setup form elements for each input type
							// e.g. sliders for range values, checkboxes for boolean

							var processInputFormNode = document.getElementById("processInputForm");

							targetScriptMetadata.variableProcessParameters.forEach(function(parameterData){
								// looks like:

								// {
								// 	 "minParameterValueForNumericInputs": 6.027456183070403,
								// 	 "maxParameterValueForNumericInputs": 0.8008281904610115,
								// 	 "defaultValue": "defaultValue",
								// 	 "dataType": "string",
								// 	 "name": "name",
								// 	 "description": "description"
								//  }

								// var parameterNode = document.createDocumentFragment();
								var parameterDiv = document.createElement("div");
								parameterDiv.setAttribute("class", "slidecontainer");

								var parameterLabel = document.createElement("label");
								parameterLabel.appendChild(document.createTextNode(parameterData.name));

								var parameterDescription = document.createElement("p");
								parameterDescription.appendChild(document.createTextNode(parameterData.description));

								parameterDiv.appendChild(parameterLabel);
								parameterDiv.appendChild(parameterDescription);

								// create input element depending on dataType
								// dataType can be string, boolean, integer, double
								switch(parameterData) {
								    case "string":
								        parameterDiv.appendChild(createInputAsString(parameterData));
								        break;
								    case "boolean":
								        parameterDiv.appendChild(createInputAsBoolean(parameterData));
								        break;
										case "integer":
										    parameterDiv.appendChild(createInputAsInteger(parameterData));
										    break;
										case "double":
										    parameterDiv.appendChild(createInputAsDouble(parameterData));
										    break;
								    default:
								        parameterDiv.appendChild(createInputAsString(parameterData));
								}

								processInputFormNode.appendChild(parameterDiv);
							});

							// parameterNode.appendChild(parameterDiv);

							//$scope.$apply();
						};

						this.getScriptMetadataForIndicatorId = function(indicatorId){
							var targetScriptMetadata;

							for (const scriptElement of wpsPropertiesService.availableProcessScripts){
								if (scriptElement.indicatorId === indicatorId){
									targetScriptMetadata = scriptElement;
									break;
								}
							};

							return targetScriptMetadata;
						};

						this.onChangeTargetIndicator = function(){

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.resetProgressBar();

							this.targetScriptMetadata = this.getScriptMetadataForIndicatorId(this.targetIndicator.indicatorId);

							buildParameterFormHtml(this.targetScriptMetadata);

							this.setupDateSliderForComputation();

							if(!this.targetSpatialUnit){
								this.targetSpatialUnit = this.getFirstSpatialUnitForSelectedIndicator();
							}

						};

						this.getFirstSpatialUnitForSelectedIndicator = function() {

							var result = undefined;

								var applicableSpatialUnits = this.targetIndicator.applicableSpatialUnits;

								for (const spatialUnitEntry of wpsPropertiesService.availableSpatialUnits){
									if(applicableSpatialUnits.includes(spatialUnitEntry.spatialUnitLevel))
										result = spatialUnitEntry;
										break;
								};

								return result;
						};

						this.onChangeTargetSpatialUnit = function(){

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.resetProgressBar();


							buildParameterFormHtml(this.targetScriptMetadata);
							this.setupDateSliderForComputation();

						};

						this.fetchBaseIndicatorMetadata = function(baseIndicatorId){
							for (const indicatorMetadata of wpsPropertiesService.availableIndicators){
								if(indicatorMetadata.indicatorId === baseIndicatorId)
									return indicatorMetadata;
							}
						}

						this.fetchGeoresourceMetadata = function(georesourceId){
							for (const georesourceMetadata of wpsPropertiesService.availableGeoresources){
								if(georesourceMetadata.datasetId === georesourceId)
									return georesourceMetadata;
							}
						}

						this.appendDatesFromBaseIndicators = function(dates){

							for (const baseIndicatorId of this.targetScriptMetadata.requiredIndicatorIds){
								var baseIndicator = this.fetchBaseIndicatorMetadata(baseIndicatorId);
								for (const date of baseIndicator.applicableDates){
									if(!dates.includes(date))
										dates.push(date);
								}
							}

							return dates;
						}

						this.appendDatesFromGeoresources = function(dates){

							for (const georesourceId of this.targetScriptMetadata.requiredGeoresourceIds){
								var georesource = this.fetchGeoresourceMetadata(georesourceId);
								for (const date of georesource.applicableDates){
									if(!dates.includes(date))
										dates.push(date);
								}
							}

							return dates;
						}

						this.setupDateSliderForComputation = function(){
							var domNode = document.getElementById("dateSliderForComputation");

							while (domNode.hasChildNodes()) {
								domNode.removeChild(domNode.lastChild);
							}

							var availableDates = new Array();

							availableDates = this.appendDatesFromBaseIndicators(availableDates);
							availableDates = this.appendDatesFromGeoresources(availableDates);

							// sort ascending
							availableDates.sort(function(a, b) {
							  return a - b;
							});

							var lastDateIndex = availableDates.length-1;
							var lastDate = availableDates[lastDateIndex];

							var timeSliderInput = [];

							$scope.targetDate = lastDate;
							$scope.date = lastDate;
							this.targetDate = lastDate;

							availableDates.forEach(function(date){
								var dateItem = {};

								dateItem.key = date;
								dateItem.value = date;

								timeSliderInput.push(dateItem);
							});

							var dateSlider = rangeslide("#dateSliderForComputation", {
								data: timeSliderInput,
								startPosition: lastDateIndex,
								thumbWidth: 12,
								thumbHeight: 14,
								labelsPosition: "alternate",
								showLabels: true,
								startAlternateLabelsFromTop: false,
								trackHeight: 5,
								showTicks: false,
								showTrackMarkers: true,
								markerSize: 12,
								tickHeight: 0,
								handlers: {
									"valueChanged": [this.onChangeDateSliderItem]
								}
							});
						};

						this.onChangeDateSliderItem = async function(dataItem, rangeslideElement){

								console.log("Change selected date");

								$scope.targetDate = dataItem.key;
								this.targetDate = dataItem.key;
								$scope.date = dataItem.key;
							};


						this.calculateCustomIndicator = function(){

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.jobInfoText = undefined;
							$scope.resetProgressBar();

							console.log("calculateCustomIndicator called!");

							$scope.loadingData = true;

							var targetURL = "http://localhost:8086/rest/v1/script-engine/customizableIndicatorComputation";

							// example request model

							// {
							//   "targetSpatialUnitId": "targetSpatialUnitId",
							//   "scriptId": "scriptId",
							//   "customProcessProperties": [
							//     {
							//       "dataType": "string",
							//       "name": "name",
							//       "value": "customValue"
							//     },
							//     {
							//       "dataType": "string",
							//       "name": "name",
							//       "value": "customValue"
							//     }
							//   ],
							//   "targetDate": "2000-01-23",
							//   "georesourceIds": [
							//     "georesourceIds",
							//     "georesourceIds"
							//   ],
							//   "baseIndicatorIds": [
							//     "baseIndicatorIds",
							//     "baseIndicatorIds"
							//   ]
							// }

							var processingInput = {};
							processingInput.targetSpatialUnitId = this.targetSpatialUnit.spatialUnitId;
							processingInput.scriptId = this.targetScriptMetadata.scriptId;
							processingInput.targetDate = this.targetDate;
							processingInput.georesourceIds = this.targetScriptMetadata.requiredGeoresourceIds;
							processingInput.baseIndicatorIds = this.targetScriptMetadata.requiredIndicatorIds;
							processingInput.customProcessProperties = new Array();

							this.targetScriptMetadata.variableProcessParameters.forEach(function(processParam){
								// now get name of parameter
								// then seach for input element within DOM with id=name
								// get value of that DOM element and create parameter object
								var scriptParam = {};
								scriptParam.name = processParam.name;
								scriptParam.dataType = processParam.dataType;
								scriptParam.value = document.getElementById(scriptParam.name).value;

								processingInput.customProcessProperties.push(scriptParam);
							});

							console.log("created URL POST body for CUSTOM PROCESSING: " + processingInput);

							$scope.indicatorName = this.targetIndicator.indicatorName;
							$scope.spatialUnitName = this.targetSpatialUnit.spatialUnitLevel;
							$scope.date = this.targetDate;

									$http({
										url: targetURL,
										method: "POST",
										headers: {
										   'Content-Type': 'application/json'
										 },
										data: processingInput
									}).then(async function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available

											console.log("success callback for customizable indicator comutation");
											// get location header to achieve jobId
											var jobId = response.headers('Location');

											await sleep(300);

											$scope.showInitialJobStatus(jobId);

											$scope.loadingData = false;

											$scope.pendForResult(jobId);

											// $scope.downloadGeoJSON(geoJSON_string);

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.error = response.statusText;

											$scope.loadingData = false;
									});


						}

						$scope.showInitialJobStatus = function(jobId){

							$http({
								url: "http://localhost:8086/rest/v1/script-engine/customizableIndicatorComputation/" + jobId,
								method: "GET"
							}).then(function successCallback(response) {
									// this callback will be called asynchronously
									// when the response is available

									console.log("success callback for showInitialJobStatus");
									$scope.jobInfoText = "Berechnung begonnen. Siehe Fortschrittsbalken.";

									if(response.data.progress)
										$scope.updateProgressBar(response.data.progress);

								}, function errorCallback(response) {
									// called asynchronously if an error occurs
									// or server returns response with an error status.
									$scope.error = response.data.error;

									$scope.loadingData = false;
							});
						};

						$scope.pendForResult = async function(jobId){

							var sleepTimeInMS = 1000;

							var maxTryNumber = 60;
							var tryNumber = 0;

							while(!$scope.computedCustomizedIndicatorGeoJSON && (tryNumber < maxTryNumber)){

								if($scope.stopLoop)
									break;

								$http({
									url: "http://localhost:8086/rest/v1/script-engine/customizableIndicatorComputation/" + jobId,
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										console.log("success callback for pendForResult");

										if(response.data.status === "failed"){
											$scope.error = response.data.error;
											console.error(response.data.error);
											$scope.stopLoop = true;
											return;
										}

										if(response.data.progress)
											$scope.updateProgressBar(response.data.progress);


										if(response.data.progress === 100 || response.data.status === "succeeded"){
											var geoJSON_base64 = response.data.result_geoJSON_base64;
											// first decode Base64 and then parse string as JSON
											$scope.computedCustomizedIndicatorGeoJSON = JSON.parse(atob(geoJSON_base64));
											$scope.jobInfoText = undefined;

											$scope.prepareDownloadGeoJSON();

											// $scope.$apply();
										}

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										$scope.error = response.data.error;
										console.error(response.data.error);
										$scope.stopLoop = true;
										$scope.loadingData = false;
										return;


								});

								if ($scope.computedCustomizedIndicatorGeoJSON)
									return;

									tryNumber++;
								await sleep(sleepTimeInMS);
							}

						};

						$scope.updateProgressBar = function(progress){
							var progressBarNode = document.getElementById("customComputationProgressBar");

							progressBarNode.setAttribute("aria-valuenow", ""+progress);
							progressBarNode.setAttribute("style", "width:"+progress+"%");
							progressBarNode.textContent = progress + "% Fortschritt";
							// $scope.progress = progress;
						};

						$scope.resetProgressBar = function(){
							var progressBarNode = document.getElementById("customComputationProgressBar");

							progressBarNode.setAttribute("aria-valuenow", "0");
							progressBarNode.setAttribute("style", "width:0%");
							progressBarNode.textContent = "0% Fortschritt";
							// $scope.progress = 0;
						};

						this.addComputedIndicatorToMap = function(){
							console.log("Adding customized indicator to map.");

							this.targetIndicator.geoJSON = $scope.computedCustomizedIndicatorGeoJSON;
							wpsMapService.addCustomIndicatorGeoJSON(this.targetIndicator, this.targetSpatialUnit.spatialUnitLevel, this.targetDate);
						};

						$scope.prepareDownloadGeoJSON = function(){

							console.log("removing old download button if available")
							if(document.getElementById("downloadComputedIndicator"))
								document.getElementById("downloadComputedIndicator").remove();

							var geoJSON_string = JSON.stringify($scope.computedCustomizedIndicatorGeoJSON);

							var fileName = $scope.indicatorName + "_" + $scope.spatialUnitName + "_" + $scope.date + "_CUSTOM.geojson";
							// var fileName = "export.geojson"

							// if (!geoJSON_string.match(/^data:application\/vnd.geo+json/i)) {
							// 	geoJSON_string = 'data:application/vnd.geo+json;charset=utf-8,' + geoJSON_string;
							// }
							// data = encodeURI(geoJSON_string);

							var blob = new Blob([geoJSON_string], {type: "application/json"});
							var data  = URL.createObjectURL(blob);
							//
							// $scope.indicatorDownloadURL = data;
							// $scope.indicatorDownloadName = fileName;

							console.log("create new Download button and append it to DOM");
							var a = document.createElement('a');
							a.download    = fileName;
							a.href        = data;
							a.textContent = "Download GeoJSON";
							a.id = "downloadComputedIndicator";
							a.setAttribute("class", "btn btn-info");

							document.getElementById('indicatorOutput').appendChild(a);
						}

						this.downloadGeoJSON = function(){

							var geoJSON_string = JSON.stringify($scope.computedCustomizedIndicatorGeoJSON);

							filename = this.targetIndicator.indicatorName + "_" + this.targetSpatialUnit.spatialUnitLevel + "_" + this.targetDate + "_CUSTOM.geojson";

							if (!geoJSON_string.match(/^data:application\/vnd.geo+json/i)) {
								geoJSON_string = 'data:application/vnd.geo+json;charset=utf-8,' + geoJSON_string;
							}
							data = encodeURI(geoJSON_string);

							link = document.createElement('a');
							link.setAttribute('href', data);
							link.setAttribute('download', filename);

							document.body.appendChild(link);

							console.log("Trigger download");

							link.click();
						}














						this.changeWpsProcess = function(){
							/*
							 * reset error/success message divs
							 */
							wpsFormControlService.describeProcessSuccess_classAttribute = 'hidden';
							wpsFormControlService.describeProcessFailed_classAttribute = 'hidden';

							/*
							 * disable execute tab, in case an error occurs
							 */
							wpsFormControlService.executeTab_classAttribute = 'disabled';
							wpsFormControlService.executeTab_dataToggleAttribute = '';

							/*
							 * reset tab contents
							 */
							wpsFormControlService.resetTabContents();

							if(this.wpsPropertiesServiceInstance.selectedProcess){
								$scope.loadingData = true;
								wpsPropertiesService.describeProcess(this.describeProcessCallback);
							}

						}

						this.describeProcessCallback = function(describeProcessResponse){
							/*
							 * TODO block execute once a process description could not be retrieved?
							 */

							$scope.loadingData = false;

							/*
							 * check received object for reasonable structure.
							 */
							if(describeProcessResponse.processOffering){
								/*
								 * re-call wpsPropertiesService to actually modify it's processDescription object
								 */
								var processDescrObject = describeProcessResponse.processOffering;
								wpsPropertiesService.onProcessDescriptionChange(processDescrObject);

								wpsFormControlService.describeProcessSuccess_classAttribute = '';

								/*
								 * enable execute tab
								 */
								wpsFormControlService.executeTab_classAttribute = 'enabled';
								wpsFormControlService.executeTab_dataToggleAttribute = 'tab';

							}
							else{

								// wpsFormControlService.disableTabs();
								/*
								 * error occurred!
								 * enable error message
								 */
								wpsFormControlService.describeProcessFailed_errorThrown = describeProcessResponse.errorThrown;
								wpsFormControlService.describeProcessFailed_classAttribute = '';
							}

							/*
							 * call $apply manually to modify service references
							 */
							$scope.$apply();
						};

					}]
				});
