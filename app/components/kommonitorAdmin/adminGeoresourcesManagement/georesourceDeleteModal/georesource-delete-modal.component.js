angular.module('georesourceDeleteModal').component('georesourceDeleteModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceDeleteModal/georesource-delete-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$q',function GeoresourceDeleteModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $q) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.datasetsToDelete = [];

		$scope.loadingData = false;

		$scope.successfullyDeletedDatasets = [];
		$scope.failedDatasetsAndErrors = [];

		$scope.$on("onDeleteGeoresources", function (event, datasets) {

			$scope.datasetsToDelete = datasets;

			$scope.resetGeoresourcesDeleteForm();

		});


		$scope.resetGeoresourcesDeleteForm = function(){

			$scope.successfullyDeletedDatasets = [];
			$scope.failedDatasetsAndErrors = [];
			$("#georesourcesDeleteSuccessAlert").hide();
			$("#georesourcesDeleteErrorAlert").hide();
		};

		$scope.deleteGeoresources = function(){

			$scope.loadingData = true;

			var deletePromises = [];

			$scope.datasetsToDelete.forEach(function(dataset){
				deletePromises.push($scope.getDeleteDatasetPromise(dataset));
			});

			$q.all(deletePromises).then(async function successCallback(successArray) {
						//

						if($scope.failedDatasetsAndErrors.length > 0){
							// error handling
							$("#georesourcesDeleteErrorAlert").show();
							// if ($scope.successfullyDeletedDatasets.length > 0){
							// 	$("#georesourcesDeleteSuccessAlert").show();
							// }

							$scope.loadingData = false;
						}
						if($scope.successfullyDeletedDatasets.length > 0){
							$("#georesourcesDeleteSuccessAlert").show();

							// fetch indicatorMetada again as a georesource was deleted
							await kommonitorDataExchangeService.fetchIndicatorsMetadata();
							// refresh spatial unit overview table
							$rootScope.$broadcast("refreshGeoresourceOverviewTable");

							// refresh all admin dashboard diagrams due to modified metadata
							$rootScope.$broadcast("refreshAdminDashboardDiagrams");

							$scope.loadingData = false;
						}
				}, function errorCallback(errorArray) {

					$("#georesourcesDeleteErrorAlert").show();
					// if ($scope.successfullyDeletedDatasets.length > 0){
					// 	$("#georesourcesDeleteSuccessAlert").show();
					// }

					$rootScope.$broadcast("refreshGeoresourceOverviewTable");
					$scope.loadingData = false;
			});

		};

			$scope.getDeleteDatasetPromise = function(dataset){
				return $http({
					url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/georesources/" + dataset.georesourceId,
					method: "DELETE"
				}).then(function successCallback(response) {
							$scope.successfullyDeletedDatasets.push(dataset);

							// remove entry from array
							var index = -1;

							for(var i=0; i< kommonitorDataExchangeService.availableGeoresources.length; i++){
								if(kommonitorDataExchangeService.availableGeoresources[i].georesourceId === dataset.georesourceId){
									index = i;
									break;
								}
							}

							if (index > -1) {
							  kommonitorDataExchangeService.availableGeoresources.splice(index, 1);
							}

					}, function errorCallback(response) {
						$scope.failedDatasetsAndErrors.push([dataset, response]);
				});
			};

			$scope.hideSuccessAlert = function(){
				$("#georesourcesDeleteSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#georesourcesDeleteErrorAlert").hide();
			};

	}
]});
