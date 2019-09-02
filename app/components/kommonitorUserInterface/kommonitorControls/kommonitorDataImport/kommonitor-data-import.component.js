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

								$scope.fileLayerError;

								$scope.wmsNameFilter = undefined;

								$scope.customFileInputColor = `#00AABB`;

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

								$scope.dropHandler = function(ev) {
									$scope.fileLayerError = undefined;
									$("#fileErrorAlert").hide();
									$("#fileSuccessAlert").hide();
								  console.log('File(s) dropped');

									try {
										// Prevent default behavior (Prevent file from being opened)
									  ev.preventDefault();

									  if (ev.dataTransfer.items) {
									    // Use DataTransferItemList interface to access the file(s)
									    for (var i = 0; i < ev.dataTransfer.items.length; i++) {
									      // If dropped items aren't files, reject them
									      if (ev.dataTransfer.items[i].kind === 'file') {
									        var file = ev.dataTransfer.items[i].getAsFile();
													$scope.processFileInput(file);

									      }
									    }
									  } else {
									    // Use DataTransfer interface to access the file(s)
									    for (var i = 0; i < ev.dataTransfer.files.length; i++) {
												var file = ev.dataTransfer.files[i];
												$scope.processFileInput(file);
									    }
									  }
									} catch (e) {
										$scope.fileLayerError = e;
										$("#fileErrorAlert").show();
									} finally {

									}

								};

								$scope.processFileInput = function(file){
									console.log('... file[' + i + '].name = ' + file.name);

									var fileEnding = file.name.split('.').pop();

									if(fileEnding.toUpperCase() === "json".toUpperCase() || fileEnding.toUpperCase() === "geojson".toUpperCase()){
										console.log("Potential GeoJSON file identified")
										$scope.processFileInput_geoJson(file);
									}
									else if (fileEnding.toUpperCase() === "zip".toUpperCase() || fileEnding.toUpperCase() === "shp".toUpperCase()){
										console.log("Potential Shapefile file identified")
										$scope.processFileInput_shape(file);
									}
									else{
										$scope.fileLayerError = "Unknown or unsupported file format";
										$("#fileErrorAlert").show();
									}
								};

								$scope.processFileInput_geoJson = function(file){
									var fileReader = new FileReader();

									fileReader.onload = function(event) {
										var geoJSON = JSON.parse(event.target.result);

										var fileDataset = {
											title: file.name,
											isSelected: true,
											transparency: 0,
											displayColor: $scope.customFileInputColor,
											type: "GeoJSON",
											content: geoJSON
										};

										kommonitorDataExchangeService.fileDatasets.push(fileDataset);
										$scope.$apply();
										// initialize colorpicker in table
										setTimeout(function() {
												// initialize colorpicker
												$('.input-group.colorpicker-component').colorpicker();
										}, 1000);

										$scope.handleFileOnMap(fileDataset);

								  };

						      // Read in the image file as a data URL.
						      fileReader.readAsText(file);
								};

								$scope.processFileInput_shape = function(file){
									var fileReader = new FileReader();

									fileReader.onload = function(event) {
										var arrayBuffer = event.target.result;

										var fileDataset = {
											title: file.name,
											isSelected: true,
											transparency: 0,
											displayColor: $scope.customFileInputColor,
											type: "shp",
											content: arrayBuffer
										};

										kommonitorDataExchangeService.fileDatasets.push(fileDataset);
										$scope.$apply();
										// initialize colorpicker in table
										setTimeout(function() {
												// initialize colorpicker
												$('.input-group.colorpicker-component').colorpicker();
										}, 1000);

										$scope.handleFileOnMap(fileDataset);

								  };

						      // Read in the image file as a data URL.
						      fileReader.readAsArrayBuffer(file);
								};

								$scope.handleFileOnMap = function(dataset){
									console.log("Toggle File Layer: " + dataset.title);

									if(dataset.isSelected){
										//display on Map
										var opacity = 1 - dataset.transparency;
										kommonitorMapService.addFileLayerToMap(dataset, opacity);
									}
									else{
										//remove WMS layer from map
										kommonitorMapService.removeFileLayerFromMap(dataset);
									}
								};

								$scope.adjustFileLayerTransparency = function(dataset){

									var opacity = 1 - dataset.transparency;

									kommonitorMapService.adjustOpacityForFileLayer(dataset, opacity);
								};

								$scope.$on("onDropFile", function (ev, dropEvent) {
									$scope.dropHandler(dropEvent);
								});

								// $scope.dragOverHandler = function(ev) {
								//   console.log('File(s) in drop zone');
								//
								//   // Prevent default behavior (Prevent file from being opened)
								//   ev.preventDefault();
								// };

								$scope.openFileDialog = function(){
									// $("#fileUploadInput").trigger("click");
									document.getElementById("fileUploadInput").click();
								};

								$(document).on('change','#fileUploadInput',function(){

									// get the file
									var files = document.getElementById('fileUploadInput').files;

									for (var i = 0; i < files.length; i++) {
										var file = files[i];
										$scope.processFileInput(file);
									}
								});

								$scope.$on("FileLayerError", function (event, errorMsg) {
									$scope.fileLayerError = errorMsg;
									$("#fileErrorAlert").show();
								});

								$scope.$on("FileLayerSuccess", function (event) {
									$scope.fileLayerError = undefined;
									$("#fileErrorAlert").hide();
									$("#fileSucessAlert").show();
								});


							} ]
				});
