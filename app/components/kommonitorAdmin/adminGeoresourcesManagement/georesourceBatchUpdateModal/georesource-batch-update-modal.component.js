angular.module('georesourceBatchUpdateModal').component('georesourceBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', '$scope', '$rootScope', '$http', '__env',
		function GeoresourceModalBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;

		$scope.standardPeriodOfValidityStart; // period of validity start for all georessources
		$scope.standardCrs;
		$scope.allRowsSelected = false
		$scope.standardPeriodOfValidityStartChb = false;
		$scope.standardCrsChb = true;

		/*
		 * Modal:
		 * 	isSelected
		 * 	name
		 * 	mappingTablePath
		 * 	periodOfValidity
		 * 	dataFormat.format
		 * 	dataFormat.crs
		 * 	dataFormat.separator
		 * 	dataFormat.yCoordColumn
		 * 	dataFormat.xCoordColumn
		 * 	dataFormat.schema
		 * 	datasourceType.type
		 * 	datasourceType.file
		 * 	datasourceType.url
		 * 	datasourceType.payload
		 * 	idAttrName
		 * 	nameAttrName
		 * 	lifetimeBeginnAttrName
		 * 	lifetimeEndAttrName
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

			$('#standardPeriodOfValidityStartDatePicker').datepicker(kommonitorDataExchangeService.datePickerOptions);
			//$('#standardPeriodOfValidityEndDatePicker').datepicker(kommonitorDataExchangeService.datePickerOptions);
			for(var i=0;i<$scope.batchList.length;i++) {
				$('#periodOfValidityStartDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
				$('#periodOfValidityEndDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
			}

			$scope.$apply();
		};

		$scope.standardPeriodOfValidityStartChanged = function() {
			angular.forEach($scope.batchList, function(georesource) {
				georesource.periodOfValidityStart = $scope.standardPeriodOfValidityStart;
			});
		};

		$scope.standardCrsChanged = function() {
			angular.forEach($scope.batchList, function(georesource) {
				georesource.crs = $scope.standardCrs;
			});
		};

		$scope.loadGeoresourcesBatchList = function() {
			// TODO
			console.log("standardPeriodOfValidityStart: ", $scope.standardPeriodOfValidityStart);
			console.log("batchList: ", $scope.batchList);
			console.log("availableDatasourceTypes: ", kommonitorImporterHelperService.availableDatasourceTypes);
			console.log("dataFormat of first entry: ", $scope.batchList[0].dataFormat.format.simpleName);
			
		};

		$scope.saveGeoresourcesBatchList = function() {
			// TODO
		};

		$scope.onChangeSelectAllRows = function() {
			if($scope.allRowsSelected) {
				angular.forEach($scope.batchList, function(georesource) {
					georesource.isSelected = true;
				});
			} else {
				angular.forEach($scope.batchList, function(georesource) {
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

		// loop through batch list and check if condition is true for at least one row
		$scope.checkIfDataFormatIsWfsV1 = function() {
			var dataFormatIsWfsV1 = false;
			for(var i=0;i<$scope.batchList.length;i++) {
				if($scope.batchList[i].dataFormat != null) {
					if($scope.batchList[i].dataFormat.format.simpleName == "wfs.v1") {
						dataFormatIsWfsV1 = true;
						break;
					}
				}
				
			}
			 return dataFormatIsWfsV1;
		}

		// loop through batch list and check if condition is true for at least one row
		$scope.checkIfDataFormatIsCsvLatLon = function() {
			var checkIfDataFormatIsCsvLatLon = false;
			for(var i=0;i<$scope.batchList.length;i++) {
				if($scope.batchList[i].dataFormat != null) {
					if($scope.batchList[i].dataFormat.format.simpleName == "csvLatLon") {
						checkIfDataFormatIsCsvLatLon = true;
						break;
					}
				}
				
			}
			 return checkIfDataFormatIsCsvLatLon;
		}

		// loop through batch list and check if condition is true for at least one row
		$scope.checkIfDatasourceTypeIsFile = function() {
			var checkIfDatasourceTypeIsFile = false;
			for(var i=0;i<$scope.batchList.length;i++) {
				if($scope.batchList[i].datasourceType != null) {
					if($scope.batchList[i].datasourceType.type.type == "FILE") {
						checkIfDatasourceTypeIsFile = true;
						break;
					}
				}
				
			}
			 return checkIfDatasourceTypeIsFile;
		}

		// loop through batch list and check if condition is true for at least one row
		$scope.checkIfDatasourceTypeIsHttp = function() {
			var checkIfDatasourceTypeIsHttp = false;
			for(var i=0;i<$scope.batchList.length;i++) {
				if($scope.batchList[i].datasourceType != null) {
					if($scope.batchList[i].datasourceType.type.type == "HTTP") {
						checkIfDatasourceTypeIsHttp = true;
						break;
					}
				}
				
			}
			 return checkIfDatasourceTypeIsHttp;
		}

		// loop through batch list and check if condition is true for at least one row
		$scope.checkIfDatasourceTypeIsInline = function() {
			var checkIfDatasourceTypeIsInline = false;
			for(var i=0;i<$scope.batchList.length;i++) {
				if($scope.batchList[i].datasourceType != null) {
					if($scope.batchList[i].datasourceType.type.type == "INLINE") {
						checkIfDatasourceTypeIsInline = true;
						break;
					}
				}
				
			}
			 return checkIfDatasourceTypeIsInline;
		}


		/**
		 * Filters georessources that are already present in the batch list so that they can't be added twice.
		 * https://stackoverflow.com/questions/11753321/passing-arguments-to-angularjs-filters/17813797
		 * 
		 * batchIndex: index of the row where the dropdown menu was opened
		 */
		$scope.filterGeoresourcesInBatchList = function(batchIndex) {
			// avGeoresources is the list of available georesources from the kommonitorDataExchangeService
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
		};
	}
]});
