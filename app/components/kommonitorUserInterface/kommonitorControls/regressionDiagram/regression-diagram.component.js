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

										var xAxisDataElement = indicatorPropertiesArrayForXAxis[i][DATE_PREFIX + kommonitorDataExchangeService.selectedDate];
										var yAxisDataElement = indicatorPropertiesArrayForYAxis[i][DATE_PREFIX + kommonitorDataExchangeService.selectedDate];
										data.push([xAxisDataElement, yAxisDataElement]);
									}

									return data;
								};

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

										$scope.linearRegression = ecStat.regression('linear', data);

										$scope.linearRegression.points.sort(function(a, b) {
										    return a[0] - b[0];
										});

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
										        type: 'value',
										        splitLine: {
										            lineStyle: {
										                type: 'dashed'
										            }
										        },
										    },
										    yAxis: {
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
