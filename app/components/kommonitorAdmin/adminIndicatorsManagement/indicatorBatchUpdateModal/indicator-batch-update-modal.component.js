angular.module('indicatorBatchUpdateModal').component('indicatorBatchUpdateModal', {
	templateUrl : "components/kommonitorAdmin/adminIndicatorsManagement/indicatorBatchUpdateModal/indicator-batch-update-modal.template.html",
	controller : ['kommonitorDataExchangeService', 'kommonitorImporterHelperService', 'kommonitorBatchUpdateHelperService', '$scope', '$rootScope', '$http', '$timeout', '__env',
		function IndicatorBatchUpdateModalController(kommonitorDataExchangeService, kommonitorImporterHelperService, kommonitorBatchUpdateHelperService, $scope, $rootScope, $http, $timeout, __env) {
		
			this.kommonitorDataExchangeServiceInstance = kommonitorDataExchangeService;
			this.kommonitorImporterHelperServiceInstance = kommonitorImporterHelperService;
			this.kommonitorBatchUpdateHelperServiceInstance = kommonitorBatchUpdateHelperService;

			// initialize any adminLTE box widgets
			$('.box').boxWidget();
	
			$scope.isFirstStart = true;
			$scope.lastUpdateResponseObj;
			$scope.timeseriesMappingReference; // gets updated by a broadcast whenever $scope.timeseries mapping in indicatorEditTimeseriesMapping component changes
			$scope.selected = { value: kommonitorDataExchangeService.availableIndicators[0] };
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
			$scope.defaultTimeseriesMappingSave = [];
	
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
						kommonitorBatchUpdateHelperService.onMappingTableSelected("indicator", event, index, file, $scope.batchList);
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
	
				$scope.$digest();
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
	
					for(let i=0; i<newBatchList.length; i++) {
	
						kommonitorBatchUpdateHelperService.addNewRowToBatchList("indicator", $scope.batchList)
						var row = $scope.batchList[i];
	
						// isSelected
						row.isSelected = newBatchList[i].isSelected;
	
						// name
						// The exported batchList does not contain all of the metadata.
						// We have to use the indicatorId to select the corresponding select option in the "name" column.
						var indicatorId = newBatchList[i].name;
						var indicatorObj = kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);
						row.name = indicatorObj;
	
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
						// set selectedTargetSpatialUnit
						if(newBatchList[i].mappingObj.hasOwnProperty("targetSpatialUnitName"))
							row.selectedTargetSpatialUnit = kommonitorBatchUpdateHelperService.getSpatialUnitObjectByName(newBatchList[i].mappingObj.targetSpatialUnitName);
					}
				});

				kommonitorBatchUpdateHelperService.resizeNameColumnDropdowns(null);
			})
	
			/*
			// can be used to show only applicable spatial units for current indicator.
			$scope.filterApplicableSpatialUnits = function(batchIndex) {
				// avSpatialUnits is the list of available spatial units from the kommonitorDataExchangeService
				return function (avSpatialUnit) {
					// get spatial units for current indicator
					let isValidSpatialUnit = false;
					if($scope.batchList[batchIndex].name) {
						let applicableSpatialUnits = $scope.batchList[batchIndex].name.applicableSpatialUnits;
						for(let applicableSpatialUnit of applicableSpatialUnits) {
							if(avSpatialUnit.spatialUnitLevel === applicableSpatialUnit.spatialUnitName) {
								isValidSpatialUnit = true;
								break;
							}
						}
					} else {
						return true // don't filter anything if no indicator has been selected yet
					}
					if(isValidSpatialUnit)
						return true;
					else
						return false;
				};
			};
			*/

	
			$rootScope.$on("refreshIndicatorOverviewTableCompleted", function() {
				kommonitorBatchUpdateHelperService.refreshNameColumn("indicator", $scope.batchList)
			});

			
			$scope.onTimeseriesMappingBtnClicked = function($event) {
				$("#indicator-edit-time-series-mapping-modal").modal("show", $event.currentTarget);
			}

			$scope.onDefaultTimeseriesMappingBtnClicked = function($event) {
				$("#indicator-edit-default-time-series-mapping-modal").modal("show", $event.currentTarget);
			}

			$('#indicator-edit-time-series-mapping-modal').on('show.bs.modal', function (event) {
				
				// get indicator for which timeseries mapping was opended
				// use it to check the corresponding element in the batch list
				if(event.target.id === "indicator-edit-time-series-mapping-modal") {
					let index = kommonitorBatchUpdateHelperService.getIndexFromId(event.relatedTarget.id)
					$scope.timeseriesMappingModalOpenForIndex = index;
					let timeseriesMappingProp = $scope.batchList[index].mappingObj.propertyMapping.timeseriesMappings;
	
					if (timeseriesMappingProp && timeseriesMappingProp.length > 0)
						$scope.$broadcast('loadTimeseriesMapping', { mapping: timeseriesMappingProp});
					else
						$scope.$broadcast('resetTimeseriesMapping');
				}
				
			});

			$('#indicator-edit-default-time-series-mapping-modal').on('show.bs.modal', function (event) {
				if(event.target.id === "indicator-edit-default-time-series-mapping-modal") {
					if($scope.defaultTimeseriesMappingSave.length >= 1)
						$scope.$broadcast('loadTimeseriesMapping', { mapping: $scope.defaultTimeseriesMappingSave });
					else
						$scope.$broadcast('resetTimeseriesMapping');
				}
			});

			// on timeseries mapping modal closed
			$('#indicator-edit-time-series-mapping-modal').on('hidden.bs.modal', function (event) {
				if(event.target.id === "indicator-edit-time-series-mapping-modal") {
					// store timeseries mapping to mappingObj
					let index = $scope.timeseriesMappingModalOpenForIndex;
					// converting to json and back gets rid of the $$hashkey property
					$scope.batchList[index].mappingObj.propertyMapping.timeseriesMappings = angular.fromJson(angular.toJson($scope.timeseriesMappingReference));
					$scope.timeseriesMappingModalOpenForIndex = undefined;
					// then reset the modal
					//$scope.$broadcast('resetTimeseriesMapping')
				}
			});

			// on default timeseries mapping modal closed
			$('#indicator-edit-default-time-series-mapping-modal').on('hidden.bs.modal', function (event) {
				if(event.target.id === "indicator-edit-default-time-series-mapping-modal") {
					// store timeseries mapping to mappingObj
					$scope.defaultTimeseriesMappingSave = $scope.timeseriesMappingReference;
					// then reset the modal
					//$scope.$broadcast('resetTimeseriesMapping')
				}
			});


			$scope.$on("batchUpdateCompleted", function(event, data) {
				if(data.resourceType === "indicator") {
					$scope.lastUpdateResponseObj = data;
				}
			});


			$scope.reopenResultModal = function() {
				if (typeof $scope.lastUpdateResponseObj !== 'undefined') {
					$rootScope.$broadcast("reopenBatchUpdateResultModal", $scope.lastUpdateResponseObj);
				}
			}

			$rootScope.$on("timeseriesMappingChanged", function(event, data) {
				$scope.timeseriesMappingReference = data.mapping;
			});

			
		}
]});