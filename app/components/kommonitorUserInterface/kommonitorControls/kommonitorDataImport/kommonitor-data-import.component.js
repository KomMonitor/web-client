angular
	.module('kommonitorDataImport')
	.component(
		'kommonitorDataImport',
		{
			templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorDataImport/kommonitor-data-import.template.html",

			controller: [
				'kommonitorDataExchangeService', 'kommonitorMapService', '$scope', '$rootScope', '$http', '__env',
				'kommonitorToastHelperService', 'kommonitorFileHelperService', 'kommonitorGeocoderHelperService',
				function kommonitorDataImportController(
					kommonitorDataExchangeService, kommonitorMapService, $scope, $rootScope, $http, __env,
					kommonitorToastHelperService, kommonitorFileHelperService, kommonitorGeocoderHelperService) {
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
					$scope.customFileInputMarkerColor = kommonitorDataExchangeService.availablePoiMarkerColors[0];

					$scope.tmpKommonitorGeoresource_table;
					$scope.tableProcessType;
					$scope.tableProcessTypes = [
						{
							displayName: "Latitude und Longitude Spalten",
							apiName: "latLon"
						},
						{
							displayName: "Adressen - Ort, PLZ, Strasse",
							apiName: "address"
						}
					]

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

					$scope.onChangeCustomMarkerColor = function(markerColor){
						$scope.customFileInputMarkerColor = markerColor;

						// setTimeout(function () {
						// 	$scope.$digest();
						// }, 150);
					}

					$scope.addUniqueFileToMap = function (dataset) {
						console.log("Toggle File Layer: " + dataset.datasetName);

						let clone = JSON.parse(JSON.stringify(dataset));	
						if(dataset.type == "CSV"){
							clone.datasetName = clone.datasetName + "_" + $scope.tableProcessType.apiName;
						}

						if($scope.fileWithSameNameAlreadyImported(clone)){
							kommonitorToastHelperService.displayErrorToast_upperLeft("Datei mit gleichem Namen bereits vorhanden.", "Import der Datei abgebrochen.");
							return;
						}

						if(dataset.geoJSON.features.length == 0){
							kommonitorToastHelperService.displayErrorToast_upperLeft("Datensatz kann nicht als Layer geladen werden.", "Keine Features im Datensatz.");
							return;
						}

						kommonitorToastHelperService.displaySuccessToast_upperLeft("Datei erfolgreich importiert. Inhalt wird in Karte geladen", clone.title);

						$scope.toggleDataLayer(clone);
					};

					$scope.fileWithSameNameAlreadyImported = function(clone){
						for (let i = 0; i < kommonitorDataExchangeService.fileDatasets.length; i++) {
							if (kommonitorDataExchangeService.fileDatasets[i].datasetName == clone.datasetName) {
								return true;
							}
						}

						return false;
					}

					$scope.toggleDataLayer = function (dataset) {
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

					$scope.refreshDataLayer = function (dataset) {
						if (dataset.isSelected) {
							kommonitorMapService.removeFileLayerFromMap(dataset);
							//display on Map
							var opacity = 1 - dataset.transparency;
							kommonitorMapService.addFileLayerToMap(dataset, opacity);
						}
					}

					$scope.$on("GeoJSONFromFileFinished", function (event, tmpKommonitorGeoresource) {

						try {
							// init feature NAME and ID fields
							tmpKommonitorGeoresource = $scope.initSpecialFields(tmpKommonitorGeoresource);

							$scope.onChangeIdProperty(tmpKommonitorGeoresource);
							$scope.onChangeNameProperty(tmpKommonitorGeoresource);

							$scope.addUniqueFileToMap(tmpKommonitorGeoresource);
						} catch (error) {
							console.error(error);
							$scope.loadingData = false;
							kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler beim Laden der CSV-Datei", error);
						}						
					});

					$scope.initSpecialFields = function (tmpKommonitorGeoresource) {
						// init feature NAME and ID fields
						tmpKommonitorGeoresource.ID_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
						tmpKommonitorGeoresource.NAME_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
						tmpKommonitorGeoresource.LON_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
						tmpKommonitorGeoresource.LAT_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
						tmpKommonitorGeoresource.CITY_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
						tmpKommonitorGeoresource.POSTCODE_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];
						tmpKommonitorGeoresource.STREET_ATTRIBUTE = tmpKommonitorGeoresource.featureSchema[0];

						for (const property of tmpKommonitorGeoresource.featureSchema) {
							if (property.toLowerCase().includes("id")) {
								tmpKommonitorGeoresource.ID_ATTRIBUTE = property;
							}
							if (property.toLowerCase().includes("name")) {
								tmpKommonitorGeoresource.NAME_ATTRIBUTE = property;
							}
							if (property.toLowerCase().includes("lon") || property.toLowerCase().includes("rechts") || property.toLowerCase().includes("x")) {
								tmpKommonitorGeoresource.LON_ATTRIBUTE = property;
							}
							if (property.toLowerCase().includes("lat") || property.toLowerCase().includes("hoch") || property.toLowerCase().includes("y")) {
								tmpKommonitorGeoresource.LAT_ATTRIBUTE = property;
							}
							if (property.toLowerCase().includes("stadt") || property.toLowerCase().includes("ort") || property.toLowerCase().includes("gemeinde")) {
								tmpKommonitorGeoresource.CITY_ATTRIBUTE = property;
							}
							if (property.toLowerCase().includes("plz") || property.toLowerCase().includes("post") || property.toLowerCase().includes("leit")) {
								tmpKommonitorGeoresource.POSTCODE_ATTRIBUTE = property;
							}
							if (property.toLowerCase().includes("str") || property.toLowerCase().includes("adr") || property.toLowerCase().includes("addr")) {
								tmpKommonitorGeoresource.STREET_ATTRIBUTE = property;
							}
						}

						return tmpKommonitorGeoresource;
					}

					$scope.$on("CSVFromFileFinished", function (event, tmpKommonitorGeoresource) {
						try {
							tmpKommonitorGeoresource = $scope.initSpecialFields(tmpKommonitorGeoresource)

							$scope.tmpKommonitorGeoresource_table = tmpKommonitorGeoresource;

							kommonitorToastHelperService.displayInfoToast_upperLeft("CSV-Datei erkannt", "Weitere Konfiguration erforderlich");

							$scope.$digest();
						} catch (error) {
							console.error(error);
							$scope.loadingData = false;
							kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler beim Laden der CSV-Datei", error);
						}						
					});

					$scope.loadCSV_latLon = function () {
						try {
							let geoJSON = $scope.makeGeoJSONFromCSVRows_latLon($scope.tmpKommonitorGeoresource_table);

							$scope.tmpKommonitorGeoresource_table.geoJSON = geoJSON;

							$scope.onChangeIdProperty($scope.tmpKommonitorGeoresource_table);
							$scope.onChangeNameProperty($scope.tmpKommonitorGeoresource_table);

							$scope.addUniqueFileToMap($scope.tmpKommonitorGeoresource_table);
						} catch (error) {
							console.error(error);
							$scope.loadingData = false;
							kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler beim Laden der CSV-Datei", error);
						}
					}

					$scope.loadCSV_address_city_postcode_street = async function () {
						try {
							$scope.loadingData = true;
							setTimeout(function () {
								$scope.$digest();
							}, 150);
							let cityProperty = $scope.tmpKommonitorGeoresource_table.CITY_ATTRIBUTE;
							let postcodeProperty = $scope.tmpKommonitorGeoresource_table.POSTCODE_ATTRIBUTE;
							let streetProperty = $scope.tmpKommonitorGeoresource_table.STREET_ATTRIBUTE;
							let resultFeaturesArray = await kommonitorGeocoderHelperService.geocodeCSVRows($scope.tmpKommonitorGeoresource_table.dataRows, cityProperty, postcodeProperty, streetProperty);

							$scope.tmpKommonitorGeoresource_table.geoJSON = $scope.makeFeatureCollection($scope.tmpKommonitorGeoresource_table.dataRows, resultFeaturesArray);
							$scope.tmpKommonitorGeoresource_table.dataRows_notGeocoded = $scope.identifyNonGeocodedDataRows($scope.tmpKommonitorGeoresource_table.dataRows, resultFeaturesArray);

							$scope.tmpKommonitorGeoresource_table.isGeocodedDataset = true;
							// set markerColor to orange --> guarantees, that gocode result are split up in two categories
							// green = high accuracy; orange = medium accuracy
							$scope.tmpKommonitorGeoresource_table.poiMarkerColor = "orange";

							kommonitorToastHelperService.displaySuccessToast_upperLeft($scope.tmpKommonitorGeoresource_table.geoJSON.features.length + " von " + $scope.tmpKommonitorGeoresource_table.dataRows.length + " Adressen geokodiert",
								"Objekteigenschaften 'geocoderank' und 'geocodedesc' bewerten Genauigkeit");

							if($scope.tmpKommonitorGeoresource_table.dataRows_notGeocoded.length > 0){
								kommonitorToastHelperService.displayWarningToast_upperLeft($scope.tmpKommonitorGeoresource_table.dataRows_notGeocoded.length + " von " + $scope.tmpKommonitorGeoresource_table.dataRows.length + " Adressen nicht geokodiert");
							}							

							$scope.loadingData = false;
							
							$scope.onChangeIdProperty($scope.tmpKommonitorGeoresource_table);
							$scope.onChangeNameProperty($scope.tmpKommonitorGeoresource_table);

							$scope.addUniqueFileToMap($scope.tmpKommonitorGeoresource_table);
						} catch (error) {
							console.error(error);
							$scope.loadingData = false;
							kommonitorToastHelperService.displayErrorToast_upperLeft("Fehler beim Laden der CSV-Datei", error);
						}
					}

					$scope.makeFeatureCollection = function (dataRows, resultFeaturesArray) {
						let featureCollection = {
							"type": "FeatureCollection",
							"features": []
						}

						for (let index = 0; index < resultFeaturesArray.length; index++) {
							const singleFeatureArray = resultFeaturesArray[index];
							let row = dataRows[index];

							if (singleFeatureArray[0]) {

								singleFeatureArray[0].type = "Feature";

								// add prefix "geocode_" to all properties of geocoding result
								for (const property_old in singleFeatureArray[0].properties) {
									singleFeatureArray[0].properties["geocoder_" + property_old] = singleFeatureArray[0].properties[property_old]

									delete singleFeatureArray[0].properties[property_old];
								}
								// add lat and lon coord as properties
								singleFeatureArray[0].properties["geocoder_lon"] = singleFeatureArray[0].geometry.coordinates[0];
								singleFeatureArray[0].properties["geocoder_lat"] = singleFeatureArray[0].geometry.coordinates[1];

								// now add all original properties of dataRow
								for (const key in row) {
									if (Object.hasOwnProperty.call(row, key)) {
										singleFeatureArray[0].properties[key] = row[key];
									}
								}

								featureCollection.features.push(singleFeatureArray[0]);
							}
						}

						return featureCollection;
					}

					$scope.identifyNonGeocodedDataRows = function (dataRows, resultFeaturesArray) {
						let nonGeocodedDataRows = [];

						for (let index = 0; index < resultFeaturesArray.length; index++) {
							const singleFeatureArray = resultFeaturesArray[index];

							if (!singleFeatureArray[0]) {
								nonGeocodedDataRows.push(dataRows[index]);
							}
						}

						return nonGeocodedDataRows;
					}

					$scope.makeGeoJSONFromCSVRows_latLon = function (kommonitorGeoresource) {
						let geoJSON = {
							"type": "FeatureCollection",
							"features": []
						};

						for (const row of kommonitorGeoresource.dataRows) {
							if (row[kommonitorGeoresource.LON_ATTRIBUTE] && row[kommonitorGeoresource.LAT_ATTRIBUTE]) {
								let feature = {
									"type": "Feature",
									"geometry": {
										"type": "Point",
										"coordinates": [Number(row[kommonitorGeoresource.LON_ATTRIBUTE]), Number(row[kommonitorGeoresource.LAT_ATTRIBUTE])]
									},
									"properties": row
								};

								geoJSON.features.push(feature);
							}
						}

						return geoJSON;
					}

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
										kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, $scope.customFileInputColor, $scope.customFileInputMarkerColor);
									}
								}
							} else {
								// Use DataTransfer interface to access the file(s)
								for (var i = 0; i < ev.dataTransfer.files.length; i++) {
									var file = ev.dataTransfer.files[i];
									kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, $scope.customFileInputColor, $scope.customFileInputMarkerColor);
								}
							}
						} catch (e) {
							$scope.fileLayerError = e;
							$scope.loadingData = false;
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

					$scope.adjustFileLayerMarkerColor = function(dataset, markerColor){
						dataset.poiMarkerColor = markerColor.colorName;

						$scope.refreshDataLayer(dataset);
					}

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
							kommonitorFileHelperService.transformFileToKomMonitorGeoressource(file, $scope.customFileInputColor, $scope.customFileInputMarkerColor);
						}
					});

					$scope.$on("FileLayerError", function (event, errorMsg, dataset) {
						$scope.fileLayerError = errorMsg;
						$scope.loadingData = false;
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
						$scope.loadingData = false;						
						
						//remove any old entry with the same name to prevent dupes
						$scope.removeDataLayerFromOverviewTables(dataset);
						
						kommonitorDataExchangeService.fileDatasets.push(JSON.parse(JSON.stringify(dataset)));
						kommonitorDataExchangeService.displayableGeoresources.push(dataset);

						setTimeout(function () {
							$scope.$digest();

							setTimeout(function () {
								// initialize colorpicker
								$('.input-group.colorpicker-component').colorpicker();
							}, 350);
						}, 350);
					});

					$scope.removeDataLayer = function (dataset) {

						if (dataset.isSelected) {
							kommonitorMapService.removeFileLayerFromMap(dataset);
						}

						$scope.removeDataLayerFromOverviewTables(dataset);
					}

					$scope.removeDataLayerFromOverviewTables = function (dataset) {

						for (let i = 0; i < kommonitorDataExchangeService.fileDatasets.length; i++) {
							if (kommonitorDataExchangeService.fileDatasets[i].datasetName == dataset.datasetName) {
								kommonitorDataExchangeService.fileDatasets.splice(i, 1);
							}
						}
						for (let i = 0; i < kommonitorDataExchangeService.displayableGeoresources.length; i++) {
							if (kommonitorDataExchangeService.displayableGeoresources[i].datasetName == dataset.datasetName) {
								kommonitorDataExchangeService.displayableGeoresources.splice(i, 1);
							}
						}
					}

					$scope.onChangeNameProperty = function (dataset) {
						// ensure it is a string
						for (const feature of dataset.geoJSON.features) {
							feature.properties[__env.FEATURE_NAME_PROPERTY_NAME] = "" + feature.properties[dataset.NAME_ATTRIBUTE]
						}

						// $scope.refreshDataLayer(dataset);
					}

					$scope.onChangeIdProperty = function (dataset) {
						// ensure it is a string
						for (const feature of dataset.geoJSON.features) {
							feature.properties[__env.FEATURE_ID_PROPERTY_NAME] = "" + feature.properties[dataset.ID_ATTRIBUTE]
						}

						// $scope.refreshDataLayer(dataset);
					}

					$scope.downloadDataLayer = function (dataset) {
						let geoJSON = JSON
							.stringify(dataset.geoJSON);

						var fileName = dataset.datasetName + '_export.json';

						var blob = new Blob([geoJSON], {
							type: 'application/json'
						});
						var data = URL.createObjectURL(blob);

						var a = document.createElement('a');
						a.download = fileName;
						a.href = data;
						a.textContent = "JSON";
						a.target = "_self";
						a.rel = "noopener noreferrer";
						a.click()
						a.remove();
					}

					$scope.downloadGeocodedDataRowsAsGeoJSON_highAccuracy = function(dataset){
						let filteredGeoJSON = JSON.parse(JSON.stringify(dataset.geoJSON));
						filteredGeoJSON.features = filteredGeoJSON.features.filter(feature => feature.properties["geocoder_geocoderank"] == 2);
						let geoJSON = JSON
							.stringify(filteredGeoJSON);

						var fileName = dataset.datasetName + '_export.json';

						var blob = new Blob([geoJSON], {
							type: 'application/json'
						});
						var data = URL.createObjectURL(blob);

						var a = document.createElement('a');
						a.download = fileName;
						a.href = data;
						a.textContent = "JSON";
						a.target = "_self";
						a.rel = "noopener noreferrer";
						a.click()
						a.remove();
					}

					$scope.downloadNonGeocodedDataRowsAsCSV = function (dataset) {
						// let conf = {
						// 	quotes: false, //or array of booleans
						// 	quoteChar: '"',
						// 	escapeChar: '"',
						// 	delimiter: ";",
						// 	header: true,
						// 	newline: "\r\n",
						// 	skipEmptyLines: true, //other option is 'greedy', meaning skip delimiters, quotes, and whitespace.
						// 	columns: null //or array of strings
						// };
						var csv = Papa.unparse(dataset.dataRows_notGeocoded, {delimiter: ";", skipEmptyLines: true});

						var fileName = dataset.datasetName + '_nicht_geokodiert.csv';

						var blob = new Blob([csv], {
							type: 'text/csv'
						});
						var data = URL.createObjectURL(blob);

						var a = document.createElement('a');
						a.download = fileName;
						a.href = data;
						a.textContent = "CSV";
						a.target = "_self";
						a.rel = "noopener noreferrer";
						a.click()
						a.remove();

					}
				}]
		});
