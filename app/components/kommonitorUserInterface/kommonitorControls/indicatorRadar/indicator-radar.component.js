angular
	.module('indicatorRadar')
	.component(
		'indicatorRadar',
		{
			templateUrl: "components/kommonitorUserInterface/kommonitorControls/indicatorRadar/indicator-radar.template.html",

			controller: [
				'kommonitorDataExchangeService', 'kommonitorDiagramHelperService', '$scope', '$rootScope', '$http', '__env',
				function indicatorRadarController(
					kommonitorDataExchangeService, kommonitorDiagramHelperService, $scope, $rootScope, $http, __env) {
					/*
					 * reference to kommonitorDataExchangeService instances
					 */
					this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
					this.kommonitorDiagramHelperServiceInstance = kommonitorDiagramHelperService;
					// initialize any adminLTE box widgets
					$('.box').boxWidget();

					$(window).on('resize', function () {
						if ($scope.radarChart != null && $scope.radarChart != undefined) {
							$scope.radarChart.resize();
						}
					});

					$scope.$on("resizeDiagrams", function (event) {

						setTimeout(function () {
							if ($scope.radarChart != null && $scope.radarChart != undefined) {
								$scope.radarChart.resize();
							}
						}, 350);
					});

					const DATE_PREFIX = __env.indicatorDatePrefix;

					$scope.indicatorNameFilter = undefined;

					$scope.eventsRegistered = false;

					var numberOfDecimals = __env.numberOfDecimals;

					$scope.setupCompleted = false;

					$scope.date;
					$scope.spatialUnitName;

					$scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) {

						// if the layer is just restyled (i.e. due to change of measureOfValue)
						// then we do not need to costly update the radar diagram
						if (justRestyling) {
							return;
						}

						console.log("updating radar diagram");

						$scope.setupCompleted = false;

						updateRadarChart(indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date);

						$rootScope.$broadcast("preserveHighlightedFeatures");

					});

					// RADAR CHART TIME SERIES FUNCTION
					var updateRadarChart = async function (indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date) {
						// based on prepared DOM, initialize echarts instance
						$scope.date = date;
						$scope.spatialUnitName = spatialUnitName;

						if (!$scope.radarChart)
							$scope.radarChart = echarts.init(document.getElementById('radarDiagram'));
						else {
							// explicitly kill and reinstantiate radar diagram to avoid zombie states on spatial unit change
							$scope.radarChart.dispose();
							$scope.radarChart = echarts.init(document.getElementById('radarDiagram'));
							kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime = new Array();
						}

						await $scope.radarChart.showLoading();

						kommonitorDiagramHelperService.setupIndicatorPropertiesForCurrentSpatialUnitAndTime();

						modifyRadarContent(kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
					};

					var wait = ms => new Promise((r, j) => setTimeout(r, ms));

					$scope.$on("allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed", async function (event) {

						await wait(130);
						$scope.setupCompleted = true;
						$scope.$apply();
					});

					var modifyRadarContent = async function (indicatorsForRadar) {
						var indicatorArrayForRadarChart = new Array();
						var defaultSeriesValueArray = new Array();

						var sampleProperties = null;

						for (var i = 0; i < indicatorsForRadar.length; i++) {
							if (indicatorsForRadar[i].isSelected) {

								await kommonitorDiagramHelperService.fetchIndicatorPropertiesIfNotExists(i);

								// make object to hold indicatorName, max value and average value
								var indicatorProperties = indicatorsForRadar[i].indicatorProperties;
								sampleProperties = indicatorsForRadar[i].indicatorProperties;

								var closestApplicableTimestamp = kommonitorDiagramHelperService.findClostestTimestamForTargetDate(indicatorsForRadar[i], $scope.date);
								indicatorsForRadar[i].closestTimestamp = closestApplicableTimestamp;

								var sample = indicatorProperties[0];
								var maxValue = sample[DATE_PREFIX + closestApplicableTimestamp];
								var minValue = sample[DATE_PREFIX + closestApplicableTimestamp];
								var valueSum = 0;

								for (var indicatorPropertyInstance of indicatorProperties) {
									// for average only apply real numeric values
									if (!kommonitorDataExchangeService.indicatorValueIsNoData(indicatorPropertyInstance[DATE_PREFIX + closestApplicableTimestamp])) {
										var value = kommonitorDataExchangeService.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, closestApplicableTimestamp)
										valueSum += value;

										if (value > maxValue)
											maxValue = value;

										if (value < minValue)
											minValue = value;
									}
								}

								if (minValue == null) {
									minValue = 0;
								}

								if (maxValue == null) {
									maxValue = 1;
								}

								// IT MIGHT HAPPEN THAT AN INDICATOR IS INSPECTED THAT DOES NOT SUPPORT THE DATE
								// HENCE ONLY ADD VALUES TO DEFAULT IF THEY SHOW MEANINGFUL VALUES
								// if(valueSum != null){
								indicatorArrayForRadarChart.push({
									name: indicatorsForRadar[i].indicatorMetadata.indicatorName,
									unit: indicatorsForRadar[i].indicatorMetadata.unit,
									max: maxValue,
									min: minValue
								});

								defaultSeriesValueArray.push(Number(Number(valueSum / indicatorProperties.length).toFixed(numberOfDecimals)));
								// }
							}

						}

						if (defaultSeriesValueArray.length === 0) {

							if ($scope.radarChart) {
								$scope.radarChart.dispose();
								$scope.radarChart = undefined;
							}

						}
						else {

							if (!$scope.radarChart)
								$scope.radarChart = echarts.init(document.getElementById('radarDiagram'));
							// else{
							// 	// explicitly kill and reinstantiate radar diagram to avoid zombie states on spatial unit change
							// 	$scope.radarChart.dispose();
							// 	$scope.radarChart = echarts.init(document.getElementById('radarDiagram'));
							// }

							$scope.radarOption = {
								grid: {
									left: '5%',
									top: 0,
									right: '5%',
									bottom: 30
								},
								title: {
									text: 'Indikatorenradar - ' + $scope.spatialUnitName + ' - ' + $scope.date,
									left: 'center',
									top: 0,
									show: false
								},
								tooltip: {
									confine: 'true',
									formatter: function (params) {

										var string = "" + params.name + "<br/>";

										for (var index = 0; index < params.value.length; index++) {
											string += $scope.radarOption.radar.indicator[index].name + ": " + kommonitorDataExchangeService.getIndicatorValue_asFormattedText(params.value[index]) + " [" + $scope.radarOption.radar.indicator[index].unit + "]<br/>";
										};

										return string;
									}
									// position: ['50%', '50%']
								},
								toolbox: {
									show: true,
									right: '15',
									feature: {
										// mark : {show: true},
										dataView: {
											show: true, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Indikatorenradar', 'schlie&szlig;en', 'refresh'], optionToContent: function (opt) {

												// 	<table class="table table-condensed table-hover">
												// 	<thead>
												// 		<tr>
												// 			<th>Indikator-Name</th>
												// 			<th>Beschreibung der Verkn&uuml;pfung</th>
												// 		</tr>
												// 	</thead>
												// 	<tbody>
												// 		<tr ng-repeat="indicator in $ctrl.kommonitorDataExchangeServiceInstance.selectedIndicator.referencedIndicators">
												// 			<td>{{indicator.referencedIndicatorName}}</td>
												// 			<td>{{indicator.referencedIndicatorDescription}}</td>
												// 		</tr>
												// 	</tbody>
												// </table>

												var radarSeries = opt.series[0].data;
												var indicators = opt.radar[0].indicator;

												var dataTableId = "radarDataTable";
												var tableExportName = opt.title[0].text;

												var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
												htmlString += "<thead>";
												htmlString += "<tr>";
												htmlString += "<th style='text-align:center;'>Feature-Name</th>";

												for (var i = 0; i < indicators.length; i++) {
													htmlString += "<th style='text-align:center;'>" + indicators[i].name + " [" + indicators[i].unit + "]</th>";
												}

												htmlString += "</tr>";
												htmlString += "</thead>";

												htmlString += "<tbody>";



												for (var j = 0; j < radarSeries.length; j++) {
													htmlString += "<tr>";
													htmlString += "<td>" + radarSeries[j].name + "</td>";
													for (var k = 0; k < indicators.length; k++) {
														htmlString += "<td>" + kommonitorDataExchangeService.getIndicatorValue_asNumber(radarSeries[j].value[k]) + "</td>";
													}
													htmlString += "</tr>";
												}

												htmlString += "</tbody>";
												htmlString += "</table>";

												$rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);

												return htmlString;
											}
										},
										restore: { show: false, title: "Darstellung erneuern" },
										saveAsImage: { show: true, title: "Export" }
									}
								},
								legend: {
									type: "scroll",
									bottom: 0,
									align: 'left',
									left: 5,
									data: ['Arithmetisches Mittel']
								},
								radar: {
									// shape: 'circle',
									// name: {
									//     textStyle: {
									//         color: '#fff',
									//         backgroundColor: '#999',
									//         borderRadius: 3,
									//         padding: [3, 5]
									//    }
									// },
									name: {
										formatter: function (value, indicator) {

											return kommonitorDataExchangeService.formatIndiatorNameForLabel(value, 28);
										},
										textStyle: {
											color: '#525252'
										},
										fontSize: 11
									},
									indicator: indicatorArrayForRadarChart
								},
								series: [{
									name: 'Indikatorvergleich',
									type: 'radar',
									symbolSize: 8,
									data: [
										{
											value: defaultSeriesValueArray,
											name: 'Arithmetisches Mittel',
											lineStyle: {
												color: 'gray',
												type: 'dashed',
												width: 3
											},
											itemStyle: {
												borderWidth: 2,
												color: 'gray'
											},
											emphasis: {
												lineStyle: {
													width: 4
												},
												itemStyle: {
													borderType: 'dashed'
												}
											}
										}
									]
								}]
							};

							// check if any feature is still clicked/selected
							// then append those as series within radar chart
							appendSelectedFeaturesIfNecessary(sampleProperties);

							// use configuration item and data specified to show chart
							$scope.radarChart.setOption($scope.radarOption);

							$scope.radarChart.hideLoading();
							setTimeout(function () {
								$scope.radarChart.resize();
								$scope.$apply();
							}, 350);
							registerEventsIfNecessary();

						}

					}

					var appendSelectedFeaturesIfNecessary = function (sampleProperties) {

						for (var propertiesInstance of sampleProperties) {
							if (kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(propertiesInstance[__env.FEATURE_NAME_PROPERTY_NAME])) {
								appendSeriesToRadarChart(propertiesInstance);
							}
						}
					};

					function registerEventsIfNecessary() {
						if (!$scope.eventsRegistered) {
							// when hovering over elements of the chart then highlight them in the map.
							$scope.radarChart.on('mouseOver', function (params) {
								// $scope.userHoveresOverItem = true;
								var spatialFeatureName = params.data.name;
								// console.log(spatialFeatureName);
								$rootScope.$broadcast("highlightFeatureOnMap", spatialFeatureName);
							});

							$scope.radarChart.on('mouseOut', function (params) {
								// $scope.userHoveresOverItem = false;

								var spatialFeatureName = params.data.name;
								// console.log(spatialFeatureName);
								$rootScope.$broadcast("unhighlightFeatureOnMap", spatialFeatureName);
							});

							//disable feature removal for radar chart - seems to be unintuititve
							// $scope.radarChart.on('click', function(params){
							// 	var spatialFeatureName = params.data.name;
							// 	// console.log(spatialFeatureName);
							// 	$rootScope.$broadcast("switchHighlightFeatureOnMap", spatialFeatureName);
							// });

							$scope.eventsRegistered = true;
						}
					};


					$scope.$on("updateDiagramsForHoveredFeature", function (event, featureProperties) {

						if (!$scope.radarChart || !$scope.radarOption || !$scope.radarOption.legend || !$scope.radarOption.series) {
							return;
						}

						if (!kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME])) {
							appendSeriesToRadarChart(featureProperties);
						}

						highlightFeatureInRadarChart(featureProperties);
					});

					var appendSeriesToRadarChart = function (featureProperties) {
						// append feature name to legend
						$scope.radarOption.legend.data.push(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);

						// create feature data series
						var featureSeries = {};
						featureSeries.name = featureProperties[__env.FEATURE_NAME_PROPERTY_NAME];
						featureSeries.value = new Array();
						featureSeries.emphasis = {
							lineStyle: {
								width: 4,
								type: 'dotted'
							}
						};
						featureSeries.lineStyle = {
							width: 3,
							type: 'solid'
						};
						featureSeries.itemStyle = {
							borderWidth: 2
						};


						// for each indicator create series data entry for feature
						for (var i = 0; i < kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime.length; i++) {
							if (kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].isSelected) {
								// make object to hold indicatorName, max value and average value
								var indicatorProperties = kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorProperties;
								var closestTimestamp = kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime[i].closestTimestamp;

								for (var indicatorPropertyInstance of indicatorProperties) {
									if (indicatorPropertyInstance[__env.FEATURE_NAME_PROPERTY_NAME] === featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]) {
										if (!kommonitorDataExchangeService.indicatorValueIsNoData(indicatorPropertyInstance[DATE_PREFIX + closestTimestamp])) {
											featureSeries.value.push(kommonitorDataExchangeService.getIndicatorValueFromArray_asNumber(indicatorPropertyInstance, closestTimestamp));
										}
										else {
											featureSeries.value.push(null);
										}
										break;
									}
								}
							}

						}

						$scope.radarOption.series[0].data.push(featureSeries);

						$scope.radarChart.setOption($scope.radarOption);
						setTimeout(function () {
							$scope.radarChart.resize();
						}, 350);
						registerEventsIfNecessary();
					};

					var highlightFeatureInRadarChart = function (featureProperties) {
						// highlight the corresponding bar diagram item
						// get series index of series
						var dataIndex = getSeriesDataIndexByFeatureName(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);

						if (dataIndex > -1) {
							$scope.radarChart.dispatchAction({
								type: 'highlight',
								seriesIndex: 0,
								dataIndex: dataIndex
							});
						}
					};

					$scope.$on("updateDiagramsForUnhoveredFeature", function (event, featureProperties) {

						if (!$scope.radarChart || !$scope.radarOption || !$scope.radarOption.legend || !$scope.radarOption.series) {
							return;
						}

						unhighlightFeatureInRadarChart(featureProperties);

						if (!kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME])) {
							removeSeriesFromRadarChart(featureProperties);
						}
					});

					var getSeriesDataIndexByFeatureName = function (featureName) {
						for (var index = 0; index < $scope.radarOption.series[0].data.length; index++) {
							if ($scope.radarOption.series[0].data[index].name === featureName)
								return index;
						}

						//return -1 if none was found
						return -1;
					};

					var removeSeriesFromRadarChart = function (featureProperties) {
						// remove feature from legend
						var legendIndex = $scope.radarOption.legend.data.indexOf(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
						if (legendIndex > -1) {
							$scope.radarOption.legend.data.splice(legendIndex, 1);
						}

						// remove feature data series
						var dataIndex = getSeriesDataIndexByFeatureName(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);
						if (dataIndex > -1) {
							$scope.radarOption.series[0].data.splice(dataIndex, 1);
						}

						// second parameter tells echarts to not merge options with previous data. hence really remove series from graphic
						$scope.radarChart.setOption($scope.radarOption, true);
						setTimeout(function () {
							$scope.radarChart.resize();
						}, 350);
						registerEventsIfNecessary();
					};

					var unhighlightFeatureInRadarChart = function (featureProperties) {
						// highlight the corresponding bar diagram item
						// get series index of series
						var dataIndex = getSeriesDataIndexByFeatureName(featureProperties[__env.FEATURE_NAME_PROPERTY_NAME]);

						if (dataIndex > -1) {
							$scope.radarChart.dispatchAction({
								type: 'downplay',
								seriesIndex: 0,
								dataIndex: dataIndex
							});
						}
					};

					$scope.filterIndicators = function () {

						return kommonitorDataExchangeService.filterIndicators();
					};

					this.filterDisplayedIndicatorsOnRadar = function () {
						console.log("Filtering indicator radar");

						modifyRadarContent(kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);

					}

					this.selectAllIndicatorsForRadar = function () {

						for (var indicator of kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
							indicator.isSelected = true;
						}

						modifyRadarContent(kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
					}

					this.deselectAllIndicatorsForRadar = function () {

						for (var indicator of kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime) {
							indicator.isSelected = false;
						}

						modifyRadarContent(kommonitorDiagramHelperService.indicatorPropertiesForCurrentSpatialUnitAndTime);
					}


				}]
		});
