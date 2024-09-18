angular
	.module('kommonitorReachability')
	.component(
		'kommonitorReachability', {
			templateUrl: 'components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/kommonitor-reachability.template.html',
			/*
			 * injected with a modules service method that manages
			 * enabled tabs
			 */
			controller: [
				'$scope',
				'$rootScope',
				'$http',
				'$timeout',
				'kommonitorMapService',
				'kommonitorDataExchangeService',
				'kommonitorDiagramHelperService',
				'__env',
				'kommonitorReachabilityHelperService',
				'kommonitorReachabilityScenarioHelperService',
				/**
				 * TODO
				 */
				function kommonitorReachabilityController($scope,
					$rootScope, $http, $timeout, kommonitorMapService,
					kommonitorDataExchangeService, kommonitorDiagramHelperService,__env, kommonitorReachabilityHelperService,
					kommonitorReachabilityScenarioHelperService) {

					//$("[data-toggle=tooltip]").tooltip();

					this.kommonitorReachabilityHelperServiceInstance = kommonitorReachabilityHelperService;	
					this.kommonitorReachabilityScenarioHelperServiceInstance = kommonitorReachabilityScenarioHelperService;		
					this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;		

					// initialize any adminLTE box widgets
					$('.box').boxWidget();



					$scope.openReachabilityScenarioModal = function(scenarioDataset){

						if(scenarioDataset){
							// submit selected spatial unit to modal controller
							$rootScope.$broadcast("onManageReachabilityScenario", scenarioDataset);
						}
						else{
							// open modal controller without dataset
							$rootScope.$broadcast("onManageReachabilityScenario");
						}

					};
					
					this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
					this.kommonitorDiagramHelperServiceInstance = kommonitorDiagramHelperService;
					this.kommonitorMapServiceInstance = kommonitorMapService;
					var numberOfDecimals = __env.numberOfDecimals;

					$scope.error = undefined;

					$scope.displayReachabilityScenarioOnMainMap = function (reachabilityScenario) {		
						kommonitorMapService.replaceReachabilityScenarioOnMainMap(reachabilityScenario);
					};

					$scope.removeReachabilityScenarioFromMainMap = function (){
						kommonitorMapService.removeReachabilityScenarioFromMainMap();
					}

				}
			]
		});
