angular.module('adminGeoresourcesManagement').component('adminGeoresourcesManagement', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/admin-georesources-management.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', function GeoresourcesManagementController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		// initialize any adminLTE box widgets
	  $('.box').boxWidget();

		$scope.loadingData = true;

		$scope.availableGeoresourceDatasets;
		$scope.selectPoiEntriesInput = false;
		$scope.selectLoiEntriesInput = false;
		$scope.selectAoiEntriesInput = false;

		$scope.$on("initialMetadataLoadingCompleted", function (event) {

			$scope.initializeOrRefreshOverviewTable();

		});

		$scope.initializeOrRefreshOverviewTable = function(){
			$scope.loadingData = true;
			$scope.availableGeoresourceDatasets = JSON.parse(JSON.stringify(kommonitorDataExchangeService.availableGeoresources));

			// initialize properties
			$scope.availableGeoresourceDatasets.forEach(function(dataset){
				dataset.isSelected = false;
			});

			$scope.loadingData = false;
		};

		$scope.$on("refreshGeoresourceOverviewTable", function (event) {
			$scope.loadingData = true;
			$scope.refreshGeoresourceOverviewTable();
		});

		$scope.onChangeSelectPoiEntries = function(){
			if ($scope.selectPoiEntriesInput){
				$scope.availableGeoresourceDatasets.forEach(function(dataset){
					if(dataset.isPOI)
						dataset.isSelected = true;
				});
			}
			else{
				$scope.availableGeoresourceDatasets.forEach(function(dataset){
					if(dataset.isPOI)
						dataset.isSelected = false;
				});
			}
		};

		$scope.onChangeSelectLoiEntries = function(){
			if ($scope.selectLoiEntriesInput){
				$scope.availableGeoresourceDatasets.forEach(function(dataset){
					if(dataset.isLOI)
						dataset.isSelected = true;
				});
			}
			else{
				$scope.availableGeoresourceDatasets.forEach(function(dataset){
					if(dataset.isLOI)
						dataset.isSelected = false;
				});
			}
		};

		$scope.onChangeSelectAoiEntries = function(){
			if ($scope.selectAoiEntriesInput){
				$scope.availableGeoresourceDatasets.forEach(function(dataset){
					if(dataset.isAOI)
						dataset.isSelected = true;
				});
			}
			else{
				$scope.availableGeoresourceDatasets.forEach(function(dataset){
					if(dataset.isAOI)
						dataset.isSelected = false;
				});
			}
		};

		$scope.refreshGeoresourceOverviewTable = function(){

			// refetch all metadata from spatial units to update table
			kommonitorDataExchangeService.fetchGeoresourcesMetadata().then(function successCallback(response) {

						$scope.initializeOrRefreshOverviewTable();

						$scope.loadingData = false;

				}, function errorCallback(response) {

					$scope.loadingData = false;
			})

		};

		$scope.onChangeSelectPoiDataset = function(georesourceDataset){
			console.log(georesourceDataset.datasetName);
		};
		$scope.onChangeSelectLoiDataset = function(georesourceDataset){
			console.log(georesourceDataset.datasetName);
		};
		$scope.onChangeSelectAoiDataset = function(georesourceDataset){
			console.log(georesourceDataset.datasetName);
		};

		$scope.onClickDeleteDatasets = function(){
			$scope.loadingData = true;

			var markedEntriesForDeletion = [];
			$scope.availableGeoresourceDatasets.forEach(function(dataset){
				if(dataset.isSelected){
					markedEntriesForDeletion.push(dataset);
				}
			});

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
