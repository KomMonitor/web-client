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
							function WpsExecuteController(wpsPropertiesService,
									wpsFormControlService) {
								this.wpsPropertiesServiceInstance = wpsPropertiesService;
								this.wpsFormControlServiceInstance = wpsFormControlService;

								// based on prepared DOM, initialize echarts instance
				        var myChart = echarts.init(document.getElementById('barDiagram'));

				        // specify chart configuration item and data
				        var option = {
				            title: {
				                text: 'ECharts entry example'
				            },
				            tooltip: {},
				            legend: {
				                data:['Sales']
				            },
				            xAxis: {
				                data: ["shirt","cardign","chiffon shirt","pants","heels","socks"]
				            },
				            yAxis: {},
				            series: [{
				                name: 'Sales',
				                type: 'bar',
				                data: [5, 20, 36, 10, 10, 20]
				            }]
				        };

				        // use configuration item and data specified to show chart
				        myChart.setOption(option);

							} ]
				});
