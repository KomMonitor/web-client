angular.module('adminDashboardManagement').component('adminDashboardManagement', {
	templateUrl : "components/kommonitorAdmin/adminDashboardManagement/admin-dashboard-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$timeout', '$rootScope', '__env', '$http', 
	function DashboardManagementController(kommonitorDataExchangeService, $scope, $timeout, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.loadingData = true;

		$scope.kommonitorDataExchangeService = kommonitorDataExchangeService;

		$scope.numberOfMainTopics = 0;
		$scope.numberOfSubTopics = 0;

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

		$scope.georesourcesPerTypeChart = echarts.init(document.getElementById('georesourcesPerTypeDiagram'));
		$scope.georesourcesPerTypeChartOptions;
		$scope.georesourcesPerTypeChart.showLoading();

		$scope.indicatorsPerSpatialUnitChart = echarts.init(document.getElementById('indicatorsPerSpatialUnitDiagram'));
		$scope.indicatorsPerSpatialUnitChartOptions;
		$scope.indicatorsPerSpatialUnitChart.showLoading();


		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		$(window).on('resize', function(){
				if($scope.usersPerRoleChart != null && $scope.usersPerRoleChart != undefined){
						$scope.usersPerRoleChart.resize();
				}

				if($scope.indicatorsPerTopicChart != null && $scope.indicatorsPerTopicChart != undefined){
						$scope.indicatorsPerTopicChart.resize();
				}

				if($scope.georesourcesPerTypeChart != null && $scope.georesourcesPerTypeChart != undefined){
						$scope.georesourcesPerTypeChart.resize();
				}

				if($scope.indicatorsPerSpatialUnitChart != null && $scope.indicatorsPerSpatialUnitChart != undefined){
						$scope.indicatorsPerSpatialUnitChart.resize();
				}
		});

		$scope.$on("refreshAdminDashboardDiagrams", function (event) {

			console.log("refresh admin charts");

			$scope.refreshAdminDashboardDiagrams();

		});

		$scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {

			$scope.loadingData = false;

		});

		$scope.$on("initialMetadataLoadingCompleted", function (event) {

			console.log("refresh admin overview");

			$timeout(function(){
				
				$scope.refreshAdminDashboardDiagrams();
			}, 250);

		});

		$scope.refreshAdminDashboardDiagrams = function(){
			var mainTopics = [];
			var subTopics = [];

			kommonitorDataExchangeService.availableTopics.forEach(function(topic){
				if(topic.topicType === 'main'){
					mainTopics.push(topic);
				}
			});

			subTopics = $scope.addSubTopics(mainTopics, subTopics);

			$scope.numberOfMainTopics = mainTopics.length;
			$scope.numberOfSubTopics = subTopics.length

			$scope.updateCharts();

			$scope.loadingData = false;
		};

		$scope.addSubTopics = function(mainTopics, subTopics){
			for (const mainTopic of mainTopics) {
				if(mainTopic.subTopics && mainTopic.subTopics.length > 0){
					for (const subTopic of mainTopic.subTopics) {
						subTopics.push(subTopic);	
						if(subTopic.subTopics && subTopic.subTopics.length > 0){
							subTopics = $scope.addSubTopics(subTopic.subTopics, subTopics);
						}
					}
				}
			}

			return subTopics;
		};

		$scope.updateCharts = function(){

			$scope.updateUsersPerRoleChart();

			$scope.updateIndicatorsPerTopicChart();

			$scope.updateGeoresourcesPerTypeChart();

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
													shadowBlur: 20,
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

				var mainTopicForCurrentIndicator = findMainTopicNameForTopicReference(indicator.topicReference);

				if(indicatorsPerTopicMap.has(mainTopicForCurrentIndicator)){
					// increment by 1
					indicatorsPerTopicMap.set(mainTopicForCurrentIndicator, indicatorsPerTopicMap.get(mainTopicForCurrentIndicator) + 1);
				}
				else{
					indicatorsPerTopicMap.set(mainTopicForCurrentIndicator, 1);
				}

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
													shadowBlur: 20,
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

		var findMainTopicNameForTopicReference = function(topicReference){
			var mainTopicName;
			for(var i=0; i < kommonitorDataExchangeService.availableTopics.length; i++){

				var currentTopic = kommonitorDataExchangeService.availableTopics[i];

				if (currentTopic.topicId === topicReference){
					mainTopicName = currentTopic.topicName;
					break;
				}
				else{
					var topicReferenceWithinSubTopics = isTopicReferenceWithinSubTopics(topicReference, currentTopic);
					if (topicReferenceWithinSubTopics){
						mainTopicName = currentTopic.topicName;
						break;
					}
				}
			}
			return mainTopicName;
		};

		var isTopicReferenceWithinSubTopics = function(topicReference, topic){
			for(var subI=0; subI < topic.subTopics.length; subI++){
				var currentSubTopic = topic.subTopics[subI];
				if(currentSubTopic.topicId === topicReference){
					return true;
				}
				else{
					if (currentSubTopic.subTopics.length > 0){
						var topicReferenceWithinSubTopics = isTopicReferenceWithinSubTopics(topicReference, currentSubTopic);
						if(topicReferenceWithinSubTopics){
							return true;
						}
					}
				}
			}

			return false;
		};

		// GEORESOURCES PER TOPIC

		$scope.updateGeoresourcesPerTypeChart = function(){

			$scope.georesourcesPerTypeChart.showLoading();

			var georesourcesPerTypeMap = new Map();

			kommonitorDataExchangeService.availableGeoresources.forEach(function(georesource){
				var georesourceType = "POI";
				if(georesource.isLOI){
					georesourceType = "LOI";
				}
				else if(georesource.isAOI){
					georesourceType = "AOI";
				}

				if(georesourcesPerTypeMap.has(georesourceType)){
					// increment by 1
					georesourcesPerTypeMap.set(georesourceType, georesourcesPerTypeMap.get(georesourceType) + 1);
				}
				else{
					georesourcesPerTypeMap.set(georesourceType, 1);
				}
			});

			var georesourcesPerTypeSeriesData = [];

			if(georesourcesPerTypeMap.has("POI")){
				georesourcesPerTypeSeriesData.push({
					name: "Points of Interest",
					value: georesourcesPerTypeMap.get("POI")
				});
			}
			if(georesourcesPerTypeMap.has("LOI")){
				georesourcesPerTypeSeriesData.push({
					name: "Lines of Interest",
					value: georesourcesPerTypeMap.get("LOI")
				});
			}
			if(georesourcesPerTypeMap.has("AOI")){
				georesourcesPerTypeSeriesData.push({
					name: "Areas of Interest",
					value: georesourcesPerTypeMap.get("AOI")
				});
			}

			$scope.georesourcesPerTypeChartOptions = {
				// grid get rid of whitespace around chart
				// grid: {
				// 	left: '7%',
				// 	top: 32,
				// 	right: '5%',
				// 	bottom: 55
				// },
					title: {
							text: 'Georessourcen \npro Typ',
							left: 'center',
							show: true,
							top: 15,
							fontSize: 12
					},
					tooltip: $scope.pieChartTooltip,
					series : [
			        {
			            name: 'Georessourcen pro Typ',
			            type: 'pie',
									//roseType: 'radius',
			            radius : '90%',
			            center: ['50%', '50%'],
			            data: georesourcesPerTypeSeriesData,
			            itemStyle: {
											normal: {
													color: '#ff851b',
													shadowBlur: 20,
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

			$scope.georesourcesPerTypeChart.setOption($scope.georesourcesPerTypeChartOptions);
			$scope.georesourcesPerTypeChart.hideLoading();
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
													shadowBlur: 20,
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

		// when ready check if required metadat was already fetched
		// $( document ).ready(function() {
		//   if (kommonitorDataExchangeService.availableRoles.length > 0){
		// 		// we already have required data. hide loading icon
		// 		$scope.updateCharts();
		// 		$scope.loadingData = false;
		// 	}
		// 	else{
		// 		// we wait for  required data. show loading icon
		// 		console.log("fetching all required metadata");
		// 		$scope.loadingData = true;
		// 	}
		// });

	}
]});
