angular.module('reportingIndicatorAdd').component('reportingIndicatorAdd', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingIndicatorAdd/reporting-indicator-add.template.html",
	controller : ['$scope', '$http', '$timeout', '$interval', '__env', 'kommonitorDataExchangeService', 'kommonitorDiagramHelperService', 'kommonitorVisualStyleHelperService',
	function ReportingIndicatorAddController($scope, $http, $timeout, $interval, __env, kommonitorDataExchangeService, kommonitorDiagramHelperService, kommonitorVisualStyleHelperService) {

		$scope.template = undefined;
		$scope.untouchedTemplateAsString = "";
		
		$scope.indicatorNameFilter = "";
		$scope.poiNameFilter = "";
		$scope.availableIndicators = [];
		$scope.selectedIndicator = undefined;
		$scope.selectedPoiLayer = undefined;

		$scope.availableFeaturesBySpatialUnit = {};
		$scope.selectedSpatialUnit = undefined;
		$scope.selectedAreas = [];
		$scope.selectedSpatialUnitsMultiselect = undefined

		$scope.selectedTimestamps = [];
		$scope.indexOfFirstAreaSpecificPage = undefined;
		$scope.dateSlider = undefined;
		$scope.absoluteLabelPositions = [];
		$scope.updatingLeafletMaps = false;
		$scope.echartsOptions = {
			map: {
				// "2017-12-31": ...
				// "2018-12-31": ...
			},
			bar: {
				// "2017-12-31": ...
				// "2018-12-31": ...
			},
			line: {}, // no timestamp needed here
		}
		
		$scope.loadingData = false;
		$scope.diagramsPrepared = false;

		$scope.isochronesTypeOfMovementMapping = {
			"foot-walking": "Fußgänger",
			"driving-car": "Auto",
			"cycling-regular": "Fahrrad",
			"wheelchair": "Barrierefrei",
			"buffer": "Puffer"
		}

		// used to track template pages instead of using $$hashkey
		$scope.templatePageIdCounter = 1;
		
		// internal array changes do not work with ng-change
		$scope.$watchCollection('selectedAreas', function(newVal) {
			$scope.onSelectedAreasChanged(newVal)
		});

		$scope.onSelectedAreasChanged = function(newVal) {
			if( typeof($scope.template) === "undefined") return;
			$scope.loadingData = true;
			// to make things easier we remove all area-specific pages and recreate them using newVal
			// this approach is not optimized for performance and might have to change in the future

			// remove all area-specific pages
			$scope.template.pages = $scope.template.pages.filter( page => {
				return !page.hasOwnProperty("area")
			});

			if($scope.template.name === "A4-landscape-timestamp")
				$scope.updateAreasForTimestampTemplates(newVal)
			if($scope.template.name === "A4-landscape-timeseries")
				$scope.updateAreasForTimeseriesTemplates(newVal)
			if($scope.template.name === "A4-landscape-reachability")
				$scope.updateAreasForReachabilityTemplates(newVal)


			function updateDiagrams() {
				if($scope.diagramsPrepared) {
					$interval.cancel(updateDiagramsInterval); // code below still executes once
				} else {
					return;
				}
	
				// diagrams are prepared, but dom has to be updated first, too
				$timeout(async function() {
					// we could filter the geoJson here to only include selected areas
					// but for now we get all areas and filter them out after
					await $scope.initializeAllDiagrams();
					if(!$scope.updatingLeafletMaps) {
						$scope.loadingData = false;
					}
				});
			}
	
			let updateDiagramsInterval = $interval(updateDiagrams, 0, 100)
		}


		$scope.updateAreasForTimestampTemplates = function(newVal) {
			let pagesToInsertPerTimestamp = [];
			for(let area of newVal) {
				// get page to insert from untouched template
				let pageToInsert = angular.fromJson($scope.untouchedTemplateAsString).pages[ $scope.indexOfFirstAreaSpecificPage ];
				pageToInsert.area = area.name;
				pageToInsert.id = $scope.templatePageIdCounter++;
				pagesToInsertPerTimestamp.push(pageToInsert);
			}

			// sort alphabetically by area name
			pagesToInsertPerTimestamp.sort( (a, b) => {
				let textA = a.area.toLowerCase();
				let textB = b.area.toLowerCase();
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
						titleEl.text = $scope.selectedIndicator.indicatorName + " [" + $scope.selectedIndicator.unit + "]";
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
				pagesToInsertPerTimestamp = JSON.parse(JSON.stringify(pagesToInsertPerTimestamp));
				for(let page of pagesToInsertPerTimestamp)
					page.id = $scope.templatePageIdCounter++;
				// no timestamp selected, which makes inserting easier
				$scope.template.pages.splice($scope.indexOfFirstAreaSpecificPage, 0, ...pagesToInsertPerTimestamp)
			}
		}

		$scope.updateAreasForTimeseriesTemplates = function(newVal) {
			let pagesToInsert = [];
			for(let area of newVal) {
				// get page to insert from untouched template
				let pageToInsert = angular.fromJson($scope.untouchedTemplateAsString).pages[ $scope.indexOfFirstAreaSpecificPage ];
				pageToInsert.area = area.name;
				pageToInsert.id = $scope.templatePageIdCounter++;
				pagesToInsert.push(pageToInsert);
			}

			// sort alphabetically by area name
			pagesToInsert.sort( (a, b) => {
				let textA = a.area.toLowerCase();
				let textB = b.area.toLowerCase();
				return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
			});

			// since we are dealing with a timeseries we don't have to care about inserting area-pages multiple times for different timestamps
			// we do it only once

			// setup pages before inserting
			for(let pageToInsert of pagesToInsert) {

				let titleEl = pageToInsert.pageElements.find( el => {
					return el.type === "indicatorTitle-landscape"
				});
				titleEl.text = $scope.selectedIndicator.indicatorName + " [" + $scope.selectedIndicator.unit + "]";
				if(pageToInsert.area) {
					titleEl.text += ", " + pageToInsert.area
				}
				titleEl.isPlaceholder = false;

				let dateEl = pageToInsert.pageElements.find( el => {
					return el.type === "dataTimeseries-landscape"
				});
				let includeInBetweenValues = false
				let dsValues = $scope.getFormattedDateSliderValues(includeInBetweenValues);
				dateEl.text = dsValues.from + " - " + dsValues.to;
				dateEl.isPlaceholder = false;

				// diagrams have to be inserted later because the div element does not yet exist
			}

			// insert area-specific pages
			pagesToInsert= JSON.parse(JSON.stringify(pagesToInsert));
			for(let page of pagesToInsert)
				page.id = $scope.templatePageIdCounter++;
			$scope.template.pages.splice($scope.indexOfFirstAreaSpecificPage, 0, ...pagesToInsert)
		}

		$scope.updateAreasForReachabilityTemplates = function(newVal) {
			// we only have one timestamp here (the most recent one)
			let pagesToInsert = [];
			for(let area of newVal) {
				// get page to insert from untouched template
				let pageToInsert = angular.fromJson($scope.untouchedTemplateAsString).pages[ $scope.indexOfFirstAreaSpecificPage ];
				pageToInsert.area = area.name;
				pageToInsert.id = $scope.templatePageIdCounter++;
				pagesToInsert.push(pageToInsert);
			}

			// sort alphabetically by area name
			pagesToInsert.sort( (a, b) => {
				textA = a.area.toLowerCase();
				textB = b.area.toLowerCase();
				return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
			});

			// we select the most recent timestamp programmatically and don't allow user to change it, so this should be 1 here
			if($scope.selectedTimestamps.length === 1) {

				// setup pages before inserting
				for(let pageToInsert of pagesToInsert) {

					let titleEl = pageToInsert.pageElements.find( el => {
						return el.type === "indicatorTitle-landscape"
					});
					titleEl.text = "Entfernungen für " + $scope.selectedPoiLayer.datasetName;
					if(pageToInsert.area) {
						titleEl.text += ", " + pageToInsert.area
					}
					titleEl.isPlaceholder = false;

					let dateEl = pageToInsert.pageElements.find( el => {
						return el.type === "reachability-subtitle-landscape"
					});

					dateEl.text = $scope.selectedTimestamps[0].name + ", " + $scope.isochronesTypeOfMovementMapping[$scope.typeOfMovement];
					dateEl.isPlaceholder = false;

					// diagrams have to be inserted later because the div element does not yet exist
				}

				// create a deep copy so we can assign new ids
				pagesToInsert = JSON.parse(JSON.stringify(pagesToInsert));
				let numberOfPagesToReplace = $scope.template.pages.length-2 // basically everything until the end of the template (-2 because we start at second page)
				// insert area-specific pages
				for(let page of pagesToInsert)
					page.id = $scope.templatePageIdCounter++;

				$scope.template.pages.splice($scope.indexOfFirstAreaSpecificPage, numberOfPagesToReplace, ...pagesToInsert)
			}
		}



		// internal array changes do not work with ng-change
		$scope.$watchCollection('selectedTimestamps', function(newVal, oldVal) {

			if( typeof($scope.template) === "undefined") return;
			$scope.loadingData = true;
			let tab4 = document.querySelector("#reporting-add-indicator-tab5");

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
							let textA = a.area.toLowerCase();
							let textB = b.area.toLowerCase();
							return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
						})

						pagesToInsert.splice($scope.indexOfFirstAreaSpecificPage, 1, ...areaSpecificPages)

						// setup pages before inserting them
						for(let pageToInsert of pagesToInsert) {
							for(let pageElement of pageToInsert.pageElements) {

								if(pageElement.type === "indicatorTitle-landscape") {
									pageElement.text = $scope.selectedIndicator.indicatorName + " [" + $scope.selectedIndicator.unit + "]";
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
					let cleanTemplate = angular.fromJson($scope.untouchedTemplateAsString);
					for(let page of cleanTemplate.pages) {
						page.id = $scope.templatePageIdCounter++;
					}
					$scope.template = cleanTemplate;
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

			// There is one more special casw for the reachbility template, where we only have one timestamp set at all times,
			// but that one might change if we change the spatial unit
			if(newVal.length === oldVal.length && newVal.length === 1 && newVal[0].name != oldVal[0].name) {
				// simply update the timestamp on all pages
				for(let page of $scope.template.pages) {
					for(let pageElement of page.pageElements) {
						if(pageElement.type === "reachability-subtitle-landscape") {
							pageElement.text = newVal[0].name + ", " + $scope.isochronesTypeOfMovementMapping[$scope.typeOfMovement]
							if($scope.selectedIndicator)
								pageElement.text += ", " + $scope.selectedIndicator.indicatorName;
						}
						break;
					}
				}
			}

			function updateDiagrams() {
				if($scope.diagramsPrepared) {
					$interval.cancel(updateDiagramsInterval); // code below still executes once
				} else {
					return;
				}

				$timeout(async function() {
					// indicator selection is optional in reachability template only
					if($scope.selectedIndicator) {
						for(let timestamp of $scope.selectedTimestamps) {
							let classifyUsingWholeTimeseries = false;
							$scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, timestamp.name, classifyUsingWholeTimeseries);
		
						}
					} else {
						$scope.reachabilityTemplateGeoMapOptions = $scope.prepareReachabilityEchartsMap();
					}
					
					await $scope.initializeAllDiagrams();
					if(!$scope.updatingLeafletMaps) {
						$scope.loadingData = false;
					}
				});
				
			}

			let updateDiagramsInterval = $interval(updateDiagrams, 0, 100)
		});

		$scope.$on("reportingConfigureNewIndicatorShown", function(event, data) {
			$scope.initialize(data);
		});

		$scope.initialize = function(data) {
			$scope.loadingData = true;
			let [template, indicators] = data;
			let indicatorNames = indicators.map ( el => el.indicatorName )
			// deep copy template before any changes are made.
			// this is needed when additional timestamps are inserted.
			$scope.untouchedTemplateAsString = angular.toJson(template)
			// give each page a unique id to track it by in ng-repeat
			for(let page of template.pages) {
				page.id = $scope.templatePageIdCounter++;
			}
			$scope.template = template;
			console.log(template);

			if($scope.template.name === "A4-landscape-timestamp")
				$scope.indexOfFirstAreaSpecificPage = 3;
			if($scope.template.name === "A4-landscape-timeseries")
				$scope.indexOfFirstAreaSpecificPage = 4;
			if($scope.template.name === "A4-landscape-reachability")
				$scope.indexOfFirstAreaSpecificPage = 1;

			// disable tabs to force user to pick a poi-layer / indicator first
			let tabs = document.querySelector("#reporting-add-indicator-tab-list");
			let tabPanes = document.querySelectorAll("#reporting-add-indicator-tab-content > .tab-pane");
			let tabChildren = Array.from(tabs.children)
			for(let [idx, tab] of tabChildren.entries()) {
				let id = tab.id.at(-1)
				if( ($scope.template.name === "A4-landscape-reachability" && id==1) || // pois
						($scope.template.name !== "A4-landscape-reachability" && id==2) ) { // indicators
					tab.classList.add("active");
					tabPanes[idx].classList.add("active");
				} else {
					tab.classList.remove("active");
					tabPanes[idx].classList.remove("active");
				}
			}

			$scope.initializeDualLists();

			if($scope.template.name === "A4-landscape-reachability") {
				$scope.queryGeoresources()
				$scope.queryIndicators()
			} else {
				$scope.queryIndicators()
					.then( function () {
						$scope.removeAlreadyAddedIndicators(indicatorNames)
					});
			}
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
			
			// build request
			// query public endpoint for now, this might change once user role administration is added to reporting
			let url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators"
			
			// send request
			return await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
					// save to scope
					$scope.availableIndicators = response.data;
				}, function errorCallback(error) {
					$scope.loadingData = false;
					kommonitorDataExchangeService.displayMapApplicationError(error);
					console.error(response.statusText);
			});
		};

		$scope.queryGeoresources = async function() {
			
			// build request
			// query public endpoint for now, this might change once user role administration is added to reporting
			let url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/georesources"
			
			// send request
			return await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
					// save to scope
					$scope.availablePoiLayers = response.data.filter( georesource => {
						return georesource.isPOI;
					});
					$scope.loadingData = false;
				}, function errorCallback(error) {
					$scope.loadingData = false;
					kommonitorDataExchangeService.displayMapApplicationError(error);
					console.error(response.statusText);
			});
		};

		$scope.queryAllSpatialUnits = async function() {
			// build request
			// query public endpoint for now, this might change once user role administration is added to reporting
			let url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/spatial-units"
			
			// send request
			return await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
					// save to scope
					return response.data;
				}, function errorCallback(error) {
					$scope.loadingData = false;
					kommonitorDataExchangeService.displayMapApplicationError(error);
					console.error(response.statusText);
			});
		}


		$scope.onSpatialUnitChanged = async function(selectedSpatialUnit) {
			$scope.loadingData = true;
			$("#reporting-spatialUnitChangeWarning").hide();
			$scope.timeseriesAdjustedOnSpatialUnitChange = false;
			await $scope.updateAreasInDualList()
			let validTimestamps = []
			// There might be different valid timestamps for the new spatial unit.
			if($scope.selectedIndicator) {
				validTimestamps = getValidTimestampsForSpatialUnit( selectedSpatialUnit );
			
				// Check if the currently selected timestamps are also available for the new spatial unit.
				// If one is not, deselect is and show an info to user
				let selectedTimestamps_old = [...$scope.selectedTimestamps];
				$scope.selectedTimestamps = $scope.selectedTimestamps.filter( el => {
					return validTimestamps.includes(el.name);
				});
				// if any timestamp was deselected show a warning alert
				// except for reachability template, it doesn't matter there
				if(selectedTimestamps_old.length > $scope.selectedTimestamps.length && $scope.template.name != "A4-landscape-reachability") {
					$("#reporting-spatialUnitChangeWarning").show();
				}
			} else {
				// without selected indicator we have to fall back to the last update of the new spatial unit
				let mostRecentTimestampName = $scope.selectedSpatialUnit.metadata.lastUpdate;
				validTimestamps.push(mostRecentTimestampName)
			}
			
			if($scope.template.name === "A4-landscape-timeseries") {
				// Similar procedure as with timestamps
				let oldTimeseries = $scope.getFormattedDateSliderValues(true);
				
				let from = new Date($scope.dateSlider.result.from_value);
				let to = new Date($scope.dateSlider.result.to_value);
				let filteredTimeseries = validTimestamps.filter( el => {
					let date = new Date(el);
					date.setHours(0); // remove time-offset...TODO is there a better way?
					return from <= date && date <= to;
				});

				let isEqualTimeseries = (oldTimeseries.dates.length == filteredTimeseries.length) && oldTimeseries.dates.every(function(element, index) {
					return element === filteredTimeseries[index];
				});
				
				if( !isEqualTimeseries) {
					// timeseries changed
					$("#reporting-spatialUnitChangeWarning").show();
					// try to set slider to previously selected timestamps
					if(validTimestamps.includes(oldTimeseries.from) && validTimestamps.includes(oldTimeseries.to)) {
						$scope.dateSlider = $scope.initializeDateRangeSlider( validTimestamps, filteredTimeseries[0], filteredTimeseries.at(-1));	
					} else {
						$scope.dateSlider = $scope.initializeDateRangeSlider( validTimestamps );	
						$scope.timeseriesAdjustedOnSpatialUnitChange = true; // show additional text in warning alert
					}
				} else {
					// the selected part of the timeseries has the same dates so we don't have to show a warning
					// but the timeseries could still include older or newer dates
					$scope.dateSlider = $scope.initializeDateRangeSlider( validTimestamps, filteredTimeseries[0], filteredTimeseries.at(-1));
				}
			}
			
			// prepare arrays for updateDualList
			validTimestamps = validTimestamps.map( el => {
				return {
					properties: {
						NAME: el
					}
				}
			});
			let timestampsToSelect = $scope.selectedTimestamps.map( el => {
				return {
					properties: {
						NAME: el.name
					}
				}
			});
			
			$scope.updateDualList($scope.dualListTimestampsOptions, validTimestamps, timestampsToSelect);

			
			
			// fire $watch('selectedAreas') function manually to remove pages
			$scope.selectedAreas = [];
			$scope.onSelectedAreasChanged( $scope.selectedAreas , undefined)
			// updateAreasInDualList does not trigger diagram updates
			// we have the wrong geometries set at this point, causing area selection to fail.
			// echarts requires properties.name to be present, create it from properties.NAME unless it exists
			let features;
			if($scope.template.name == "A4-landscape-reachability") {
				if($scope.selectedIndicator) {
					features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitName ];
				} else {
					features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitLevel ];
				}
				features = $scope.createLowerCaseNameProperty(features);
				$scope.geoJsonForReachability = { features: features }
			} else {
				features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitName ];
				features = $scope.createLowerCaseNameProperty(features);
				let geoJSON = { features: features }
				$scope.selectedIndicator.geoJSON = geoJSON;
			}
			

			// no need to check if diagrams are prepared here since we have to prepare them again anyway
			$timeout(async function() {
				// prepare diagrams for all selected timestamps with all features
				// Preparing all diagrams is not possible without an indicator, which might happen in the reachability template
				// User selects a poi layer first and we set the most recent timestamp programmatically, triggering this function without selected Indicator
				// We only need an echarts geoMap to show isochrones, POIs and spatial unit borders
				if($scope.selectedIndicator) {
					if($scope.template.name === "A4-landscape-reachability") {
						$scope.reachabilityTemplateGeoMapOptions = $scope.prepareReachabilityEchartsMap();
					} else if ($scope.template.name === "A4-landscape-timeseries") {
						let values = $scope.getFormattedDateSliderValues(true);
						let classifyUsingWholeTimeseries = false;
						$scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, values.to, classifyUsingWholeTimeseries);
						// prepare diagrams again for most recent timestamp of slider and for whole timeseries (changes).
						classifyUsingWholeTimeseries = true;
						$scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, values.to, classifyUsingWholeTimeseries);
					} else {
						for(let timestamp of $scope.selectedTimestamps) {
							let classifyUsingWholeTimeseries = false;
							$scope.prepareDiagrams($scope.selectedIndicator, selectedSpatialUnit, timestamp.name, classifyUsingWholeTimeseries);
						}	
					}
				} else {
					$scope.reachabilityTemplateGeoMapOptions = $scope.prepareReachabilityEchartsMap();
				}

				await $scope.initializeAllDiagrams();
				if(!$scope.updatingLeafletMaps) {
					$scope.loadingData = false;
				}
			});
		}

		/**
		 * Updates the areas dual list data
		 * Queries DataManagement API if needed.
		 */
		$scope.updateAreasInDualList = async function() {
			// this happens for the reachability template on poi selection
			if(typeof($scope.selectedIndicator) === "undefined") {
				let spatialUnit = $scope.selectedSpatialUnit ?
					$scope.selectedSpatialUnit :
					$scope.selectedIndicator.applicableSpatialUnits[0]
				// query spatial unit features using the most recent date
				let data = await $scope.queryFeatures(undefined, $scope.selectedSpatialUnit);
				$scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitLevel] = data.features
				let allAreas = $scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitLevel]
				$scope.updateDualList($scope.dualListAreasOptions, allAreas, undefined) // don't select any areas
			} else {
				let indicator = $scope.selectedIndicator;
			
				let spatialUnit = $scope.selectedSpatialUnit ?
					$scope.selectedSpatialUnit :
					$scope.selectedIndicator.applicableSpatialUnits[0]
				let indicatorId = indicator.indicatorId;

				// on indicator change
				if($scope.availableFeaturesBySpatialUnit.indicatorId != indicator.indicatorId) {
					// clear all cached features
					$scope.availableFeaturesBySpatialUnit = {};
					$scope.availableFeaturesBySpatialUnit.indicatorId = indicatorId;
	
					let data = await $scope.queryFeatures(indicatorId, spatialUnit)
					// save response to scope to avoid further requests
					$scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName] = data.features
				} else {
					// same indicator
					if (!$scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName]) {
						let data = await $scope.queryFeatures(indicatorId, spatialUnit)
						// save response to scope to avoid further requests
						$scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName] = data.features
					}
				}
	
				let allAreas = $scope.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName]
				$scope.updateDualList($scope.dualListAreasOptions, allAreas, undefined) // don't select any areas
	
			}
			
			$timeout(function() {
				$scope.$apply();
			})
		}

		/**
		 * Queries DataManagement API to get features of given indicator.
		 * If no indicator id is provided the spatial unit endpoint is queried
		 * Result is stored to scope to avoid further requests.
		 * @param {*} indicator | selected indicator
		 */
		 $scope.queryFeatures = async function(indicatorId, spatialUnit) {
			// build request
			// query different endpoints depending on if we have an indicator or not
			let url;
			if(!indicatorId) {
				let date = spatialUnit.metadata.lastUpdate.split("-")
				let year = date[0]
				let month = date[1]
				let day = date[2]
				url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
					"/spatial-units/" + spatialUnit.spatialUnitId + "/" + year + "/" + month + "/" + day; 
			} else {
				url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
					"/indicators/" + indicatorId + "/" + spatialUnit.spatialUnitId;
			}
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
								dualListBtnElement = document.querySelectorAll("#reporting-indicator-add-timestamps-dual-list .duallistButton")[0];
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
			}, 500);
		}

		// availableFeaturesBySpatialUnit has to be populated before this method is called.
		// Also it is only called in situations where an indicator is selected.
		function getValidTimestampsForSpatialUnit(spatialUnit) {

			let validTimestamps = []; // result
			// Iterate all features and add all properties that start with "DATE_" to 'validTimestamps'
			let features = $scope.availableFeaturesBySpatialUnit[ spatialUnit.spatialUnitName ];
			if(!features) {
				let error = new Error("Tried to get valid timestamps but no features were cached.")
				kommonitorDataExchangeService.displayMapApplicationError(error.message)
			}
			for(let feature of features) {
				let props = Object.keys(feature.properties)
				props = props.filter( prop => {
					return prop.startsWith("DATE_");
				})
	
				for(let prop of props) {
					let timestamp = prop.replace("DATE_", "")
					if( !validTimestamps.includes(timestamp) ) {
						validTimestamps.push(timestamp)
					}
				}
			}
			return validTimestamps;
		}

		$scope.addIsochronesBboxProperties = function() {
			// Calculates and adds a bbox property for each feature and for overall layer
			// These do not exist if the type of movement is "buffer" ( = isochrones not generated by ors)

			let overallBbox = [];
			let features = $scope.isochrones.features;
			for(var i=0; i<$scope.isochrones.features.length; i++) {
				
				// calculate bbox for feature
				if(!features[i].bbox || !features[i].bbox.length) {
					features[i].properties.bbox = turf.bbox(features[i]);
				}

				// check if we have to adjust overall bbox
				if(overallBbox.length === 0) {
					overallBbox.push(...features[i].properties.bbox)
				} else {
					let bbox = features[i].properties.bbox;
					overallBbox[0] = (bbox[0] < overallBbox[0]) ? bbox[0] : overallBbox[0];
					overallBbox[1] = (bbox[1] < overallBbox[1]) ? bbox[1] : overallBbox[1];
					overallBbox[2] = (bbox[2] > overallBbox[2]) ? bbox[2] : overallBbox[2];
					overallBbox[3] = (bbox[3] > overallBbox[3]) ? bbox[3] : overallBbox[3];
				}
			}

			$scope.isochrones.bbox = overallBbox;
		}

		$scope.addIsochronesCenterLocationProperty = function() {
			$scope.isochrones.centerLocations = [];
			// We probably have multiple isochrones with the same center.
			// Keep track of the value property and only calculate center coords once per isochrones group.
			let firstIsochroneRangeValue = $scope.isochrones.features[0].properties.value;
			for(let feature of $scope.isochrones.features) {
				if(feature.properties.value === firstIsochroneRangeValue) {
					// bbox format: [lower left lon, lower left lat, upper right lon, upper right lat]
					let bbox = feature.properties.bbox;
					let centerLon = bbox[0] + ((bbox[2] - bbox[0]) / 2);
					let centerLat = bbox[1] + ((bbox[3] - bbox[1]) / 2);
					$scope.isochrones.centerLocations.push([centerLon, centerLat])
				}
				
			}
		}

		$scope.onPoiLayerSelected = async function(poiLayer) {

			$scope.absoluteLabelPositions = [];
			$scope.diagramsPrepared = false;
			$scope.selectedPoiLayer = poiLayer

			// get a new template (in case another poi layer was selected previously)
			$scope.template = $scope.getCleanTemplate();

			$scope.isochrones = await $scope.loadIsochrones();
			
			if(checkNestedPropExists($scope.isochrones, 'info', 'query', 'profile')) {
				$scope.typeOfMovement = $scope.isochrones.info.query.profile;
			} else {
				$scope.typeOfMovement = "buffer";
			}
			// for type buffer the bbox field doesn't exist, so we have to create it.
			if(!$scope.isochrones.bbox)
				$scope.addIsochronesBboxProperties()
			if(!$scope.isochrones.centerLocations)
				$scope.addIsochronesCenterLocationProperty()

			// give each isochrone a unique id so we can reference it from the echarts series data
			for(let feature of $scope.isochrones.features) {
				feature.properties.id = feature.properties.group_index + "-" + feature.properties.value
			}

			$scope.isochronesSeriesData = $scope.convertIsochronesToSeriesData($scope.isochrones);

			// Indicator might not be selected at this point
			// We get information about all available spatial units (instead of applicable ones)
			// Then we select the highest one by default
			let spatialUnits = await $scope.queryAllSpatialUnits();
			$scope.allSpatialUnitsForReachability = spatialUnits; // needed for spatial unit selection in 3rd tab
			let highestSpatialUnit = spatialUnits.filter( unit => {
				return unit.nextUpperHierarchyLevel === null;
			});
			if( !$scope.selectedSpatialUnit) {
				$scope.selectedSpatialUnit = highestSpatialUnit[0];
			}

			let mostRecentTimestampName = $scope.selectedSpatialUnit.metadata.lastUpdate;
			$scope.selectedTimestamps = [{
				category: mostRecentTimestampName,
				name: mostRecentTimestampName
			}];
			
			await $scope.updateAreasInDualList(); // this populates $scope.availableFeaturesBySpatialUnit

			
			// update information in preview
			for(let page of $scope.template.pages) {
				for(let el of page.pageElements) {
					if(el.type === "indicatorTitle-landscape") {
						el.text = "Entfernungen für " + $scope.selectedPoiLayer.datasetName;
						el.isPlaceholder = false;
						// no area-specific pages in template since diagrams are not prepared yet
						// and area/timestamp/timeseries changes are done after that
					}

					if(el.type === "reachability-subtitle-landscape") {
						el.text = $scope.selectedTimestamps[0].name + ", " + $scope.isochronesTypeOfMovementMapping[$scope.typeOfMovement];
						if($scope.selectedIndicator)
							el.text += ", " + $scope.selectedIndicator.indicatorName;
						el.isPlaceholder = false
					}
				}
			}

			// get all features of largest spatial unit
			let features;
			if($scope.selectedIndicator) {
				features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitName ]
			} else {
				features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitLevel ]
			}
			features = $scope.createLowerCaseNameProperty(features);
			// we have no indicator so we store the geometries directly on the scope
			$scope.geoJsonForReachability = {
				features: features
			}

			// Preparing all diagrams is not possible without an indicator
			// We only need an echarts geoMap to show isochrones, POIs and spatial unit borders
			$scope.reachabilityTemplateGeoMapOptions = $scope.prepareReachabilityEchartsMap();

			// select all areas by default
			let allAreas;
			if($scope.selectedSpatialUnit.spatialUnitName) {
				allAreas = $scope.availableFeaturesBySpatialUnit[$scope.selectedSpatialUnit.spatialUnitName];
			} else {
				allAreas = $scope.availableFeaturesBySpatialUnit[$scope.selectedSpatialUnit.spatialUnitLevel];
			}
				$scope.updateDualList($scope.dualListAreasOptions, allAreas, allAreas);

			let allTabs = document.querySelectorAll("#reporting-add-indicator-tab-list li")
			for(let tab of allTabs) {
				$scope.enableTab(tab);
			}
		}

	
		function calculateOverallBoundingBoxFromGeoJSON(features) {
			let result = [];
			for(var i=0; i<features.length; i++) {
			   // check if we have to modify our overall bbox (result)
			   if(result.length === 0) { // for first feature
				result.push(...features[i].properties.bbox);
				continue;
			  } else {
				// all other features
				let bbox = features[i].properties.bbox;
				result[0] = (bbox[0] < result[0]) ? bbox[0] : result[0];
				result[1] = (bbox[1] < result[1]) ? bbox[1] : result[1];
				result[2] = (bbox[2] > result[2]) ? bbox[2] : result[2];
				result[3] = (bbox[3] > result[3]) ? bbox[3] : result[3];
			  }
			}
			return result;
		  };


		$scope.setMostRecentIndicatorDataToReachabilityMap = function(seriesOptions) {
			let mostRecentTimestampName = $scope.selectedIndicator.applicableDates.at(-1);
			let features;
			if($scope.selectedSpatialUnit.spatialUnitName) {
				features = $scope.availableFeaturesBySpatialUnit[$scope.selectedSpatialUnit.spatialUnitName]
			} else {
				features = $scope.availableFeaturesBySpatialUnit[$scope.selectedSpatialUnit.spatialUnitLevel]
			}
			let newSeriesData = features.map( feature => {
				let name = feature.properties.NAME
				let value = feature.properties["DATE_" + mostRecentTimestampName]
				value = Math.round(value * 100) / 100;
				return {
					name: name,
					value: value
				}
			});
			seriesOptions.data = newSeriesData;
			return seriesOptions;
		}

		$scope.resetOptionalIndicator = function() {
			
			if(!$scope.selectedIndicator) {
				return;
			}

			$scope.selectedIndicator = undefined;
			// since we don't have an indicator selected anymore we reset the spatial unit
			$scope.selectedSpatialUnit = $scope.allSpatialUnitsForReachability.filter( spatialUnit => {
				return spatialUnit.spatialUnitLevel === $scope.selectedSpatialUnit.spatialUnitName;
			})[0];
			
			
			// let filter = $scope.selectedIndicator.applicableSpatialUnits.filter( spatialUnit => {
			// 	return spatialUnit.spatialUnitName === $scope.selectedSpatialUnit.spatialUnitLevel;
			// })
			// $scope.selectedSpatialUnit = filter[0];

			for(let page of $scope.template.pages) {
				for(let pageElement of page.pageElements) {
					if(pageElement.type === "map") {
						let domNode = document.querySelector("#reporting-addIndicator-page-" + $scope.template.pages.indexOf(page) + "-map")
						let map = echarts.getInstanceByDom(domNode)
						let options = map.getOption();
						// remove indicator data
						options.series[0].data = [];
						options.series[0].label.formatter = '{b}';
						map.setOption(options, {
							replaceMerge: ['series']
						});
					}

					if(pageElement.type === "reachability-subtitle-landscape") {
						pageElement.text = $scope.selectedTimestamps[0].name;
						pageElement.text += ", " + $scope.isochronesTypeOfMovementMapping[$scope.typeOfMovement];
						pageElement.isPlaceholder = false
					}
				}
			}
		}

		$scope.handleIndicatorSelectForReachability = async function(indicator) {
			$scope.selectedIndicator = indicator;
			let indicatorId = $scope.selectedIndicator.indicatorId;
			let featureCollection = await $scope.queryFeatures(indicatorId, $scope.selectedSpatialUnit);
			if(!$scope.selectedSpatialUnit.spatialUnitName) {
				// set the applicable spatial unit from the indicator as selected spatial unit
				let filter = $scope.selectedIndicator.applicableSpatialUnits.filter( spatialUnit => {
					return spatialUnit.spatialUnitName === $scope.selectedSpatialUnit.spatialUnitLevel;
				})
				if(filter && filter.length) {
					$scope.selectedSpatialUnit = filter[0];
				}
			}

			$scope.availableFeaturesBySpatialUnit[$scope.selectedSpatialUnit.spatialUnitName] = featureCollection.features;
			$scope.selectedIndicator.geoJSON = featureCollection;
			$scope.selectedIndicator.geoJSON.features = $scope.createLowerCaseNameProperty($scope.selectedIndicator.geoJSON.features);
			for(let feature of $scope.selectedIndicator.geoJSON.features) {
				let bbox = turf.bbox(feature); // calculate bbox for each feature
				feature.properties.bbox = bbox;
			}
			
			for(let page of $scope.template.pages) {
				for(let pageElement of page.pageElements) {
					if(pageElement.type === "map") {
						let domNode = document.querySelector("#reporting-addIndicator-page-" + $scope.template.pages.indexOf(page) + "-map")
						let map = echarts.getInstanceByDom(domNode)
						let options = map.getOption();
						let seriesOptions = $scope.setMostRecentIndicatorDataToReachabilityMap(options.series[0])
						options.series[0] = seriesOptions;
						options.series[0].label.formatter = '{b}\n{c}';
						map.setOption(options, {
							replaceMerge: ['series']
						});
					}

					if(pageElement.type === "reachability-subtitle-landscape") {
						pageElement.text = $scope.selectedTimestamps[0].name;
						pageElement.text += ", " + $scope.isochronesTypeOfMovementMapping[$scope.typeOfMovement];
						pageElement.text += ", " + indicator.indicatorName;
						pageElement.isPlaceholder = false;
					}
				}
			}
			$scope.$apply();

		}
	
		$scope.onIndicatorSelected = async function(indicator) {
			$scope.loadingData = true;
			if($scope.template.name === "A4-landscape-reachability") {
				$scope.handleIndicatorSelectForReachability(indicator);
				return;
			}

			$scope.selectedIndicator = undefined;
			$scope.selectedTimestamps = [];
			$scope.selectedAreas = [];
			$scope.selectedSpatialUnit = undefined;
			$scope.availableFeaturesBySpatialUnit = {};
			$scope.absoluteLabelPositions = [];
			$scope.echartsOptions = {
				map: {},
				bar: {},
				line: {}
			}
			$scope.diagramsPrepared = false;
			// set indicator manually.
			// if we use ng-model it gets converted to string instead of an object
			$scope.selectedIndicator = indicator;

			// get a new template (in case another indicator was selected previously)
			$scope.template = $scope.getCleanTemplate();
			
			// set spatial unit to highest available one
			$scope.selectedSpatialUnit = $scope.selectedIndicator.applicableSpatialUnits[0];

			await $scope.updateAreasInDualList(); // this populates $scope.availableFeaturesBySpatialUnit

			// select most recent timestamp that is valid for the largest spatial unit
			let dates = $scope.selectedIndicator.applicableDates;
			let timestampsForSelectedSpatialUnit = getValidTimestampsForSpatialUnit( $scope.selectedSpatialUnit);
			timestampsForSelectedSpatialUnit.sort();
			
			let availableTimestamps = dates
				.filter( name => { // filter dates to only show the ones valid for selected spatial unit 
					return timestampsForSelectedSpatialUnit.includes( name )
				}).map( name => { // then convert all timestamps to required format ("feature")
					return { "properties": { "NAME": name } }
			})

			let mostRecentTimestampName = timestampsForSelectedSpatialUnit.at(-1);
			let mostRecentTimestamp = availableTimestamps.filter( el => {
				return el.properties.NAME === mostRecentTimestampName;
			})
			
			if($scope.template.name === "A4-landscape-timeseries") {
				$scope.dateSlider = $scope.initializeDateRangeSlider( timestampsForSelectedSpatialUnit );
			}
			// update information in preview
			for(let page of $scope.template.pages) {
				for(let el of page.pageElements) {
					if(el.type === "indicatorTitle-landscape") {
						el.text = indicator.indicatorName + " [" + indicator.unit + "]";
						el.isPlaceholder = false;
						// no area-specific pages in template since diagrams are not prepared yet
						// and area/timestamp/timeseries changes are done after that
					}

					if(el.type === "dataTimestamp-landscape") {
						el.text = mostRecentTimestampName;
						el.isPlaceholder = false
					}

					if(el.type === "dataTimeseries-landscape") {
						let dsValues = $scope.getFormattedDateSliderValues()
						el.text = dsValues.from + " - " + dsValues.to
						el.isPlaceholder = false
					}
				}
			}

			// get all features of largest spatial unit
			let features = $scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitName ]
			features = $scope.createLowerCaseNameProperty(features);
			let geoJson = {
				features: features
			}

			// add new prop to indicator metadata, because it is expected that way by kommonitorVisualStyleHelperService
			// used in prepareDiagrams
			$scope.selectedIndicator.geoJSON = geoJson;
			let classifyUsingWholeTimeseries = false;
			$scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, mostRecentTimestampName, classifyUsingWholeTimeseries);
			if($scope.template.name === "A4-landscape-timeseries") {
				// also prepare the dynamic version of the indicator for displaying changes
				const indicatorTypeBackup = $scope.selectedIndicator.indicatorType;
				$scope.selectedIndicator.indicatorType = "RELATIVE";
				classifyUsingWholeTimeseries = true;
				$scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, mostRecentTimestampName, classifyUsingWholeTimeseries);
				$scope.selectedIndicator.indicatorType = indicatorTypeBackup;
			} else {
				$scope.updateDualList($scope.dualListTimestampsOptions, availableTimestamps, mostRecentTimestamp)
			}

			// select all areas by default
			let allAreas = $scope.availableFeaturesBySpatialUnit[$scope.selectedSpatialUnit.spatialUnitName];
			$scope.updateDualList($scope.dualListAreasOptions, allAreas, allAreas);

			let allTabs = document.querySelectorAll("#reporting-add-indicator-tab-list li")
			for(let tab of allTabs) {
				$scope.enableTab(tab);
			}
		}

		$scope.getCleanTemplate = function() {
			let result = angular.fromJson($scope.untouchedTemplateAsString);
			for(let page of result.pages) {
				page.id = $scope.templatePageIdCounter++;
			}
			return result;
		}

		$scope.onBackToOverviewClicked = function() {
			$scope.reset();
			$scope.$emit('reportingBackToOverviewClicked')

		}

		$scope.reset = function() {
			$scope.template = undefined;
			$scope.untouchedTemplateAsString = "";
			$scope.indicatorNameFilter = "";
			$scope.poiNameFilter = "";
			$scope.availableIndicators = [];
			$scope.selectedIndicator = undefined;
			$scope.availableFeaturesBySpatialUnit = {};
			$scope.selectedSpatialUnit = undefined;
			$scope.selectedAreas = [];
			$scope.selectedSpatialUnitsMultiselect = undefined
			$scope.selectedTimestamps = [];
			$scope.indexOfFirstAreaSpecificPage = undefined;
			$scope.echartsOptions = {
				map: {},
				bar: {},
				line: {},
			}
			$scope.loadingData = false;
			$scope.templatePageIdCounter = 1;
			$scope.dateSlider = undefined;

			let tab2 = document.querySelector("#reporting-add-indicator-tab3");
			let tab3 = document.querySelector("#reporting-add-indicator-tab4");
			let tab4 = document.querySelector("#reporting-add-indicator-tab5");
			$scope.disableTab(tab2);
			$scope.disableTab(tab3);
			$scope.disableTab(tab4);
		}

		$scope.onAddNewIndicatorClicked = function() {
			// for each page: add echarts configuration objects to the template
			for(let [idx, page] of $scope.template.pages.entries()) {
				let pageDom = document.querySelector("#reporting-addIndicator-page-" + idx);
				
				for(let pageElement of page.pageElements) {

					let pElementDom;
					if(pageElement.type === "linechart") {
						let arr = pageDom.querySelectorAll(".type-linechart");
						if(pageElement.showPercentageChangeToPrevTimestamp) {
							pElementDom = arr[1];
						} else {
							pElementDom = arr[0];
						}
					} else {
						pElementDom = pageDom.querySelector("#reporting-addIndicator-page-" + idx + "-" + pageElement.type)
					}

					if(pageElement.type === "map" || pageElement.type === "barchart" || pageElement.type === "linechart") {
						let instance = echarts.getInstanceByDom( pElementDom );
						let options = JSON.parse(JSON.stringify( instance.getOption() ));
						pageElement.echartsOptions = options;
					}

					if(pageElement.type === "datatable") {
						// add some properties so we can recreate the table later
						let columnHeaders = pageDom.querySelectorAll("th");
						let columnNames = [];
						for(let header of columnHeaders) {
							columnNames.push(header.innerText);
						}
						pageElement.columnNames = columnNames;
						let tableData = [];
						let rows = pageDom.querySelectorAll("tbody tr");
						for(let row of rows) {
							let rowData = [];
							let fields = row.querySelectorAll("td");
							for(let field of fields) {
								rowData.push(field.innerText);
							}
							tableData.push(rowData);
						}
						pageElement.tableData = tableData; // [ [...], [...], [...] ]
					}
				}
			}
			$scope.template.spatialUnitName = $scope.selectedSpatialUnit.spatialUnitName;
			$scope.template.absoluteLabelPositions = $scope.absoluteLabelPositions;
			$scope.$emit('reportingAddNewIndicatorClicked', [$scope.selectedIndicator, $scope.template])
			$scope.reset();
		}

		$scope.enableTab = function(tab) {
			tab.classList.remove("tab-disabled")
			tab.firstElementChild.removeAttribute("tabindex")
		}

		$scope.disableTab = function(tab) {
			tab.classList.add("tab-disabled")
			tab.firstElementChild.setAttribute("tabindex", "1")
		}

		$scope.loadIsochrones = async function() {
			let result = await $http.get("./config/temp_isochrones.json")
			return result.data;
		}

		// creates and returns a series data array for each range threshold
		$scope.convertIsochronesToSeriesData = function(isochrones) {
			let result = [] // array of series data config objects
			let ranges = []
			if( checkNestedPropExists(isochrones, "info", "query", "profile") ) {
				ranges = isochrones.has.info.query.ranges.split(",")
			} else if( isochrones.hasOwnProperty("features")) { // for buffer
				for(feature of isochrones.features) {
					if(checkNestedPropExists(feature, "properties", "value") && typeof(feature.properties.value) === "number" ) {
						ranges.push(feature.properties.value)
					}
				}
			} 
			if(!ranges || ranges.length === 0) {
				throw new Error("Could not determine ranges from isochrones. Is the format correct?")
			}
			let rangesInt = ranges.map( e => parseInt(e)); // assuming we only get integer values as input here
			let colorArr = [];
			if(ranges.length === 1) colorArr.push("green");
			if(ranges.length === 2) colorArr.push( ...["green", "yellow"] )
			if(ranges.length === 3) colorArr.push( ...["green", "yellow", "red"] )
			if(ranges.length === 4) colorArr.push( ...["green", "yellow", "orange", "red"] )
			// If we have more than five ranges the last color is used again for now. Can be extended if there is need for it.
			if(ranges.length >=  5) colorArr.push( ...["green", "yellow", "orange", "red", "brown"] )
	
			// one series per range value, so we can control the z value and legend display more easily.
			for(let [idx, range] of rangesInt.entries()) {
				if(idx >= colorArr.length) idx = colorArr.length-1;
				let seriesData = [];
				let data = isochrones.features.filter( feature => {
					return feature.properties.value === range; // get features for this range threshold
				}).map( feature => {
					// map them to  echarts format
					return {
						name: feature.properties.id,
						value: feature.properties.value,
						itemStyle: {
							areaColor: colorArr[idx],
							color: colorArr[idx],
							opacity: 0.3
						},
						label: {
							show: false
						},
						emphasis: {
							disabled: true
						}
					}
				})
				seriesData.push(...data)
				result.push(seriesData);
			}
			
			return result;
		}

		$scope.createMapForReachability = async function(wrapper, page, pageElement) {
			
			let options = JSON.parse(JSON.stringify( $scope.reachabilityTemplateGeoMapOptions ));
			// add indictor data if it is available
			if($scope.selectedIndicator) {
				options.series[0] = $scope.setMostRecentIndicatorDataToReachabilityMap(options.series[0])
				options.series[0].label.formatter = '{b}\n{c}';
			}
			
			// register a new echarts map with a unique name (needed when filtering by area)
			// check if there is a map registered for this combination, if not register one with all features
			let mapName = $scope.selectedPoiLayer.datasetName + "_" + $scope.selectedSpatialUnit.spatialUnitId;
			if(page.area && page.area.length)
				mapName += "_" + page.area
			let registeredMap = echarts.getMap(mapName)

			if( !registeredMap ) {
				echarts.registerMap(mapName, $scope.geoJsonForReachability)
			}

			options.series[0].map = mapName;

			// Add isochrones
			// In echarts one mpa can only handle one series
			// But we need the isochrones in different series to control their z-indexes (show smaller isochrones above larger ones)
			// That's why we need to register one map per range threshold, that only contains a subset of isochrones.
			for(seriesData of $scope.isochronesSeriesData) {
				let range = seriesData[0].value;
				registeredMap = echarts.getMap("isochrones-" + range)
				if( !registeredMap ) {
					let isochrones = $scope.isochrones.features.filter( feature => {
						return feature.properties.value === range
					})
					let featureCollection = {
						features: isochrones
					}
					echarts.registerMap("isochrones-" + range, featureCollection)
				}
			}
			
			
			

			let bbox = $scope.isochrones.bbox; // [left, bottom, right, top]
			let isochronesBboxForEcharts = [[bbox[0], bbox[3]], [bbox[2], bbox[1]]] // [left, top], [right, bottom]
			

			for(let [idx, seriesData] of $scope.isochronesSeriesData.entries()) {
				let series = {
					name: "isochrones-" + seriesData[0].value,
					type: 'map',
					roam: false,
					left: 0, top: 0, right: 0, bottom: 0,
					boundingCoords: isochronesBboxForEcharts,
					map: "isochrones-" + seriesData[0].value,
					nameProperty: 'id',
					cursor: "default",
					select: {
						disabled: true
					},
					z: 90 - idx, // first one has smallest threshold and gets highest index
					data: seriesData
				}
				options.series.push(series)
			}

			// Add poi markers as additional series
			let centers;
			if(checkNestedPropExists($scope.isochrones, 'info', 'query', 'locations')) {
				centers = $scope.isochrones.info.query.locations;
			} else {
				// for type of movement buffer
				centers = $scope.isochrones.centerLocations;
			}

			let centerPointSeriesData = centers.map( lonLatArr => {
				return {
					value: [lonLatArr[0], lonLatArr[1]]
				}
			})

			let centerPointSeries =  {
				name: 'centerPoints',
				type: 'scatter',
				coordinateSystem: 'geo',
				
				symbol: 'pin',
				symbolSize: 20,
				itemStyle: {
					color: "#2981CA", // light blue
					opacity: 1
				},
				cursor: "default",
				data: centerPointSeriesData,
				label: {
					show: false,
				},
				emphasis: {
					disabled: true	
				},
				z: 200
			}
			options.series.push(centerPointSeries)

			let map = echarts.init( wrapper )

			// label positioning
			options = enableManualLabelPositioningAcrossPages(page, options, map)

			map.setOption( options )

			$scope.updatingLeafletMaps = true;
			// initialize the leaflet map beneath the transparent-background echarts map
			$timeout(function(page, pageElement, echartsMap) {
				
				let pageIdx = $scope.template.pages.indexOf(page);
				let pageDom = document.getElementById("reporting-addIndicator-page-" + pageIdx);
				let pageElementDom = document.getElementById("reporting-addIndicator-page-" + pageIdx + "-map");
				let oldMapNode = document.querySelector("#reporting-reachability-leaflet-map-container-" + pageIdx);
				if(oldMapNode) {
					oldMapNode.remove();
				}
				let div = document.createElement("div");
				div.id ="reporting-reachability-leaflet-map-container-" + pageIdx;
				div.style.position = "absolute";
				div.style.left = pageElement.dimensions.left;
				div.style.top = pageElement.dimensions.top;
				div.style.width = pageElement.dimensions.width;
				div.style.height = pageElement.dimensions.height;
				div.style.zIndex = 10;
				pageDom.appendChild(div);
				let echartsOptions = echartsMap.getOption();

				let leafletMap = L.map("reporting-reachability-leaflet-map-container-" + pageIdx, {
					zoomControl: false,
					dragging: false,
					doubleClickZoom: false,
					boxZoom: false,
					trackResize: false,
					attributionControl: false,
					// prevents leaflet form snapping to closest pre-defined zoom level.
					// In other words, it allows us to set exact map extend by a (echarts) bounding box
					zoomSnap: 0 
				});
				// manually create a field for attribution so we can control the z-index.
				let prevAttributionDiv = pageDom.querySelector(".map-attribution")
				if(prevAttributionDiv) prevAttributionDiv.remove();
				let attrDiv = document.createElement("div")
				attrDiv.classList.add("map-attribution")
				attrDiv.innerHTML = "Leaflet | Map data @ OpenStreetMap contributors";
				attrDiv.style.fontSize = "8pt"
				attrDiv.style.padding = "5px";
				attrDiv.style.position = "absolute";
				attrDiv.style.bottom = 0;
				attrDiv.style.left = 0;
				attrDiv.style.zIndex = 800;
				attrDiv.style.backgroundColor = "rgba(255, 255, 255, 0.75)";
				pageElementDom.appendChild(attrDiv);
				// also create the legend manually
				let prevLegendnDiv = pageDom.querySelector(".map-legend")
				if(prevLegendnDiv) prevLegendnDiv.remove();
				let legendDiv = $scope.createReachabilityMapLegend(echartsOptions);
				pageElementDom.appendChild(legendDiv)

				// echarts uses [lon, lat], leaflet uses [lat, lon]
				let boundingCoords = echartsOptions.series[0].boundingCoords;
				let westLon = boundingCoords[0][0];
				let southLat = boundingCoords[1][1];
				let eastLon = boundingCoords[1][0];
				let northLat = boundingCoords[0][1];

				if(page.area && page.area.length) {
					for(feature of $scope.geoJsonForReachability.features) {
						if(feature.properties.NAME === page.area) {
							// set bounding box to this feature
							featureBbox = feature.properties.bbox;
							westLon = featureBbox[0];
							southLat = featureBbox[1];
							eastLon = featureBbox[2];
							northLat = featureBbox[3];
							break;
						}
					}
				}

				// Add 2% space on all sides
				let divisor = 50;
				let bboxHeight = northLat - southLat;
				let bboxWidth = eastLon - westLon;
				northLat += bboxHeight/divisor;
				southLat -= bboxHeight/divisor;
				eastLon += bboxWidth/divisor;
				westLon -= bboxWidth/divisor;

				leafletMap.fitBounds( [[southLat, westLon], [northLat, eastLon]] );
				let bounds = leafletMap.getBounds()
				// now update the echarts map and isochrones
				boundingCoords = [ [bounds.getWest(), bounds.getNorth()], [bounds.getEast(), bounds.getSouth()]]
				for(let series of echartsOptions.series) {
					series.top = 0;
					series.bottom = 0;
					series.aspectScale = 0.625
					series.boundingCoords = boundingCoords
				}
				// also for the invisible geo component to update isochrone center markers
				echartsOptions.geo[0].top = 0;
				echartsOptions.geo[0].bottom = 0;
				echartsOptions.geo[0].aspectScale = 0.625
				echartsOptions.geo[0].boundingCoords = boundingCoords

				echartsMap.setOption(echartsOptions, {
					notMerge: true
				});
				
				let osmLayer = new L.TileLayer.Grayscale("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					attribution: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors",
				});
				osmLayer.addTo(leafletMap);

				// can be used to check if positioning in echarts matches the one from leaflet
				//let geoJsonLayer = L.geoJSON( $scope.geoJsonForReachability.features )
				//geoJsonLayer.addTo(leafletMap)
				//let isochronesLayer = L.geoJSON( $scope.isochrones.features )
				//isochronesLayer.addTo(leafletMap);

				if(pageIdx === $scope.template.pages.length-1) {
					$scope.updatingLeafletMaps = false;
					$scope.loadingData = false;
				}
			}, 0, true, page, pageElement, map)

			return map;
		}

		/**
		 * Creates and returns an echarts geoMap object.
		 * @param {*} wrapper | the dom element (most likely a div) where the map should be inserted
		 * @param {*} pageElement 
		 * @returns 
		 */
		$scope.createPageElement_Map = async function(wrapper, page, pageElement) {

			if($scope.template.name === "A4-landscape-reachability") {
				let map = await $scope.createMapForReachability(wrapper, page, pageElement);
				return map;
			}
			
			// check if there is a map registered for this combination, if not register one with all features
			let mapName = undefined;
			let timestamp = undefined;
			
			// get the timestamp from pageElement, not from dom because dom might not be up to date yet
			let dateElement;
			if($scope.template.name === "A4-landscape-reachability") {
				dateElement = page.pageElements.find( el => {
					return el.type === "reachability-subtitle-landscape";
				});
				timestamp = dateElement.text.split(",")[0];
			} else {
				// the other two templates
				dateElement = page.pageElements.find( el => {
					// pageElement references the map here
					// do the comparison like this because we have maps with dataTimestamp and dataTimeseries in the timeseries template
					return el.type === (pageElement.isTimeseries ? "dataTimeseries-landscape" : "dataTimestamp-landscape");
				})
				
				if(pageElement.isTimeseries) {
					timestamp = dateElement.text.split(" - ")[1]; // get the recent timestamp
				} else {
					timestamp = dateElement.text;
				}
			}
			
			mapName = $scope.selectedIndicator.indicatorName + "_" + timestamp + "_" + $scope.selectedSpatialUnit.spatialUnitName;
			
			if(pageElement.classify)
				mapName += "_classified";
			if(pageElement.isTimeseries)
				mapName += "_timeseries"
			if(page.area && page.area.length)
				mapName += "_" + page.area
			let registeredMap = echarts.getMap(mapName)

			if( !registeredMap ) {
				// register new map
				echarts.registerMap(mapName, $scope.selectedIndicator.geoJSON)
			}

			let map = echarts.init( wrapper );
			if(pageElement.isTimeseries) {
				timestamp += "_relative"
			}
			console.log($scope.echartsOptions);
			console.log($scope.echartsOptions.map);
			let options = JSON.parse(JSON.stringify( $scope.echartsOptions.map[timestamp] ));
			
			// default changes for all reporting maps
			options.title.show = false;
			options.grid = undefined;
			options.visualMap.axisLabel = { "fontSize": 10 };
			options.toolbox.show = false;
			options.visualMap.left = "right";
			let series = options.series[0];
			series.roam = false;
			series.selectedMode = false;
			
			

			if(pageElement.isTimeseries) {
				let includeInBetweenDates = true;
				let timeseries = $scope.getFormattedDateSliderValues(includeInBetweenDates)
				series.data = $scope.calculateSeriesDataForTimeseries($scope.selectedIndicator.geoJSON.features, timeseries)
			}
			
			series.map = mapName; // update the map with the one registered above
			series.name = mapName;

			let areaNames = $scope.selectedAreas.map( el => {
				return el.name;
			});

			if(pageElement.classify === true) {
				options.visualMap.show = true;
			} else {
				options.visualMap.show = false;
			}

			series.data.forEach( el => {
				el.itemStyle =  el.itemStyle ? el.itemStyle : {};
				el.emphasis = el.emphasis ? el.emphasis : {};
				el.emphasis.itemStyle = el.emphasis.itemStyle ? el.emphasis.itemStyle : {};
				el.label = el.label ? el.label : {};
				el.visualMap = false;
				
				if(pageElement.classify === false) {
					if( areaNames.includes(el.name) ) {
						// show selected areas (don't classify color by value)
						el.label.formatter = '{b}\n{c}';
						el.label.show = true;
						el.label.textShadowColor = '#ffffff';
						el.label.textShadowBlur = 2;
						el.itemStyle.areaColor = "rgb(255, 153, 51, 0.6)";
						el.itemStyle.color = "rgb(255, 153, 51, 0.6)";
						el.emphasis.itemStyle.areaColor = "rgb(255, 153, 51, 0.6)";
						el.emphasis.itemStyle.color = "rgb(255, 153, 51, 0.6)";
					} else {
						// Only show borders for any other areas
						el.itemStyle.color = "rgba(255, 255, 255, 0)";
						el.itemStyle.areaColor = "rgba(255, 255, 255, 0)";
						el.emphasis.itemStyle.color = "rgba(255, 255, 255, 0)";
						el.emphasis.itemStyle.areaColor = "rgba(255, 255, 255, 0)";
						el.label.show = false;
					}
				}

				if(pageElement.classify === true) {
				
					if( areaNames.includes(el.name) ) {
						el.visualMap = true;
						el.label.formatter = '{b}\n{c}';
						// get color from visual map to overwrite yellow color
						let color = "rgba(0, 0, 0, 0.5)"; 
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
						el.itemStyle.color = color;
						el.itemStyle.areaColor = color;
						el.itemStyle.opacity = opacity;
						el.emphasis.itemStyle.color = color;
						el.emphasis.itemStyle.areaColor = color;
						el.emphasis.itemStyle.opacity = opacity;
						el.label.textShadowColor = '#ffffff';
						el.label.textShadowBlur = 2;
					} else {
						el.visualMap = false;
						el.itemStyle.color = "rgb(255, 255, 255)";
						el.itemStyle.areaColor = "rgb(255, 255, 255)";
						el.emphasis.itemStyle.color = "rgb(255, 255, 255)";
						el.emphasis.itemStyle.areaColor = "rgb(255, 255, 255)";
						el.label.show = false;
					}
				}
			})


			// label positioning
			options = enableManualLabelPositioningAcrossPages(page, options, map)
			
			map.setOption(options);
			return map;
		}

		function enableManualLabelPositioningAcrossPages(page, options, map) {
			if(!page.area) {
				options.labelLayout = function(feature) {
					if(feature.seriesIndex != 0) { // index 0 are the borders / indicator
						return;
					}
					// Set fixed position for labels that were previously dragged by user
					// For all other labels try to avoid overlaps
					let names = $scope.absoluteLabelPositions.map(el=>el.name)
					let text = feature.text.split("\n")[0] // area name is the first line
					if(names.includes(text)) {
						let idx = names.indexOf(text)
						return {
							x: $scope.absoluteLabelPositions[idx].x,
							y: $scope.absoluteLabelPositions[idx].y,
							draggable: true
						}
					} else {
						return {
							moveOverlap: 'shiftY',
							x: feature.rect.x + feature.rect.width / 2,
							draggable: true
						}
					}	
					
				}

				options.labelLine = {
					show: true,
					showAbove: false,
					lineStyle: {
						color: '#555'
					}
				}

				map.getZr().on('mousedown', function(event) {
					// on label drag
					if(event.target) {
						let target = event.target;
						if(target.parent && target.parent.type === "text") {
							// get the feature which this label belongs to
							// When user clicks on the label, one of the child elements is clicked
							// Child elements can be something like: first line of text, second line of text, (white) label background
							// These elements all have the same parent, which we can use to navigate to the parent and then find the correct child (area name)
							let parent = target.parent;
							let areaNameChild;
							for(let child of parent._children) {
								// we assume that the area name is the first child with text ("the first line")
								if(child.style.text && child.style.text.length > 0) {
									areaNameChild = child;
									break;
								}
							}
							$scope.draggingLabelForFeature = areaNameChild.style.text;
						}
					}
				});

				map.getZr().on('mouseup', function(event) {
					if(event.target) {
						let target = event.target;
						if(target.parent && target.parent.type === "text") {
							// for all other maps, that are not area-specific, do the exact same label drag
							let newX = target.parent.x;
							let newY = target.parent.y;
							let names = $scope.absoluteLabelPositions.map(el=>el.name)
							if(names.includes($scope.draggingLabelForFeature)) {
								let idx = names.indexOf($scope.draggingLabelForFeature);
								$scope.absoluteLabelPositions[idx].x = newX;
								$scope.absoluteLabelPositions[idx].y = newY;
							} else {
								$scope.absoluteLabelPositions.push({
									name: $scope.draggingLabelForFeature,
									x: newX,
									y: newY
								})
							}

							for(let [idx, page] of $scope.template.pages.entries()) {
								for(let pageElement of page.pageElements) {
									if(pageElement.type === "map" && !page.area) {
										let domNode = document.getElementById("reporting-addIndicator-page-" + idx + "-map");
										let map = echarts.getInstanceByDom(domNode);
										map.setOption(map.getOption()); // this calls the labelLayout function defined above
									}
								}
							}
						}
					}
				});
			}
			return options;
		}

		$scope.createPageElement_Average = function(page, pageElement, calcForSelection) {
			// get the timestamp from pageElement, not from dom because dom might not be up to date yet
			// no timeseries possible for this type of element
			let dateElement = page.pageElements.find( el => {
				return el.type === "dataTimestamp-landscape";
			});
			let timestamp = dateElement.text;

			let avg = $scope.calculateAvg( $scope.selectedIndicator, timestamp, calcForSelection );
			pageElement.text = avg;
			pageElement.css = "border: solid 1px lightgray; padding: 2px;"
			pageElement.isPlaceholder = false;
		}


		$scope.createPageElement_Change = function(page, pageElement, calcForSelection) {
			// get the timeseries from slider, not from dom because dom might not be up to date yet
			let timeseries = $scope.getFormattedDateSliderValues(true);
	
			let change = $scope.calculateChange( $scope.selectedIndicator, timeseries, calcForSelection );
			pageElement.text = change;
			pageElement.css = "border: solid 1px lightgray; padding: 2px;";
			pageElement.isPlaceholder = false;
		}

		$scope.createPageElement_BarChartDiagram = function(wrapper, page) {
			
			// get timestamp from pageElement, not from dom because dom might not be up to date yet
			// barcharts are only used in timestamp templates so we don't have to check for timeseries for now
			let dateElement = page.pageElements.find( el => {
				return el.type === "dataTimestamp-landscape";
			});
			let timestamp = dateElement.text;

			let barChart = echarts.init( wrapper );
			let options = JSON.parse(JSON.stringify( $scope.echartsOptions.bar[timestamp] ));

			// default changes
			options.xAxis.name = "";
			options.title.textStyle.fontSize = 12;
			options.title.text = "";
			options.yAxis.axisLabel = { "fontSize": 10 };
			options.title.show = true;
			options.grid.top = 35;
			options.grid.bottom = 5;
			options.toolbox.show = false;
			options.visualMap[0].show = false; // only needed to set the color for avg
			options.xAxis.axisLabel.show = true;
			options.yAxis.name = ""; // included in header of each page
			options.xAxis.name = ""; // always timestamps
			// black text with halo effect for better visibility
			if(!options.textStyle) options.textStyle = {};
			options.textStyle.color = "black";
			options.textStyle.textShadowColor = '#ffffff';
			options.textStyle.textShadowBlur = 2;
			
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
					return -1
				}	
			});

			// add data element for the overall average
			let overallAvgValue = $scope.calculateAvg($scope.selectedIndicator, timestamp, false);
			let overallAvgElementName = (page.area && page.area.length) ? "Durchschnitt\nder\nRaumeinheit" : "Durchschnitt der Raumeinheit";
			let dataObjOverallAvg = {
				name: overallAvgElementName,
				value: overallAvgValue,
				opacity: 1
			}
			// get color for avg from visual map and disable opacity
			let colorOverallAvg = "";
			for(let piece of options.visualMap[0].pieces) {
				if(piece.min <= dataObjOverallAvg.value && dataObjOverallAvg.value < piece.max) {
					colorOverallAvg = piece.color;
				}
				piece.opacity = 1;
			}
			dataObjOverallAvg.color = colorOverallAvg;
			options.series[0].data.push(dataObjOverallAvg);
			options.xAxis.data.push( dataObjOverallAvg.name );

			// same for selection average
			// add more data elements for the overall and selection average
			let selectionAvgValue = $scope.calculateAvg($scope.selectedIndicator, timestamp, true);
			let selectionAvgElementName = (page.area && page.area.length) ? "Durchschnitt\nder\nSelektion" : "Durchschnitt der Selektion";
			let dataObjSelectionAvg = {
				name: selectionAvgElementName,
				value: selectionAvgValue,
				opacity: 1
			}
			// get color for avg from visual map and disable opacity
			let colorSelectionAvg = "";
			for(let piece of options.visualMap[0].pieces) {
				if(piece.min <= dataObjSelectionAvg.value && dataObjSelectionAvg.value < piece.max) {
					colorSelectionAvg = piece.color;
				}
				piece.opacity = 1;
			}
			dataObjSelectionAvg.color = colorSelectionAvg;
			options.series[0].data.push(dataObjSelectionAvg);
			options.xAxis.data.push( dataObjSelectionAvg.name )
			
			options.series[0].emphasis.itemStyle = {}; // don't show border on hover
	
			barChart.setOption(options, {
				replaceMerge: ['series'] // take the new series data, don't update part of the old one
			});
			return barChart;
		}

		$scope.createPageElement_TimelineDiagram = function(wrapper, page, pageElement) {
			// no need to get a timestamp here

			let lineChart = echarts.init( wrapper );
			let timeline = $scope.getFormattedDateSliderValues(true).dates;
			// get standard options, create a copy of the options to not change anything in the service
			let options = JSON.parse(JSON.stringify( $scope.echartsOptions.line ));
			options.title.textStyle.fontSize = 12;
			options.title.text = "Zeitreihe";
			options.yAxis.axisLabel = { "fontSize": 10 };
			options.xAxis.axisLabel = { "fontSize": 10 };
			options.legend.show = false;
			options.grid.top = 35;
			options.grid.bottom = 5;
			options.title.show = true;
			options.toolbox.show = false;
			options.yAxis.name = ""; // included in header of each page
			options.xAxis.name = ""; // always timestamps

			// diagram contains avg series by default
			// if it should be shown we adjust it to our timeseries
			// future dates (compared to max slider value) were already filtered in prepareDiagrams
			// we have to remove dates older than min slider value here
			// we also have to filter xAxis labels accordingly
			let timeseries = $scope.getFormattedDateSliderValues(true);
			let oldestSelectedTimestamp = timeseries.from;
			let timestampsToRemoveCounter = 0;
			// use the axis labels to find out how many data points have to be removed later
			let timestampReached = false;
			while(!timestampReached) {
				if(oldestSelectedTimestamp === options.xAxis.data[0]) {
					timestampReached = true;
				} else {
					options.xAxis.data.shift();
					timestampsToRemoveCounter += 1;
				}
			}

			if(pageElement.showAverage) {
				options.series = options.series.filter( series => {
					return series.name === "Arithmetisches Mittel"
				});

				for(let i=0; i<timestampsToRemoveCounter; i++) {
					options.series[0].data.shift();
				}
			} else {
				options.series = [];
			}
			
			
			if(pageElement.showAreas) {
				
				let areaNames = [];
				// in area specific part only add one line
				if(page.area && page.area.length) {
					areaNames.push(page.area);
				} else {
					// else add one line for each selected area
					areaNames = $scope.selectedAreas.map( el => {
						return el.name;
					});
				}

				for(let areaName of areaNames) {
					let data = [];
					let filtered = $scope.selectedIndicator.geoJSON.features.filter( feature => {
						return feature.properties.NAME === areaName;
					});
				
					for(let timestamp of timeline) {
						let value = filtered[0].properties["DATE_" + timestamp];
						data.push(value)
					}
				
					let series = {};
					series.name = areaName;
					series.type = "line";
					series.data = data;
					series.lineStyle = {
						normal: {
							width: 2,
							type: "solid"
						}
					}
					series.itemStyle = {
						normal: {
							borderWidth: 3
						}
					}
				
					options.series.push(series)
				}
			}

			if(pageElement.showPercentageChangeToPrevTimestamp) {
				for(let series of options.series) {
					series.data = $scope.transformSeriesDataToPercentageChange(series.data)
						
					
				}
				options.xAxis.data.shift();
				options.title.text = "Veränderung zum Vorjahr";
			}

			if(pageElement.showBoxplots) {
				// we assume that boxplots are only shown when showAreas is false (might change in the future).
				// so we have to get the data of all areas first
				let areaNames = [];
				areaNames = $scope.selectedAreas.map( el => {
					return el.name;
				});

				// create a nested array with each inner array containing all area-values for one timestamp
				let datasetSource = [];
				for(let timestamp of timeline) {
					let valuesForTimestamp = [];
					// filter features to selected areas
					let selectedAreasFeatures = $scope.selectedIndicator.geoJSON.features.filter( feature => {
						return areaNames.includes( feature.properties.NAME );
					});
					// get values for each feature
					for(let feature of selectedAreasFeatures) {
						let value = feature.properties["DATE_" + timestamp]
						valuesForTimestamp.push(value);
					}

					datasetSource.push(valuesForTimestamp)
				}
				
				let xAxisLabels = options.xAxis.data;
				options.dataset = [
					{
						source: datasetSource
					},
					{
						transform: {
							type: 'boxplot',
							config: { 
								// params is 0, 1, 2, ...
								// we can use this as an index to get the actual label and return it
								itemNameFormatter: function (params) {
									return xAxisLabels[params.value];
								}
							}
						}
					},
					{
						fromDatasetIndex: 1,
						fromTransformResult: 1
					}
				]

				// add a new series that references the boxplots
				options.series.push({
					name: 'boxplot',
					type: 'boxplot',
					datasetIndex: 1 // overlap boxplots and avg. line
				})
			}

			lineChart.setOption(options, {
				replaceMerge: ['series'] // take the new series data, don't update part of the old one
			});
			return lineChart;
		}

		$scope.createPageElement_Datatable = function(wrapper, page) {
			
			// table looks different depending on template type
			// for single timestamps it is added at the end of each timestamp-section, so each area is inserted once
			// for timeseries it is added once at the end of the template and contains an extra column for timestamps.
			// Each area is inserted for multiple timestamps.

			// our wrapper is 440px high.
			// 440 - 25 (header) = 415
			// we set each row to be 25px high, so we can fit 415 / 25 --> 16 rows on one page.
			let wrapperHeight = parseInt(wrapper.style.height, 10);
			let maxRows = Math.floor( (wrapperHeight - 25) / 25);
			let rowsData = [];
			let timestamp = undefined;
			let timeseries = undefined;

			if($scope.template.name === "A4-landscape-timestamp") {
				// get the timestamp from pageElement, not from dom because dom might not be up to date yet
				let dateElement = page.pageElements.find( el => {
					return el.type === "dataTimestamp-landscape";
				});
				timestamp = dateElement.text;
			}

			if($scope.template.name === "A4-landscape-timeseries") {
				let inBetweenValues = true;
				timeseries = $scope.getFormattedDateSliderValues(inBetweenValues);
			}

			// see how many pages need to be added. Rows are added later
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

				if($scope.template.name === "A4-landscape-timestamp") {
					// get the timestamp from pageElement, not from dom because dom might not be up to date yet
					let dateElement = page.pageElements.find( el => {
						return el.type === "dataTimestamp-landscape";
					});
					let timestamp = dateElement.text;
					// prepare data to insert later
					let value = feature.properties["DATE_" + timestamp];
					if(typeof(value) == 'number')
						value = Math.round( value * 100) / 100;
					
					rowsData.push( {
						name: feature.properties.NAME,
						value: value
					});
				}

				if($scope.template.name === "A4-landscape-timeseries") {
					for(let timestamp of timeseries.dates) {
						let value = feature.properties["DATE_" + timestamp];
						if(typeof(value) == 'number')
							value = Math.round( value * 100) / 100;
						rowsData.push( {
							name: feature.properties.NAME,
							timestamp: timestamp,
							value: value
						});
					}
				}
			}

			// sort by area name
			rowsData.sort((a, b) => a.name.localeCompare(b.name))

			// append average as last row if needed
			if($scope.template.name === "A4-landscape-timestamp") {
				rowsData.push({
					name: "Durchschnitt Selektion",
					value:  $scope.calculateAvg($scope.selectedIndicator, timestamp, true)
				});
				rowsData.push({
					name: "Durchschnitt Gesamtstadt",
					value:  $scope.calculateAvg($scope.selectedIndicator, timestamp, false)
				});
				
			}

			// the length of rowsData is the number of rows we have to add
			for(let i=0;i<rowsData.length;i++) {
				// each time we hit the page breakpoint we add a new page
				// at this point we are not actually adding any rows to the table
				if(i > 0 && i % maxRows == 0) {
					// add a new page
					let newPage = angular.fromJson($scope.untouchedTemplateAsString).pages.at(-1);
					newPage.id = $scope.templatePageIdCounter++;
					// setup new page
					for(let pageElement of newPage.pageElements) {
	
						if(pageElement.type === "indicatorTitle-landscape") {
							pageElement.text = $scope.selectedIndicator.indicatorName + " [" + $scope.selectedIndicator.unit + "]"
							pageElement.isPlaceholder = false;
						}
	
						if(pageElement.type === "dataTimestamp-landscape") {
							pageElement.text = timestamp;
							pageElement.isPlaceholder = false;
						}
	
						// exists only on timeseries template (instead of dataTimestamp-landscape), so we don't need another if...else here
						if(pageElement.type === "dataTimeseries-landscape") {
							pageElement.text = timeseries.from + " - " + timeseries.to;
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
			}
				

			// create table rows once the pages exist
			function insertDatatableRows(rowsData, page, maxRows) {
				// get current index of page (might have changed in the meantime)
				let idx = $scope.template.pages.indexOf(page)
				let wrapper = document.querySelector("#reporting-addIndicator-page-" + idx + "-datatable");
				if(wrapper) {
					$interval.cancel(insertDatatableRowsInterval); // code below still executes once
				} else {
					return;
				}
				
				wrapper.innerHTML = "";
				wrapper.style.border = "none"; // hide dotted border from outer dom element
				wrapper.style.justifyContent = "flex-start"; // align table at top instead of center

				let columnNames;
				if($scope.template.name === "A4-landscape-timeseries") {
					columnNames  = ["Bereich", "Zeitpunkt", "Wert"]
				} else {
					columnNames  = ["Bereich", "Wert"]
				}

				let table = $scope.createDatatableSkeleton(columnNames);
				wrapper.appendChild(table);
				let tbody = table.querySelector("tbody");
				let pageElement = $scope.template.pages[idx].pageElements.find( el => el.type === "datatable");
				pageElement.isPlaceholder = false;

				for(let i=0;i<rowsData.length; i++) {
					// see which page we have to add the row to
					// switch to next page if necessary
					intervalArr = [];
					if((i % maxRows) == 0) {
						if(i > 0) idx++
						const idx_save = idx;
						const i_save = i;
						intervalArr[idx_save] = $interval(insertDatatableRowsPerPage, 0, 100, true, pageElement, idx_save, columnNames, maxRows, rowsData, i_save)

						function insertDatatableRowsPerPage(pageElement, idx, columnNames, maxRows, rowsData, i) {
							// check if page exists already in dom, if not try again later
							wrapper = document.querySelector("#reporting-addIndicator-page-" + idx + "-datatable");
							if(wrapper) {
								$interval.cancel(intervalArr[idx]); // code below still executes once
							} else {
								return;
							}
							// page exists
							wrapper.innerHTML = "";
							wrapper.style.border = "none"; // hide dotted border from outer dom element
							wrapper.style.justifyContent = "flex-start"; // align table at top instead of center
							table = $scope.createDatatableSkeleton(columnNames);
							wrapper.appendChild(table);
							tbody = table.querySelector("tbody");
							pageElement = $scope.template.pages[idx].pageElements.find( el => el.type === "datatable");
							pageElement.isPlaceholder = false;
							
							for(let j=i; j<(i + maxRows); j++) {
								if(!rowsData[j])
									break; // on last page

								let row = document.createElement("tr");
								row.style.height = "25px";

								for(let colName of columnNames) {
									let td = document.createElement("td");
									if(colName === "Bereich") {
										td.innerText = rowsData[j].name;
										td.classList.add("text-left");
									}
								
									if(colName === "Zeitpunkt") {
										td.innerText = rowsData[j].timestamp;
									}
								
									if(colName === "Wert") {
										td.innerText = rowsData[j].value;
										td.classList.add("text-right");
									}
								
									row.appendChild(td);
								}

								tbody.appendChild(row)
							}
						}
					}
				}
			}
	
			let insertDatatableRowsInterval = $interval(insertDatatableRows, 0, 100, true, rowsData, page, maxRows)
		}


		$scope.filterMapByAreaName = function(echartsInstance, areaName, allFeatures) {
			let options = echartsInstance.getOption();
			let mapName = options.series[0].map;
			// filter shown areas if we are in the area-specific part of the template
			// removing areas form the series doesn't work. We have to filter the geojson of the registered map.
			let features = allFeatures.filter ( el => {
				return el.properties.name === areaName
			});

			echarts.registerMap(mapName, { features: features } )
			// echart map bounds are defined by a bounding boy, which has to be updated as well.
			let bbox = features[0].properties.bbox; // [east, south, west, north]
			let newBounds = [[bbox[2], bbox[3]], [bbox[0], bbox[1]]] // [[west, north], [east, south]]
			options.series[0].boundingCoords = newBounds;
			echartsInstance.setOption(options, {
				replaceMerge: ['series']
			});
		}

		$scope.calculateAvg = function(indicator, timestamp, calcForSelection) {
			// calculate avg from geoJSON property, which should be the currently selected spatial unit
			let features = indicator.geoJSON.features;
			if(calcForSelection) {
				features = features.filter( el => {
					return $scope.selectedAreas.map(area=>area.name).includes( el.properties.NAME )
				});
			}

			let data = features.map( feature => {
				return feature.properties["DATE_" + timestamp];
			})

			let noDataCounter = 0
			let sum = 0;
			for(let i=0; i<data.length; i++) {
				if(typeof(data[i]) === "number" && !isNaN(data[i])) {
					sum += data[i];
				} else {
					noDataCounter++;
				}
			}
			
			let avg = sum / data.length - noDataCounter;
			avg = Math.round(avg * 100) / 100; // 2 decimal places
			return avg;
		}

		$scope.calculateChange = function(indicator, timeseries, calcForSelection) {
			let data = $scope.calculateSeriesDataForTimeseries(indicator.geoJSON.features, timeseries);
			if(calcForSelection) {
				data = data.filter( el => {
					return $scope.selectedAreas.map(area=>area.name).includes( el.name )
				});
			}
			data = data.map(obj => obj.value)
			let noDataCounter = 0
			let sum = 0;
			for(let i=0; i<data.length; i++) {
				if(typeof(data[i]) === "number" && !isNaN(data[i])) {
					sum += data[i];
				} else {
					noDataCounter++;
				}
			}
			
			let avgChange = sum / data.length - noDataCounter;
			avgChange = Math.round(avgChange * 100) / 100; // 2 decimal places
			return avgChange;
		}


		$scope.prepareDiagrams = function(selectedIndicator, selectedSpatialUnit, timestampName, classifyUsingWholeTimeseries) {
			
			// set settings useOutlierDetectionOnIndicator and classifyUsingWholeTimeseries to false to have consistent reporting setup
			// we need to undo these changes afterwards, so we store the current values in a backup first
			const useOutlierDetectionOnIndicator_backup = kommonitorDataExchangeService.useOutlierDetectionOnIndicator;
			const classifyUsingWholeTimeseries_backup = kommonitorDataExchangeService.classifyUsingWholeTimeseries;
			const classifyZeroSeparately_backup = kommonitorDataExchangeService.classifyZeroSeparately; 
			kommonitorDataExchangeService.useOutlierDetectionOnIndicator = false;
			kommonitorDataExchangeService.classifyUsingWholeTimeseries = false;
			if(classifyUsingWholeTimeseries) {
				kommonitorDataExchangeService.classifyUsingWholeTimeseries = true;
			}
			
			
			let timestampPrefix = __env.indicatorDatePrefix + timestampName;
			let numClasses = selectedIndicator.defaultClassificationMapping.items.length;
			let colorCodeStandard = selectedIndicator.defaultClassificationMapping.colorBrewerSchemeName;
			let colorCodePositiveValues = __env.defaultColorBrewerPaletteForBalanceIncreasingValues;
			let colorCodeNegativeValues = __env.defaultColorBrewerPaletteForBalanceDecreasingValues;
			let classifyMethod = __env.defaultClassifyMethod;

			// setup brew
			let defaultBrew = kommonitorVisualStyleHelperService.setupDefaultBrew(selectedIndicator.geoJSON, timestampPrefix, numClasses, colorCodeStandard, classifyMethod, true, selectedIndicator);
			let dynamicBrewsArray = kommonitorVisualStyleHelperService.setupDynamicIndicatorBrew(selectedIndicator.geoJSON, timestampPrefix, colorCodePositiveValues, colorCodeNegativeValues, classifyMethod);
			let dynamicIncreaseBrew = dynamicBrewsArray[0];
			let dynamicDecreaseBrew = dynamicBrewsArray[1];

			// setup diagram resources
			kommonitorDiagramHelperService.prepareAllDiagramResources_forReportingIndicator(selectedIndicator, selectedSpatialUnit.spatialUnitName, timestampName, defaultBrew, undefined, undefined, dynamicIncreaseBrew, dynamicDecreaseBrew, false, 0, true);
			// at this point the echarts instance has one map registered (geoMapChart).
			// that is the "default" map, which can be used to create individual maps for indicator + date + spatialUnit (+ area) combinations later

			// set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator and classifyZeroSeparately back to their prior values
			kommonitorDataExchangeService.useOutlierDetectionOnIndicator = useOutlierDetectionOnIndicator_backup;
			kommonitorDataExchangeService.classifyUsingWholeTimeseries = classifyUsingWholeTimeseries_backup;
			kommonitorDataExchangeService.classifyZeroSeparately = classifyZeroSeparately_backup;

			// copy and save echarts options so we can re-use them later
			if(classifyUsingWholeTimeseries) {
				timestampName += "_relative"; // save relative indicator separately
			}
			$scope.echartsOptions.map[timestampName] = JSON.parse(JSON.stringify( kommonitorDiagramHelperService.getGeoMapChartOptions() ));
			$scope.echartsOptions.bar[timestampName] = JSON.parse(JSON.stringify( kommonitorDiagramHelperService.getBarChartOptions() ));
			// no timestamp needed here
			$scope.echartsOptions.line = JSON.parse(JSON.stringify( kommonitorDiagramHelperService.getLineChartOptions() ));
			$scope.diagramsPrepared = true;
		}


		$scope.prepareReachabilityEchartsMap = function() {
			for(let feature of $scope.geoJsonForReachability.features) {
				let bbox = turf.bbox(feature); // calculate bbox for each feature
				feature.properties.bbox = bbox;
			}
			let overallBbox = calculateOverallBoundingBoxFromGeoJSON($scope.geoJsonForReachability.features)
			// change format of bbox to match the format needed for echarts
			overallBbox = [
				[overallBbox[0], overallBbox[3]], // north-west lon lat
				[overallBbox[2], overallBbox[1]] // south-east lon lat
			]

			let mapName = "reachabilityMap"; // gets overwritten later anyway
			echarts.registerMap(mapName, $scope.geoJsonForReachability)

			let geoMapOptions = {
				// geo component is only needed for isochrone center markers to work
				geo: {
					map: mapName,
					z: 1,
					itemStyle: {
						opacity: 0
					},
					roam: false,
					boundingCoords: overallBbox,
				},
				backgroundColor: "rgba(255,255,255,0)", // transparent, because we draw it over the leaflet map
				series: [{
					name: "spatialUnitBoundaries",
					type: 'map',
					roam: false,
					boundingCoords: overallBbox,
					map: mapName,
					cursor: "default",
					itemStyle: {
						areaColor: "rgb(255, 255, 255, 0)",
						borderColor: "rgb(50, 50, 50)",
						borderWidth: 3,
						color: "rgb(255, 255, 255, 0)",
					},
					label: {
						show: true,
						backgroundColor: 'white',
						padding: [1, 2, 1, 2] // [top, right, bottom, left]
					},
					emphasis: {
						disabled: true
					},
					z: 100,
					data: []
				}]
			};
			
			// We can set this here because this function is only relevant for reachability.
			// The other diagrams don't have to be prepared since they are not used.
			$scope.diagramsPrepared = true;

			return geoMapOptions
		}


		$scope.initializeAllDiagrams = async function() {
			if(!$scope.template)
				return;
			if($scope.template.name === "A4-landscape-timestamp" && $scope.selectedTimestamps.length === 0) {
				return;
			}
			if(!$scope.diagramsPrepared) {
				throw new Error("Diagrams can't be initialized since they were not prepared previously.")
			}

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
						let prevDomPageEl = document.querySelector("#reporting-addIndicator-page-" + (i-1) + "-datatable")
						let domPageEl =  document.querySelector("#reporting-addIndicator-page-" + i + "-datatable")
						if(!prevDomPageEl || !domPageEl) { // if this page does not exist in the dom
							pageIdx--; // don't increase index in this iteration so it stays in sync with the pages that exist in the dom
						}
						continue; // don't do anything for additional datatable pages. They are added in createPageElement_Datatable
					}
				}
				

				let pageDom = document.querySelector("#reporting-addIndicator-page-" + pageIdx);

				for(let pageElement of page.pageElements) {

					// usually each type is included only once per page, but there is an exception for linecharts in area specific part of timeseries template
					// for now we more or less hardcode this, but it might have to change in the future
					let pElementDom;
					if(pageElement.type === "linechart") {
						let arr = pageDom.querySelectorAll(".type-linechart");
						if(pageElement.showPercentageChangeToPrevTimestamp) {
							pElementDom = arr[1];
						} else {
							pElementDom = arr[0];
						}
					} else {
						pElementDom = pageDom.querySelector("#reporting-addIndicator-page-" + pageIdx + "-" + pageElement.type)
					}
					
					switch(pageElement.type) {
						case "map": {
							// initialize with all areas
							let map = await $scope.createPageElement_Map(pElementDom, page, pageElement);
							// filter visible areas if needed
							if(page.area && page.area.length) {
								if($scope.selectedIndicator) {
									$scope.filterMapByAreaName(map, page.area, $scope.selectedIndicator.geoJSON.features);
								} else {
									$scope.filterMapByAreaName(map, page.area, $scope.geoJsonForReachability.features);
								}
								
							}
							pageElement.isPlaceholder = false;
							break;
						}
						case "mapLegend": {
							pageElement.isPlaceholder = false; // hide the placeholder, legend is part of map
							pageDom.querySelector(".type-mapLegend").style.display = "none";
							break;
						}
							
						case "overallAverage": {
							$scope.createPageElement_Average(page, pageElement, false);
							pageDom.querySelector(".type-overallAverage").style.border = "none";
							break;
						}
						case "selectionAverage": {
							$scope.createPageElement_Average(page, pageElement, true);
							pageDom.querySelector(".type-selectionAverage").style.border = "none";
							break;
						}
						case "overallChange": {
							$scope.createPageElement_Change(page, pageElement, false);
							let wrapper = pageDom.querySelector(".type-overallChange")
							wrapper.style.border = "none";
							wrapper.style.left = "670px";
							wrapper.style.width = "130px";
							wrapper.style.height = "100px";
							break;
						}
						case "selectionChange": {
							$scope.createPageElement_Change(page, pageElement, true);
							let wrapper = pageDom.querySelector(".type-selectionChange")
							wrapper.style.border = "none";
							wrapper.style.left = "670px";
							wrapper.style.width = "130px";
							wrapper.style.height = "100px";
							break;
						}
						case "barchart": {
							$scope.createPageElement_BarChartDiagram(pElementDom, page);
							pageElement.isPlaceholder = false;
							break;
						}
						case "linechart": {
							$scope.createPageElement_TimelineDiagram(pElementDom, page, pageElement);
							pageElement.isPlaceholder = false;
							break;
						}
						case "datatable": {
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
							$scope.createPageElement_Datatable(pElementDom, page);
							break;
						}
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


		$scope.calculateSeriesDataForTimeseries = function(features, timeseries) {
			let result = [];
			let mostRecentDate = timeseries.to;
			let oldestDate = timeseries.from

			for(let feature of features) {
				let obj = {};
				obj.name = feature.properties.name;
				let value = feature.properties["DATE_" + mostRecentDate] - feature.properties["DATE_" + oldestDate];
				if(typeof(value) == 'number') {
					value = Math.round( value * 100) / 100;
				}
				obj.value = value;

				result.push(obj);
			}
			return result;
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


		$scope.createDatatableSkeleton = function(colNamesArr) {

			let table = document.createElement("table");
			table.classList.add("table-striped")
			table.classList.add("table-bordered")
			
			let thead = document.createElement("thead");
			let tbody = document.createElement("tbody");
			table.appendChild(thead);
			table.appendChild(tbody);
			
			let headerRow = document.createElement("tr");
			
			for(let colName of colNamesArr) {
				let col = document.createElement("th");
				col.classList.add("text-center");
				col.innerText = colName;
				headerRow.appendChild(col);
			}

			headerRow.style.height = "25px";
			thead.appendChild(headerRow);

			return table;
		}

		$scope.createDatesFromIndicatorDates = function(indicatorDates) {
			let datesAsMs = [];
			for (let i=0; i < indicatorDates.length; i++){
				// year-month-day
				var dateComponents = indicatorDates[i].split("-");
				datesAsMs.push(kommonitorDataExchangeService.dateToTS(new Date(Number(dateComponents[0]), Number(dateComponents[1]) - 1, Number(dateComponents[2]))));
			}
			return datesAsMs;
		}

		function prettifyDateSliderLabels (dateAsMs) {
			return kommonitorDataExchangeService.tsToDate_withOptionalUpdateInterval(dateAsMs, $scope.selectedIndicator.metadata.updateInterval);
		}

		$scope.onChangeDateSliderInterval = function() {
			$scope.loadingData = true;
			$scope.$apply(); // needed to tell angular something has changed
			// setup all pages with the new timeseries
			let values = $scope.getFormattedDateSliderValues(true);
			// prepare diagrams again for most recent timestamp of slider and for whole timeseries (changes).
			let classifyUsingWholeTimeseries = false;
			$scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, values.to, classifyUsingWholeTimeseries);
			classifyUsingWholeTimeseries = true;
			$scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, values.to, classifyUsingWholeTimeseries);
			
			// set dates on all pages according to new slider values
			for(let page of $scope.template.pages) {
				let dateEl = page.pageElements.find( el => {
					return el.type === "dataTimestamp-landscape" || el.type === "dataTimeseries-landscape"
				});

				if(dateEl.type === "dataTimestamp-landscape") {
					dateEl.text = values.to;
				}
				if(dateEl.type === "dataTimeseries-landscape") {
					dateEl.text = values.from + " - " + values.to;
				}
			}

			function updateDiagrams() {
				if($scope.diagramsPrepared) {
					$interval.cancel(updateDiagramsInterval); // code below still executes once
				} else {
					return;
				}
				// diagrams are prepared, but dom has to be updated first, too
				$timeout(async function() {
					await $scope.initializeAllDiagrams();
					$scope.loadingData = false;
				})
				
			}
	
			let updateDiagramsInterval = $interval(updateDiagrams, 0, 100)
		}

		$scope.getFormattedDateSliderValues = function(includeInBetweenValues) {
			if(!$scope.dateSlider)
				throw new Error("Tried to get dateslider values but dateslider was not defined.");
			
			let slider = $scope.dateSlider
			let from = new Date(slider.result.from_value);
			let to = new Date(slider.result.to_value);

			let inBetweenDates;
			if(includeInBetweenValues) {
				// get all valid timestamps for this spatial unit that lie in between from and to
				let validTimestamps = getValidTimestampsForSpatialUnit( $scope.selectedSpatialUnit );
				inBetweenDates = validTimestamps.filter( el => {
					let date = new Date(el);
					date.setHours(0); // remove time-offset...TODO is there a better way?
					return from < date && date < to;
				});
			}
			// append zeros to month and year if needed
			let month = (from.getMonth()+1) // months start with 0
			let day = from.getDate();
			from = from.getFullYear() + "-";
			if( month < 10) from += "0";
			from += month + "-";
			if( day < 10) from += "0";
			from += day;

			month = (to.getMonth()+1) // months start with 0
			day = to.getDate();
			to = to.getFullYear() + "-";
			if( month < 10) to += "0";
			to += month + "-";
			if( day < 10) to += "0";
			to += day;
			
			let result = {
				from: from,
				to: to,
				dates: includeInBetweenValues ? [from, ...inBetweenDates, to] : [] // all dates in the interval, including "from" and "to"
			}

			return result;
		}


		$scope.initializeDateRangeSlider = function(availableDates, min, max) {

			if($scope.dateSlider){
				$scope.dateSlider.destroy();
			}

			let domNode = document.getElementById("reporting-dateSlider");

			while (domNode.hasChildNodes()) {
				domNode.removeChild(domNode.lastChild);
			}

			//let mostRecentDate = availableDates[availableDates.length - 1];
			//let selectedDate = availableDates[availableDates.length - 1];

			let datesAsMs = $scope.createDatesFromIndicatorDates(availableDates);

			// new Date() uses month between 0-11!
			$("#reporting-dateSlider").ionRangeSlider({
				skin: "big",
				type: "double",
				grid: true,
				values: datesAsMs,
				from: 0,
				to: availableDates.length-1, // index
				force_edges: true,
				prettify: prettifyDateSliderLabels,
				onFinish: $scope.onChangeDateSliderInterval
			});

			let dateSlider = $("#reporting-dateSlider").data("ionRangeSlider");
			// make sure that the handles are properly set
			let minIdx = 0;
			let maxIdx = availableDates.length-1;
			if(typeof(min) !== "undefined")
				minIdx = availableDates.indexOf(min)
			if(typeof(max) !== "undefined")
				maxIdx = availableDates.indexOf(max);

			dateSlider.update({
				from: minIdx,
				to: maxIdx
			});
			return dateSlider;
		}

		$scope.validateConfiguration = function() {
			// indicator has to be selected (unless template is reachability)
			// at least one area has to be selected (unless template is reachability)
			// for timestamps:
				// at least one timestamp has to be selected
			// for timeseries
				// slider position must include at least two timestamps
			let isIndicatorSelected = false;
			let isAreaSelected = false;
			let isTimestampSelected = false;

			if(!$scope.template) {
				return false;
			}

			if($scope.selectedIndicator || $scope.template.name === "A4-landscape-reachability") {
				isIndicatorSelected = true;
			}
			if($scope.selectedAreas.length >= 1  || $scope.template.name === "A4-landscape-reachability") {
				isAreaSelected = true;
			}

			if( ($scope.template.name === "A4-landscape-timestamp" || $scope.template.name === "A4-landscape-reachability" ) && 
				$scope.selectedTimestamps.length >= 1) {
				isTimestampSelected = true;
			}

			if($scope.template.name === "A4-landscape-timeseries") {
				if(!$scope.dateSlider) {
					return false;
				}
				if( !$scope.availableFeaturesBySpatialUnit[ $scope.selectedSpatialUnit.spatialUnitName]) {
					return false;
				}
				let timeseries = $scope.getFormattedDateSliderValues(true).dates;
				if(timeseries.length >= 1) {
					isTimestampSelected = true; // reuse variable here
				}
			}

			if(isIndicatorSelected && isAreaSelected && isTimestampSelected && !$scope.loadingData && !$scope.updatingLeafletMaps) {
				return true;
			} else {
				return false;
			}

		}

		$scope.removeAlreadyAddedIndicators = function(indicatorNames) {
			$scope.availableIndicators = $scope.availableIndicators.filter( entry => {
				return !indicatorNames.includes(entry.indicatorName)
			})
			$scope.loadingData = false;
			$scope.$apply();
		}

		$scope.transformSeriesDataToPercentageChange = function(dataArr) {
			// we need at least two timestamps
			if(dataArr.length <= 1) {
				let error = new Error("Can not calculate percentage change from a single timestamp.")
				kommonitorDataExchangeService.displayMapApplicationError(error.message);
			}
			let result = [];
			for(let i=1; i<dataArr.length;i++) {
				let datapoint = dataArr[i];
				let prevDatapoint = dataArr[i-1];
				let value = (datapoint - prevDatapoint) / prevDatapoint;
				value *= 100;
				value =  Math.round( value * 100) / 100;
				result.push(value);
			}
			return result;
		}

		// https://stackoverflow.com/a/2631198/18450475
		function checkNestedPropExists(obj, level,  ...rest) {
			if (obj === undefined) return false
			if (rest.length == 0 && obj.hasOwnProperty(level)) return true
			return checkNestedPropExists(obj[level], ...rest)
		}

		// https://stackoverflow.com/a/2631198/18450475
		function getNestedProp(obj, ...args) {
			return args.reduce((obj, level) => obj && obj[level], obj)
		}

		$scope.createReachabilityMapLegend = function(echartsOptions) {
			let legendEntries = [];
			let isochronesHeadingAdded = false;
			for(let i=0; i<echartsOptions.series.length; i++) {
				let series = echartsOptions.series[i];

				if(series.name === "spatialUnitBoundaries") {
					legendEntries.push({
						label: $scope.selectedSpatialUnit.spatialUnitName ? $scope.selectedSpatialUnit.spatialUnitName : $scope.selectedSpatialUnit.spatialUnitLevel,
						iconColor: series.itemStyle.borderColor,
						iconHeight: "4px",
						isGroupHeading: false
					});
				}

				if(series.name.includes("isochrones")) {

					if(!isochronesHeadingAdded) { // add heading above first isochrone entry
						legendEntries.push({
							label: "Erreichbarkeit",
							isGroupHeading: true
						})
						isochronesHeadingAdded = true;
					}

					let value = series.data[0].value;
					legendEntries.push({
						label: value,
						iconColor: series.data[0].itemStyle.areaColor,
						iconOpacity: series.data[0].itemStyle.opacity,
						iconHeight: "12px",
						isGroupHeading: false
					})
				}
			}
			

			let legendDiv = document.createElement("div");
			legendDiv.classList.add("map-legend")
			legendDiv.style.padding = "5px";
			legendDiv.style.position = "absolute";
			legendDiv.style.bottom = 0;
			legendDiv.style.right = 0;
			legendDiv.style.zIndex = 800;
			legendDiv.style.backgroundColor = "rgb(255, 255, 255)";
			legendDiv.style.fontSize = "8pt";

			let table = document.createElement("table");
			for(let entry of legendEntries) {
				let row = document.createElement("tr");
				let labelTd = document.createElement("td");

				if(entry.isGroupHeading) {
					labelTd.colSpan = 2;
					let heading = document.createElement("h5");
					heading.innerText = entry.label;
					heading.style.fontWeight = "bold";
					heading.style.fontSize = "8pt";
					labelTd.appendChild(heading);
					labelTd.style.textAlign = "left";
					row.appendChild(labelTd)
					table.appendChild(row) 
					continue;
				}

				labelTd.innerText = entry.label;
				labelTd.style.textAlign = "left";
				labelTd.style.paddingLeft = "5px";

				let iconTd = document.createElement("td");
				let icon = document.createElement("div");
				iconTd.appendChild(icon);

				icon.style.backgroundColor = entry.iconColor;
				if(entry.hasOwnProperty("iconOpacity")) {
					icon.style.opacity = entry.iconOpacity;	
				}
				icon.style.width = "30px";
				icon.style.height = entry.iconHeight;
				iconTd.style.height = "18px";
				
				row.appendChild(iconTd)
				row.appendChild(labelTd)
				table.appendChild(row) 
			}

			legendDiv.appendChild(table);
			return legendDiv;
		}
	}
]})