angular.module('reportingIndicatorAdd').component('reportingIndicatorAdd', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingIndicatorAdd/reporting-indicator-add.template.html",
	controller : ['$scope', '$http', '$timeout', '__env', 'kommonitorDataExchangeService',
    function ReportingIndicatorAddController($scope, $http, $timeout, __env, kommonitorDataExchangeService) {

		$scope.template = undefined;
		$scope.untouchedTemplate = undefined;
		$scope.untouchedTemplateAsString = "";

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
		$scope.$watchCollection('selectedTimestamps', function(newVal, oldVal) {
			
			let tab4 = document.querySelector("#reporting-add-indicator-tab4");

			// get difference between old and new value (the timestamp selected / deselected)
			let difference = oldVal
				.filter(x => !newVal.includes(x))
				.concat(newVal.filter(x => !oldVal.includes(x)));
			
			// if selected
			if(newVal.length > oldVal.length) {
				$scope.enableTab(tab4);
				// if this was the first timestamp
				if(newVal.length === 1) {
					// no need to insert pages, we just replace the placeholder timestamp
					$scope.iteratePageElements( $scope.template, function(page, pageElement) {
						if(pageElement.type === "dataTimestamp-landscape") {
							pageElement.text = difference[0].name;
							pageElement.isPlaceholder = false;
						}
					})
				} 
				
				if(newVal.length > 1) {
					for(let timestampToInsert of difference) {

						// setup pages to insert first
						let pagesToInsert = JSON.parse($scope.untouchedTemplateAsString).pages;
						// setup pages before inserting them
						for(let pToInsert of pagesToInsert) {
							for(let pageElement of pToInsert.pageElements) {
								if(pageElement.type === "dataTimestamp-landscape") {
									pageElement.text = timestampToInsert.name;
									pageElement.isPlaceholder = false;
								}
							}
						}

						// determine position to insert pages (ascending timestamps) and insert them
						// iterate pages and check timestamp for each one
						let pagesInserted = false;
						for(let i=$scope.template.pages.length-1; i>=0; i--) { //iterate in reverse because we might extend the array while iterating
							let page = $scope.template.pages[i];

							for(let pElement of page.pageElements) {
								if(pElement.type === "dataTimestamp-landscape") {
									// compare timestamps
									let date1 = timestampToInsert.name;
									let date2 = pElement.text;
									let date1Updated = new Date(date1.replace(/-/g,'/'));  
									let date2Updated = new Date(date2.replace(/-/g,'/'));
									
									// if page timestamp is newer than difference timestamp
									if(date1Updated > date2Updated) {
										// insert pages before pages with that timestamp
										// i+1 because we want to insert after the page that has the older timestamp
										$scope.template.pages.splice(i+1, 0, ...pagesToInsert);
										pagesInserted = true;
									}
								}
							}

							if(pagesInserted) {
								break;
							}
						}
						
						if( !pagesInserted ) { // happens if the timestamp to insert is the oldest one
							$scope.template.pages.splice(0, 0, ...pagesToInsert); //prepend pages
						}
					}

					// in case all timestamps were added at once and none was present before we still have placeholder pages at this point
					// all other pages got prepended since we compared against an invalid date.
					// remove those pages
					for(let i=$scope.template.pages.length-1; i>=0; i--) { //iterate in reverse because we might extend the array while iterating
						let page = $scope.template.pages[i];
						for(let pElement of page.pageElements) {
							if(pElement.type === "dataTimestamp-landscape") {
								if(pElement.isPlaceholder) {
									$scope.template.pages.splice(i, 1);
								}
							}
						}
					}
				}
				

			}

			// if deselected
			if(newVal.length < oldVal.length) {
				// if it was the last one
				if(newVal.length === 0) {
					$scope.disableTab(tab4);
					// remove all pages except the first timestamp
					// this is necessary because we might have deselected multiple timestamps at once
					let firstTimestamp;
					for(let el of $scope.template.pages[0].pageElements) {
						if(el.type === "dataTimestamp-landscape") {
							firstTimestamp = el.text;
						}
					}
					
					$scope.template.pages = $scope.template.pages.filter( page => {
						let timestampEl = page.pageElements.find( el => {
							return el.type === "dataTimestamp-landscape"
						});

						return timestampEl.text === firstTimestamp;
					});

					// show placeholder text for remaining pages
					for(let page of $scope.template.pages) {
						for(let element of page.pageElements) {
							if(element.type === "dataTimestamp-landscape") {
								element.text = element.placeholderText;
								element.isPlaceholder = true;
							}
						}
					}
				} else {
					// remove all pages that belong to removed timestamps
					for(let timestampToRemove of difference) {
						$scope.template.pages = $scope.template.pages.filter( page => {
							let timestampEl = page.pageElements.find( el => {
								return el.type === "dataTimestamp-landscape"
							})

							return timestampEl.text != timestampToRemove.name;
						});
					}
					
				}
			}

		});

		$scope.$on("configureNewIndicatorShown", function(event, data) {
			$scope.initialize(data);
		});

		$scope.initialize = function(data) {
			// deep copy template before any changes are made.
			// this is needed when additional timestamps are inserted.
			$scope.untouchedTemplateAsString = JSON.stringify(data)
			$scope.untouchedTemplate = JSON.parse($scope.untouchedTemplateAsString)
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
		}

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
			// get a new template (in case another indicator was selected previously)
			let temp = JSON.parse($scope.untouchedTemplateAsString);
			$scope.template = temp;

			// update indicator name in preview
			for(let page of $scope.template.pages) {
				for(let el of page.pageElements) {
					console.log(indicator);
					if(el.type === "indicatorTitle-landscape") {
						el.text = indicator.indicatorName + " [" + indicator.unit + "]";
						el.isPlaceholder = false;
					}
				}
			}
			// set spatial unit to highest available one
			if(typeof($scope.selectedSpatialUnit === 'undefined')) {
				$scope.selectedSpatialUnit = $scope.selectedIndicator.applicableSpatialUnits[0];
			}
			
			$scope.updateSpatialUnitsMultiselect();
			let selectMostRecentDate = true
			$scope.updateTimestamps(selectMostRecentDate);

			let tab2 = document.querySelector("#reporting-add-indicator-tab2");
			$scope.enableTab(tab2);

			// update preview area
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

		$scope.iteratePageElements = function(template, functionToExecute) {
			for(let page of template.pages) {
				for(let pageElement of page.pageElements) {
					functionToExecute(page, pageElement);
				}
			}
		}
    }
]})