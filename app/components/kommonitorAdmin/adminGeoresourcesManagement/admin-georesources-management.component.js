angular.module('adminGeoresourcesManagement').component('adminGeoresourcesManagement', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/admin-georesources-management.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorDataGridHelperService', '$scope', '$timeout', '$rootScope', '__env', '$http', 
	function GeoresourcesManagementController(kommonitorDataExchangeService, kommonitorDataGridHelperService, $scope, $timeout, $rootScope, __env, $http) {

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
			
			kommonitorDataGridHelperService.buildDataGrid_georesources(kommonitorDataExchangeService.availableGeoresources);

			$scope.loadingData = false;
		};

		$scope.$on("refreshGeoresourceOverviewTable", function (event, crudType, targetGeoresourceId) {
			$scope.loadingData = true;
			$scope.refreshGeoresourceOverviewTable(crudType, targetGeoresourceId);
		});

		
		$scope.refreshGeoresourceOverviewTable = function(crudType, targetGeoresourceId){

			if(! crudType || !targetGeoresourceId){
				// refetch all metadata from spatial units to update table
				kommonitorDataExchangeService.fetchGeoresourcesMetadata().then(function successCallback(response) {

					$scope.initializeOrRefreshOverviewTable();

					$scope.loadingData = false;

					}, function errorCallback(response) {

						$scope.loadingData = false;
				});
			}
			else if(crudType && targetGeoresourceId){
				if(crudType == "add"){
					kommonitorDataExchangeService.fetchSingleGeoresourceMetadata(targetGeoresourceId).then(function successCallback(data) {

						kommonitorDataExchangeService.addSingleGeoresourceMetadata(data);

						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
					});
				}
				else if(crudType == "edit"){
					kommonitorDataExchangeService.fetchSingleGeoresourceMetadata(targetGeoresourceId).then(function successCallback(data) {

						kommonitorDataExchangeService.replaceSingleGeoresourceMetadata(data);
						
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
					});
				}				
				else if(crudType == "delete"){
					// targetGeoresourceId might be array in this case
					if(targetGeoresourceId && typeof targetGeoresourceId == "string"){
						kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(targetGeoresourceId);
						
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
					}

					else if (targetGeoresourceId && Array.isArray(targetGeoresourceId)){
						for (const id of targetGeoresourceId) {
							kommonitorDataExchangeService.deleteSingleGeoresourceMetadata(id);
						}
						$scope.initializeOrRefreshOverviewTable();
	
						$scope.loadingData = false;
					}
					
				}
			}

		};

		$scope.onClickDeleteDatasets = function(){
			$scope.loadingData = true;

			var markedEntriesForDeletion = kommonitorDataGridHelperService.getSelectedGeoresourcesMetadata();			

			// submit selected spatial units to modal controller
			$rootScope.$broadcast("onDeleteGeoresources", markedEntriesForDeletion);

			$scope.loadingData = false;
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
