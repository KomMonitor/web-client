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
								$scope.loadingData = false;
								$scope.date;

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

								$scope.handlePoiOnMap = function(poi){
									console.log("POI: " + poi.datasetName);

									if(poi.isSelected){
										//display on Map
										$scope.addPoiLayerToMap(poi);
									}
									else{
										//remove POI layer from map
										$scope.removePoiLayerFromMap(poi);
									}

								};

								$scope.addPoiLayerToMap = function(poiGeoresource) {
									$scope.loadingData = true;
									$rootScope.$broadcast("showLoadingIconOnMap");

									$scope.currentPoiGeoresource = poiGeoresource;

									var id = poiGeoresource.georesourceId;

									$scope.date = kommonitorDataExchangeService.selectedDate;

									var dateComps = $scope.date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									$http({
										url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + id + "/" + year + "/" + month + "/" + day,
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											var geoJSON = response.data;

											$scope.currentPoiGeoresource.geoJSON = geoJSON;

											kommonitorMapService.addPoiGeoresourceGeoJSON($scope.currentPoiGeoresource, $scope.date);
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


							} ]
				});
