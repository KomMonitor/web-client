angular.module('georesourceBatchUpdateModal').component('georesourceBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorBatchUpdateHelperService', '$scope', '$rootScope', '$http', '$timeout', '__env',
		function GeoresourceModalBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorBatchUpdateHelperService, $scope, $rootScope, $http, $timeout, __env) {

		this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
		this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
		this.kommonitorBatchUpdateHelperServiceInstance = kommonitorBatchUpdateHelperService;

		//$scope.standardPeriodOfValidityStart; // period of validity start for all georessources
		//$scope.standardCrs;
		//$scope.allRowsSelected = false
		//$scope.standardPeriodOfValidityStartChb = false;
		//$scope.standardCrsChb = false;


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

		$('#georesourceBatchUpdateFeedbackModal').on('show.bs.modal', function () {
			console.log(this);
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
					$scope.onMappingTableSelected(event, index, file);
				});
				reader.readAsText(file)
			});

			$scope.$apply();
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

					// converter prarameters to properties
					row.mappingObj.converter = kommonitorBatchUpdateHelperService.converterParametersArrayToProperties(row.mappingObj.converter);

					// dataSource parameters to properties
					row.mappingObj.dataSource = kommonitorBatchUpdateHelperService.dataSourceParametersArrayToProperty(row.mappingObj.dataSource);

					// set selectedConverter
					row.selectedConverter = kommonitorBatchUpdateHelperService.getConverterObjectByName(newBatchList[i].mappingObj.converter.name);

					// set selectedDatasourceType
					row.selectedDatasourceType = kommonitorBatchUpdateHelperService.getDatasourceTypeObjectByType(newBatchList[i].mappingObj.dataSource.type);

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
			// TODO remove this
			$rootScope.$broadcast("georesourceBatchUpdateCompleted");
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
				if($scope.batchList[i].mappingTableName != "") {
					mappingTableIsSpecified = true;
					break;
				}
			}
			return mappingTableIsSpecified;
			
		}

		// loop through batch list and check if condition is true for at least one row
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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
		// TODO move to kommonitorBatchUpdateHelperService if appropriate
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

		// saves the current values of this row to the previously selected mapping file
		$scope.onMappingTableSaveClicked = function($event) {
			
			var rowIndex = kommonitorBatchUpdateHelperService.getIndexFromId($event.currentTarget.id);
			var row = $scope.batchList[rowIndex];

			var objToExport = $.extend({}, row.mappingObj);

			objToExport.converter = kommonitorBatchUpdateHelperService.converterPropertiesToParametersArray(objToExport.converter)
			objToExport.dataSource = kommonitorBatchUpdateHelperService.dataSourcePropertyToParametersArray(objToExport.dataSource)

			// selected converter and DatasouceType might have changed.
			// rebuild the corresponding definitions and insert parameter values
			objToExport.converter = kommonitorBatchUpdateHelperService.buildConverterDefinition(row.selectedConverter, objToExport.converter);
			objToExport.dataSource = kommonitorBatchUpdateHelperService.buildDataSourceDefinition(row.selectedDatasourceType, objToExport.dataSource)

			// save to file
			kommonitorBatchUpdateHelperService.saveMappingObjectToFile(objToExport);
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

			var newValue = document.getElementById("standardCrsInputField").value;

			$timeout(function() {
				if(newValue.length > 0) {
					$scope.batchList.forEach(function(row, index) {
						// never change disabled fields
						var field = angular.element(document.getElementById("crsInputField" + index));
						if(field.prop('disabled'))
							return;

						var allRowsChbState = document.getElementById("standardCrsChb").checked;
						if (allRowsChbState) {
							// if checkbox is true update all rows
							row.mappingObj.converter.CRS.value = newValue;
						} else {
							// else only update empty rows
							if (row.mappingObj.converter.CRS.value == undefined || row.mappingObj.converter.CRS.value == "")
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

			//apply to scope
			$timeout(function() {
				$scope.batchList[rowIndex].mappingObj = mappingObj;
			});
		}

		/*$rootScope.$on("refreshGeoresourceOverviewTableCompleted", function() {
			for(let i=0;i<$scope.batchList.length;i++) {
				var row = $scope.batchList[i];
				console.log(row.tempGeoresourceId);
				if(row.tempGeoresourceId) {
					var georesource = kommonitorBatchUpdateHelperService.getGeoresourceObjectById(row.tempGeoresourceId);
					row.name = georesource;
					delete row.tempGeoresourceId;
				}
			}
		})*/

		$rootScope.$on("georesourceBatchUpdateCompleted", function(event, data) {
			$("#georesource-batch-update-result-modal").modal("show");

			var responses = data.value;
			// populate table
			for(var i=0;i<responses.length;i++) {
				const response = responses[i];

				var tableRow = document.createElement("tr");
				var td1 = document.createElement("td");
				var td2 = document.createElement("td");
				
				td1.classList.add("georesource-result-georesource-name")
				td1.innerHTML = response.name;

				if(response.status == "success") {
					td2.classList.add("georesource-result-success");
					var successBtn = document.createElement("button");
					successBtn.classList.add("btn", "btn-success");
					successBtn.type = "button";
					successBtn.innerHTML = "Erfolg";

					td2.appendChild(successBtn);
				}
				if(response.status == "error") {
					td2.classList.add("georesource-result-error");

					var errorMsgDiv = document.createElement("div");
					errorMsgDiv.classList.add("card", "card-body", "georesource-result-error-message"+i);
					errorMsgDiv.innerHTML = response.message;

					var collapseDiv = document.createElement("div");
					collapseDiv.classList.add("collapse");
					collapseDiv.id = "georesource-result-error-collapse" + i;
					collapseDiv.appendChild(errorMsgDiv);
					
					var errorBtn = document.createElement("button");
					errorBtn.classList.add("btn", "btn-danger");
					errorBtn.type = "button";
					$(errorBtn).attr("data-toggle", "collapse");
					$(errorBtn).attr("data-target", "#georesource-result-error-collapse" + i);
					$(errorBtn).attr("aria-expanded", "false");
					$(errorBtn).attr("aria-controls", "georesource-result-error-collapse" + i)
					errorBtn.innerHTML = "Fehler";
					insertAfter(errorBtn, collapseDiv);
				}

				tableRow.appendChild(td1);
				tableRow.appendChild(td2);
				document.getElementById("georesource-result-table-tbody").appendChild(tableRow);
			}

			function insertAfter(referenceNode, newNode) {
				referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
			}
		});

		// only close the result modal instead of all modals
		$("#georesource-batch-update-result-modal-close-btn").on("click", function() {
			$("#georesource-batch-update-result-modal").modal("hide");
		});
		
	}
]});