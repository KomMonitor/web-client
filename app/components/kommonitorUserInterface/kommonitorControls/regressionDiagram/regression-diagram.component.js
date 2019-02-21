angular
		.module('regressionDiagram')
		.component(
				'regressionDiagram',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/regressionDiagram/regression-diagram.template.html",

					controller : [
							'kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$timeout',
							function indicatorRadarController(
									kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $timeout) {
								/*
								 * reference to kommonitorDataExchangeService instances
								 */
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

								const DATE_PREFIX = __env.indicatorDatePrefix;
								var numberOfDecimals = __env.numberOfDecimals;
								const defaultColorForFilteredValues = __env.defaultColorForFilteredValues;
								const defaultColorForZeroValues = __env.defaultColorForZeroValues;

								$scope.setupCompleted = false;

								//$scope.allIndicatorProperties;
								$scope.selectedIndicatorForXAxis;
								$scope.selectedIndicatorForYAxis;
								$scope.correlation;
								$scope.linearRegression;
								$scope.regressionOption;
								$scope.regressionChart;
								$scope.data;
								$scope.dataWithLabels;
								$scope.eventsRegistered = false;
								// $scope.userHoveresOverItem = false;

								$scope.sortedIndicatorProps;
								$scope.spatialUnitName;
								$scope.date;

								$scope.filterIndicatorsBySpatialUnitAndDate = function() {
								  return function( item ) {

										if(item.applicableSpatialUnits.includes(kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel)){
											return item.applicableDates.includes(kommonitorDataExchangeService.selectedDate);
										}
										else{
											return false;
										}

								  };
								};

								var wait = ms => new Promise((r, j)=>setTimeout(r, ms));

								$scope.$on("allIndicatorPropertiesForCurrentSpatialUnitAndTime setup completed", async function (event) {

									await wait(100);

									$scope.setupCompleted = true;
									$scope.$apply();
								});

								$scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) {

									$scope.correlation = undefined;
									$scope.linearRegression = undefined;
									$scope.regressionOption = undefined;
									$scope.sortedIndicatorProps = undefined;
									$scope.data = undefined;
									$scope.dataWithLabels = undefined;
									$scope.eventsRegistered = false;
									// $scope.userHoveresOverItem = false;
									$scope.indicatorPropertyName = DATE_PREFIX + kommonitorDataExchangeService.selectedDate;
									$scope.spatialUnitName = spatialUnitName;
									$scope.date = date;
									$scope.indicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;
									$scope.defaultBrew = defaultBrew;
									$scope.gtMeasureOfValueBrew = gtMeasureOfValueBrew;
									$scope.ltMeasureOfValueBrew = ltMeasureOfValueBrew;
									$scope.dynamicIncreaseBrew = dynamicIncreaseBrew;
									$scope.dynamicDecreaseBrew = dynamicDecreaseBrew;
									$scope.isMeasureOfValueChecked = isMeasureOfValueChecked;
									$scope.measureOfValue = measureOfValue;

									if(justRestyling){
										$scope.onChangeSelectedIndicators();
									}
									else{
										if($scope.regressionChart){
											$scope.regressionChart.dispose();
											$scope.regressionChart = undefined;
										}

										$scope.setupCompleted = false;

										$scope.selectedIndicatorForXAxis = undefined;
										$scope.selectedIndicatorForYAxis = undefined;

										$timeout(function () {
								         $("option").each(function (index, element) {
								            var text = $(element).text();
								            $(element).attr("title", text);
								         });
								    });

									}
								});

								$scope.$on("updateDiagramsForHoveredFeature", function (event, featureProperties) {

									if(!$scope.regressionChart){
										return;
									}

									// if($scope.userHoveresOverItem){
									// 	return;
									// }

									var index = -1;
									for(var i=0; i<$scope.regressionOption.series[0].data.length; i++){
										if($scope.regressionOption.series[0].data[i].name === featureProperties.spatialUnitFeatureName){
											index = i;
											break;
										}
									}

									if(index > -1){
										$scope.regressionChart.dispatchAction({
												type: 'highlight',
												seriesIndex: 0,
												dataIndex: index
										});
								    // tooltip
								    $scope.regressionChart.dispatchAction({
								        type: 'showTip',
												seriesIndex: 0,
												dataIndex: index
								    });
									}
								});

								$scope.$on("updateDiagramsForUnhoveredFeature", function (event, featureProperties) {

									if(!$scope.regressionChart){
										return;
									}

									if(! kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(featureProperties.spatialUnitFeatureName)){
										// highlight the corresponding bar diagram item
										var index = -1;
										for(var i=0; i<$scope.regressionOption.series[0].data.length; i++){
											if($scope.regressionOption.series[0].data[i].name === featureProperties.spatialUnitFeatureName){
												index = i;
												break;
											}
										}

										if(index > -1){
											$scope.regressionChart.dispatchAction({
													type: 'downplay',
													seriesIndex: 0,
													dataIndex: index
											});
									    // tooltip
									    $scope.regressionChart.dispatchAction({
									        type: 'hideTip',
													seriesIndex: 0,
													dataIndex: index
									    });
										}
									}
								});

								$scope.getAllIndicatorPropertiesSortedBySpatialUnitFeatureName = function(){
									for(var i=0; i<kommonitorDataExchangeService.allIndicatorPropertiesForCurrentSpatialUnitAndTime.length; i++){
											// make object to hold indicatorName, max value and average value
											kommonitorDataExchangeService.allIndicatorPropertiesForCurrentSpatialUnitAndTime[i].indicatorProperties.sort(function(a, b) {
												// a and b are arrays of indicatorProperties for all features of the selected spatialUnit. We sort them by their property "spatialUnitFeatureName"

													var nameA = a.spatialUnitFeatureName.toUpperCase(); // ignore upper and lowercase
												  var nameB = b.spatialUnitFeatureName.toUpperCase(); // ignore upper and lowercase
												  if (nameA < nameB) {
												    return -1;
												  }
												  if (nameA > nameB) {
												    return 1;
												  }

												  // names are equal
												  return 0;
											});
									}

									return kommonitorDataExchangeService.allIndicatorPropertiesForCurrentSpatialUnitAndTime;
								};

								$scope.getPropertiesForIndicatorName = function(indicatorName){
									for (var indicator of $scope.sortedIndicatorProps){
										if(indicator.indicatorMetadata.indicatorName === indicatorName){
											return indicator.indicatorProperties;
										}
									}
								};

								var getColor = function(featureName){

									var color;

									for (var index=0; index<$scope.indicatorMetadataAndGeoJSON.geoJSON.features.length; index++){
										var feature = $scope.indicatorMetadataAndGeoJSON.geoJSON.features[index];
										if (feature.properties.spatialUnitFeatureName === featureName){
											color = getColorForFeature(feature);
											break;
										}
									}

									return color;
								};

								var getColorForFeature = function(feature){
									var color;

									if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(feature.properties.spatialUnitFeatureName)){
										color = defaultColorForFilteredValues;
									}
									else if(Number(feature.properties[$scope.indicatorPropertyName]) === 0 ){
										color = defaultColorForZeroValues;
									}
									else if($scope.isMeasureOfValueChecked){

										if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) >= +Number($scope.measureOfValue).toFixed(numberOfDecimals)){

											for (var index=0; index < $scope.gtMeasureOfValueBrew.breaks.length; index++){

												if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) == +Number($scope.gtMeasureOfValueBrew.breaks[index]).toFixed(numberOfDecimals)){
													if(index < $scope.gtMeasureOfValueBrew.breaks.length -1){
														// min value
														color =  $scope.gtMeasureOfValueBrew.colors[index];
														break;
													}
													else {
														//max value
														if ($scope.gtMeasureOfValueBrew.colors[index]){
															color =  $scope.gtMeasureOfValueBrew.colors[index];
														}
														else{
															color =  $scope.gtMeasureOfValueBrew.colors[index - 1];
														}
														break;
													}
												}
												else{
													if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) < +Number($scope.gtMeasureOfValueBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
														color =  $scope.gtMeasureOfValueBrew.colors[index];
														break;
													}
												}
											}

										}
										else {

											// invert colors, so that lowest values will become strong colored!
											for (var index=0; index < $scope.ltMeasureOfValueBrew.breaks.length; index++){
												if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) == +Number($scope.ltMeasureOfValueBrew.breaks[index]).toFixed(numberOfDecimals)){
													if(index < $scope.ltMeasureOfValueBrew.breaks.length -1){
														// min value
														color =  $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index - 1];
														break;
													}
													else {
														//max value
														if ($scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index]){
															color =  $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index];
														}
														else{
															color =  $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index - 1];
														}
														break;
													}
												}
												else{
													if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) < +Number($scope.ltMeasureOfValueBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
														color =  $scope.ltMeasureOfValueBrew.colors[$scope.ltMeasureOfValueBrew.colors.length - index - 1];
														break;
													}
												}
											}

										}

									}
									else{
										if($scope.indicatorMetadataAndGeoJSON.indicatorType === 'DYNAMIC'){

											if(feature.properties[$scope.indicatorPropertyName] < 0){

												for (var index=0; index < $scope.dynamicDecreaseBrew.breaks.length; index++){
													if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) == +Number($scope.dynamicDecreaseBrew.breaks[index]).toFixed(numberOfDecimals)){
														if(index < $scope.dynamicDecreaseBrew.breaks.length -1){
															// min value
															color =  $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index - 1];
															break;
														}
														else {
															//max value
															if ($scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index]){
																color =  $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index];
															}
															else{
																color =  $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index - 1];
															}
															break;
														}
													}
													else{
														if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) < +Number($scope.dynamicDecreaseBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
															color =  $scope.dynamicDecreaseBrew.colors[$scope.dynamicDecreaseBrew.colors.length - index - 1];
															break;
														}
													}
												}

											}
											else{
												for (var index=0; index < $scope.dynamicIncreaseBrew.breaks.length; index++){
													if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) == +Number($scope.dynamicIncreaseBrew.breaks[index]).toFixed(numberOfDecimals)){
														if(index < $scope.dynamicIncreaseBrew.breaks.length -1){
															// min value
															color =  $scope.dynamicIncreaseBrew.colors[index];
															break;
														}
														else {
															//max value
															if ($scope.dynamicIncreaseBrew.colors[index]){
																color =  $scope.dynamicIncreaseBrew.colors[index];
															}
															else{
																color =  $scope.dynamicIncreaseBrew.colors[index - 1];
															}
															break;
														}
													}
													else{
														if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) < +Number($scope.dynamicIncreaseBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
															color =  $scope.dynamicIncreaseBrew.colors[index];
															break;
														}
													}
												}
											}

										}
										else{
												color = $scope.defaultBrew.getColorInRange(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals));
										}
									}

									return color;
								}

								$scope.buildDataArrayForSelectedIndicators = function(){
									$scope.data = new Array();
									$scope.dataWithLabels = new Array();

									var indicatorPropertiesArrayForXAxis = $scope.getPropertiesForIndicatorName($scope.selectedIndicatorForXAxis.indicatorName);
									var indicatorPropertiesArrayForYAxis = $scope.getPropertiesForIndicatorName($scope.selectedIndicatorForYAxis.indicatorName);

									for (var i=0; i<indicatorPropertiesArrayForXAxis.length; i++){

										// + sign turns output into number!
										var xAxisDataElement = +indicatorPropertiesArrayForXAxis[i][DATE_PREFIX + kommonitorDataExchangeService.selectedDate];
										var yAxisDataElement = +indicatorPropertiesArrayForYAxis[i][DATE_PREFIX + kommonitorDataExchangeService.selectedDate];
										$scope.data.push([Number(xAxisDataElement.toFixed(numberOfDecimals)), Number(yAxisDataElement.toFixed(numberOfDecimals))]);

										var featureName = indicatorPropertiesArrayForXAxis[i].spatialUnitFeatureName;
										var color = getColor(featureName);
										$scope.dataWithLabels.push({
											name: featureName,
											value: [Number(xAxisDataElement.toFixed(numberOfDecimals)), Number(yAxisDataElement.toFixed(numberOfDecimals))],
											itemStyle: {
												color: color
											}
										});
									}

									return $scope.data;
								};

								/*
								 *  Source: http://stevegardner.net/2012/06/11/javascript-code-to-calculate-the-pearson-correlation-coefficient/
								 */
								function getPearsonCorrelation(x, y) {
								    var shortestArrayLength = 0;

								    if(x.length == y.length) {
								        shortestArrayLength = x.length;
								    } else if(x.length > y.length) {
								        shortestArrayLength = y.length;
								        console.error('x has more items in it, the last ' + (x.length - shortestArrayLength) + ' item(s) will be ignored');
								    } else {
								        shortestArrayLength = x.length;
								        console.error('y has more items in it, the last ' + (y.length - shortestArrayLength) + ' item(s) will be ignored');
								    }

								    var xy = [];
								    var x2 = [];
								    var y2 = [];

								    for(var i=0; i<shortestArrayLength; i++) {
								        xy.push(x[i] * y[i]);
								        x2.push(x[i] * x[i]);
								        y2.push(y[i] * y[i]);
								    }

								    var sum_x = 0;
								    var sum_y = 0;
								    var sum_xy = 0;
								    var sum_x2 = 0;
								    var sum_y2 = 0;

								    for(var i=0; i< shortestArrayLength; i++) {
								        sum_x += x[i];
								        sum_y += y[i];
								        sum_xy += xy[i];
								        sum_x2 += x2[i];
								        sum_y2 += y2[i];
								    }

								    var step1 = (shortestArrayLength * sum_xy) - (sum_x * sum_y);
								    var step2 = (shortestArrayLength * sum_x2) - (sum_x * sum_x);
								    var step3 = (shortestArrayLength * sum_y2) - (sum_y * sum_y);
								    var step4 = Math.sqrt(step2 * step3);
								    var answer = step1 / step4;

								    return Number(+answer.toFixed(2));
									}

									$scope.calculatePearsonCorrelation = function(data){
										// data is an array of arrays containing the pairs of [x, y]

										var xArray = new Array();
										var yArray = new Array();

										data.forEach(function(xyPair) {
										  xArray.push(xyPair[0]);
											yArray.push(xyPair[1]);
										});

										return getPearsonCorrelation(xArray, yArray);
									}

								$scope.onChangeSelectedIndicators = function(){
									if($scope.selectedIndicatorForXAxis && $scope.selectedIndicatorForYAxis){

										$scope.eventsRegistered = false;

										if(!$scope.regressionChart)
											$scope.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
										else{
											// explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
											$scope.regressionChart.dispose();
											$scope.regressionChart = echarts.init(document.getElementById('regressionDiagram'));
										}

										$scope.regressionChart.showLoading();

										if(!$scope.sortedIndicatorProps){
											$scope.sortedIndicatorProps = $scope.getAllIndicatorPropertiesSortedBySpatialUnitFeatureName();
										}

										var data = $scope.buildDataArrayForSelectedIndicators();

										data.sort(function(a, b) {
										    return a[0] - b[0];
										});

										$scope.correlation = $scope.calculatePearsonCorrelation(data);

										$scope.linearRegression = ecStat.regression('linear', data);

										for(var i=0; i<$scope.linearRegression.points.length; i++){
											$scope.linearRegression.points[i][0] = Number($scope.linearRegression.points[i][0].toFixed(numberOfDecimals));
											$scope.linearRegression.points[i][1] = Number($scope.linearRegression.points[i][1].toFixed(numberOfDecimals));
										}

										$scope.regressionOption = {
										    title: {
										        text: 'Lineare Regression - ' + $scope.spatialUnitName + ' - ' + $scope.date,
										        left: 'center'
										    },
										    tooltip: {
										        trigger: 'item',
														confine: 'true',
										        axisPointer: {
										            type: 'cross'
										        },
														formatter: function (params) {
																				var string = "" + params.name + "<br/>";
																				string += $scope.selectedIndicatorForXAxis.indicatorName + ": " + Number(params.value[0]).toLocaleString('de-DE', {maximumFractionDigits: numberOfDecimals}) + " [" + $scope.selectedIndicatorForXAxis.unit + "]<br/>";
																				string += $scope.selectedIndicatorForYAxis.indicatorName + ": " + Number(params.value[1]).toLocaleString('de-DE', {maximumFractionDigits: numberOfDecimals}) + " [" + $scope.selectedIndicatorForYAxis.unit + "]<br/>";
						                            return string;
						                           }
										    },
										    xAxis: {
														name: $scope.selectedIndicatorForXAxis.indicatorName + " [" + $scope.selectedIndicatorForXAxis.unit + "]",
														nameLocation: 'center',
														nameGap: 30,
		                        scale: true,
										        type: 'value',
										        splitLine: {
										            lineStyle: {
										                type: 'dashed'
										            }
										        },
										    },
										    yAxis: {
														name: $scope.selectedIndicatorForYAxis.indicatorName + " [" + $scope.selectedIndicatorForYAxis.unit + "]",
														nameLocation: 'center',
														nameGap: 60,
										        type: 'value',
										        splitLine: {
										            lineStyle: {
										                type: 'dashed'
										            }
										        },
										    },
												toolbox: {
														show : true,
														right: '25',
														feature : {
																// mark : {show: true},
																dataView : {show: true, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - lineare Regression', 'schlie&szlig;en', 'refresh'], optionToContent: function(opt){

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

																// has properties "name" and "value"
																// value: [Number(xAxisDataElement.toFixed(4)), Number(yAxisDataElement.toFixed(4))]
																var scatterSeries = opt.series[0].data;
																var lineSeries = opt.series[1].data;

																var dataTableId = "regressionDataTable";
																var tableExportName = opt.title[0].text + " - Scatter Table";

																var htmlString = "<p>Data View enth&auml;lt zwei nachstehende Tabellen, die Tabelle des Scatter Plots und die Tabelle der Punkte der Regressionsgeraden.</p><br/>";
																htmlString += '<h4>Scatter Plot Tabelle</h4>';
																	htmlString += '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
																	htmlString += "<thead>";
																	htmlString += "<tr>";
																	htmlString += "<th style='text-align:center;'>Feature-Name</th>";
																	htmlString += "<th style='text-align:center;'>" + opt.xAxis[0].name + "</th>";
																	htmlString += "<th style='text-align:center;'>" + opt.yAxis[0].name + "</th>";

																	htmlString += "</tr>";
																	htmlString += "</thead>";

																	htmlString += "<tbody>";

																	for (var j=0; j<scatterSeries.length; j++){
																		htmlString += "<tr>";
																		htmlString += "<td>" + scatterSeries[j].name + "</td>";
																		htmlString += "<td>" + +Number(scatterSeries[j].value[0]).toFixed(numberOfDecimals) + "</td>";
																		htmlString += "<td>" + +Number(scatterSeries[j].value[1]).toFixed(numberOfDecimals) + "</td>";
																		htmlString += "</tr>";
																	}

																	htmlString += "</tbody>";
																	htmlString += "</table>";

																	var lineTableId = "lineDataTable";
																	var lineTableExportName = opt.title[0].text + " - Line Table";

																	htmlString += "<br/><h4>Referenzpunkte der Regressionsgraden '" + $scope.linearRegression.expression + "'</h4>";

																	htmlString += '<table id="' + lineTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
																	htmlString += "<thead>";
																	htmlString += "<tr>";
																	htmlString += "<th style='text-align:center;'>X</th>";
																	htmlString += "<th style='text-align:center;'>Y</th>";
																	htmlString += "</tr>";
																	htmlString += "</thead>";

																	htmlString += "<tbody>";

																	for (var j=0; j<lineSeries.length; j++){
																		htmlString += "<tr>";
																		htmlString += "<td>" + Number(lineSeries[j][0]).toFixed(numberOfDecimals) + "</td>";
																		htmlString += "<td>" + Number(lineSeries[j][1]).toFixed(numberOfDecimals) + "</td>";
																		htmlString += "</tr>";
																	}

																	htmlString += "</tbody>";
																	htmlString += "</table>";

																	$rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);
																	$rootScope.$broadcast("AppendExportButtonsForTable", lineTableId, lineTableExportName);

															    return htmlString;
																}},
																restore : {show: true, title: "Erneuern"},
																saveAsImage : {show: true, title: "Export"}
														}
												},
										    series: [{
										        name: "scatter",
										        type: 'scatter',
										        // label: {
										        //     emphasis: {
										        //         show: false,
										        //         position: 'left',
										        //         textStyle: {
										        //             color: 'blue',
										        //             fontSize: 16
										        //         }
										        //     }
										        // },
														emphasis: {
															itemStyle: {
																borderWidth: 4,
																borderColor: '#42e5f4'
															}
														},
										        data: $scope.dataWithLabels
										    }, {
										        name: 'line',
										        type: 'line',
										        showSymbol: false,
										        data: $scope.linearRegression.points,
										        markPoint: {
										            itemStyle: {
										                normal: {
										                    color: 'transparent'
										                }
										            },
										            label: {
										                normal: {
										                    show: true,
										                    position: 'left',
										                    formatter: $scope.linearRegression.expression,
										                    textStyle: {
										                        color: '#333',
										                        fontSize: 14
										                    }
										                }
										            },
										            data: [{
										                coord: $scope.linearRegression.points[$scope.linearRegression.points.length - 1]
										            }]
										        }
										    }]
										};

										$scope.regressionChart.hideLoading();
										$scope.regressionChart.setOption($scope.regressionOption);

										registerEventsIfNecessary();

									}
								}

								function registerEventsIfNecessary(){
									if(!$scope.eventsRegistered){
										// when hovering over elements of the chart then highlight them in the map.
										$scope.regressionChart.on('mouseOver', function(params){
											// $scope.userHoveresOverItem = true;
											var spatialFeatureName = params.data.name;
											// console.log(spatialFeatureName);
											$rootScope.$broadcast("highlightFeatureOnMap", spatialFeatureName);
										});

										$scope.regressionChart.on('mouseOut', function(params){
											// $scope.userHoveresOverItem = false;

											var spatialFeatureName = params.data.name;
											// console.log(spatialFeatureName);
											$rootScope.$broadcast("unhighlightFeatureOnMap", spatialFeatureName);
										});

										$scope.regressionChart.on('click', function(params){
											var spatialFeatureName = params.data.name;
											// console.log(spatialFeatureName);
											$rootScope.$broadcast("switchHighlightFeatureOnMap", spatialFeatureName);
										});

										$scope.eventsRegistered = true;
									}
								};


							} ]
				});
