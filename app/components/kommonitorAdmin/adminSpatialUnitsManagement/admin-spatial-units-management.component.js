"use strict";
angular.module('adminSpatialUnitsManagement').component('adminSpatialUnitsManagement', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/admin-spatial-units-management.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorCacheHelperService', 'kommonitorDataGridHelperService', '$scope', '$timeout', '$rootScope', '__env', '$http', 
	function SpatialUnitsManagementController(kommonitorDataExchangeService, kommonitorCacheHelperService, kommonitorDataGridHelperService, $scope, $timeout, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

        $scope.tableViewSwitcher = false;

		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		$scope.loadingData = true;

		$scope.$on("initialMetadataLoadingCompleted", function (event) {

			
			$timeout(function(){
				
				$scope.initializeOrRefreshOverviewTable();
			}, 250);

		});

		$scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {

			$scope.loadingData = false;

		});

        $scope.onTableViewSwitch = function() {
            $scope.initializeOrRefreshOverviewTable();
        }

		$scope.initializeOrRefreshOverviewTable = function(){

			$scope.loadingData = true;

			kommonitorDataGridHelperService.buildDataGrid_spatialUnits($scope.initSpatialUnits());

			$timeout(function(){
				
				$scope.loadingData = false;
			});	
		};

        $scope.initSpatialUnits = function() {

            if($scope.tableViewSwitcher)
                return kommonitorDataExchangeService.availableSpatialUnits.filter(e => !(e.userPermissions.length==1 && e.userPermissions.includes('viewer')));
            else
                return kommonitorDataExchangeService.availableSpatialUnits;
        }

		$scope.$on("refreshSpatialUnitOverviewTable", function (event, crudType, targetSpatialUnitId) {
			$scope.loadingData = true;
			$scope.refreshSpatialUnitOverviewTable(crudType, targetSpatialUnitId);
		});

		$scope.refreshSpatialUnitOverviewTable = function(crudType, targetSpatialUnitId){

			if(! crudType || !targetSpatialUnitId){
				// refetch all metadata from spatial units to update table
				kommonitorDataExchangeService.fetchSpatialUnitsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(response) {

					$scope.initializeOrRefreshOverviewTable();

					$timeout(function(){
				
						$scope.loadingData = false;
					});	

					}, function errorCallback(response) {

						$timeout(function(){
				
							$scope.loadingData = false;
						});	
				});
			}
			else if(crudType && targetSpatialUnitId){
				if(crudType == "add"){
					kommonitorCacheHelperService.fetchSingleSpatialUnitMetadata(targetSpatialUnitId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {

						kommonitorDataExchangeService.addSingleSpatialUnitMetadata(data);

						$scope.initializeOrRefreshOverviewTable();
	
						$timeout(function(){
				
							$scope.loadingData = false;
						});	
	
						}, function errorCallback(response) {
	
							$timeout(function(){
				
								$scope.loadingData = false;
							});	
					});
				}
				else if(crudType == "edit"){
					kommonitorCacheHelperService.fetchSingleSpatialUnitMetadata(targetSpatialUnitId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {

						kommonitorDataExchangeService.replaceSingleSpatialUnitMetadata(data);
						
						$scope.initializeOrRefreshOverviewTable();
	
						$timeout(function(){
				
							$scope.loadingData = false;
						});	
	
						}, function errorCallback(response) {
	
							$timeout(function(){
				
								$scope.loadingData = false;
							});	
					});
				}				
				else if(crudType == "delete"){
					// targetSpatialUnitId might be array in this case
					if(targetSpatialUnitId && typeof targetSpatialUnitId == "string"){
						kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(targetSpatialUnitId);
						
						$scope.initializeOrRefreshOverviewTable();
	
						$timeout(function(){
				
							$scope.loadingData = false;
						});	
					}

					else if (targetSpatialUnitId && Array.isArray(targetSpatialUnitId)){
						for (const id of targetSpatialUnitId) {
							kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(id);
						}
						$scope.initializeOrRefreshOverviewTable();
	
						$timeout(function(){
				
							$scope.loadingData = false;
						});	
					}
					
				}
			}

		};

		$scope.onChangeSelectDataset = function(spatialUnitDataset){
			console.log(spatialUnitDataset.spatialUnitLevel);
		};

		$scope.onClickDeleteDatasets = function(){
			$scope.loadingData = true;

			var markedEntriesForDeletion = kommonitorDataGridHelperService.getSelectedSpatialUnitsMetadata();	

			// submit selected spatial units to modal controller
			$rootScope.$broadcast("onDeleteSpatialUnits", markedEntriesForDeletion);

			$timeout(function(){
				
				$scope.loadingData = false;
			});	
		};

		$scope.onClickEditMetadata = function(spatialUnitDataset){
			// submit selected spatial unit to modal controller
			$rootScope.$broadcast("onEditSpatialUnitMetadata", spatialUnitDataset);
		};

		$scope.onClickEditFeatures = function(spatialUnitDataset){
			// submit selected spatial unit to modal controller
			$rootScope.$broadcast("onEditSpatialUnitFeatures", spatialUnitDataset);
		};
	}
]});
