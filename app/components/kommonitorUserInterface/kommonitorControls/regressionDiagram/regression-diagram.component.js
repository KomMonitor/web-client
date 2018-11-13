angular
		.module('regressionDiagram')
		.component(
				'regressionDiagram',
				{
					templateUrl : "components/kommonitorUserInterface/kommonitorControls/regressionDiagram/regression-diagram.template.html",

					controller : [
							'kommonitorDataExchangeService', '$scope', '$http',
							function indicatorRadarController(
									kommonitorDataExchangeService, $scope, $http) {
								/*
								 * reference to kommonitorDataExchangeService instances
								 */
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

								const DATE_PREFIX = "DATE_";

								//$scope.allIndicatorProperties;
								$scope.selectedIndicatorForXAxis;
								$scope.selectedIndicatorForYAxis;
								$scope.correlation;
								$scope.linearRegression;
								$scope.regressionOption;
								$scope.regressionChart;

								$scope.sortedIndicatorProps;

								kommonitorDataExchangeService.selectedDate;
								$scope.spatialUnitName;

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

								$scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) {

									if($scope.regressionChart){
										$scope.regressionChart.dispose();
										$scope.regressionChart = undefined;
									}

									$scope.selectedIndicatorForXAxis = undefined;
									$scope.selectedIndicatorForYAxis = undefined;
									$scope.correlation = undefined;
									$scope.linearRegression = undefined;
									$scope.regressionOption = undefined;
									$scope.sortedIndicatorProps = undefined;
									$scope.spatialUnitName = spatialUnitName;

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

								$scope.buildDataArrayForSelectedIndicators = function(){
									var data = new Array();

									var indicatorPropertiesArrayForXAxis = $scope.getPropertiesForIndicatorName($scope.selectedIndicatorForXAxis.indicatorName);
									var indicatorPropertiesArrayForYAxis = $scope.getPropertiesForIndicatorName($scope.selectedIndicatorForYAxis.indicatorName);

									for (var i=0; i<indicatorPropertiesArrayForXAxis.length; i++){

										// + sign turns output into number!
										var xAxisDataElement = +indicatorPropertiesArrayForXAxis[i][DATE_PREFIX + kommonitorDataExchangeService.selectedDate];
										var yAxisDataElement = +indicatorPropertiesArrayForYAxis[i][DATE_PREFIX + kommonitorDataExchangeService.selectedDate];
										data.push([Number(xAxisDataElement.toFixed(4)), Number(yAxisDataElement.toFixed(4))]);
									}

									return data;
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
											$scope.linearRegression.points[i][0] = Number($scope.linearRegression.points[i][0].toFixed(4));
											$scope.linearRegression.points[i][1] = Number($scope.linearRegression.points[i][1].toFixed(4));
										}

										$scope.regressionOption = {
										    title: {
										        text: 'Lineare Regression',
										        left: 'center'
										    },
										    tooltip: {
										        trigger: 'axis',
										        axisPointer: {
										            type: 'cross'
										        }
										    },
										    xAxis: {
														name: $scope.selectedIndicatorForXAxis.indicatorName + ", Einheit: " + $scope.selectedIndicatorForXAxis.unit,
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
														name: $scope.selectedIndicatorForYAxis.indicatorName + ", Einheit: " + $scope.selectedIndicatorForYAxis.unit,
														nameLocation: 'center',
														nameGap: 60,
										        type: 'value',
										        min: 1.5,
										        splitLine: {
										            lineStyle: {
										                type: 'dashed'
										            }
										        },
										    },
										    series: [{
										        name: 'scatter',
										        type: 'scatter',
										        label: {
										            emphasis: {
										                show: true,
										                position: 'left',
										                textStyle: {
										                    color: 'blue',
										                    fontSize: 16
										                }
										            }
										        },
										        data: data
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

									}
								}


							} ]
				});
