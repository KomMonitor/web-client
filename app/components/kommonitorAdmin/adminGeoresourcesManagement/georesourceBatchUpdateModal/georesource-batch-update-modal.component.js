angular.module('georesourceBatchUpdateModal').component('georesourceBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorBatchUpdateHelperService', '$scope', '$rootScope', '$http', '$timeout', '__env',
		function GeoresourceModalBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorBatchUpdateHelperService, $scope, $rootScope, $http, $timeout, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
		this.kommonitorBatchUpdateHelperServiceInstance = kommonitorBatchUpdateHelperService;

		$scope.standardPeriodOfValidityStart; // period of validity start for all georessources
		$scope.standardCrs;
		$scope.allRowsSelected = false
		$scope.standardPeriodOfValidityStartChb = false;
		$scope.standardCrsChb = false;

		/*
		 * Model:
		 * 	isSelected
		 * 	name
		 * 	mappingTableName
		 * 	mappingObj // DOM structure of the parsed mapping file
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
		$scope.batchList = [];
		

		// on modal opened
		$('#modal-batch-update-georesources').on('show.bs.modal', function () {

			// this check is necessary to avoid running the initialize method on opening datepicker modals
			if(event.target.id === "button-batch-update-georesources") {
				$scope.initialize();
			}
			
		});

		// initializes the modal
		$scope.initialize = function() {

			$scope.addNewRowToBatchList("georesource");

			$('#standardPeriodOfValidityStartDatePicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

			$(document).delegate(".mappingTableInputField", "change", function(){
				// get index of changed field
				var index = kommonitorBatchUpdateHelperService.getIndexFromId(this.id);
				
				// get file
				var file = this.files[0];

				// read content
				var reader = new FileReader();
				reader.addEventListener('load', function(event) {
					var mappingObj = JSON.parse(event.target.result);
					// store mappingObj for later use
					$scope.batchList[index].mappingObj = mappingObj;
					// update scope variables for row with that index
					$scope.updateBatchListRow(file, mappingObj, index);
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
			$("#georesourceBatchListFile").trigger("click");
		};

		$(document).on("change", "#georesourceBatchListFile" ,function(){
			
			// get the file
			var file = document.getElementById('georesourceBatchListFile').files[0];
			kommonitorBatchUpdateHelperService.parseBatchListFromFile("georesource", file, $scope.batchList)
		});

		$scope.$on('georesourceBatchListParsed', function(event, data) {
			$timeout(function() {

				var newBatchList = data.newValue;

				// remove all rows
				for (var i = 0; i < $scope.batchList.length; i++)
					$scope.batchList[i].isSelected = true;
				$scope.deleteSelectedRowsFromBatchList();

				
				for(let i=0;i<newBatchList.length;i++) {
					$scope.addNewRowToBatchList("georesource");
					// isselected
					$scope.batchList[i].isSelected = newBatchList[i].isSelected;

					// name
					// The exported batchList does not contain all of the metadata.
					// We have to use the georesourceId to select the corresponding select option in the "name" column.
					var georesourceId = newBatchList[i].name;
					var georesourceObj = $scope.getGeoresourceById(georesourceId);
					$scope.batchList[i].name = georesourceObj;

					// mappingTableName
					$scope.batchList[i].mappingTableName = newBatchList[i].mappingTableName;

					// mappingObj
					$scope.batchList[i].mappingObj = newBatchList[i].mappingObj;

					// periodOfValidityStart
					$scope.batchList[i].periodOfValidityStart = newBatchList[i].periodOfValidityStart;

					// periodOfValidityEnd
					$scope.batchList[i].periodOfValidityEnd = newBatchList[i].periodOfValidityEnd;

					// dataFormat.format
					var converterName = newBatchList[i].dataFormat.format.name;
					var converterObj = $scope.getConverterObjectByName(converterName);
					$scope.batchList[i].dataFormat.format = converterObj;

					// dataFormat.crs
					$scope.batchList[i].dataFormat.crs = newBatchList[i].dataFormat.crs;

					// dataFormat.separator
					$scope.batchList[i].dataFormat.separator = newBatchList[i].dataFormat.separator;

					// dataFormat.yCoordColumn
					$scope.batchList[i].dataFormat.yCoordColumn = newBatchList[i].dataFormat.yCoordColumn;

					// dataFormat.xCoordColumn
					$scope.batchList[i].dataFormat.xCoordColumn = newBatchList[i].dataFormat.xCoordColumn;

					// dataFormat.schema
					$scope.batchList[i].dataFormat.schema = newBatchList[i].dataFormat.schema;

					// datasourceType.type
					var datasourceType = newBatchList[i].datasourceType.type.type;
					var datasource = $scope.getDatasourceTypeObjectByType(datasourceType);
					$scope.batchList[i].datasourceType.type = datasource;

					// datasourceType.file
					$scope.batchList[i].datasourceType.file = newBatchList[i].datasourceType.file;

					// datasourceType.url
					$scope.batchList[i].datasourceType.url = newBatchList[i].datasourceType.url;

					// datasourceType.payload
					$scope.batchList[i].datasourceType.payload = newBatchList[i].datasourceType.payload;

					// idAttrName
					$scope.batchList[i].idAttrName = newBatchList[i].idAttrName;

					// nameAttrName
					$scope.batchList[i].nameAttrName = newBatchList[i].nameAttrName;

					// lifetimeBeginnAttrName
					$scope.batchList[i].lifetimeBeginnAttrName = newBatchList[i].lifetimeBeginnAttrName;

					// lifetimeEndAttrName
					$scope.batchList[i].lifetimeEndAttrName = newBatchList[i].lifetimeEndAttrName;

					// set file names in ui, for mappingtable and datasourceType.file
					//TODO https://stackoverflow.com/questions/5138719/change-default-text-in-input-type-file
					
				}
			});
		})

		$scope.saveGeoresourcesBatchList = function() {
			kommonitorBatchUpdateHelperService.saveBatchListToFile("georesource", $scope.batchList);
		};

		$scope.batchUpdateGeoresources = function() {
			kommonitorBatchUpdateHelperService.batchUpdate("georesource", $scope.batchList);
		}

		$scope.resetGeoresourceBatchUpdateForm = function() {
			kommonitorBatchUpdateHelperService.resetBatchUpdateForm($scope.batchList);
		}

		$scope.onChangeSelectAllRows = function() {
			kommonitorBatchUpdateHelperService.onChangeSelectAllRows($scope.allRowsSelected, $scope.batchList);
		}

		$scope.addNewRowToBatchList = function(resourceType) {

			kommonitorBatchUpdateHelperService.addNewRowToBatchList(resourceType, $scope.batchList);
			$scope.initializeDatepickerFields();
		}

		$scope.deleteSelectedRowsFromBatchList = function() {
			kommonitorBatchUpdateHelperService.deleteSelectedRowsFromBatchList($scope.batchList, $scope.allRowsSelected);
		}

	
		// loop through batch list and check if condition is true for at least one row
		// TODO move to kommonitorBatchUpdateHelperService
		$scope.checkIfMappingTableIsSpecified = function() {
			
			var mappingTableIsSpecified = false;
			for(var i=0;i<$scope.batchList.length;i++) {
				if($scope.batchList[i].mappingTableName != undefined) {
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

						// clear the other model variables
						$scope.batchList[i].datasourceType.url = "";
						$scope.batchList[i].datasourceType.payload = "";

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

						// clear the other model variables
						$scope.batchList[i].datasourceType.file = "";
						$scope.batchList[i].datasourceType.payload = "";
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

						// clear the other model variables
						$scope.batchList[i].datasourceType.file = "";
						$scope.batchList[i].datasourceType.url = "";
						break;
					}
				}
				
			}

			return checkIfDatasourceTypeIsInline;
		}

		// loop through batch list and check if condition is true for at least one row
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
		$scope.checkIfMappingTableChosenInEachRow = function() {
			if($scope.batchList.length == 0) {
				return true;
			}

			var mappingTableChosenInEachRow = true;
			for(var i=0;i<$scope.batchList.length;i++) {
				if($scope.batchList[i].mappingTableName != undefined) {
					if($scope.batchList[i].mappingTableName == "") {
						mappingTableChosenInEachRow = false;
						break;
					}
				}
			}

			return !mappingTableChosenInEachRow;
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
					if($scope.batchList[i].name) {
						if($scope.batchList[i].name.georesourceId == avGeoresource.georesourceId && i != batchIndex) {
							isInBatchList = true;
							break;
						}
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

		// TODO move to service?
		$scope.resetRowByIndex = function(rowIndex) {
			//$scope.batchList[rowIndex].name = "";
			$scope.batchList[rowIndex].periodOfValidityStart = "";
			$scope.batchList[rowIndex].periodOfValidityEnd = "";
			$scope.batchList[rowIndex].dataFormat = {};
			$scope.batchList[rowIndex].dataFormat.format = "";
			$scope.batchList[rowIndex].dataFormat.crs = "";
			$scope.batchList[rowIndex].dataFormat.separator = "";
			$scope.batchList[rowIndex].dataFormat.yCoordColumn = "";
			$scope.batchList[rowIndex].dataFormat.xCoordColumn = "";
			$scope.batchList[rowIndex].dataFormat.schema = "";
			$scope.batchList[rowIndex].datasourceType = {};
			$scope.batchList[rowIndex].datasourceType.type = "";
			$scope.batchList[rowIndex].datasourceType.file = "";
			$scope.batchList[rowIndex].datasourceType.url = "";
			$scope.batchList[rowIndex].datasourceType.payload = "";
			$scope.batchList[rowIndex].idAttrName = "";
			$scope.batchList[rowIndex].nameAttrName = "";
			$scope.batchList[rowIndex].lifetimeBeginnAttrName = "";
			$scope.batchList[rowIndex].lifetimeEndAttrName = "";
		}

		// updates a row in the batch list with the content of the mapping file selected
		$scope.updateBatchListRow = function(file, mappingObj, rowIndex) {
			// reset row
			$scope.resetRowByIndex(rowIndex);

			// mappingTable
			$scope.batchList[rowIndex].mappingTableName = file.name;

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
				if(parameters[0].name === "NAME")
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
		}

		//TODO
		// saves the current values of this row to the previously selected mapping file
		$scope.onMappingTableSaveClicked = function($event) {

			// Check if a mapping file is selected for this row
			// This function should only be running if a file is selected, else the button is disabled.
			// This check is just for double safety.
			var rowIndex = kommonitorBatchUpdateHelperService.getIndexFromId($event.currentTarget.id);
			if(!$scope.batchList[rowIndex].mappingTableName) {
				// if not show an error message and return
				// TODO show proper error message
				console.log("Save Button was clicked but no mapping file was loaded previously for this row.");
				return;
			} else {
				$scope.batchList[rowIndex].mappingObj =
					$scope.updateMappingObject($scope.batchList[rowIndex].mappingObj, rowIndex);
				kommonitorBatchUpdateHelperService.saveMappingObjectToFile($scope.batchList[rowIndex].mappingObj);
			}
		};

		// updates the mappingObject with scope variables for the given index in the batch list
		// TODO move to service?
		$scope.updateMappingObject = function(mappingObj, rowIndex) {

			var batchRow = $scope.batchList[rowIndex]

			// period of validity
			if(mappingObj.hasOwnProperty("periodOfValidity")) {
				mappingObj.periodOfValidity.startDate = batchRow.periodOfValidityStart;
				mappingObj.periodOfValidity.endDate = batchRow.periodOfValidityEnd;
			}
			
			// converter
			if(mappingObj.hasOwnProperty("converter")) {
				var convObj = $scope.getConverterObjectByName(batchRow.dataFormat.format.name);
				mappingObj.converter.name = convObj.name;
				mappingObj.converter.encoding = convObj.encodings[0];
				mappingObj.converter.mimeType = convObj.mimeTypes[0];

				// converter parameters
				if(mappingObj.converter.hasOwnProperty("parameters")) {
					// rebuild array
					mappingObj.converter.parameters = [];


					if(batchRow.dataFormat.crs != undefined && batchRow.dataFormat.crs != "") {
						var crs = {"name": "CRS", "value": batchRow.dataFormat.crs};
						mappingObj.converter.parameters.push(crs);
					}

					if(batchRow.dataFormat.separator != undefined && batchRow.dataFormat.separator != "") {
						var separator = {"name": "separator", "value": batchRow.dataFormat.separator};
						mappingObj.converter.parameters.push(separator);
					}
					
					if(batchRow.dataFormat.yCoordColumn != undefined && batchRow.dataFormat.yCoordColumn != "") {
						var yCoordColumn = {"name": "yCoordColumn", "value": batchRow.dataFormat.yCoordColumn};
						mappingObj.converter.parameters.push(yCoordColumn);
					}
					
					if(batchRow.dataFormat.xCoordColumn != undefined && batchRow.dataFormat.xCoordColumn != "") {
						var xCoordColumn = {"name": "xCoordColumn", "value": batchRow.dataFormat.xCoordColumn};
						mappingObj.converter.parameters.push(xCoordColumn);
					}
				}

				// converter schema
				if(batchRow.dataFormat.schema != undefined)
					mappingObj.converter.schema = batchRow.dataFormat.schema;
			}

			// datasource
			if(mappingObj.hasOwnProperty("dataSource")) {
				// datasource parameters
				if(mappingObj.dataSource.hasOwnProperty("parameters")) {
					// rebuild array
					mappingObj.dataSource.parameters = [];
					// contains a single parameter
					if(batchRow.datasourceType.file) {
						mappingObj.dataSource.parameters[0] = {"name": "FILE", "value": batchRow.datasourceType.file};
						mappingObj.dataSource.type = "FILE";
					} else if (batchRow.datasourceType.url) {
						mappingObj.dataSource.parameters[0] = {"name": "URL", "value": batchRow.datasourceType.url};
						mappingObj.dataSource.type = "HTTP";
					} else if (batchRow.datasourceType.payload) {
						mappingObj.dataSource.parameters[0] = {"name": "payload", "value": batchRow.datasourceType.payload};
						mappingObj.dataSource.type = "INLINE";
					}
				}

			};

			// property mapping
			if(mappingObj.hasOwnProperty("propertyMapping")) {
				if(batchRow.idAttrName != undefined && batchRow.idAttrName != "")
					mappingObj.propertyMapping.identifierProperty = batchRow.idAttrName;

				if(batchRow.nameAttrName != undefined && batchRow.nameAttrName != "")
					mappingObj.propertyMapping.nameProperty = batchRow.nameAttrName;

				if(batchRow.lifetimeEndAttrName != undefined && batchRow.lifetimeEndAttrName != "")
					mappingObj.propertyMapping.validEndDateProperty = batchRow.lifetimeEndAttrName;

				if(batchRow.lifetimeBeginnAttrName != undefined && batchRow.lifetimeBeginnAttrName != "")
					mappingObj.propertyMapping.validStartDateProperty = batchRow.lifetimeBeginnAttrName;
			}

			return mappingObj;
		};

		// helper function to get a converter object by full name.
		// returns null if no converter was found
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
		$scope.getDatasourceTypeObjectByType = function(type) {
			for (datasourceType of kommonitorImporterHelperService.availableDatasourceTypes) {
				if(datasourceType.type === type) {
					return datasourceType;
				}
			}
			return null;
		}

		// helper function to get a georesource object by id.
		// returns null if no georesource object was found
		$scope.getGeoresourceById = function(id) {
			for (georesource of kommonitorDataExchangeService.availableGeoresources) {
				if(georesource.georesourceId === id) {
					return georesource;
				}
			}
			return null;
		}

		$scope.initializeDatepickerFields = function() {

			$timeout(function() {
				for(var i=0;i<$scope.batchList.length;i++) {
					$('#periodOfValidityStartDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
					$('#periodOfValidityEndDatePicker' + i).datepicker(kommonitorDataExchangeService.datePickerOptions);
				};
			}, 200);
		}

		$scope.onClickSaveStandardPeriodOfValidity = function() {

			var newValue = document.getElementById("standardPeriodOfValidityStartDatePicker").value;

			$timeout(function() {
				if(newValue.length > 0) {
				
					var allRowsChbState = document.getElementById("standardPeriodOfValidityStartChb").checked;
					if (allRowsChbState) {
						// if checkbox is true update all rows
						$scope.batchList.forEach(function(value, index) {
							value.periodOfValidityStart = newValue;
						});
					} else {
						// else only update empty rows
						$scope.batchList.forEach(function(value, index) {
							if (value.periodOfValidityStart == undefined || value.periodOfValidityStart == "") {
								value.periodOfValidityStart = newValue;
							}
						});
					}
				}
			});
			
		}

		$scope.onClickSaveStandardCRS = function() {
			var newValue = document.getElementById("standardCrsInputField").value;

			//TODO validate input

			$timeout(function() {
				if(newValue.length > 0) {
				
					var allRowsChbState = document.getElementById("standardCrsChb").checked;
					if (allRowsChbState) {
						// if checkbox is true update all rows
						$scope.batchList.forEach(function(value, index) {
							value.dataFormat.crs = newValue;
						});
					} else {
						// else only update empty rows
						$scope.batchList.forEach(function(value, index) {
							if (value.dataFormat.crs == undefined || value.dataFormat.crs == "") {
								value.dataFormat.crs = newValue;
							}
						});
					}
				}
			});

		}

	}
]});