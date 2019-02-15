angular
		.module('kommonitorIndividualIndicatorComputation')
		.component(
				'kommonitorIndividualIndicatorComputation',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorIndividualIndicatorComputation/kommonitor-individual-indicator-computation.template.html",
					controller : ['kommonitorDataExchangeService', '$scope', '$http','kommonitorMapService', '__env', function kommonitorIndividualIndicatorComputationController(
							kommonitorDataExchangeService, $scope, $http, kommonitorMapService, __env) {

						this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

						const targetURL = __env.targetUrlToProcessingEngine;

						$scope.loadingData = false;

						$scope.targetIndicator;
						$scope.targetDate;
						$scope.targetSpatialUnit;
						$scope.targetScriptMetadata;
						$scope.jobInfoText;
						$scope.computedCustomizedIndicatorGeoJSON;
						$scope.datesAsMs;
						$scope.availableDates;

						$scope.dateSliderForComputation;

						$scope.onTargetDateChange = function(){

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.resetProgressBar();

							var date = new Date($scope.targetDate);

							var month = date.getMonth()+1;
							var day = date.getDate();

							if (month < 10)
								month = "0" + month;

							if (day < 10)
								day = "0" + day;

							$scope.targetDate = date.getFullYear() + "-" + month  + "-" + day;

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
							inputElement.setAttribute("step", "1");

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

							// var inputElement = document.createElement("input");
							var inputElement = {};
							inputElement.id = parameterData.name;
							inputElement.type = "range";
							inputElement.value = parameterData.defaultValue;
							inputElement.class = "slider";
							inputElement.min = parameterData.minParameterValueForNumericInputs;
							inputElement.max = parameterData.maxParameterValueForNumericInputs;
							inputElement.dataShowValue = "true";
							inputElement.step = "0.01";

							inputElement.ngModelVariable = parameterData.name + "Value";

							// inputElement.setAttribute("ng-model", parameterData.name + "Value");
							// $scope[inputElement.ngModelVariable] = parameterData.defaultValue;

							return inputElement;
						};

						function sleep(ms) {
						  return new Promise(resolve => setTimeout(resolve, ms));
						}

						var buildParameterFormHtml = function(targetScriptMetadata){

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.resetProgressBar();

							// await sleep(1000);

							// try{
							// 	var processInputFormNode = document.getElementById("processInputForm");
							// 	// remove old content
							// 	while (processInputFormNode.firstChild) {
							// 	  processInputFormNode.removeChild(processInputFormNode.firstChild);
							// 	}
							// }
							// catch(error){
							// 	console.error("DOM Element with ID 'processInputForm' was not found");
							// }



							//example to create elements via code

							// we must iterate over all process parameters and setup form elements for each input type
							// e.g. sliders for range values, checkboxes for boolean

							// var processInputFormNode = document.getElementById("processInputForm");

							$scope.processInputs = [];

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

								var processInput = {};
								processInput.parameterData = parameterData;

								// var parameterDiv = document.createElement("div");
								// parameterDiv.setAttribute("class", "slidecontainer");
								//
								// var parameterLabel = document.createElement("label");
								// parameterLabel.appendChild(document.createTextNode(parameterData.name + ": {{" + parameterData.name + "Value}}"));
								//
								// var parameterDescription = document.createElement("p");
								// parameterDescription.appendChild(document.createTextNode(parameterData.description));
								//
								// parameterDiv.appendChild(parameterLabel);
								// parameterDiv.appendChild(parameterDescription);

								// create input element depending on dataType
								// dataType can be string, boolean, integer, double
								switch(parameterData.dataType) {
								    case "string":
								        // parameterDiv.appendChild(createInputAsString(parameterData));
												processInput.inputElement = createInputAsString(parameterData);
								        break;
								    case "boolean":
								        // parameterDiv.appendChild(createInputAsBoolean(parameterData));
												processInput.inputElement = createInputAsBoolean(parameterData);
								        break;
										case "integer":
										    // parameterDiv.appendChild(createInputAsInteger(parameterData));
												processInput.inputElement = createInputAsInteger(parameterData);
										    break;
										case "double":
										    // parameterDiv.appendChild(createInputAsDouble(parameterData));
												processInput.inputElement = createInputAsDouble(parameterData);
										    break;
								    default:
								        // parameterDiv.appendChild(createInputAsString(parameterData));
												processInput.inputElement = createInputAsString(parameterData);
								}

								$scope.processInputs.push(processInput);

								$scope[processInput.inputElement.ngModelVariable] = processInput.parameterData.defaultValue;

								// make a bit space after paramter
								// parameterDiv.appendChild(document.createElement("p"));

								// processInputFormNode.appendChild(parameterDiv);
							});

							// parameterNode.appendChild(parameterDiv);

							// $scope.$apply();
						};

						$scope.getScriptMetadataForIndicatorId = function(indicatorId){
							var targetScriptMetadata;

							for (const scriptElement of kommonitorDataExchangeService.availableProcessScripts){
								if (scriptElement.indicatorId === indicatorId){
									targetScriptMetadata = scriptElement;
									break;
								}
							};

							return targetScriptMetadata;
						};

						$scope.onChangeTargetIndicator = function(){

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.resetProgressBar();

							$scope.targetScriptMetadata = $scope.getScriptMetadataForIndicatorId($scope.targetIndicator.indicatorId);

							buildParameterFormHtml($scope.targetScriptMetadata);

							$scope.setupDateSliderForComputation();

							if(!$scope.targetSpatialUnit){
								$scope.targetSpatialUnit = $scope.getFirstSpatialUnitForSelectedIndicator();
							}

						};

						$scope.getFirstSpatialUnitForSelectedIndicator = function() {

							var result = undefined;

								var applicableSpatialUnits = $scope.targetIndicator.applicableSpatialUnits;

								for (const spatialUnitEntry of kommonitorDataExchangeService.availableSpatialUnits){
									if(applicableSpatialUnits.includes(spatialUnitEntry.spatialUnitLevel))
										result = spatialUnitEntry;
										break;
								};

								return result;
						};

						$scope.onChangeTargetSpatialUnit = function(){

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.resetProgressBar();


							buildParameterFormHtml($scope.targetScriptMetadata);
							$scope.setupDateSliderForComputation();

						};

						$scope.fetchBaseIndicatorMetadata = function(baseIndicatorId){
							for (const indicatorMetadata of kommonitorDataExchangeService.availableIndicators){
								if(indicatorMetadata.indicatorId === baseIndicatorId)
									return indicatorMetadata;
							}
						}

						$scope.fetchGeoresourceMetadata = function(georesourceId){
							for (const georesourceMetadata of kommonitorDataExchangeService.availableGeoresources){
								if(georesourceMetadata.datasetId === georesourceId)
									return georesourceMetadata;
							}
						}

						$scope.appendDatesFromIndicatorMetadataApplicableDates = function(dates){

								var indicatorMetadata = $scope.fetchBaseIndicatorMetadata($scope.targetScriptMetadata.indicatorId);
								for (const date of indicatorMetadata.applicableDates){
									if(!dates.includes(date))
										dates.push(date);
								}

							return dates;
						}

						$scope.appendDatesFromBaseIndicators = function(dates){

							for (const baseIndicatorId of $scope.targetScriptMetadata.requiredIndicatorIds){
								var baseIndicator = $scope.fetchBaseIndicatorMetadata(baseIndicatorId);
								for (const date of baseIndicator.applicableDates){
									if(!dates.includes(date))
										dates.push(date);
								}
							}

							return dates;
						}

						$scope.appendDatesFromGeoresources = function(dates){

							for (const georesourceId of $scope.targetScriptMetadata.requiredGeoresourceIds){
								var georesource = $scope.fetchGeoresourceMetadata(georesourceId);
								for (const date of georesource.applicableDates){
									if(!dates.includes(date))
										dates.push(date);
								}
							}

							return dates;
						}

						function dateToTS (date) {
								return date.valueOf();
						}

						function tsToDateString (dateAsMs) {
							var date = new Date(dateAsMs);

								return date.toLocaleDateString("de-DE", {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
								});
						}

						function dateToDateString (date) {

								return date.toLocaleDateString("de-DE", {
										year: 'numeric',
										month: 'long',
										day: 'numeric'
								});
						}

						function createDatesFromIndicatorDates(indicatorDates) {

							$scope.datesAsMs = [];

							for (var index=0; index < indicatorDates.length; index++){
								// year-month-day
								var dateComponents = indicatorDates[index].split("-");
								$scope.datesAsMs.push(dateToTS(new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]))));
							}
							return $scope.datesAsMs;
						}


						$scope.setupDateSliderForComputation = function(){

							if($scope.dateSliderForComputation){
									$scope.dateSliderForComputation.destroy();
							}

							var domNode = document.getElementById("dateSliderForComputation");

							while (domNode.hasChildNodes()) {
								domNode.removeChild(domNode.lastChild);
							}

							$scope.availableDates = new Array();

							// availableDates = $scope.appendDatesFromBaseIndicators(availableDates);
							$scope.availableDates = $scope.appendDatesFromIndicatorMetadataApplicableDates($scope.availableDates);
							// availableDates = $scope.appendDatesFromGeoresources(availableDates);

							// sort ascending
							$scope.availableDates.sort(function(a, b) {
							  return a - b;
							});

							$scope.date = $scope.availableDates[$scope.availableDates.length - 1];
							$scope.targetDate = $scope.availableDates[$scope.availableDates.length - 1];

							$scope.datesAsMs = createDatesFromIndicatorDates($scope.availableDates);

							// new Date() uses month between 0-11!
							$("#dateSliderForComputation").ionRangeSlider({
									skin: "big",
									type: "single",
									grid: true,
									values: $scope.datesAsMs,
									from: $scope.datesAsMs.length -1, // index, not the date
									force_edges: true,
									prettify: tsToDateString,
									onChange: $scope.onChangeDateSliderItem
							});

							$scope.dateSlider = $("#dateSliderForComputation").data("ionRangeSlider");
							// make sure that tha handles are properly set to man and max values
							$scope.dateSlider.update({
									from: $scope.datesAsMs.length -1 // index, not the date
							});
						};

						$scope.onChangeDateSliderItem = async function(data){

								$scope.targetDate = $scope.availableDates[data.from];
								$scope.date = $scope.targetDate;
							};


						$scope.calculateCustomIndicator = function(){

							$scope.computedCustomizedIndicatorGeoJSON = undefined;
							$scope.jobInfoText = undefined;
							$scope.resetProgressBar();

							console.log("calculateCustomIndicator called!");

							$scope.loadingData = true;
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
							processingInput.targetSpatialUnitId = $scope.targetSpatialUnit.spatialUnitId;
							processingInput.scriptId = $scope.targetScriptMetadata.scriptId;
							processingInput.targetDate = $scope.targetDate;
							processingInput.georesourceIds = $scope.targetScriptMetadata.requiredGeoresourceIds;
							processingInput.baseIndicatorIds = $scope.targetScriptMetadata.requiredIndicatorIds;
							processingInput.customProcessProperties = new Array();

							$scope.targetScriptMetadata.variableProcessParameters.forEach(function(processParam){
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

							$scope.indicatorName = $scope.targetIndicator.indicatorName;
							$scope.spatialUnitName = $scope.targetSpatialUnit.spatialUnitLevel;
							$scope.date = $scope.targetDate;

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
								url: targetURL + "/" + jobId,
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
									url: targetURL + '/' + jobId,
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

						$scope.addComputedIndicatorToMap = function(){
							console.log("Adding customized indicator to map.");

							$scope.targetIndicator.geoJSON = $scope.computedCustomizedIndicatorGeoJSON;
							kommonitorMapService.addCustomIndicatorGeoJSON($scope.targetIndicator, $scope.targetSpatialUnit.spatialUnitLevel, $scope.targetDate);
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

						$scope.downloadGeoJSON = function(){

							var geoJSON_string = JSON.stringify($scope.computedCustomizedIndicatorGeoJSON);

							filename = $scope.targetIndicator.indicatorName + "_" + $scope.targetSpatialUnit.spatialUnitLevel + "_" + $scope.targetDate + "_CUSTOM.geojson";

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

					}]
				});
