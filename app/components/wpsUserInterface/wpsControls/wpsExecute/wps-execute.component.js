angular
		.module('wpsExecute')
		.component(
				'wpsExecute',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsExecute/wps-execute.template.html",
					/*
					 * injected with a modules service method that manages
					 * enabled tabs
					 */
					controller : [
							'wpsPropertiesService',
							'wpsFormControlService',
							'$scope',
							function WpsExecuteController(wpsPropertiesService,
									wpsFormControlService, $scope) {
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								this.wpsFormControlServiceInstance = wpsFormControlService;

								const INDICATOR_DATE_PREFIX = "DATE_";

								var compareFeaturesByIndicatorValue = function(featureA, featureB) {
								  if (featureA.properties[$scope.indicatorPropertyName] < featureB.properties[$scope.indicatorPropertyName])
								    return -1;
								  if (featureA.properties[$scope.indicatorPropertyName] > featureB.properties[$scope.indicatorPropertyName])
								    return 1;
								  return 0;
								}

								$scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, isMeasureOfValueChecked, measureOfValue) {

									console.log("Updating diagrams!");
									$scope.indicatorPropertyName = INDICATOR_DATE_PREFIX + date;

									var featureNamesArray = new Array();
									var indicatorValueArray = new Array();
									var indicatorValueBarChartArray = new Array();

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
									}

									updateBarChart(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray);

									updateHistogramChart(indicatorMetadataAndGeoJSON, indicatorValueArray);

								});

								//HISTOGRAM CHART FUNCTION
								var updateHistogramChart = function(indicatorMetadataAndGeoJSON, indicatorValueArray){
									var bins = ecStat.histogram(indicatorValueArray);

									var histogramChart = echarts.init(document.getElementById('histogramDiagram'));

								// 	var option = {
                //     title: {
								// 			text: 'Histogram Chart',
								// 			left: 'center',
								// 			top: 20
                //     },
                //     tooltip: {
								// 			trigger: 'axis',
								// 			axisPointer: {
								// 					type: 'cross',
								// 					crossStyle: {
								// 							color: '#999'
								// 					}
								// 			}
								// 		},
                //     xAxis: [{
								// 			name: 'Wertintervalle',
								// 			nameLocation: 'center',
								// 			nameGap: 15,
                //         scale: true,
                //     }],
                //     yAxis: {
								// 			name: 'Anzahl Features',
								// 			nameGap: 24,
								// 			nameLocation: 'center',
								// 			nameRotate: 90,
                //     },
                //     series: [{
                //         type: 'custom',
								// 				name: indicatorMetadataAndGeoJSON.indicatorName,
                //         renderItem: function (params, api) {
                //             var yValue = api.value(2);
                //             var start = api.coord([api.value(0), yValue]);
                //             var size = api.size([api.value(1) - api.value(0), yValue]);
                //             return {
                //                 type: 'rect',
                //                 shape: {
                //                     x: start[0],
                //                     y: start[1],
                //                     width: size[0] * 0.99,
                //                     height: size[1]
                //                 },
                //                 style: api.style()
                //             };
                //         },
                //         itemStyle: {
                //             color: 'rgb(25, 183, 207)'
                //         },
                //         // label: {
                //         //     normal: {
                //         //         show: true,
                //         //         position: 'insideTop'
                //         //     }
                //         // },
                //         dimensions: ['untere Intervallgrenze', 'obere Intervallgrenze', 'Anzahl'],
                //         encode: {
                //             x: [0, 1],
                //             y: 2,
                //             tooltip: [0, 1, 2]
                //         },
                //         data: bins.customData
                //     }]
                // };

								var option = {
                    title: {
                        text: 'Histogram Chart',
                        left: 'center',
                        top: 20
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
                    color: ['rgb(25, 183, 207)'],
                    grid: {
                        left: '3%',
                        right: '3%',
                        bottom: '3%',
                        containLabel: true
                    },
										xAxis: [{
												type: 'value',
													name: 'Wertintervalle',
													nameLocation: 'center',
													nameGap: 15,
		                        scale: true,
		                    }],
		                    yAxis: {
													type: 'value',
													name: 'Anzahl Features',
													nameGap: 24,
													nameLocation: 'center',
													nameRotate: 90,
		                    },
                    series: [{
                        name: 'Anzahl',
                        type: 'bar',
                        // label: {
                        //     normal: {
                        //         show: true,
                        //         position: 'insideTop',
                        //         formatter: function (params) {
                        //             return params.value[1];
                        //         }
                        //     }
                        // },
                        data: bins.data
                    }]
                };

									histogramChart.setOption(option);
								};

								// BAR CHART FUNCTION

								var updateBarChart = function(indicatorMetadataAndGeoJSON, featureNamesArray, indicatorValueBarChartArray){
									// based on prepared DOM, initialize echarts instance
									var barChart = echarts.init(document.getElementById('barDiagram'));

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

									var option = {
											title: {
													text: 'Bar Chart',
													left: 'center',
									        top: 20
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
													data: indicatorValueBarChartArray
											}]
									};

									// use configuration item and data specified to show chart
									barChart.setOption(option);
								};

							} ]
				});
