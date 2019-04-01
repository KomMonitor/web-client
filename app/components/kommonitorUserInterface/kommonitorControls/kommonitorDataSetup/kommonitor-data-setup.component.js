angular
		.module('kommonitorDataSetup')
		.component(
				'kommonitorDataSetup',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorDataSetup/kommonitor-data-setup.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : [
							'kommonitorDataExchangeService', '$scope', 'kommonitorMapService', '$http', '$rootScope', '__env', '$timeout',
							function kommonitorDataSetupController(kommonitorDataExchangeService, $scope, kommonitorMapService, $http, $rootScope, __env, $timeout) {

								const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;

								// var rangeslide = require("rangeslide");
								/*
								 * references to kommonitorDataExchangeService and wpsFormControl instances
								 */
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
								this.kommonitorDataExchangeServiceInstance.selectedServiceUrl = '';
								this.kommonitorMapServiceInstance = kommonitorMapService;

								$scope.wmsUrlForSelectedIndicator;
								$scope.wfsUrlForSelectedIndicator;

								$scope.loadingData = true;
								$scope.changeIndicatorWasClicked = false;

								$scope.dateSlider;
								$scope.datesAsMs;

								$scope.selectedDate;

								this.addGeopackage = function(){
									this.kommonitorMapServiceInstance.addSpatialUnitGeopackage();
								}
								this.addGeoJSON = function(){
									this.kommonitorMapServiceInstance.addSpatialUnitGeoJSON();
								}

								// $scope.$watch('filteredSpatialUnits', function(value){
								//   if ($scope.filteredSpatialUnits) {
								//     kommonitorDataExchangeService.selectedSpatialUnit = $scope.filteredSpatialUnits[0];
								//   }
								// }, true);

								this.onClickTheme = function(topicName){

									for(const topic of this.kommonitorDataExchangeServiceInstance.availableTopics){
										if(topic.topicName === topicName){
											document.getElementById(topicName).setAttribute("class", "active");
											this.kommonitorDataExchangeServiceInstance.selectedTopic = topic;
										}
										else {
											document.getElementById(topic.topicName).setAttribute("class", "");
										}
									};

									// $scope.$apply();
								};

								this.unsetTopic = function(){
									this.kommonitorDataExchangeServiceInstance.selectedTopic = null;

									for(const topic of this.kommonitorDataExchangeServiceInstance.availableTopics){
											document.getElementById(topic.topicName).setAttribute("class", "");
									};

									// $scope.$apply();
								};

								$scope.filterGeoresourcesByIndicator = function() {
									return function( item ) {

										try{
											var referencedGeoresources = kommonitorDataExchangeService.selectedIndicator.referencedGeoresources;
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

								$scope.filterReferencedIndicatorsByIndicator = function() {
									return function( item ) {

										try{
											var referencedIndicators = kommonitorDataExchangeService.selectedIndicator.referencedIndicators;
											var indicatorId = item.indicatorId;

											for (const refIndicator of referencedIndicators){
												if(refIndicator.referencedIndicatorId === indicatorId)
													return true;
											};

										}
										catch(error){
											return false;
										}
								  };
								};

								$scope.filterGeoresourcesByTopic = function() {
								  return function( item ) {
										if (kommonitorDataExchangeService.selectedTopic)
								    	return item.applicableTopics.includes(kommonitorDataExchangeService.selectedTopic.topicName);

										return true;
								  };
								};

								$scope.filterIndicatorsByTopic = function() {
								  return function( item ) {

										if(item.applicableDates == undefined || item.applicableDates.length === 0)
											return false;

										if (kommonitorDataExchangeService.selectedTopic)
												return item.applicableTopics.includes(kommonitorDataExchangeService.selectedTopic.topicName);


										return true;
								  };
								};

								$scope.filterSpatialUnitsByIndicator = function() {
								  return function( item ) {

										try{
											var applicableSpatialUnits = kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits;
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

										var applicableSpatialUnits = kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits;

										for (const spatialUnitEntry of kommonitorDataExchangeService.availableSpatialUnits){
											if(applicableSpatialUnits.includes(spatialUnitEntry.spatialUnitLevel)){
												result = spatialUnitEntry;
												break;
											}
										};

										return result;
								};

								this.onDateChange = function(){

									var date = new Date($scope.selectedDate);

									var month = date.getMonth()+1;
									var day = date.getDate();

									if (month < 10)
										month = "0" + month;

									if (day < 10)
										day = "0" + day;

									$scope.selectedDate = date.getFullYear() + "-" + month  + "-" + day;
									kommonitorDataExchangeService.selectedDate = $scope.selectedDate;

									$scope.$apply();
								};

								var fetchedTopicsInitially = false;
								var fetchedSpatialUnitsInitially = false;
								var fetchedGeoresourcesInitially = false;
								var fetchedIndicatorsInitially = false;

								var callScopeApplyInitially = function(){
									if(fetchedTopicsInitially && fetchedIndicatorsInitially && fetchedGeoresourcesInitially && fetchedSpatialUnitsInitially){

										$rootScope.$broadcast("loadExampleIndicatorInitially");

										$timeout(function () {
								         $("option").each(function (index, element) {
								            var text = $(element).text();
								            $(element).attr("title", text);
								         });
								    });
									}

								};

								$scope.$on("loadExampleIndicatorInitially", function (event) {

									console.log("Load an initial example indicator");

									var randomIndicatorIndex = getRandomInt(0, kommonitorDataExchangeService.availableIndicators.length - 1);

									kommonitorDataExchangeService.selectedIndicator = kommonitorDataExchangeService.availableIndicators[randomIndicatorIndex];

									$scope.onChangeSelectedIndicator();

								});

								/**
								 * Returns a random integer between min (inclusive) and max (inclusive).
								 * The value is no lower than min (or the next integer greater than min
								 * if min isn't an integer) and no greater than max (or the next integer
								 * lower than max if max isn't an integer).
								 * Using Math.round() will give you a non-uniform distribution!
								 */
								function getRandomInt(min, max) {
								    min = Math.ceil(min);
								    max = Math.floor(max);
								    return Math.floor(Math.random() * (max - min + 1)) + min;
								}

								$http({
									url: this.kommonitorDataExchangeServiceInstance.baseUrlToKomMonitorDataAPI + "/spatial-units",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										kommonitorDataExchangeService.setSpatialUnits(response.data);
										fetchedSpatialUnitsInitially = true;
										callScopeApplyInitially();

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								$http({
									url: this.kommonitorDataExchangeServiceInstance.baseUrlToKomMonitorDataAPI + "/georesources",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										kommonitorDataExchangeService.setGeoresources(response.data);
										fetchedGeoresourcesInitially = true;
										callScopeApplyInitially();

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								$http({
									url: this.kommonitorDataExchangeServiceInstance.baseUrlToKomMonitorDataAPI + "/indicators",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										kommonitorDataExchangeService.setIndicators(response.data);
										fetchedIndicatorsInitially = true;
										callScopeApplyInitially();

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								$http({
									url: this.kommonitorDataExchangeServiceInstance.baseUrlToKomMonitorDataAPI + "/topics",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										kommonitorDataExchangeService.setTopics(response.data);
										fetchedTopicsInitially = true;
										callScopeApplyInitially();

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								$http({
									url: this.kommonitorDataExchangeServiceInstance.baseUrlToKomMonitorDataAPI + "/process-scripts",
									method: "GET"
								}).then(function successCallback(response) {
										// this callback will be called asynchronously
										// when the response is available

										kommonitorDataExchangeService.setProcessScripts(response.data);

									}, function errorCallback(response) {
										// called asynchronously if an error occurs
										// or server returns response with an error status.
										//$scope.error = response.statusText;
								});

								this.addSelectedSpatialUnitToMap = function() {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									var metadata = kommonitorDataExchangeService.selectedSpatialUnit;

									var id = metadata.spatialUnitId;

									$scope.date = $scope.selectedDate;

									var dateComps = $scope.selectedDate.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									$http({
										url: this.kommonitorDataExchangeServiceInstance.baseUrlToKomMonitorDataAPI + "/spatial-units/" + id + "/" + year + "/" + month + "/" + day,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											kommonitorDataExchangeService.selectedSpatialUnit.geoJSON = geoJSON;

											kommonitorMapService.addSpatialUnitGeoJSON(kommonitorDataExchangeService.selectedSpatialUnit, $scope.date);
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

									var metadata = kommonitorDataExchangeService.selectedSpatialUnit;

									var name = metadata.spatialUnitLevel;

									var wfsUrl = metadata.wfsUrl;

									kommonitorMapService.addSpatialUnitWFS(name, wfsUrl);
									$scope.loadingData = false;
									$rootScope.$broadcast("hideLoadingIconOnMap");

								};

								this.addSelectedGeoresourceToMap = function() {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									var metadata = kommonitorDataExchangeService.selectedGeoresource;

									var id = metadata.georesourceId;

									$scope.date = $scope.selectedDate;

									var dateComps = $scope.selectedDate.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									$http({
										url: this.kommonitorDataExchangeServiceInstance.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											kommonitorDataExchangeService.selectedGeoresource.geoJSON = geoJSON;

											kommonitorMapService.addGeoresourceGeoJSON(kommonitorDataExchangeService.selectedGeoresource, $scope.date);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
									});

								};

								$scope.addSelectedIndicatorToMap = function(changeIndicator) {

									if(changeIndicator){
										$rootScope.$broadcast("DisableBalance");
										kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.selectedDate, false);
									}
									else{
										// check if balance mode is active
										if (kommonitorDataExchangeService.isBalanceChecked){
											$rootScope.$broadcast("replaceBalancedIndicator");
										}
										else{
											kommonitorMapService.replaceIndicatorGeoJSON(kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.selectedDate, false);
										}
									}
								};

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

								$scope.setupDateSliderForIndicator = function(){

									if($scope.dateSlider){
											$scope.dateSlider.destroy();
									}

									var domNode = document.getElementById("dateSlider");

									while (domNode.hasChildNodes()) {
									  domNode.removeChild(domNode.lastChild);
									}

									var availableDates = kommonitorDataExchangeService.selectedIndicator.applicableDates;
									$scope.date = availableDates[availableDates.length - 1];
									$scope.selectedDate = availableDates[availableDates.length - 1];
									kommonitorDataExchangeService.selectedDate = availableDates[availableDates.length - 1];

									$scope.datesAsMs = createDatesFromIndicatorDates(kommonitorDataExchangeService.selectedIndicator.applicableDates);

									// new Date() uses month between 0-11!
									$("#dateSlider").ionRangeSlider({
											skin: "big",
											type: "single",
											grid: true,
											values: $scope.datesAsMs,
											from: $scope.datesAsMs.length -1, // index, not the date
											force_edges: true,
											prettify: tsToDateString,
											onChange: $scope.onChangeDateSliderItem
									});

									$scope.dateSlider = $("#dateSlider").data("ionRangeSlider");
									// make sure that tha handles are properly set to man and max values
									$scope.dateSlider.update({
											from: $scope.datesAsMs.length -1 // index, not the date
									});
								};

								$scope.onChangeDateSliderItem = async function(data){

									if(!$scope.changeIndicatorWasClicked && kommonitorDataExchangeService.selectedIndicator){
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");

										console.log("Change selected date");

										//data.from is index of date!

										$scope.selectedDate = kommonitorDataExchangeService.selectedIndicator.applicableDates[data.from];
										$scope.date = $scope.selectedDate;
										kommonitorDataExchangeService.selectedDate = $scope.selectedDate;

										try{
											var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
										}
										catch(error){
											console.error(error);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
											return;
										}

										$scope.modifyOgcAndGeoJSONExport(false);

										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
										$scope.$apply();
									}
								};

								$scope.$on("DisableDateSlider", function (event) {
									if($scope.dateSlider){
										$scope.dateSlider.update({
												block: true
										});
									}
								});

								$scope.$on("EnableDateSlider", function (event) {
									if($scope.dateSlider){
										$scope.dateSlider.update({
												block: false
										});
									}
								});

								var wait = ms => new Promise((r, j)=>setTimeout(r, ms))

								$scope.tryUpdateMeasureOfValueBarForIndicator = async function(){
									var indicatorId = kommonitorDataExchangeService.selectedIndicator.indicatorId;

									if(! ($scope.date && kommonitorDataExchangeService.selectedSpatialUnit && indicatorId))
										throw Error("Not all parameters have been set up yet.");
									//
									// $scope.selectedDate = $scope.selectedDate;
									$scope.spatialUnitName = kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel;

									return await $http({
										url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/" + indicatorId + "/" + kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											kommonitorDataExchangeService.selectedIndicator.geoJSON = geoJSON;

											$rootScope.$broadcast("updateMeasureOfValueBar", $scope.date);

											// $scope.updateMeasureOfValueBar($scope.date);

											return kommonitorDataExchangeService.selectedIndicator;

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");

											return kommonitorDataExchangeService.selectedIndicator;
									});
								};

								$scope.$on("changeSpatialUnit", function(event){
									$scope.onChangeSelectedSpatialUnit();
								});

								$scope.onChangeSelectedSpatialUnit = async function(){
									if(!$scope.changeIndicatorWasClicked && kommonitorDataExchangeService.selectedIndicator){
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

										$scope.modifyOgcAndGeoJSONExport(false);

										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
										$scope.$apply();
									}
								}

								$scope.onChangeSelectedIndicator = async function(){

									if(kommonitorDataExchangeService.selectedIndicator){
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");
										$scope.changeIndicatorWasClicked = true;

										$scope.setupDateSliderForIndicator();

										if(!kommonitorDataExchangeService.selectedSpatialUnit || !kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits.includes(kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)){
											kommonitorDataExchangeService.selectedSpatialUnit = $scope.getFirstSpatialUnitForSelectedIndicator();
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

											$rootScope.$broadcast("DisableBalance");
												$scope.modifyOgcAndGeoJSONExport(true);


												$scope.loadingData = false;
												$rootScope.$broadcast("hideLoadingIconOnMap");
												$scope.changeIndicatorWasClicked = false;

												// $rootScope.$broadcast("updateDiagrams", kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.selectedDate);

												$scope.$apply();


									}
								}



								$scope.modifyOgcAndGeoJSONExport = function(changeIndicator){
									$scope.wmsUrlForSelectedIndicator = undefined;
									$scope.wmsUrlForSelectedIndicator = undefined;

									var selectedSpatialUnitName = kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel;

									for(const ogcServiceEntry of kommonitorDataExchangeService.selectedIndicator.ogcServices){
										if (ogcServiceEntry.spatialUnit === selectedSpatialUnitName){
											$scope.wmsUrlForSelectedIndicator = ogcServiceEntry.wmsUrl;
											$scope.wfsUrlForSelectedIndicator = ogcServiceEntry.wfsUrl;
											break;
										}
									};

									$scope.prepareDownloadGeoJSON();
									$rootScope.$broadcast("updateBalanceSlider", kommonitorDataExchangeService.selectedDate);
									$rootScope.$broadcast("updateIndicatorValueRangeFilter", kommonitorDataExchangeService.selectedDate);
									$scope.addSelectedIndicatorToMap(changeIndicator);


								}

								$scope.prepareDownloadGeoJSON = function(){

									console.log("removing old download button if available")
									if(document.getElementById("downloadSelectedIndicator"))
										document.getElementById("downloadSelectedIndicator").remove();

									var geoJSON_string = JSON.stringify(kommonitorDataExchangeService.selectedIndicator.geoJSON);

									var fileName = kommonitorDataExchangeService.selectedIndicator.indicatorName + "_" + kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel + "_" + $scope.selectedDate + ".geojson";

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



								$scope.$on("updateIndicatorOgcServices", function (event, indicatorWmsUrl, indicatorWfsUrl) {

															console.log('updateIndicatorOgcServices was called');

															$scope.wmsUrlForSelectedIndicator = indicatorWmsUrl;
															$scope.wfsUrlForSelectedIndicator = indicatorWfsUrl;
															$scope.$apply();

								});


							} ]
				});
