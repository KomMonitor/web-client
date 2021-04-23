angular.module('reportingAddIndicatorModal').component('reportingAddIndicatorModal', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingAddIndicatorModal/reporting-add-indicator-modal.template.html",
	controller : ['kommonitorDataExchangeService', '$scope', '$rootScope', '__env', '$http', '$timeout', '$parse', function ReportingModalController(kommonitorDataExchangeService, $scope, $rootScope, __env, $http, $timeout, $parse) {

		$scope.loadingData = false;
		$scope.loadingConfig = false;

		$scope.allIndicatorsConfigSave = [];
		$scope.conf = undefined;

		$scope.indicator = undefined;
		$scope.selectedSpatialUnit = undefined;
		$scope.selectedSpatialUnitId = undefined;
		$scope.selectedAreas = undefined;
		$scope.selectedTimestamps = undefined;
		$scope.allAreasForSelectedSpatialUnitNames = [];
		$scope.elementMapIsChecked = false;
		$scope.elementMapLegendIsChecked = false;
		$scope.elementMapLegendIsDisabled = true;
		$scope.elementMapScaleIsChecked = false;
		$scope.elementMapScaleIsDisabled = true;
		$scope.elementDescriptionIsChecked = false;
		$scope.elementHistoryIsChecked = false;
		$scope.elementFeatureComparisonIsChecked = false;
		$scope.elementTimelineIsChecked = false;
		$scope.elementMetadataIsChecked = false;
		$scope.elementDataTableIsChecked = false;

		$scope.duallistAreasOptions = {};
		$scope.duallistAreasOptions["items"] = [];
		$scope.duallistTimestampsOptions= {};
		$scope.duallistTimestampsOptions["items"] = [];

		
		

		/**
		 * reset modal on close to make sure there are no leftovers the next time the modal is shown
		 * this code executes if the user ckicks the 'x' in the top right corner, too
		 */
		$('#reporting-add-indicator-modal').on('hidden.bs.modal', function () {
			resetModal();
		});


		/**
		 * trigger initialize modal
		 * if modal was opened to configure an indicator set up scope varaibles and ui
		 * @param event event that triggered the modal to open
		 * @param indicator indicator to add/configute
		 * @param conf configuration for an added indicator or undefined for new indicators
		 */
		$rootScope.$on('addIndicatorModalOpened', function(event, indicator, conf) {
			if(conf !== undefined) {
				$scope.conf = conf;
				$scope.loadingConfig = true;
			}
			$scope.initializeModal(indicator);
		});

		/**
		 * initialize
		 */
		$scope.initializeModal = function(indicator) {
			$scope.indicator = indicator;
			initializeDualLists();

			//$timeout without parameter waits for current digest cycle to finish.
			//this ensures that required DOM elements exist
			$timeout(function() {
				//if configuration exists load that configuration,
				//else set up a default state
				if($scope.conf !== undefined) {
					$scope.loadConfiguration();
				} else {
					$scope.loadDefaultState();
				}
			});
		};

		/**
		 * loads a configuration previously defined by the user 
		 */
		$scope.loadConfiguration = function() {
			// set variables
			setConfVariablesToScope();
			// we got the areas from the conf object, so there is no need to query the api
			// update dual lists
			$timeout( function() {

				//fill left side with all areas
				var dataArray = createDualListInputArray($scope.allAreasForSelectedSpatialUnitNames);
				$scope.duallistAreasOptions.items = dataArray;

				// move areas saved in conf (and now also in $scope) to right side
				$scope.duallistAreasOptions.selectedItems = $scope.selectedAreas;
				// remove those areas from left side
				// https://stackoverflow.com/questions/47017770/remove-array-of-objects-from-another-array-of-objects/47017949
				$scope.duallistAreasOptions.items = $scope.duallistAreasOptions.items.filter(
					function(unselectedItem) {
						return !$scope.duallistAreasOptions.selectedItems.find(
							function(selectedItem) {
								return unselectedItem.name === selectedItem.name;
							}
						);
					}
				);

				//fill left side with all timestamps
				var timestampsInput = createDualListInputArray($scope.indicator.applicableDates);
				$scope.duallistTimestampsOptions.items = timestampsInput;

				// move timestamps saved in conf (and now also in $scope) to right side
				$scope.duallistTimestampsOptions.selectedItems = $scope.selectedTimestamps;
				// remove those timestamps from left side
				$scope.duallistTimestampsOptions.items = $scope.duallistTimestampsOptions.items.filter(
					function(unselectedItem) {
						return !$scope.duallistTimestampsOptions.selectedItems.find(
							function(selectedItem) {
								return unselectedItem.name === selectedItem.name;
							}
						);
					}
				);
				$scope.loadingConfig = false;
			});
		};


		/**
		 * loads a default state
		 * all areas are selected
		 * if only one timestamp exists it is selected
		 */
		$scope.loadDefaultState = function() {
			//select last spatial unit

			$scope.selectedSpatialUnit = $scope.indicator.applicableSpatialUnits[0];

			//update areas
			$scope.updateAreas().then( () => {
				//move all areas to right side
				var $button = $('.duallistButton:eq(0)'); //first button of first dual list
				$button.click();
			});

			//fill left side with all timestamps
			var timestampsInput = createDualListInputArray($scope.indicator.applicableDates);
			$scope.duallistTimestampsOptions.items = timestampsInput;
			$scope.$digest();

			//if just one timestamp exists, move it to right side
			var $list = $('.unselected-items-list:eq(1) li a'); //all elements of second dual list left side
			if($list.length == 1) {
				var item = $list.get(0);
				item.click();
			}
		};

		/**
		 * Queries the DataManagement API to get the areas for the selected Spatial Unit.
		 */
		$scope.updateAreas = async function() {
			$scope.loadingData = true;

			// get indicator id
			var indicatorId = $scope.indicator.indicatorId;

			// get spatial unit id
			var spatialUnitId = undefined;
			$(kommonitorDataExchangeService.availableSpatialUnits).each( (id, obj) => {
				if (obj.spatialUnitId === $scope.selectedSpatialUnit.spatialUnitId) {
					spatialUnitId = obj.spatialUnitId;
					return false;
				}
			});

			if (spatialUnitId === undefined) {
				console.error("selectedSpatialUnit not found in indicator.applicableSpatialUnits");
			}

			$scope.selectedSpatialUnitId = spatialUnitId;
			// build request
			var url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
						"/indicators/" + indicatorId + "/" + spatialUnitId;
			// send request
			await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
					// this callback will be called asynchronously
					// when the response is available

					// add geoJSON property to indicator
					// by doing this now we don't need to query the data amangement api
					// again when adding the indicator
					$scope.indicator.geoJSON = response.data;
					
					//clear scope
					$scope.allAreasForSelectedSpatialUnitNames = [];

					//save to scope
					$(response.data.features).each( (id, obj) => {
						$scope.allAreasForSelectedSpatialUnitNames.push(obj.properties.NAME);
					});
					
					//clear dual list right side
					$scope.duallistAreasOptions.selectedItems = [];

					//update dual list
					var dataArray = createDualListInputArray($scope.allAreasForSelectedSpatialUnitNames);
					$scope.duallistAreasOptions.items = dataArray;

					$scope.loadingData = false;

				}, function errorCallback(error) {
					// called asynchronously if an error occurs
					// or server returns response with an error status.
					$scope.loadingData = false;
					kommonitorDataExchangeService.displayMapApplicationError(error);
					console.error(response.statusText);
			});
			
			
		};

		/**
		 * add indicator
		 */
		$scope.addIndicator = function() {
			//validateUserInput can return true, false or "noElementsSelected"
			var isValid = validateUserInput();

			if(isValid == false)
				return;

			if(isValid == "noElementsSelected") {
				if (!confirm("Kein(e) Element(e) ausgewählt. Indikator trotzdem hinzufügen?"))
					return;
				else
					//set isValid to true to continue
					isValid = true;
			}

			if(isValid) {

				//create configuration object
				var conf = createConfigurationObject();
				
				$scope.allIndicatorsConfigSave.push(conf);
				
				$rootScope.$broadcast("reportingIndicatorAdded", $scope.allIndicatorsConfigSave);

				//hide modal, triggers resetModal()
				$('#reporting-add-indicator-modal').modal('hide');
			}
		};

		/**
		 * saves changes
		 */
		$scope.saveChanges = function() {
			//validateUserInput can return true, false or "noElementsSelected"
			var isValid = validateUserInput();

			if(isValid == false)
				return;

			if(isValid == "noElementsSelected") {
				if (!confirm("Kein(e) Element(e) ausgewählt. Änderungen trotzdem übernehmen?"))
					return;
				else
					//set isValid to true to continue
					isValid = true;
			}

			if(isValid) {

				//create new configuration object
				var conf = createConfigurationObject();
				// replace the conf obj for this indicator by the new one
				var index = 0;
				for (index;index<$scope.allIndicatorsConfigSave.length;index++) {
					if($scope.allIndicatorsConfigSave[index].indicator.indicatorName === conf.indicator.indicatorName)
						break;
				}

				if($scope.allIndicatorsConfigSave[index]) {
					$scope.allIndicatorsConfigSave[index] = conf;
				} else {
					console.err("configuration not found in $scope.allIndicatorConfigurationSave");
					return;
				}
				$rootScope.$broadcast("reportingIndicatorModified", $scope.allIndicatorsConfigSave, index);

				//hide modal, triggers resetModal()
				$('#reporting-add-indicator-modal').modal('hide');
			}
		};
		
		/**
		 * initializes the two dual lists for area and timestamp selection
		 */
		function initializeDualLists() {
			$scope.selectedAreas = [];
			$scope.duallistAreasOptions = {
				label: 'Gebiete',
				boxItemsHeight: 'md',
				items: [],
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: []
			};
	
			
			$scope.selectedTimestamps = [];
			$scope.duallistTimestampsOptions = {
				label: 'Zeitpunkte',
				boxItemsHeight: 'md',
				items: [],
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: []
			};

		}
		
		/**
		 * adds a check mark inside the toggle when user activates it.
		 * removes the check mark again when user deactivates the toggle
		 */
		$scope.elementChbClicked = function($event) {
			var $this = $($event.currentTarget);
			if ($this[0].checked) {
				var $span = $($this[0].nextElementSibling);
				$span.html('&nbsp;&nbsp;<i class="fa fa-check" style="color:white;" aria-hidden="true"></i>');
			} else {
				var $span = $($this[0].nextElementSibling)
				$span.html('');
			}
			
			//manage legend and scale for map
			/*
			mapLegendChb = $("#reportingMapLegendCheckbox")[0]
			mapScaleChb = $("#reportingMapScaleCheckbox")[0]
			if ($this[0].id == "reportingMapCheckbox") {
				if($this[0].checked) {
					//check legend and scale state, add inner html, enable
					if (!mapLegendChb.checked) {
						$scope.elementMapLegendIsChecked = true;
						var span = mapLegendChb.nextElementSibling;
						span.innerHTML = '&nbsp;&nbsp;<i class="fa fa-check" style="color:white;" aria-hidden="true"></i>';
						$scope.elementMapLegendIsDisabled = false;
					}
					if (!mapScaleChb.checked) {
						$scope.elementMapScaleIsChecked = true;
						var span = mapScaleChb.nextElementSibling;
						span.innerHTML = '&nbsp;&nbsp;<i class="fa fa-check" style="color:white;" aria-hidden="true"></i>';
						$scope.elementMapScaleIsDisabled = false;
					}
				} else {
					//uncheck legend and scale state, remove inner html, disable 
					if (mapLegendChb.checked) {
						$scope.elementMapLegendIsChecked = false;
						var span = mapLegendChb.nextElementSibling
						span.innerHTML = '';
						$scope.elementMapLegendIsDisabled = true;
					}
					if (mapScaleChb.checked) {
						$scope.elementMapScaleIsChecked = false;
						var span = mapScaleChb.nextElementSibling
						span.innerHTML = '';
						$scope.elementMapScaleIsDisabled = true;
					}
				}
			}
			*/
		};

		/**
		 * creates an array of objects from an array of strings.
		 * each object in the result has the properties "category" and "name"
		 * 
		 * example:
		 * convert ["s1", "s2", ...]    ===>    [{category: "s1",name: "s1"}, {category: "s2", name: "s2"}, ...]
		 * @param {array} array 
		 */
		function createDualListInputArray(array) {
			var result = [];

			for (var i=0;i<array.length;i++) {
				var obj = {};
				obj["category"] = array[i];
				obj["name"] = array[i];
				result.push(obj);
			}
			return result;
		}

		/**
		 * resets the modal state back to the initial state.
		 * this is done by resetting scope variables.
		 */
		function resetModal() {
			$scope.loadingData = false;
			$scope.conf = undefined;

			$scope.indicator = undefined;
			$scope.selectedSpatialUnit = undefined;
			$scope.selectedAreas = undefined;
			$scope.selectedTimestamps = undefined;
			$scope.allAreasForSelectedSpatialUnitNames = [];

			$scope.duallistAreasOptions = {};
			$scope.duallistAreasOptions["items"] = [];
			$scope.duallistTimestampsOptions= {};
			$scope.duallistTimestampsOptions["items"] = [];

			$scope.elementMapIsChecked = true;
			$scope.elementMapLegendIsChecked = false;
			$scope.elementMapLegendIsDisabled = true;
			$scope.elementMapScaleIsChecked = false;
			$scope.elementMapScaleIsDisabled = true;
			$scope.elementDescriptionIsChecked = false;
			$scope.elementHistoryIsChecked = false;
			$scope.elementFeatureComparisonIsChecked = true;
			$scope.elementTimelineIsChecked = true;
			$scope.elementMetadataIsChecked = false;
			$scope.elementDataTableIsChecked = false;
		}

		/**
		 * checks if all options are set correctly by the user
		 * @returns true, false or "noElementsSelected"
		 */
		function validateUserInput() {
			//validate spatialUnit
			if($scope.selectedSpatialUnit == undefined) {
				alert("Keine Raumebene ausgewählt.");
				return false;
			}

			//validate areas
			if($scope.selectedAreas == undefined ||
				$scope.selectedAreas.length == 0) {
					alert("Kein(e) Gebiet(e) ausgewählt.");
					return false;
			}

			//validate timestamps
			if($scope.selectedTimestamps == undefined ||
				$scope.selectedTimestamps.length == 0) {
					alert("Kein(e) Zeitpunkt(e) ausgewählt.");
					return false;
			}

			//validate elements
			if(!($scope.elementMapIsChecked || $scope.elementDescriptionIsChecked ||
				$scope.elementHistoryIsChecked || $scope.elementFeatureComparisonIsChecked ||
				$scope.elementTimelineIsChecked || $scope.elementMetadataIsChecked ||
				$scope.elementDataTableIsChecked)) {
					return "noElementsSelected";
			}

			return true;
		}

		/**
		 * creates a configuration object that contains the state of scope variables
		 * @returns {obj} current configuration
		 */
		function createConfigurationObject() {
			var conf = {
				indicator: $scope.indicator,
				selectedSpatialUnit: $scope.selectedSpatialUnit,
				//areas are not really needed as they could be retrieved from the api again
				//but this allows to set them directly from the conf object later which should be faster.
				allAreasForSelectedSpatialUnitNames: $scope.allAreasForSelectedSpatialUnitNames,
				selectedAreas: $scope.selectedAreas,
				selectedTimestamps: $scope.selectedTimestamps,
				elementCheckboxes: {
					elementMapIsChecked: $scope.elementMapIsChecked,
					elementMapLegendIsChecked: $scope.elementMapLegendIsChecked,
					elementMapScaleIsChecked: $scope.elementMapScaleIsChecked,
					elementDescriptionIsChecked: $scope.elementDescriptionIsChecked,
					elementHistoryIsChecked: $scope.elementHistoryIsChecked,
					elementFeatureComparisonIsChecked: $scope.elementFeatureComparisonIsChecked,
					elementTimelineIsChecked: $scope.elementTimelineIsChecked,
					elementMetadataIsChecked: $scope.elementMetadataIsChecked,
					elementDataTableIsChecked: $scope.elementDataTableIsChecked
				},
				// the following properties are needed in the main modal after adding the indicator
				tiles: {},
				selectedSpatialUnitId: $scope.selectedSpatialUnitId
			};
			return conf;
		}

		/**
		 * uses the configuration saved in $scope.conf to update scope variables
		 */
		function setConfVariablesToScope() {
			var conf = $scope.conf;
			$scope.indicator = conf.indicator;
			$scope.selectedSpatialUnit = conf.selectedSpatialUnit;
			$scope.allAreasForSelectedSpatialUnitNames = conf.allAreasForSelectedSpatialUnitNames;
			$scope.selectedAreas = conf.selectedAreas;
			$scope.selectedTimestamps = conf.selectedTimestamps;
			angular.forEach(conf.elementCheckboxes, function (value, key) {
				$parse(key).assign($scope, value);
			});
		}

		$rootScope.$on("reportingIndicatorRemoved", function(event, indicatorId) {
			for (var i=$scope.allIndicatorsConfigSave.length-1;i>=0;i--) {
				if($scope.allIndicatorsConfigSave[i].indicator.indicatorId === indicatorId) {
					$scope.allIndicatorsConfigSave.splice(i,1);
				}
			}

		});

		$rootScope.$on("reportingResetModal", function() {
			$scope.allIndicatorsConfigSave = [];
		});
	}
]});
