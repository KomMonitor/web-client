angular
		.module('wpsExecuteStatusInfoDocumentWps2')
		.component(
				'wpsExecuteStatusInfoDocumentWps2',
				{
					templateUrl : "components/wpsUserInterface/wpsControls/wpsExecute/wpsExecuteStatusInfoDocument_WPS_2_0/wps-execute-status-info-document-wps-2-0.template.html",

					controller : [
							'wpsPropertiesService', '$scope',
							function WpsExecuteStatusInfoDocumentWps2Controller(
									wpsPropertiesService, $scope) {
								/*
								 * reference to wpsPropertiesService instances
								 */
								this.wpsPropertiesServiceInstance = wpsPropertiesService;

								$scope.$on("updateDiagrams", function (event, indicatorMetadataAndGeoJSON, spatialUnitName, date, defaultBrew, gtMeasureOfValueBrew, ltMeasureOfValueBrew, isMeasureOfValueChecked, measureOfValue) {

									console.log("updating radar diagram");

									updateRadarChart(indicatorMetadataAndGeoJSON);

								});

								// RADAR CHART TIME SERIES FUNCTION
								var updateRadarChart = function(indicatorMetadataAndGeoJSON){
									// based on prepared DOM, initialize echarts instance
									if(!$scope.radarChart)
										$scope.radarChart = echarts.init(document.getElementById('radarDiagram'));

									$scope.radarChart.hideLoading();

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

									$scope.radarOption = {
											title: {
													text: 'Indikatoren im Vergleich',
													left: 'left',
									        top: 15
											},
											tooltip: {
											},
											legend: {
													data: ['预算分配（Allocated Budget）', '实际开销（Actual Spending）']
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
									        indicator: [
									           { name: '销售（sales）', max: 6500},
									           { name: '管理（Administration）', max: 16000},
									           { name: '信息技术（Information Techology）', max: 30000},
									           { name: '客服（Customer Support）', max: 38000},
									           { name: '研发（Development）', max: 52000},
									           { name: '市场（Marketing）', max: 25000}
									        ]
									    },
											series: [{
									        name: '预算 vs 开销（Budget vs spending）',
									        type: 'radar',
									        // areaStyle: {normal: {}},
									        data : [
									            {
									                value : [4300, 10000, 28000, 35000, 50000, 19000],
									                name : '预算分配（Allocated Budget）'
									            },
									             {
									                value : [5000, 14000, 28000, 31000, 42000, 21000],
									                name : '实际开销（Actual Spending）'
									            }
									        ]
									    }]
									};

									// use configuration item and data specified to show chart
									$scope.radarChart.setOption($scope.radarOption);
								};


							} ]
				});
