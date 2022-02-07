angular.module('reportingIndicatorAdd').component('reportingIndicatorAdd', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingIndicatorAdd/reporting-indicator-add.template.html",
	controller : ['$scope', '$http', '$timeout', '__env', 'kommonitorDataExchangeService', 'kommonitorDiagramHelperService', 'kommonitorVisualStyleHelperService',
	function ReportingIndicatorAddController($scope, $http, $timeout, __env, kommonitorDataExchangeService, kommonitorDiagramHelperService, kommonitorVisualStyleHelperService) {

		$scope.template = undefined;
		$scope.untouchedTemplate = undefined;
		$scope.untouchedTemplateAsString = "";
		
		$scope.indicatorNameFilter = "";
		$scope.availableIndicators = [];
		$scope.selectedIndicator = undefined;

		$scope.availableFeaturesBySpatialUnit = {};
		$scope.selectedSpatialUnit = undefined;
		$scope.selectedAreas = [];
		$scope.selectedSpatialUnitsMultiselect = undefined

		$scope.selectedTimestamps = [];
		$scope.indexOfFirstAreaSpecificPage = undefined;
		$scope.pageContent = {
			map: true,
			boxplot: true,
			diagram1: true,
			diagram2: true
		}
		
		$scope.loadingData = false;
		$scope.diagramsPrepared = false;

		// used to track template pages instead of using $$hashkey
		$scope.templatePageIdCounter = 1;
		
		// internal array changes do not work with ng-change
		$scope.$watchCollection('selectedAreas', function(newVal, oldVal) {
			$scope.onSelectedAreasChanged(newVal, oldVal)
		});

		$scope.onSelectedAreasChanged = function(newVal, oldVal) {
			$scope.loadingData = true;
			if( typeof($scope.template) === "undefined") return;
			// to make things easier we remove all area-specific pages and recreate them using newVal
			// this approach is not optimized for performance and might have to change in the future

			// remove all area-specific pages
			$scope.template.pages = $scope.template.pages.filter( page => {
				return !page.hasOwnProperty("area")
			});

			let pagesToInsertPerTimestamp = []
			for(let area of newVal) {
				// get page to insert from untouched template
				let pageToInsert = angular.fromJson($scope.untouchedTemplateAsString).pages[ $scope.indexOfFirstAreaSpecificPage ];
				pageToInsert.area = area.name;
				pageToInsert.id = $scope.templatePageIdCounter++;
				pagesToInsertPerTimestamp.push(pageToInsert);
			}

			// sort alphabetically by area name
			pagesToInsertPerTimestamp.sort( (a, b) => {
				textA = a.area.toLowerCase();
				textB = b.area.toLowerCase();
				return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
			})

			// insert area-specific pages for each timestamp
			// right now the area-specific part is missing and we have to figure out where it was.
			// get pages per timestamp -> insert new ones starting at indexOfFirstAreaSpecificPage -> replace per timestamp in $scope.template.pages
			if($scope.selectedTimestamps.length) {
				let idx = 0
				for(let timestamp of $scope.selectedTimestamps) {
					// pagesForTimestamp is the template-section for that timestamp
					
					let pagesForTimestamp = $scope.template.pages.filter( page => {
						let dateEl = page.pageElements.find( el => {
							return el.type === "dataTimestamp-landscape"
						});
						
						return dateEl.text === timestamp.name
					});
					// set index to first page of that timestamp
					// this is where we want to start replacing pages later
					idx = $scope.template.pages.indexOf( pagesForTimestamp[0] )
					// create a deep copy so we can assign new ids
					pagesForTimestamp = JSON.parse(JSON.stringify(pagesForTimestamp));
					
					// setup pages before inserting
					for(let pageToInsert of pagesToInsertPerTimestamp) {

						let titleEl = pageToInsert.pageElements.find( el => {
							return el.type === "indicatorTitle-landscape"
						});
						titleEl.text = $scope.selectedIndicator.indicatorName
						if(pageToInsert.area) {
							titleEl.text += ", " + pageToInsert.area
						}
						titleEl.isPlaceholder = false;

						let dateEl = pageToInsert.pageElements.find( el => {
							return el.type === "dataTimestamp-landscape"
						});
						dateEl.text = timestamp.name;
						dateEl.isPlaceholder = false;

						// diagrams have to be inserted later because the div element does not yet exist
					}

					let numberOfPagesToReplace = pagesForTimestamp.length;
					// insert area-specific pages
					pagesToInsertPerTimestamp = JSON.parse(JSON.stringify(pagesToInsertPerTimestamp));
					for(let page of pagesToInsertPerTimestamp)
						page.id = $scope.templatePageIdCounter++;
					pagesForTimestamp.splice($scope.indexOfFirstAreaSpecificPage, 0, ...pagesToInsertPerTimestamp)
					// assign new ids
					for(let page of pagesForTimestamp)
						page.id = $scope.templatePageIdCounter++;
					// then replace the whole timstamp-section with the new pages
					$scope.template.pages.splice(idx, numberOfPagesToReplace, ...pagesForTimestamp)
				}
			} else {
				for(let page of pagesToInsertPerTimestamp)
					page.id = $scope.templatePageIdCounter++;
				// no timestamp selected, which makes inserting easier
				$scope.template.pages.splice($scope.indexOfFirstAreaSpecificPage, 0, ...pagesToInsertPerTimestamp)
			}
			
			$timeout(function() {
				if($scope.diagramsPrepared) {
					$scope.initializeOrUpdateAllDiagrams();
					$scope.loadingData = false;
				}
			});
		}

		// internal array changes do not work with ng-change
		$scope.$watchCollection('selectedTimestamps', function(newVal, oldVal) {
			$scope.loadingData = true;
			let tab4 = document.querySelector("#reporting-add-indicator-tab4");

			// get difference between old and new value (the timestamps selected / deselected)
			let difference = oldVal
				.filter(x => !newVal.includes(x))
				.concat(newVal.filter(x => !oldVal.includes(x)));
			
			// if selected
			if(newVal.length > oldVal.length) {
				$scope.enableTab(tab4);
				// if this was the first timestamp
				if(newVal.length === 1) {
					// no need to insert pages, we just replace the placeholder timestamp
					for(let page of $scope.template.pages) {
						for(let pageElement of page.pageElements) {
							if(pageElement.type === "dataTimestamp-landscape") {
								pageElement.text = difference[0].name;
								pageElement.isPlaceholder = false;
							}
						}
					}
				}
				
				if(newVal.length > 1) {
					for(let timestampToInsert of difference) {

						// setup pages to insert first
						let pagesToInsert = angular.fromJson($scope.untouchedTemplateAsString).pages;
						for(let page of pagesToInsert) {
							page.id = $scope.templatePageIdCounter++;
						}
						// insert additional page for each selected area, replace the placeholder page
						let areaSpecificPages = [];
						// copy placeholder page for each selected area
						for(let area of $scope.selectedAreas) {
							let page = angular.fromJson($scope.untouchedTemplateAsString).pages[ $scope.indexOfFirstAreaSpecificPage ];
							page.area = area.name;
							page.id = $scope.templatePageIdCounter++;
							areaSpecificPages.push(page);
						}

						// sort alphabetically by area name
						areaSpecificPages.sort( (a, b) => {
							textA = a.area.toLowerCase();
							textB = b.area.toLowerCase();
							return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
						})

						pagesToInsert.splice($scope.indexOfFirstAreaSpecificPage, 1, ...areaSpecificPages)

						// setup pages before inserting them
						for(let pageToInsert of pagesToInsert) {
							for(let pageElement of pageToInsert.pageElements) {

								if(pageElement.type === "indicatorTitle-landscape") {
									pageElement.text = $scope.selectedIndicator.indicatorName;
									if(pageToInsert.area) {
										pageElement.text += ", " + pageToInsert.area
									}
									pageElement.isPlaceholder = false;
								}

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

			$timeout(function() {
				if($scope.diagramsPrepared) {
					$scope.initializeOrUpdateAllDiagrams();
					$scope.loadingData = false;
				}
			});
		});

		$scope.$on("configureNewIndicatorShown", function(event, data) {
			$scope.initialize(data);
		});

		$scope.initialize = function(data) {
			// deep copy template before any changes are made.
			// this is needed when additional timestamps are inserted.
			$scope.untouchedTemplateAsString = angular.toJson(data)
			$scope.untouchedTemplate = angular.fromJson($scope.untouchedTemplateAsString);
			// give each page a unique id to track it by in ng-repeat
			for(let page of data.pages) {
				page.id = $scope.templatePageIdCounter++;
			}
			$scope.template = data;

			if($scope.template.name === "A4-landscape-timestamp")
				$scope.indexOfFirstAreaSpecificPage = 3;
			if($scope.template.name === "A4-landscape-timeseries")
				$scope.indexOfFirstAreaSpecificPage = 3;

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
			$scope.dualListAreasOptions = {
				label: 'Bereiche',
				boxItemsHeight: 'md',
				items: [],
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: []
			};

			$scope.dualListTimestampsOptions = {
				label: 'Zeitpunkte',
				boxItemsHeight: 'md',
				items: [],
				button: {leftText: "Alle auswählen" , rightText: "Alle entfernen"},
				selectedItems: []
			};

			$scope.dualListSpatialUnitsOptions = {
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


		$scope.onSpatialUnitChanged = async function(selectedSpatialUnit) {
			$scope.loadingData = true;
			await $scope.updateAreasInDualList()
			// fire $watch('selectedAreas') function manually to remove pages
			$scope.selectedAreas = [];
			$scope.onSelectedAreasChanged( $scope.selectedAreas , undefined)
			// updateAreasInDualList does not trigger diagram updates
			// we have the wrong geometries set at this point, causing area selection to fail.
			// echarts requires properties.name to be present, create it from properties.NAME unless it exists
			let features = $scope.availableFeaturesBySpatialUnit[ selectedSpatialUnit.spatialUnitName ]
			features = $scope.createLowerCaseNameProperty(features);
			let geoJSON = { features: features }
			// the timestamp we use here doesn't really mater since each diagram gets updated
			// with the appropriate timestamp in initializeOrUpdateAllDiagrams.
			let timestamp = $scope.selectedTimestamps[ $scope.selectedTimestamps.length-1 ]
			let timestampName = timestamp.name;
			$scope.prepareDiagrams($scope.selectedIndicator, selectedSpatialUnit, timestampName, geoJSON);

			$timeout(function() {
				if($scope.diagramsPrepared) {
					$scope.initializeOrUpdateAllDiagrams()
					$scope.loadingData = false;
				}
			});
			
		}

		/**
		 * Updates the areas dual list data
		 * Queries DataManagement API if needed.
		 */
		$scope.updateAreasInDualList = async function() {
			let indicator = $scope.selectedIndicator;
			
			let spatialUnit = $scope.selectedSpatialUnit ?
				$scope.selectedSpatialUnit :
				$scope.selectedIndicator.applicableSpatialUnits[0]
			let indicatorId = indicator.indicatorId;
			let spatialUnitId = spatialUnit.spatialUnitId;
			
			// on indicator change
			if($scope.availableFeaturesBySpatialUnit.indicatorId != indicator.indicatorId) {
				// clear all cached features
				$scope.availableFeaturesBySpatialUnit = {};
				$scope.availableFeaturesBySpatialUnit.indicatorId = indicatorId;

				let data = await $scope.queryFeatures(indicatorId, spatialUnitId)
				// save response to scope to avoid further requests
				$scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName] = data.features
			} else {
				// same indicator
				if (!$scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName]) {
					let data = await $scope.queryFeatures(indicatorId, spatialUnitId)
					// save response to scope to avoid further requests
					$scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName] = data.features
				}
			}

			let allAreas = $scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName]
			$scope.updateDualList($scope.dualListAreasOptions, allAreas, undefined) // don't select any areas

			$timeout(function() {
				$scope.$apply();
			})
		}

		/**
		 * Queries DataManagement API to get features of gi for given indicator
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

		$scope.updateSpatialUnitsMultiSelect = async function() {
			let indicator = $scope.selectedIndicator;

			// convert to required format, change this once format is updated
			let spatialUnits = indicator.applicableSpatialUnits.map( el => {
				return {
					"properties": {
						"NAME": el.spatialUnitName
					}
				}
			})
			$scope.updateDualList($scope.dualListSpatialUnitsOptions, spatialUnits, undefined)
			$timeout(function() {
			 	$scope.$apply();
			})
		}

		/**
		 * 
		 * @param {*} options | scope options obj for dualList to update
		 * @param {*} data | new data (all data, including entries that get selected and removed from left side), format like:
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
					// if all items should be selected we can use the "select all" button for better performance
					if(data.length === selectedItems.length) {
						let dualListBtnElement = undefined;
						switch(options.label) {
							case "Zeitpunkte":
								dualListBtnElement = document.querySelector("#reporting-indicator-add-timestamps-dual-list .duallistButton")[0];
								break;
							case "Bereiche":
								dualListBtnElement = document.querySelectorAll("#reporting-indicator-add-areas-dual-list .duallistButton")[0];
								break;
							case "Raumebenen":
								dualListBtnElement = document.querySelectorAll("#reporting-indicator-add-spatialUnits-dual-list .duallistButton")[0];
								break;
						}
						dualListBtnElement.click();
					} else {
						for(let item of selectedItems) {
							if(item.hasOwnProperty("properties")) {
								if(item.properties.hasOwnProperty("NAME")) {
									let name = item.properties.NAME
									// remove item to select from left side and add to right side
									// we can't filter programmatically here because the changes won't get applied to scope variables
									// not even with $scope.$apply in a $timeout
									// instead we click on the elements
									// get dom element by name
									let arr = [];
									switch(options.label) {
										case "Zeitpunkte":
											arr = Array.from(document.querySelectorAll("#reporting-indicator-add-timestamps-dual-list a"));
											break;
										case "Bereiche":
											arr = Array.from(document.querySelectorAll("#reporting-indicator-add-areas-dual-list a"));
											break;
										case "Raumebenen":
											arr = Array.from(document.querySelectorAll("#reporting-indicator-add-spatialUnits-dual-list a"));
											break;
									}
									let el = arr.find(el => {
										return el.textContent.includes(name)
									});
									el.click();
								}
							}
						}
					}
				}
			});
		}

		
		$scope.onIndicatorSelected = async function(indicator) {
			$scope.selectedIndicator = undefined;
			$scope.selectedTimestamps = [];
			$scope.selectedAreas = [];
			$scope.diagramsPrepared = false;
			// set indicator manually.
			// if we use ng-model it gets converted to string instead of an object
			$scope.selectedIndicator = indicator;
			
			// get a new template (in case another indicator was selected previously)
			let temp = angular.fromJson($scope.untouchedTemplateAsString);
			for(let page of temp.pages) {
				page.id = $scope.templatePageIdCounter++;
			}
			$scope.template = temp;

			// set spatial unit to highest available one
			if(typeof($scope.selectedSpatialUnit === 'undefined')) {
				$scope.selectedSpatialUnit = $scope.selectedIndicator.applicableSpatialUnits[0];
			}

			// select most recent timestamp
			// get manually because it takes a  moment until $scope.selectedTimestamps is set by the listener
			let dates = $scope.selectedIndicator.applicableDates;
			let mostRecentTimestampName = dates[ dates.length - 1 ]
			// convert all available timestamps to required format ("feature")
			let availableTimestamps = dates.map( name => {
				return { "properties": { "NAME": name } }
			})
			let mostRecentTimestamp = availableTimestamps.filter( el => {
				return el.properties.NAME === mostRecentTimestampName;
			})

			await $scope.updateAreasInDualList();

			// prepare diagrams before updating dual lists, so diagrams can be initialized by $watch functions
			let features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedIndicator.applicableSpatialUnits[0].spatialUnitName ]
			features = $scope.createLowerCaseNameProperty(features);
			let geoJson = {
				features: features
			}
			$scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, mostRecentTimestampName, geoJson);
			

			$scope.updateDualList($scope.dualListTimestampsOptions, availableTimestamps, mostRecentTimestamp)
			// by now we enabled the fourth tab, but we don't want that yet since we are still in the first one
			// instead the tab is enabled once we click on the third one
			let tab4 = document.querySelector("#reporting-add-indicator-tab4");
			$scope.disableTab(tab4);

			// select all areas by default
			let allAreas = $scope.availableFeaturesBySpatialUnit[$scope.selectedSpatialUnit.spatialUnitName];
			$scope.updateDualList($scope.dualListAreasOptions, allAreas, allAreas);
			
			await $scope.updateSpatialUnitsMultiSelect();

			let tab2 = document.querySelector("#reporting-add-indicator-tab2");
			$scope.enableTab(tab2);
			let tab3 = document.querySelector("#reporting-add-indicator-tab3");
			$scope.enableTab(tab3);
			
			// update indicator name and timestamp in preview
			for(let page of $scope.template.pages) {
				for(let el of page.pageElements) {
					if(el.type === "indicatorTitle-landscape") {
						el.text = indicator.indicatorName + " [" + indicator.unit + "]";
						el.isPlaceholder = false;
					}

					if(el.type === "dataTimestamp-landscape") {
						el.text = mostRecentTimestampName;
						el.isPlaceholder = false
					}
				}
			}	
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

		/**
		 * Creates and returns an echarts geoMap object.
		 * @param {*} wrapper | the dom element (most likely a div) where the map should be inserted
		 * @param {*} pageElement 
		 * @returns 
		 */
		$scope.createPageElement_Map = function(pageDom, wrapper, page, pageElement) {
			let map = echarts.init( wrapper );
			
			// get standard options, create a copy of the options to not change anything in the service
			let options = JSON.parse(JSON.stringify( kommonitorDiagramHelperService.getGeoMapChartOptions() ));
			// check if there is a map registered for this combination, if not register one with all features
			let timestampDom = pageDom.querySelector(".type-dataTimestamp-landscape")
			let timestamp = timestampDom.innerText;
			let mapName = $scope.selectedIndicator.indicatorName + "_" + timestamp + "_" + $scope.selectedSpatialUnit.spatialUnitName;
			if(pageElement.classify) {
				mapName += "_classified";
			}
			if(page.area && page.area.length) {
				mapName += "_" + page.area
			}
			let registeredMap = echarts.getMap(mapName)

			if(typeof(registeredMap === "undefined")) {
				// register new map
				echarts.registerMap(mapName, $scope.selectedIndicator.geoJSON)
			}


			// default changes for all reporting maps
			options.title.show = false;
			options.grid = undefined;
			options.visualMap.axisLabel = { "fontSize": 10 };
			options.toolbox.show = false;
			options.visualMap.left = "right";
			let mapOptions = options.series[0];
			mapOptions.roam = false;
			// during diagram preparation we used the most recent timestamp
			// now we have to set data according to timestamp for that page
			mapOptions.data = $scope.getSeriesDataForTimestamp($scope.selectedIndicator.geoJSON.features, timestamp)
			mapOptions.map = mapName; // update the map with the one registered above
			mapOptions.name = mapName;

			let areaNames = $scope.selectedAreas.map( el => {
				return el.name;
			});


			mapOptions.data.forEach( el => {
				el.itemStyle =  el.itemStyle ? el.itemStyle : {};
				el.emphasis = el.emphasis ? el.emphasis : {};
				el.emphasis.itemStyle = el.emphasis.itemStyle ? el.emphasis.itemStyle : {};
				el.label = el.label ? el.label : {};

				if(pageElement.classify === false) {
					el.visualMap = false;
					options.visualMap.show = false;
					if( areaNames.includes(el.name) ) {
						// show selected areas (don't classify color by value)
						el.itemStyle.areaColor = "rgb(255, 0, 0, 0.6)";
						el.emphasis.itemStyle.areaColor = "rgb(255, 0, 0, 0.6)";
						el.label.formatter = '{b}\n{c}';
						el.label.show = true;
						el.selected = true; // This fixes a bug where labels would disappear seemingly at random (probably within echarts).
					} else {
						// only show borders for any other areas
						el.itemStyle.areaColor = "rgba(255, 255, 255, 0)" // full transparent
						el.emphasis.itemStyle.areaColor = "rgba(255, 255, 255, 0)"; // full transparent
						el.label.show = false;
						el.selected = false;
					}
				}

				if(pageElement.classify === true) {
				
					if( areaNames.includes(el.name) ) {
						el.visualMap = true;
						el.label.formatter = '{b}\n{c}';
						// get color from visual map to overwrite yellow color
						let color = "#000"; //  black for default
						let opacity = 1;
						for(let [idx, piece] of options.visualMap.pieces.entries()) {
							// for the last index (highest value) value can equal the upper boundary
							if(idx === (options.visualMap.pieces.length-1)) {
								if(piece.min <= el.value && el.value <= piece.max) {
									color = piece.color;
									opacity = piece.opacity;
									break;
								}
							}

							// for all other pieces check if it is withing the boundaries, (including lower one, excluding upper one)
							if(piece.min <= el.value && el.value < piece.max) {
								color = piece.color;
								opacity = piece.opacity;
								break;
							}
						}
						el.label.show = true;
						el.selected = true;
						el.emphasis.itemStyle.areaColor = color;
						el.emphasis.itemStyle.opacity = opacity;
					} else {
						el.visualMap = false;
						el.itemStyle.areaColor = "rgba(255, 255, 255, 0)" // full transparent
						el.emphasis.itemStyle.areaColor = "rgba(255, 255, 255, 0)"; // full transparent
						el.label.show = false;
						el.selected = false;
					}
				}
			})
			
			map.setOption(options);
			map.resize();
			return map;
		}

		$scope.createPageElement_OverallAverage = function(wrapper, pageElement, timestamp) {
			let overallAvg = $scope.calculateOverallAvg( $scope.selectedIndicator, timestamp );
			pageElement.text = overallAvg;
			pageElement.css = "border: solid; 1px; darkgray;"
			pageElement.isPlaceholder = false;
		}

		$scope.createPageElement_BarChartDiagram = function(pageDom, wrapper, page, pageElement) {
			let barChart = echarts.init( wrapper );
			// get standard options, create a copy of the options to not change anything in the service
			let options = JSON.parse(JSON.stringify( kommonitorDiagramHelperService.getBarChartOptions() ));

			// default changes
			options.xAxis.name = "";
			options.title.textStyle.fontSize = 12;
			options.title.text = ""; //TODO
			options.yAxis.axisLabel = { "fontSize": 10 };
			options.title.show = true;
			options.grid.top = 35;
			options.grid.bottom = 5;
			options.toolbox.show = false;
			options.visualMap[0].show = false; // only needed to set the color for avg
			options.xAxis.axisLabel.show = true;
			// during diagram preparation we used the most recent timestamp
			// now we have to set data according to timestamp for that page
			let timestampDom = pageDom.querySelector(".type-dataTimestamp-landscape")
			let timestamp = timestampDom.innerText;
			options.series[0].data = $scope.getSeriesDataForTimestamp($scope.selectedIndicator.geoJSON.features, timestamp, options.series[0].data)
			
			// filter series data and xAxis labels
			if(page.area && page.area.length) {
				options.series[0].data = options.series[0].data.filter( el => {
					return el.name === page.area;
				});
				let areaNames = options.series[0].data.map( obj => obj.name)
				options.xAxis.data = areaNames;
			} else {
				// only show selected areas in the "overview" diagram
				let areaNames = $scope.selectedAreas.map( obj => obj.name );
				options.series[0].data = options.series[0].data.filter( el => {
					return areaNames.includes(el.name);
				});
				areaNames = options.series[0].data.map( obj => obj.name);
				options.xAxis.data = areaNames;
			}

			options.series[0].data.sort(function(a, b) {
				if(typeof(a.value) == 'number' && typeof(b.value) == 'number') {
					return a.value - b.value;
				} else {
					return -1 // experimental, does this sort NaN to the left?
				}	
			});

			// add one more data element for the average
			let avgValue = $scope.calculateOverallAvg($scope.selectedIndicator, timestamp);
			let avgElementName = (page.area && page.area.length) ? "Durchschnitt\nder\nRaumeinheit" : "Durchschnitt der Raumeinheit";
			let dataObjForAvg = {
				name: avgElementName,
				value: avgValue
				// color is set by visual map
			}
			options.series[0].data.push(dataObjForAvg);
			options.xAxis.data.push( dataObjForAvg.name )

			barChart.setOption(options);
			barChart.resize();
			return barChart;
		}

		$scope.createPageElement_TimelineDiagram = function(wrapper, pageElement) {
			let lineChart = echarts.init( wrapper );
			let options = kommonitorDiagramHelperService.getLineChartOptions();
			options.xAxis.name = ""; //remove title
			options.title.textStyle.fontSize = 12;
			options.title.text = "Zeitreihe - Arithm. Mittel";
			options.yAxis.axisLabel = { "fontSize": 10 };
			options.xAxis.axisLabel = { "fontSize": 10 };
			options.legend.show = false;
			options.grid.top = 35;
			options.grid.bottom = 5;
			options.title.show = true;
			options.toolbox.show = false;
			lineChart.setOption(options);
			lineChart.resize();
			return lineChart;
		}

		$scope.createPageElement_Datatable = function(pageDom, wrapper, page, pageElement) {
			
			let timestamp = pageDom.querySelector(".type-dataTimestamp-landscape").innerText;
			
			/*
			area	| value  |
			------------------
			area1	| value1 |
			area2	| value2 |
			...		| ...	 |
			*/

			
			// our wrapper is 440px high.
			// 440 - 25 (header) = 415
			// we set each row to be 25px high, so we can fit 415 / 25 --> 16 rows on one page.
			let addedRowsCounter = 0;
			let wrapperHeight = parseInt(wrapper.style.height, 10);
			let maxRows = Math.floor( (wrapperHeight - 25) / 25);
			let rowsData = [];
			// see how many paged need to be added. Rows are added later
			for(let feature of $scope.selectedIndicator.geoJSON.features) {
				// don't add row if feature not selected
				let isSelected = false;
				for(let area of $scope.selectedAreas) {
					if(area.name === feature.properties.NAME) {
						isSelected = true;
					}
				}
				if( !isSelected )
					continue;
				// prepare data to insert later
				let value = feature.properties["DATE_" + timestamp];
				if(typeof(value) == 'number')
				 	value = Math.round( value * 100) / 100;
				rowsData.push( {
					name: feature.properties.NAME,
					value: value
				});

				if(addedRowsCounter > 0 && addedRowsCounter % maxRows == 0) { // addedRowsCounter is 16, 32, ...
					// add a new page
					let newPage = angular.fromJson($scope.untouchedTemplateAsString).pages.at(-1);
					newPage.id = $scope.templatePageIdCounter++;
					// setup new page
					for(let pageElement of newPage.pageElements) {

						if(pageElement.type === "indicatorTitle-landscape") {
							pageElement.text = $scope.selectedIndicator.indicatorName;
							pageElement.isPlaceholder = false;
						}

						if(pageElement.type === "dataTimestamp-landscape") {
							pageElement.text = timestamp;
							pageElement.isPlaceholder = false;
						}

						if(pageElement.type === "datatable") {
							pageElement.isPlaceholder = false;
						}
					}

					// insert after current one
					let currentPageIndex = $scope.template.pages.indexOf(page)
					$scope.template.pages.splice(currentPageIndex + 1, 0, newPage);
				}

				addedRowsCounter++;
			}

			// create table rows once the pages exist
			$timeout(function(rowsData, page, maxRows) {
				// get current index of page (might have changed in the meantime)
				let idx = $scope.template.pages.indexOf(page)
				let wrapper = document.querySelector("#reporting-page-" + idx + "-datatable");
				wrapper.innerHTML = "";
				wrapper.style.border = "none"; // hide dotted border from outer dom element
				wrapper.style.justifyContent = "flex-start"; // align table at top instead of center
				let addedRowsCounter = 0;

				let table = $scope.createDatatableSkeleton();
				wrapper.appendChild(table);
				let tbody = table.querySelector("tbody");
				let pageElement = $scope.template.pages[idx].pageElements.find( el => el.type === "datatable");
				pageElement.isPlaceholder = false;

				for(let data of rowsData) {
					let row = document.createElement("tr");
					row.style.height = "25px";
					
					let td1 = document.createElement("td");
					td1.innerText = data.name;
					td1.classList.add("text-left");
					row.appendChild(td1);
	
					let td2 = document.createElement("td");
					td2.innerText = data.value;
					td2.classList.add("text-right");
					row.appendChild(td2);
	
					// see which page we have to add the row to
					if(addedRowsCounter > 0 && addedRowsCounter % maxRows == 0) {
						// switch to next page if necessary
						idx++
						wrapper = document.querySelector("#reporting-page-" + idx + "-datatable");
						wrapper.innerHTML = "";
						wrapper.style.border = "none"; // hide dotted border from outer dom element
						wrapper.style.justifyContent = "flex-start"; // align table at top instead of center
						table = $scope.createDatatableSkeleton();
						wrapper.appendChild(table);
						tbody = table.querySelector("tbody");
						pageElement = $scope.template.pages[idx].pageElements.find( el => el.type === "datatable");
						pageElement.isPlaceholder = false;
					}

					tbody.appendChild(row)
					addedRowsCounter++;
				}
			}, 0, true, rowsData, page, maxRows);
		}

		/**
		 * 
		 * @param {*} echartsInstance 
		 * @param {string} area 
		 */
		$scope.filterPageElement_Map = function(echartsInstance, areaName, allFeatures) {
			let options = echartsInstance.getOption();
			let mapName = options.series[0].map;
			// filter shown areas if we are in the area-specific part of the template
			features = allFeatures.filter ( el => {
				return el.properties.name === areaName
			});

			echarts.registerMap(mapName, { features: features } )
			echartsInstance.setOption(options) // set same options, but this updates the map
			echartsInstance.resize();
		}

		$scope.calculateOverallAvg = function(indicator, timestamp) {
			// calculate avg from geoJSON property, which should be the currently selected spatial unit
			let data = indicator.geoJSON.features.map( feature => {
				return feature.properties["DATE_" + timestamp];
			})
			let sum = data.reduce( (prev, current) => prev + current)
			let avg = sum / indicator.geoJSON.features.length;
			avg = Math.round(avg * 100) / 100; // 2 decimal places
			return avg;
		}


		$scope.prepareDiagrams = function(selectedIndicator, selectedSpatialUnit, timestampName, geoJson) {
			// set settings useOutlierDetectionOnIndicator and classifyUsingWholeTimeseries to false to have consistent reporting setup
			// we need to undo these changes afterwards, so we store the current values in a backup first
			let useOutlierDetectionOnIndicator_backup = kommonitorDataExchangeService.useOutlierDetectionOnIndicator;
			let classifyUsingWholeTimeseries_backup = kommonitorDataExchangeService.classifyUsingWholeTimeseries;
			let classifyZeroSeparately_backup = kommonitorDataExchangeService.classifyZeroSeparately; 
			kommonitorDataExchangeService.useOutlierDetectionOnIndicator = false;
			kommonitorDataExchangeService.classifyUsingWholeTimeseries = false;

			let timestampPrefix = __env.indicatorDatePrefix + timestampName;
			let numClasses = selectedIndicator.defaultClassificationMapping.items.length;
			let colorCodeStandard = selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName;
			let colorCodePositiveValues = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
			let colorCodeNegativeValues = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
			let classifyMethod = __env.defaultClassifyMethod;

			// add new prop to indicator metadata, because it is expected that way by kommonitorVisualStyleHelperService
			selectedIndicator.geoJSON = geoJson;
			// setup brew
			let defaultBrew = kommonitorVisualStyleHelperService.setupDefaultBrew(selectedIndicator.geoJSON, timestampPrefix, numClasses, colorCodeStandard, classifyMethod);
			let dynamicBrewsArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew(selectedIndicator.geoJSON, timestampPrefix, colorCodePositiveValues, colorCodeNegativeValues, classifyMethod);
			let dynamicIncreaseBrew = dynamicBrewsArray[0];
			let dynamicDecreaseBrew = dynamicBrewsArray[1];

			// setup diagram resources
			kommonitorDiagramHelperService.prepareAllDiagramResources_forReportingIndicator(selectedIndicator, selectedSpatialUnit.spatialUnitName, timestampName, defaultBrew, undefined, undefined, dynamicIncreaseBrew, dynamicDecreaseBrew, false, 0, false);
			// at this point the echarts instance has one map registered (geoMapChart).
			// that is the "default" map, which can be used to create individual maps for indicator + date + spatialUnit (+ area) combinations later

			// set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator and classifyZeroSeparately back to their prior values
			kommonitorDataExchangeService.useOutlierDetectionOnIndicator = useOutlierDetectionOnIndicator_backup;
			kommonitorDataExchangeService.classifyUsingWholeTimeseries = classifyUsingWholeTimeseries_backup;
			kommonitorDataExchangeService.classifyZeroSeparately = classifyZeroSeparately_backup;

			$scope.diagramsPrepared = true;
		}

		$scope.initializeOrUpdateAllDiagrams = function() {
			if(!$scope.template)
				return;

			// We need a separate counter for page index because we iterate over the pages array.
			// This array might include additional datatable pages, which are not inserted in the dom
			// Even though we do nothing for these pages, the index gets out of sync with the page ids (which we use to get the dom elements)
			let pageIdx = -1;
			for(let i=0; i<$scope.template.pages.length; i++) {
				pageIdx++;
				let page = $scope.template.pages[i];
				
				let prevPage = i>1 ? $scope.template.pages[i-1] : undefined;
				let pageIncludesDatatable = page.pageElements.map(el => el.type).includes("datatable")

				if(prevPage) {
					let prevPageIncludesDatatable = prevPage.pageElements.map(el => el.type).includes("datatable")
					if(pageIncludesDatatable && prevPageIncludesDatatable) {
						// get corresponding pages in the dom and check if they are datatable-pages
						let prevDomPageEl = document.querySelector("#reporting-page-" + (i-1) + "-datatable")
						let domPageEl =  document.querySelector("#reporting-page-" + i + "-datatable")
						if(!prevDomPageEl || !domPageEl) { // if this page does not exist in the dom
							pageIdx--; // don't increase index in this iteration so it stays in sync with the pages that exist in the dom
						}
						continue; // don't do anything for additional datatable pages. They are added in createPageElement_Datatable
					}
				}
				

				let pageDom = document.querySelector("#reporting-page-" + pageIdx)
				let timestamp = pageDom.querySelector(".type-dataTimestamp-landscape")
				if(timestamp) {
					timestamp = timestamp.innerText;
				}
				for(let pageElement of page.pageElements) {
					// limited to one page-element-type per page
					
					let pElementDom = pageDom.querySelector("#reporting-page-" + pageIdx + "-" + pageElement.type)
					
					switch(pageElement.type) {
						case "map":
							// initialize with all areas
							let map = $scope.createPageElement_Map(pageDom, pElementDom, page, pageElement);
							// filter visible areas if needed
							if(page.area && page.area.length) {
								$scope.filterPageElement_Map(map, page.area, $scope.selectedIndicator.geoJSON.features);
							}
							pageElement.isPlaceholder = false;
							break;
						case "mapLegend":
							pageElement.isPlaceholder = false; // hide the placeholder, legend is part of map
							pageDom.querySelector(".type-mapLegend").style.display = "none";
							break;
						case "overallAverage":
							$scope.createPageElement_OverallAverage(pElementDom, pageElement, timestamp);
							pageDom.querySelector(".type-overallAverage").style.border = "none"; // hide dotted border from outer dom element
							break;
						case "barchart":
							$scope.createPageElement_BarChartDiagram(pageDom, pElementDom, page, pageElement);
							pageElement.isPlaceholder = false;
							break;
						case "linechart":
							$scope.createPageElement_TimelineDiagram(pElementDom, pageElement);
							pageElement.isPlaceholder = false;
							break;
						case "datatable":
							// remove all following datatable pages first so we don't add too many.
							// this might happen because we initialize page elements from $watch(selectedAreas) and $watch(selectedTimestamps) on indicator selection
							let nextPage = i<$scope.template.pages.length-1 ? $scope.template.pages[i+1] : undefined;
							if(nextPage) {
								let nextPageIncludesDatatable = nextPage.pageElements.map(el => el.type).includes("datatable")
								while(nextPageIncludesDatatable) {
									$scope.template.pages.splice(i+1, 1) //remove page
									//update next page
									nextPage = i<$scope.template.pages.length-1 ? $scope.template.pages[i+1] : undefined;
									nextPageIncludesDatatable = nextPage ? nextPage.pageElements.map(el => el.type).includes("datatable") : false;
								}
							}
							$scope.createPageElement_Datatable( pageDom, pElementDom, page, pageElement );
							break;
					}
				}
			}
		}

		/**
		 * 
		 * @param {*} geoJsonFeatures 
		 * @param {*} timestamp 
		 * @param {*} seriesData | Must have a property "name";
		 * @returns 
		 */
		$scope.getSeriesDataForTimestamp = function(geoJsonFeatures, timestamp, seriesData) {
			// if parameter is present we want to keep it's properties
			if(seriesData && seriesData.length) {
				for(let dataEntry of seriesData) {
					// just replace the value property
					let feature = geoJsonFeatures.find( feature => {
						return feature.properties.NAME === dataEntry.name;
					});
					dataEntry.value = feature.properties["DATE_" + timestamp]
					if(typeof(dataEntry.value) == 'number') {
						dataEntry.value = Math.round( dataEntry.value * 100) / 100;
					}
				}
				return seriesData;

			} else {
				// seriesData is undefined, meaning we can create a new array
				let result = [];
				for(let feature of geoJsonFeatures) {
					let obj = {};
					obj.name = feature.properties.NAME;
					let value = feature.properties["DATE_" + timestamp]
					if(typeof(value) == 'number') {
						value = Math.round( value * 100) / 100;
					}
					obj.value = value;

					result.push(obj)
				}
				return result;
			}
		}

		/**
		 * 
		 * @param {*} features | features array in geojson
		 */
		$scope.createLowerCaseNameProperty = function(features) {
			for(let feature of features) {
				if(feature.hasOwnProperty("properties")) {
					if(!feature.properties.hasOwnProperty("name")) {
						let featureName = feature.properties.NAME;
						feature.properties.name = featureName;
					}
				}
			}
			return features;
		}


		$scope.createDatatableSkeleton = function() {

			let table = document.createElement("table");
			table.classList.add("table-striped")
			table.classList.add("table-bordered")
			
			let thead = document.createElement("thead");
			let tbody = document.createElement("tbody");
			table.appendChild(thead);
			table.appendChild(tbody);
			
			let headerRow = document.createElement("tr");
			let col1 = document.createElement("th");
			let col2 = document.createElement("th");
			col1.innerText = "Bereich";
			col2.innerText = "Wert";
			col1.classList.add("text-center");
			col2.classList.add("text-center");
			headerRow.appendChild(col1);
			headerRow.appendChild(col2);

			headerRow.style.height = "25px";
			thead.appendChild(headerRow);

			return table;
		}

	}
]})