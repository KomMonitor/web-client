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
						let pagesToInsert = JSON.parse($scope.untouchedTemplateAsString).pages;
						// setup pages before inserting them
						for(let pToInsert of pagesToInsert) {
							for(let pageElement of pToInsert.pageElements) {

								if(pageElement.type === "indicatorTitle-landscape") {
									pageElement.text = $scope.selectedIndicator.indicatorName;
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

		/**
		 * Updates the areas dual list data
		 * Queries DataManagement API if needed.
		 */
		$scope.updateAreas = async function() {
			let indicator = $scope.selectedIndicator;
			
			let spatialUnit = $scope.selectedSpatialUnit ?
				$scope.selectedSpatialUnit :
				$scope.selectedIndicator.applicableSpatialUnits[0]
			let indicatorId = indicator.indicatorId;
			let spatialUnitId = spatialUnit.spatialUnitId;

			if (!$scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName]) {
				let data = await $scope.queryFeatures(indicatorId, spatialUnitId)
				// save response to scope to avoid further requests
				$scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName] = data.features
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
			console.log(indicator)
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
					for(let item of selectedItems) {
						if(item.hasOwnProperty("properties")) {
							if(item.properties.hasOwnProperty("NAME")) {
								let name = item.properties.NAME
								// remove item to select from left side and add to right side
								// we can't filter programatically here because the changes won't get applied to scope variables
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
			})
		}

		
		$scope.onIndicatorSelected = async function(indicator) {
			// set indicator manually.
			// if we use ng-model it gets converted to string instead of an object
			$scope.selectedIndicator = indicator;
			console.log($scope.selectedIndicator);
			// get a new template (in case another indicator was selected previously)
			let temp = JSON.parse($scope.untouchedTemplateAsString);
			$scope.template = temp;

			// set spatial unit to highest available one
			if(typeof($scope.selectedSpatialUnit === 'undefined')) {
				$scope.selectedSpatialUnit = $scope.selectedIndicator.applicableSpatialUnits[0];
			}

			// update areas and select all areas
			await $scope.updateAreas();
			// select all areas by default
			let allAreas = $scope.availableFeaturesBySpatialUnit[$scope.selectedSpatialUnit.spatialUnitName];
			$scope.updateDualList($scope.dualListAreasOptions, allAreas, allAreas);
			
			await $scope.updateSpatialUnitsMultiSelect();

			// select most recent timestamp
			// get manually because it takes a  moment until $scope.selectedTimestamps is set by the listener
			let dates = $scope.selectedIndicator.applicableDates;
			let mostRecentTimestampName = dates[ dates.length-1 ]
			// convert all available timestamps to required format ("feature")
			let availableTimestamps = dates.map( name => {
				return { "properties": { "NAME": name } }
			})
			let mostRecentTimestamp = availableTimestamps.filter( el => {
				return el.properties.NAME === mostRecentTimestampName;
			})
			
			$scope.updateDualList($scope.dualListTimestampsOptions, availableTimestamps, mostRecentTimestamp)
			// by now we enabled the fourth tab, but we don't want that yet since we are still in the first one
			// instead the tab is enabled once we click on the third one
			let tab4 = document.querySelector("#reporting-add-indicator-tab4");
			$scope.disableTab(tab4);

			
			// update indicator name and timestamp in preview
			for(let page of $scope.template.pages) {
				for(let el of page.pageElements) {
					console.log(indicator);
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
			

			let tab2 = document.querySelector("#reporting-add-indicator-tab2");
			$scope.enableTab(tab2);

			// update preview area
			// update page elements
			// set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator to false to have consistent reporting setup
			// set classifyZeroSeparately to true
			// we need to undo these changes afterwards, so we store the current values in a backup first
			let useOutlierDetectionOnIndicator_backup = kommonitorDataExchangeService.useOutlierDetectionOnIndicator;
			let classifyUsingWholeTimeseries_backup = kommonitorDataExchangeService.classifyUsingWholeTimeseries;
			let classifyZeroSeparately_backup = kommonitorDataExchangeService.classifyZeroSeparately; 
			kommonitorDataExchangeService.useOutlierDetectionOnIndicator = false;
			kommonitorDataExchangeService.classifyUsingWholeTimeseries = false;

			
			let timestampPrefix = __env.indicatorDatePrefix + mostRecentTimestampName;
			let numClasses = $scope.selectedIndicator.defaultClassificationMapping.items.length;
			let colorCodeStandard = $scope.selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName;
			let colorCodePositiveValues = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
			let colorCodeNegativeValues = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
			let classifyMethod = __env.defaultClassifyMethod;
			// add new prop to indicator metadata, because it is expected that way by kommonitorVisualStyleHelperService
			$scope.selectedIndicator.geoJSON = { features: $scope.availableFeaturesBySpatialUnit[ $scope.selectedIndicator.applicableSpatialUnits[0].spatialUnitName ] }

			// setup brew
			let defaultBrew = kommonitorVisualStyleHelperService.setupDefaultBrew($scope.selectedIndicator.geoJSON, timestampPrefix, numClasses, colorCodeStandard, classifyMethod);
			let dynamicBrewsArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew($scope.selectedIndicator.geoJSON, timestampPrefix, colorCodePositiveValues, colorCodeNegativeValues, classifyMethod);
			let dynamicIncreaseBrew = dynamicBrewsArray[0];
			let dynamicDecreaseBrew = dynamicBrewsArray[1];

			//setup diagram resources
			kommonitorDiagramHelperService.prepareAllDiagramResources_forReportingIndicator($scope.selectedIndicator, $scope.selectedSpatialUnit.spatialUnitName, mostRecentTimestampName, defaultBrew, undefined, undefined, dynamicIncreaseBrew, dynamicDecreaseBrew, false, 0, false);
			
			// set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator and classifyZeroSeparately back to their prior values			
			kommonitorDataExchangeService.useOutlierDetectionOnIndicator = useOutlierDetectionOnIndicator_backup;
			kommonitorDataExchangeService.classifyUsingWholeTimeseries = classifyUsingWholeTimeseries_backup;
			kommonitorDataExchangeService.classifyZeroSeparately = classifyZeroSeparately_backup;

			// iterate page elements and setup each one
			for(let [pageIdx, page] of $scope.template.pages.entries()) {
				//let pageDom = document.querySelector("#reporting-page-" + pageIdx)
				//console.log("page: ", pageDom);
				for(let pageElement of page.pageElements) {
					let pElementDom = document.querySelector("#reporting-page-" + pageIdx + "-" + pageElement.type)
					
					switch(pageElement.type) {
						case "map":
							$scope.createPageElement_Map(pElementDom, pageElement);
							break;
						case "mapLegend":
							pageElement.isPlaceholder = false; // hide the placeholder, legend is part of map
							break;
						case "overallAverage":
							$scope.createPageElement_OverallAverage(pElementDom, pageElement, mostRecentTimestampName);
							break;
						case "barchart":
							$scope.createPageElement_BarChartDiagram(pElementDom, pageElement);
							break;
						case "linechart":
							$scope.createPageElement_TimelineDiagram(pElementDom, pageElement);
							break;
						case "datatable":
							//$scope.createPageElement_Datatable( pElementDom, pageElement );
							break;
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

		$scope.createPageElement_Map = function(wrapper, pageElement) {
			let map = echarts.init( wrapper );
			let options = JSON.parse(JSON.stringify( kommonitorDiagramHelperService.getGeoMapChartOptions() ));
			console.log("echarts map options: ", options);
			// overwrite standard options based on information form pageElement (config)
			// this creates different types of maps
			options.title.show = false;
			options.grid = undefined;
			options.visualMap.axisLabel = { "fontSize": 10 };
			options.toolbox.show = false;
			options.visualMap.left = "right"
			if(!options.geo) {
				options.geo = {};
			}
			options.geo.roam = false; //TODO do we want this?
			if(pageElement.classify) {
				//TODO
			}
			// change style for individual features

			if(! options.regions) {
				options.regions = [];

			}

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

		$scope.createPageElement_BarChartDiagram = function(wrapper, pageElement) {
			let barChart = echarts.init( wrapper );
			let options = kommonitorDiagramHelperService.getBarChartOptions();
			options.xAxis.name = ""; //remove title
			options.title.textStyle.fontSize = 12;
			options.title.text = "Ranking";
			options.yAxis.axisLabel = { "fontSize": 10 };
			options.title.show = true;
			options.grid.top = 35;
			options.grid.bottom = 5;
			options.toolbox.show = false;
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

		$scope.calculateOverallAvg = function(indicator, timestamp) {
			// calculate avg from geoJSON property, which should be the currently selected spatial unit
			let data = indicator.geoJSON.features.map( feature => {
				return feature.properties["DATE_" + timestamp];
			})
			let sum = data.reduce( (prev, current) => prev + current)
			console.log(sum);
			let avg = sum / indicator.geoJSON.features.length;
			avg = Math.round(avg * 100) / 100; // 2 decimal places
			return avg;
		}

	}
]})