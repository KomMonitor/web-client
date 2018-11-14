angular
		.module('kommonitorDiagrams')
		.component(
				'kommonitorDiagrams',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/kommonitorDiagrams/kommonitor-diagrams.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : [
							'kommonitorDataExchangeService',
							'$scope', '$rootScope',
							function kommonitorDiagramsController(kommonitorDataExchangeService,
									$scope, $rootScope) {
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

								const INDICATOR_DATE_PREFIX = "DATE_";

								// $scope.userHoveresOverBarItem = false;
								$scope.eventsRegistered = false;
								$scope.isTooManyFeatures = false;

								var compareFeaturesByIndicatorValue = function(featureA, featureB) {
								  if (featureA.properties[$scope.indicatorPropertyName] < featureB.properties[$scope.indicatorPropertyName])
								    return -1;
								  if (featureA.properties[$scope.indicatorPropertyName] > featureB.properties[$scope.indicatorPropertyName])
								    return 1;
								  return 0;
								}

								var showLoadingIcons = function(){

									if($scope.histogramChart)
										$scope.histogramChart.showLoading();

									if($scope.barChart)
										$scope.barChart.showLoading();

									if($scope.lineChart)
										$scope.lineChart.showLoading();
								};

								$scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) {

									console.log("Updating diagrams!");

									showLoadingIcons();

									$scope.isTooManyFeatures = false;

									$scope.indicatorPropertyName = INDICATOR_DATE_PREFIX + date;

									var featureNamesArray = new Array();
									var indicatorValueArray = new Array();
									var indicatorValueBarChartArray = new Array();

									var indicatorTimeSeriesDatesArray = indicatorMetadataAndGeoJSON.applicableDates;
									var indicatorTimeSeriesAverageArray = new Array(indicatorTimeSeriesDatesArray.length);
									var indicatorTimeSeriesCountArray = new Array(indicatorTimeSeriesDatesArray.length);

									// initialize timeSeries arrays
									for(var i=0; i<indicatorTimeSeriesDatesArray.length; i++){
										indicatorTimeSeriesAverageArray[i] = 0;
										indicatorTimeSeriesCountArray[i] = 0;
									}

									//sort array of features
									var features = indicatorMetadataAndGeoJSON.geoJSON.features;
									features.sort(compareFeaturesByIndicatorValue);

									for(var feature of indicatorMetadataAndGeoJSON.geoJSON.features){
										featureNamesArray.push(feature.properties.spatialUnitFeatureName);
										indicatorValueArray.push(feature.properties[$scope.indicatorPropertyName]);

										var color;
										if(isMeasureOfValueChecked){

											if(feature.properties[$scope.indicatorPropertyName] >= measureOfValue){
												color = gtMeasureOfValueBrew.getColorInRange(feature.properties[$scope.indicatorPropertyName]);
											}
											else {
												color = ltMeasureOfValueBrew.getColorInRange(feature.properties[$scope.indicatorPropertyName]);
											}

										}
										else{
											color = defaultBrew.getColorInRange(feature.properties[$scope.indicatorPropertyName]);
										}


										var seriesItem = {
											value: feature.properties[$scope.indicatorPropertyName],
											itemStyle: {
												color: color
											}
										};

										indicatorValueBarChartArray.push(seriesItem);

										// continue timeSeries arrays by adding and counting all time series values
										for(var i=0; i<indicatorTimeSeriesDatesArray.length; i++){
											var datePropertyName = INDICATOR_DATE_PREFIX + indicatorTimeSeriesDatesArray[i];
											indicatorTimeSeriesAverageArray[i] += feature.properties[datePropertyName];
											indicatorTimeSeriesCountArray[i] ++;
										}
									}

									// finish timeSeries arrays by computing averages of all time series values
									for(var i=0; i<indicatorTimeSeriesDatesArray.length; i++){
										indicatorTimeSeriesAverageArray[i] = indicatorTimeSeriesAverageArray[i] / indicatorTimeSeriesCountArray[i];
									}

									updateHistogramChart(indicatorMetadataAndGeoJSON, indicatorValueArray);

									updateLineChart(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray);

									// bar chart only if feature number is below 75
									if (indicatorMetadataAndGeoJSON.geoJSON.features.length > 75){
										console.log("Number of features too big (more than 75). Thus bar diagram cannot be created");

										// remove bar diagram if exist
										if($scope.barChart){
											$scope.barChart.dispose();
											$scope.barChart = undefined;
											$scope.eventsRegistered = false;
										}

										$scope.isTooManyFeatures = true;
									}
									else{
										updateBarChart(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray);
									}

								});

								//HISTOGRAM CHART FUNCTION
								var updateHistogramChart = function(indicatorMetadataAndGeoJSON, indicatorValueArray){
									var bins = ecStat.histogram(indicatorValueArray);

									if(!$scope.histogramChart)
										$scope.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
									else{
										// explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
										$scope.histogramChart.dispose();
										$scope.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
									}

									$scope.histogramChart.hideLoading();

									$scope.histogramOption = {
                    title: {
											text: 'Histogramm - Wertverteilung',
											left: 'center',
											top: 15
                    },
                    tooltip: {
											trigger: 'item',
											axisPointer: {
													type: 'line',
													crossStyle: {
															color: '#999'
													}
											}
										},
										toolbox: {
												show : true,
												feature : {
														// mark : {show: true},
														dataView : {show: true, readOnly: true, title: "Data View", lang: ['Data View', 'close', 'refresh']},
														restore : {show: true, title: "Restore"},
														saveAsImage : {show: true, title: "Save"}
												}
										},
                    xAxis: [{
											name: 'Wertintervalle',
											nameLocation: 'center',
											nameGap: 25,
                        scale: true,
                    }],
                    yAxis: {
											name: 'Anzahl Features',
											nameGap: 35,
											nameLocation: 'center',
											nameRotate: 90,
                    },
                    series: [{
                        type: 'custom',
												name: indicatorMetadataAndGeoJSON.indicatorName,
                        renderItem: function (params, api) {
                            var yValue = api.value(2);
                            var start = api.coord([api.value(0), yValue]);
                            var size = api.size([api.value(1) - api.value(0), yValue]);
                            return {
                                type: 'rect',
                                shape: {
                                    x: start[0],
                                    y: start[1],
                                    width: size[0] * 0.99,
                                    height: size[1]
                                },
                                style: api.style()
                            };
                        },
                        itemStyle: {
                            color: '#337ab7'
                        },
                        // label: {
                        //     normal: {
                        //         show: true,
                        //         position: 'insideTop'
                        //     }
                        // },
                        dimensions: ['untere Intervallgrenze', 'obere Intervallgrenze', 'Anzahl'],
                        encode: {
                            x: [0, 1],
                            y: 2,
                            tooltip: [0, 1, 2]
                        },
                        data: bins.customData
                    }]
                };

								// var option = {
                //     title: {
                //         text: 'Histogram Chart',
                //         left: 'center',
                //         top: 20
                //     },
								// 		tooltip: {
								// 					trigger: 'axis',
								// 					axisPointer: {
								// 							type: 'line',
								// 							crossStyle: {
								// 									color: '#999'
								// 							}
								// 					}
								// 				},
                //     color: ['rgb(25, 183, 207)'],
                //     grid: {
                //         left: '3%',
                //         right: '3%',
                //         bottom: '3%',
                //         containLabel: true
                //     },
								// 		xAxis: [{
								// 				type: 'value',
								// 					name: 'Wertintervalle',
								// 					nameLocation: 'center',
								// 					nameGap: 15,
		            //             scale: true,
		            //         }],
		            //         yAxis: {
								// 					type: 'value',
								// 					name: 'Anzahl Features',
								// 					nameGap: 24,
								// 					nameLocation: 'center',
								// 					nameRotate: 90,
		            //         },
                //     series: [{
                //         name: 'Anzahl',
                //         type: 'bar',
								// 				barWidth: '99,3%',
                //         // label: {
                //         //     normal: {
                //         //         show: true,
                //         //         position: 'insideTop',
                //         //         formatter: function (params) {
                //         //             return params.value[1];
                //         //         }
                //         //     }
                //         // },
                //         data: bins.data
                //     }]
                // };

									$scope.histogramChart.setOption($scope.histogramOption);
								};

								// BAR CHART FUNCTION

								var updateBarChart = function(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray){
									// based on prepared DOM, initialize echarts instance
									$scope.eventsRegistered = false;

									if(!$scope.barChart)
										$scope.barChart = echarts.init(document.getElementById('barDiagram'));
									else{
										// explicitly kill and reinstantiate bar diagram to avoid zombie states on spatial unit change
										$scope.barChart.dispose();
										$scope.barChart = echarts.init(document.getElementById('barDiagram'));
									}

									$scope.barChart.hideLoading();

									// specify chart configuration item and data
									var labelOption = {
												normal: {
														show: true,
														position: 'insideBottom',
														align: 'left',
														verticalAlign: 'middle',
														rotate: 90,
														formatter: '{c}',
												}
										};

									$scope.barOption = {
											title: {
													text: 'Wertvergleich',
													left: 'center',
									        top: 15
											},
											tooltip: {
													trigger: 'item',
													axisPointer: {
															type: 'line',
															crossStyle: {
																	color: '#999'
															}
													}
											},
											toolbox: {
													show : true,
													feature : {
															// mark : {show: true},
															dataView : {show: true, readOnly: true, title: "Data View", lang: ['Data View', 'close', 'refresh']},
															restore : {show: true, title: "Restore"},
															saveAsImage : {show: true, title: "Save"}
													}
											},
											// legend: {
											// 		//data:[indicatorMetadataAndGeoJSON.indicatorName]
											// },
											xAxis: {
													axisLabel: {
														rotate: 90,
														interval: 0,
														inside: true
													},
													z: 6,
													zlevel: 6,
													data: featureNamesArray
											},
											yAxis: {
											},
											series: [{
													// name: indicatorMetadataAndGeoJSON.indicatorName,
													type: 'bar',
													emphasis: {
														itemStyle: {
															borderWidth: 4,
															borderColor: '#42e5f4'
														}
													},
													data: indicatorValueBarChartArray
											}]
									};

									// use configuration item and data specified to show chart
									$scope.barChart.setOption($scope.barOption);

									registerEventsIfNecessary();
								};

								function registerEventsIfNecessary(){
									if(!$scope.eventsRegistered){
										// when hovering over elements of the chart then highlight them in the map.
										$scope.barChart.on('mouseOver', function(params){
											// $scope.userHoveresOverBarItem = true;
											var seriesIndex = params.seriesIndex;
											var dataIndex = params.dataIndex;

											// console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
											//
											// var barElement = $scope.barOption.series[seriesIndex].data[dataIndex];
											//
											// console.log(barElement);

											var spatialFeatureName = $scope.barOption.xAxis.data[dataIndex];
											// console.log(spatialFeatureName);
											$rootScope.$broadcast("highlightFeatureOnMap", spatialFeatureName);
										});

										$scope.barChart.on('mouseOut', function(params){
											// $scope.userHoveresOverBarItem = false;
											var seriesIndex = params.seriesIndex;
											var dataIndex = params.dataIndex;

											// console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
											//
											// var barElement = $scope.barOption.series[seriesIndex].data[dataIndex];
											//
											// console.log(barElement);

											var spatialFeatureName = $scope.barOption.xAxis.data[dataIndex];
											// console.log(spatialFeatureName);
											$rootScope.$broadcast("unhighlightFeatureOnMap", spatialFeatureName);
										});

										$scope.barChart.on('click', function(params){
											var seriesIndex = params.seriesIndex;
											var dataIndex = params.dataIndex;

											// console.log("Series: " + seriesIndex + ", dataIndex: " + dataIndex);
											//
											// var barElement = $scope.barOption.series[seriesIndex].data[dataIndex];
											//
											// console.log(barElement);

											var spatialFeatureName = $scope.barOption.xAxis.data[dataIndex];
											// console.log(spatialFeatureName);
											$rootScope.$broadcast("switchHighlightFeatureOnMap", spatialFeatureName);
										});

										$scope.eventsRegistered = true;
									}
								};

								// LINE CHART TIME SERIES FUNCTION
								var updateLineChart = function(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray){
									// based on prepared DOM, initialize echarts instance
									if(!$scope.lineChart)
										$scope.lineChart = echarts.init(document.getElementById('lineDiagram'));
									else{
										// explicitly kill and reinstantiate line diagram to avoid zombie states on spatial unit change
										$scope.lineChart.dispose();
										$scope.lineChart = echarts.init(document.getElementById('lineDiagram'));
									}

									$scope.lineChart.hideLoading();

									// // specify chart configuration item and data
									// var labelOption = {
									// 			normal: {
									// 					show: true,
									// 					position: 'insideBottom',
									// 					align: 'left',
									// 					verticalAlign: 'middle',
									// 					rotate: 90,
									// 					formatter: '{c}',
									// 			}
									// 	};

									$scope.lineOption = {
											title: {
													text: 'Zeitreihe',
													left: 'center',
									        top: 15
											},
											tooltip: {
													trigger: 'axis',
													axisPointer: {
															type: 'line',
															crossStyle: {
																	color: '#999'
															}
													}
											},
											toolbox: {
													show : true,
													feature : {
															// mark : {show: true},
															dataView : {show: true, readOnly: true, title: "Data View", lang: ['Data View', 'close', 'refresh']},
															restore : {show: true, title: "Restore"},
															saveAsImage : {show: true, title: "Save"}
													}
											},
											legend: {
													type: "scroll",
													bottom: 0,
													data:['Durchschnitt']
											},
											xAxis: {
													// axisLabel: {
													// 	rotate: 90,
													// 	interval: 0,
													// 	inside: true
													// },
													// z: 6,
													// zlevel: 6,
													type: 'category',
													data: indicatorTimeSeriesDatesArray
											},
											yAxis: {
												type: 'value'
											},
											series: [{
													name: "Durchschnitt",
													type: 'line',
													data: indicatorTimeSeriesAverageArray,
													lineStyle: {
									            normal: {
									                color: 'gray',
									                width: 2,
									                type: 'dashed'
									            }
									        },
													itemStyle: {
									            normal: {
									                borderWidth: 3,
									                color: 'gray'
									            }
									        }
											}]
									};

									// use configuration item and data specified to show chart
									$scope.lineChart.setOption($scope.lineOption);
								};




								$scope.$on("updateDiagramsForHoveredFeature", function (event, featureProperties) {

									if(! kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(featureProperties.spatialUnitFeatureName)){
										appendSeriesToLineChart(featureProperties);
									}

									highlightFeatureInBarChart(featureProperties);
									highlightFeatureInLineChart(featureProperties);
								});

								var appendSeriesToLineChart = function(featureProperties){
									// append feature name to legend
									$scope.lineOption.legend.data.push(featureProperties.spatialUnitFeatureName);

									// create feature data series
									var featureSeries = {};
									featureSeries.name = featureProperties.spatialUnitFeatureName;
									featureSeries.type = 'line';
									featureSeries.data = new Array();

									// for each date create series data entry for feature
									for (var date of $scope.lineOption.xAxis.data){
										featureSeries.data.push(featureProperties[INDICATOR_DATE_PREFIX + date]);
									}

									$scope.lineOption.series.push(featureSeries);

									$scope.lineChart.setOption($scope.lineOption);
								};

								var highlightFeatureInBarChart = function(featureProperties){
									// highlight the corresponding bar diagram item
									// get index of bar item

									// if($scope.userHoveresOverBarItem){
									// 	return;
									// }

									var index = -1;
									for(var i=0; i<$scope.barOption.xAxis.data.length; i++){
										if($scope.barOption.xAxis.data[i] === featureProperties.spatialUnitFeatureName){
											index = i;
											break;
										}
									}

									if(index > -1){
										$scope.barChart.dispatchAction({
												type: 'highlight',
												seriesIndex: 0,
												dataIndex: index
										});
								    // tooltip
								    $scope.barChart.dispatchAction({
								        type: 'showTip',
												seriesIndex: 0,
												dataIndex: index
								    });
									}
								};

								var highlightFeatureInLineChart = function(featureProperties){
									// highlight the corresponding bar diagram item
									// get series index of series
									var seriesIndex = getSeriesIndexByFeatureName(featureProperties.spatialUnitFeatureName);

									if(seriesIndex > -1){
										$scope.lineChart.dispatchAction({
												type: 'highlight',
												seriesIndex: seriesIndex
										});
									}
								};

								$scope.$on("updateDiagramsForUnhoveredFeature", function (event, featureProperties) {

									if(! kommonitorDataExchangeService.clickedIndicatorFeatureNames.includes(featureProperties.spatialUnitFeatureName)){
										unhighlightFeatureInLineChart(featureProperties);

										removeSeriesFromLineChart(featureProperties);

										unhighlightFeatureInBarChart(featureProperties);
									}
								});

								var getSeriesIndexByFeatureName = function(featureName){
									for(var index=0; index< $scope.lineOption.series.length; index++){
										if ($scope.lineOption.series[index].name === featureName)
											return index;
									}

									//return -1 if none was found
									return -1;
								};

								var removeSeriesFromLineChart = function(featureProperties){
									// remove feature from legend
									var legendIndex = $scope.lineOption.legend.data.indexOf(featureProperties.spatialUnitFeatureName);
									if (legendIndex > -1) {
									  $scope.lineOption.legend.data.splice(legendIndex, 1);
									}

									// remove feature data series
									var seriesIndex = getSeriesIndexByFeatureName(featureProperties.spatialUnitFeatureName);
									if (seriesIndex > -1) {
									  $scope.lineOption.series.splice(seriesIndex, 1);
									}

									// second parameter tells echarts to not merge options with previous data. hence really remove series from graphic
									$scope.lineChart.setOption($scope.lineOption, true);
								};

								var unhighlightFeatureInBarChart = function(featureProperties){
									// highlight the corresponding bar diagram item
									// get index of bar item
									var index = -1;
									for(var i=0; i<$scope.barOption.xAxis.data.length; i++){
										if($scope.barOption.xAxis.data[i] === featureProperties.spatialUnitFeatureName){
											index = i;
											break;
										}
									}

									if(index > -1){
										$scope.barChart.dispatchAction({
												type: 'downplay',
												seriesIndex: 0,
												dataIndex: index
										});
								    // tooltip
								    $scope.barChart.dispatchAction({
								        type: 'hideTip',
												seriesIndex: 0,
												dataIndex: index
								    });
									}
								};

								var unhighlightFeatureInLineChart = function(featureProperties){
									// highlight the corresponding bar diagram item
									// get series index of series
									var seriesIndex = getSeriesIndexByFeatureName(featureProperties.spatialUnitFeatureName);

									if(seriesIndex > -1){
										$scope.lineChart.dispatchAction({
												type: 'downplay',
												seriesIndex: seriesIndex
										});
									}
								};

							} ]
				});
