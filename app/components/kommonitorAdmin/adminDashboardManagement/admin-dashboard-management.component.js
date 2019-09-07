angular.module('adminDashboardManagement').component('adminDashboardManagement', {
	templateUrl : "components/kommonitorAdmin/adminDashboardManagement/admin-dashboard-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function DashboardManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.kommonitorDataExchangeService = kommonitorDataExchangeService;

		$scope.pieChartTooltip = {
				trigger: 'item',
				confine: 'true',
				formatter: "{a} <br/>{b} : {c} ({d}%)",
				textStyle: {
					fontSize: 12
				}
		};

		$scope.pieChartLabel = {
					normal: {
							position: 'inside',
							fontSize: 12
					}
		};

		$scope.usersPerRoleChart = echarts.init(document.getElementById('usersPerRoleDiagram'));
		$scope.usersPerRoleChartOptions;
		$scope.usersPerRoleChart.showLoading();

		$scope.indicatorsPerTopicChart = echarts.init(document.getElementById('indicatorsPerTopicDiagram'));
		$scope.indicatorsPerTopicChartOptions;
		$scope.indicatorsPerTopicChart.showLoading();

		$scope.georesourcesPerTopicChart = echarts.init(document.getElementById('georesourcesPerTopicDiagram'));
		$scope.georesourcesPerTopicChartOptions;
		$scope.georesourcesPerTopicChart.showLoading();

		$scope.indicatorsPerSpatialUnitChart = echarts.init(document.getElementById('indicatorsPerSpatialUnitDiagram'));
		$scope.indicatorsPerSpatialUnitChartOptions;
		$scope.indicatorsPerSpatialUnitChart.showLoading();


		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		$scope.loadingData = true;

		$(window).on('resize', function(){
				if($scope.usersPerRoleChart != null && $scope.usersPerRoleChart != undefined){
						$scope.usersPerRoleChart.resize();
				}

				if($scope.indicatorsPerTopicChart != null && $scope.indicatorsPerTopicChart != undefined){
						$scope.indicatorsPerTopicChart.resize();
				}

				if($scope.georesourcesPerTopicChart != null && $scope.georesourcesPerTopicChart != undefined){
						$scope.georesourcesPerTopicChart.resize();
				}

				if($scope.indicatorsPerSpatialUnitChart != null && $scope.indicatorsPerSpatialUnitChart != undefined){
						$scope.indicatorsPerSpatialUnitChart.resize();
				}
		});

		// when ready check if required metadat was already fetched
		$( document ).ready(function() {
		  if (kommonitorDataExchangeService.availableIndicators){
				// we already have required data. hide loading icon
				$scope.updateCharts();
				$scope.loadingData = false;
			}
			else{
				// we wait for  required data. show loading icon
				console.log("fetching all required metadata");
				$scope.loadingData = true;
			}
		});

		$scope.$on("initialMetadataLoadingCompleted", function (event) {

			console.log("refresh admin overview");

			$scope.updateCharts();

			$scope.loadingData = false;

		});

		$scope.updateCharts = function(){

			$scope.updateUsersPerRoleChart();

			$scope.updateIndicatorsPerTopicChart();

			$scope.updateGeoresourcesPerTopicChart();

			$scope.updateIndicatorsPerSpatialUnitChart();
		};

		$scope.updateUsersPerRoleChart = function(){

			$scope.usersPerRoleChart.showLoading();

			var usersPerRoleMap = new Map();

			kommonitorDataExchangeService.availableUsers.forEach(function(user){
				user.roles.forEach(function(userRole){
					var roleName = userRole.roleName;

					if(usersPerRoleMap.has(roleName)){
						// increment by 1
						usersPerRoleMap.set(roleName, usersPerRoleMap.get(roleName) + 1);
					}
					else{
						usersPerRoleMap.set(roleName, 1);
					}
				});
			});

			var userPerRoleSeriesData = [];

			usersPerRoleMap.forEach(function(value, key, map){
				userPerRoleSeriesData.push({
					name: key,
					value: value
				});
			});

			$scope.usersPerRoleChartOptions = {
				// grid get rid of whitespace around chart
				// grid: {
				// 	left: '7%',
				// 	top: 32,
				// 	right: '5%',
				// 	bottom: 55
				// },
					title: {
							text: 'Nutzer \npro Rolle',
							left: 'center',
							show: true,
							top: 15,
							fontSize: 12
					},
					tooltip: $scope.pieChartTooltip,
					series : [
			        {
			            name: 'Nutzer pro Rolle',
			            type: 'pie',
									//roseType: 'radius',
			            radius : '90%',
			            center: ['50%', '50%'],
			            data: userPerRoleSeriesData,
			            itemStyle: {
											normal: {
													color: '#00c0ef',
													shadowBlur: 30,
													shadowColor: 'rgba(0, 0, 0, 0.5)'
											},
			                emphasis: {
			                    shadowBlur: 10,
			                    shadowOffsetX: 0,
			                    shadowColor: 'rgba(0, 0, 0, 0.5)'
			                }
			            },
									label: $scope.pieChartLabel
			        }
			    ]
			};
			// end of chart options

			$scope.usersPerRoleChart.setOption($scope.usersPerRoleChartOptions);
			$scope.usersPerRoleChart.hideLoading();
		};

		// INDICATORS PER TOPIC

		$scope.updateIndicatorsPerTopicChart = function(){

			$scope.indicatorsPerTopicChart.showLoading();

			var indicatorsPerTopicMap = new Map();

			kommonitorDataExchangeService.availableIndicators.forEach(function(indicator){
				indicator.applicableTopics.forEach(function(topicName){

					if(indicatorsPerTopicMap.has(topicName)){
						// increment by 1
						indicatorsPerTopicMap.set(topicName, indicatorsPerTopicMap.get(topicName) + 1);
					}
					else{
						indicatorsPerTopicMap.set(topicName, 1);
					}
				});
			});

			var indicatorsPerTopicSeriesData = [];

			//sorted alphabetically
			kommonitorDataExchangeService.availableTopics.forEach(function(topic){
				if(indicatorsPerTopicMap.has(topic.topicName)){
					indicatorsPerTopicSeriesData.push({
						name: topic.topicName,
						value: indicatorsPerTopicMap.get(topic.topicName)
					});
				}
			});

			$scope.indicatorsPerTopicChartOptions = {
				// grid get rid of whitespace around chart
				// grid: {
				// 	left: '7%',
				// 	top: 32,
				// 	right: '5%',
				// 	bottom: 55
				// },
					title: {
							text: 'Indikatoren \npro Themenbereich',
							left: 'center',
							show: true,
							top: 15,
							fontSize: 12
					},
					tooltip: $scope.pieChartTooltip,
					series : [
			        {
			            name: 'Indikatoren pro Themenbereich',
			            type: 'pie',
									//roseType: 'radius',
			            radius : '90%',
			            center: ['50%', '50%'],
			            data: indicatorsPerTopicSeriesData,
			            itemStyle: {
											normal: {
													color: '#00a65b',
													shadowBlur: 30,
													shadowColor: 'rgba(0, 0, 0, 0.5)'
											},
			                emphasis: {
			                    shadowBlur: 10,
			                    shadowOffsetX: 0,
			                    shadowColor: 'rgba(0, 0, 0, 0.5)'
			                }
			            },
									label: $scope.pieChartLabel
			        }
			    ]
			};
			// end of chart options

			$scope.indicatorsPerTopicChart.setOption($scope.indicatorsPerTopicChartOptions);
			$scope.indicatorsPerTopicChart.hideLoading();
		};

		// GEORESOURCES PER TOPIC

		$scope.updateGeoresourcesPerTopicChart = function(){

			$scope.georesourcesPerTopicChart.showLoading();

			var georesourcesPerTopicMap = new Map();

			kommonitorDataExchangeService.availableGeoresources.forEach(function(georesource){
				georesource.applicableTopics.forEach(function(topicName){

					if(georesourcesPerTopicMap.has(topicName)){
						// increment by 1
						georesourcesPerTopicMap.set(topicName, georesourcesPerTopicMap.get(topicName) + 1);
					}
					else{
						georesourcesPerTopicMap.set(topicName, 1);
					}
				});
			});

			var georesourcesPerTopicSeriesData = [];

			//sorted alphabetically
			kommonitorDataExchangeService.availableTopics.forEach(function(topic){
				if(georesourcesPerTopicMap.has(topic.topicName)){
					georesourcesPerTopicSeriesData.push({
						name: topic.topicName,
						value: georesourcesPerTopicMap.get(topic.topicName)
					});
				}
			});

			$scope.georesourcesPerTopicChartOptions = {
				// grid get rid of whitespace around chart
				// grid: {
				// 	left: '7%',
				// 	top: 32,
				// 	right: '5%',
				// 	bottom: 55
				// },
					title: {
							text: 'Georessourcen \npro Themenbereich',
							left: 'center',
							show: true,
							top: 15,
							fontSize: 12
					},
					tooltip: $scope.pieChartTooltip,
					series : [
			        {
			            name: 'Georessourcen pro Themenbereich',
			            type: 'pie',
									//roseType: 'radius',
			            radius : '90%',
			            center: ['50%', '50%'],
			            data: georesourcesPerTopicSeriesData,
			            itemStyle: {
											normal: {
													color: '#ff851b',
													shadowBlur: 30,
													shadowColor: 'rgba(0, 0, 0, 0.5)'
											},
			                emphasis: {
			                    shadowBlur: 10,
			                    shadowOffsetX: 0,
			                    shadowColor: 'rgba(0, 0, 0, 0.5)'
			                }
			            },
									label: $scope.pieChartLabel
			        }
			    ]
			};
			// end of chart options

			$scope.georesourcesPerTopicChart.setOption($scope.georesourcesPerTopicChartOptions);
			$scope.georesourcesPerTopicChart.hideLoading();
		};

		// INDICATORS PER SPATIAL UNIT

		$scope.updateIndicatorsPerSpatialUnitChart = function(){

			$scope.indicatorsPerSpatialUnitChart.showLoading();

			var indicatorsPerSpatialUnitMap = new Map();

			kommonitorDataExchangeService.availableIndicators.forEach(function(indicator){
				indicator.applicableSpatialUnits.forEach(function(spatialUnitName){

					if(indicatorsPerSpatialUnitMap.has(spatialUnitName)){
						// increment by 1
						indicatorsPerSpatialUnitMap.set(spatialUnitName, indicatorsPerSpatialUnitMap.get(spatialUnitName) + 1);
					}
					else{
						indicatorsPerSpatialUnitMap.set(spatialUnitName, 1);
					}
				});
			});

			var indicatorsPerSpatialUnitSeriesData = [];

			//sorted by spatial unit size
			kommonitorDataExchangeService.availableSpatialUnits.forEach(function(spatialUnit){
				if(indicatorsPerSpatialUnitMap.has(spatialUnit.spatialUnitLevel)){
					indicatorsPerSpatialUnitSeriesData.push({
						name: spatialUnit.spatialUnitLevel,
						value: indicatorsPerSpatialUnitMap.get(spatialUnit.spatialUnitLevel)
					});
				}
			});

			$scope.indicatorsPerSpatialUnitChartOptions = {
				// grid get rid of whitespace around chart
				// grid: {
				// 	left: '7%',
				// 	top: 32,
				// 	right: '5%',
				// 	bottom: 55
				// },
					title: {
							text: 'Indikatoren \npro Raumeinheit',
							left: 'center',
							show: true,
							top: 15,
							fontSize: 12
					},
					tooltip: $scope.pieChartTooltip,
					series : [
			        {
			            name: 'Indikatoren pro Raumeinheit',
			            type: 'pie',
									//roseType: 'radius',
			            radius : '90%',
			            center: ['50%', '50%'],
			            data: indicatorsPerSpatialUnitSeriesData,
			            itemStyle: {
											normal: {
													color: '#00a65b',
													shadowBlur: 30,
													shadowColor: 'rgba(0, 0, 0, 0.5)'
											},
			                emphasis: {
			                    shadowBlur: 10,
			                    shadowOffsetX: 0,
			                    shadowColor: 'rgba(0, 0, 0, 0.5)'
			                }
			            },
									label: $scope.pieChartLabel
			        }
			    ]
			};
			// end of chart options

			$scope.indicatorsPerSpatialUnitChart.setOption($scope.indicatorsPerSpatialUnitChartOptions);
			$scope.indicatorsPerSpatialUnitChart.hideLoading();
		};

	}
]});
