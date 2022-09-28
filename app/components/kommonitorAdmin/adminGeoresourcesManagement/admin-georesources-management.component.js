angular.module('adminGeoresourcesManagement').component('adminGeoresourcesManagement', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/admin-georesources-management.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorCacheHelperService', 'kommonitorDataGridHelperService', '$scope', '$timeout', '$rootScope', '__env', '$http', 
	function GeoresourcesManagementController(kommonitorDataExchangeService, kommonitorCacheHelperService, kommonitorDataGridHelperService, $scope, $timeout, $rootScope, __env, $http) {

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

			$timeout(function(){
				
				$scope.loadingData = false;
			});	

		});

		$scope.initializeOrRefreshOverviewTable = function(){
			$scope.loadingData = true;
			
			kommonitorDataGridHelperService.buildDataGrid_georesources(kommonitorDataExchangeService.availableGeoresources);

			$timeout(function(){
				
				$scope.loadingData = false;
			});	
		};

		$scope.$on("refreshGeoresourceOverviewTable", function (event, crudType, targetGeoresourceId) {
			$scope.loadingData = true;
			$scope.refreshGeoresourceOverviewTable(crudType, targetGeoresourceId);
		});

		
		$scope.refreshGeoresourceOverviewTable = function(crudType, targetGeoresourceId){

			if(! crudType || !targetGeoresourceId){
				// refetch all metadata from spatial units to update table
				kommonitorDataExchangeService.fetchGeoresourcesMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(response) {

					$scope.initializeOrRefreshOverviewTable();
					$rootScope.$broadcast("refreshGeoresourceOverviewTableCompleted");

					$timeout(function(){
				
						$scope.loadingData = false;
					});	

					}, function errorCallback(response) {

						$timeout(function(){
				
							$scope.loadingData = false;
						});	
						$rootScope.$broadcast("refreshGeoresourceOverviewTableCompleted");
				});
			}
			else if(crudType && targetGeoresourceId){
				if(crudType == "add"){
					kommonitorCacheHelperService.fetchSingleGeoresourceMetadata(targetGeoresourceId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {

						kommonitorDataExchangeService.addSingleGeoresourceMetadata(data);

						$scope.initializeOrRefreshOverviewTable();
						$rootScope.$broadcast("refreshGeoresourceOverviewTableCompleted");
	
						$timeout(function(){
				
							$scope.loadingData = false;
						});	
	
						}, function errorCallback(response) {
	
							$timeout(function(){
				
								$scope.loadingData = false;
							});	
							$rootScope.$broadcast("refreshGeoresourceOverviewTableCompleted");
					});
				}
				else if(crudType == "edit"){
					kommonitorCacheHelperService.fetchSingleGeoresourceMetadata(targetGeoresourceId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {

						kommonitorDataExchangeService.replaceSingleGeoresourceMetadata(data);
						
						$scope.initializeOrRefreshOverviewTable();
						$rootScope.$broadcast("refreshGeoresourceOverviewTableCompleted");
	
						$timeout(function(){
				
							$scope.loadingData = false;
						});	
	
						}, function errorCallback(response) {
	
							$timeout(function(){
				
								$scope.loadingData = false;
							});	
							$rootScope.$broadcast("refreshGeoresourceOverviewTableCompleted");
					});
				}				
				else if(crudType == "delete"){
					// targetGeoresourceId might be array in this case
					if(targetGeoresourceId && typeof targetGeoresourceId == "string"){
						kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(targetGeoresourceId);
						
						$scope.initializeOrRefreshOverviewTable();
						$rootScope.$broadcast("refreshGeoresourceOverviewTableCompleted");
	
						$timeout(function(){
				
							$scope.loadingData = false;
						});	
					}

					else if (targetGeoresourceId && Array.isArray(targetGeoresourceId)){
						for (const id of targetGeoresourceId) {
							kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(id);
						}
						$scope.initializeOrRefreshOverviewTable();
						$rootScope.$broadcast("refreshGeoresourceOverviewTableCompleted");
	
						$timeout(function(){
				
							$scope.loadingData = false;
						});	
					}
					
				}
			}

		};

		$scope.onClickDeleteDatasets = function(){
			$scope.loadingData = true;

			var markedEntriesForDeletion = kommonitorDataGridHelperService.getSelectedGeoresourcesMetadata();			

			// submit selected spatial units to modal controller
			$rootScope.$broadcast("onDeleteGeoresources", markedEntriesForDeletion);

			$timeout(function(){
				
				$scope.loadingData = false;
			});	
		};

		$scope.onClickEditMetadata = function(georesourceDataset){
			// submit selected spatial unit to modal controller
			$rootScope.$broadcast("onEditGeoresourceMetadata", georesourceDataset);
		};

		$scope.onClickEditFeatures = function(georesourceDataset){
			// submit selected spatial unit to modal controller
			$rootScope.$broadcast("onEditGeoresourceFeatures", georesourceDataset);
		};

	}
]});
