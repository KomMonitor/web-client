angular.module('reportingIndicatorAdd').component('reportingIndicatorAdd', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingIndicatorAdd/reporting-indicator-add.template.html",
	controller : ['$scope', '$http', '$timeout', '__env', 'kommonitorDataExchangeService',
    function ReportingIndicatorAddController($scope, $http, $timeout, __env, kommonitorDataExchangeService) {

		$scope.template = undefined;

		$scope.indicatorNameFilter = "";
		$scope.availableIndicators = [];
		$scope.selectedIndicator = undefined;

		$scope.availableFeatures = {};
		$scope.selectedSpatialUnit = undefined;
		$scope.selectedAreas = [];
		$scope.selectedSpatialUnitsMultiselect = undefined

		$scope.selectedTimestamps = [];

		$scope.pageContent = {
			map: true,
			boxplot: true,
			diagram1: true,
			diagram2: true
		}
		
		$scope.loadingData = false;
		
		// internal array changes do not work with ng-change
		$scope.$watchCollection('selectedAreas', function() {
			let tab3 = document.querySelector("#reporting-add-indicator-tab3");
			// enable tab only if at least one area is selected after change
			if($scope.selectedAreas.length) {
				$scope.enableTab(tab3);
			} else {
				// if the last area was deselected
				$scope.disableTab(tab3);
			}
		});

		// internal array changes do not work with ng-change
		$scope.$watchCollection('selectedTimestamps', function() {
			let tab4 = document.querySelector("#reporting-add-indicator-tab4");

			if($scope.selectedTimestamps.length) {
				$scope.enableTab(tab4);
			} else {
				// if the last area was deselected
				$scope.disableTab(tab4);
			}
		});

		$scope.$on("configureNewIndicatorShown", function(event, data) {
			$scope.template = data;
			let tabPanes = document.querySelectorAll("#reporting-add-indicator-tab-content > .tab-pane")

			for(let i=1;i<5;i++) {
				let tab = document.getElementById("reporting-add-indicator-tab" + i);
				
				if(i==1) {
					tab.classList.add("active");
					tabPanes[i-1].classList.add("active");
				} else {
					tab.classList.remove("active");
					tabPanes[i-1].classList.remove("active");
				}
				
			}

			$scope.initializeDualLists();
			
			$scope.queryIndicators();
		});

		$scope.initializeDualLists = function() {
			$scope.duallistAreasOptions = {
				label: 'Bereiche',
				boxItemsHeight: 'md',
				items: [],
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: []
			};

			$scope.duallistTimestampsOptions = {
				label: 'Zeitpunkte',
				boxItemsHeight: 'md',
				items: [],
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: []
			};

			$scope.duallistSpatialUnitsOptions = {
				label: 'Raumebenen',
				boxItemsHeight: 'md',
				items: [],
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: []
			};
		}

		/**
		 * Queries DataManagement API to get all available indicators
		 */
		$scope.queryIndicators = async function() {
			$scope.loadingData = true;

			// build request
			// query public endpoint for now, this might change once user role administration is added to reporting
			let url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators"
			
			// send request
			$http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
					// save to scope
					$scope.availableIndicators = response.data;
					$scope.loadingData = false;
					
				}, function errorCallback(error) {
					$scope.loadingData = false;
					kommonitorDataExchangeService.displayMapApplicationError(error);
					console.error(response.statusText);
			});
		};

		/**
		 * Updates the areas dual list.
		 * Queries DataManagement API if needed.
		 */
		$scope.updateAreas = async function() {
			let indicator = $scope.selectedIndicator;
			let spatialUnit = $scope.selectedSpatialUnit
			let indicatorId = indicator.indicatorId;
			let spatialUnitId = spatialUnit.spatialUnitId;

			if ($scope.availableFeatures[spatialUnit.spatialUnitName]) {
				// no need to query api
				$scope.updateDualList($scope.duallistAreasOptions, $scope.availableFeatures[spatialUnit.spatialUnitName])
			} else {
				let data = await $scope.queryFeatures(indicatorId, spatialUnitId)

				// save response to scope to avoid further requests
				$scope.availableFeatures[spatialUnit.spatialUnitName] = data.features

				$scope.updateDualList($scope.duallistAreasOptions, data.features)
				$timeout(function() {
					$scope.$apply();
				})
			}
		}

		/**
		 * Queries DataManagement API to get features of gi for given indicato
		 * Result is stored to scope to avoid further requests.
		 * @param {*} indicator | selected indicator
		 */
		 $scope.queryFeatures = async function(indicatorId, spatialUnitId) {
			// build request
			let url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
			"/indicators/" + indicatorId + "/" + spatialUnitId;
			// send request
			$scope.loadingData = true;
			return await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
				$scope.loadingData = false;
				return response.data;
			}, function errorCallback(error) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				$scope.loadingData = false;
				kommonitorDataExchangeService.displayMapApplicationError(error);
				console.error(response.statusText);
			});
		}

		/**
		 * Updates the timestamp dual list.
		 */
		$scope.updateTimestamps = async function(selectMostRecentDate) {
			let indicator = $scope.selectedIndicator;

			// convert to required format, change this once format is updated
			let dates = indicator.applicableDates.map( el => {
				return {
					"properties": {
						"NAME": el
					}
				}
			});
			if(selectMostRecentDate) {
				$scope.updateDualList($scope.duallistTimestampsOptions, dates, [ dates[dates.length-1] ])
			} else {
				$scope.updateDualList($scope.duallistTimestampsOptions, dates)
			}
			
			$timeout(function() {
			 	$scope.$apply();
			})
		}

		$scope.updateSpatialUnitsMultiselect = async function() {
			let indicator = $scope.selectedIndicator;
			console.log(indicator)
			// convert to required format, change this once format is updated
			let spatialUnits = indicator.applicableSpatialUnits.map( el => {
				return {
					"properties": {
						"NAME": el.spatialUnitName
					}
				}
			})
			$scope.updateDualList($scope.duallistSpatialUnitsOptions, spatialUnits)
			$timeout(function() {
			 	$scope.$apply();
			})
		}

		/**
		 * 
		 * @param {*} options | scope options obj for duallist to update
		 * @param {*} data | new data, format like:
		 * 
		 * [
		 * 	{
		 * 		properties: {
		 * 			NAME: ...
		 * 		}
		 *  }, {
		 *		...
		 *  }]
		 * @param {*} selectedItems | optional, the items that should be selected after the update
		 */
		$scope.updateDualList = function(options, data, selectedItems) {
			options.selectedItems = [];

			let dualListInput = data.map( el => {
				return {"name": el.properties.NAME} // we need this as an object for kommonitorDataExchangeService.createDualListInputArray
			});
			dualListInput = kommonitorDataExchangeService.createDualListInputArray(dualListInput, "name");
			options.items = dualListInput;

			// $timeout is needed because we want to click on an element to select it.
			// therefore we have to wait until the dual list is updated and the dom node exists
			$timeout( function() {
				// if there are items to select
				if(selectedItems && selectedItems.length > 0) {
					for(let item of selectedItems) {
						if(item.hasOwnProperty("properties")) {
							if(item.properties.hasOwnProperty("NAME")) {
								let name = item.properties.NAME
								// remove item to select from left side and add to right side
								// we can't filter programatically here because the changes won't get applied to scope variables
								// not even with $scope.$apply in a $timeout
								// instead we click on the elements
								// get dom element by name
								let arr = Array.from(document.querySelectorAll("#reporting-indicator-add-timestamps-dual-list a"));
								let el = arr.find(el => {
									return el.textContent.includes(name)
								})
								el.click();
							}
						}
					}
					// by now we enabled the fourth tab, but we don't want that yet since we are still in the first one
					// instead the tab is enabled once we click on the third one
					let tab4 = document.querySelector("#reporting-add-indicator-tab4");
					$scope.disableTab(tab4);
				}
			})
			
		}

		
		$scope.onIndicatorSelected = function(indicator) {
			// set indicator manually.
			// if we use ng-model it gets converted to string instead of an object
			$scope.selectedIndicator = indicator;
			// update indicator name in preview
			for(let page of $scope.template.pages) {
				for(let el of page.pageElements) {
					console.log(indicator);
					if(el.type === "indicatorTitle-landscape") {
						el.content = "<b>" + indicator.indicatorName + " [" + indicator.unit + "]</b>";
					}
				}
			}
			// set spatial unit to highest available one
			if(typeof($scope.selectedSpatialUnit === 'undefined')) {
				$scope.selectedSpatialUnit = $scope.selectedIndicator.applicableSpatialUnits[0];
			}
			
			$scope.updateSpatialUnitsMultiselect();
			$scope.updateTimestamps(true);
			
			let tab2 = document.querySelector("#reporting-add-indicator-tab2");
			$scope.enableTab(tab2);
		}

		$scope.onTab3Clicked = function() {
			// check if a timestamp is already selected (one should get selected by default on indicator selection)
			// if yes enable fourth tab
			let tab4 = document.querySelector("#reporting-add-indicator-tab4");
			if($scope.selectedTimestamps && $scope.selectedTimestamps.length) {
				$scope.enableTab(tab4);
			} else {
				$scope.disableTab(tab4);
			}
		}



		$scope.onBackToOverviewClicked = function() {
			// lock all tabs except the first
			let tab2 = document.querySelector("#reporting-add-indicator-tab2");
			let tab3 = document.querySelector("#reporting-add-indicator-tab3");
			let tab4 = document.querySelector("#reporting-add-indicator-tab4");
			$scope.disableTab(tab2);
			$scope.disableTab(tab3);
			$scope.disableTab(tab4);
			$scope.selectedIndicator = undefined;
			$scope.$emit('backToOverviewClicked')
		}

        $scope.onAddNewIndicatorClicked = function() {
			$scope.$emit('addNewIndicatorClicked', [$scope.selectedIndicator])
		}

		$scope.enableTab = function(tab) {
			tab.classList.remove("tab-disabled")
			tab.firstElementChild.removeAttribute("tabindex")
		}

		$scope.disableTab = function(tab) {
			tab.classList.add("tab-disabled")
			tab.firstElementChild.setAttribute("tabindex", "1")
		}
    }
]})