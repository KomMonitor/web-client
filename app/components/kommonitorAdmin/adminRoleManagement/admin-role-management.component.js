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
				dataset.registeredInKeyCloak = kommonitorKeycloakHelperService.isRoleInKeycloak(dataset.roleName);
			});

			kommonitorDataGridHelperService.buildDataGrid_roles($scope.availableRoleDatasets);

			$scope.loadingData = false;
		};

		$scope.onClickSynchronizeKeycloakRoles = async function(){			
			try {
				$timeout(function(){
					$scope.loadingData = true;
				});
				await kommonitorKeycloakHelperService.fetchAndSetKeycloakRoles($scope.keycloakAdminUserName, $scope.keycloakAdminUserPassword);

				$scope.initializeOrRefreshOverviewTable();	

				$timeout(function(){
					$scope.loadingData = false;
				}, 500);
			} catch (error) {
				$timeout(function(){
					$scope.loadingData = false;
				});
			}			
		};

		$scope.$on("refreshRoleOverviewTable", function (event, crudType, targetRoleId) {
			$scope.loadingData = true;
			$scope.refreshRoleOverviewTable(crudType, targetRoleId);
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

		$scope.refreshRoleOverviewTable = function (crudType, targetRoleId) {

			if(! crudType || !targetRoleId){
				// refetch all metadata from spatial units to update table
				kommonitorDataExchangeService.fetchRolesMetadata().then(function successCallback(response) {

					$scope.initializeOrRefreshOverviewTable();

					$scope.loadingData = false;

					}, function errorCallback(response) {

						$scope.loadingData = false;
				});
			}
			else if(crudType && targetRoleId){
				if(crudType == "add"){
					kommonitorCacheHelperService.fetchSingleRoleMetadata(targetRoleId).then(function successCallback(data) {

						kommonitorDataExchangeService.addSingleRoleMetadata(data);

						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
					});
				}
				else if(crudType == "edit"){
					kommonitorCacheHelperService.fetchSingleRoleMetadata(targetRoleId).then(function successCallback(data) {

						kommonitorDataExchangeService.replaceSingleRoleMetadata(data);
						
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
					});
				}				
				else if(crudType == "delete"){
					// targetRoleId might be array in this case
					if(targetRoleId && typeof targetRoleId == "string"){
						kommonitorDataExchangeService.deleteSingleRoleMetadata(targetRoleId);
						
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
					}

					else if (targetRoleId && Array.isArray(targetRoleId)){
						for (const id of targetRoleId) {
							kommonitorDataExchangeService.deleteSingleRoleMetadata(id);
						}
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
					}
					
				}
			}

		};

		$scope.onClickDeleteDatasets = function () {
			$scope.loadingData = true;

			var markedEntriesForDeletion = kommonitorDataGridHelperService.getSelectedRolesMetadata();	

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
