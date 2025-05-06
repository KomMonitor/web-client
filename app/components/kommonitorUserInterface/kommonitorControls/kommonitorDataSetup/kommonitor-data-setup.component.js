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
							'kommonitorDataExchangeService', '$scope', 'kommonitorMapService', '$http', '$rootScope', '__env', 
							'$timeout', 'kommonitorElementVisibilityHelperService', 'kommonitorFavService',
							function kommonitorDataSetupController(kommonitorDataExchangeService, $scope, 
								kommonitorMapService, $http, $rootScope, __env, 
								$timeout, kommonitorElementVisibilityHelperService, kommonitorFavService) {

								const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;

								$scope.indicatorNameFilter = undefined;
                $scope.kommonitorElementVisibilityHelperServiceInstance = kommonitorElementVisibilityHelperService;

								// initialize any adminLTE box widgets
								$('.box').boxWidget();

								var addClickListenerToEachCollapseTrigger = function(){

									setTimeout(function(){
										$('.list-group-item > .collapseTrigger').on('click', function() {
									    $('.glyphicon', this)
									      .toggleClass('glyphicon-chevron-right')
									      .toggleClass('glyphicon-chevron-down');

												// manage uncollapsed entries
												// var clickedTopicId = $(this).attr('id');
												// if ($scope.unCollapsedTopicIds.includes(clickedTopicId)){
												// 	var index = $scope.unCollapsedTopicIds.indexOf(clickedTopicId);
												// 	$scope.unCollapsedTopicIds.splice(index, 1);
												// }
												// else{
												// 	$scope.unCollapsedTopicIds.push(clickedTopicId);
												// }
									  });
                    
                    // addClass "clickBound" sets trigger, that listener has been added, not:.clickBound filters for that. otherwise multiple listeners will be added
                    $('.list-group-item > .indicatorFavCollapseTrigger:not(.clickBound)').addClass('clickBound').on('click', function() {
									    $('.glyphicon', this)
									      .toggleClass('glyphicon-chevron-right')
									      .toggleClass('glyphicon-chevron-down');

                      // manage entries
                      var clickedTopicId = $(this).attr('id');
                      if(document.getElementById('indicatorFavSubTopic-'+clickedTopicId).style.display=='none')
                        document.getElementById('indicatorFavSubTopic-'+clickedTopicId).style.display = 'block';
                      else
                        document.getElementById('indicatorFavSubTopic-'+clickedTopicId).style.display = 'none';
									  });
									}, 500);
								};

								$(document).ready(function() {
/* 
									addClickListenerToEachCollapseTrigger(); */
								});

								// var rangeslide = require("rangeslide");
								/*
								 * references to kommonitorDataExchangeService and wpsFormControl instances
								 */
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
								this.kommonitorDataExchangeServiceInstance.selectedServiceUrl = '';
								this.kommonitorMapServiceInstance = kommonitorMapService;

								$scope.loadingData = true;
								$scope.changeIndicatorWasClicked = false;

								$scope.dateSlider;
								$scope.datePicker;
								$scope.datesAsMs;

								$scope.selectedDate;			

                $scope.indicatorFavTopicsTree = [];

                $scope.indicatorTopicFavItems = []; 
                $scope.indicatorFavItems = [];
                
                // own temp list as fav items should remain visible in fav-tab even if deleted, until save/reload
                $scope.FavTabIndicatorTopicFavItems = []; 
                $scope.FavTabIndicatorFavItems = [];

                $scope.headlineIndicatorFavItems = [];
                $scope.baseIndicatorFavItems = [];
                $scope.favSelectionToastStatus = 0;
                $scope.showFavSelection = false;

                $scope.favSelectionToastText = ['',
                  'Favoriten-Auswahl nicht gesichert. Zum speichern hier klicken',
                  'Auswahl erfolgreich gespeichert'];

								this.addGeopackage = function(){
									this.kommonitorMapServiceInstance.addSpatialUnitGeopackage();
								}
								this.addGeoJSON = function(){
									this.kommonitorMapServiceInstance.addSpatialUnitGeoJSON();
								}

								$scope.onClickHierarchyIndicator = function(indicatorMetadata){
									kommonitorDataExchangeService.selectedIndicator = indicatorMetadata;
									$scope.onChangeSelectedIndicator(false);
								};

								// $scope.$watch('filteredSpatialUnits', function(value){
								//   if ($scope.filteredSpatialUnits) {
								//     kommonitorDataExchangeService.selectedSpatialUnit = $scope.filteredSpatialUnits[0];
								//   }
								// }, true);

                // make sure that initial fetching of availableRoles has happened
                $scope.$on("initialMetadataLoadingCompleted", function (event) {

                  $scope.indicatorFavTopicsTree = prepTopicsTree(kommonitorDataExchangeService.topicIndicatorHierarchy,0,undefined);
									addClickListenerToEachCollapseTrigger();

                  var userInfo = kommonitorFavService.getUserInfo();
                  if(userInfo.indicatorFavourites) {
                    $scope.indicatorFavItems = userInfo.indicatorFavourites;
                    $scope.FavTabIndicatorFavItems = userInfo.indicatorFavourites;
                  }
                  
                  if(userInfo.indicatorFavourites) {
                    $scope.indicatorTopicFavItems = userInfo.indicatorTopicFavourites;
                    $scope.FavTabIndicatorTopicFavItems = userInfo.indicatorTopicFavourites;
                  }

                  if(kommonitorElementVisibilityHelperService.elementVisibility.favSelection===true)
                    $scope.showFavSelection = true;
                }); 

                function prepTopicsTree(tree, level, parent) {
                  tree.forEach(entry => {
                    entry.level = level;
                    entry.parent = parent
            
                    if(entry.subTopics.length>0) {
                      let newLevel = level+1;
                      entry.subTopics = prepTopicsTree(entry.subTopics, newLevel, entry.topicId);
                    }
                  });
            
                  return tree;
                }

								this.onClickTheme = function(topicName){

									for(const topic of this.kommonitorDataExchangeServiceInstance.availableTopics){
										if(topic.topicName === topicName){
											document.getElementById(topicName).setAttribute("class", "active");
											this.kommonitorDataExchangeServiceInstance.selectedTopic = topic;
										}
										else {
											if(document.getElementById(topic.topicName)){
												document.getElementById(topic.topicName).setAttribute("class", "");
											}
										}
									};

									if(kommonitorDataExchangeService.selectedIndicator){
										kommonitorDataExchangeService.selectedIndicatorBackup = kommonitorDataExchangeService.selectedIndicator;
									}

									// $scope.$digest();
								};

								this.unsetTopic = function(){
									this.kommonitorDataExchangeServiceInstance.selectedTopic = null;

									for(const topic of this.kommonitorDataExchangeServiceInstance.availableTopics){
										if (document.getElementById(topic.topicName)){
												document.getElementById(topic.topicName).setAttribute("class", "");
										}
									};

									if(!kommonitorDataExchangeService.selectedIndicator){
										kommonitorDataExchangeService.selectedIndicator = kommonitorDataExchangeService.selectedIndicatorBackup;
									}

									// $scope.$digest();
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

								$scope.filterSpatialUnitsByIndicator = function() {
								  return function( item ) {

										try{
											var applicableSpatialUnits = kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits;
											
											return applicableSpatialUnits.some(o => o.spatialUnitName === item.spatialUnitLevel);
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
											if(applicableSpatialUnits.some(o => o.spatialUnitName === spatialUnitEntry.spatialUnitLevel)){
												result = spatialUnitEntry;
												break;
											}
										}

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

									$scope.$digest();
								};

								$scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {

									$scope.loadingData = false;
									$scope.$broadcast("hideLoadingIconOnMap");
						
								});

								// load exemplar indicator
								$scope.$on("initialMetadataLoadingCompleted", function (event) {

									console.log("Load an initial example indicator");

									if (kommonitorDataExchangeService.displayableIndicators == null || kommonitorDataExchangeService.displayableIndicators == undefined || kommonitorDataExchangeService.displayableIndicators.length === 0){
										console.error("Kein darstellbarer Indikator konnte gefunden werden.");

										kommonitorDataExchangeService.displayMapApplicationError("Kein darstellbarer Indikator konnte gefunden werden.");										
										$scope.loadingData = false;
										$scope.$broadcast("hideLoadingIconOnMap");

										return;
									}

									try{
										var indicatorIndex = undefined;

										for (var index=0; index < kommonitorDataExchangeService.displayableIndicators.length; index++){
											if (kommonitorDataExchangeService.displayableIndicators[index].indicatorId === __env.initialIndicatorId){
												if(kommonitorDataExchangeService.displayableIndicators[index].applicableDates.length > 0){
													indicatorIndex = index;
													break;
												}											
											}
										}

										if( indicatorIndex === undefined){
												for(var t=0; t < 75; t++){
													
													var randIndex = getRandomInt(0, kommonitorDataExchangeService.displayableIndicators.length - 1);
													if (kommonitorDataExchangeService.displayableIndicators[randIndex].applicableDates.length > 0){
														indicatorIndex = randIndex;
														break;
													}													
												}
										}

										if( indicatorIndex === undefined){
											throw Error();
										}

										kommonitorDataExchangeService.selectedIndicator = kommonitorDataExchangeService.displayableIndicators[indicatorIndex];
										// create Backup which is used when currently selected indicator is filtered out in select
										kommonitorDataExchangeService.selectedIndicatorBackup = kommonitorDataExchangeService.selectedIndicator;

										// set spatialUnit
										for (var spatialUnitEntry of kommonitorDataExchangeService.availableSpatialUnits){
											if(spatialUnitEntry.spatialUnitLevel === __env.initialSpatialUnitName){
												kommonitorDataExchangeService.selectedSpatialUnit = spatialUnitEntry;
												break;
											}
										}
										if(!kommonitorDataExchangeService.selectedSpatialUnit){
												kommonitorDataExchangeService.selectedSpatialUnit = $scope.getFirstSpatialUnitForSelectedIndicator();
										}

										if(! __env.centerMapInitially){
											$scope.onChangeSelectedIndicator(false);	
										}
										else{
											$scope.onChangeSelectedIndicator(true);	
										}
																			

									}
									catch(error){
										console.error("Initiales Darstellen eines Indikators ist gescheitert.");

										kommonitorDataExchangeService.displayMapApplicationError("Initiales Darstellen eines Indikators ist gescheitert.");										
										$scope.loadingData = false;
										$scope.$broadcast("hideLoadingIconOnMap");

										return;
									}

									//reinit visibility of elements due to fact that now some HTML elements are actually available
									kommonitorElementVisibilityHelperService.initElementVisibility();
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
										url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/spatial-units/" + id + "/" + year + "/" + month + "/" + day + "?" + kommonitorDataExchangeService.simplifyGeometriesParameterName + "=" + kommonitorDataExchangeService.simplifyGeometries,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											kommonitorDataExchangeService.selectedSpatialUnit.geoJSON = geoJSON;

											kommonitorMapService.addSpatialUnitGeoJSON(kommonitorDataExchangeService.selectedSpatialUnit, $scope.date);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");

										}, function errorCallback(error) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											kommonitorDataExchangeService.displayMapApplicationError(error);
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
										url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day  + "?" + kommonitorDataExchangeService.simplifyGeometriesParameterName + "=" + kommonitorDataExchangeService.simplifyGeometries,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											kommonitorDataExchangeService.selectedGeoresource.geoJSON = geoJSON;

											kommonitorMapService.addGeoresourceGeoJSON(kommonitorDataExchangeService.selectedGeoresource, $scope.date);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");

										}, function errorCallback(error) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											kommonitorDataExchangeService.displayMapApplicationError(error);
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

								function prettifyDateSliderLabels (dateAsMs) {
									return kommonitorDataExchangeService.tsToDate_withOptionalUpdateInterval(dateAsMs, kommonitorDataExchangeService.selectedIndicator.metadata.updateInterval);									
								}

								function createDatesFromIndicatorDates(indicatorDates) {

									$scope.datesAsMs = [];

									for (var index=0; index < indicatorDates.length; index++){
										// year-month-day
										var dateComponents = indicatorDates[index].split("-");
										$scope.datesAsMs.push(kommonitorDataExchangeService.dateToTS(new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]))));
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
											prettify: prettifyDateSliderLabels,
											onChange: $scope.onChangeDateSliderItem
									});

									$scope.dateSlider = $("#dateSlider").data("ionRangeSlider");
									// make sure that the handle is properly set to max value
									$scope.dateSlider.update({
											from: $scope.datesAsMs.length -1 // index, not the date
									});
								};

								$scope.setupDatePickerForIndicator = function(){

									if($scope.datePicker){
										$('#indicatorDatePicker').datepicker('destroy');
										$scope.datePicker = undefined;
									}

									var domNode = document.getElementById("indicatorDatePicker");

									while (domNode.hasChildNodes()) {
									  domNode.removeChild(domNode.lastChild);
									}

									var availableDates = kommonitorDataExchangeService.selectedIndicator.applicableDates;
									$scope.date = availableDates[availableDates.length - 1];
									$scope.selectedDate = availableDates[availableDates.length - 1];
									kommonitorDataExchangeService.selectedDate = availableDates[availableDates.length - 1];

									$scope.datePicker = $('#indicatorDatePicker').datepicker(kommonitorDataExchangeService.getLimitedDatePickerOptions(availableDates));																		
									
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

										$('#indicatorDatePicker').datepicker('update', new Date(kommonitorDataExchangeService.selectedDate));

										try{
											var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
										}
										catch(error){
											console.error(error);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
											kommonitorDataExchangeService.displayMapApplicationError(error);
											return;
										}

										$scope.modifyExports(false);

										if(kommonitorDataExchangeService.useNoDataToggle)
											$rootScope.$broadcast('applyNoDataDisplay')

										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
										$rootScope.$broadcast("selectedIndicatorDateHasChanged");
										$rootScope.$apply();
									}
								};

								$scope.$on("DisableDateSlider", function (event) {
									if($scope.dateSlider){
										$scope.dateSlider.update({
												block: true
										});
									}

									kommonitorDataExchangeService.disableIndicatorDatePicker = true;
								});

								$scope.$on("EnableDateSlider", function (event) {
									if($scope.dateSlider){
										$scope.dateSlider.update({
												block: false
										});
									}

									kommonitorDataExchangeService.disableIndicatorDatePicker = false;
								});

								var wait = ms => new Promise((r, j)=>setTimeout(r, ms));

								$scope.tryUpdateMeasureOfValueBarForIndicator = async function(){
									var indicatorId = kommonitorDataExchangeService.selectedIndicator.indicatorId;

									if(! ($scope.date && kommonitorDataExchangeService.selectedSpatialUnit && indicatorId)){
										kommonitorDataExchangeService.displayMapApplicationError("Beim Versuch, einen Beispielindikator zu laden, ist ein Fehler aufgetreten. Der Datenbankeintrag scheint eine fehlerhafte Kombination aus Raumebene und Zeitschnitt zu enthalten.");
										throw Error("Not all parameters have been set up yet.");
									}										
									//
									// $scope.selectedDate = $scope.selectedDate;
									$scope.spatialUnitName = kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel;

									var dateComps = $scope.date.split("-");
									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									return await $http({
										url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + indicatorId + "/" + kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitId + "/" + year + "/" + month + "/" + day + "?" + kommonitorDataExchangeService.simplifyGeometriesParameterName + "=" + kommonitorDataExchangeService.simplifyGeometries,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											kommonitorDataExchangeService.selectedIndicator.geoJSON = geoJSON;

											$rootScope.$broadcast("updateMeasureOfValueBar", $scope.date, kommonitorDataExchangeService.selectedIndicator);

											// $scope.updateMeasureOfValueBar($scope.date);

											return kommonitorDataExchangeService.selectedIndicator;

										}, function errorCallback(error) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											kommonitorDataExchangeService.displayMapApplicationError(error);
											$rootScope.$broadcast("hideLoadingIconOnMap");

											return kommonitorDataExchangeService.selectedIndicator;
									});
								};

								$scope.$on("changeSpatialUnit", function(event){
									$scope.onChangeSelectedSpatialUnit();
								});

								$scope.$on("changeIndicatorDate", async function(event){	
									
									if(kommonitorDataExchangeService.selectedIndicator && kommonitorDataExchangeService.selectedDate){
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");

										console.log("Change selected date");

										//data.from is index of date!
										var index = kommonitorDataExchangeService.selectedIndicator.applicableDates.indexOf(kommonitorDataExchangeService.selectedDate);									;

										$scope.dateSlider.update({
											from: index // index, not the date
										});

										$scope.date = kommonitorDataExchangeService.selectedDate;
										$scope.selectedDate = kommonitorDataExchangeService.selectedDate;

										try{
											var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
										}
										catch(error){
											console.error(error);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
											kommonitorDataExchangeService.displayMapApplicationError(error);
											return;
										}

										$scope.modifyExports(false);

										if(kommonitorDataExchangeService.useNoDataToggle)
											$rootScope.$broadcast('applyNoDataDisplay')	

										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
										$rootScope.$broadcast("selectedIndicatorDateHasChanged");
										$rootScope.$apply();
									}

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
											kommonitorDataExchangeService.displayMapApplicationError(error);
											return;
										}

										$scope.modifyExports(false);

										if(kommonitorDataExchangeService.useNoDataToggle)
											$rootScope.$broadcast('applyNoDataDisplay');

										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");
										$scope.$digest();
									}
								}

								$scope.markAssociatedHierarchyElement = function(selectedIndicatorMetadata){
									var selectedIndicatorId = selectedIndicatorMetadata.indicatorId;

									for (var indicator of kommonitorDataExchangeService.displayableIndicators) {
										$("#indicatorHierarchyElement-" + indicator.indicatorId).removeClass('active');
									}

									$("#indicatorHierarchyElement-" + selectedIndicatorId).addClass('active');
								};

								$scope.onChangeSelectedIndicator_fromAlphabeticalList = function(indicatorMetadata){
									kommonitorDataExchangeService.selectedIndicator = indicatorMetadata;
									$scope.onChangeSelectedIndicator(false);
								};

								$scope.onChangeSelectedIndicator = async function(recenterMap){

									$rootScope.$broadcast("onChangeSelectedIndicator");

									if(kommonitorDataExchangeService.selectedIndicator){

										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");
										$scope.changeIndicatorWasClicked = true;

										$scope.markAssociatedHierarchyElement(kommonitorDataExchangeService.selectedIndicator);

										kommonitorDataExchangeService.selectedIndicatorBackup = kommonitorDataExchangeService.selectedIndicator;

										$scope.setupDateSliderForIndicator();
										$scope.setupDatePickerForIndicator();

										if(!kommonitorDataExchangeService.selectedSpatialUnit || !kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits.some(o => o.spatialUnitName === kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)){
											kommonitorDataExchangeService.selectedSpatialUnit = $scope.getFirstSpatialUnitForSelectedIndicator();
										}

										try{
											var selectedIndicator = await $scope.tryUpdateMeasureOfValueBarForIndicator();
										}
										catch(error){
											console.error(error);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");
											kommonitorDataExchangeService.displayMapApplicationError(error);
											return;
										}

										$rootScope.$broadcast("DisableBalance");
										$scope.modifyExports(true);

										if(kommonitorDataExchangeService.useNoDataToggle)
											$rootScope.$broadcast('applyNoDataDisplay');

										$scope.loadingData = false;

										if(recenterMap){
											$rootScope.$broadcast("recenterMapContent");
										}

										$rootScope.$broadcast("hideLoadingIconOnMap");
										$scope.changeIndicatorWasClicked = false;

										// $rootScope.$broadcast("updateDiagrams", kommonitorDataExchangeService.selectedIndicator, kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel, $scope.selectedDate);

										$rootScope.$apply();


									}
									else{
										if (kommonitorDataExchangeService.selectedIndicatorBackup){
											kommonitorDataExchangeService.selectedIndicator = kommonitorDataExchangeService.selectedIndicatorBackup;
										}
									}

									$rootScope.$broadcast("selectedIndicatorDateHasChanged");
								}

                $scope.favTabShowTopic = function(topic) {
                  if(topicOrIndicatorInFavRecursive([topic]) || topicInFavTopBottom(topic))
                    return true;

                  return false;
                }

                $scope.favTabShowIndicator = function(indicatorId, topic) {

                  if($scope.FavTabIndicatorFavItems.includes(indicatorId) || topicInFavTopBottom(topic))
                    return true;
                  
                  return false;
                }

                function topicInFavTopBottom(topic) {

                  var parentNext = topic.parent;
                  var ret = false;

                  if($scope.FavTabIndicatorTopicFavItems.includes(topic.topicId))
                    ret = true;
                  
                  while(parentNext!==undefined && ret===false) {
                    ret = parentInFavRecursive($scope.indicatorFavTopicsTree, parentNext);
                    if(ret===false)
                      parentNext = findParentNextRecursive($scope.indicatorFavTopicsTree, parentNext);
                  }

                  return ret;
                }

                function parentInFavRecursive(tree, parentId) {
                  
                  var ret = false;
                  tree.forEach(elem => {

                    if(elem.topicId==parentId && $scope.FavTabIndicatorTopicFavItems.includes(parentId))
                        ret = true;

                    if(elem.subTopics && elem.subTopics.length>0 && ret===false) 
                      ret = parentInFavRecursive(elem.subTopics, parentId);
                  });

                  return ret;
                }

                function findParentNextRecursive(tree, parent) {

                  var parentNext = undefined;
                  tree.forEach(elem => {

                    if(elem.topicId==parent) {
                      parentNext = elem.parent;
                    }

                    if(elem.subTopics && elem.subTopics.length>0 && parentNext===undefined)
                      parentNext = findParentNextRecursive(elem.subTopics, parent);
                  });

                  return parentNext;
                }

                function topicOrIndicatorInFavRecursive(tree) {

                  let ret = false;
                  tree.forEach(elem => {

                    if($scope.FavTabIndicatorTopicFavItems.includes(elem.topicId) || $scope.FavTabIndicatorFavItems.includes(elem.indicatorId))
                      ret = true;

                    if(elem.subTopics && elem.subTopics.length>0 && ret===false)
                      ret = topicOrIndicatorInFavRecursive(elem.subTopics);

                    if(elem.indicatorData && elem.indicatorData.length>0 && ret===false)
                      ret = topicOrIndicatorInFavRecursive(elem.indicatorData);
                  });

                  return ret;
                }

                $scope.indicatorTopicFavSelected = function(topicId) {
                  return $scope.indicatorTopicFavItems.includes(topicId);
                }

                $scope.indicatorFavSelected = function(topicId) {
                  return $scope.indicatorFavItems.includes(topicId);
                }

                $scope.headlineIndicatorFavSelected = function(topicId) {
                  return $scope.indicatorFavItems.includes(topicId);
                }

                $scope.baseIndicatorFavSelected = function(topicId) {
                  return $scope.indicatorFavItems.includes(topicId);
                }

                function searchIndicatorTopicFavItemsRecursive(tree, id, selected) {

                  let ret = false;
            
                  tree.forEach(entry => {
                    if(entry.topicId==id) {
                      if(selected===true) {
                        if(!$scope.indicatorTopicFavItems.includes(id))
                          $scope.indicatorTopicFavItems.push(id);
                      } else
                        $scope.indicatorTopicFavItems = $scope.indicatorTopicFavItems.filter(e => e!=id);
            
                     // recursive selection of topics / indicators
                     /*  if(entry.subTopics.length>0)
                        checkIndicatorTopicFavItemsRecursive(entry.subTopics, selected);

                      if(entry.indicatorData.length>0)
                        checkIndicatorMetadataFavItems(entry.indicatorData, selected); */
            
                      ret = true;
                    } else {
                      let itemFound = searchIndicatorTopicFavItemsRecursive(entry.subTopics, id, selected);
                      if(itemFound===true) 
                        ret = true;
                    }
                  });
            
                  return ret;
                }
            
                function checkIndicatorTopicFavItemsRecursive(tree, selected) {
                  tree.forEach(entry => {
                    if(selected===true) {
                      if(!$scope.indicatorTopicFavItems.includes(entry.topicId))
                        $scope.indicatorTopicFavItems.push(entry.topicId);
                    } else
                      $scope.indicatorTopicFavItems = $scope.indicatorTopicFavItems.filter(e => e!=entry.topicId);
              
                    if(entry.subTopics.length>0)
                      checkIndicatorTopicFavItemsRecursive(entry.subTopics, selected);

                    if(entry.indicatorData.length>0)
                      checkIndicatorMetadataFavItems(entry.indicatorData, selected);
                  });
                }
            
                function checkIndicatorMetadataFavItems(tree, selected) {
                  tree.forEach(entry => {
                    if(selected===true) {
                      if(!$scope.indicatorFavItems.includes(entry.indicatorId))
                        $scope.indicatorFavItems.push(entry.indicatorId);
                    } else {
                      $scope.indicatorFavItems = $scope.indicatorFavItems.filter(e => e!=entry.indicatorId);
                    }
                  });
                }

                function checkBaseIndicatorFavItems(id, selected) {
                  kommonitorDataExchangeService.headlineIndicatorHierarchy.forEach(entry => {
                    if(entry.headlineIndicator.indicatorId==id) {

                      entry.baseIndicators.forEach(base => {
                        if(selected===true) {
                          if(!$scope.indicatorFavItems.includes(entry.indicatorId))
                            $scope.indicatorFavItems.push(base.indicatorId);
                        } else {
                          $scope.indicatorFavItems = $scope.indicatorFavItems.filter(e => e!=base.indicatorId);
                        }
                      });
                    }
                  });
                }

                $scope.onIndicatorTopicFavClick = function(topicId, favTab = false) {
                  if(!$scope.indicatorTopicFavItems.includes(topicId))
                    searchIndicatorTopicFavItemsRecursive(kommonitorDataExchangeService.topicIndicatorHierarchy, topicId, true);
                  else
                    searchIndicatorTopicFavItemsRecursive(kommonitorDataExchangeService.topicIndicatorHierarchy, topicId, false);

                  $scope.onHandleFavSelection(favTab);
                }

                $scope.onIndicatorFavClick = function(id, favTab = false) {
                  if(!$scope.indicatorFavItems.includes(id))
                    $scope.indicatorFavItems.push(id);
                  else
                    $scope.indicatorFavItems = $scope.indicatorFavItems.filter(e => e!=id);

                  $scope.onHandleFavSelection(favTab);
                }
                
                $scope.onHeadlineIndicatorFavClick = function(id) {
                  if(!$scope.indicatorFavItems.includes(id)) {
                    $scope.indicatorFavItems.push(id);
                    checkBaseIndicatorFavItems(id, true);
                  } else {
                    $scope.indicatorFavItems = $scope.indicatorFavItems.filter(e => e!=id);
                    checkBaseIndicatorFavItems(id, false);
                  }

                  $scope.onHandleFavSelection();
                }

                $scope.onBaseIndicatorFavClick = function(id) {
                  if(!$scope.indicatorFavItems.includes(id))
                    $scope.indicatorFavItems.push(id);
                  else
                    $scope.indicatorFavItems = $scope.indicatorFavItems.filter(e => e!=id);

                  $scope.onHandleFavSelection();
                }

                $scope.onHandleFavSelection = function(favTab = false) {

                  if(favTab===false) {
                    $scope.FavTabIndicatorTopicFavItems = $scope.indicatorTopicFavItems;
                    $scope.FavTabIndicatorFavItems = $scope.indicatorFavItems;
                  }

                  $scope.handleToastStatus(1);

                  kommonitorFavService.handleFavSelection({
                    indicatorTopicFavourites: $scope.indicatorTopicFavItems,
                    indicatorFavourites: $scope.indicatorFavItems
                  });

									addClickListenerToEachCollapseTrigger();
                }

                $scope.onSaveFavSelection = function(broadcast = true) {
                  if(broadcast===true)
                    kommonitorFavService.storeFavSelection();

                  $scope.FavTabIndicatorTopicFavItems = $scope.indicatorTopicFavItems;
                  $scope.FavTabIndicatorFavItems = $scope.indicatorFavItems;

                  $scope.handleToastStatus(2);

                  if(broadcast===true)
                    $rootScope.$broadcast("favItemsStored");
                }

                $scope.$on("favItemsStored", function (event) {
                  $scope.onSaveFavSelection(false);
                });

                $scope.handleToastStatus = function(type) {
                  
                  $scope.favSelectionToastStatus = type;

                  if(type==2) {
                    setTimeout(() => {
                      $scope.favSelectionToastStatus = 0;
                    },1000);
                  }
                }

								$scope.modifyExports = function(changeIndicator){
									kommonitorDataExchangeService.wmsUrlForSelectedIndicator = undefined;
									kommonitorDataExchangeService.wmsUrlForSelectedIndicator = undefined;

									var selectedSpatialUnitName = kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel;

									for(const ogcServiceEntry of kommonitorDataExchangeService.selectedIndicator.ogcServices){
										if (ogcServiceEntry.spatialUnit === selectedSpatialUnitName){
											kommonitorDataExchangeService.wmsUrlForSelectedIndicator = ogcServiceEntry.wmsUrl;
											kommonitorDataExchangeService.wfsUrlForSelectedIndicator = ogcServiceEntry.wfsUrl;
											break;
										}
									};

									$rootScope.$broadcast("updateBalanceSlider", kommonitorDataExchangeService.selectedDate);
									$rootScope.$broadcast("updateIndicatorValueRangeFilter", kommonitorDataExchangeService.selectedDate, kommonitorDataExchangeService.selectedIndicator);
									$scope.addSelectedIndicatorToMap(changeIndicator);

								}

								$scope.$on("updateIndicatorOgcServices", function (event, indicatorWmsUrl, indicatorWfsUrl) {

															console.log('updateIndicatorOgcServices was called');

															kommonitorDataExchangeService.wmsUrlForSelectedIndicator = indicatorWmsUrl;
															kommonitorDataExchangeService.wfsUrlForSelectedIndicator = indicatorWfsUrl;
															$scope.$digest();

								});


							} ]
				});
