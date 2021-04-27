angular.module('georesourceBatchUpdateModal').component('georesourceBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorBatchUpdateHelperService', '$scope', '$rootScope', '$http', '$timeout', '__env',
		function GeoresourceBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorBatchUpdateHelperService, $scope, $rootScope, $http, $timeout, __env) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
			this.kommonitorBatchUpdateHelperServiceInstance = kommonitorBatchUpdateHelperService;

			$scope.isFirstStart = true;

			/*
			{
				"converter": {
					"encoding": "string",
					"mimeType": "string",
					"name": "string",
					"parameters": [{
						"name": "string",
						"value": "string"
					}],
					"schema": "string"
				},
				"dataSource": {
					"parameters": [{
						"name": "string",
						"value": "string"
					}],
					"type": "FILE" // FILE|HTTP|INLINE
				},
				"propertyMapping": {
					"arisenFromProperty": "string",
					"attributes": [{
						"mappingName": "string", // target name
						"name": "string", // source name
						"type": "string" // dataType, [string|integer|float|date]
					}],
					"identifierProperty": "string",
					"keepAttributes": true, // if true, then mapping under attributes is ignored and all attributes are imported with the same attribute name
					"nameProperty": "string",
					"validEndDateProperty": "string",
					"validStartDateProperty": "string"
				},
				"periodOfValidity": {
					"startDate": "yyyy-mm-tt",
					"endDate": "yyyy-mm-tt"
				}
			}
			*/
			$scope.batchList = [];
			

			// on modal opened
			$('#modal-batch-update-georesources').on('show.bs.modal', function () {
				// this check is necessary to avoid running the initialize method on opening datepicker modals
				if(event) {
					if(event.target.id === "button-batch-update-georesources") {
						$scope.initialize();
					}
				}
			});

			// initializes the modal
			$scope.initialize = function() {

				if($scope.isFirstStart) {
					kommonitorBatchUpdateHelperService.addNewRowToBatchList("georesource", $scope.batchList)
					$scope.isFirstStart = false;
				}
				
				$('#standardPeriodOfValidityStartDatePicker').datepicker(kommonitorDataExchangeService.datePickerOptions);

				$(document).delegate(".mappingTableInputField", "change", function(){
					// get index of changed field
					var index = kommonitorBatchUpdateHelperService.getIndexFromId(this.id);
					
					// get file
					var file = this.files[0];

					// read content
					var reader = new FileReader();
					reader.addEventListener('load', function(event) {
						$scope.onMappingTableSelected(event, index, file);
					});
					reader.readAsText(file)
				});

				$(document).delegate(".georesourceDataSourceFileInputField", "change", function(){
					// get index of changed field
					var index = kommonitorBatchUpdateHelperService.getIndexFromId(this.id);
					
					// get file
					var file = this.files[0];

					// read content
					var reader = new FileReader();
					reader.addEventListener('load', function(event) {
						$scope.onDataSourceFileSelected(event, index, file);
					});
					reader.readAsText(file)
				});

				$scope.$apply();
			};

			$scope.loadGeoresourcesBatchList = function() {
				$("#georesourcesBatchListFile").files = [];

				// trigger file chooser
				$("#georesourcesBatchListFile").trigger("click");
			};

			$(document).on("change", "#georesourcesBatchListFile" ,function(){
				
				// get the file
				var file = document.getElementById('georesourcesBatchListFile').files[0];
				kommonitorBatchUpdateHelperService.parseBatchListFromFile("georesource", file, $scope.batchList)
			});

			$scope.$on('georesourceBatchListParsed', function(event, data) {
				$timeout(function() {

					var newBatchList = data.newValue;

					// remove all rows
					for (var i = 0; i < $scope.batchList.length; i++)
						$scope.batchList[i].isSelected = true;
					kommonitorBatchUpdateHelperService.deleteSelectedRowsFromBatchList($scope.batchList, $scope.allRowsSelected);

					
					for(let i=0;i<newBatchList.length;i++) {

						kommonitorBatchUpdateHelperService.addNewRowToBatchList("georesource", $scope.batchList)
						var row = $scope.batchList[i];

						// isSelected
						row.isSelected = newBatchList[i].isSelected;

						// name
						// The exported batchList does not contain all of the metadata.
						// We have to use the georesourceId to select the corresponding select option in the "name" column.
						var georesourceId = newBatchList[i].name;
						var georesourceObj = kommonitorBatchUpdateHelperService.getGeoresourceObjectById(georesourceId);
						row.name = georesourceObj;

						// mappingTableName
						row.mappingTableName = newBatchList[i].mappingTableName;
						// mappingObj
						row.mappingObj = newBatchList[i].mappingObj;
						// converter parameters to properties
						row.mappingObj.converter = kommonitorBatchUpdateHelperService.converterParametersArrayToProperties(row.mappingObj.converter);
						// dataSource parameters to properties
						row.mappingObj.dataSource = kommonitorBatchUpdateHelperService.dataSourceParametersArrayToProperty(row.mappingObj.dataSource);
						// set selectedConverter
						row.selectedConverter = kommonitorBatchUpdateHelperService.getConverterObjectByName(newBatchList[i].mappingObj.converter.name);
						// set selectedDatasourceType
						row.selectedDatasourceType = kommonitorBatchUpdateHelperService.getDatasourceTypeObjectByType(newBatchList[i].mappingObj.dataSource.type);
					}
				});
			})




			// loop through batch list and check if condition is true for at least one row
			$scope.checkIfMappingTableIsSpecified = function() {
				var mappingTableIsSpecified = false;
				for(var i=0;i<$scope.batchList.length;i++) {
					if($scope.batchList[i].mappingTableName != "") {
						mappingTableIsSpecified = true;
						break;
					}
				}
				return mappingTableIsSpecified;
				
			}

			// loop through batch list and check if condition is true for at least one row
			$scope.checkIfSelectedConverterIsCsvLatLon = function() {
				var selectedConverterIsCsvLatLon = false;
				for(var i=0;i<$scope.batchList.length;i++) {
					if($scope.batchList[i].selectedConverter) {
						let converterName = $scope.batchList[i].selectedConverter.name;
						if(converterName != undefined && converterName.length > 0) {
							if(converterName.includes("csvLatLon")) {
								selectedConverterIsCsvLatLon = true;
								break;
							}
						}
					}
				}
				return selectedConverterIsCsvLatLon;
			}

			// loop through batch list and check if condition is true for at least one row
			$scope.checkIfSelectedConverterIsWfsV1 = function() {
				var selectedConverterIsWfsV1 = false;
				for (var i = 0; i < $scope.batchList.length; i++) {
					if ($scope.batchList[i].selectedConverter) {
						let converterName = $scope.batchList[i].selectedConverter.name;
						if (converterName != undefined && converterName.length > 0) {
							if (converterName.includes("wfs.v1")) {
								selectedConverterIsWfsV1 = true;
								break;
							}
						}
					}
				}
				return selectedConverterIsWfsV1;
			}
			
			// loop through batch list and check if condition is true for at least one row
			$scope.checkIfSelectedDatasourceTypeIsFile = function() {
				var selectedDatasourceTypeIsFile = false;
				for (var i = 0; i < $scope.batchList.length; i++) {
					if ($scope.batchList[i].selectedDatasourceType) {
						let datasourceType = $scope.batchList[i].selectedDatasourceType.type;
						if (datasourceType != undefined && datasourceType.length > 0) {
							if (datasourceType == "FILE") {
								selectedDatasourceTypeIsFile = true;
								break;
							}
						}
					}
				}
				return selectedDatasourceTypeIsFile;
			}

			// loop through batch list and check if condition is true for at least one row
			$scope.checkIfSelectedDatasourceTypeIsHttp = function() {
				var selectedDatasourceTypeIsHttp = false;
				for (var i = 0; i < $scope.batchList.length; i++) {
					if ($scope.batchList[i].selectedDatasourceType) {
						let datasourceType = $scope.batchList[i].selectedDatasourceType.type;
						if (datasourceType != undefined && datasourceType.length > 0) {
							if (datasourceType == "HTTP") {
								selectedDatasourceTypeIsHttp = true;
								break;
							}
						}
					}
				}
				return selectedDatasourceTypeIsHttp;
			}

			// loop through batch list and check if condition is true for at least one row
			$scope.checkIfSelectedDatasourceTypeIsInline = function() {
				var selectedDatasourceTypeIsInline = false;
				for (var i = 0; i < $scope.batchList.length; i++) {
					if ($scope.batchList[i].selectedDatasourceType) {
						let datasourceType = $scope.batchList[i].selectedDatasourceType.type;
						if (datasourceType != undefined && datasourceType.length > 0) {
							if (datasourceType == "INLINE") {
								selectedDatasourceTypeIsInline = true;
								break;
							}
						}
					}
				}
				return selectedDatasourceTypeIsInline;
			}

			$scope.checkIfNameAndFilesChosenInEachRow = function() {

				var updateBtn = document.getElementById("georesource-batch-update-btn");
				updateBtn.title = "Update starten"
				
				if($scope.batchList.length == 0) {
					updateBtn.title = "Die Batch-Liste is leer."
					return false;
				}

				for(var i=0;i<$scope.batchList.length;i++) {

					if($scope.batchList[i].name == undefined || $scope.batchList[i].name == "") {
						updateBtn.title = "Die Spalte Name* ist nicht für alle Zeilen gesetzt."
						return false;
					}

					let mappingTableName = $scope.batchList[i].mappingTableName;
					if(mappingTableName == undefined || mappingTableName == "") {
						updateBtn.title = "Die Spalte Mappingtabelle ist nicht für alle Zeilen gesetzt."
						return false;
					}
						

					if ($scope.batchList[i].selectedDatasourceType) {
						let datasourceType = $scope.batchList[i].selectedDatasourceType.type;
						if (datasourceType != undefined && datasourceType.length > 0) {

							if (datasourceType == "FILE") {
								if($scope.batchList[i].mappingObj.dataSource.NAME) {
									let value = $scope.batchList[i].mappingObj.dataSource.NAME.value;
									if(value == undefined || value == "") {
										updateBtn.title = "Die Spalte Datei* ist nicht für alle Zeilen gesetzt, in denen die Spalte Datenquelltyp* auf FILE gesetzt ist."
										return false;
									}
								}
							}
						}
					}
				}

				return true;
			}

			/**
			 * Filters georesources that are already present in the batch list so that they can't be added twice.
			 * https://stackoverflow.com/questions/11753321/passing-arguments-to-angularjs-filters/17813797
			 * 
			 * batchIndex: index of the row where the dropdown menu was opened
			 */
			$scope.filterGeoresourcesInBatchList = function(batchIndex) {

				// avGeoresources is the list of available georesources from the kommonitorDataExchangeService
				return function (avGeoresources) {
					// check if georesource is in batchList
					var isInBatchList = false;
					for(var i=0;i<$scope.batchList.length;i++) {
						if($scope.batchList[i].name) {
							if($scope.batchList[i].name.georesourceId == avGeoresources.georesourceId && i != batchIndex) {
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

			// saves the current values of this row to the previously selected mapping file
			$scope.onMappingTableSaveClicked = function($event) {
				kommonitorBatchUpdateHelperService.saveMappingObjectToFile("georesource", $event, $scope.batchList);
			};

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
						$scope.batchList.forEach(function(row, index) {
							// never change disabled fields
							var field = angular.element(document.getElementById("periodOfValidityStartDatePicker" + index));
							if(field.prop('disabled'))
								return;

							if (allRowsChbState) {
								// if checkbox is true update all rows
								row.mappingObj.periodOfValidity.startDate = newValue;
							} else {
							// else only update empty rows
								if (row.mappingObj.periodOfValidity.startDate == undefined || row.mappingObj.periodOfValidity.startDate == "")
									row.mappingObj.periodOfValidity.startDate = newValue;
							}
						});
					}
				});
			}

			$scope.onClickSaveStandardCRS = function() {

				var newValue = document.getElementById("georesourceStandardCrsInputField").value;

				$timeout(function() {
					if(newValue.length > 0) {
						$scope.batchList.forEach(function(row, index) {
							// never change disabled fields
							var field = angular.element(document.getElementById("georesourceCrsInputField" + index));
							if(field.prop('disabled'))
								return;

							var allRowsChbState = document.getElementById("georesourceStandardCrsChb").checked;
							if (allRowsChbState) {
								// if checkbox is true update all rows
								row.mappingObj.converter.CRS.value = newValue;
							} else {
								// else only update empty rows
								if (row.mappingObj.converter.CRS.value === undefined || row.mappingObj.converter.CRS.value === "")
									row.mappingObj.converter.CRS.value = newValue;
							}
						});
					}
				});
			}

			$scope.onMappingTableSelected = function(event, rowIndex, file) {

				$scope.batchList[rowIndex].mappingTableName = file.name;

				var mappingObj = JSON.parse(event.target.result);
				mappingObj.converter = kommonitorBatchUpdateHelperService.converterParametersArrayToProperties(mappingObj.converter);
				mappingObj.dataSource = kommonitorBatchUpdateHelperService.dataSourceParametersArrayToProperty(mappingObj.dataSource);

				// set value of column "Geodaten-Quellformat*" by converter name
				var converterName = mappingObj.converter.name
				for(let i=0; i<kommonitorImporterHelperService.availableConverters.length;i++) {
					let avConverterName = kommonitorImporterHelperService.availableConverters[i].name
					if(converterName == avConverterName) {
						$timeout(function() {
							$scope.batchList[rowIndex].selectedConverter = kommonitorImporterHelperService.availableConverters[i];
						});
						break;
					}
				}

				// set value of column "Datenquelltyp*" by dataSource type
				var dataSourceType = mappingObj.dataSource.type;
				for(let i=0;i<kommonitorImporterHelperService.availableDatasourceTypes.length;i++) {
					let avDataSourceType = kommonitorImporterHelperService.availableDatasourceTypes[i].type
					if(dataSourceType == avDataSourceType) {
						$timeout(function() {
							$scope.batchList[rowIndex].selectedDatasourceType = kommonitorImporterHelperService.availableDatasourceTypes[i];
						});
						break;
					}
				}

				// do not import file name
				if(mappingObj.dataSource.type == "FILE") {
					mappingObj.dataSource.NAME.value = "";
				}

				//apply to scope
				$timeout(function() {
					$scope.batchList[rowIndex].mappingObj = mappingObj;
				});
			}

			$scope.onDataSourceFileSelected = function(event, rowIndex, file) {
				// set filename manually
				var name = file.name;

				$timeout(function() {
					$scope.batchList[rowIndex].mappingObj.dataSource.NAME.value = name;
				});
			}

			$rootScope.$on("refreshGeoresourceOverviewTableCompleted", function() {
				for(let i=0;i<$scope.batchList.length;i++) {
					var row = $scope.batchList[i];
					if(row.tempGeoresourceId) {
						var georesource = kommonitorBatchUpdateHelperService.getGeoresourceObjectById(row.tempGeoresourceId);
						row.name = georesource;
					}
				}
			})

			// only close the result modal instead of all modals
			//$("#modal-batch-update-result-close-btn").on("click", function() {
			//	$("#modal-batch-update-result").modal("hide");
			//});
		}
]});