angular.module('reportingIndicatorAdd').component('reportingIndicatorAdd', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingIndicatorAdd/reporting-indicator-add.template.html",
	controller : ['$scope', '$http', '$timeout', '$interval', '__env', 'kommonitorDataExchangeService', 'kommonitorDiagramHelperService', 'kommonitorVisualStyleHelperService',
	function ReportingIndicatorAddController($scope, $http, $timeout, $interval, __env, kommonitorDataExchangeService, kommonitorDiagramHelperService, kommonitorVisualStyleHelperService) {

		$scope.template = undefined;
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
		$scope.dateSlider = undefined;
		$scope.absoluteLabelPositions = [];
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
				$timeout(function() {
					// we could filter the geoJson here to only include selected areas
					// but for now we get all areas and filter them out after
					$scope.initializeOrUpdateAllDiagrams();
					$scope.loadingData = false;
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
				textA = a.area.toLowerCase();
				textB = b.area.toLowerCase();
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
					titleEl.text = $scope.selectedIndicator.indicatorName + " [" + $scope.selectedIndicator.unit + "]";
					if(pageToInsert.area) {
						titleEl.text += ", " + pageToInsert.area
					}
					titleEl.isPlaceholder = false;

					let dateEl = pageToInsert.pageElements.find( el => {
						return el.type === "dataTimestamp+typeOfMovement-landscape"
					});
					dateEl.text = $scope.selectedTimestamps[0].name + ", Fortbewegungsmittel (TODO)";
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
			} else {
				pagesToInsert = JSON.parse(JSON.stringify(pagesToInsert));
				for(let page of pagesToInsert)
					page.id = $scope.templatePageIdCounter++;
				// no timestamp selected, insert as placeholder
				$scope.template.pages.splice($scope.indexOfFirstAreaSpecificPage, 0, ...pagesToInsertPerTimestamp)
			}
		}



		// internal array changes do not work with ng-change
		$scope.$watchCollection('selectedTimestamps', function(newVal, oldVal) {
			if( typeof($scope.template) === "undefined") return;
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

			function updateDiagrams() {
				if($scope.diagramsPrepared) {
					$interval.cancel(updateDiagramsInterval); // code below still executes once
				} else {
					return;
				}

				$timeout(function() {
					for(let timestamp of $scope.selectedTimestamps) {
						let classifyUsingWholeTimeseries = false;
						$scope.prepareDiagrams($scope.selectedIndicator, $scope.selectedSpatialUnit, timestamp.name, classifyUsingWholeTimeseries);
	
					}
					$scope.initializeOrUpdateAllDiagrams();
					$scope.loadingData = false;
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

			if($scope.template.name === "A4-landscape-timestamp")
				$scope.indexOfFirstAreaSpecificPage = 3;
			if($scope.template.name === "A4-landscape-timeseries")
				$scope.indexOfFirstAreaSpecificPage = 4;
			if($scope.template.name === "A4-landscape-reachability")
				$scope.indexOfFirstAreaSpecificPage = 1;

			// disbale all tabs except the first one (until an indicator is chosen)
			let tabPanes = document.querySelectorAll("#reporting-add-indicator-tab-content > .tab-pane")
			for(let i=1;i<=4;i++) {
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
			$scope.queryIndicators()
				.then( function () {
					$scope.removeAlreadyAddedIndicators(indicatorNames)
				});
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


		$scope.onSpatialUnitChanged = async function(selectedSpatialUnit) {
			$scope.loadingData = true;
			$("#reporting-spatialUnitChangeWarning").hide();
			$scope.timeseriesAdjustedOnSpatialUnitChange = false;
			await $scope.updateAreasInDualList()

			// There might be different valid timestamps for the new spatial unit.

			let validTimestamps = getValidTimestampsForSpatialUnit( selectedSpatialUnit.spatialUnitName );
			
			// Check if the currently selected timestamps are also available for the new spatial unit.
			// If one is not, deselect is and show an info to user
			let selectedTimestamps_old = [...$scope.selectedTimestamps];
			$scope.selectedTimestamps = $scope.selectedTimestamps.filter( el => {
				return validTimestamps.includes(el.name);
			});
			// if any timestamp was deselected show a warning alert
			if(selectedTimestamps_old.length > $scope.selectedTimestamps.length) {
				$("#reporting-spatialUnitChangeWarning").show();
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
			let features = $scope.availableFeaturesBySpatialUnit[ selectedSpatialUnit.spatialUnitName ]
			features = $scope.createLowerCaseNameProperty(features);
			let geoJSON = { features: features }
			$scope.selectedIndicator.geoJSON = geoJSON;
			
			// no need to check if diagrams are prepared here since we have to prepare them again anyway
			$timeout(function() {
				// prepare diagrams for all selected timestamps with all features
				for(let timestamp of $scope.selectedTimestamps) {
					let classifyUsingWholeTimeseries = false;
					$scope.prepareDiagrams($scope.selectedIndicator, selectedSpatialUnit, timestamp.name, classifyUsingWholeTimeseries);
				}
				$scope.initializeOrUpdateAllDiagrams();
				$scope.loadingData = false;
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
		 * Queries DataManagement API to get features of given indicator
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
			});
		}

		// availableFeaturesBySpatialUnit has to be populated before this method is called
		function getValidTimestampsForSpatialUnit(spatialUnitName) {
			// check if the most recent timestamp is valid for the selected spatial unit
			// if not try the second (third, fourth, ...) most recent
			// we assume that there is at least one valid timestamp for the spatial unit
			
			let validTimestamps = []; // result

			let features = $scope.availableFeaturesBySpatialUnit[ spatialUnitName ];
			if(!features) {
				let error = new Error("Tried to get valid timestamps but no features were cached.")
				kommonitorDataExchangeService.displayMapApplicationError(error.message)
			}
			// Iterate all features and add all properties that start with "DATE_" to 'validTimestamps'
			// Not sure if all features always have all timestamps, even if values are missing for some
			// If  that's the case this iteration could be reduced to the first feature
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

		
		$scope.onIndicatorSelected = async function(indicator) {
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
			let tab2 = document.querySelector("#reporting-add-indicator-tab2");
			let tab3 = document.querySelector("#reporting-add-indicator-tab3");
			let tab4 = document.querySelector("#reporting-add-indicator-tab4");
			$scope.disableTab(tab2);
			$scope.disableTab(tab3);
			$scope.disableTab(tab4);
			// set indicator manually.
			// if we use ng-model it gets converted to string instead of an object
			$scope.selectedIndicator = indicator;

			// get a new template (in case another indicator was selected previously)
			let cleanTemplate = angular.fromJson($scope.untouchedTemplateAsString);
			for(let page of cleanTemplate.pages) {
				page.id = $scope.templatePageIdCounter++;
			}
			$scope.template = cleanTemplate;

			
			// set spatial unit to highest available one
			$scope.selectedSpatialUnit = $scope.selectedIndicator.applicableSpatialUnits[0];

			// can be used in the area change listener to check if we are updating an indicator
			// we don't want to update diagrams in that case since this is done on timestamp/timeseries change later
			$scope.isIndicatorChange = true; 
			await $scope.updateAreasInDualList(); // this populates $scope.availableFeaturesBySpatialUnit

			// select most recent timestamp that is valid for the largest spatial unit
			let dates = $scope.selectedIndicator.applicableDates;
			let timestampsForSelectedSpatialUnit = getValidTimestampsForSpatialUnit( $scope.selectedSpatialUnit.spatialUnitName);
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
			// update indicator name and timestamp in preview
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

					if(el.type === "dataTimestamp+typeOfMovement-landscape") {
						el.text = mostRecentTimestampName + ", Fortbewegungsmittel (TODO)";
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

			$scope.enableTab(tab2);
			$scope.enableTab(tab3);
			$scope.enableTab(tab4);
		}

		$scope.onBackToOverviewClicked = function() {
			$scope.reset();
			$scope.$emit('reportingBackToOverviewClicked')

		}

		$scope.reset = function() {
			$scope.template = undefined;
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
			$scope.echartsOptions = {
				map: {},
				bar: {},
				line: {},
			}
			$scope.loadingData = false;
			$scope.templatePageIdCounter = 1;
			$scope.dateSlider = undefined;

			let tab2 = document.querySelector("#reporting-add-indicator-tab2");
			let tab3 = document.querySelector("#reporting-add-indicator-tab3");
			let tab4 = document.querySelector("#reporting-add-indicator-tab4");
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

		/**
		 * Creates and returns an echarts geoMap object.
		 * @param {*} wrapper | the dom element (most likely a div) where the map should be inserted
		 * @param {*} pageElement 
		 * @returns 
		 */
		$scope.createPageElement_Map = function(wrapper, page, pageElement) {
			
			// check if there is a map registered for this combination, if not register one with all features
			let mapName = undefined;
			let timestamp = undefined;
			
			// get the timestamp from pageElement, not from dom because dom might not be up to date yet
			let dateElement;
			// for reachability template dateElement is still undefined
			if($scope.template.name === "A4-landscape-reachability") {
				dateElement = page.pageElements.find( el => {
					return el.type === "dataTimestamp+typeOfMovement-landscape";
				});
				timestamp = dateElement.text.split(",")[0];
			} else {
				// the other two templates
				dateElement = page.pageElements.find( el => {
					// pageElement references the map here
					// do the comparison like this because we have maps with dataTimestamp and dataTimeseries in the timeseries template
					return el.type === (pageElement.isTimeseries ? "dataTimeseries-landscape" : "dataTimestamp-landscape");
				});

				if(pageElement.isTimeseries) {
					timestamp = dateElement.text.split(" - ")[1]; // get the recent timestamp
				} else {
					timestamp = dateElement.text;
				}
			}

			mapName = $scope.selectedIndicator.indicatorName + "_" + dateElement.text + "_" + $scope.selectedSpatialUnit.spatialUnitName;
			
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
			
			if($scope.template.name === "A4-landscape-reachability") {
				options.backgroundColor = "rgba(255,255,255,0)" // transparent, because we draw it over the leaflet map
			}

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
						// only show borders for reachability template
						if($scope.template.name === "A4-landscape-reachability") {
							el.itemStyle.areaColor = "rgb(255, 255, 255, 0)"; // 0 = transparent
							el.itemStyle.borderColor = "rgb(255, 153, 51)"
							el.itemStyle.borderWidth = 5;
							el.itemStyle.color = "rgb(255, 255, 255, 0)";
							el.emphasis.itemStyle.areaColor = "rgb(255, 255, 255, 0)";
							el.emphasis.itemStyle.borderColor = "rgb(255, 153, 51)"
							el.emphasis.itemStyle.borderWidth = 5;
							el.emphasis.itemStyle.color = "rgb(255, 255, 255, 0)";
						} else {
							el.itemStyle.areaColor = "rgb(255, 153, 51, 0.6)";
							el.itemStyle.color = "rgb(255, 153, 51, 0.6)";
							el.emphasis.itemStyle.areaColor = "rgb(255, 153, 51, 0.6)";
							el.emphasis.itemStyle.color = "rgb(255, 153, 51, 0.6)";
						}
						
					} else {
						// only show borders for any other areas
						el.itemStyle.color = "rgba(255, 255, 255, 1)";
						el.itemStyle.areaColor = "rgba(255, 255, 255, 1)";
						el.emphasis.itemStyle.color = "rgba(255, 255, 255, 1)";
						el.emphasis.itemStyle.areaColor = "rgba(255, 255, 255, 1)";
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
			if(!page.area) {
				options.labelLayout = function(feature) {
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
							// feature name is the first child ("first line")
							$scope.draggingLabelForFeature = target.parent._children[0].style.text;
						}
					}
				});

				map.getZr().on('mouseup', function(event) {
					if(event.target) {
						let target = event.target;
						if(target.parent && target.parent.type === "text") {
							// for all other maps that are not area-specific, do the exact same label drag
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
		
			map.setOption(options);

			// for reachability initialize the leaflet map beneath the transparent-background echarts map
			if($scope.template.name === "A4-landscape-reachability") {
				
				$timeout(function(page, pageElement, echartsMap) {
					let pageIdx = $scope.template.pages.indexOf(page);
					let pageDom = document.getElementById("reporting-addIndicator-page-" + pageIdx);
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

					let leafletMap = L.map("reporting-reachability-leaflet-map-container-" + pageIdx, {
						zoomControl: false,
						// prevents leaflet form snapping to closest pre-defined zoom level.
						// In other words, it allows us to set exact map extend by a (echarts) bounding box
						zoomSnap: 0 
					});
					let echartsOptions = echartsMap.getOption();
					// echarts uses [lon, lat], leaflet uses [lat, lon]
					let boundingCoords = echartsOptions.series[0].boundingCoords;
					let westLon = boundingCoords[0][0];
					let southLat = boundingCoords[1][1];
					let eastLon = boundingCoords[1][0];
					let northLat = boundingCoords[0][1];

					if(page.area && page.area.length) {
						for(feature of $scope.selectedIndicator.geoJSON.features) {
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
					// now update the echarts map
					boundingCoords = [ [bounds.getWest(), bounds.getNorth()], [bounds.getEast(), bounds.getSouth()]]
					echartsOptions.series[0].top = 0;
					echartsOptions.series[0].bottom = 0;
					echartsOptions.series[0].aspectScale = 0.625
					echartsOptions.series[0].boundingCoords = boundingCoords
					echartsMap.setOption(echartsOptions, {
						replaceMerge: ['series']
					});
					
					let osmLayer = new L.TileLayer.Grayscale("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
						attribution: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors",
					});
					osmLayer.addTo(leafletMap);

					// temp geojson
					let geoJsonLayer = L.geoJSON( $scope.selectedIndicator.geoJSON.features )
					geoJsonLayer.addTo(leafletMap)
				}, 0, true, page, pageElement, map)
			}
			return map;
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
					for(feature of selectedAreasFeatures) {
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
			$timeout(function(rowsData, page, maxRows) {
				// get current index of page (might have changed in the meantime)
				let idx = $scope.template.pages.indexOf(page)
				let wrapper = document.querySelector("#reporting-addIndicator-page-" + idx + "-datatable");
				wrapper.innerHTML = "";
				wrapper.style.border = "none"; // hide dotted border from outer dom element
				wrapper.style.justifyContent = "flex-start"; // align table at top instead of center
				let addedRowsCounter = 0;

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

				for(let data of rowsData) {
					let row = document.createElement("tr");
					row.style.height = "25px";
	
					for(let colName of columnNames) {
						let td = document.createElement("td");
						if(colName === "Bereich") {
							td.innerText = data.name;
							td.classList.add("text-left");
						}

						if(colName === "Zeitpunkt") {
							td.innerText = data.timestamp;
						}
						
						if(colName === "Wert") {
							td.innerText = data.value;
							td.classList.add("text-right");
						}

						row.appendChild(td);
					}
					
					// see which page we have to add the row to
					// switch to next page if necessary
					if(addedRowsCounter > 0 && addedRowsCounter % maxRows == 0) {
						idx++
						wrapper = document.querySelector("#reporting-addIndicator-page-" + idx + "-datatable");
						wrapper.innerHTML = "";
						wrapper.style.border = "none"; // hide dotted border from outer dom element
						wrapper.style.justifyContent = "flex-start"; // align table at top instead of center
						table = $scope.createDatatableSkeleton(columnNames);
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


		$scope.filterMapByAreaName = function(echartsInstance, areaName, allFeatures) {
			let options = echartsInstance.getOption();
			let mapName = options.series[0].map;
			// filter shown areas if we are in the area-specific part of the template
			// removing areas form the series doesn't work. We have to filter the geojson of the registered map
			features = allFeatures.filter ( el => {
				return el.properties.name === areaName
			});

			echarts.registerMap(mapName, { features: features } )
			echartsInstance.setOption(options) // set same options, but this updates the map
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

		$scope.initializeOrUpdateAllDiagrams = function() {
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
							let map = $scope.createPageElement_Map(pElementDom, page, pageElement);
							// filter visible areas if needed
							if(page.area && page.area.length) {
								$scope.filterMapByAreaName(map, page.area, $scope.selectedIndicator.geoJSON.features);
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
							$scope.createPageElement_Datatable(pElementDom, page, pageElement );
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
				$timeout(function() {
					$scope.initializeOrUpdateAllDiagrams();
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
				let validTimestamps = getValidTimestampsForSpatialUnit( $scope.selectedSpatialUnit.spatialUnitName );
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
			minIdx = 0;
			maxIdx = availableDates.length-1;
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
			// indicator has to be selected
			// at least one area has to be selected
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

			if($scope.selectedIndicator) {
				isIndicatorSelected = true;
			}
			if($scope.selectedAreas.length >= 1) {
				isAreaSelected = true;
			}

			if($scope.template.name === "A4-landscape-timestamp" && $scope.selectedTimestamps.length >= 1) {
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

			if(isIndicatorSelected && isAreaSelected && isTimestampSelected && !$scope.loadingData) {
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
	}
]})