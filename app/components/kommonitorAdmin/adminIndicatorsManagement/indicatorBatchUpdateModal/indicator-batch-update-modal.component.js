angular.module('indicatorBatchUpdateModal').component('indicatorBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorBatchUpdateModal/indicator-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorBatchUpdateHelperService', '$scope', '$rootScope', '$http', '$timeout', '__env',
		function IndicatorBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorBatchUpdateHelperService, $scope, $rootScope, $http, $timeout, __env) {
        
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
					timeseriesMappings: [
						{
						    "indicatorValueProperty": "string",
						    "timestamp": "date" // direct timestamp
						}, {
						    "indicatorValueProperty": "string",
						    "timestampProperty": "string"   // attribute column that contains timestamp(s)
						}],
					spatialReferenceKeyProperty: "",
                    keepMissingOrNullValueIndicator: true,
				},
				targetSpatialUnitName: ""
			}
			*/
			$scope.batchList = [];
			$scope.timeseriesMappingModalOpenForIndex; // temporarily stores for which index of the batch list the timeseries mapping modal is open
			
	
			// on modal opened
			$('#modal-batch-update-indicators').on('show.bs.modal', function () {
				// this check is necessary to avoid running the initialize method on opening datepicker modals
				if(event) {
					if(event.target.id === "button-batch-update-indicators") {
						$scope.initialize();
					}
				}
			});
	
			// initializes the modal
			$scope.initialize = function() {
	
				if($scope.isFirstStart) {
					kommonitorBatchUpdateHelperService.addNewRowToBatchList("indicator", $scope.batchList)
					$scope.isFirstStart = false;
				}
	
				$(document).on("change", ".indicatorMappingTableInputField", function(){
					// get index of changed field
					var index = kommonitorBatchUpdateHelperService.getIndexFromId(this.id);
					
					// get file
					var file = this.files[0];
	
					// read content
					var reader = new FileReader();
					reader.addEventListener('load', function(event) {
						kommonitorBatchUpdateHelperService.onMappingTableSelected(event, index, file, $scope.batchList);
					});
					reader.readAsText(file)
				});
	
				$(document).on("change", ".indicatorDataSourceFileInputField", function(){
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
			
			$scope.loadIndicatorsBatchList = function() {
				$("#indicatorsBatchListFile").files = [];
	
				// trigger file chooser
				$("#indicatorsBatchListFile").trigger("click");
			};
	
			$(document).on("change", "#indicatorsBatchListFile" ,function(){
				
				// get the file
				var file = document.getElementById('indicatorsBatchListFile').files[0];
				kommonitorBatchUpdateHelperService.parseBatchListFromFile("indicator", file, $scope.batchList)
			});
	
			$scope.$on('indicatorBatchListParsed', function(event, data) {
				$timeout(function() {
	
					var newBatchList = data.newValue;
	
					// remove all rows
					for (var i = 0; i < $scope.batchList.length; i++)
						$scope.batchList[i].isSelected = true;
					kommonitorBatchUpdateHelperService.deleteSelectedRowsFromBatchList($scope.batchList, $scope.allRowsSelected);
	
					
					for(let i=0;i<newBatchList.length;i++) {
	
						kommonitorBatchUpdateHelperService.addNewRowToBatchList("indicator", $scope.batchList)
						var row = $scope.batchList[i];
	
						// isSelected
						row.isSelected = newBatchList[i].isSelected;
	
						// name
						// The exported batchList does not contain all of the metadata.
						// We have to use the indicatorId to select the corresponding select option in the "name" column.
						var indicatorId = newBatchList[i].name;
						var indicatorObj = kommonitorBatchUpdateHelperService.getIndicatorObjectById(indicatorId);
						row.name = indicatorObj;
	
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
			$scope.checkIfSelectedConverterIsCsvOnlyIndicator = function() {
				var selectedConverterIsCsvOnlyIndicator = false;
				for(var i=0;i<$scope.batchList.length;i++) {
					if($scope.batchList[i].selectedConverter) {
						let converterName = $scope.batchList[i].selectedConverter.name;
						if(converterName != undefined && converterName.length > 0) {
							if(converterName.includes("csvOnlyIndicator")) {
								selectedConverterIsCsvOnlyIndicator = true;
								break;
							}
						}
					}
				}
				return selectedConverterIsCsvOnlyIndicator;
			}


			/**
			 * Filters indicators that are already present in the batch list so that they can't be added twice.
			 * https://stackoverflow.com/questions/11753321/passing-arguments-to-angularjs-filters/17813797
			 * 
			 * batchIndex: index of the row where the dropdown menu was opened
			 */
			//TODO refactor to batch-update-helper-service
			$scope.filterIndicatorsInBatchList = function(batchIndex) {
	
				// avIndicators is the list of available indicators from the kommonitorDataExchangeService
				return function (avIndicators) {
					// check if georesource is in batchList
					var isInBatchList = false;
					for(var i=0;i<$scope.batchList.length;i++) {
						if($scope.batchList[i].name) {
							if($scope.batchList[i].name.indicatorId == avIndicators.indicatorId && i != batchIndex) {
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

	
			//TODO refractor to batch-update-helper-service
			$scope.onClickSaveStandardCRS = function() {
	
				var newValue = document.getElementById("indicatorStandardCrsInputField").value;
	
				$timeout(function() {
					if(newValue.length > 0) {
						$scope.batchList.forEach(function(row, index) {
							// never change disabled fields
							var field = angular.element(document.getElementById("indicatorCrsInputField" + index));
							if(field.prop('disabled'))
								return;
	
							var allRowsChbState = document.getElementById("indicatorStandardCrsChb").checked;
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
			
	
			$rootScope.$on("refreshIndicatorOverviewTableCompleted", function() {
				for(let i=0;i<$scope.batchList.length;i++) {
					var row = $scope.batchList[i];
					if(row.tempIndicatorId) {
						var indicator = kommonitorBatchUpdateHelperService.getIndicatorObjectById(row.tempIndicatorId);
						row.name = indicator;
					}
				}
			})
	

			
	
			// only close the result modal instead of all modals
			//$("#modal-batch-update-result-close-btn").on("click", function() {
			//	$("#modal-batch-update-result").modal("hide");
			//});

			$scope.onTimeseriesMappingBtnClicked = function($event) {
				$("#indicator-edit-time-series-mapping-modal").modal("show", $event.currentTarget);
			}

			$('#indicator-edit-time-series-mapping-modal').on('show.bs.modal', function (event) {
				
				// get indicator for which timeseries mapping was opended
				// use it to check the corresponding element in the batch list
				let index = kommonitorBatchUpdateHelperService.getIndexFromId(event.relatedTarget.id)
				$scope.timeseriesMappingModalOpenForIndex = index;
				let timeseriesMappingProp = $scope.batchList[index].mappingObj.propertyMapping.timeseriesMappings;

				if (timeseriesMappingProp && timeseriesMappingProp.length > 0)
					$scope.$broadcast('loadTimeseriesMapping', { mapping: timeseriesMappingProp});
				else
					$scope.$broadcast('resetTimeseriesMapping');
			});

			// on timeseries mapping modal closed
			$('#indicator-edit-time-series-mapping-modal').on('hidden.bs.modal', function () {
				// store timeseries mapping to mappingObj
				// adds a variable timeseriesMappingBackup to $scope that holds a reference to the timeseries mapping
				$scope.$broadcast('getTimeseriesMapping', { varname: "timeseriesMappingBackup"});
				let index = $scope.timeseriesMappingModalOpenForIndex;
				// converting to json and back gets rid of the $$hashkey property
				$scope.batchList[index].mappingObj.propertyMapping.timeseriesMappings = angular.fromJson(angular.toJson($scope.timeseriesMappingBackup));
				delete $scope.timeseriesMappingBackup;
				
				$scope.timeseriesMappingModalOpenForIndex = undefined;
				// then reset the modal
				$scope.$broadcast('resetTimeseriesMapping')
			});
			
		}
]});