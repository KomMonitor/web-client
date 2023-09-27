angular
	.module('kommonitorDataImport')
	.component(
		'kommonitorDataImport',
		{
			templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorDataImport/kommonitor-data-import.template.html",

			controller: [
				'kommonitorDataExchangeService', 'kommonitorMapService', '$scope', '$rootScope', '$http', '__env',
				'kommonitorToastHelperService', 'kommonitorFileHelperService',
				function kommonitorDataImportController(
					kommonitorDataExchangeService, kommonitorMapService, $scope, $rootScope, $http, __env,
					kommonitorToastHelperService, kommonitorFileHelperService) {
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
					setTimeout(function () {

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

					$scope.addFileToMap = function (dataset) {
						console.log("Toggle File Layer: " + dataset.datasetName);

						kommonitorDataExchangeService.fileDatasets.push(dataset);
						kommonitorDataExchangeService.displayableGeoresources.push(dataset);
						$scope.$digest();
						// initialize colorpicker in table
						setTimeout(function () {
							// initialize colorpicker
							$('.input-group.colorpicker-component').colorpicker();
						}, 350);

						$scope.toggleDataLayer(dataset);
					};

					$scope.toggleDataLayer = function(dataset){
						if (dataset.isSelected) {
							//display on Map
							var opacity = 1 - dataset.transparency;
							kommonitorMapService.addFileLayerToMap(dataset, opacity);
						}
						else {
							//remove WMS layer from map
							kommonitorMapService.removeFileLayerFromMap(dataset);
						}
					}

					$scope.$on("GeoJSONFromFileFinished", function(event, tmpKommonitorGeoresource){
						$scope.addFileToMap(tmpKommonitorGeoresource);
					});

					$scope.dropHandler = function (ev) {
						$scope.fileLayerError = undefined;

						try {
							// Prevent default behavior (Prevent file from being opened)
							ev.preventDefault();

							if (ev.dataTransfer.items) {
								// Use DataTransferItemList interface to access the file(s)
								for (var i = 0; i < ev.dataTransfer.items.length; i++) {
									// If dropped items aren't files, reject them
									if (ev.dataTransfer.items[i].kind === 'file') {
										var file = ev.dataTransfer.items[i].getAsFile();
										kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, $scope.customFileInputColor);										
									}
								}
							} else {
								// Use DataTransfer interface to access the file(s)
								for (var i = 0; i < ev.dataTransfer.files.length; i++) {
									var file = ev.dataTransfer.files[i];
									kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, $scope.customFileInputColor);									
								}
							}
						} catch (e) {
							$scope.fileLayerError = e;
							console.error(e);
							kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Dateiverarbeitung", $scope.fileLayerError);
						} finally {

						}

					};

					$scope.adjustFileLayerTransparency = function (dataset) {

						var opacity = 1 - dataset.transparency;

						kommonitorMapService.adjustOpacityForFileLayer(dataset, opacity);
					};

					$scope.adjustFileLayerColor = function (dataset) {

						var color = dataset.displayColor;

						kommonitorMapService.adjustColorForFileLayer(dataset, color);
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

					$scope.openFileDialog = function () {
						// $("#fileUploadInput").trigger("click");
						document.getElementById("fileUploadInput").click();
					};

					$(document).on('change', '#fileUploadInput', function () {

						// get the file
						var files = document.getElementById('fileUploadInput').files;

						for (var i = 0; i < files.length; i++) {
							var file = files[i];
							kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, $scope.customFileInputColor);							
						}
					});

					$scope.$on("FileLayerError", function (event, errorMsg, dataset) {
						$scope.fileLayerError = errorMsg;
						kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler in Dateiverarbeitung", $scope.fileLayerError);

						// remove element from fileDatasets
						for (var i = 0; i < kommonitorDataExchangeService.fileDatasets.length; i++) {
							if (kommonitorDataExchangeService.fileDatasets[i] === dataset) {
								kommonitorDataExchangeService.fileDatasets.splice(i, 1);
								break;
							}
						}
					});

					$scope.$on("FileLayerSuccess", function (event, dataset) {
						$scope.fileLayerError = undefined;
						kommonitorToastHelperService.displaySuccessToast_upperLeft("Datei erfolgreich importiert", dataset.title);
					});

					$scope.removeDataLayer = function(dataset){

						if(dataset.isSelected){
							kommonitorMapService.removeFileLayerFromMap(dataset);
						}

						for (let i=0; i < kommonitorDataExchangeService.fileDatasets.length; i++) {
							if (kommonitorDataExchangeService.fileDatasets[i].datasetName == dataset.datasetName){
								kommonitorDataExchangeService.fileDatasets.splice(i, 1);
							}
						}
						for (let i=0; i < kommonitorDataExchangeService.displayableGeoresources.length; i++) {
							if (kommonitorDataExchangeService.displayableGeoresources[i].datasetName == dataset.datasetName){
								kommonitorDataExchangeService.displayableGeoresources.splice(i, 1);
							}
						}
					}


				}]
		});
