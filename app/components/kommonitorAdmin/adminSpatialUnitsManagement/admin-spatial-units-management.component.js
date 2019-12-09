angular.module('adminSpatialUnitsManagement').component('adminSpatialUnitsManagement', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/admin-spatial-units-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function SpatialUnitsManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		$scope.loadingData = true;

		$scope.availableSpatialUnitDatasets;
		$scope.selectAllEntriesInput = false;

		$scope.$on("initialMetadataLoadingCompleted", function (event) {

			$scope.initializeOrRefreshOverviewTable();

		});

		$scope.initializeOrRefreshOverviewTable = function(){
			$scope.loadingData = true;
			$scope.availableSpatialUnitDatasets = JSON.parse(JSON.stringify(kommonitorDataExchangeService.availableSpatialUnits));

			// initialize properties
			$scope.availableSpatialUnitDatasets.forEach(function(dataset){
				dataset.isSelected = false;
			});

			$scope.loadingData = false;
		};

		$scope.$on("refreshSpatialUnitOverviewTable", function (event) {
			$scope.loadingData = true;
			$scope.refreshSpatialUnitOverviewTable();
		});

		$scope.onChangeSelectAllEntries = function(){
			if ($scope.selectAllEntriesInput){
				$scope.availableSpatialUnitDatasets.forEach(function(dataset){
					dataset.isSelected = true;
				});
			}
			else{
				$scope.availableSpatialUnitDatasets.forEach(function(dataset){
					dataset.isSelected = false;
				});
			}
		};

		$scope.onChangeSelectAllEntries = function(){
			if ($scope.selectAllEntriesInput){
				$scope.availableSpatialUnitDatasets.forEach(function(dataset){
					dataset.isSelected = true;
				});
			}
			else{
				$scope.availableSpatialUnitDatasets.forEach(function(dataset){
					dataset.isSelected = false;
				});
			}
		};

		$scope.refreshSpatialUnitOverviewTable = function(){

			// refetch all metadata from spatial units to update table

			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units",
				method: "GET"
			}).then(function successCallback(response) {

						kommonitorDataExchangeService.availableSpatialUnits = response.data;

						$scope.initializeOrRefreshOverviewTable();

						$scope.loadingData = false;

				}, function errorCallback(response) {

					$scope.loadingData = false;
			});
		};

		$scope.onChangeSelectDataset = function(spatialUnitDataset){
			console.log(spatialUnitDataset.spatialUnitLevel);
		};

		$scope.onClickDeleteDatasets = function(){
			$scope.loadingData = true;

			var markedEntriesForDeletion = [];
			$scope.availableSpatialUnitDatasets.forEach(function(dataset){
				if(dataset.isSelected){
					markedEntriesForDeletion.push(dataset);
				}
			});

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
