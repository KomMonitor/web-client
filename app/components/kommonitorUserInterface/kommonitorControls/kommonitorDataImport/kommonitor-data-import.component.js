angular
		.module('kommonitorDataImport')
		.component(
				'kommonitorDataImport',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorDataImport/kommonitor-data-import.template.html",

					controller : [
							'kommonitorDataExchangeService', 'kommonitorMapService', '$scope', '$rootScope', '$http', '__env',
							function kommonitorDataImportController(
									kommonitorDataExchangeService, kommonitorMapService, $scope, $rootScope, $http, __env) {
								/*
								 * reference to kommonitorDataExchangeService instances
								 */
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
								this.kommonitorMapServiceInstance = kommonitorMapService;
								$scope.loadingData = false;
								$scope.date;

								$scope.wmsNameFilter = undefined;


								// initialize any adminLTE box widgets
								$('.box').boxWidget();

								const DATE_PREFIX = __env.indicatorDatePrefix;

								var numberOfDecimals = __env.numberOfDecimals;

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

								$scope.handleWfsOnMap = function(dataset){
									console.log("Show WFS: " + dataset.title);

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

							} ]
				});
