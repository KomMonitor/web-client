angular
		.module('kommonitorLegend')
		.component(
				'kommonitorLegend',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorLegend/kommonitor-legend.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : ['$scope', '$rootScope', 'kommonitorMapService', 'kommonitorVisualStyleHelperService', 
					'kommonitorDataExchangeService', 'kommonitorDiagramHelperService', 'kommonitorElementVisibilityHelperService', 
					'kommonitorFilterHelperService', '__env', '$timeout', '$sce',
					function KommonitorLegendController($scope, $rootScope, kommonitorMapService, 
						kommonitorVisualStyleHelperService, kommonitorDataExchangeService, kommonitorDiagramHelperService, kommonitorElementVisibilityHelperService, 
						kommonitorFilterHelperService, __env, $timeout, $sce) {

						const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
						this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
						this.kommonitorMapServiceInstance = kommonitorMapService;
						this.kommonitorVisualStyleHelperServiceInstance = kommonitorVisualStyleHelperService;
						this.kommonitorElementVisibilityHelperServiceInstance = kommonitorElementVisibilityHelperService;
						this.kommonitorFilterHelperServiceInstance = kommonitorFilterHelperService;
						this.envInstance = __env;
						
						this.env = __env;
						$scope.svgString_outlierLow = $sce.trustAsHtml('<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' + __env.defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + __env.defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' + __env.defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + __env.defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' + __env.defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + __env.defaultFillOpacityForOutliers_low + ';" />Sorry, your browser does not support inline SVG.</svg>');
        				$scope.svgString_outlierHigh = $sce.trustAsHtml('<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' + __env.defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + __env.defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' + __env.defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + __env.defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' + __env.defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + __env.defaultFillOpacityForOutliers_high + ';" />Sorry, your browser does not support inline SVG.</svg>');


						// initialize any adminLTE box widgets
						$('.box').boxWidget();

						$rootScope.$on( "updateLegendDisplay", function(event, containsZeroValues, containsNegativeValues, containsNoData, containsOutliers_high, containsOutliers_low, outliers_low, outliers_high, selectedDate) {
							$scope.containsZeroValues = containsZeroValues;
							$scope.containsNegativeValues = containsNegativeValues;
							$scope.containsOutliers_high = containsOutliers_high;
							$scope.containsOutliers_low = containsOutliers_low;
							$scope.outliers_high = outliers_high;
							$scope.outliers_low = outliers_low;
							$scope.containsNoData = containsNoData;
							var dateComponents = selectedDate.split("-");
							$scope.dateAsDate = new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]));
							
						});

						$scope.onChangeIndicatorDatepickerDate = function(){
							$rootScope.$broadcast("changeIndicatorDate");
						};

						
						$scope.filterSpatialUnits = function(){
							return function( item ) {
								return kommonitorDataExchangeService.isAllowedSpatialUnitForCurrentIndicator(item);
						  };
						};

						$scope.makeOutliersLowLegendString = function(outliersArray) {
							if (outliersArray.length > 1) {
				  
							  return "(" + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(outliersArray[0]) + " - " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(outliersArray[outliersArray.length - 1]) + ")";
							}
							else {
							  return "(" + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(outliersArray[0]) + ")";
							}
						  };
				  
						  $scope.makeOutliersHighLegendString = function(outliersArray) {
							if (outliersArray.length > 1) {
							  return "(" + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(outliersArray[0]) + " - " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(outliersArray[outliersArray.length - 1]) + ")";
							}
							else {
							  return "(" + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(outliersArray[0]) + ")";
							}
						  };

						$scope.onChangeSelectedSpatialUnit = function(){

							$rootScope.$broadcast("changeSpatialUnit");

							if(__env.enableSpatialUnitNotificationSelection) {
								if(! (localStorage.getItem("hideKomMonitorSpatialUnitNotification") === "true")) {
									let selectedSpatialUnitName = kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel;
									if(__env.spatialUnitNotificationSelection.includes(selectedSpatialUnitName)) {
										$('#spatialUnitNotificationModal').modal('show');	
									}
								}
							}
						};


						$scope.showSpatialUnitNotificationModalIfEnabled = function() {
							if(__env.enableSpatialUnitNotificationSelection) {
								$('#spatialUnitNotificationModal').modal('show');	
							}
						}

						$(document).on('click', '#controlIndicatorClassifyOption_wholeTimeseries', function (e) {
							var wholeTimeseriesClassificationCheckbox = document.getElementById('controlIndicatorClassifyOption_wholeTimeseries');
							if (wholeTimeseriesClassificationCheckbox.checked) {
							  kommonitorDataExchangeService.classifyUsingWholeTimeseries = true;
							}
							else {
							  kommonitorDataExchangeService.classifyUsingWholeTimeseries = false;
							}
							$rootScope.$broadcast("restyleCurrentLayer", false);
						  }); 

						$(document).on('input change', '#indicatorTransparencyInput', function (e) {
							e.stopImmediatePropagation();
							var indicatorMetadata = kommonitorDataExchangeService.selectedIndicator;
				  
							var transparency = document.getElementById("indicatorTransparencyInput").value;
							var opacity = 1 - transparency;
				  
							$rootScope.$broadcast("adjustOpacityForIndicatorLayer", indicatorMetadata, opacity);
						  });

						$(document).on('click', '#radiojenks', function (e) {
							$rootScope.$broadcast("changeClassifyMethod", "jenks");
						  });
				  
						  $(document).on('click', '#radioquantile', function (e) {
							$rootScope.$broadcast("changeClassifyMethod", "quantile");
						  });
				  
						  $(document).on('click', '#radioequal_interval', function (e) {
							$rootScope.$broadcast("changeClassifyMethod", "equal_interval");
						  });

						$scope.onClickDownloadMetadata = async function(){
							// create PDF from currently selected/displayed indicator!
							var indicatorMetadata = kommonitorDataExchangeService.selectedIndicator;														
							var jspdf = await kommonitorDataExchangeService.createMetadataPDF_indicator(indicatorMetadata);

							var pdfName = indicatorMetadata.indicatorName + ".pdf";
  
							jspdf.setProperties({
							title: 'KomMonitor Indikatorenblatt',
							subject: pdfName,
							author: 'KomMonitor',
							keywords: 'Indikator, Metadatenblatt',
							creator: 'KomMonitor'
							});
            				jspdf.save(pdfName);
						};

						function prepareBalanceGeoJSON(geoJSON, indicatorMetadataAsBalance){
							var fromDate = indicatorMetadataAsBalance["fromDate"];
							var toDate = indicatorMetadataAsBalance["toDate"];
							var targetDate = kommonitorDataExchangeService.selectedDate;

							for (var feature of geoJSON.features) {
								var properties = feature.properties;

								var targetValue = properties[kommonitorDataExchangeService.indicatorDatePrefix + targetDate];
								properties["balance"] = targetValue;
					
								// rename all properties due to char limit in shaoefiles
								var keys = Object.keys(properties);
					
								for (var key of keys) {
								  if (key.toLowerCase().includes("date_")) {
									// from DATE_2018-01-01
									// to 20180101
									delete properties[key];
								  }
								}
					
								// replace properties with the one with new keys
								feature.properties = properties;
							  }

							  return geoJSON;
						}

						$scope.downloadIndicatorAsGeoJSON = function () {

							var fileName = kommonitorDataExchangeService.selectedIndicator.indicatorName + "_" + kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel;
				  
							var geoJSON_string;
							var geoJSON;
				  
							if(kommonitorDataExchangeService.isBalanceChecked){
								geoJSON = jQuery.extend(true, {}, kommonitorDataExchangeService.indicatorAndMetadataAsBalance.geoJSON);
								geoJSON = prepareBalanceGeoJSON(geoJSON, kommonitorDataExchangeService.indicatorAndMetadataAsBalance);							  
								geoJSON_string = JSON.stringify(geoJSON);
							  fileName += "_Bilanz" + kommonitorDataExchangeService.indicatorAndMetadataAsBalance['fromDate'] + " - " + kommonitorDataExchangeService.indicatorAndMetadataAsBalance['toDate'];
							}
							else{
							  geoJSON_string = JSON.stringify(kommonitorDataExchangeService.selectedIndicator.geoJSON);
							  fileName += "_" + kommonitorDataExchangeService.selectedDate;
							}
				  
							fileName += ".geojson";
				  
							var blob = new Blob([geoJSON_string], { type: "application/json" });
							var data = URL.createObjectURL(blob);
							//
							// $scope.indicatorDownloadURL = data;
							// $scope.indicatorDownloadName = fileName;
				  
							// var element = document.createElement('a');
							// element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoJSON)));
							// element.setAttribute('download', fileName);
							//
							// element.style.display = 'none';
							// document.body.appendChild(element);
							//
							// element.click();
							//
							// document.body.removeChild(element);
				  
							var a = document.createElement('a');
							a.download = fileName;
							a.href = data;
							a.textContent = "GeoJSON";
							a.target = "_blank";
							a.rel = "noopener noreferrer";
							a.click();
				  
							a.remove();
						  };
				  
						  $scope.downloadIndicatorAsShape = function () {
				  
							var folderName = kommonitorDataExchangeService.selectedIndicator.indicatorName + "_" + kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel;
							var polygonName = kommonitorDataExchangeService.selectedIndicator.indicatorName + "_" + kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel;
				  
							var options = {
							  folder: folderName,
							  types: {
								point: 'points',
								polygon: polygonName,
								line: 'lines'
							  }
							};
				  
							var geoJSON;
				  
							if(kommonitorDataExchangeService.isBalanceChecked){
							  geoJSON = jQuery.extend(true, {}, kommonitorDataExchangeService.indicatorAndMetadataAsBalance.geoJSON);
							  geoJSON = prepareBalanceGeoJSON(geoJSON, kommonitorDataExchangeService.indicatorAndMetadataAsBalance);
							  folderName += "_Bilanz_" + kommonitorDataExchangeService.indicatorAndMetadataAsBalance['fromDate'] + " - " + kommonitorDataExchangeService.indicatorAndMetadataAsBalance['toDate'];
							}
							else{
							  geoJSON = jQuery.extend(true, {}, kommonitorDataExchangeService.selectedIndicator.geoJSON);
							  folderName += "_" + kommonitorDataExchangeService.selectedDate;
							}
				  
							for (var feature of geoJSON.features) {
							  var properties = feature.properties;
				  
							  // rename all properties due to char limit in shaoefiles
							  var keys = Object.keys(properties);
				  
							  for (var key of keys) {
								var newKey = undefined;
								if (key.toLowerCase().includes("featureid")) {
								  newKey = "ID";
								}
								else if (key.toLowerCase().includes("featurename")) {
								  newKey = "NAME";
								}
								else if (key.toLowerCase().includes("date_")) {
								  // from DATE_2018-01-01
								  // to 20180101
								  newKey = key.split("_")[1].replace(/-|\s/g, "");
								}
								else if (key.toLowerCase().includes("startdate")) {
								  newKey = "validFrom";
								}
								else if (key.toLowerCase().includes("enddate")) {
								  newKey = "validTo";
								}
				  
								if (newKey) {
								  properties[newKey] = properties[key];
								  delete properties[key];
								}
							  }
				  
							  // replace properties with the one with new keys
							  feature.properties = properties;
							}
				  
							shpwrite.download(geoJSON, options);
						  };

						  $scope.downloadIndicatorAsCSV = function () {
				  
							var fileName = kommonitorDataExchangeService.selectedIndicator.indicatorName + "_" + kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel;
				  
							var geoJSON;
				  
							if(kommonitorDataExchangeService.isBalanceChecked){
							  geoJSON = jQuery.extend(true, {}, kommonitorDataExchangeService.indicatorAndMetadataAsBalance.geoJSON);
							  geoJSON = prepareBalanceGeoJSON(geoJSON, kommonitorDataExchangeService.indicatorAndMetadataAsBalance);
							  fileName += "_Bilanz_" + kommonitorDataExchangeService.indicatorAndMetadataAsBalance['fromDate'] + " - " + kommonitorDataExchangeService.indicatorAndMetadataAsBalance['toDate'];
							}
							else{
							  geoJSON = jQuery.extend(true, {}, kommonitorDataExchangeService.selectedIndicator.geoJSON);
							  fileName += "_" + kommonitorDataExchangeService.selectedDate;
							}

							var items = [];
				  
							for (var feature of geoJSON.features) {
							  var properties = feature.properties;
				  
							  // rename all properties due to char limit in shaoefiles
							  var keys = Object.keys(properties);
				  
							  for (var key of keys) {
								var newKey = undefined;
								if (key.toLowerCase().includes("featureid")) {
								  newKey = "ID";
								}
								else if (key.toLowerCase().includes("featurename")) {
								  newKey = "NAME";
								}
								else if (key.toLowerCase().includes("date_")) {
								  // from DATE_2018-01-01
								  // to 2018-01-01
								  newKey = key.split("_")[1];
								}
								else if (key.toLowerCase().includes("startdate")) {
								  newKey = "validFrom";
								}
								else if (key.toLowerCase().includes("enddate")) {
								  newKey = "validTo";
								}
				  
								if (newKey) {
								  properties[newKey] = properties[key];
								  delete properties[key];
								}
							  }
				  
							  // replace properties with the one with new keys
							  feature.properties = properties;

							  items.push(properties);
							}
				  
							var headers = {};

							for (const key in items[0]) {
								if (Object.hasOwnProperty.call(items[0], key)) {
									headers[key] = key;									
								}
							}

							exportCSVFile(headers, items, fileName);
						  };

						  function convertToCSV(objArray) {
							var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
							var str = '';
						
							for (var i = 0; i < array.length; i++) {
								var line = '';
								for (var index in array[i]) {
									if (line != '') line += ','
						
									line += array[i][index];
								}
						
								str += line + '\r\n';
							}
						
							return str;
						}
						
						function exportCSVFile(headers, items, fileTitle) {
							if (headers) {
								items.unshift(headers);
							}
						
							// Convert Object to JSON
							var jsonObject = JSON.stringify(items);
						
							var csv = convertToCSV(jsonObject);
						
							var exportedFilenmae = fileTitle + '.csv' || 'export.csv';
						
							var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
							if (navigator.msSaveBlob) { // IE 10+
								navigator.msSaveBlob(blob, exportedFilenmae);
							} else {
								var link = document.createElement("a");
								if (link.download !== undefined) { // feature detection
									// Browsers that support HTML5 download attribute
									var url = URL.createObjectURL(blob);
									link.setAttribute("href", url);
									link.setAttribute("download", exportedFilenmae);
									link.style.visibility = 'hidden';
									document.body.appendChild(link);
									link.click();
									document.body.removeChild(link);
								}
							}
						}
				  

					}]
				});
