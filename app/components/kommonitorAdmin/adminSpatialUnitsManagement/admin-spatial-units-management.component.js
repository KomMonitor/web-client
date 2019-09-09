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

			$scope.availableSpatialUnitDatasets = JSON.parse(JSON.stringify(kommonitorDataExchangeService.availableSpatialUnits));

			// initialize properties
			$scope.availableSpatialUnitDatasets.forEach(function(dataset){
				dataset.isSelected = false;
			});

			$scope.loadingData = false;

			// must use timeout as table content is just built up by angular
			setTimeout(function(){
				// initialize table as DataTable
				$('#spatialUnitOverviewTable').dataTable( {
							"language": {
									"url": "//cdn.datatables.net/plug-ins/1.10.15/i18n/German.json"
							}
					} );
			}, 500);

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


	}
]});
