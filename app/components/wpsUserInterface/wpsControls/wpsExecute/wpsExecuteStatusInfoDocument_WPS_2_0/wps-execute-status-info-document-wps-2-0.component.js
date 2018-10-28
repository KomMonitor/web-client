angular
		.module('wpsExecuteStatusInfoDocumentWps2')
		.component(
				'wpsExecuteStatusInfoDocumentWps2',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteStatusInfoDocument_WPS_2_0/wps-execute-status-info-document-wps-2-0.template.html",

					controller : [
							'wpsPropertiesService', '$scope', '$http',
							function WpsExecuteStatusInfoDocumentWps2Controller(
									wpsPropertiesService, $scope, $http) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;

								const DATE_PREFIX = "DATE_";

								$scope.allIndicatorProperties;
								$scope.namesOfFailesIndicators  = new Array();

								$scope.date;

								$scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) {

									// if the layer is just restyled (i.e. due to change of measureOfValue)
									// then we do not need to costly update the radar diagram
									if(justRestyling){
										return;
									}

									console.log("updating radar diagram");

									updateRadarChart(indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date);

								});

								// RADAR CHART TIME SERIES FUNCTION
								var updateRadarChart = async function(indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date){
									// based on prepared DOM, initialize echarts instance
									$scope.date = date;

									$scope.namesOfFailesIndicators = new Array();

									if(!$scope.radarChart)
										$scope.radarChart = echarts.init(document.getElementById('radarDiagram'));

									$scope.radarChart.showLoading();

									var indicatorArrayForRadarChart = new Array();
									var defaultSeriesValueArray = new Array();

									// fetch properties of all indicators for targetSpatialunit and date
									try{
										$scope.allIndicatorProperties = await fetchAllIndicatorProperties(spatialUnitId, date);
									}
									catch(error){
										throw error;
									}

									// iterate over all indicator properties
									var indicatorNames = new Array();
									for (var indicatorMetadata of wpsPropertiesService.availableIndicators){
										if(!$scope.namesOfFailesIndicators.includes(indicatorMetadata.indicatorName))
											indicatorNames.push(indicatorMetadata.indicatorName);
									}

									for(var i=0; i<$scope.allIndicatorProperties.length; i++){
										// make object to hold indicatorName, max value and average value
										var indicatorProperties = $scope.allIndicatorProperties[i];

										var sample = indicatorProperties[0];
										var maxValue = sample[DATE_PREFIX + date];
										var minValue = sample[DATE_PREFIX + date];
										var valueSum = 0;

										for(var indicatorPropertyInstance of indicatorProperties){
											valueSum += Number(indicatorPropertyInstance[DATE_PREFIX + date]);

											if(Number(indicatorPropertyInstance[DATE_PREFIX + date]) > maxValue)
												maxValue = Number(Number(indicatorPropertyInstance[DATE_PREFIX + date]).toFixed(4));

											if(Number(indicatorPropertyInstance[DATE_PREFIX + date]) < minValue)
												minValue = Number(Number(indicatorPropertyInstance[DATE_PREFIX + date]).toFixed(4));
										}

										// IT MIGHT HAPPEN THAT AN INDICATOR IS INSPECTED THAT DOES NOT SUPPORT THE DATE
										// HENCE ONLY ADD VALUES TO DEFAULT IF THEY SHOW MEANINGFUL VALUES
										if(maxValue > 0 && valueSum > 0){
											indicatorArrayForRadarChart.push({
												name: indicatorNames[i],
												max: maxValue,
												min: minValue
											});

											defaultSeriesValueArray.push(Number(Number(valueSum/indicatorProperties.length).toFixed(4)));
										}

									}

									$scope.radarOption = {
											title: {
													text: 'Indikatoren im Vergleich - ' + spatialUnitName + ' - ' + date,
													left: 'center',
									        top: 15
											},
											tooltip: {
											},
											legend: {
													data: ['Durchschnitt']
											},
											radar: {
									        // shape: 'circle',
									        name: {
									            textStyle: {
									                color: '#fff',
									                backgroundColor: '#999',
									                borderRadius: 3,
									                padding: [3, 5]
									           }
									        },
									        indicator: indicatorArrayForRadarChart
									    },
											series: [{
									        name: 'Indikatorvergleich',
									        type: 'radar',
													symbolSize: 8,
									        data : [
									            {
									                value : defaultSeriesValueArray,
									                name : 'Durchschnitt',
																	lineStyle: {
																			color: 'gray',
							                        type: 'dashed',
																			width: 4
							                    },
																	itemStyle: {
													            borderWidth: 3,
													            color: 'gray'
													        },
																	emphasis: {
																			lineStyle: {
																					width: 6
																			},
																			itemStyle: {
															            borderType: 'dashed'
															        }
																	}
									            }
									        ]
									    }]
									};

									$scope.radarChart.hideLoading();

									// use configuration item and data specified to show chart
									$scope.radarChart.setOption($scope.radarOption);
								};

								var fetchAllIndicatorProperties = async function(spatialUnitId, date){
									var allIndicatorProperties = new Array();

									var dateComps = date.split("-");

									var year = dateComps[0];
									var month = dateComps[1];
									var day = dateComps[2];

									for (var indicatorMetadata of wpsPropertiesService.availableIndicators){

										try{
											var indicatorProperties = await fetchIndicatorProperties(indicatorMetadata, spatialUnitId, year, month, day);
											if(indicatorProperties)
												allIndicatorProperties.push(indicatorProperties);
										}
										catch(error){
							        console.error("Error while fetching indicatorProperties while updating radar diagram. Error was: " + error);
											console.error("Will ignore the indicator that caused the upper error. Will still try to update radar diagram.");

											$scope.namesOfFailesIndicators.push(indicatorMetadata.indicatorName);
							      }
									}

									return allIndicatorProperties;
								};

								var fetchIndicatorProperties = function(indicatorMetadata, spatialUnitId, year, month, day){
									return $http({
										url: wpsPropertiesService.baseUrlToKomMonitorDataAPI + "/indicators/" + indicatorMetadata.indicatorId + "/" + spatialUnitId + "/" + year + "/" + month + "/" + day + "/without-geometry",
										method: "GET"
									}).then(function successCallback(response) {
											// this callback will be called asynchronously
											// when the response is available
											return response.data;

										}, function errorCallback(response) {
											// called asynchronously if an error occurs
											// or server returns response with an error status.
									});
								}



								$scope.$on("updateDiagramsForHoveredFeature", function (event, featureProperties) {

									console.log("updateRadarDiagramForHoveredFeature called!");

									if(! wpsPropertiesService.clickedIndicatorFeatureNames.includes(featureProperties.spatialUnitFeatureName)){
										appendSeriesToRadarChart(featureProperties);
									}

									highlightFeatureInRadarChart(featureProperties);
								});

								var appendSeriesToRadarChart = function(featureProperties){
									// append feature name to legend
									$scope.radarOption.legend.data.push(featureProperties.spatialUnitFeatureName);

									// create feature data series
									var featureSeries = {};
									featureSeries.name = featureProperties.spatialUnitFeatureName;
									featureSeries.value = new Array();
									featureSeries.emphasis = {
											lineStyle: {
													width: 6,
													type: 'dotted'
											}
									};
									featureSeries.lineStyle = {
										width: 3,
										type: 'solid'
									};
									featureSeries.itemStyle = {
											borderWidth: 3
									};


									// for each date create series data entry for feature
									for(var i=0; i<$scope.allIndicatorProperties.length; i++){
										// make object to hold indicatorName, max value and average value
										var indicatorProperties = $scope.allIndicatorProperties[i];

										for(var indicatorPropertyInstance of indicatorProperties){
											if(indicatorPropertyInstance.spatialUnitFeatureName === featureProperties.spatialUnitFeatureName){
												if(indicatorPropertyInstance[DATE_PREFIX + $scope.date] != undefined && indicatorPropertyInstance[DATE_PREFIX + $scope.date] != null){
													featureSeries.value.push(Number(Number(indicatorPropertyInstance[DATE_PREFIX + $scope.date]).toFixed(4)));
												}
												break;
											}
										}
									}

									$scope.radarOption.series[0].data.push(featureSeries);

									$scope.radarChart.setOption($scope.radarOption);
								};

								var highlightFeatureInRadarChart = function(featureProperties){
									// highlight the corresponding bar diagram item
									// get series index of series
									var dataIndex = getSeriesDataIndexByFeatureName(featureProperties.spatialUnitFeatureName);

									if(dataIndex > -1){
										$scope.radarChart.dispatchAction({
												type: 'highlight',
												seriesIndex: 0,
												dataIndex: dataIndex
										});
									}
								};

								$scope.$on("updateDiagramsForUnhoveredFeature", function (event, featureProperties) {

									console.log("updateRadarDiagramForUnhoveredFeature called!");

									unhighlightFeatureInRadarChart(featureProperties);

									if(! wpsPropertiesService.clickedIndicatorFeatureNames.includes(featureProperties.spatialUnitFeatureName)){
										removeSeriesFromRadarChart(featureProperties);
									}
								});

								var getSeriesDataIndexByFeatureName = function(featureName){
									for(var index=0; index< $scope.radarOption.series[0].data.length; index++){
										if ($scope.radarOption.series[0].data[index].name === featureName)
											return index;
									}

									//return -1 if none was found
									return -1;
								};

								var removeSeriesFromRadarChart = function(featureProperties){
									// remove feature from legend
									var legendIndex = $scope.radarOption.legend.data.indexOf(featureProperties.spatialUnitFeatureName);
									if (legendIndex > -1) {
									  $scope.radarOption.legend.data.splice(legendIndex, 1);
									}

									// remove feature data series
									var dataIndex = getSeriesDataIndexByFeatureName(featureProperties.spatialUnitFeatureName);
									if (dataIndex > -1) {
									  $scope.radarOption.series[0].data.splice(dataIndex, 1);
									}

									// second parameter tells echarts to not merge options with previous data. hence really remove series from graphic
									$scope.radarChart.setOption($scope.radarOption, true);
								};

								var unhighlightFeatureInRadarChart = function(featureProperties){
									// highlight the corresponding bar diagram item
									// get series index of series
									var dataIndex = getSeriesDataIndexByFeatureName(featureProperties.spatialUnitFeatureName);

									if(dataIndex > -1){
										$scope.radarChart.dispatchAction({
												type: 'downplay',
												seriesIndex: 0,
												dataIndex: dataIndex
										});
									}
								};


							} ]
				});
