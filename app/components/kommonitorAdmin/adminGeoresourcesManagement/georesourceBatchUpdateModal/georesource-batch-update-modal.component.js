angular.module('georesourceBatchUpdateModal').component('georesourceBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env',
		function GeoresourceModalBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

		$scope.standardPeriodOfValidity; // period of validity for all georessources
		$scope.standardCrs;
		$scope.allRowsSelected = false

		/*
		 * Modal:
		 *	name
		 * 	periodOfValidity
		 * 	dataFormat
		 * 	crs
		 * 	datasourceType
		 * 	mappingTablePath
		 * 	isSelected
		 */
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

			$('#standardPeriodOfValidityDatePicker').datepicker(kommonitorDataExchangeService.datePickerOptions);
			for(var i=0;i<$scope.batchList.length;i++) {
				$('#periodOfValidityDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
			}

			$scope.$apply(); // update scope
		};

		$scope.standardPeriodOfValidityChanged = function() {
			$scope.batchList.forEach(function(georesource) {
				georesource.periodOfValidity = $scope.standardPeriodOfValidity;
			});
		};

		$scope.standardCrsChanged = function() {
			$scope.batchList.forEach(function(georesource) {
				georesource.crs = $scope.standardCrs;
			});
		};

		$scope.loadGeoresourcesBatchList = function() {
			// TODO
			console.log("standardPeriodOfValidity: ", $scope.standardPeriodOfValidity);
			console.log("batchList: ", $scope.batchList);
			console.log("dataFormat of first entry: ", $scope.batchList[0].dataFormat.simpleName);
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

		$scope.checkIfDataFormatIsWfsV1 = function() {
			var res = false;
			//TODO break
			$scope.batchList.forEach( function(georesource) {
				if(georesource.dataFormat) {
					if(georesource.dataFormat.simpleName == "wfs.v1")
						res=true;
				}
				
			});

			return res;
		}

		$scope.filterGeoresourcesInBatchList = function(batchIndex) {
			return function (avGeoresource) {
				// check if georesource is in batchList
				var isInBatchList = false;
				for(var i=0;i<$scope.batchList.length;i++) {
					if($scope.batchList[i].name == avGeoresource.datasetName && i != batchIndex) {
						isInBatchList = true;
						break;
					}
				}

				// if yes
				if(isInBatchList) {
					// remove it from selectable options
					return false;
				} else {
					return true;
				}
			};
			//var resultArray = [];
			//console.log(resultArray)
			//for(var i=0;i<kommonitorDataExchangeService.availableGeoresources;i++) {
			//	resultArray.push(kommonitorDataExchangeService.availableGeoresources[i]);
			//}
			//console.log(resultArray)
			//return resultArray;
		};
	}
]});
