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
							'wpsPropertiesService', 'wpsFormControlService', '$scope', 'wpsMapService', '$http', '$scope',
							function WpsSetupController(wpsPropertiesService, wpsFormControlService, $scope, wpsMapService, $http, $scope) {
								/*
								 * references to wpsPropertiesService and wpsFormControl instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								this.wpsPropertiesServiceInstance.selectedServiceUrl = '';
								this.wpsMapServiceInstance = wpsMapService;
								this.wpsFormControlServiceInstance = wpsFormControlService;

								$scope.wmsUrlForSelectedIndicator;
								$scope.wfsUrlForSelectedIndicator;

								$scope.loadingData = false;

								this.selectedDate;

								this.addGeopackage = function(){
									this.wpsMapServiceInstance.addSpatialUnitGeopackage();
								}
								this.addGeoJSON = function(){
									this.wpsMapServiceInstance.addSpatialUnitGeoJSON();
								}

								$scope.$watch('filteredSpatialUnits', function(value){
								  if ($scope.filteredSpatialUnits) {
								    wpsPropertiesService.selectedSpatialUnit = $scope.filteredSpatialUnits[0];
								  }
								}, true);

								$scope.filterGeoresourcesByTopic = function() {
									return function( item ) {

										try{
											var referencedGeoresources = wpsPropertiesService.selectedIndicator.referencedGeoresources;
											var georesourceId = item.datasetId;

											return referencedGeoresources.includes(georesourceId);
										}
										catch(error){
											return false;
										}
								  };
								};

								$scope.filterGeoresourcesByIndicator = function() {
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
											if(applicableSpatialUnits.includes(spatialUnitEntry.spatialUnitLevel))
												result = spatialUnitEntry;
												break;
										};

										return result;
								};

								this.unsetTopic = function(){
									this.wpsPropertiesServiceInstance.selectedTopic = null;

									$scope.$apply();
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
									if(fetchedTopicsInitially && fetchedIndicatorsInitially && fetchedGeoresourcesInitially && fetchedSpatialUnitsInitially)
										$scope.$apply();
								};

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

								this.applyMeasureOfValue = function(){

									$scope.loadingData = true;

									// call REST Service to add new customized SLD to GeosServer Layer that is currently selected
									var jahrParam = 'jahr=' + wpsPropertiesService.selectedIndicator.jahr;
									var measureOfValueParam = 'grenzwertVersorgungInProzent=' + wpsPropertiesService.measureOfValue;

									var url = 'http://localhost:8085/FusslErreichbarkeitBewertungsmodellierung?' + jahrParam + '&' + measureOfValueParam;

									console.log('created SLD URL: ' + url);

									$http({
										url: url,
										method: "POST",
										data: {}
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var sldName = response.data.sldName;

											var dataset = wpsPropertiesService.selectedIndicator;

											var customLayerName = 'CUSTOM ' + dataset.name + '_bewertung_' + wpsPropertiesService.measureOfValue;

											// add current Layer again, but with customized name and customized SLD
											wpsMapService.addIndicatorLayer_withNameAndStyle(dataset, customLayerName, sldName);

											$scope.loadingData = false;

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.error = response.statusText;
											$scope.loadingData = false;
									});



								}





								this.isRemoveButtonDisabled = true;

								$scope.loadingData = false;

								this.addSelectedSpatialUnitToMap = function() {
									$scope.loadingData = true;

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

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
									});
								};

								this.addSelectedSpatialUnitToMapAsWFS = function() {
									$scope.loadingData = true;

									var metadata = wpsPropertiesService.selectedSpatialUnit;

									var name = metadata.spatialUnitLevel;

									var wfsUrl = metadata.wfsUrl;

									wpsMapService.addSpatialUnitWFS(name, wfsUrl);
									$scope.loadingData = false;

								};

								this.addSelectedGeoresourceToMap = function() {
									$scope.loadingData = true;

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

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
									});

								};

								this.addSelectedIndicatorToMap = function() {
									$scope.loadingData = true;

									var metadata = wpsPropertiesService.selectedIndicator;

									var id = metadata.indicatorId;

									$scope.date = this.selectedDate;
									$scope.spatialUnitName = this.wpsPropertiesServiceInstance.selectedSpatialUnit.spatialUnitLevel;

									var dateComps = this.selectedDate.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									$http({
										url: this.wpsPropertiesServiceInstance.baseUrlToKomMonitorDataAPI + "/indicators/" + id + "/" + wpsPropertiesService.selectedSpatialUnit.spatialUnitId,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											wpsPropertiesService.selectedIndicator.geoJSON = geoJSON;

											wpsMapService.addIndicatorGeoJSON(wpsPropertiesService.selectedIndicator, $scope.spatialUnitName, $scope.date);
											$scope.loadingData = false;

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
									});

								};

								this.setupDateSliderForIndicator = function(){

									var domNode = document.getElementById("dateSlider");

									while (domNode.hasChildNodes()) {
									  domNode.removeChild(domNode.lastChild);
									}

									var availableDates = wpsPropertiesService.selectedIndicator.applicableDates;

									var timeSliderInput = [];

									$scope.selectedDate = availableDates[0];
									$scope.date = availableDates[0];
									this.selectedDate = availableDates[0];

									availableDates.forEach(function(date){
										var dateItem = {};

										dateItem.key = date;
										dateItem.value = date;

										timeSliderInput.push(dateItem);
									});

									var rangeslide5 = rangeslide("#dateSlider", {
										data: timeSliderInput,
										thumbWidth: 32,
										thumbHeight: 32,
										labelsPosition: "alternate",
										showLabels: true,
										startAlternateLabelsFromTop: false,
										trackHeight: 20,
										showTicks: true,
										tickHeight: 30,
										handlers: {
											"valueChanged": [this.onChangeDateSliderItem]
										}
									});
								};

								$scope.tryUpdateMeasureOfValueBarForIndicator = function(){
									var indicatorId = wpsPropertiesService.selectedIndicator.indicatorId;

									if(! ($scope.date && wpsPropertiesService.selectedSpatialUnit && indicatorId))
										throw Error("Not all parameters have been set up yet.");
									//
									// $scope.selectedDate = this.selectedDate;
									$scope.spatialUnitName = wpsPropertiesService.selectedSpatialUnit.spatialUnitLevel;

									$http({
										url: wpsPropertiesService.baseUrlToKomMonitorDataAPI + "/indicators/" + indicatorId + "/" + wpsPropertiesService.selectedSpatialUnit.spatialUnitId,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											wpsPropertiesService.selectedIndicator.geoJSON = geoJSON;

											$scope.updateMeasureOfValueBar($scope.date);

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
									});
								};

								this.onChangeDateSliderItem = function(dataItem, rangeslideElement){
									$scope.selectedDate = dataItem.key;
									this.selectedDate = dataItem.key;
									$scope.date = dataItem.key;

									try{
										$scope.tryUpdateMeasureOfValueBarForIndicator();
									}
									catch(error){
										console.error(error);
									}
								}

								this.onChangeSelectedSpatialUnit = function(){

									console.log("Change spatial unit");

									try{
										$scope.tryUpdateMeasureOfValueBarForIndicator();
									}
									catch(error){
										console.error(error);
									}
								}

								this.onChangeSelectedIndicator = function(){

									this.setupDateSliderForIndicator();

									if(!wpsPropertiesService.selectedSpatialUnit){
										wpsPropertiesService.selectedSpatialUnit = $scope.getFirstSpatialUnitForSelectedIndicator();
									}

									try{
										$scope.tryUpdateMeasureOfValueBarForIndicator();
									}
									catch(error){
										console.error(error);
									}
								}

								$scope.updateMeasureOfValueBar = function(date){
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

									minValue = values[4];
									maxValue = values[values.length - 4];

									middleValue = (maxValue + minValue) / 2;
									step = maxValue/values.length;

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
