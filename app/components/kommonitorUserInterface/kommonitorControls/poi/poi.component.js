angular
		.module('poi')
		.component(
				'poi',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/poi/poi.template.html",

					controller : [
							'kommonitorDataExchangeService', 'kommonitorMapService', '$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorElementVisibilityHelperService', 'kommonitorFavService',
							function indicatorRadarController(
									kommonitorDataExchangeService, kommonitorMapService, $scope, $rootScope, $http, __env, $timeout, 
                  kommonitorElementVisibilityHelperService, kommonitorFavService) {

								/*
								 * reference to kommonitorDataExchangeService instances
								 */
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
								this.kommonitorMapServiceInstance = kommonitorMapService;
								$scope.useCluster = true;
								$scope.loadingData = false;
								$scope.date;

								$scope.isCollapsed_noTopic = true;

								$scope.poiNameFilter = undefined;
								$scope.loiNameFilter = undefined;
								$scope.aoiNameFilter = undefined;

								$scope.georesourceNameFilter = {value: undefined};
								
								$scope.dateSelectionType_valueIndicator = "date_indicator";
								$scope.dateSelectionType_valueManual = "date_manual";
								$scope.dateSelectionType_valuePerDataset = "date_perDataset";
								$scope.dateSelectionType = {
									selectedDateType: $scope.dateSelectionType_valuePerDataset
								};
                
                $scope.georesourceFavTopicsTree = [];

                $scope.georesourceTopicFavItems = [];
                $scope.poiFavItems = [];

                // own temp list as fav items should remain visible in fav-tab even if deleted, until save/reload
                $scope.FavTabGeoresourceTopicFavItems = []; 
                $scope.FavTabPoiFavItems = [];

                $scope.favSelectionToastStatus = 0;
                $scope.showFavSelection = false;

                $scope.favSelectionToastText = ['',
                  'Favoriten-Auswahl nicht gesichert. Zum speichern hier klicken',
                  'Auswahl erfolgreich gespeichert'];

								$scope.selectedDate_manual = undefined;
								$('#manualDateDatepicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

								
								$scope.enabledGeoresourcesInfrastructure = __env.enabledGeoresourcesInfrastructure;
                                $scope.enabledGeoresourcesGeoservices = __env.enabledGeoresourcesGeoservices;


								$scope.isGeoresourceInfrastructureEnabled = function(id) {
                                    return $scope.enabledGeoresourcesInfrastructure.indexOf(id) !== -1;
                                }

                                $scope.isGeoresourceGeoserviceEnabled = function(id) {
                                    return $scope.enabledGeoresourcesGeoservices.indexOf(id) !== -1;
                                }

								$scope.showPOI = $scope.isGeoresourceInfrastructureEnabled('poi');
								$scope.showLOI = $scope.isGeoresourceInfrastructureEnabled('loi');
								$scope.showAOI = $scope.isGeoresourceInfrastructureEnabled('aoi');
								$scope.showWMS = $scope.isGeoresourceGeoserviceEnabled('wms');
								$scope.showWFS = $scope.isGeoresourceGeoserviceEnabled('wfs');

								$scope.showAllForTopic_null = false;

								$scope.onChangeGeoresourceKeywordFilter = function(georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS){     
									$scope.showPOI = showPOI;
									$scope.showLOI = showLOI;
									$scope.showAOI = showAOI;
									$scope.showWMS = showWMS;
									$scope.showWFS = showWFS;
									kommonitorDataExchangeService.onChangeGeoresourceKeywordFilter(georesourceNameFilter, showPOI, showLOI, showAOI, showWMS, showWFS);
								}						
								

								// initialize any adminLTE box widgets
								$timeout(function(){
									$('.box').boxWidget();
								}, 750);
								

								const DATE_PREFIX = __env.indicatorDatePrefix;

								var numberOfDecimals = __env.numberOfDecimals;

								// initialize colorpicker after some time
								// wait to ensure that elements ar available on DOM
								setTimeout(function() {

									var colorPickerInputs = $('.input-group.colorpicker-component')
									colorPickerInputs.colorpicker();

									// $('.input-group.colorpicker-component').each(function (index, value){
									// 	$(this).colorpicker();
									// });
								}, 3000);

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
                    $('.list-group-item > .georesourcesFavCollapseTrigger:not(.clickBound)').addClass('clickBound').on('click', function() {
									    $('.glyphicon', this)
									      .toggleClass('glyphicon-chevron-right')
									      .toggleClass('glyphicon-chevron-down');

                      // manage entries
                      var clickedTopicId = $(this).attr('id');
                      if(document.getElementById('georesourcesFavSubTopic-'+clickedTopicId).style.display=='none')
                        document.getElementById('georesourcesFavSubTopic-'+clickedTopicId).style.display = 'block';
                      else
                        document.getElementById('georesourcesFavSubTopic-'+clickedTopicId).style.display = 'none';
									  });
									}, 500);
								};

							/* 	$(document).ready(function() {

									addClickListenerToEachCollapseTrigger();
								}); */

                $scope.$on("initialMetadataLoadingCompleted", function (event) {
                  $scope.georesourceFavTopicsTree = prepTopicsTree(kommonitorDataExchangeService.topicGeoresourceHierarchy,0,undefined);
                  
									addClickListenerToEachCollapseTrigger();

                  var userInfo = kommonitorFavService.getUserInfo();
                  if(userInfo.georesourceFavourites) {
                    $scope.poiFavItems = userInfo.georesourceFavourites;
                    $scope.FavTabPoiFavItems = userInfo.georesourceFavourites;
                  }
                  
                  if(userInfo.georesourceTopicFavourites) {
                    $scope.georesourceTopicFavItems = userInfo.georesourceTopicFavourites;
                    $scope.FavTabGeoresourceTopicFavItems = userInfo.georesourceTopicFavourites;
                  }

                  if(kommonitorElementVisibilityHelperService.elementVisibility.favSelection===true)
                    $scope.showFavSelection = true;
                }); 

                function prepTopicsTree(tree, level, parent) {
                  tree.forEach(entry => {
                    entry.level = level;
                    entry.parent = parent;
            
                    if(entry.subTopics.length>0) {
                      let newLevel = level+1;
                      entry.subTopics = prepTopicsTree(entry.subTopics, newLevel, entry.topicId);
                    }
                  });
            
                  return tree;
                }

								$scope.onChangeShowPOI = function(){
									if ($scope.showPOI){
										$scope.showPOI = false;
									}
									else{
										$scope.showPOI = true;
									}

									setTimeout(() => {
										$scope.$digest();
									}, 500);
								};

								$scope.onChangeShowLOI = function(){
									if ($scope.showLOI){
										$scope.showLOI = false;
									}
									else{
										$scope.showLOI = true;
									}

									setTimeout(() => {
										$scope.$digest();
									}, 500);
								};

								$scope.onChangeShowAOI = function(){
									if ($scope.showAOI){
										$scope.showAOI = false;
									}
									else{
										$scope.showAOI = true;
									}

									setTimeout(() => {
										$scope.$digest();
									}, 500);
								};

								$scope.onChangeShowWMS = function(){
									if ($scope.showWMS){
										$scope.showWMS = false;
									}
									else{
										$scope.showWMS = true;
									}

									setTimeout(() => {
										$scope.$digest();
									}, 500);
								};

								$scope.onChangeShowWFS = function(){
									if ($scope.showWFS){
										$scope.showWFS = false;
									}
									else{
										$scope.showWFS = true;
									}

									setTimeout(() => {
										$scope.$digest();
									}, 500);
								};

								$scope.filterByNoTopic = function(){
									return function( item ) {

										try{
											if (! item.topicReference || item.topicReference === ""){
												return true;
											}
											if(! kommonitorDataExchangeService.referencedTopicIdExists(item.topicReference)){
												return true;
											}
											return false;
										}
										catch(error){
											return false;
										}
								  };
								};

								$scope.handleShowAllOnTopic = function(topic){
									for (let poi of topic.poiData) {
										poi.isSelected = topic.isSelected;
									}
									for (let loi of topic.loiData) {
										loi.isSelected = topic.isSelected;
									}
									for (let aoi of topic.aoiData) {
										aoi.isSelected = topic.isSelected;
									}
									// if (topic.isSelected){
									// 	topic.isSelected = false;
									// }
									// else{
									// 	topic.isSelected = true;
									// }

									var relevantDatasets = kommonitorDataExchangeService.getGeoresourceDatasets(topic, $scope.georesourceNameFilter.value, $scope.showPOI, $scope.showLOI, $scope.showAOI, $scope.showWMS, $scope.showWFS);

									if(topic === null){
										// if ($scope.showAllForTopic_null){
										// 	$scope.showAllForTopic_null = false;
										// }
										// else{
										// 	$scope.showAllForTopic_null = true;
										// }
										if($scope.showAllForTopic_null){
											relevantDatasets.forEach(element => {
												if(! element.isSelected){
													element.isSelected = true;
	
													if (element.isPOI){
														$scope.handlePoiOnMap(element);
													}
													else if (element.isLOI){
														$scope.handleLoiOnMap(element);
													}
													else if (element.isAOI){
														$scope.handleAoiOnMap(element);
													}
													else if (element.layerName){
														$scope.handleWmsOnMap(element);
													}
													else if (element.featureTypeName){
														$scope.handleWfsOnMap(element);
													}
													else{
														console.error("unknown dataset: " + element);
													}
												}										
										
											});
										}
										else{
											relevantDatasets.forEach(element => {
												if(element.isSelected){
													element.isSelected = true;
	
													if (element.isPOI){
														$scope.handlePoiOnMap(element);
													}
													else if (element.isLOI){
														$scope.handleLoiOnMap(element);
													}
													else if (element.isAOI){
														$scope.handleAoiOnMap(element);
													}
													else if (element.layerName){
														$scope.handleWmsOnMap(element);
													}
													else if (element.featureTypeName){
														$scope.handleWfsOnMap(element);
													}
													else{
														console.error("unknown dataset: " + element);
													}
												}										
										
											});
										}
									}

									else if(topic.isSelected){
										relevantDatasets.forEach(element => {
											element.isSelected = true;

											if (element.isPOI){
												$scope.handlePoiOnMap(element);
											}
											else if (element.isLOI){
												$scope.handleLoiOnMap(element);
											}
											else if (element.isAOI){
												$scope.handleAoiOnMap(element);
											}
											else if (element.layerName){
												$scope.handleWmsOnMap(element);
											}
											else if (element.featureTypeName){
												$scope.handleWfsOnMap(element);
											}
											else{
												console.error("unknown dataset: " + element);
											}								
									
										});
									}
									else if(! topic.isSelected){
										relevantDatasets.forEach(element => {
											if(element.isSelected){
												element.isSelected = false;

												if (element.isPOI){
													$scope.handlePoiOnMap(element);
												}
												else if (element.isLOI){
													$scope.handleLoiOnMap(element);
												}
												else if (element.isAOI){
													$scope.handleAoiOnMap(element);
												}
												else if (element.layerName){
													$scope.handleWmsOnMap(element);
												}
												else if (element.featureTypeName){
													$scope.handleWfsOnMap(element);
												}
												else{
													console.error("unknown dataset: " + element);
												}
											}										
									
										});
									}

								};

								$scope.onClickUseIndicatorTimestamp = function(){
									$scope.dateSelectionType.selectedDateType = $scope.dateSelectionType_valueIndicator;

									$scope.refreshSelectedGeoresources();
								};

								$scope.timeout_manualdate;

								function isNoValidDate(dateCandidate){
									var dateComps = dateCandidate.split("-");
			
									if(dateComps.length < 3){
										return true;
									}
									else if(! dateComps[0] || ! dateComps[1] || ! dateComps[2]){
										return true;
									}
									else if(isNaN(dateComps[0]) || isNaN(dateComps[1]) || isNaN(dateComps[2])){
										return true;
									}
									else if(Number(dateComps[1]) > 12 || Number(dateComps[2]) > 31){
										return true;
									}
			
									return false;
								}
			
								$scope.onChangeManualDate = function(){
									// check if date is an actual date
									// if so then refresh selected layers
			
									 // Clear the timeout if it has already been set.
									// This will prevent the previous task from executing
									// if it has been less than <MILLISECONDS>
									clearTimeout($scope.timeout_manualdate);
			
									// Make a new timeout set to go off in 1000ms (1 second)
									$scope.timeout_manualdate = setTimeout(function () {
										var dateCandidate = $scope.selectedDate_manual;
			
										if(isNoValidDate(dateCandidate)){
											return;
										}
			
										$timeout(function(){
				
											$scope.loadingData = true;
											$rootScope.$broadcast("showLoadingIconOnMap");
										});
			
										$timeout(function(){
					
											$scope.refreshSelectedGeoresources();
										}, 250);	
									}, 1000);
			
								};

								$scope.$on("selectedIndicatorDateHasChanged", function (event) {

									console.log("refresh selected georesource layers according to new date");

									// only refresh georesources if sync with indicator timestamp is selected
									if(! $scope.dateSelectionType.selectedDateType.includes($scope.dateSelectionType_valueIndicator)){
										return;
									}
						
									$timeout(function(){
				
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");
									});

									$timeout(function(){
				
										$scope.refreshSelectedGeoresources();
									}, 250);							
								});

								$scope.refreshSelectedGeoresources = function(){
									for (const georesource of kommonitorDataExchangeService.displayableGeoresources_keywordFiltered) {
										if (georesource.isSelected){

											if(georesource.isPOI){
												georesource.isSelected = false;
												$scope.handlePoiOnMap(georesource);
												georesource.isSelected = true;
												$scope.handlePoiOnMap(georesource);
											}
											else if(georesource.isLOI){
												georesource.isSelected = false;
												$scope.handleLoiOnMap(georesource);
												georesource.isSelected = true;
												$scope.handleLoiOnMap(georesource);
											}
											else if(georesource.isAOI){
												georesource.isSelected = false;
												$scope.handleAoiOnMap(georesource);
												georesource.isSelected = true;
												$scope.handleAoiOnMap(georesource);
											}											

										}
									}

									$scope.loadingData = false;
									$rootScope.$broadcast("hideLoadingIconOnMap");
								};

								$scope.onChangeSelectedDate = function(georesourceDataset){
									// only if it s already selected, we must modify the shown dataset 


									if(georesourceDataset.isSelected){
										// depending on type we must call different methods
										if (georesourceDataset.isPOI){
											$scope.removePoiLayerFromMap(georesourceDataset);
											$scope.addPoiLayerToMap(georesourceDataset, $scope.useCluster);
										}
										else if (georesourceDataset.isLOI){
											$scope.removeLoiLayerFromMap(georesourceDataset);
											$scope.addLoiLayerToMap(georesourceDataset);
										}
										else if (georesourceDataset.isAOI){
											$scope.removeAoiLayerFromMap(georesourceDataset);
											$scope.addAoiLayerToMap(georesourceDataset);
										}
										else{
											console.error("unknown dataset: " + georesourceDataset);
										}
									}
								};

								$scope.getQueryDate = function(resource){
									if ($scope.dateSelectionType.selectedDateType === $scope.dateSelectionType_valueIndicator){
										return kommonitorDataExchangeService.selectedDate;
									}
									else if($scope.dateSelectionType.selectedDateType === $scope.dateSelectionType_valueManual){
										return $scope.selectedDate_manual;
									}
									else if($scope.dateSelectionType.selectedDateType === $scope.dateSelectionType_valuePerDataset && resource.selectedDate){
										return resource.selectedDate.startDate;
									}
									else{
										return kommonitorDataExchangeService.selectedDate;
									}
								};

								$scope.handlePoiOnMap = function(poi){

									if(poi.isSelected){
										//display on Map
										$scope.addPoiLayerToMap(poi, $scope.useCluster);
									}
									else{
										// unselect topic
										for (var i = 0; i < kommonitorDataExchangeService.topicGeoresourceHierarchy.length; i++) {
											if(kommonitorDataExchangeService.topicGeoresourceHierarchy[i].topicId === poi.topicReference){
												kommonitorDataExchangeService.topicGeoresourceHierarchy[i].isSelected = false;
											}
										}
										//remove POI layer from map
										$scope.removePoiLayerFromMap(poi);
									}

								};

								$scope.addPoiLayerToMap = async function(poiGeoresource, useCluster) {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									var id = poiGeoresource.georesourceId;

									var date = $scope.getQueryDate(poiGeoresource);

									var dateComps = date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									await $http({
										url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											poiGeoresource.geoJSON = geoJSON;

											kommonitorMapService.addPoiGeoresourceGeoJSON(poiGeoresource, date, useCluster);
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

								$scope.removePoiLayerFromMap = function(poiGeoresource) {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									poiGeoresource = poiGeoresource;

									kommonitorMapService.removePoiGeoresource(poiGeoresource);
									$scope.loadingData = false;
									$rootScope.$broadcast("hideLoadingIconOnMap");

								};

								$scope.refreshPoiLayers = async function(){
									for (var poi of kommonitorDataExchangeService.displayableGeoresources_keywordFiltered){
										if (poi.isSelected){
											//remove POI layer from map
											$scope.removePoiLayerFromMap(poi);

											// remove layer and add layer again
											await $scope.addPoiLayerToMap(poi, $scope.useCluster);
										}
									}

									for (var wfs of kommonitorDataExchangeService.wfsDatasets){
										if (wfs.geometryType == 'POI' && wfs.isSelected){
											//remove POI layer from map
											kommonitorMapService.removeWfsLayerFromMap(wfs);

											// remove layer and add layer again
											var opacity = 1 - wfs.transparency;
											await kommonitorMapService.addWfsLayerToMap(wfs, opacity, $scope.useCluster);											
										}
									}
								};

								$scope.getExportLinkForPoi = function(poi){
									var date = $scope.getQueryDate(poi);

									var dateComps = date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									var url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + poi.georesourceId + "/" + year + "/" + month + "/" + day;
									var fileName = poi.datasetName + "-" + year + "-" + month + "-" + day;

									$http({
										url: url,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON_string = JSON.stringify(response.data);

											kommonitorDataExchangeService.generateAndDownloadGeoresourceZIP(poi, geoJSON_string, fileName, ".geojson", {});

										}, function errorCallback(error) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											kommonitorDataExchangeService.displayMapApplicationError(error);
											$rootScope.$broadcast("hideLoadingIconOnMap");
									});

								};




								////////// AOI
								$scope.handleAoiOnMap = function(aoi){

									if(aoi.isSelected){
										//display on Map
										$scope.addAoiLayerToMap(aoi);
									}
									else{
										// unselect topic
										for (var i = 0; i < kommonitorDataExchangeService.topicGeoresourceHierarchy.length; i++) {
											if(kommonitorDataExchangeService.topicGeoresourceHierarchy[i].topicId === aoi.topicReference){
												kommonitorDataExchangeService.topicGeoresourceHierarchy[i].isSelected = false;
											}
										}
										//remove POI layer from map
										$scope.removeAoiLayerFromMap(aoi);
									}

								};

								$scope.addAoiLayerToMap = async function(aoiGeoresource) {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									var id = aoiGeoresource.georesourceId;

									var date = $scope.getQueryDate(aoiGeoresource);

									var dateComps = date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									await $http({
										url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											aoiGeoresource.geoJSON = geoJSON;

											kommonitorMapService.addAoiGeoresourceGeoJSON(aoiGeoresource, date);
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

								$scope.removeAoiLayerFromMap = function(aoiGeoresource) {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									aoiGeoresource = aoiGeoresource;

									kommonitorMapService.removeAoiGeoresource(aoiGeoresource);
									$scope.loadingData = false;
									$rootScope.$broadcast("hideLoadingIconOnMap");

								};

								$scope.getExportLinkForAoi = function(aoi){
									var date = $scope.getQueryDate(aoi);

									var dateComps = date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									var url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + aoi.georesourceId + "/" + year + "/" + month + "/" + day;
									var fileName = aoi.datasetName + "-" + year + "-" + month + "-" + day;

									$http({
										url: url,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											var element = document.createElement('a');
											element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJSON)));
											element.setAttribute('download', fileName);

											element.style.display = 'none';
											document.body.appendChild(element);

											element.click();

											document.body.removeChild(element);

										}, function errorCallback(error) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
											kommonitorDataExchangeService.displayMapApplicationError(error);
											$rootScope.$broadcast("hideLoadingIconOnMap");
									});

								};

									////////// LOI
									$scope.handleLoiOnMap = function(loi){

										if(loi.isSelected){
											//display on Map
											$scope.addLoiLayerToMap(loi);
										}
										else{
											// unselect topic
											for (var i = 0; i < kommonitorDataExchangeService.topicGeoresourceHierarchy.length; i++) {
												if(kommonitorDataExchangeService.topicGeoresourceHierarchy[i].topicId === loi.topicReference){
													kommonitorDataExchangeService.topicGeoresourceHierarchy[i].isSelected = false;
												}
											}
											//remove POI layer from map
											$scope.removeLoiLayerFromMap(loi);
										}

									};

									$scope.addLoiLayerToMap = async function(loiGeoresource) {
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");

										var id = loiGeoresource.georesourceId;

										var date = $scope.getQueryDate(loiGeoresource);

										var dateComps = date.split("-");

										var year = dateComps[0];
										var month = dateComps[1];
										var day = dateComps[2];

										await $http({
											url: kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
											method: "GET"
										}).then(function successCallback(response) {
												// this callback will be called asynchronously
												// when the response is available
												var geoJSON = response.data;

												loiGeoresource.geoJSON = geoJSON;

												kommonitorMapService.addLoiGeoresourceGeoJSON(loiGeoresource, date);
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

									$scope.removeLoiLayerFromMap = function(loiGeoresource) {
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");

										loiGeoresource = loiGeoresource;

										kommonitorMapService.removeLoiGeoresource(loiGeoresource);
										$scope.loadingData = false;
										$rootScope.$broadcast("hideLoadingIconOnMap");

									};

									$scope.getExportLinkForLoi = function(aoi){
										var date = $scope.getQueryDate(aoi);

										var dateComps = date.split("-");

										var year = dateComps[0];
										var month = dateComps[1];
										var day = dateComps[2];

										var url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources/" + aoi.georesourceId + "/" + year + "/" + month + "/" + day;
										var fileName = aoi.datasetName + "-" + year + "-" + month + "-" + day;

										$http({
											url: url,
											method: "GET"
										}).then(function successCallback(response) {
												// this callback will be called asynchronously
												// when the response is available
												var geoJSON = response.data;

												var element = document.createElement('a');
												element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJSON)));
												element.setAttribute('download', fileName);

												element.style.display = 'none';
												document.body.appendChild(element);

												element.click();

												document.body.removeChild(element);

											}, function errorCallback(error) {
												// called asynchronously if an error occurs
												// or server returns response with an error status.
												$scope.loadingData = false;
												kommonitorDataExchangeService.displayMapApplicationError(error);
												$rootScope.$broadcast("hideLoadingIconOnMap");
										});

								};


								$scope.handleWmsOnMap = function(dataset){
									kommonitorDataExchangeService.wmsLegendImage = undefined;
									console.log("Toggle WMS: " + dataset.title);

									if(dataset.isSelected){
										//display on Map
										var opacity = 1 - dataset.transparency;
										kommonitorMapService.addWmsLayerToMap(dataset, opacity);

									}
									else{
										//remove WMS layer from map
										kommonitorMapService.removeWmsLayerFromMap(dataset);

									}
								};

								$scope.adjustWMSLayerTransparency = function(dataset){

									var opacity = 1 - dataset.transparency;

									kommonitorMapService.adjustOpacityForWmsLayer(dataset, opacity);
								};

								$scope.adjustAOILayerTransparency = function(dataset){

									var opacity = 1 - dataset.transparency;

									kommonitorMapService.adjustOpacityForAoiLayer(dataset, opacity);
								};
								
								$scope.adjustPOILayerTransparency = function(dataset){

									var opacity = 1 - dataset.transparency;

									kommonitorMapService.adjustOpacityForPoiLayer(dataset, opacity);
								};

								$scope.adjustLOILayerTransparency = function(dataset){

									var opacity = 1 - dataset.transparency;

									kommonitorMapService.adjustOpacityForLoiLayer(dataset, opacity);
								};

								$scope.handleWfsOnMap = function(dataset){
									console.log("Toggle WFS: " + dataset.title);

									if(dataset.isSelected){
										//display on Map
										var opacity = 1 - dataset.transparency;
										kommonitorMapService.addWfsLayerToMap(dataset, opacity, $scope.useCluster);

									}
									else{
										//remove WMS layer from map
										kommonitorMapService.removeWfsLayerFromMap(dataset);

									}
								};

								$scope.adjustWFSLayerTransparency = function(dataset){

									var opacity = 1 - dataset.transparency;

									kommonitorMapService.adjustOpacityForWfsLayer(dataset, opacity);
								};

								$scope.adjustWfsLayerColor = function(dataset){

									var opacity = 1 - dataset.transparency;

									kommonitorMapService.adjustColorForWfsLayer(dataset, opacity);
								};

								$scope.zoomToLayer = function(georesourceMetadata){
									$rootScope.$broadcast("zoomToGeoresourceLayer", georesourceMetadata);
								};

								$scope.toggleNoTopicHierarchy = function(){

									$scope.isCollapsed_noTopic = ! $scope.isCollapsed_noTopic;

									$scope.digest();
								}

                $scope.georesourceTopicFavSelected = function(topicId) {
                  return $scope.georesourceTopicFavItems.includes(topicId);
                }

                $scope.poiFavSelected = function(id) {

                  if(Array.isArray(id))
                    return id.some(e => $scope.poiFavItems.includes(e.georesourceId));
                  else
                    return $scope.poiFavItems.includes(id);
                }

                $scope.onPoiFavClick = function(id, favTab = false) {
                  if(!$scope.poiFavItems.includes(id))
                    $scope.poiFavItems.push(id);
                  else
                    $scope.poiFavItems = $scope.poiFavItems.filter(e => e!=id);

                  $scope.onHandleFavSelection(favTab);
                }

                $scope.onGeoresourceTopicFavClick = function(topicId, favTab = false) {
                  if(!$scope.georesourceTopicFavItems.includes(topicId))
                    searchGeoresourceTopicFavItemsRecursive(kommonitorDataExchangeService.topicGeoresourceHierarchy, topicId, true);
                  else
                    searchGeoresourceTopicFavItemsRecursive(kommonitorDataExchangeService.topicGeoresourceHierarchy, topicId, false);                  
                  
                  $scope.onHandleFavSelection(favTab);
                }

                $scope.onHandleFavSelection = function(favTab = false) {
                  
                  if(favTab===false) {
                    $scope.FavTabGeoresourceTopicFavItems = $scope.georesourceTopicFavItems;
                    $scope.FavTabPoiFavItems = $scope.poiFavItems;
                  }

                  $scope.handleToastStatus(1);

                  kommonitorFavService.handleFavSelection({
                    georesourceTopicFavourites: $scope.georesourceTopicFavItems,
                    georesourceFavourites: $scope.poiFavItems
                  });

									addClickListenerToEachCollapseTrigger();
                }
                
                $scope.onSaveFavSelection = function(broadcast = true) {
                  if(broadcast===true)
                    kommonitorFavService.storeFavSelection();

                  $scope.FavTabGeoresourceTopicFavItems = $scope.georesourceTopicFavItems;
                  $scope.FavTabPoiFavItems = $scope.poiFavItems;

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

                function searchGeoresourceTopicFavItemsRecursive(tree, id, selected) {

                  let ret = false;
            
                  tree.forEach(entry => {
                    if(entry.topicId==id) {
                      if(selected===true) {
                        if(!$scope.georesourceTopicFavItems.includes(id))
                          $scope.georesourceTopicFavItems.push(id);
                      } else
                        $scope.georesourceTopicFavItems = $scope.georesourceTopicFavItems.filter(e => e!=id);
            
                      // recursive selection of topics / georesources
                      /* if(entry.subTopics.length>0)
                        checkGeoresourceTopicFavItemsRecursive(entry.subTopics, selected);

                      if(entry.poiData.length>0 || entry.aoiData.length>0 || entry.loiData.length>0)
                        checkGeoresourceDataFavItems(entry, selected); */
            
                      ret = true;
                    } else {
                      let itemFound = searchGeoresourceTopicFavItemsRecursive(entry.subTopics, id, selected);
                      if(itemFound===true) 
                        ret = true;
                    }
                  });
            
                  return ret;
                }

                function checkGeoresourceDataFavItems(entry, selected) {

                  let types = [{ 
                      typeName:'poiData',
                      typeFav: 'poiFavItems'},
                    { 
                      typeName:'aoiData',
                      typeFav: 'poiFavItems'},
                    { 
                      typeName:'loiData',
                      typeFav: 'poiFavItems'}];

                  types.forEach(type => {
                    entry[type.typeName].forEach(typeElem => {
                      if(selected===true) {
                        if(!$scope[type.typeFav].includes(typeElem.georesourceId))
                          $scope[type.typeFav].push(typeElem.georesourceId);
                      } else 
                        $scope[type.typeFav] = $scope[type.typeFav].filter(e => e!=typeElem.georesourceId);
                    });
                  });
                }
            
                function checkGeoresourceTopicFavItemsRecursive(tree, selected) {
                  tree.forEach(entry => {
                    if(selected===true) {
                      if(!$scope.georesourceTopicFavItems.includes(entry.topicId))
                        $scope.georesourceTopicFavItems.push(entry.topicId);
                    } else
                      $scope.georesourceTopicFavItems = $scope.georesourceTopicFavItems.filter(e => e!=entry.topicId);
              
                    if(entry.subTopics.length>0)
                      checkGeoresourceTopicFavItemsRecursive(entry.subTopics, selected);

                    if(entry.poiData.length>0 || entry.aoiData.length>0 || entry.loiData.length>0)
                      checkGeoresourceDataFavItems(entry, selected);
                  });
                }

                $scope.favTabShowTopic = function(topic) {

                  if(topicOrGeoresourceInFavRecursive([topic]) || topicInFavTopBottom(topic))
                    return true;

                  return false;
                }

                function topicInFavTopBottom(topic) {

                  var parentNext = topic.parent;
                  var ret = false;

                  if($scope.FavTabGeoresourceTopicFavItems.includes(topic.topicId))
                    ret = true;

                  while(parentNext!==undefined && ret===false) {
                    // hier
                    ret = parentInFavRecursive($scope.georesourceFavTopicsTree, parentNext);
                    if(ret===false) 
                      parentNext = findParentNextRecursive($scope.georesourceFavTopicsTree, parentNext);
                  }

                  return ret;
                }

                function parentInFavRecursive(tree, parentId) {

                  var ret = false;
                  tree.forEach(elem => {
                    
                    if(elem.topicId==parentId && $scope.FavTabGeoresourceTopicFavItems.includes(parentId))
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

                $scope.FavTabShowPOIHeader = function(topic) {

                  if(topic.poiData.some(e => $scope.FavTabPoiFavItems.includes(e.georesourceId)) || 
                      topic.aoiData.some(e => $scope.FavTabPoiFavItems.includes(e.georesourceId)) || 
                      topic.loiData.some(e => $scope.FavTabPoiFavItems.includes(e.georesourceId)) || 
                      topicInFavTopBottom(topic))
                    return true;

                  return false;
                }

                $scope.FavTabShowPoi = function(topic,georesourceId) {

                  if($scope.FavTabPoiFavItems.includes(georesourceId) || topicInFavTopBottom(topic))
                    return true;

                  return false;
                }

                function topicOrGeoresourceInFavRecursive(tree) {

                  let ret = false;
                  tree.forEach(elem => {

                    if($scope.FavTabGeoresourceTopicFavItems.includes(elem.topicId) || 
                      georesourceInFavItems(elem.poiData, $scope.FavTabPoiFavItems) || 
                      georesourceInFavItems(elem.aoiData, $scope.FavTabPoiFavItems) || 
                      georesourceInFavItems(elem.loiData, $scope.FavTabPoiFavItems))
                        ret = true;

                    if(elem.subTopics && elem.subTopics.length>0 && ret===false)
                      ret = topicOrGeoresourceInFavRecursive(elem.subTopics);
/* 
                    if(elem.indicatorData && elem.indicatorData.length>0 && ret===false)
                      ret = topicOrGeoresourceInFavRecursive(elem.indicatorData); */
                  });

                  return ret;
                }

                function georesourceInFavItems(elems, favItems) {
                  return elems.filter(e => favItems.includes(e.georesourceId)).length>0 ? true : false;
                }

							} ]
				});
