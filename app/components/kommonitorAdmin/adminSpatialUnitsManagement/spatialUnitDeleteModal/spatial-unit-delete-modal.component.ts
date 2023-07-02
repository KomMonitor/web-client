angular.module('spatialUnitDeleteModal').component('spatialUnitDeleteModal', {
	templateUrl : "components/kommonitorAdmin/adminSpatialUnitsManagement/spatialUnitDeleteModal/spatial-unit-delete-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$q', '$timeout', function SpatialUnitDeleteModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $q, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.datasetsToDelete = [];

		$scope.loadingData = false;

		$scope.successfullyDeletedDatasets = [];
		$scope.failedDatasetsAndErrors = [];

		$scope.$on("onDeleteSpatialUnits", function (event, datasets) {
			$scope.loadingData = true;

			$scope.datasetsToDelete = datasets;	
			$scope.resetSpatialUnitsDeleteForm();	

			$timeout(function(){
				$scope.loadingData = false;
			});	
		});


		$scope.resetSpatialUnitsDeleteForm = function(){

			$scope.successfullyDeletedDatasets = [];
			$scope.failedDatasetsAndErrors = [];
			$("#spatialUnitsDeleteSuccessAlert").hide();
			$("#spatialUnitsDeleteErrorAlert").hide();
		};

		$scope.deleteSpatialUnits = function(){

			// TODO verify input

			// TODO Create and perform POST Request with loading screen

			$scope.loadingData = true;

			var deletePromises = [];

			$scope.datasetsToDelete.forEach(function(dataset){
				deletePromises.push($scope.getDeleteDatasetPromise(dataset));
			});

			$q.all(deletePromises).then(async function successCallback(successArray) {
						//

						if($scope.failedDatasetsAndErrors.length > 0){
							// error handling
							$("#spatialUnitsDeleteErrorAlert").show();
							// if ($scope.successfullyDeletedDatasets.length > 0){
							// 	$("#spatialUnitsDeleteSuccessAlert").show();
							// }
						}
						if($scope.successfullyDeletedDatasets.length > 0){
							$("#spatialUnitsDeleteSuccessAlert").show();

							// fetch indicatorMetada again as a spatialUnit was deleted
							await kommonitorDataExchangeService.fetchIndicatorsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles);
							// refresh spatial unit overview table
							$rootScope.$broadcast("refreshSpatialUnitOverviewTable", "delete", $scope.successfullyDeletedDatasets.map(dataset => {return dataset.spatialUnitId;}));

							// refresh all admin dashboard diagrams due to modified metadata
							$timeout(function(){
								$rootScope.$broadcast("refreshAdminDashboardDiagrams");
							}, 500);
						}

						$timeout(function(){
				
							$scope.loadingData = false;
						});	
				}, function errorCallback(errorArray) {

					$("#spatialUnitsDeleteErrorAlert").show();
					// if ($scope.successfullyDeletedDatasets.length > 0){
					// 	$("#spatialUnitsDeleteSuccessAlert").show();
					// }

					$rootScope.$broadcast("refreshSpatialUnitOverviewTable");
					$timeout(function(){
				
						$scope.loadingData = false;
					});	
			});

		};

			$scope.getDeleteDatasetPromise = function(dataset){
				return $http({
					url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/spatial-units/" + dataset.spatialUnitId,
					method: "DELETE"
				}).then(function successCallback(response) {
							$scope.successfullyDeletedDatasets.push(dataset);

							// remove entry from array
							var index = -1;

							for(var i=0; i< kommonitorDataExchangeService.availableSpatialUnits.length; i++){
								if(kommonitorDataExchangeService.availableSpatialUnits[i].spatialUnitId === dataset.spatialUnitId){
									index = i;
									break;
								}
							}

							if (index > -1) {
							  kommonitorDataExchangeService.availableSpatialUnits.splice(index, 1);
							}

					}, function errorCallback(error) {
						if(error.data){							
							$scope.failedDatasetsAndErrors.push([dataset, kommonitorDataExchangeService.syntaxHighlightJSON(error.data)]);
						}
						else{
							$scope.failedDatasetsAndErrors.push([dataset, kommonitorDataExchangeService.syntaxHighlightJSON(error)]);
						}
						
				});
			};

			$scope.hideSuccessAlert = function(){
				$("#spatialUnitsDeleteSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#spatialUnitsDeleteErrorAlert").hide();
			};

	}
]});
