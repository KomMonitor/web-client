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

				$(document).on("change", ".georesourceMappingTableInputField", function(){
					// get index of changed field
					var index = kommonitorBatchUpdateHelperService.getIndexFromId(this.id);
					
					// get file
					var file = this.files[0];

					// read content
					var reader = new FileReader();
					reader.addEventListener('load', function(event) {
						kommonitorBatchUpdateHelperService.onMappingTableSelected("georesource", event, index, file, $scope.batchList);
					});
					reader.readAsText(file)
				});

				$(document).on("change", ".georesourceDataSourceFileInputField", function(){
					// get index of changed field
					var index = kommonitorBatchUpdateHelperService.getIndexFromId(this.id);
					
					// get file
					var file = this.files[0];

					// read content
					var reader = new FileReader();
					reader.addEventListener('load', function() {
						kommonitorBatchUpdateHelperService.onDataSourceFileSelected(file, index, $scope.batchList);
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