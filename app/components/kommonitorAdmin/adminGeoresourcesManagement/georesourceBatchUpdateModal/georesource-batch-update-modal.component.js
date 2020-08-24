angular.module('georesourceBatchUpdateModal').component('georesourceBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env',
		function GeoresourceModalBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

		$scope.standardPeriodOfValidity; // period of validity for all georessources
		$scope.allRowsSelected = false

		$scope.batchList = [
			{/*name: "Schulen", periodOfValidity: "2020-01-01", dataType: "", dataSource: "", mappingTablePath: "", isSelected: false*/},
			{/*name: "Wohnviertel", periodOfValidity: "", dataType: "", dataSource: "", mappingTablePath: "", isSelected: false*/},
			{/*name: "Sportstätten", periodOfValidity: "2019-12-03", dataType: "", dataSource: "", mappingTablePath: "", isSelected: true*/}
		];

		// on modal opened
		$('#modal-batch-update-georesources').on('show.bs.modal', function () {
			$scope.initialize();
		});

		// initializes the modal
		$scope.initialize = function(){
			//$scope.availableGeoresourceDatasets = JSON.parse(JSON.stringify(kommonitorDataExchangeService.availableGeoresources));

			$('#standardPeriodOfValidityDatePicker').datepicker(kommonitorDataExchangeService.datePickerOptions);
			for(var i=0;i<$scope.batchList.length;i++) {
				$('#periodOfValidityDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
			}

			$scope.$apply(); // update scope
		};

		$scope.dataSourceFormat = {
			geoJson: "geoJson",
			gml: "gml",
			wfsv1: "wfs.v1"
		};

		$scope.standardPeriodOfValidityChanged = function() {
			$scope.batchList.forEach(function(georesource) {
				// TODO overwrite all for now
				georesource.periodOfValidity = $scope.standardPeriodOfValidity;
			});
		}

		$scope.loadGeoresourcesBatchList = function() {
			// TODO
			console.log("standardPeriodOfValidity: ", $scope.standardPeriodOfValidity);
			console.log("batchList: ", $scope.batchList);
		};

		$scope.saveGeoresourcesBatchList = function() {
			// TODO
		};

		$scope.onChangeSelectAllRows = function() {
			if($scope.allRowsSelected) {
				$scope.batchList.forEach( function(georesource) {
					georesource.isSelected = true;
				});
			} else {
				$scope.batchList.forEach( function(georesource) {
					georesource.isSelected = false;
				});
			}
		}

		$scope.addNewRowToBatchList = function() {
			$scope.batchList.push({});
		}

		$scope.deleteSelectedRowsFromBatchList = function() {
			$scope.batchList = $scope.batchList.filter( function(georesource) {
				// remove if selected
				return !georesource.isSelected
			});
			$scope.allRowsSelected = false; // in case it was true
		}
	}
]});
