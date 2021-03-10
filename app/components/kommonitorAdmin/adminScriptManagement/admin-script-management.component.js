angular.module('adminScriptManagement').component('adminScriptManagement', {
	templateUrl: "components/kommonitorAdmin/adminScriptManagement/admin-script-management.template.html",
	controller: ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$timeout', '$http', function ScriptManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $timeout, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

		$scope.availableScriptDatasets;
		$scope.selectAllEntriesInput = false;

		$scope.$on("initialMetadataLoadingCompleted", function (event) {


			$timeout(function () {

				$scope.initializeOrRefreshOverviewTable();
			}, 250);

		});

		$scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {

			$scope.loadingData = false;

		});

		$scope.initializeOrRefreshOverviewTable = function () {
			$scope.loadingData = true;
			$scope.availableScriptDatasets = JSON.parse(JSON.stringify(kommonitorDataExchangeService.availableProcessScripts));

			// initialize properties
			$scope.availableScriptDatasets.forEach(function (dataset) {
				dataset.isSelected = false;
			});

			$scope.loadingData = false;
		};

		$scope.$on("refreshScriptOverviewTable", function (event) {
			$scope.loadingData = true;
			$scope.refreshScriptOverviewTable();
		});

		$scope.onChangeSelectAllEntries = function () {
			if ($scope.selectAllEntriesInput) {
				$scope.availableScriptDatasets.forEach(function (dataset) {
					dataset.isSelected = true;
				});
			}
			else {
				$scope.availableScriptDatasets.forEach(function (dataset) {
					dataset.isSelected = false;
				});
			}
		};

		$scope.onChangeSelectAllEntries = function () {
			if ($scope.selectAllEntriesInput) {
				$scope.availableScriptDatasets.forEach(function (dataset) {
					dataset.isSelected = true;
				});
			}
			else {
				$scope.availableScriptDatasets.forEach(function (dataset) {
					dataset.isSelected = false;
				});
			}
		};

		$scope.refreshScriptOverviewTable = function () {

			// refetch all metadata from spatial units to update table
			kommonitorDataExchangeService.fetchIndicatorScriptsMetadata().then(function successCallback(response) {

				$scope.initializeOrRefreshOverviewTable();

				$scope.loadingData = false;

			}, function errorCallback(response) {

				$scope.loadingData = false;
			})

		};

		$scope.onClickDeleteDatasets = function () {
			$scope.loadingData = true;

			var markedEntriesForDeletion = [];
			$scope.availableScriptDatasets.forEach(function (dataset) {
				if (dataset.isSelected) {
					markedEntriesForDeletion.push(dataset);
				}
			});

			// submit selected spatial units to modal controller
			$rootScope.$broadcast("onDeleteScripts", markedEntriesForDeletion);

			$scope.loadingData = false;
		};

		$scope.onClickEditScript = function (scriptDataset) {
			// submit selected spatial unit to modal controller
			$rootScope.$broadcast("onEditScriptMetadata", scriptDataset);
		};

	}
	]
});
