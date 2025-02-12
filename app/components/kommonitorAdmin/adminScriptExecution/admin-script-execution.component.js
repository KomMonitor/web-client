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
		$scope.defaultComputationJobHealth;
		$scope.customizedComputationJobHealth;
		$scope.selectAllEntriesInput = false;

		$scope.jobDescriptions = [{
			"jobSummary": [
				{
					"spatialUnitId": "stadtteile",
					"modifiedResource": "https://kommonitor-data-management-api/indicators/<indicatotrId>/<spatialUnitId>/",
					"numberOfIntegratedIndicatorFeatures": 50,            
					"integratedTargetDates": ["2025-01-15", "2024-01-15"],
					"errorsOccurred": [
							{
									"type": "missingTimestamp", 
									"affectedResourceType": "indicator" | "georesource",
									"affectedDatasetId": "indicatorId" | "georesourceId",
									"affectedTimestamps" : ["2024-12-31", "2023-12-31"],
									"affectedSpatialUnitFeatures": [],
									"errorMessage": "string"
							},
							{
									"type": "missingDataset", 
									"affectedResourceType": "indicator" | "georesource",
									"affectedDatasetId": "indicatorId" | "georesourceId",
									"affectedTimestamps" : [],
									"affectedSpatialUnitFeatures": [],
									"errorMessage": "string"
							},
							{
									"type": "missingSpatialUnit", 
									"affectedResourceType": "indicator",
									"affectedDatasetId": "indicatorId",
									"affectedTimestamps" : [],
									"affectedSpatialUnitFeatures": [],
									"errorMessage": "string"
							},
							{
									"type": "missingSpatialUnitFeature", 
									"affectedResourceType": "indicator",
									"affectedDatasetId": "indicatorId",
									"affectedTimestamps" : [],
									"affectedSpatialUnitFeatures": ["Kupferdreh_Id", "Kettwig_Id"],
									"errorMessage": "string"
							},
							{
									"type": "dataManagementApiError", // bei nicht vorhandenem Datenzugriff, sonstigen API Fehlern
									"affectedResourceType": "string",
									"dataManagementApiErrorCode": 401,
									"affectedDatasetId": "string",
									"affectedTimestamps" : [],
									"affectedSpatialUnitFeatures": [],
									"errorMessage": "Data-Management error message"
							},
							{
									"type": "processingError", // tritt bei Fehlern innerhalb des eigentlichen Prozesses auf (teilen durch null, ungültige Geometrieoperationen)
									"affectedResourceType": "indicator" | "georesource",
									"affectedDatasetId": "indicatorId" | "georesourceId",
									"affectedTimestamps" : [],
									"affectedSpatialUnitFeatures": [],
									"errorMessage": "string"
							}
					]
				}
			]  
		}]

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

		  $scope.fetchDefaultIndicatorJobHealth = function(){
			return $http({
				url: __env.targetUrlToProcessingEngine + "script-engine/defaultIndicatorComputation/health",
				method: "GET"
			  }).then(function successCallback(response) {
				  // this callback will be called asynchronously
				  // when the response is available
  
				  $scope.defaultComputationJobHealth = response.data;
  
				});
		  };

		  $scope.fetchCustomizedIndicatorJobHealth = function(){
			return $http({
				url: __env.targetUrlToProcessingEngine + "script-engine/customizableIndicatorComputation/health",
				method: "GET"
			  }).then(function successCallback(response) {
				  // this callback will be called asynchronously
				  // when the response is available
  
				  $scope.customizedComputationJobHealth = response.data;
  
				});
		  };

		$scope.$on("initialMetadataLoadingCompleted", function (event) {


			$timeout(async function () {

				await $scope.fetchDefaultIndicatorJobHealth();
				await $scope.fetchCustomizedIndicatorJobHealth();

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
			kommonitorDataGridHelperService.buildDataGrid_customizedJobs_new($scope.jobDescriptions);

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
			await $scope.fetchCustomizedIndicatorJobHealth();
			await $scope.fetchDefaultIndicatorJobHealth();

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
