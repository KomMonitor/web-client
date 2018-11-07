angular
		.module('wpsSetup')
		.component(
				'wpsSetup',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsSetup/wps-setup.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : [
							'wpsPropertiesService', 'wpsFormControlService', '$scope', 'wpsMapService', '$http', '$rootScope',
							function WpsSetupController(wpsPropertiesService, wpsFormControlService, $scope, wpsMapService, $http, $rootScope) {

								const INDICATOR_DATE_PREFIX = "DATE_";

								// var rangeslide = require("rangeslide");
								/*
								 * references to wpsPropertiesService and wpsFormControl instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								this.wpsPropertiesServiceInstance.selectedServiceUrl = '';
								this.wpsMapServiceInstance = wpsMapService;
								this.wpsFormControlServiceInstance = wpsFormControlService;

								$scope.wmsUrlForSelectedIndicator;
								$scope.wfsUrlForSelectedIndicator;

								$scope.loadingData = true;
								$scope.changeIndicatorWasClicked = false;

								this.selectedDate;

								this.addGeopackage = function(){
									this.wpsMapServiceInstance.addSpatialUnitGeopackage();
								}
								this.addGeoJSON = function(){
									this.wpsMapServiceInstance.addSpatialUnitGeoJSON();
								}

								// $scope.$watch('filteredSpatialUnits', function(value){
								//   if ($scope.filteredSpatialUnits) {
								//     wpsPropertiesService.selectedSpatialUnit = $scope.filteredSpatialUnits[0];
								//   }
								// }, true);

								this.onClickTheme = function(topicName){

									for(const topic of this.wpsPropertiesServiceInstance.availableTopics){
										if(topic.topicName === topicName){
											document.getElementById(topicName).setAttribute("class", "active");
											this.wpsPropertiesServiceInstance.selectedTopic = topic;
										}
										else {
											document.getElementById(topic.topicName).setAttribute("class", "");
										}
									};

									// $scope.$apply();
								};

								this.unsetTopic = function(){
									this.wpsPropertiesServiceInstance.selectedTopic = null;

									for(const topic of this.wpsPropertiesServiceInstance.availableTopics){
											document.getElementById(topic.topicName).setAttribute("class", "");
									};

									// $scope.$apply();
								};

								$scope.filterGeoresourcesByIndicator = function() {
									return function( item ) {

										try{
											var referencedGeoresources = wpsPropertiesService.selectedIndicator.referencedGeoresources;
											var georesourceId = item.georesourceId;

											for (const refGeoresource of referencedGeoresources){
												if(refGeoresource.referencedGeoresourceId === georesourceId)
													return true;
											};

											// return referencedGeoresources.includes(georesourceId);
										}
										catch(error){
											return false;
										}
								  };
								};

								$scope.filterGeoresourcesByTopic = function() {
								  return function( item ) {
										if (wpsPropertiesService.selectedTopic)
								    	return item.applicableTopics.includes(wpsPropertiesService.selectedTopic.topicName);

										return true;
								  };
								};

								$scope.filterIndicatorsByTopic = function() {
								  return function( item ) {

										if(item.applicableDates == undefined || item.applicableDates.length === 0)
											return false;

										if (wpsPropertiesService.selectedTopic)
												return item.applicableTopics.includes(wpsPropertiesService.selectedTopic.topicName);


										return true;
								  };
								};

								$scope.filterSpatialUnitsByIndicator = function() {
								  return function( item ) {

										try{
											var applicableSpatialUnits = wpsPropertiesService.selectedIndicator.applicableSpatialUnits;
											var spatialUnitName = item.spatialUnitLevel;

											return applicableSpatialUnits.includes(spatialUnitName);
										}
										catch(error){
											return false;
										}
								  };
								};

								$scope.getFirstSpatialUnitForSelectedIndicator = function() {

									var result = undefined;

										var applicableSpatialUnits = wpsPropertiesService.selectedIndicator.applicableSpatialUnits;

										for (const spatialUnitEntry of wpsPropertiesService.availableSpatialUnits){
											if(applicableSpatialUnits.includes(spatialUnitEntry.spatialUnitLevel)){
												result = spatialUnitEntry;
												break;
											}
										};

										return result;
								};

								this.onDateChange = function(){
									console.log(this.selectedDate);

									var date = new Date(this.selectedDate);

									var month = date.getMonth()+1;
									var day = date.getDate();

									if (month < 10)
										month = "0" + month;

									if (day < 10)
										day = "0" + day;

									this.selectedDate = date.getFullYear() + "-" + month  + "-" + day;

									console.log(date);
									console.log(this.selectedDate);

									$scope.$apply();
								};

								var fetchedTopicsInitially = false;
								var fetchedSpatialUnitsInitially = false;
								var fetchedGeoresourcesInitially = false;
								var fetchedIndicatorsInitially = false;

								var callScopeApplyInitially = function(){
									if(fetchedTopicsInitially && fetchedIndicatorsInitially && fetchedGeoresourcesInitially && fetchedSpatialUnitsInitially){

										$rootScope.$broadcast("loadExampleIndicatorInitially");
									}

								};

								$scope.$on("loadExampleIndicatorInitially", function (event) {

									console.log("Load an initial example indicator");
									wpsPropertiesService.selectedIndicator = wpsPropertiesService.availableIndicators[0];

									$scope.onChangeSelectedIndicator();

								});

								$http({
									url: this.wpsPropertiesServiceInstance.baseUrlToKomMonitorDataAPI + "/spatial-units",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										wpsPropertiesService.setSpatialUnits(response.data);
										fetchedSpatialUnitsInitially = true;
										callScopeApplyInitially();

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								$http({
									url: this.wpsPropertiesServiceInstance.baseUrlToKomMonitorDataAPI + "/georesources",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										wpsPropertiesService.setGeoresources(response.data);
										fetchedGeoresourcesInitially = true;
										callScopeApplyInitially();

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								$http({
									url: this.wpsPropertiesServiceInstance.baseUrlToKomMonitorDataAPI + "/indicators",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										wpsPropertiesService.setIndicators(response.data);
										fetchedIndicatorsInitially = true;
										callScopeApplyInitially();

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								$http({
									url: this.wpsPropertiesServiceInstance.baseUrlToKomMonitorDataAPI + "/topics",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										wpsPropertiesService.setTopics(response.data);
										fetchedTopicsInitially = true;
										callScopeApplyInitially();

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								$http({
									url: this.wpsPropertiesServiceInstance.baseUrlToKomMonitorDataAPI + "/process-scripts",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										wpsPropertiesService.setProcessScripts(response.data);

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								this.addSelectedSpatialUnitToMap = function() {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									var metadata = wpsPropertiesService.selectedSpatialUnit;

									var id = metadata.spatialUnitId;

									$scope.date = this.selectedDate;

									var dateComps = this.selectedDate.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									$http({
										url: this.wpsPropertiesServiceInstance.baseUrlToKomMonitorDataAPI + "/spatial-units/" + id + "/" + year + "/" + month + "/" + day,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											wpsPropertiesService.selectedSpatialUnit.geoJSON = geoJSON;

											wpsMapService.addSpatialUnitGeoJSON(wpsPropertiesService.selectedSpatialUnit, $scope.date);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
									});
								};

								this.addSelectedSpatialUnitToMapAsWFS = function() {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									var metadata = wpsPropertiesService.selectedSpatialUnit;

									var name = metadata.spatialUnitLevel;

									var wfsUrl = metadata.wfsUrl;

									wpsMapService.addSpatialUnitWFS(name, wfsUrl);
									$scope.loadingData = false;
									$rootScope.$broadcast("hideLoadingIconOnMap");

								};

								this.addSelectedGeoresourceToMap = function() {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									var metadata = wpsPropertiesService.selectedGeoresource;

									var id = metadata.georesourceId;

									$scope.date = this.selectedDate;

									var dateComps = this.selectedDate.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									$http({
										url: this.wpsPropertiesServiceInstance.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											wpsPropertiesService.selectedGeoresource.geoJSON = geoJSON;

											wpsMapService.addGeoresourceGeoJSON(wpsPropertiesService.selectedGeoresource, $scope.date);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
									});

								};

								$scope.addSelectedIndicatorToMap = function() {

									wpsMapService.replaceIndicatorGeoJSON(wpsPropertiesService.selectedIndicator, wpsPropertiesService.selectedSpatialUnit.spatialUnitLevel, $scope.selectedDate);

								};

								$scope.setupDateSliderForIndicator = function(){

									var domNode = document.getElementById("dateSlider");

									while (domNode.hasChildNodes()) {
									  domNode.removeChild(domNode.lastChild);
									}

									var availableDates = wpsPropertiesService.selectedIndicator.applicableDates;
									var lastDateIndex = availableDates.length-1;
									var lastDate = availableDates[lastDateIndex];

									var timeSliderInput = [];

									$scope.selectedDate = lastDate;
									$scope.date = lastDate;

									availableDates.forEach(function(date){
										var dateItem = {};

										dateItem.key = date;
										dateItem.value = date;

										timeSliderInput.push(dateItem);
									});

									var dateSlider = rangeslide("#dateSlider", {
										data: timeSliderInput,
										startPosition: lastDateIndex,
										thumbWidth: 22,
										thumbHeight: 24,
										labelsPosition: "alternate",
										showLabels: true,
										startAlternateLabelsFromTop: false,
										trackHeight: 13,
										showTicks: false,
										showTrackMarkers: true,
										markerSize: 22,
										tickHeight: 10,
										handlers: {
											"valueChanged": [$scope.onChangeDateSliderItem]
										}
									});


								};

								$scope.onChangeDateSliderItem = async function(dataItem, rangeslideElement){

									if(!$scope.changeIndicatorWasClicked && wpsPropertiesService.selectedIndicator){
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");

										console.log("Change selected date");

										$scope.selectedDate = dataItem.key;
										$scope.date = dataItem.key;

										try{
											var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
										}
										catch(error){
											console.error(error);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
											return;
										}

										$scope.modifyComponentsForCurrentIndicatorTimestampAndSpatialUnit();

										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
										$scope.$apply();
									}
								}

								$scope.tryUpdateMeasureOfValueBarForIndicator = async function(){
									var indicatorId = wpsPropertiesService.selectedIndicator.indicatorId;

									if(! ($scope.date && wpsPropertiesService.selectedSpatialUnit && indicatorId))
										throw Error("Not all parameters have been set up yet.");
									//
									// $scope.selectedDate = this.selectedDate;
									$scope.spatialUnitName = wpsPropertiesService.selectedSpatialUnit.spatialUnitLevel;

									return await $http({
										url: wpsPropertiesService.baseUrlToKomMonitorDataAPI + "/indicators/" + indicatorId + "/" + wpsPropertiesService.selectedSpatialUnit.spatialUnitId,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											wpsPropertiesService.selectedIndicator.geoJSON = geoJSON;

											$scope.updateMeasureOfValueBar($scope.date);

											return wpsPropertiesService.selectedIndicator;

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");

											return wpsPropertiesService.selectedIndicator;
									});
								};

								this.onChangeSelectedSpatialUnit = async function(){
									if(!$scope.changeIndicatorWasClicked && wpsPropertiesService.selectedIndicator){
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");

										console.log("Change spatial unit");

										try{
											var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
										}
										catch(error){
											console.error(error);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
											return;
										}

										$scope.modifyComponentsForCurrentIndicatorTimestampAndSpatialUnit();

										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
										$scope.$apply();
									}
								}

								$scope.onChangeSelectedIndicator = async function(){

									if(wpsPropertiesService.selectedIndicator){
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");
										$scope.changeIndicatorWasClicked = true;

										$scope.setupDateSliderForIndicator();

										if(!wpsPropertiesService.selectedSpatialUnit || !wpsPropertiesService.selectedIndicator.applicableSpatialUnits.includes(wpsPropertiesService.selectedSpatialUnit.spatialUnitLevel)){
											wpsPropertiesService.selectedSpatialUnit = $scope.getFirstSpatialUnitForSelectedIndicator();
										}

										try{
											var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
										}
										catch(error){
											console.error(error);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
											return;
										}

												$scope.modifyComponentsForCurrentIndicatorTimestampAndSpatialUnit();


												$scope.loadingData = false;
												$rootScope.$broadcast("hideLoadingIconOnMap");
												$scope.changeIndicatorWasClicked = false;

												// $rootScope.$broadcast("updateDiagrams", wpsPropertiesService.selectedIndicator, wpsPropertiesService.selectedSpatialUnit.spatialUnitLevel, $scope.selectedDate);

												$scope.$apply();


									}
								}

								this.onChangeUseMeasureOfValue = function(){
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									console.log("Change UseMeasureOfValue");

									// try{
									// 	var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
									// }
									// catch(error){
									// 	console.error(error);
									// 	$scope.loadingData = false;
									// 	return;
									// }

									// $scope.modifyComponentsForCurrentIndicatorTimestampAndSpatialUnit();
								//	$scope.addSelectedIndicatorToMap();

									this.wpsMapServiceInstance.restyleCurrentLayer();

									$scope.loadingData = false;
									$rootScope.$broadcast("hideLoadingIconOnMap");
									//$scope.$apply();
								}

								$scope.modifyComponentsForCurrentIndicatorTimestampAndSpatialUnit = function(){
									$scope.wmsUrlForSelectedIndicator = undefined;
									$scope.wmsUrlForSelectedIndicator = undefined;

									var selectedSpatialUnitName = wpsPropertiesService.selectedSpatialUnit.spatialUnitLevel;

									for(const ogcServiceEntry of wpsPropertiesService.selectedIndicator.ogcServices){
										if (ogcServiceEntry.spatialUnit === selectedSpatialUnitName){
											$scope.wmsUrlForSelectedIndicator = ogcServiceEntry.wmsUrl;
											$scope.wfsUrlForSelectedIndicator = ogcServiceEntry.wfsUrl;
											break;
										}
									};

									$scope.prepareDownloadGeoJSON();

									$scope.addSelectedIndicatorToMap();
								}

								$scope.prepareDownloadGeoJSON = function(){

									console.log("removing old download button if available")
									if(document.getElementById("downloadSelectedIndicator"))
										document.getElementById("downloadSelectedIndicator").remove();

									var geoJSON_string = JSON.stringify(wpsPropertiesService.selectedIndicator.geoJSON);

									var fileName = wpsPropertiesService.selectedIndicator.indicatorName + "_" + wpsPropertiesService.selectedSpatialUnit.spatialUnitLevel + "_" + $scope.selectedDate + ".geojson";

									var blob = new Blob([geoJSON_string], {type: "application/json"});
									var data  = URL.createObjectURL(blob);
									//
									// $scope.indicatorDownloadURL = data;
									// $scope.indicatorDownloadName = fileName;

									console.log("create new Download button and append it to DOM");
									var a = document.createElement('a');
									a.download    = fileName;
									a.href        = data;
									a.textContent = "GeoJSON";
									a.id = "downloadSelectedIndicator";

									var li = document.createElement("li");
									li.appendChild(a);

									document.getElementById('exportDropdown').appendChild(li);
								}

								$scope.updateMeasureOfValueBar = function(date){

									//append date prefix to access correct property!
									date = INDICATOR_DATE_PREFIX + date;
									var geoJSON = wpsPropertiesService.selectedIndicator.geoJSON;

									var measureOfValueInput = document.getElementById("measureOfValueInput");

									// <input ng-model="$ctrl.wpsPropertiesServiceInstance.measureOfValue" ng-change="$ctrl.onMeasureOfValueChange()" type="range" min="0" max="100" step="1" value="51" class="slider" id="measureOfValueInput">
									var sampleFeature = geoJSON.features[0];
									var minValue = sampleFeature.properties[date];
									var maxValue = sampleFeature.properties[date];
									var middleValue;
									var step;

									var values = [];

									geoJSON.features.forEach(function(feature){
										// if (feature.properties[date] > maxValue)
										// 	maxValue = feature.properties[date];
										//
										// else if (feature.properties[date] < minValue)
										// 	minValue = feature.properties[date];

										values.push(feature.properties[date]);
									});

									//sort ascending order
									values.sort(function(a, b){return a-b});

									// plus sign turn it into a number again and removes tailing 0s
									minValue = +values[4].toFixed(4);
									maxValue = +values[values.length - 4].toFixed(4);

									middleValue = +((maxValue + minValue) / 2).toFixed(4);
									step = +(maxValue/values.length).toFixed(4);

									measureOfValueInput.setAttribute("min", minValue);
									measureOfValueInput.setAttribute("max", maxValue);
									measureOfValueInput.setAttribute("step", step);
									measureOfValueInput.setAttribute("value", middleValue);

									wpsPropertiesService.measureOfValue = middleValue;

								}

								$scope.$on("updateIndicatorOgcServices", function (event, indicatorWmsUrl, indicatorWfsUrl) {

															console.log('updateIndicatorOgcServices was called');

															$scope.wmsUrlForSelectedIndicator = indicatorWmsUrl;
															$scope.wfsUrlForSelectedIndicator = indicatorWfsUrl;
															$scope.$apply();

								});


							this.onMeasureOfValueChange = function(){
								this.wpsMapServiceInstance.restyleCurrentLayer();
							};


							} ]
				});
