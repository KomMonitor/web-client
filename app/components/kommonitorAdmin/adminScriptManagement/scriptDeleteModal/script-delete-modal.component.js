angular.module('scriptDeleteModal').component('scriptDeleteModal', {
	templateUrl : "components/kommonitorAdmin/adminScriptManagement/scriptDeleteModal/script-delete-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorScriptHelperService','$scope', '$rootScope', '$http', '__env', '$q', '$timeout', function ScriptDeleteModalController(kommonitorDataExchangeService, kommonitorScriptHelperService, $scope, $rootScope, $http, __env, $q, $timeout) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorScriptHelperServiceInstance = kommonitorScriptHelperService;

		$scope.datasetsToDelete = [];

		$scope.loadingData = false;

		$scope.successfullyDeletedDatasets = [];
		$scope.failedDatasetsAndErrors = [];

		$scope.$on("onDeleteScripts", function (event, datasets) {

			$scope.datasetsToDelete = datasets;

			$scope.resetScriptsDeleteForm();

		});


		$scope.resetScriptsDeleteForm = function(){

			$scope.successfullyDeletedDatasets = [];
			$scope.failedDatasetsAndErrors = [];
			$("#scriptsDeleteSuccessAlert").hide();
			$("#scriptsDeleteErrorAlert").hide();
		};

		$scope.deleteScripts = function(){

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
							$("#scriptsDeleteErrorAlert").show();
							// if ($scope.successfullyDeletedDatasets.length > 0){
							// 	$("#scriptsDeleteSuccessAlert").show();
							// }
						}
						if($scope.successfullyDeletedDatasets.length > 0){
							$("#scriptsDeleteSuccessAlert").show();

							// refresh script overview table
							$rootScope.$broadcast("refreshScriptOverviewTable");

							// refresh all admin dashboard diagrams due to modified metadata
							$rootScope.$broadcast("refreshAdminDashboardDiagrams");
						}

						$timeout(function(){
				
							$scope.loadingData = false;
						});	
				}, function errorCallback(errorArray) {

					$("#scriptsDeleteErrorAlert").show();
					// if ($scope.successfullyDeletedDatasets.length > 0){
					// 	$("#scriptsDeleteSuccessAlert").show();
					// }

					$rootScope.$broadcast("refreshScriptOverviewTable");
					$scope.loadingData = false;
			});

		};

			$scope.getDeleteDatasetPromise = function(dataset){
				return $http({
					url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/process-scripts/" + dataset.scriptId,
					method: "DELETE"
				}).then(function successCallback(response) {
							$scope.successfullyDeletedDatasets.push(dataset);

							// remove entry from array
							var index = -1;

							for(var i=0; i< kommonitorDataExchangeService.availableProcessScripts.length; i++){
								if(kommonitorDataExchangeService.availableProcessScripts[i].scriptId === dataset.scriptId){
									index = i;
									break;
								}
							}

							if (index > -1) {
							  kommonitorDataExchangeService.availableProcessScripts.splice(index, 1);
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
				$("#scriptsDeleteSuccessAlert").hide();
			};

			$scope.hideErrorAlert = function(){
				$("#scriptsDeleteErrorAlert").hide();
			};

	}
]});
