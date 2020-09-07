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
		 * 	mappingTable
		 * 	saveToMappingTable
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
			{}
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

			$("#georesourceBatchListFile").files = [];

			// trigger file chooser
			$("#georesourceBatchListFile").click();
		};

		$(document).on("change", "#georesourceBatchListFile" ,function(){
			
			// get the file
			var file = document.getElementById('georesourceBatchListFile').files[0];
			$scope.parseBatchListFromFile(file);
		});

		$scope.parseBatchListFromFile = function(file){
			var fileReader = new FileReader();

			fileReader.onload = function(event) {
				$scope.batchList = JSON.parse(event.target.result);
				$scope.$apply();
			};

			// Read in the image file as a data URL.
			fileReader.readAsText(file);
		};

		$scope.saveGeoresourcesBatchList = function() {
			var batchListJSON = JSON.stringify($scope.batchList);
			console.log(batchListJSON);
			var fileName = "Georessource_batch_update_batch_list.json";

			var blob = new Blob([batchListJSON], {type: "application/json"});
			var data  = URL.createObjectURL(blob);

			var a = document.createElement('a');
			a.download    = fileName;
			a.href        = data;
			a.textContent = "JSON";
			a.target = "_blank";
			a.rel = "noopener noreferrer";
			a.click();

			a.remove();
		};

		$scope.batchUpdateGeoresources = function() {
			// TODO
			console.log($scope.batchList);
		}

		$scope.resetGeoresourceBatchUpdateForm = function() {
			for(var i=0;i<$scope.batchList.length;i++)
				$scope.batchList[i] = {};
		}

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
			// TODO after removing a row the georesource name selection stops working
			// loop backwards through $scope.batchList and remove selected rows
			for (var i = $scope.batchList.length - 1; i >= 0; i--) {
				if ($scope.batchList[i].isSelected) {
					$scope.batchList.splice(i, 1);
					
				}
			}

			$scope.allRowsSelected = false; // in case it was true

			
		}


		// loop through batch list and check if condition is true for at least one row
		$scope.checkIfMappingTableIsSpecified = function() {
			
			var mappingTableIsSpecified = false;
			for(var i=0;i<$scope.batchList.length;i++) {
				if($scope.batchList[i].mappingTable != undefined) {
					mappingTableIsSpecified = true;
					break;
				}
			}
			return mappingTableIsSpecified;
			
		}


		// loop through batch list and check if condition is true for at least one row
		$scope.checkIfDataFormatIsWfsV1 = function() {
			var dataFormatIsWfsV1 = false;
			for(var i=0;i<$scope.batchList.length;i++) {
				if($scope.batchList[i].dataFormat != undefined) {
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
				if($scope.batchList[i].dataFormat != undefined) {
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
				if($scope.batchList[i].datasourceType != undefined) {
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
				if($scope.batchList[i].datasourceType != undefined) {
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
				if($scope.batchList[i].datasourceType != undefined) {
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
						console.log(batchIndex);
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
]}).directive("fileread", [function () {
	// workaround to get a selected file in ng-model, see:
	// https://stackoverflow.com/questions/17063000/ng-model-for-input-type-file-with-directive-demo
    return {
        scope: {
            fileread: "="
        },
        link: function (scope, element, attributes) {
            element.bind("change", function (changeEvent) {
                scope.$apply(function () {
                    scope.fileread = changeEvent.target.files[0];
                    // or all selected files:
                    // scope.fileread = changeEvent.target.files;
                });
            });
        }
    }
}]);