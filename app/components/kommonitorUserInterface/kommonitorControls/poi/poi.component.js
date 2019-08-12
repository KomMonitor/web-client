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
								// initialize any adminLTE box widgets
								$('.box').boxWidget();

								const DATE_PREFIX = __env.indicatorDatePrefix;

								var numberOfDecimals = __env.numberOfDecimals;

								$scope.filterGeoresourcesByPoi = function(){
									return function( item ) {

										try{
											if(item.isPOI){
												return true;
											}
											return false;
										}
										catch(error){
											return false;
										}
								  };
								};

								$scope.filterPois = function(){
									return function( item ) {

										try{
											if(item.datasetName.includes("Lebensmittel")){
												return false;
											}
											return true;
										}
										catch(error){
											return true;
										}
								  };
								};

								$scope.handlePoiOnMap = function(poi){
									console.log("POI: " + poi.datasetName);

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

									$scope.currentPoiGeoresource = poiGeoresource;

									var id = poiGeoresource.georesourceId;

									$scope.date = kommonitorDataExchangeService.selectedDate;

									var dateComps = $scope.date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									await $http({
										url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											$scope.currentPoiGeoresource.geoJSON = geoJSON;

											kommonitorMapService.addPoiGeoresourceGeoJSON($scope.currentPoiGeoresource, $scope.date, useCluster);
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

									$scope.currentPoiGeoresource = poiGeoresource;

									kommonitorMapService.removePoiGeoresource($scope.currentPoiGeoresource);
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

									var url = kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + poi.georesourceId + "/" + year + "/" + month + "/" + day;
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

								$scope.handleWmsOnMap = function(dataset){
									kommonitorDataExchangeService.wmsLegendImage = undefined;
									console.log("Show WMS: " + dataset.title);

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

							} ]
				});
