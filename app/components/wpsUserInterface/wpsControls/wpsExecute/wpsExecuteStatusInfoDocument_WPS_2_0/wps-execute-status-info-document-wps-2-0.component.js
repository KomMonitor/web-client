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

								$scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, isMeasureOfValueChecked, measureOfValue) {

									console.log("updating radar diagram");

									updateRadarChart(indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date);

								});

								// RADAR CHART TIME SERIES FUNCTION
								var updateRadarChart = async function(indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date){
									// based on prepared DOM, initialize echarts instance
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
										indicatorNames.push(indicatorMetadata.indicatorName);
									}

									for(var i=0; i<$scope.allIndicatorProperties.length; i++){
										// make object to hold indicatorName, max value and average value
										var indicatorProperties = $scope.allIndicatorProperties[i];
										var maxValue = 0;
										var valueSum = 0;

										for(var indicatorPropertyInstance of indicatorProperties){
											valueSum += Number(indicatorPropertyInstance[DATE_PREFIX + date]);

											if(Number(indicatorPropertyInstance[DATE_PREFIX + date]) > maxValue)
												maxValue = Number(Number(indicatorPropertyInstance[DATE_PREFIX + date]).toFixed(4));
										}

										// IT MIGHT HAPPEN THAT AN INDICATOR IS INSPECTED THAT DOES NOT SUPPORT THE DATE
										// HENCE ONLY ADD VALUES TO DEFAULT IF THEY SHOW MEANINGFUL VALUES
										if(maxValue > 0 && valueSum > 0){
											indicatorArrayForRadarChart.push({
												name: indicatorNames[i],
												max: maxValue
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
									        // areaStyle: {normal: {}},
													itemStyle: {
							                emphasis: {
							                    lineStyle: {
							                        width: 4
							                    }
							                }
							            },
									        data : [
									            {
									                value : defaultSeriesValueArray,
									                name : 'Durchschnitt',
																	lineStyle: {
							                        normal: {
																					color: 'gray',
							                            type: 'dashed'
							                        }
							                    },
																	itemStyle: {
													            normal: {
													                borderWidth: 3,
													                color: 'gray'
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
											allIndicatorProperties.push(indicatorProperties);
										}
										catch(error){
							        throw error;
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


							} ]
				});
