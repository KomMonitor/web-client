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
			if($.fn.DataTable.isDataTable( '#spatialUnitOverviewTable' )){
				$('#spatialUnitOverviewTable').DataTable().clear().destroy();
			}
			$scope.availableSpatialUnitDatasets = JSON.parse(JSON.stringify(kommonitorDataExchangeService.availableSpatialUnits));

			// initialize properties
			$scope.availableSpatialUnitDatasets.forEach(function(dataset){
				dataset.isSelected = false;
			});

			$scope.loadingData = false;

			// must use timeout as table content is just built up by angular
			setTimeout(function(){

				// initialize table as DataTable
				$('#spatialUnitOverviewTable').DataTable( {
							"language": kommonitorDataExchangeService.dataTableLanguageOption,
							"lengthMenu": kommonitorDataExchangeService.dataTableLengthMenuOption
					} );
					$scope.loadingData = false;
			}, 500);
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

		$scope.onClickDeleteEntry = function(spatialUnitDataset){
			$scope.loadingData = true;
			$http({
				url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units/" + spatialUnitDataset.spatialUnitId,
				method: "DELETE"
			}).then(function successCallback(response) {
						$scope.successMessagePart = $scope.spatialUnitLevel;

						// remove entry from array
						var index = -1;

						for(var i=0; i< kommonitorDataExchangeService.availableSpatialUnits.length; i++){
							if(kommonitorDataExchangeService.availableSpatialUnits[i].spatialUnitId === spatialUnitDataset.spatialUnitId){
								index = i;
								break;
							}
						}

						if (index > -1) {
						  kommonitorDataExchangeService.availableSpatialUnits.splice(index, 1);
						}

						$scope.refreshSpatialUnitOverviewTable();

						$scope.loadingData = false;

				}, function errorCallback(response) {
					$scope.errorMessagePart = response;

					$("#spatialUnitAddErrorAlert").show();
					$scope.loadingData = false;

					// setTimeout(function() {
					// 		$("#spatialUnitAddSucessAlert").hide();
					// }, 3000);
			});
		};

		$scope.onClickEditMetadata = function(spatialUnitDataset){
			// submit selected spatial unit to modal controller
			$rootScope.$broadcast("onEditSpatialUnitMetadata", spatialUnitDataset);
		};

	}
]});
