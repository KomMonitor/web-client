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

								$scope.error;

								$scope.wmsNameFilter = undefined;

								$scope.customFileInputColor;

								$('#customFileInputColorDiv').colorpicker();

								// initialize colorpicker after some time
								// wait to ensure that elements ar available on DOM
								setTimeout(function() {

									var colorPickerInputs = $('.input-group.colorpicker-component')
									colorPickerInputs.colorpicker();

									// $('.input-group.colorpicker-component').each(function (index, value){
									// 	$(this).colorpicker();
									// });
								}, 3000);


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

								function dropHandler(ev) {
									$scope.error = undefined;
									$("#fileErrorAlert").hide();
									$("#fileSuccessAlert").hide();
								  console.log('File(s) dropped');

								  // Prevent default behavior (Prevent file from being opened)
								  ev.preventDefault();

								  if (ev.dataTransfer.items) {
								    // Use DataTransferItemList interface to access the file(s)
								    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
								      // If dropped items aren't files, reject them
								      if (ev.dataTransfer.items[i].kind === 'file') {
								        var file = ev.dataTransfer.items[i].getAsFile();
								        console.log('... file[' + i + '].name = ' + file.name);

												if(file.ending.toUpperCase() === "json".toUpperCase() || file.ending.toUpperCase() === "geojson".toUpperCase()){
													console.log("Potential GeoJSON file identified")
												}
												else if (file.ending.toUpperCase() === "zip".toUpperCase() || file.ending.toUpperCase() === "shp".toUpperCase()){
													console.log("Potential Shapefile file identified")
												}
												else{
													$scope.error = "";
													$("#fileErrorAlert").hide();
												}
								      }
								    }
								  } else {
								    // Use DataTransfer interface to access the file(s)
								    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
								      console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
								    }
								  }
								}

								function dragOverHandler(ev) {
								  console.log('File(s) in drop zone');

								  // Prevent default behavior (Prevent file from being opened)
								  ev.preventDefault();
								}


							} ]
				});
