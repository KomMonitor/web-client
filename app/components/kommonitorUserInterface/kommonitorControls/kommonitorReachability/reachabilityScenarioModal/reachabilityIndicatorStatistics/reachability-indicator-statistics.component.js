angular.module('reachabilityIndicatorStatistics').component('reachabilityIndicatorStatistics', {
	templateUrl: "components/kommonitorUserInterface/kommonitorControls/kommonitorReachability/reachabilityScenarioModal/reachabilityIndicatorStatistics/reachability-indicator-statistics.template.html",
	controller: ['kommonitorDataExchangeService',
		'$scope', '$rootScope', '$http', '__env', '$timeout', 'kommonitorReachabilityHelperService', 'kommonitorDiagramHelperService',
		'kommonitorReachabilityMapHelperService',
		function reachabilityIndicatorStatisticsController(kommonitorDataExchangeService,
			$scope, $rootScope, $http, __env, $timeout, kommonitorReachabilityHelperService, kommonitorDiagramHelperService,
			kommonitorReachabilityMapHelperService) {

			this.kommonitorReachabilityHelperServiceInstance = kommonitorReachabilityHelperService;
			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorDiagramHelperServiceInstance = kommonitorDiagramHelperService;

			$scope.selectedIndicatorForStatistics = undefined;
			$scope.selectedSpatialUnit = undefined;
			$scope.selectedIndicatorDate = undefined;

			$scope.onChangeSelectedIndicatorForStatistics = function () {
				// $scope.selectedIndicatorForStatistics;

				$scope.selectedSpatialUnit = $scope.selectedIndicatorForStatistics.applicableSpatialUnits[$scope.selectedIndicatorForStatistics.applicableSpatialUnits.length - 1];
				$scope.selectedIndicatorDate = $scope.selectedIndicatorForStatistics.applicableDates[$scope.selectedIndicatorForStatistics.applicableDates.length - 1];

				$scope.$digest();
				// for (const iterator of $ctrl.kommonitorDataExchangeServiceInstance.availableSpatialUnits) {

				// }				
			};

			$scope.onChangeSelectedSpatialUnit = function(){

			};

			$scope.computeReachabilityIndicatorStatistic = function(){
				// query spatial data processor in order to compute indicator statistics

				alert("Test");
			};	

		}
	]
});


