angular.module('georesourceBatchUpdateModal').component('georesourceBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminGeoresourcesManagement/georesourceBatchUpdateModal/georesource-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorBatchUpdateHelperService', '$scope', '$rootScope', '$http', '$timeout', '__env',
		function GeoresourceBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorBatchUpdateHelperService, $scope, $rootScope, $http, $timeout, __env) {

			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
			this.kommonitorBatchUpdateHelperServiceInstance = kommonitorBatchUpdateHelperService;

			$scope.isFirstStart = true;
			$scope.lastUpdateResponseObj;
			$scope.keepMissingValues = true;

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
				
				$('#georesourceDefaultColumnDatePickerStart').datepicker(kommonitorDataExchangeService.datePickerOptions);
				$('#georesourceDefaultColumnDatePickerEnd').datepicker(kommonitorDataExchangeService.datePickerOptions);

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

				$scope.$digest();
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
						var georesourceObj = kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);
						row.name = georesourceObj;

						// mappingTableName
						row.mappingTableName = newBatchList[i].mappingTableName;
						// mappingObj
						row.mappingObj = newBatchList[i].mappingObj;
						// converter parameters to properties
						if(row.mappingObj.converter)
							row.mappingObj.converter = kommonitorBatchUpdateHelperService.converterParametersArrayToProperties(row.mappingObj.converter);
						// dataSource parameters to properties
						if(row.mappingObj.dataSource)
							row.mappingObj.dataSource = kommonitorBatchUpdateHelperService.dataSourceParametersArrayToProperty(row.mappingObj.dataSource);
						// set selectedConverter
						if(newBatchList[i].mappingObj.converter.hasOwnProperty("name"))
							row.selectedConverter = kommonitorBatchUpdateHelperService.getConverterObjectByName(newBatchList[i].mappingObj.converter.name);
						// set selectedDatasourceType
						if(newBatchList[i].mappingObj.dataSource.hasOwnProperty("type"))
							row.selectedDatasourceType = kommonitorBatchUpdateHelperService.getDatasourceTypeObjectByType(newBatchList[i].mappingObj.dataSource.type);
					}
				});

				kommonitorBatchUpdateHelperService.initializeGeoresourceDatepickerFields($scope.batchList);
				kommonitorBatchUpdateHelperService.resizeNameColumnDropdowns(null);
			})


			// loop through batch list and check if condition is true for at least one row
			$scope.checkIfSelectedConverterIsCsvLatLon = function() {
				var selectedConverterIsCsvLatLon = false;
				for(let i=0;i<$scope.batchList.length;i++) {
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
			

			$rootScope.$on("refreshGeoresourceOverviewTableCompleted", function() {
				kommonitorBatchUpdateHelperService.refreshNameColumn("georesource", $scope.batchList)
			});

			$scope.$on("batchUpdateCompleted", function(event, data) {
				if(data.resourceType === "georesource") {
					$scope.lastUpdateResponseObj = data
				}
			});

			$scope.reopenResultModal = function() {
				if (typeof $scope.lastUpdateResponseObj !== 'undefined') {
					$rootScope.$broadcast("reopenBatchUpdateResultModal", $scope.lastUpdateResponseObj);
				}
			}
		}

		
]});