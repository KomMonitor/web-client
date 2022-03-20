angular.module('reportingOverview').component('reportingOverview', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingOverview/reporting-overview.template.html",
	controller : ['$scope', '__env', '$timeout', '$http', 'kommonitorDataExchangeService', 'kommonitorDiagramHelperService',
	function ReportingOverviewController($scope, __env, $timeout, $http, kommonitorDataExchangeService, kommonitorDiagramHelperService) {

		/*
		{
			indicators: [
				{...},
				{...},
				...
			],
			pages: [
				{
					indicatorName: ... // e.g for sorting pages
					spatialUnitName: ....
					pageElements: [...]
				},
				{...},
				...
			],
			template: {...} // clean version of the template, without indicator data
		}
		*/
		$scope.config = {
			templateSections: [
				// {
				// 	indicator: "",
				// 	poiLayer: ""
				// }
			],
			pages: [],
			template: {}
		};
		$scope.loadingData = false;
		$scope.echartsImgPixelRatio = 2;

		$scope.initialize = function(data) {
			let configFileSelected = data[0];
			data = data[1];
			if(configFileSelected) {
				$scope.importConfig(data);
			} else {
				$scope.config.template = JSON.parse(JSON.stringify(data));
				$scope.config.pages = $scope.config.template.pages;
			}
			let deviceScreenDpi = calculateScreenDpi();
			$scope.pxPerMilli = deviceScreenDpi / 25.4 // /2.54 --> cm, /10 --> mm
		}

		$scope.sortableConfig = {
			onEnd: function (e) {
				// nothing for now, config elements get reordered automatically
			}
		};

		$scope.$on("reportingInitializeOverview", function(event, data) {
			// data is a nested array at this point [ [ { template object } ] ]
			$scope.initialize(data);
		})

		$scope.onConfigureNewIndicatorClicked = function() {
			$scope.$emit('reportingConfigureNewIndicatorClicked', [$scope.config.template])
		}

		$scope.onConfigureNewPoiLayerClicked = function() {
			$scope.$emit('reportingConfigureNewPoiLayerClicked', [$scope.config.template])
		}
		
		$scope.onBackToTemplateSelectionClicked = function() {
			$scope.$emit('reportingBackToTemplateSelectionClicked')
		}

		$scope.$on("reportingIndicatorConfigurationCompleted", function(event, data) {
			$scope.loadingData = true;
			let [indicator, template] = data;
			
			let templateSection = {
				indicatorName: indicator ? indicator.indicatorName : "",
				indicatorId: indicator ? indicator.indicatorId : "",
				poiLayerName: "",
				spatialUnitName: template.spatialUnitName,
				absoluteLabelPositions: template.absoluteLabelPositions,
				echartsRegisteredMapNames: template.echartsRegisteredMapNames,
				echartsMaps: []
			}
			for(let page of template.pages) {
				page.templateSection = templateSection;
			}
			// remove the placeholder template if this is the first section that gets added)
			$scope.config.pages = $scope.config.pages.filter( page => {
				if(page.hasOwnProperty("templateSection")) {
					return page.templateSection.hasOwnProperty("indicatorName");
				} else {
					return false;
				}
			});
			// append to array
			$scope.config.pages.push(...template.pages);
			
			$scope.config.templateSections.push(templateSection);
				
			// setup pages after dom exists
			// at this point we still have all the echarts maps registered
			$scope.setupNewPages($scope.config.templateSections.at(-1));
		});

		$scope.$on("reportingPoiLayerConfigurationCompleted", function(event, data) {
			$scope.loadingData = true;
			// add indicator to 'added indicators'
			let [poiLayer, indicator, template] = data;

			let templateSection = {
				indicatorName: indicator ? indicator.indicatorName : "",
				indicatorId: indicator ? indicator.indicatorId : "",
				poiLayerName: poiLayer.datasetName,
				spatialUnitName: template.spatialUnitName,
				absoluteLabelPositions: template.absoluteLabelPositions,
				echartsRegisteredMapNames: template.echartsRegisteredMapNames,
				echartsMaps: []
			}
			for(let page of template.pages) {
				page.templateSection = templateSection;
			}
			// remove all pages without property poiLayerName (clean template)
			$scope.config.pages = $scope.config.pages.filter( page => {
				if(page.hasOwnProperty("templateSection")) {
					return page.templateSection.hasOwnProperty("poiLayerName");
				} else {
					return false;
				}
			});
			// append to array
			$scope.config.pages.push(...template.pages);
			$scope.config.templateSections.push(templateSection);
				
			// setup pages after dom exists
			// at this point we still have all the echarts maps registered
			$scope.setupNewPages($scope.config.templateSections.at(-1));
		});

		$scope.removeTemplateSection = function(idx) {
			$scope.config.templateSections.splice(idx, 1)

			// show empty template if this was the last indicator
			if($scope.config.templateSections.length === 0) {
				$scope.config.pages = $scope.config.template.pages;
			}
		}

		
		$scope.$watchCollection('config.templateSections', function(newVal, oldVal) {
			
			if(newVal.length < oldVal.length) { // removed
				// find removed section
				let difference = oldVal
					.filter(x => !newVal.includes(x))
					.concat(newVal.filter(x => !oldVal.includes(x)));

				let removedSection = difference[0];
				// remove all pages for that section
				$scope.config.pages = $scope.config.pages.filter( page => {
					if(!page.hasOwnProperty("templateSection")) return true; // for placeholder
					
					return page.templateSection.indicatorId !== removedSection.indicatorId ||
						page.templateSection.spatialUnitId !== removedSection.spatialUnitId ||
						page.templateSection.poiLayerName !== removedSection.poiLayerName
				});
			}
			if(newVal.length === oldVal.length) { // order changed
				// sort pages according to newVal
				let sorted = [];
				for(let section of newVal) {
					for(let page of $scope.config.pages) {
						if(page.templateSection.indicatorId === section.indicatorId &&
							page.templateSection.spatialUnitId === section.spatialUnitId &&
							page.templateSection.poiLayerName === section.poiLayerName) {

							sorted.push(page);
						}
					}
				}
				$scope.config.pages = sorted;
			}
		});

		


		$scope.setupNewPages = function(templateSection) {

			$timeout(async function(templateSection) {
				if(!templateSection.poiLayerName) {

					// for indicator without poi layer
					let indicatorId = templateSection.indicatorId;
					let spatialUnit, featureCollection, features, geoJSON;
					let isFirstPageToAdd = true;
					for(let [idx, page] of $scope.config.pages.entries()) {

						if(page.templateSection.indicatorId !== indicatorId) {
							continue; // only do changes to new pages
						} else {
							// Indicator and spatial unit are the same for all added pages
							// We only need to query features on the first page that we add
							if(isFirstPageToAdd) {
								isFirstPageToAdd = false;
								spatialUnit = await $scope.getSpatialUnitByIndicator(indicatorId, page.templateSection.spatialUnitName)
								featureCollection = await $scope.queryFeatures(indicatorId, spatialUnit);
								features = $scope.createLowerCaseNameProperty(featureCollection.features);
								geoJSON = { features: features };

							}
						}

						let pageDom = document.querySelector("#reporting-overview-page-" + idx);
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
								pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)
							}
							
							// recreate boxplots, itemNameFormatter did not get transferred
							if(pageElement.type === "linechart" && pageElement.showBoxplots) {
								let xAxisLabels = pageElement.echartsOptions.xAxis[0].data;
								pageElement.echartsOptions.dataset[1].transform.config = {
									itemNameFormatter: function (params) {
										return xAxisLabels[params.value];
									}
								}
							}

							if(pageElement.type === "map" || pageElement.type === "barchart" || pageElement.type === "linechart") {
								let instance = echarts.init( pElementDom );


								if(pageElement.type === "map") {
									
									if(page.area && page.area.length) {
										// at this point we have not yet set echarts options, so we provide them as an extra parameter
										$scope.filterMapByArea(instance, pageElement.echartsOptions, page.area, geoJSON.features)
									} else {
										// recreate label positions
										pageElement.echartsOptions.labelLayout = function(feature) {
											// Set fixed position for labels that were previously dragged by user
											// For all other labels try to avoid overlaps
											let names = page.templateSection.absoluteLabelPositions.map(el=>el.name)
											let text = feature.text.split("\n")[0] // area name is the first line
											if(names.includes(text)) {
												let idx = names.indexOf(text)
												return {
													x: page.templateSection.absoluteLabelPositions[idx].x,
													y: page.templateSection.absoluteLabelPositions[idx].y,
													draggable: false // Don't allow label dragging in overview, we could have different spatial units here
												}
											} else {
												return {
													moveOverlap: 'shiftY',
													x: feature.rect.x + feature.rect.width / 2,
													draggable: false
												}
											}	
										}
									}
								}
								instance.setOption(pageElement.echartsOptions)
							}

							if(pageElement.type === "overallAverage") {
								pageDom.querySelector(".type-overallAverage").style.border = "none";
							}
	
							if(pageElement.type === "selectionAverage") {
								pageDom.querySelector(".type-selectionAverage").style.border = "none";
							}

							if(pageElement.type === "mapLegend") {
								pageElement.isPlaceholder = false;
								pageDom.querySelector(".type-mapLegend").style.display = "none";
							}

							if(pageElement.type === "overallChange") {
								let wrapper = pageDom.querySelector(".type-overallChange")
								wrapper.style.border = "none";
								wrapper.style.left = "670px";
								wrapper.style.width = "130px";
								wrapper.style.height = "100px";
							}

							if(pageElement.type === "selectionChange") {
								let wrapper = pageDom.querySelector(".type-selectionChange")
								wrapper.style.border = "none";
								wrapper.style.left = "670px";
								wrapper.style.width = "130px";
								wrapper.style.height = "100px";
							}

							if(pageElement.type === "datatable") {
								$scope.createDatatablePage(pElementDom, pageElement);
							}
						}
					}
					$scope.loadingData = false;
					$scope.$apply();
				} else {
					$scope.handleSetupNewPagesForReachability(templateSection)
				}
			}, 0, false, templateSection);
		}

		

		$scope.handleSetupNewPagesForReachability = async function(templateSection) {
			let poiLayerName = templateSection.poiLayerName;
			let spatialUnit, featureCollection, features, geoJSON, indicatorId;
			// if indicator was chosen
			if( templateSection.indicatorId) {
				indicatorId = templateSection.indicatorId;
			}
			let isFirstPageToAdd = true;
			for(let [idx, page] of $scope.config.pages.entries()) {

				if(page.templateSection.poiLayerName !== poiLayerName) {
					continue; // only do changes to new pages
				} else {
					// PoiLayer, Indicator and spatial unit are the same for all added pages
					// We only need to query features on the first page that we add
					if(isFirstPageToAdd) {
						isFirstPageToAdd = false;
						if(indicatorId) {
							spatialUnit = await $scope.getSpatialUnitByIndicator(indicatorId, page.templateSection.spatialUnitName);
							featureCollection = await $scope.queryFeatures(indicatorId, spatialUnit);
						} else {
							spatialUnit = await $scope.getSpatialUnitByName(page.templateSection.spatialUnitName);
							featureCollection = await $scope.queryFeatures(undefined, spatialUnit);
						}
						
						features = $scope.createLowerCaseNameProperty(featureCollection.features);
						geoJSON = { features: features };

					}
				}

				let pageDom = document.querySelector("#reporting-overview-page-" + idx);
				for(let pageElement of page.pageElements) {
					let pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)

					if(pageElement.type === "map") {
						let instance = echarts.init( pElementDom );

						if(page.area && page.area.length) {
							// at this point we have not yet set echarts options, so we provide them as an extra parameter
							$scope.filterMapByArea(instance, pageElement.echartsOptions, page.area, geoJSON.features)
						} else {
							// recreate label positions
							pageElement.echartsOptions.labelLayout = function(feature) {
								// Set fixed position for labels that were previously dragged by user
								// For all other labels try to avoid overlaps
								let names = page.templateSection.absoluteLabelPositions.map(el=>el.name)
								let text = feature.text.split("\n")[0] // area name is the first line
								if(names.includes(text)) {
									let idx = names.indexOf(text)
									return {
										x: page.templateSection.absoluteLabelPositions[idx].x,
										y: page.templateSection.absoluteLabelPositions[idx].y,
										draggable: false // Don't allow label dragging in overview, we could have different spatial units here
									}
								} else {
									return {
										moveOverlap: 'shiftY',
										x: feature.rect.x + feature.rect.width / 2,
										draggable: false
									}
								}	
							}
						}

						instance.setOption( pageElement.echartsOptions )

						$scope.initializeLeafletMap(page, pageElement, instance, spatialUnit)
					}
				}
			}
			$scope.loadingData = false;
			$scope.$apply();
		}

		$scope.initializeLeafletMap = function(page, pageElement, map, spatialUnit) {
			$timeout(function(page, pageElement, echartsMap, spatialUnit) {
				let pageIdx = $scope.config.pages.indexOf(page);
				let id = "reporting-overview-reachability-leaflet-map-container-" + pageIdx;
				let pageDom = document.getElementById("reporting-overview-page-" + pageIdx);
				let pageElementDom = document.getElementById("reporting-overview-page-" + pageIdx + "-map");
				let oldMapNode = document.getElementById(id);
				if(oldMapNode) {
					oldMapNode.remove();
				}
				let div = document.createElement("div");
				div.id = id;
				div.style.position = "absolute";
				div.style.left = pageElement.dimensions.left;
				div.style.top = pageElement.dimensions.top;
				div.style.width = pageElement.dimensions.width;
				div.style.height = pageElement.dimensions.height;
				div.style.zIndex = 10;
				pageDom.appendChild(div);
				let echartsOptions = echartsMap.getOption();
			
				let leafletMap = L.map(div.id, {
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

				L.easyPrint({
					title: '',
					position: 'topleft',
					sizeModes: ['Current'],
					outputMode: 'event', // We are only interested in the data, not actually downloading the image
					hidden: true,
					filename: "doesNotMatter.png",
					hideControlContainer: true,
					defaultSizeTitles: { Current: 'Aktueller Kartenausschnitt' }
				}).addTo(leafletMap);

				leafletMap.on("easyPrint-finished", function(event) {
					$scope.leafletEasyPrintResult = event.event
				})


				// manually create a field for attribution so we can control the z-index.
				let prevAttributionDiv = pageDom.querySelector(".map-attribution")
				if(prevAttributionDiv) prevAttributionDiv.remove();
				let attrDiv = kommonitorDiagramHelperService.createReportingReachabilityMapAttribution();
				pageElementDom.appendChild(attrDiv)
				// also create the legend manually
				let prevLegendDiv = pageDom.querySelector(".map-legend")
				if(prevLegendDiv) prevLegendDiv.remove();
				let legendDiv = kommonitorDiagramHelperService.createReportingReachabilityMapLegend(echartsOptions, spatialUnit);
				pageElementDom.appendChild(legendDiv)
			
				// we have the bbox stored in config
				// pageElement.leafletBbox is invalid after export and import. Maybe because the prototype object gets removed...
				// We create a new bounds object from the stored data
				let bounds = L.latLngBounds(pageElement.leafletBbox._southWest, pageElement.leafletBbox._northEast);
				leafletMap.fitBounds( bounds );
				
				let osmLayer = new L.TileLayer.Grayscale("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
					attribution: "Map data © <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors",
				});
				osmLayer.addTo(leafletMap);

				// add leaflet map to pageElement in case we need it again later
				pageElement.leafletMap = leafletMap;
			
				// can be used to check if positioning in echarts matches the one from leaflet
				//let geoJsonLayer = L.geoJSON( $scope.geoJsonForReachability.features )
				//geoJsonLayer.addTo(leafletMap)
				//let isochronesLayer = L.geoJSON( $scope.isochrones.features )
				//isochronesLayer.addTo(leafletMap);

				if(pageIdx === $scope.config.template.pages.length-1) {
					$scope.updatingLeafletMaps = false;
					$scope.loadingData = false;
				}
			}, 0, true, page, pageElement, map, spatialUnit)
		}

		$scope.getSpatialUnitByName = async function(spatialUnitName) {
			let url;
			url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/spatial-units"
			// send request
			return await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
				let spatialUnit = response.data.filter( el => {
					return el.spatialUnitLevel === spatialUnitName;
				})

				if(spatialUnit.length === 1)
				return spatialUnit[0]
			}, function errorCallback(error) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				$scope.loadingData = false;
				kommonitorDataExchangeService.displayMapApplicationError(error);
				console.error(response.statusText);
			});
		}

		$scope.getSpatialUnitByIndicator = async function(indicatorId, spatialUnitName) {
			let url;
			url = kommonitorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + indicatorId;
			// send request
			return await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
				let spatialUnit = response.data.applicableSpatialUnits.filter( el => {
					return el.spatialUnitName === spatialUnitName;
				})
				if(spatialUnit.length === 1) return spatialUnit[0];

			}, function errorCallback(error) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				$scope.loadingData = false;
				kommonitorDataExchangeService.displayMapApplicationError(error);
				console.error(response.statusText);
			});
		}

		
		$scope.filterMapByArea = function(echartsInstance, echartsInstanceOptions, areaName, allFeatures) {
			let mapName = echartsInstanceOptions.series[0].map;
			// filter shown areas if we are in the area-specific part of the template
			features = allFeatures.filter ( el => {
				return el.properties.name === areaName
			});

			echarts.registerMap(mapName, { features: features } )
			echartsInstance.setOption(echartsInstanceOptions) // set same options, but this updates the map
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


		$scope.createDatatablePage = function(pElementDom, pageElement) {
			pElementDom.innerHTML = "";
			pElementDom.style.border = "none"; // hide dotted border from outer dom element
			pElementDom.style.justifyContent = "flex-start"; // align table at top instead of center
			// add data
			let table = $scope.createDatatableSkeleton(pageElement.columnNames);
			let tbody = table.querySelector("tbody")
			// tabledata is a nested array with one sub-array per row
			for(let row of pageElement.tableData) {
				let tr = document.createElement("tr");
				tr.style.height = "25px";
				for(let i=0; i<row.length; i++) {
					let td = document.createElement("td");
					td.innerText = row[i];
					// get corresponding column name for styling
					let colName = pageElement.columnNames[i];
					if(colName === "Bereich") {
						td.classList.add("text-left");
					}
					if(colName === "Wert") {
						td.classList.add("text-right");
					}

					tr.appendChild(td);
				}
				tbody.appendChild(tr);
			}
			pElementDom.appendChild(table);
		}


		$scope.importConfig = function(config) {
			$scope.loadingData = true;
			$scope.$apply();
			try {
				// restore commune logo for every page, starting at the second
				let communeLogoSrc = ""; // base64 string
				for(let [idx, page] of config.pages.entries()) {
					for(let pageElement of page.pageElements) {
						if(pageElement.type === "communeLogo-landscape" && idx === 0) {
							if(pageElement.src && pageElement.src.length) {
								communeLogoSrc = pageElement.src;
							} else {
								break; // no logo was exported
							}
						}

						if(pageElement.type === "communeLogo-landscape" && idx > 0) {
							pageElement.src = communeLogoSrc;
						}
					}
				}

				$scope.config.template = config.template;
				$scope.config.pages = config.pages;
				$scope.config.templateSections = config.templateSections;

				// register echarts maps
				for(let section of $scope.config.templateSections) {
					console.log(section);
					for(let mapName of section.echartsRegisteredMapNames) {
						if($scope.config.template.name === "A4-landscape-reachability") {
							if(!mapName.includes("_isochrones")) {
								let geoJson = section.echartsMaps.filter( map => map.name === section.poiLayerName)[0].geoJson
								echarts.registerMap(mapName, geoJson)
							} else {
								let geoJson = section.echartsMaps.filter( map => map.name === mapName)[0].geoJson
								echarts.registerMap(mapName, geoJson)
							}
						} else {
							let geoJson = section.echartsMaps[0].geoJson
							echarts.registerMap(mapName, geoJson)
						}
					}
				}

				for(let page of $scope.config.pages) {
					for(let pageElement of page.pageElements) {
						if(pageElement.type === "map" && pageElement.hasOwnProperty("echartsMaps")) {
							for(let map of pageElement.echartsMaps) {
								echarts.registerMap(map.name, map.geoJson)
							}
						}
					}
				}
				$scope.$apply();

				for(let section of $scope.config.templateSections) {
					$scope.setupNewPages(section);
				}
			} catch (error) {
				$scope.loadingData = false;
				kommonitorDataExchangeService.displayMapApplicationError(error.message);
			}
		}

		$scope.exportConfig = function() {
			try {
				let jsonToExport = {};
				
				let temp = JSON.stringify( $scope.config.pages, function(key, value) {
					// Leaflet map contains cyclic object references so we have to remove it.
					// We have to initialize the map again on import based on the stored boundingbox
					if(key === "leafletMap") {
						return undefined;
					} else {
						return value;
					}
				})

				jsonToExport.pages = JSON.parse( temp )
				jsonToExport.template = angular.fromJson(angular.toJson( $scope.config.template ));
				jsonToExport.templateSections = $scope.config.templateSections;

				// Only store commune logo once (in first page)
				// It is base64 encoded and adds quite a bit to the file size
				for(let [idx, page] of jsonToExport.pages.entries()) {
					for(let pageElement of page.pageElements) {
						if(pageElement.type === "communeLogo-landscape" && idx > 0) {
							pageElement.src = "";
						}
					}
				}
				
				for(let section of jsonToExport.templateSections) {
					let mapNames = [...new Set(section.echartsRegisteredMapNames)]
					if($scope.config.template.name === "A4-landscape-reachability") {
						let mapAdded = false;
						for(let name of mapNames) {
							// store all isochrones
							if(name.includes("_isochrones")) {
								let map = echarts.getMap(name)
								section.echartsMaps.push({
									name: name,
									geoJson: map.geoJson
								})
							}
							// all other maps have the same geojson, so we only store them once
							if(!mapAdded && name.includes(section.poiLayerName)) {
								let map = echarts.getMap(name)
								section.echartsMaps.push({
									name: section.poiLayerName,
									geoJson: map.geoJson
								})
								mapAdded = true;
							}

						}
					} else {
						// geojson is the same for all maps so we just pick the fist one
						let map = echarts.getMap(mapNames[0])
						section.echartsMaps.push({
							name: mapNames[0],
							geoJson: map.geoJson
						})
					}
				}

				let jsonString = "data:text/json;charset=utf-8," + encodeURIComponent( angular.toJson(jsonToExport) );
				// to download json, a DOM element is created, clicked and removed
				let downloadAnchorNode = document.createElement('a');
				downloadAnchorNode.setAttribute("href", jsonString);
				downloadAnchorNode.setAttribute("download", getCurrentDateAndTime() + "_KomMonitor-Reporting-Konfiguration.json");
				document.body.appendChild(downloadAnchorNode); // required for firefox
				downloadAnchorNode.click();
				downloadAnchorNode.remove();
			} catch (error) {
				kommonitorDataExchangeService.displayMapApplicationError(error.message);
				console.error(error)
			}
			
		}

		function getCurrentDateAndTime() {
			let date = new Date();
			let year = date.getFullYear().toString();
			let month = date.getMonth() + 1;
			let day = date.getDate();
			let time = date.getHours();
			let minutes = date.getMinutes();
			let seconds = date.getSeconds();
			let now = "".concat(year, "-", month, "-", day, "_", time, "-", minutes, "-", seconds);
			return now;
		}


		function getIndicatorByName(indicatorName) {
			let result;
			for(let indicator of kommonitorDataExchangeService.availableIndicators) {
				if(indicator.indicatorName === indicatorName) {
					result = indicator;
					break;
				}
			}
			if(result) {
				return result
			} else {
				throw new Error("No indicator could be found for name: " + indicatorName)
			}
		}

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

		$scope.$on("reportingGenerateReport", function(event, format) {
			$scope.generateReport(format);
		});

		$scope.generateReport = async function(format) {
			$scope.loadingData = true;

			try {
				format === "pdf" && $scope.generatePdfReport();
				format === "docx" && $scope.generateWordReport();
				format === "zip" && $scope.generateZipFolder();
			} catch (error) {
				$scope.loadingData = false;
				kommonitorDataExchangeService.displayMapApplicationError(error.message);
			}
		}
			
		$scope.generatePdfReport = async function() {
			
			// create pdf document
			let doc = new jsPDF({
				margin: 0,	
				unit: 'mm',
				format: 'a4',
				orientation: "landscape"
			});

			// general settings
			let fontName = "Helvetica";
			doc.setDrawColor(148, 148, 148);
			doc.setFont(fontName, "normal", "normal"); // name, normal/italic, fontweight

			
			let pageIsSectionStart = true;
			// screenshot map attribution and legend only once per section
			let mapLegendDataUrl, mapAttributionDataUrl, mapLegendCanvas, mapAttributionCanvas;

			for(let [idx, page] of $scope.config.pages.entries()) {
				$scope.leafletEasyPrintResult = undefined;

				if(idx > 0) {
					doc.addPage();
					pageIsSectionStart = false;
				}
				
				if($scope.config.template.name === "A4-landscape-reachability") {
					if(idx > 0 && (page.templateSection.poiLayerName !== $scope.config.pages[idx-1].templateSection.poiLayerName || 
						page.templateSection.indicatorId !== $scope.config.pages[idx-1].templateSection.indicatorId ||
						page.templateSection.spatialUnitName !== $scope.config.pages[idx-1].templateSection.spatialUnitName)) {
						pageIsSectionStart = true;
					}

					if(pageIsSectionStart) {
						// let previewArea = document.querySelector("#reporting-overview-preview-area")
						// previewArea.append(node)
						mapLegendCanvas= await html2canvas(document.querySelectorAll(".map-legend")[0], {
							onclone: function(clonedDoc) {
								let node = clonedDoc.querySelectorAll(".map-legend")[0]
								node.style.paddingLeft = 0;
							}
						})
						
						mapLegendDataUrl = mapLegendCanvas.toDataURL()
						mapAttributionCanvas = await html2canvas(document.querySelectorAll(".map-attribution")[0], {
							onclone: function(clonedDoc) {
								let node = clonedDoc.querySelectorAll(".map-attribution")[0]
								node.style.paddingLeft = 0;
							}
						})
						mapAttributionDataUrl = mapAttributionCanvas.toDataURL()
					}
				}

				
				let pageDom = document.querySelector("#reporting-overview-page-" + idx);
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
						pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)
					}
					// convert dimensions to millimeters here
					// that way we don't have to use pxToMilli everywhere we use coordinates in the pdf
					let pageElementDimensions = {}
					pageElementDimensions.top = pageElement.dimensions.top && pxToMilli(pageElement.dimensions.top);
					pageElementDimensions.bottom = pageElement.dimensions.bottom && pxToMilli(pageElement.dimensions.bottom);
					pageElementDimensions.left = pageElement.dimensions.left && pxToMilli(pageElement.dimensions.left);
					pageElementDimensions.right = pageElement.dimensions.right && pxToMilli(pageElement.dimensions.right);
					pageElementDimensions.width = pageElement.dimensions.width && pxToMilli(pageElement.dimensions.width);
					pageElementDimensions.height = pageElement.dimensions.height && pxToMilli(pageElement.dimensions.height);
					
					// TODO some cases could be merged, but it's better to do that later when stuff works
					switch(pageElement.type) {
						case "indicatorTitle-landscape": {
							// Css takes the top-left edge of the element by default.
							// doc.text takes left-bottom, so we ass baseline "top" to achieve the same behavior in jspdf.
							doc.setFont(fontName, "Bold")
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" });
							doc.setFont(fontName, "normal", "normal")
							break;
						}
						case "communeLogo-landscape": {
							// only add logo if one was selected
							if(pageElement.src && pageElement.src.length) {
								doc.addImage(pageElement.src, "JPEG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							}
							break;
						}
						case "dataTimestamp-landscape": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "dataTimeseries-landscape": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "reachability-subtitle-landscape": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "footerHorizontalSpacer-landscape": {
							let x1, x2, y1, y2;
							x1 = pageElementDimensions.left;
							x2 = pageElementDimensions.left + pageElementDimensions.width;
							y1 = pageElementDimensions.top;
							y2 = pageElementDimensions.top;
							doc.line(x1, y1, x2, y2);
							break;
						}
						case "footerCreationInfo-landscape": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "pageNumber-landscape": {
							let text = "Seite " + (idx+1);
							doc.text(text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						// template-specific elements
						case "map": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let imageDataUrl = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )

							if($scope.config.template.name === "A4-landscape-reachability") {
								imageDataUrl = await $scope.createReachabilityMapImage(pageElement, imageDataUrl, mapLegendCanvas, mapLegendDataUrl, mapAttributionCanvas, mapAttributionDataUrl)
							}
							doc.addImage(imageDataUrl, "PNG", pageElementDimensions.left, pageElementDimensions.top,
								pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						// case "mapLegend" can be ignored since it is included in the map if needed
						case "overallAverage":
						case "selectionAverage": {
							let x, y, width, height;
							x = pageElementDimensions.left;
							y = pageElementDimensions.top;
							width = pageElementDimensions.width;
							height = pageElementDimensions.height;
							doc.rect(x, y, width, height);
							let avgType = pageElement.type === "overallAverage" ? "Gesamtstadt" : "Selektion"
							let text = "Durchschnitt\n" + avgType + ":\n" + pageElement.text.toString()
							doc.text(text, pageElementDimensions.left + pxToMilli(5), pageElementDimensions.top + pxToMilli(5), { baseline: "top" });
							break;
						}
						case "overallChange":
						case "selectionChange": {
							let x = pxToMilli(670);
							let y = pageElementDimensions.top;
							let width = pxToMilli(130);
							let height = pxToMilli(80);
							doc.rect(x, y, width, height);
							let changeType = pageElement.type === "overallChange" ? "Gesamtstadt" : "Selektion"
							let text = "Durchschnittliche\nVeränderung\n" + changeType + ":\n" + pageElement.text.toString()
							doc.text(text, x + pxToMilli(5), y + pxToMilli(5), { baseline: "top" });
							break;
						}
						case "barchart": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let base64String = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )
							doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						case "linechart": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let base64String = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )
							doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						case "textInput": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, {
								baseline: "top",
								maxWidth: pageElementDimensions.width
							})
							break;
						}
						case "datatable": {
							doc.autoTable({
								html: "#reporting-overview-page-" + idx + "-" + pageElement.type + " table",
								startY: pageElementDimensions.top,
								tableWidth: "wrap",
								margin: {left: pageElementDimensions.left},
								theme: "grid",
								//headStyles: {
								//	fillColor: false, // transparent
								//	textColor: [0, 0, 0],
								//}
							})
							break;
						}
					}
				}
			}

			//doc.output("dataurlnewwindow")
			let now = getCurrentDateAndTime();
			doc.save(now + "_KomMonitor-Report.pdf");
			$scope.loadingData = false;
		}

		
		$scope.generateZipFolder = async function() {
			// creates a zip folder containing all echarts files
			let zip = new JSZip();
			
			$scope.leafletEasyPrintResult = undefined;
			// screenshot map attribution and legend only once per section
			let mapLegendDataUrl, mapAttributionDataUrl, mapLegendCanvas, mapAttributionCanvas;
			for(let [idx, page] of $scope.config.pages.entries()) {
				let pageIsSectionStart = (idx === 0); 
				
				if($scope.config.template.name === "A4-landscape-reachability") {
					if(idx > 0 && (page.templateSection.poiLayerName !== $scope.config.pages[idx-1].templateSection.poiLayerName || 
						page.templateSection.indicatorId !== $scope.config.pages[idx-1].templateSection.indicatorId ||
						page.templateSection.spatialUnitName !== $scope.config.pages[idx-1].templateSection.spatialUnitName)) {
						pageIsSectionStart = true;
					}

					if(pageIsSectionStart) {
						// let previewArea = document.querySelector("#reporting-overview-preview-area")
						// previewArea.append(node)
						mapLegendCanvas= await html2canvas(document.querySelectorAll(".map-legend")[0], {
							onclone: function(clonedDoc) {
								let node = clonedDoc.querySelectorAll(".map-legend")[0]
								node.style.paddingLeft = 0;
							}
						})
						
						mapLegendDataUrl = mapLegendCanvas.toDataURL()
						mapAttributionCanvas = await html2canvas(document.querySelectorAll(".map-attribution")[0], {
							onclone: function(clonedDoc) {
								let node = clonedDoc.querySelectorAll(".map-attribution")[0]
								node.style.paddingLeft = 0;
							}
						})
						mapAttributionDataUrl = mapAttributionCanvas.toDataURL()
					}
				}

				let pageDom = document.querySelector("#reporting-overview-page-" + idx);
				for(let pageElement of page.pageElements) {
					if(pageElement.type === "map" || pageElement.type === "barchart" || pageElement.type === "linechart") {
						let pElementDom;
						if(pageElement.type === "linechart") {
							let arr = pageDom.querySelectorAll(".type-linechart");
							if(pageElement.showPercentageChangeToPrevTimestamp) {
								pElementDom = arr[1];
							} else {
								pElementDom = arr[0];
							}
						} else {
							pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)
						}
						let instance = echarts.getInstanceByDom(pElementDom);
						let imageDataUrl = instance.getDataURL({
							type: "png",
							pixelRatio: $scope.echartsImgPixelRatio
						});

						if($scope.config.template.name === "A4-landscape-reachability") {
							imageDataUrl = await $scope.createReachabilityMapImage(pageElement, imageDataUrl, mapLegendCanvas, mapLegendDataUrl, mapAttributionCanvas, mapAttributionDataUrl)
						}
						
						let filename = "Seite_" + (idx+1) + "_" + pageElement.type + ".png";
						if(pageElement.type === "linechart" && pageElement.showPercentageChangeToPrevTimestamp) {
							// two elements with same type on one page
							// use a different filename for one of them so we don't overwrite the other image
							filename = filename.replace(".png", "-proz.Veraenderung.png"); 
						}
							
						zip.file(filename, dataURItoBlob(imageDataUrl), "");
					}
				}
			}

			let zipFileName = getCurrentDateAndTime() + "_Kommonitor-Report-Grafiken";
			zip.generateAsync({type:"blob"}).then(function(content) {
				saveAs(content, zipFileName + ".zip");
				$scope.loadingData = false;
				$scope.$apply();
			});
		}

		let sections = []; // one section per page for now, since this is an easy way to create page breaks

		$scope.generateWordReport = async function() {
			// see docx documentation for more info about the format:
			// https://docx.js.org/#/?id=basic-usage

			$scope.leafletEasyPrintResult = undefined;
			let font = "Calibri";
			// screenshot map attribution and legend only once per section
			let mapLegendDataUrl, mapAttributionDataUrl, mapLegendCanvas, mapAttributionCanvas;
			for(let [idx, page] of $scope.config.pages.entries()) {

				let pageIsSectionStart = (idx === 0); 
				
				if($scope.config.template.name === "A4-landscape-reachability") {
					if(idx > 0 && (page.templateSection.poiLayerName !== $scope.config.pages[idx-1].templateSection.poiLayerName || 
						page.templateSection.indicatorId !== $scope.config.pages[idx-1].templateSection.indicatorId ||
						page.templateSection.spatialUnitName !== $scope.config.pages[idx-1].templateSection.spatialUnitName)) {
						pageIsSectionStart = true;
					}

					if(pageIsSectionStart) {
						// let previewArea = document.querySelector("#reporting-overview-preview-area")
						// previewArea.append(node)
						mapLegendCanvas= await html2canvas(document.querySelectorAll(".map-legend")[0], {
							onclone: function(clonedDoc) {
								let node = clonedDoc.querySelectorAll(".map-legend")[0]
								node.style.paddingLeft = 0;
							}
						})
						
						mapLegendDataUrl = mapLegendCanvas.toDataURL()
						mapAttributionCanvas = await html2canvas(document.querySelectorAll(".map-attribution")[0], {
							onclone: function(clonedDoc) {
								let node = clonedDoc.querySelectorAll(".map-attribution")[0]
								node.style.paddingLeft = 0;
							}
						})
						mapAttributionDataUrl = mapAttributionCanvas.toDataURL()
					}
				}

				let paragraphs = [];
				let pageDom = document.querySelector("#reporting-overview-page-" + idx);
				for(let pageElement of page.pageElements) {

					let pageElementDimensionsPx = calculateDimensions(pageElement.dimensions, "px");
					let pageElementDimensionsTwip = calculateDimensions(pageElement.dimensions, "twip");
					let pageElementDimensionsEmu = calculateDimensions(pageElement.dimensions, "emu");

					switch(pageElement.type) {
						case "indicatorTitle-landscape": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: pageElement.text,
										bold: true,
										font: font,
										size: 32 // 16pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "communeLogo-landscape": {
							// only add logo if one was selected
							if(pageElement.src && pageElement.src.length) {
								let paragraph = new docx.Paragraph({
									children: [
										new docx.ImageRun({
											data: dataURItoBlob(pageElement.src),
											transformation: {
												width: pageElementDimensionsPx.width,
												height: pageElementDimensionsPx.height
											},
											floating: {
												horizontalPosition: {
													offset: pageElementDimensionsEmu.left,
												},
												verticalPosition: {
													offset: pageElementDimensionsEmu.top,
												}
											},
										})
									]
								});
								paragraphs.push(paragraph);
							}
							break;
						}
						case "dataTimestamp-landscape":
						case "dataTimeseries-landscape":
						case "reachability-subtitle-landscape": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: pageElement.text,
										font: font,
										size: 32  // 16pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						
						case "footerHorizontalSpacer-landscape":
							 // empty paragraph with border top
							let paragraph = new docx.Paragraph({
								children: [],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								},
								border: {
									top: {
										color: "#949494", // gray
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									}
								}
							});
							paragraphs.push(paragraph);
							break;
						case "footerCreationInfo-landscape": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: pageElement.text,
										font: font,
										size: 32  // 16pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "pageNumber-landscape": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: "Seite " + (idx+1),
										font: font,
										size: 32  // 16pt
									},
									new docx.PageBreak())
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							paragraphs.push(paragraph);
							break;
						}
						case "map":
						case "barchart":
						case "linechart": {
							let pElementDom;
							if(pageElement.type === "linechart") {
								let arr = pageDom.querySelectorAll(".type-linechart");
								if(pageElement.showPercentageChangeToPrevTimestamp) {
									pElementDom = arr[1];
								} else {
									pElementDom = arr[0];
								}
							} else {
								pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)
							}
							let instance = echarts.getInstanceByDom(pElementDom);
							let imageDataUrl = instance.getDataURL({
							 		type: "png",
							 		pixelRatio: $scope.echartsImgPixelRatio
							});

							if($scope.config.template.name === "A4-landscape-reachability") {
								imageDataUrl = await $scope.createReachabilityMapImage(pageElement, imageDataUrl, mapLegendCanvas, mapLegendDataUrl, mapAttributionCanvas, mapAttributionDataUrl)
							}
							let blob = dataURItoBlob(imageDataUrl);

							let paragraph = new docx.Paragraph({
								children: [
									new docx.ImageRun({
										data: blob,
										transformation: {
											width: pageElementDimensionsPx.width,
											height: pageElementDimensionsPx.height
										},
										floating: {
											horizontalPosition: {
												offset: pageElementDimensionsEmu.left,
											},
											verticalPosition: {
												offset: pageElementDimensionsEmu.top,
											},
											behindDocument: true
										},
									})
								]
							});
							paragraphs.push(paragraph);
							break;
						}
						case "overallAverage":
						case "selectionAverage": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: "Durchschnitt",
										font: font,
										size: 28  // 14pt
									}),
									new docx.TextRun({
										text: pageElement.type === "overallAverage" ? "Gesamtstadt" : "Selektion",
										size: 28,
										font: font,
										break: 1,  // 14pt
									}),
									new docx.TextRun({
										text: pageElement.text.toString(),
										size: 28,
										font: font,
										break: 1  // 14pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								},
								border: {
									top: {
										color: "#949494", // gray
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									right: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									bottom: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									left: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "overallChange":
						case "selectionChange": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: "Durchschnittliche",
										font: font,
										size: 28  // 14pt
									}),
									new docx.TextRun({
										text: "Veränderung",
										font: font,
										break: 1,
										size: 28  // 14pt
									}),
									new docx.TextRun({
										text: pageElement.type === "overallChange" ? "Gesamtstadt" : "Selektion",
										break: 1,
										font: font,
										size: 28  // 14pt
									}),
									new docx.TextRun({
										text: pageElement.text.toString(),
										break: 1,
										font: font,
										size: 28  // 14pt
									
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								},
								border: {
									top: {
										color: "#949494", // gray
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									right: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									bottom: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
									left: {
										color: "#949494",
										space: 1,
										style: docx.BorderStyle.SINGLE,
										size: 6 
									},
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "textInput": {
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: pageElement.text,
										font: font,
										size: 24 // 12pt
									})
								],
								frame: {
									position: {
										x: pageElementDimensionsTwip.left,
										y: pageElementDimensionsTwip.top,
									},
									width: pageElementDimensionsTwip.width,
									height: pageElementDimensionsTwip.height,
									anchor: {
										horizontal: docx.FrameAnchorType.MARGIN,
										vertical: docx.FrameAnchorType.MARGIN,
									},
									alignment: {
										x: docx.HorizontalPositionAlign.LEFT,
										y: docx.VerticalPositionAlign.TOP,
									}
								}
							});
							
							paragraphs.push(paragraph);
							break;
						}
						case "datatable": {
								let tableDom = document.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type + " table");
								let headerFieldsDom = tableDom.querySelectorAll("thead th")
								let tableRowsDom = tableDom.querySelectorAll("tbody tr");
								
								// table to create
								let table = {
									columnWidths: [],
									rows: [],
									float: {
										absoluteHorizontalPosition: pageElementDimensionsTwip.left,
										absoluteVerticalPosition: pageElementDimensionsTwip.top,
										overlap: docx.OverlapType.NEVER,
									},
								};
								let headerFields = [];
								let headerFieldNames = [];
								for(let fieldDom of headerFieldsDom) {
									let widthInTwip = pxToTwip(fieldDom.offsetWidth);
									let fieldContent = fieldDom.innerText;
									headerFieldNames.push(fieldContent)
									let field = new docx.TableCell({
										width: {
											size: widthInTwip,
											type: docx.WidthType.DXA,
										},
										verticalAlign: docx.VerticalAlign.CENTER,
										children: [new docx.Paragraph({
											alignment: docx.AlignmentType.CENTER,
											children: [new docx.TextRun({
												text: fieldContent,
												font: font,
												bold: true
											})]
										})],
									})
									headerFields.push(field);
									table.columnWidths.push(widthInTwip)
								}

								let headerRow = new docx.TableRow({
									children: headerFields,
								});

								table.rows.push(headerRow);
								
								for(let rowDom of tableRowsDom) { // excluding header
									let fieldsDom = rowDom.querySelectorAll("td");
									let fields = [];
									for(let [idx, fieldDom] of fieldsDom.entries()) {
										let fieldContent = fieldDom.innerText;
										let paragraph = new docx.Paragraph({
											text: fieldContent,
											alignment:
												headerFieldNames[idx] === "Wert" ?
												docx.AlignmentType.RIGHT :
												headerFieldNames[idx] === "Zeitpunkt" ?
												docx.AlignmentType.CENTER :
												docx.AlignmentType.LEFT, // "Bereich"
										});
										let field = new docx.TableCell({
											width: {
												size: table.columnWidths[idx],
												type: docx.WidthType.DXA,
											},
											verticalAlign: docx.VerticalAlign.CENTER,
											children: [paragraph],
										})
										fields.push(field)
									}
									let row = new docx.TableRow({
										children: fields,
									});
									table.rows.push(row);
								}

								paragraphs.push(new docx.Table(table)) // technically this is not a paragraph, but we only add it as a child of section below
								break;
						}
					}
				}

				let section = {
					properties: {
						type: docx.SectionType.NEXT_PAGE,
						page: {
							margin: {
								top: 0,
								right: 0,
								bottom: 0,
								left: 0,
							},
							pageNumbers: {
								start: (idx+1),
								formatType: docx.NumberFormat.DECIMAL,
							},
							size: {
								orientation: docx.PageOrientation.LANDSCAPE,
							},
						},
					},
					children: [...paragraphs],
				}

				sections.push(section)
			}

			let docxConfig = {
				sections: [...sections]
			}

			let doc = new docx.Document(docxConfig);
		
			let filename = getCurrentDateAndTime() + "_KomMonitor-Report"
			// Used to export the file into a .docx file
			docx.Packer.toBlob(doc).then((blob) => {
				saveAs(blob, filename + ".docx");
			});
			$scope.loadingData = false;
		}

		$scope.createReachabilityMapImage = async function(pageElement, echartsImgSrc, mapLegendCanvas, mapLegendDataUrl, mapAttributionCanvas, mapAttributionDataUrl) {
			let result;
			// screenshot leaflet map and merge it with echarts image
			// get easyprint control from map
			// remove page offset temporarily 
			pageElement.leafletMap.getContainer().style.top = "0px"
			pageElement.leafletMap.getContainer().style.left = "0px"
			pageElement.leafletMap.easyPrintControl.printMap('Current', '') // output is set to 'event', map has a listener for 'easyPrint-finished'
			
			// wait for print process to finish
			function waitForEasyPrintResult() {
				return new Promise((resolve, reject) => {
					console.log("waiting for easyprint results....");
					const intervalId = setInterval(() => {
						if(typeof($scope.leafletEasyPrintResult) !== "undefined") {
							clearInterval(intervalId);
							resolve()
						}
					}, 50);
				})
			}

			await waitForEasyPrintResult();
			pageElement.leafletMap.getContainer().style.top = "90px"
			pageElement.leafletMap.getContainer().style.left = "15px"
			
			// combine images
			let canvas = document.createElement('canvas');
			let ctx = canvas.getContext('2d');
			let pageElementDimensionsPx = calculateDimensions(pageElement.dimensions, "px");
			canvas.width = pageElementDimensionsPx.width;
			canvas.height =  pageElementDimensionsPx.height;
			// we have to draw layers in order
			let leafletMapImg = new Image();
			leafletMapImg.width = canvas.width;
			leafletMapImg.height = canvas.height;
			let leafletMapImgDrawn = new Promise( (resolve, reject) => {
				leafletMapImg.onload = function() {
					ctx.drawImage(leafletMapImg, 0, 0, canvas.width, canvas.height);
					resolve();
				}
			})
			leafletMapImg.src = $scope.leafletEasyPrintResult;
			await leafletMapImgDrawn

			let echartsImg = new Image();
			let echartsImgDrawn = new Promise( (resolve, reject) => {
				echartsImg.onload = function() {
					ctx.drawImage(echartsImg, 0, 0, canvas.width, canvas.height);
					resolve();
				}
			});
			echartsImg.src = echartsImgSrc;
			await echartsImgDrawn

			let mapAttributionImg = new Image();
			let mapAttributionImgDrawn = new Promise( (resolve, reject) => {
				mapAttributionImg.onload = function() {
					ctx.drawImage(mapAttributionImg, 0, canvas.height - mapAttributionCanvas.height);
					resolve();
				}
			});
			mapAttributionImg.src = mapAttributionDataUrl;
			let mapLegendImg = new Image();
			let mapLegendImgDrawn = new Promise( (resolve, reject) => {
				mapLegendImg.onload = function() {
					ctx.drawImage(mapLegendImg, canvas.width - mapLegendCanvas.width, canvas.height - mapLegendCanvas.height);
					resolve();
				}
			});
			mapLegendImg.src = mapLegendDataUrl;

			await Promise.all([mapAttributionImgDrawn, mapLegendImgDrawn]).then( () => {
				result = canvas.toDataURL() // canvas contains all four "layers" here
			});
			return result;
		}

		function pxToMilli(px) {
			// our preview is 830px wide
			// px / 830  gives us the percentage from the left edge, which can then be stretched to fit the A4 page
			// This is the short version of:
			// px / pxPerMillimeter * pxPerMillimeter * 297 / 830, where pxPerMillimeter = (deviceScreenPpi / 2.54) * 10
			// pxPerMillimeter cancels out there, so it doesn't matter.
			let result = parseInt(px, 10) / 830 * 297;
			result = Math.round(result * 100) / 100;
			return result;
		}

		function pxToTwip(px) {
			let result = parseInt(px, 10) * 15; // 1px = 0.75pt = 15twip
			return result * $scope.pxPerMilli*297 / 830 // scale from 830px to A4 page
		}

		function twipToEmus(value) {
			// see: https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/
			return value * 635;
		}

		// from: https://stackoverflow.com/a/46406124
		function dataURItoBlob(dataURI) {
			// convert base64 to raw binary data held in a string
			// doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
			var byteString = atob(dataURI.split(',')[1]);
		
			// separate out the mime component
			var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
		
			// write the bytes of the string to an ArrayBuffer
			var ab = new ArrayBuffer(byteString.length);
		
			// create a view into the buffer
			var ia = new Uint8Array(ab);
		
			// set the bytes of the buffer to the correct values
			for (var i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}
		
			// write the ArrayBuffer to a blob, and you're done
			var blob = new Blob([ab], {type: mimeString});
			return blob;
		}

		function calculateDimensions(dimensions, unit) {
			let result = {};
			if(unit === "px") {
				// also scale our 830px preview up to A4 here
				let scalefactor = $scope.pxPerMilli*297 / 830
				result.top = dimensions.top && parseInt(dimensions.top, 10) * scalefactor;
				result.bottom = dimensions.bottom && parseInt(dimensions.bottom, 10) * scalefactor;
				result.left = dimensions.left && parseInt(dimensions.left, 10) * scalefactor;
				result.right = dimensions.right && parseInt(dimensions.right, 10) * scalefactor;
				result.width = dimensions.width && parseInt(dimensions.width, 10) * scalefactor;
				result.height = dimensions.height && parseInt(dimensions.height, 10) * scalefactor;
			}
			if(unit === "milli") {
				result.top = dimensions.top && pxToMilli(dimensions.top);
				result.bottom = dimensions.bottom && pxToMilli(dimensions.bottom);
				result.left = dimensions.left && pxToMilli(dimensions.left);
				result.right = dimensions.right && pxToMilli(dimensions.right);
				result.width = dimensions.width && pxToMilli(dimensions.width, 10);;
				result.height = dimensions.height && pxToMilli(dimensions.height, 10);
			}
			if(unit === "twip") {
				result.top = dimensions.top && docx.convertMillimetersToTwip(pxToMilli(dimensions.top));
				result.bottom = dimensions.bottom && docx.convertMillimetersToTwip(pxToMilli(dimensions.bottom));
				result.left = dimensions.left && docx.convertMillimetersToTwip(pxToMilli(dimensions.left));
				result.right = dimensions.right && docx.convertMillimetersToTwip(pxToMilli(dimensions.right));
				result.width = dimensions.width && docx.convertMillimetersToTwip(pxToMilli(dimensions.width, 10));
				result.height = dimensions.height && docx.convertMillimetersToTwip(pxToMilli(dimensions.height, 10));
			}
			if(unit === "emu") {
				result.top = dimensions.top && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.top)));
				result.bottom = dimensions.bottom && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.bottom)));
				result.left = dimensions.left && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.left)));
				result.right = dimensions.right && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.right)));
				result.width = dimensions.width && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.width, 10)));
				result.height = dimensions.height && twipToEmus(docx.convertMillimetersToTwip(pxToMilli(dimensions.height, 10)));
			}
			return result;
		}


		function calculateScreenDpi() {
			// create a hidden div that is one inch high
			let div = document.createElement("div")
			div.style.height = "1in";
			div.style.position = "absolute";
			div.style.left = "-100%";
			div.style.top = "-100%";
			document.getElementsByTagName("body")[0].append(div);
			const dpi = div.offsetHeight
			div.style.display = "none";
			return dpi
		}
	}
]});