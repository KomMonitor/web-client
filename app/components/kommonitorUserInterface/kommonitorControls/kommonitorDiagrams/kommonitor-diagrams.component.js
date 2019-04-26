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
							'$scope', '$rootScope', '__env',
							function kommonitorDiagramsController(kommonitorDataExchangeService,
									$scope, $rootScope, __env) {
								this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

								const INDICATOR_DATE_PREFIX = __env.indicatorDatePrefix;
								const defaultColorForHoveredFeatures = __env.defaultColorForHoveredFeatures;
								const defaultColorForClickedFeatures = __env.defaultColorForClickedFeatures;

								// $scope.userHoveresOverBarItem = false;
								$scope.eventsRegistered = false;
								$scope.isTooManyFeatures = false;
								$scope.histogramCanBeDisplayed = false;
								$scope.spatialUnitName;
								$scope.date;
								var numberOfDecimals = __env.numberOfDecimals;
								var defaultColorForZeroValues = __env.defaultColorForZeroValues;
								var defaultColorForFilteredValues = __env.defaultColorForFilteredValues;

								const defaultColorForOutliers_high = __env.defaultColorForOutliers_high;
								const defaultBorderColorForOutliers_high = __env.defaultBorderColorForOutliers_high;
								const defaultFillOpacityForOutliers_high = __env.defaultFillOpacityForOutliers_high;
								const defaultColorForOutliers_low = __env.defaultColorForOutliers_low;
								const defaultBorderColorForOutliers_low = __env.defaultBorderColorForOutliers_low;
								const defaultFillOpacityForOutliers_low = __env.defaultFillOpacityForOutliers_low;

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

								var getColorForFeature = function(feature, indicatorMetadataAndGeoJSON, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue){
									var color;

									if(kommonitorDataExchangeService.filteredIndicatorFeatureNames.includes(feature.properties.spatialUnitFeatureName)){
										color = defaultColorForFilteredValues;
									}
									else if(Number(feature.properties[$scope.indicatorPropertyName]) === 0 ){
										color = defaultColorForZeroValues;
									}
									else if(feature.properties["outlier"].includes("low") ){
										color = defaultColorForOutliers_low;
									}
									else if(feature.properties["outlier"].includes("high") ){
										color = defaultColorForOutliers_high;
									}
									else if(isMeasureOfValueChecked){

										if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) >= +Number(measureOfValue).toFixed(numberOfDecimals)){

											for (var index=0; index < gtMeasureOfValueBrew.breaks.length; index++){

												if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) == +Number(gtMeasureOfValueBrew.breaks[index]).toFixed(numberOfDecimals)){
													if(index < gtMeasureOfValueBrew.breaks.length -1){
														// min value
														color =  gtMeasureOfValueBrew.colors[index];
														break;
													}
													else {
														//max value
														if (gtMeasureOfValueBrew.colors[index]){
															color =  gtMeasureOfValueBrew.colors[index];
														}
														else{
															color =  gtMeasureOfValueBrew.colors[index - 1];
														}
														break;
													}
												}
												else{
													if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) < +Number(gtMeasureOfValueBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
														color =  gtMeasureOfValueBrew.colors[index];
														break;
													}
												}
											}
										}
										else {

											// invert colors, so that lowest values will become strong colored!
											for (var index=0; index < ltMeasureOfValueBrew.breaks.length; index++){
												if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) == +Number(ltMeasureOfValueBrew.breaks[index]).toFixed(numberOfDecimals)){
													if(index < ltMeasureOfValueBrew.breaks.length -1){
														// min value
														color =  ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index - 1];
														break;
													}
													else {
														//max value
														if (ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index]){
															color =  ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index];
														}
														else{
															color =  ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index - 1];
														}
														break;
													}
												}
												else{
													if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) < +Number(ltMeasureOfValueBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
														color =  ltMeasureOfValueBrew.colors[ltMeasureOfValueBrew.colors.length - index - 1];
														break;
													}
												}
											}

										}

									}
									else{
										if(indicatorMetadataAndGeoJSON.indicatorType === 'DYNAMIC'){

											if(feature.properties[$scope.indicatorPropertyName] < 0){

												for (var index=0; index < dynamicDecreaseBrew.breaks.length; index++){
													if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) == +Number(dynamicDecreaseBrew.breaks[index]).toFixed(numberOfDecimals)){
														if(index < dynamicDecreaseBrew.breaks.length -1){
															// min value
															color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index - 1];
															break;
														}
														else {
															//max value
															if (dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index]){
																color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index];
															}
															else{
																color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index - 1];
															}
															break;
														}
													}
													else{
														if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) < +Number(dynamicDecreaseBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
															color =  dynamicDecreaseBrew.colors[dynamicDecreaseBrew.colors.length - index - 1];
															break;
														}
													}
												}
											}
											else{
												for (var index=0; index < dynamicIncreaseBrew.breaks.length; index++){
													if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) == +Number(dynamicIncreaseBrew.breaks[index]).toFixed(numberOfDecimals)){
														if(index < dynamicIncreaseBrew.breaks.length -1){
															// min value
															color =  dynamicIncreaseBrew.colors[index];
															break;
														}
														else {
															//max value
															if (dynamicIncreaseBrew.colors[index]){
																color =  dynamicIncreaseBrew.colors[index];
															}
															else{
																color =  dynamicIncreaseBrew.colors[index - 1];
															}
															break;
														}
													}
													else{
														if(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals) < +Number(dynamicIncreaseBrew.breaks[index + 1]).toFixed(numberOfDecimals)) {
															color =  dynamicIncreaseBrew.colors[index];
															break;
														}
													}
												}
											}

										}
										else{
												color = defaultBrew.getColorInRange(+Number(feature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals));
										}
									}

									return color;
								}

								$scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, spatialUnitId, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue, justRestyling) {

									// console.log("Updating diagrams!");

									showLoadingIcons();

									var selectedIndicator = kommonitorDataExchangeService.selectedIndicator;

									$scope.spatialUnitName = spatialUnitName;
									$scope.date = date;

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
									var cartographicFeatures = indicatorMetadataAndGeoJSON.geoJSON.features;
									cartographicFeatures.sort(compareFeaturesByIndicatorValue);
									var selectedFeatures = selectedIndicator.geoJSON.features;
									selectedFeatures.sort(compareFeaturesByIndicatorValue);

									for (var j=0; j < cartographicFeatures.length; j++){
										// diff occurs when balance mode is activated
										// then, cartographicFeatures display balance over time period, which shall be reflected in bar chart and histogram
										// the other diagrams must use the "normal" unbalanced indicator instead --> selectedFeatures
										cartographicFeature = cartographicFeatures[j];
										selectedFeature = selectedFeatures[j];


										featureNamesArray.push(cartographicFeature.properties.spatialUnitFeatureName);
										indicatorValueArray.push(+Number(cartographicFeature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals));

										var color = getColorForFeature(cartographicFeature, indicatorMetadataAndGeoJSON, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, dynamicIncreaseBrew, dynamicDecreaseBrew, isMeasureOfValueChecked, measureOfValue);


										var seriesItem = {
											value: +Number(cartographicFeature.properties[$scope.indicatorPropertyName]).toFixed(numberOfDecimals),
											itemStyle: {
												color: color
											}
										};

										indicatorValueBarChartArray.push(seriesItem);

										// continue timeSeries arrays by adding and counting all time series values
										for(var i=0; i<indicatorTimeSeriesDatesArray.length; i++){
											var datePropertyName = INDICATOR_DATE_PREFIX + indicatorTimeSeriesDatesArray[i];
											indicatorTimeSeriesAverageArray[i] += selectedFeature.properties[datePropertyName];
											indicatorTimeSeriesCountArray[i] ++;
										}
									}

									// finish timeSeries arrays by computing averages of all time series values
									for(var i=0; i<indicatorTimeSeriesDatesArray.length; i++){
										indicatorTimeSeriesAverageArray[i] = +Number(indicatorTimeSeriesAverageArray[i] / indicatorTimeSeriesCountArray[i]).toFixed(numberOfDecimals);
									}

									updateHistogramChart(indicatorMetadataAndGeoJSON, indicatorValueArray);

									updateLineChart(indicatorMetadataAndGeoJSON, indicatorTimeSeriesDatesArray, indicatorTimeSeriesAverageArray);

									// bar chart only if feature number is below 75
									if (indicatorMetadataAndGeoJSON.geoJSON.features.length > 50){
										console.log("Number of features too big (more than 50). Thus bar diagram cannot be created");

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
									var bins;
									try{
										bins = ecStat.histogram(indicatorValueArray);
										$scope.histogramCanBeDisplayed = true;
									}
									catch(error){
										console.log("Histogram chart cannot be drawn");
										$scope.histogramCanBeDisplayed = false;
										if(!$scope.histogramChart){
											$scope.histogramChart.dispose();
										}
										return;
									}


									if(!$scope.histogramChart)
										$scope.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
									else{
										// explicitly kill and reinstantiate histogram diagram to avoid zombie states on spatial unit change
										$scope.histogramChart.dispose();
										$scope.histogramChart = echarts.init(document.getElementById('histogramDiagram'));
									}

									$scope.histogramChart.hideLoading();

									// default fontSize of echarts title
									var fontSize = 18;
									var histogramChartTitel = 'Histogramm - ' + $scope.spatialUnitName + ' - ';
									if(indicatorMetadataAndGeoJSON.fromDate){
										histogramChartTitel += "Bilanz " + indicatorMetadataAndGeoJSON.fromDate + " - " + indicatorMetadataAndGeoJSON.toDate;
										fontSize = 14;
									}
									else{
										histogramChartTitel += $scope.date;
									}

									$scope.histogramOption = {
                    title: {
											text: histogramChartTitel,
											left: 'center',
											textStyle:{
												fontSize: fontSize
											}
											// top: 15
                    },
                    tooltip: {
											trigger: 'item',
											confine: 'true',
											axisPointer: {
													type: 'line',
													crossStyle: {
															color: '#999'
													}
											}
										},
										toolbox: {
												show : true,
												right: '25',
												feature : {
														// mark : {show: true},
														dataView : {show: true, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Histogramm', 'schlie&szlig;en', 'refresh'], optionToContent: function(opt){

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

														var histogramData = opt.series[0].data;

														var dataTableId = "histogramDataTable";
														var tableExportName = opt.xAxis[0].name + " - " + opt.title[0].text;

															var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
															htmlString += "<thead>";
															htmlString += "<tr>";
															htmlString += "<th style='text-align:center;'>Wertintervall</th>";
															htmlString += "<th style='text-align:center;'>H&auml;ufigkeit</th>";
															htmlString += "</tr>";
															htmlString += "</thead>";

															htmlString += "<tbody>";

															for (var i=0; i<histogramData.length; i++){
																htmlString += "<tr>";
																htmlString += "<td>" + histogramData[i][0] + " &mdash; " + histogramData[i][1] + "</td>";
																htmlString += "<td>" + histogramData[i][2] + "</td>";
																htmlString += "</tr>";
															}

															htmlString += "</tbody>";
															htmlString += "</table>";

															$rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);

													    return htmlString;
														}},
														restore : {show: true, title: "Erneuern"},
														saveAsImage : {show: true, title: "Export"}
												}
										},
                    xAxis: [{
											name: indicatorMetadataAndGeoJSON.indicatorName,
											nameLocation: 'center',
											nameGap: 25,
                      scale: true,
                    }],
                    yAxis: {
											name: 'Anzahl Features',
											// nameGap: 35,
											// nameLocation: 'center',
											// nameRotate: 90,
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

								if(onlyContainsPositiveNumbers(indicatorValueArray)){
									$scope.histogramOption.xAxis.min = 0;
								}

									$scope.histogramChart.setOption($scope.histogramOption);
								};

								var onlyContainsPositiveNumbers = function(indicatorValueArray){
									indicatorValueArray.forEach(function(element){
										if(element < 0){
											return false;
										}
									});

									return true;
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

										// default fontSize of echarts
										var fontSize = 18;
										var barChartTitel = 'Feature-Vergleich - ' + $scope.spatialUnitName + ' - ';
										if(indicatorMetadataAndGeoJSON.fromDate){
											barChartTitel += "Bilanz " + indicatorMetadataAndGeoJSON.fromDate + " - " + indicatorMetadataAndGeoJSON.toDate;
											fontSize = 14;
										}
										else{
											barChartTitel += $scope.date;
										}

									$scope.barOption = {
											title: {
													text: barChartTitel,
													left: 'center',
													textStyle:{
														fontSize: fontSize
													}
									        // top: 15
											},
											tooltip: {
													trigger: 'item',
													confine: 'true',
													formatter: function (params) {
					                            return "" + params.name + ": " + Number(params.value).toLocaleString('de-DE', {maximumFractionDigits: numberOfDecimals}) + " [" + kommonitorDataExchangeService.selectedIndicator.unit + "]";
					                           },
													axisPointer: {
															type: 'line',
															crossStyle: {
																	color: '#999'
															}
													}
											},
											toolbox: {
													show : true,
													right: '25',
													feature : {
															// mark : {show: true},
															dataView : {show: true, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Feature-Vergleich', 'schlie&szlig;en', 'refresh'], optionToContent: function(opt){

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

															var barData = opt.series[0].data;
															var featureNames = opt.xAxis[0].data;

															var dataTableId = "barDataTable";
															var tableExportName = opt.xAxis[0].name + " - " + opt.title[0].text;

																var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
																htmlString += "<thead>";
																htmlString += "<tr>";
																htmlString += "<th style='text-align:center;'>Feature-Name</th>";
																htmlString += "<th style='text-align:center;'>" + opt.xAxis[0].name + " [" + opt.yAxis[0].name + "]</th>";
																htmlString += "</tr>";
																htmlString += "</thead>";

																htmlString += "<tbody>";

																for (var i=0; i<barData.length; i++){
																	htmlString += "<tr>";
																	htmlString += "<td>" + featureNames[i] + "</td>";
																	htmlString += "<td>" + +Number(barData[i].value).toFixed(numberOfDecimals) + "</td>";
																	htmlString += "</tr>";
																}

																htmlString += "</tbody>";
																htmlString += "</table>";

																$rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);

														    return htmlString;
															}},
															restore : {show: true, title: "Erneuern"},
															saveAsImage : {show: true, title: "Export"}
													}
											},
											// legend: {
											// 		//data:[indicatorMetadataAndGeoJSON.indicatorName]
											// },
											xAxis: {
													name: indicatorMetadataAndGeoJSON.indicatorName,
													nameLocation: 'center',
													nameGap: 25,
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
									        type: 'value',
									        name: indicatorMetadataAndGeoJSON.unit,
									        // splitArea: {
									        //     show: true
									        // }
									    },
											series: [{
													// name: indicatorMetadataAndGeoJSON.indicatorName,
													type: 'bar',
													emphasis: {
														itemStyle: {
															borderWidth: 4,
															borderColor: defaultColorForClickedFeatures
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
													text: 'Zeitreihe - ' + $scope.spatialUnitName,
													left: 'center',
									        // top: 15
											},
											tooltip: {
													trigger: 'axis',
													confine: 'true',
													formatter: function (params) {

																			var string = "" + params[0].axisValueLabel + "<br/>";

																			params.forEach(function(paramObj){
																				string += paramObj.seriesName + ": " + Number(paramObj.value).toLocaleString('de-DE', {maximumFractionDigits: numberOfDecimals}) + " [" + kommonitorDataExchangeService.selectedIndicator.unit + "]" + "<br/>";
																			});

					                            return string;
					                           },
													axisPointer: {
															type: 'line',
															crossStyle: {
																	color: '#999'
															}
													}
											},
											toolbox: {
													show : true,
													right: '25',
													feature : {
															// mark : {show: true},
															dataView : {show: true, readOnly: true, title: "Datenansicht", lang: ['Datenansicht - Zeitreihe', 'schlie&szlig;en', 'refresh'], optionToContent: function(opt){

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

															var lineSeries = opt.series;
															var timestamps = opt.xAxis[0].data;

															var dataTableId = "lineDataTable";
															var tableExportName = opt.xAxis[0].name + " - " + opt.title[0].text;

																var htmlString = '<table id="' + dataTableId + '" class="table table-bordered table-condensed" style="width:100%;text-align:center;">';
																htmlString += "<thead>";
																htmlString += "<tr>";
																htmlString += "<th style='text-align:center;'>Zeitpunkt</th>";

																for (var i=0; i<lineSeries.length; i++){
																	htmlString += "<th style='text-align:center;'>" + lineSeries[i].name + " [" + opt.yAxis[0].name + "]</th>";
																}

																htmlString += "</tr>";
																htmlString += "</thead>";

																htmlString += "<tbody>";

																for (var j=0; j<timestamps.length; j++){
																	htmlString += "<tr>";
																	htmlString += "<td>" + timestamps[j] + "</td>";
																	for (var k=0; k<lineSeries.length; k++){
																		htmlString += "<td>" + +Number(lineSeries[k].data[j]).toFixed(numberOfDecimals) + "</td>";
																	}
																	htmlString += "</tr>";
																}

																htmlString += "</tbody>";
																htmlString += "</table>";

																$rootScope.$broadcast("AppendExportButtonsForTable", dataTableId, tableExportName);

														    return htmlString;
															}},
															restore : {show: true, title: "Erneuern"},
															saveAsImage : {show: true, title: "Export"}
													}
											},
											legend: {
													type: "scroll",
													bottom: 0,
													data:['Durchschnitt']
											},
											xAxis: {
													name: indicatorMetadataAndGeoJSON.indicatorName,
													nameLocation: 'center',
													nameGap: 25,
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
									        type: 'value',
									        name: indicatorMetadataAndGeoJSON.unit,
									        // splitArea: {
									        //     show: true
									        // }
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

									if(! $scope.lineOption.legend.data.includes(featureProperties.spatialUnitFeatureName)){
										appendSeriesToLineChart(featureProperties);
									}

									highlightFeatureInBarChart(featureProperties);
									highlightFeatureInLineChart(featureProperties);
								});

								var appendSeriesToLineChart = function(featureProperties){

									// in case of activated balance mode, we must use the properties of kommonitorDataExchangeService.selectedIndicator, to aquire the correct time series item!
									if(kommonitorDataExchangeService.isBalanceChecked){
										featureProperties = findPropertiesForTimeSeries(featureProperties.spatialUnitFeatureName);
									}

									// append feature name to legend
									$scope.lineOption.legend.data.push(featureProperties.spatialUnitFeatureName);

									// create feature data series
									var featureSeries = {};
									featureSeries.name = featureProperties.spatialUnitFeatureName;
									featureSeries.type = 'line';
									featureSeries.data = new Array();

									// for each date create series data entry for feature
									for (var date of $scope.lineOption.xAxis.data){
										featureSeries.data.push(+Number(featureProperties[INDICATOR_DATE_PREFIX + date]).toFixed(numberOfDecimals));
									}

									$scope.lineOption.series.push(featureSeries);

									$scope.lineChart.setOption($scope.lineOption);
								};

								var findPropertiesForTimeSeries = function(spatialUnitFeatureName){
									for(var feature of kommonitorDataExchangeService.selectedIndicator.geoJSON.features){
										if(feature.properties.spatialUnitFeatureName === spatialUnitFeatureName){
											return feature.properties;
										}
									}
								}

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

								$scope.$on("AppendExportButtonsForTable", function (event, tableId, tableExportName) {

									setTimeout(function () {


										// new TableExport(document.getElementsByTagName("table"), {
										new TableExport(document.getElementById(tableId), {
												headers: true,                              // (Boolean), display table headers (th or td elements) in the <thead>, (default: true)
												footers: true,                              // (Boolean), display table footers (th or td elements) in the <tfoot>, (default: false)
												formats: ['xlsx', 'csv', 'txt'],            // (String[]), filetype(s) for the export, (default: ['xlsx', 'csv', 'txt'])
												filename: tableExportName,                             // (id, String), filename for the downloaded file, (default: 'id')
												bootstrap: true,                           // (Boolean), style buttons using bootstrap, (default: true)
												exportButtons: true,                        // (Boolean), automatically generate the built-in export buttons for each of the specified formats (default: true)
												position: 'top',                         // (top, bottom), position of the caption element relative to table, (default: 'bottom')
												ignoreRows: null,                           // (Number, Number[]), row indices to exclude from the exported file(s) (default: null)
												ignoreCols: null,                           // (Number, Number[]), column indices to exclude from the exported file(s) (default: null)
												trimWhitespace: true                        // (Boolean), remove all leading/trailing newlines, spaces, and tabs from cell text in the exported file(s) (default: false)
										});
							    }, 50);


								});

							} ]
				});
