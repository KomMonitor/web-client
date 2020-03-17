angular
		.module('poi')
		.component(
				'poi',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/poi/poi.template.html",

					controller : [
							'kommonitorDataExchangeService', 'kommonitorMapService', '$scope', '$rootScope', '$http', '__env',
							function indicatorRadarController(
									kommonitorDataExchangeService, kommonitorMapService, $scope, $rootScope, $http, __env) {
								/*
								 * reference to kommonitorDataExchangeService instances
								 */
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
								this.kommonitorMapServiceInstance = kommonitorMapService;
								$scope.useCluster = true;
								$scope.loadingData = false;
								$scope.date;

								$scope.poiNameFilter = undefined;
								$scope.loiNameFilter = undefined;
								$scope.aoiNameFilter = undefined;

								$scope.georesourceNameFilter = {value: undefined};

								$scope.showPOI = true;
								$scope.showLOI = true;
								$scope.showAOI = true;
								$scope.showWMS = true;
								$scope.showWFS = true;

								$scope.showAllForTopic_null = false;


								// initialize any adminLTE box widgets
								$('.box').boxWidget();

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

								$scope.onChangeShowPOI = function(){
									if ($scope.showPOI){
										$scope.showPOI = false;
									}
									else{
										$scope.showPOI = true;
									}

									setTimeout(() => {
										$scope.$apply();
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
										$scope.$apply();
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
										$scope.$apply();
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
										$scope.$apply();
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
										$scope.$apply();
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

								$scope.handlePoiOnMap = function(poi){

									if(poi.isSelected){
										//display on Map
										$scope.addPoiLayerToMap(poi, $scope.useCluster);
									}
									else{
										//remove POI layer from map
										$scope.removePoiLayerFromMap(poi);
									}

								};

								$scope.addPoiLayerToMap = async function(poiGeoresource, useCluster) {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									var id = poiGeoresource.georesourceId;

									$scope.date = kommonitorDataExchangeService.selectedDate;

									var dateComps = $scope.date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									await $http({
										// url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
											url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/allFeatures",
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											poiGeoresource.geoJSON = geoJSON;

											kommonitorMapService.addPoiGeoresourceGeoJSON(poiGeoresource, $scope.date, useCluster);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
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
									for (var poi of kommonitorDataExchangeService.availableGeoresources){
										if (poi.isSelected){
											//remove POI layer from map
											$scope.removePoiLayerFromMap(poi);

											// remove layer and add layer again
											await $scope.addPoiLayerToMap(poi, $scope.useCluster);
										}
									}
								};

								$scope.getExportLinkForPoi = function(poi){
									$scope.date = kommonitorDataExchangeService.selectedDate;

									var dateComps = $scope.date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									// var url = kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + poi.georesourceId + "/" + year + "/" + month + "/" + day;
									var url = kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + poi.georesourceId + "/allFeatures";
									var fileName = poi.datasetName + "-" + year + "-" + month + "-" + day;

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

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
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
										//remove POI layer from map
										$scope.removeAoiLayerFromMap(aoi);
									}

								};

								$scope.addAoiLayerToMap = async function(aoiGeoresource) {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									var id = aoiGeoresource.georesourceId;

									$scope.date = kommonitorDataExchangeService.selectedDate;

									var dateComps = $scope.date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									await $http({
										// url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
											url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/allFeatures",
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											aoiGeoresource.geoJSON = geoJSON;

											kommonitorMapService.addAoiGeoresourceGeoJSON(aoiGeoresource, $scope.date);
											$scope.loadingData = false;
											$rootScope.$broadcast("hideLoadingIconOnMap");

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
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
									$scope.date = kommonitorDataExchangeService.selectedDate;

									var dateComps = $scope.date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									// var url = kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + aoi.georesourceId + "/" + year + "/" + month + "/" + day;
									var url = kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + aoi.georesourceId + "/allFeatures";
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

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
											$scope.loadingData = false;
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
											//remove POI layer from map
											$scope.removeLoiLayerFromMap(loi);
										}

									};

									$scope.addLoiLayerToMap = async function(loiGeoresource) {
										$scope.loadingData = true;
										$rootScope.$broadcast("showLoadingIconOnMap");

										var id = loiGeoresource.georesourceId;

										$scope.date = kommonitorDataExchangeService.selectedDate;

										var dateComps = $scope.date.split("-");

										var year = dateComps[0];
										var month = dateComps[1];
										var day = dateComps[2];

										await $http({
											// url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
												url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/allFeatures",
											method: "GET"
										}).then(function successCallback(response) {
												// this callback will be called asynchronously
												// when the response is available
												var geoJSON = response.data;

												loiGeoresource.geoJSON = geoJSON;

												kommonitorMapService.addLoiGeoresourceGeoJSON(loiGeoresource, $scope.date);
												$scope.loadingData = false;
												$rootScope.$broadcast("hideLoadingIconOnMap");

											}, function errorCallback(response) {
												// called asynchronously if an error occurs
												// or server returns response with an error status.
												$scope.loadingData = false;
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
										$scope.date = kommonitorDataExchangeService.selectedDate;

										var dateComps = $scope.date.split("-");

										var year = dateComps[0];
										var month = dateComps[1];
										var day = dateComps[2];

										// var url = kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + aoi.georesourceId + "/" + year + "/" + month + "/" + day;
										var url = kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + aoi.georesourceId + "/allFeatures";
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

											}, function errorCallback(response) {
												// called asynchronously if an error occurs
												// or server returns response with an error status.
												$scope.loadingData = false;
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

								$scope.handleWfsOnMap = function(dataset){
									console.log("Toggle WFS: " + dataset.title);

									if(dataset.isSelected){
										//display on Map
										var opacity = 1 - dataset.transparency;
										kommonitorMapService.addWfsLayerToMap(dataset, opacity);

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

									var color = dataset.displayColor;

									kommonitorMapService.adjustColorForWfsLayer(dataset, color);
								};


							} ]
				});
