angular.module('adminIndicatorsManagement').component('adminIndicatorsManagement', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/admin-indicators-management.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorCacheHelperService', 'kommonitorDataGridHelperService', '$scope', '$timeout', '$rootScope', '__env', '$http', 
	function IndicatorsManagementController(kommonitorDataExchangeService, kommonitorCacheHelperService, kommonitorDataGridHelperService, $scope, $timeout, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorDataGridHelperServiceInstance = kommonitorDataGridHelperService;

        $scope.tableViewSwitcher = false;

		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		$scope.loadingData = true;

		$scope.selectIndicatorEntriesInput = false;

		$scope.dataGrid;

		$scope.sortableConfig = {
			onEnd: function (/**Event*/evt) {
				var updatedIndicatorMetadataEntries = evt.models;
				
				// for those models send API request to persist new sort order

				var patchBody = [];
				for (let index = 0; index < updatedIndicatorMetadataEntries.length; index++) {
					const indicatorMetadata = updatedIndicatorMetadataEntries[index];
					
					patchBody.push({
						"indicatorId": indicatorMetadata.indicatorId,
						"displayOrder": index
					});
				}

				$http({
					url: kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI + "/indicators/display-order",
					method: "PATCH",
					data: patchBody
					// headers: {
					//    'Content-Type': undefined
					// }
				}).then(function successCallback(response) {

	
					}, function errorCallback(error) {
						// if(error.data){							
						// 	$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error.data);
						// }
						// else{
						// 	$scope.errorMessagePart = kommonitorDataExchangeService.syntaxHighlightJSON(error);
						// }
	
						// $("#georesourceEditMetadataErrorAlert").show();

						kommonitorDataExchangeService.displayMapApplicationError(error);
				});

			}
		};

		$scope.$on("initialMetadataLoadingCompleted", function (event) {

			
			$timeout(function(){
				
				$scope.initializeOrRefreshOverviewTable();
			}, 250);

		});

		$scope.$on("initialMetadataLoadingFailed", function (event, errorArray) {

			$scope.loadingData = false;

		});

        $scope.onTableViewSwitch = function() {
            $scope.initializeOrRefreshOverviewTable();
        }

		$scope.initializeOrRefreshOverviewTable = function(){
			$scope.loadingData = true;
			
			kommonitorDataGridHelperService.buildDataGrid_indicators($scope.initIndicators());

			$scope.loadingData = false;
		};

        $scope.initIndicators = function() {

            if($scope.tableViewSwitcher)
                return kommonitorDataExchangeService.availableIndicators.filter(e => !(e.userPermissions.length==1 && e.userPermissions.includes('viewer')));
            else
                return kommonitorDataExchangeService.availableIndicators;
        }

		$scope.$on("refreshIndicatorOverviewTable", function (event, crudType, targetIndicatorId) {
			$scope.loadingData = true;
			$scope.refreshIndicatorOverviewTable(crudType, targetIndicatorId);
		});

		$scope.onChangeSelectIndicatorEntries = function(){
			if ($scope.selectIndicatorEntriesInput){
				$scope.availableIndicatorDatasets.forEach(function(dataset){
					dataset.isSelected = true;
						
				});
			}
			else{
				$scope.availableIndicatorDatasets.forEach(function(dataset){
					dataset.isSelected = false;
				});
			}
		};

		$scope.refreshIndicatorOverviewTable = function(crudType, targetIndicatorId){

			if(! crudType || !targetIndicatorId){
				// refetch all metadata from spatial units to update table
				kommonitorDataExchangeService.fetchIndicatorsMetadata(kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(response) {

					$scope.initializeOrRefreshOverviewTable();
					$rootScope.$broadcast("refreshIndicatorOverviewTableCompleted");

					$scope.loadingData = false;

					}, function errorCallback(response) {

						$scope.loadingData = false;
						$rootScope.$broadcast("refreshIndicatorOverviewTableCompleted");
				});
			}
			else if(crudType && targetIndicatorId){
				if(crudType == "add"){
					kommonitorCacheHelperService.fetchSingleIndicatorMetadata(targetIndicatorId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {

						kommonitorDataExchangeService.addSingleIndicatorMetadata(data);

						$scope.initializeOrRefreshOverviewTable();
						$rootScope.$broadcast("refreshIndicatorOverviewTableCompleted");
	
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
							$rootScope.$broadcast("refreshIndicatorOverviewTableCompleted");
					});
				}
				else if(crudType == "edit"){
					kommonitorCacheHelperService.fetchSingleIndicatorMetadata(targetIndicatorId, kommonitorDataExchangeService.currentKeycloakLoginRoles).then(function successCallback(data) {

						kommonitorDataExchangeService.replaceSingleIndicatorMetadata(data);
						
						$scope.initializeOrRefreshOverviewTable();
						$rootScope.$broadcast("refreshIndicatorOverviewTableCompleted");
	
						$scope.loadingData = false;
	
						}, function errorCallback(response) {
	
							$scope.loadingData = false;
							$rootScope.$broadcast("refreshIndicatorOverviewTableCompleted");
					});
				}
				else if(crudType == "delete"){
					kommonitorDataExchangeService.deleteSingleIndicatorMetadata(targetIndicatorId);
						
						$scope.initializeOrRefreshOverviewTable();
						$rootScope.$broadcast("refreshIndicatorOverviewTableCompleted");
	
						$scope.loadingData = false;
				}
			}

			

		};

		// $scope.onClickDeleteDatasets = function(){
		// 	$scope.loadingData = true;

		// 	var markedEntriesForDeletion = [];
		// 	$scope.availableIndicatorDatasets.forEach(function(dataset){
		// 		if(dataset.isSelected){
		// 			markedEntriesForDeletion.push(dataset);
		// 		}
		// 	});

		// 	// submit selected spatial units to modal controller
		// 	$rootScope.$broadcast("onDeleteIndicators", markedEntriesForDeletion);

		// 	$scope.loadingData = false;
		// };

	}
]});
