angular.module('adminRoleManagement').component('adminRoleManagement', {
	templateUrl: "components/kommonitorAdmin/adminRoleManagement/admin-role-management.template.html",
	controller: ['kommonitorDataExchangeService', 'kommonitorCacheHelperService', 'kommonitorDataGridHelperService', 'kommonitorKeycloakHelperService', 
	'$scope', '$rootScope', '__env', '$http', '$timeout', 
	function RoleManagementController(kommonitorDataExchangeService, kommonitorCacheHelperService, kommonitorDataGridHelperService, 
		kommonitorKeycloakHelperService, $scope, $rootScope, __env, $http, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;	
		this.kommonitorKeycloakHelperServiceInstance = kommonitorKeycloakHelperService;		
		
		// initialize any adminLTE box widgets
		$('.box').boxWidget();

		$scope.loadingData = true;

		$scope.availableRoleDatasets;
		$scope.selectAllEntriesInput = false;
		$scope.tableViewSwitcher = false;

		$scope.$on("initialMetadataLoadingCompleted", function (event) {
			$timeout(function () {
				$scope.initializeOrRefreshOverviewTable();
			}, 250);
		});

		$scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {
			$scope.loadingData = false;
		});

		$scope.onTableViewSwitch = function() {
            $scope.initializeOrRefreshOverviewTable();
        }

		$scope.initializeOrRefreshOverviewTable = function () {
			$scope.loadingData = true;
			$scope.accessControl = JSON.parse(JSON.stringify(kommonitorDataExchangeService.accessControl));
			
			kommonitorDataGridHelperService.buildDataGrid_accessControl($scope.filterAccessControl());

			$scope.loadingData = false;
		};

		$scope.filterAccessControl = function() {

            if($scope.tableViewSwitcher)
                return $scope.accessControl.filter(e => (e.userAdminRoles.includes('unit-users-creator') || e.userAdminRoles.includes('client-users-creator')));
            else
                return $scope.accessControl;
        }

		$scope.$on("refreshAccessControlTable", function (event, crudType, targetRoleId) {
			$scope.loadingData = true;
			$scope.refreshAccessControlTable(crudType, targetRoleId);
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

		$scope.refreshAccessControlTable = function (crudType, targetId) {

			if(! crudType || !targetId){
				// refetch all metadata from spatial units to update table
				kommonitorDataExchangeService.fetchAccessControlMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(response) {
					$scope.initializeOrRefreshOverviewTable();
					$scope.loadingData = false;

					}, function errorCallback(response) {
						$scope.loadingData = false;
				});
			}
			else if(crudType && targetId){
				if(crudType == "add"){
					kommonitorCacheHelperService.fetchSingleAccessControlMetadata(targetId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {

						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
					});
				}
				else if(crudType == "edit"){
					kommonitorCacheHelperService.fetchSingleAccessControlMetadata(targetId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {
						
						$scope.initializeOrRefreshOverviewTable();
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
					});
				}				
				else if(crudType == "delete"){
					// targetRoleId might be array in this case
					if(targetId && typeof targetId == "string"){
						kommonitorDataExchangeService.deleteSingleAccessControlMetadata(targetId);
						
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
					}

					else if (targetId && Array.isArray(targetId)){
						for (const id of targetId) {
							kommonitorDataExchangeService.deleteSingleAccessControlMetadata(id);
						}
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
					}
					
				}
			}

		};

		$scope.onClickDeleteDatasets = function () {
			$scope.loadingData = true;

			var markedEntriesForDeletion = kommonitorDataGridHelperService.getSelectedAccessControlMetadata();	
			
			// submit selected spatial units to modal controller
			$rootScope.$broadcast("onDeleteOrganizationalUnit", markedEntriesForDeletion);

			$scope.loadingData = false;
		};

		$scope.onClickEditMetadata = function (roleDataset) {
			// submit selected spatial unit to modal controller
			$rootScope.$broadcast("onEditOrganizationalUnitMetadata", roleDataset);
		};

	}
	]
});
