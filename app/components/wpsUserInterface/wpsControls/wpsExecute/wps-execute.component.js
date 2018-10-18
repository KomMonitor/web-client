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

									//sort array of features
									var features = indicatorMetadataAndGeoJSON.geoJSON.features;
									features.sort(compareFeaturesByIndicatorValue);

									for(var feature of indicatorMetadataAndGeoJSON.geoJSON.features){
										featureNamesArray.push(feature.properties.spatialUnitFeatureName);

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

										indicatorValueArray.push(seriesItem);
									}

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
					                text: 'Bar Chart'
					            },
					            tooltip: {},
					            legend: {
					                data:[indicatorMetadataAndGeoJSON.indicatorName]
					            },
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
					            yAxis: {},
					            series: [{
					                name: indicatorMetadataAndGeoJSON.indicatorName,
					                type: 'bar',
					                data: indicatorValueArray
					            }]
					        };

					        // use configuration item and data specified to show chart
					        barChart.setOption(option);

								});

							} ]
				});
