angular.module('adminScriptExecution').component('adminScriptExecution', {
	templateUrl: "components/kommonitorAdmin/adminScriptExecution/admin-script-execution.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorDataGridHelperService', '$scope', '$rootScope', '__env', '$timeout', '$http', 
		function JobExecutionController(kommonitorDataExchangeService, kommonitorDataGridHelperService, $scope, $rootScope, __env, $timeout, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

		$scope.availableDefaultComputationJobDatasets;
		$scope.availableCustomizedComputationJobDatasets;
		$scope.selectAllEntriesInput = false;

		$scope.fetchDefaultIndicatorJobs = function(){
            return $http({
              url: __env.targetUrlToProcessingEngine + "script-engine/defaultIndicatorComputation",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                $scope.availableDefaultComputationJobDatasets = response.data;

              });
		  };
		 
		  $scope.fetchCustomizedIndicatorJobs = function(){
            return $http({
              url: __env.targetUrlToProcessingEngine + "script-engine/customizableIndicatorComputation",
              method: "GET"
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available

                $scope.availableCustomizedComputationJobDatasets = response.data;

              });
          }; 

		$scope.$on("initialMetadataLoadingCompleted", function (event) {


			$timeout(async function () {

				await $scope.fetchDefaultIndicatorJobs();
				await $scope.fetchCustomizedIndicatorJobs();

				$scope.initializeOrRefreshOverviewTable();
			}, 250);

		});

		$scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {

			$scope.loadingData = false;

		});

		$scope.initializeOrRefreshOverviewTable = function () {
			$scope.loadingData = true;

			kommonitorDataGridHelperService.buildDataGrid_defaultJobs($scope.availableDefaultComputationJobDatasets);
			kommonitorDataGridHelperService.buildDataGrid_customizedJobs($scope.availableCustomizedComputationJobDatasets);

			$scope.loadingData = false;
		};

		$scope.$on("refreshJobOverviewTable", function (event) {
			$scope.loadingData = true;
			$scope.refreshJobOverviewTable();
		});

		$scope.refreshJobOverviewTable = async function () {

			// refetch all metadata from spatial units to update table
			await $scope.fetchDefaultIndicatorJobs();
			await $scope.fetchCustomizedIndicatorJobs();

			$scope.initializeOrRefreshOverviewTable();

			$scope.loadingData = false;

		};

		$scope.onClickDeleteDatasets = function () {
			$scope.loadingData = true;

			let markedEntriesForDeletion = kommonitorDataGridHelperService.getSelectedDefaultJobsMetadata();

			// submit selected spatial units to modal controller
			$rootScope.$broadcast("onDeleteJobs", markedEntriesForDeletion);

			$scope.loadingData = false;
		};

		$scope.syntaxHighlightJSON = function(json){
			return kommonitorDataExchangeService.syntaxHighlightJSON(json);
		};

	}
	]
});
