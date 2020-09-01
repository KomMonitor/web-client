angular.module('adminRoleManagement').component('adminRoleManagement', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/admin-role-management.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorKeycloakHelperService', '$scope', '$rootScope', '__env', '$http', function RoleManagementController(kommonitorDataExchangeService, kommonitorKeycloakHelperService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;		
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

		$scope.availableRoleDatasets;
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
			$scope.availableRoleDatasets = JSON.parse(JSON.stringify(kommonitorDataExchangeService.availableRoles));

			// initialize properties
			$scope.availableRoleDatasets.forEach(function (dataset) {
				dataset.isSelected = false;
				dataset.registeredInKeyCloak = false;
			});

			$scope.loadingData = false;
		};

		$scope.$on("refreshRoleOverviewTable", function (event) {
			$scope.loadingData = true;
			$scope.refreshRoleOverviewTable();
		});

		$scope.onChangeSelectAllEntries = function () {
			if ($scope.selectAllEntriesInput) {
				$scope.availableRoleDatasets.forEach(function (dataset) {
					dataset.isSelected = true;
				});
			}
			else {
				$scope.availableRoleDatasets.forEach(function (dataset) {
					dataset.isSelected = false;
				});
			}
		};

		$scope.onChangeSelectAllEntries = function () {
			if ($scope.selectAllEntriesInput) {
				$scope.availableRoleDatasets.forEach(function (dataset) {
					dataset.isSelected = true;
				});
			}
			else {
				$scope.availableRoleDatasets.forEach(function (dataset) {
					dataset.isSelected = false;
				});
			}
		};

		$scope.refreshRoleOverviewTable = function () {

			// refetch all metadata from spatial units to update table
			kommonitorDataExchangeService.fetchRolesMetadata().then(function successCallback(response) {

				$scope.initializeOrRefreshOverviewTable();

				$scope.loadingData = false;

			}, function errorCallback(response) {

				$scope.loadingData = false;
			})

		};

		$scope.onClickDeleteDatasets = function () {
			$scope.loadingData = true;

			var markedEntriesForDeletion = [];
			$scope.availableRoleDatasets.forEach(function (dataset) {
				if (dataset.isSelected) {
					markedEntriesForDeletion.push(dataset);
				}
			});

			// submit selected spatial units to modal controller
			$rootScope.$broadcast("onDeleteRoles", markedEntriesForDeletion);

			$scope.loadingData = false;
		};

		$scope.onClickEditMetadata = function (roleDataset) {
			// submit selected spatial unit to modal controller
			$rootScope.$broadcast("onEditRoleMetadata", roleDataset);
		};

	}
	]
});
