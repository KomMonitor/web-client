angular.module('adminSpatialUnitsManagement').component('adminSpatialUnitsManagement', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/admin-spatial-units-management.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorDataGridHelperService', '$scope', '$timeout', '$rootScope', '__env', '$http', 
	function SpatialUnitsManagementController(kommonitorDataExchangeService, kommonitorDataGridHelperService, $scope, $timeout, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
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

		$scope.initializeOrRefreshOverviewTable = function(){
			$scope.loadingData = true;
			
			kommonitorDataGridHelperService.buildDataGrid_spatialUnits(kommonitorDataExchangeService.availableSpatialUnits);

			$scope.loadingData = false;
		};

		$scope.$on("refreshSpatialUnitOverviewTable", function (event, crudType, targetSpatialUnitId) {
			$scope.loadingData = true;
			$scope.refreshSpatialUnitOverviewTable();
		});

		$scope.refreshSpatialUnitOverviewTable = function(crudType, targetSpatialUnitId){

			if(! crudType || !targetSpatialUnitId){
				// refetch all metadata from spatial units to update table
				kommonitorDataExchangeService.fetchSpatialUnitsMetadata().then(function successCallback(response) {

					$scope.initializeOrRefreshOverviewTable();

					$scope.loadingData = false;

					}, function errorCallback(response) {

						$scope.loadingData = false;
				});
			}
			else if(crudType && targetSpatialUnitId){
				if(crudType == "add"){
					kommonitorDataExchangeService.fetchSingleSpatialUnitMetadata(targetSpatialUnitId).then(function successCallback(data) {

						kommonitorDataExchangeService.addSingleSpatialUnitMetadata(data);

						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
					});
				}
				else if(crudType == "edit"){
					kommonitorDataExchangeService.fetchSingleSpatialUnitMetadata(targetSpatialUnitId).then(function successCallback(data) {

						kommonitorDataExchangeService.replaceSingleSpatialUnitMetadata(data);
						
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
					});
				}				
				else if(crudType == "delete"){
					// targetSpatialUnitId might be array in this case
					if(targetSpatialUnitId && typeof targetSpatialUnitId == "string"){
						kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(targetSpatialUnitId);
						
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
					}

					else if (targetSpatialUnitId && Array.isArray(targetSpatialUnitId)){
						for (const id of targetSpatialUnitId) {
							kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(id);
						}
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
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

			$scope.loadingData = false;
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
