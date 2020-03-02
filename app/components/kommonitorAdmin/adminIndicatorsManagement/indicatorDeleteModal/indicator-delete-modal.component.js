angular.module('indicatorDeleteModal').component('indicatorDeleteModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorDeleteModal/indicator-delete-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '$http', '__env', '$q',function IndicatorDeleteModalController(kommonitorDataExchangeService, $scope, $rootScope, $http, __env, $q) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;

		$scope.datasetsToDelete = [];

		$scope.loadingData = false;

		$scope.successfullyDeletedDatasets = [];
		$scope.failedDatasetsAndErrors = [];

		$scope.affectedScripts = [];
		$scope.affectedIndicatorReferences = [];

		$scope.$on("onDeleteGeoresources", function (event, datasets) {

			$scope.datasetsToDelete = datasets;

			$scope.resetGeoresourcesDeleteForm();

		});


		$scope.resetGeoresourcesDeleteForm = function(){

			$scope.successfullyDeletedDatasets = [];
			$scope.failedDatasetsAndErrors = [];
			$scope.affectedScripts = $scope.gatherAffectedScripts();
			$scope.affectedIndicatorReferences = $scope.gatherAffectedIndicatorReferences();
			$("#georesourcesDeleteSuccessAlert").hide();
			$("#georesourcesDeleteErrorAlert").hide();
		};

		$scope.gatherAffectedScripts = function(){
			$scope.affectedScripts = [];

			kommonitorDataExchangeService.availableProcessScripts.forEach(function(script){
				var requiredGeoresourceIds = script.requiredGeoresourceIds;

				for(var i=0; i<requiredGeoresourceIds.length; i++){
					var georesourceId = requiredGeoresourceIds[i];
					for(var k=0; k < $scope.datasetsToDelete.length; k++){
						var datasetToDelete = $scope.datasetsToDelete[k];
						if(georesourceId === datasetToDelete.georesourceId){
							$scope.affectedScripts.push(script);
							break;
						}
					}
				}
			});

			return $scope.affectedScripts;
		};

		$scope.gatherAffectedIndicatorReferences = function(){
			$scope.affectedIndicatorReferences = [];

			kommonitorDataExchangeService.availableIndicators.forEach(function(indicator){
				var georesourceReferences = indicator.referencedGeoresources;

				for(var i=0; i<georesourceReferences.length; i++){
					var georesourceReference = georesourceReferences[i];
					for(var k=0; k < $scope.datasetsToDelete.length; k++){
						var datasetToDelete = $scope.datasetsToDelete[k];
						if(georesourceReference.referencedGeoresourceId === datasetToDelete.georesourceId){
							$scope.affectedIndicatorReferences.push(georesourceReference);
							break;
						}
					}
				}
			});

			return $scope.affectedIndicatorReferences;
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
				$("#georesourcesDeleteSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#georesourcesDeleteErrorAlert").hide();
			};

	}
]});
