angular.module('georesourceBatchUpdateModal').component('georesourceBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorBatchUpdateHelperService', '$scope', '$rootScope', '$http', '__env',
		function GeoresourceModalBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorBatchUpdateHelperService, $scope, $rootScope, $http, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
		this.kommonitorBatchUpdateHelperServiceInstance = kommonitorBatchUpdateHelperService;

		$scope.standardPeriodOfValidityStart; // period of validity start for all georessources
		$scope.standardCrs;
		$scope.allRowsSelected = false
		$scope.standardPeriodOfValidityStartChb = true;
		$scope.standardCrsChb = true;

		/*
		 * Modal:
		 * 	isSelected
		 * 	name
		 * 	mappingTable
		 * 	saveToMappingTable
		 * 	periodOfValidityStart
		 * 	periodOfValidityEnd
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
			{},
			{},
			{}
		];

		// on modal opened
		$('#modal-batch-update-georesources').on('show.bs.modal', function () {
			$scope.initialize();
		});

		// initializes the modal
		$scope.initialize = function(){

			$('#standardPeriodOfValidityStartDatePicker').datepicker(kommonitorDataExchangeService.datePickerOptions);
			for(var i=0;i<$scope.batchList.length;i++) {
				$('#periodOfValidityStartDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
				$('#periodOfValidityEndDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
			}

			$(".mappingTableInputField").change(function(){

				// get index of changed field
				var index = kommonitorBatchUpdateHelperService.getIndexFromId(this.id)

				// get file
				var file = this.files[0];

				// read content
				var reader = new FileReader();
				var content;
				reader.addEventListener('load', function(event) {
					mappingObj = JSON.parse(event.target.result);
					// update scope variables for row with that index
					$scope.updateBatchListRow(mappingObj, index);
				});
				reader.readAsText(file)
			});

			$scope.$apply();
		};

		// TODO move to kommonitorBatchUpdateHelperService if appropriate
		$scope.standardPeriodOfValidityStartChanged = function() {
			angular.forEach($scope.batchList, function(georesource) {
				georesource.periodOfValidityStart = $scope.standardPeriodOfValidityStart;
			});
		};

		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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
			kommonitorBatchUpdateHelperService.parseBatchListFromFile("georesource", file, $scope);
			$scope.$apply();
		});

		$scope.saveGeoresourcesBatchList = function() {
			kommonitorBatchUpdateHelperService.saveBatchListToFile("georesource", $scope.batchList);
		};

		$scope.batchUpdateGeoresources = function() {
			console.log($scope);
			kommonitorBatchUpdateHelperService.batchUpdateGeoresources(georesource);
		}

		$scope.resetGeoresourceBatchUpdateForm = function() {
			kommonitorBatchUpdateHelperService.resetBatchUpdateForm($scope.batchList);
		}

		$scope.onChangeSelectAllRows = function() {
			kommonitorBatchUpdateHelperService.onChangeSelectAllRows($scope);
		}

		$scope.addNewRowToBatchList = function() {
			kommonitorBatchUpdateHelperService.addNewRowToBatchList($scope);
		}

		$scope.deleteSelectedRowsFromBatchList = function() {
			kommonitorBatchUpdateHelperService.deleteSelectedRowsFromBatchList($scope);
		}

	
		// loop through batch list and check if condition is true for at least one row
		// TODO move to kommonitorBatchUpdateHelperService
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
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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

		$scope.resetRowByIndex = function(rowIndex) {
			$scope.batchList[rowIndex] = {};
			$scope.batchList[rowIndex].dataFormat = {};
			$scope.batchList[rowIndex].datasourceType = {};
		}

		// updates a row in the batch list with the content of the mapping file selected
		$scope.updateBatchListRow = function(mappingObj, rowIndex) {
			// reset row
			$scope.resetRowByIndex(rowIndex);

			// period of validity
			if(mappingObj.periodOfValidity.hasOwnProperty("startDate"))
				$scope.batchList[rowIndex].periodOfValidityStart = mappingObj.periodOfValidity.startDate;
			if(mappingObj.periodOfValidity.hasOwnProperty("endDate"))
				$scope.batchList[rowIndex].periodOfValidityEnd = mappingObj.periodOfValidity.endDate;

			// converter
			if(mappingObj.hasOwnProperty("converter"))
				$scope.batchList[rowIndex].dataFormat.format = $scope.getConverterObjectByName(mappingObj.converter.name)

			// converter parameters
			if(mappingObj.converter.hasOwnProperty("parameters")) {
				var parameters = mappingObj.converter.parameters;
				for (parameter of parameters) {
					if(parameter.name === "CRS")
						$scope.batchList[rowIndex].dataFormat.crs = parameter.value;

					if(parameter.name === "xCoordColumn")
						$scope.batchList[rowIndex].dataFormat.xCoordColumn = parameter.value;
					
					if(parameter.name === "yCoordColumn")
						$scope.batchList[rowIndex].dataFormat.yCoordColumn = parameter.value;
					
					if(parameter.name === "separator")
						$scope.batchList[rowIndex].dataFormat.separator = parameter.value;
				}
			}

			// converter schema (only for wfs)
			if(mappingObj.converter.hasOwnProperty("schema"))
				$scope.batchList[rowIndex].dataFormat.schema =  mappingObj.converter.schema;

			// datasource
			if(mappingObj.hasOwnProperty("dataSource"))
				$scope.batchList[rowIndex].datasourceType.type = $scope.getDatasourceTypeObjectByType(mappingObj.dataSource.type)

			// datasource parameters
			if(mappingObj.dataSource.hasOwnProperty("parameters")) {
				var parameters = mappingObj.dataSource.parameters;
				// contains a single parameter
				if(parameters[0].name === "NAME") // TODO this should be "FILE"", but it gets exported like this
					$scope.batchList[rowIndex].datasourceType.file = parameters[0].value;
				
				if(parameters[0].name === "URL")
					$scope.batchList[rowIndex].datasourceType.url = parameters[0].value;

				if(parameters[0].name === "payload")
					$scope.batchList[rowIndex].datasourceType.payload = parameters[0].value;
			}
			
			if(mappingObj.hasOwnProperty("propertyMapping")) {
				var mapping = mappingObj.propertyMapping;

				if(mapping.hasOwnProperty("identifierProperty"))
					$scope.batchList[rowIndex].idAttrName = mapping.identifierProperty;

				if(mapping.hasOwnProperty("nameProperty"))
					$scope.batchList[rowIndex].nameAttrName = mapping.nameProperty;

				if(mapping.hasOwnProperty("validStartDateProperty"))
					$scope.batchList[rowIndex].lifetimeBeginnAttrName = mapping.validStartDateProperty;

				if(mapping.hasOwnProperty("validEndDateProperty"))
					$scope.batchList[rowIndex].lifetimeEndAttrName = mapping.validEndDateProperty;
			}

			$scope.$apply();
			console.log($scope.batchList);
		}

		//TODO
		// saves the current values of this row to the previously selected mapping file
		$scope.onMappingTableSaveClicked = function() {

			// check if a mapping file is selected for this row
				// if not show an error message and return

			// read selected file and parse to json, this is needed to get the state of the propertyMapping (keepAttributes, ...)

			// overwrite json properties

			// overwrite file

		}

		// helper function to get a converter object by full name.
		// returns null if no converter was found
		// TODO is this function needed?
		$scope.getConverterObjectByName = function(name) {
			for (converter of kommonitorImporterHelperService.availableConverters) {
				if(converter.name === name) {
					return converter;
				}
			}
			return null;
		}

		// helper function to get a datasourceType object by type.
		// returns null if no datasourceType was found
		// TODO is this function needed?
		$scope.getDatasourceTypeObjectByType = function(type) {
			for (datasourceType of kommonitorImporterHelperService.availableDatasourceTypes) {
				if(datasourceType.type === type) {
					return datasourceType;
				}
			}
			return null;
		}
	}
]});