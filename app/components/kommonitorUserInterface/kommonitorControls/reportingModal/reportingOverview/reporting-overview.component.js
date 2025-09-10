angular.module('reportingOverview').component('reportingOverview', {
	templateUrl : "components/kommonitorUserInterface/kommonitorControls/reportingModal/reportingOverview/reporting-overview.template.html",
	controller : ['$scope', '__env', '$timeout', '$http', 'kommonitorDataExchangeService', 'kommonitorDiagramHelperService', 
		'kommonitorLeafletScreenshotCacheHelperService', '$rootScope',
	function ReportingOverviewController($scope, __env, $timeout, $http, kommonitorDataExchangeService, kommonitorDiagramHelperService,
		kommonitorLeafletScreenshotCacheHelperService, $rootScope
	) {

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
			template: {},			
		};

		this.kommonitorLeafletScreenshotCacheHelperServiceInstance = kommonitorLeafletScreenshotCacheHelperService;

		const mercatorProjection_d3 = d3.geoMercator();

		$scope.loadingData = false;
		$scope.lastPageOfAddedSectionPrepared = false;
		$scope.echartsImgPixelRatio = 2;

    $scope.customFontFamily = undefined;
    $scope.customFontFile = undefined

    $scope.setCustomFont = function() {
        
      var defaultFont = '"Source Sans Pro", "Helvetica Neue", Helvetica, Arial, sans-serif';

      var elem = document.querySelector('#fontFamily-reference');
      var style = getComputedStyle(elem);
      var fontFamily = style.fontFamily.split(',')[0];

      if(fontFamily!=defaultFont) 
        $scope.customFontFamily = fontFamily;

      if(style.content!='normal') {

        let fontFile = style.content.replace(/['"]+/g,'');

        // check for local ttf
        $http.get(`fonts/${fontFile}`).then(() => {
            console.log("Custom font file found internal");
            $scope.customFontFile = `fonts/${fontFile}`;
        });
      }
    }

	function removeCircularReferences(pages){			
		for (const page of pages) {
			for (const pageElement of page.pageElements) {
				if(pageElement.type === "map"){
					delete pageElement.leafletMap;
				}
			}
		}

		return pages;
	}

		$scope.initialize = function(data) {
			$scope.config.templateSections = [];

			let configFileSelected = data[0];
			data = data[1];
			if(configFileSelected) {
				$scope.importConfig(data);
			} else {
				$scope.config.template = JSON.parse(JSON.stringify(data));
				$scope.config.pages = $scope.config.template.pages;
			}
			
			let deviceScreenDpi = calculateScreenDpi();
      		$scope.deviceScreenDpi = deviceScreenDpi;
			$scope.pxPerMilli = deviceScreenDpi / 25.4 // /2.54 --> cm, /10 --> mm

			$scope.setCustomFont(); 
		}

		$scope.sortableConfig = {
			onEnd: function (e) {
				// nothing for now, config elements get reordered automatically
			}
		};

		$scope.checkVisibility = function(pageElement, page){
			if(! page || !page.templateSection || !page.templateSection.pageConfig){
				return true;
			}

			switch(pageElement.type) {
				case "indicatorTitle-landscape":
				case "indicatorTitle-portrait": {
					return page.templateSection.pageConfig.showTitle;
				}
	
				case "communeLogo-landscape":
				case "communeLogo-portrait": {
					return page.templateSection.pageConfig.showLogo;
				}
				case "dataTimestamp-landscape":
				case "dataTimestamp-portrait": {
					return page.templateSection.pageConfig.showSubtitle;
				}
				case "dataTimeseries-landscape":
				case "dataTimeseries-portrait": {
					return page.templateSection.pageConfig.showSubtitle;
				}
				case "reachability-subtitle-landscape":
				case "reachability-subtitle-portrait": {
					return page.templateSection.pageConfig.showSubtitle;
				}
				case "footerHorizontalSpacer-landscape":
				case "footerHorizontalSpacer-portrait": {
					return page.templateSection.pageConfig.showFooterCreationInfo;
				}
				case "footerCreationInfo-landscape":
				case "footerCreationInfo-portrait": {  
					return page.templateSection.pageConfig.showFooterCreationInfo;
				} 
				case "pageNumber-landscape":
				case "pageNumber-portrait": {
					return page.templateSection.pageConfig.showPageNumber;
				}
				// template-specific elements
				case "map": {
					return true;
				}
				 // case "mapLegend" can be ignored since it is included in the map if needed
				  /*
					June 2025: we remove overallAverage and overallChange, overallAverage and selectionAverage from reporting overview pages.
				 */
				// case "overallAverage":
				// case "selectionAverage": {
				// 	return true;
				// }
				// case "overallChange":
				// case "selectionChange": {
				// 	return true;
				// }
				case "barchart": {
					if(page.type == 'area_specific'){
						return page.templateSection.pageConfig.showRankingChartPerArea;
					}
					return true;					
				}
				case "linechart": {
					if(page.type == 'area_specific'){
						return page.templateSection.pageConfig.showLineChartPerArea;
					}
					return true;
				}
				case "textInput": {
					return page.templateSection.pageConfig.showFreeText;
				}
				case "datatable": {
					return page.templateSection.pageConfig.sections.showDatatable;
				}
				default:{
					return true;
				}
			}
		}

		$scope.$on("reportingInitializeOverview", function(event, data) {
			// data is a nested array at this point [ [ { template object } ] ]
			$scope.initialize(data);
		})

		$scope.onPageTurnClicked = async function(orientation, index) {
			let old_page = $scope.config.pages[index];
			let new_page = $scope.config.pages[index + 1];
			$scope.config.pages[index] = new_page;
			$scope.config.pages[index + 1] = old_page;

			setTimeout(function(){
				$scope.$digest();
			});

			setTimeout(async function(){
				// reinit map component

				// we must generate the new leaflet screenshot!
				let mapElements = new_page.pageElements.filter(item => item.type == 'map');
				for (const mapElement of mapElements) {
					if(mapElement && mapElement.leafletMap){

						kommonitorLeafletScreenshotCacheHelperService.resetCounter(1, false);
						setTimeout(function(){
							$scope.$digest();
						});

						let pageDom = document.querySelector("#reporting-overview-page-" + index);
						let pElementDom = pageDom.querySelector("#reporting-overview-page-" + index + "-map");
						let instance = echarts.getInstanceByDom(pElementDom);
						await $scope.initializeLeafletMap(new_page, mapElement, instance, $scope.currentSpatialUnit, true)

					}		
				}
					
			}, 250)
	
		}

		$scope.onConfigureNewIndicatorClicked = function() {
			$scope.$emit('reportingConfigureNewIndicatorClicked', [$scope.config.template]);
		}

		$scope.onConfigureNewPoiLayerClicked = function() {
			$scope.$emit('reportingConfigureNewPoiLayerClicked', [$scope.config.template]);
		}
		
		$scope.onBackToTemplateSelectionClicked = function() {
			$scope.$emit('reportingBackToTemplateSelectionClicked')
		}

		$scope.$on("reportingIndicatorConfigurationCompleted", function(event, data) {
			$scope.loadingData = true;
			let [indicator, template] = data;

			// apply submitted pageConfig to all sections of the selected template
			
			let templateSection = {
				indicatorName: indicator ? indicator.indicatorName : "",
				indicatorId: indicator ? indicator.indicatorId : "",
				poiLayerName: "",
				spatialUnitName: template.spatialUnitName,
				absoluteLabelPositions: template.absoluteLabelPositions,
				echartsRegisteredMapNames: template.echartsRegisteredMapNames,
				echartsMaps: [],
				pageConfig: jQuery.extend(true, {}, template.pageConfig) // deep copy to preserve section specific settings
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

			// apply submitted pageConfig to all sections of the selected template

			let templateSection = {
				indicatorName: indicator ? indicator.indicatorName : "",
				indicatorId: indicator ? indicator.indicatorId : "",
				poiLayerName: poiLayer.datasetName,
				spatialUnitName: template.spatialUnitName,
				absoluteLabelPositions: template.absoluteLabelPositions,
				echartsRegisteredMapNames: template.echartsRegisteredMapNames,
				echartsMaps: [],
				isochronesRangeType: template.isochronesRangeType,
				isochronesRangeUnits: template.isochronesRangeUnits,
				pageConfig: jQuery.extend(true, {}, template.pageConfig) // deep copy to preserve section specific settings
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
			let targetTemplateSection = $scope.config.templateSections[idx]; 
			let isIndicatorTemplateSection = targetTemplateSection.indicatorId ? true : false;
			let indicatorIdOrPoiName = isIndicatorTemplateSection ? targetTemplateSection.indicatorId : targetTemplateSection.poiLayerName
			$scope.config.templateSections.splice(idx, 1)

			// show empty template if this was the last indicator
			if($scope.config.templateSections.length === 0) {
				$scope.config.pages = $scope.config.template.pages;
			}
			else{
				// also remove corresponding pages from $scope.config.pages
				$scope.config.pages = $scope.config.pages.filter(item => {
					let keepItem = true;

					if (isIndicatorTemplateSection){
						// indicator case
						keepItem = item.templateSection.indicatorId != indicatorIdOrPoiName
					}
					else{
						// poi case
						keepItem = item.templateSection.poiLayer != indicatorIdOrPoiName
					}

					return keepItem;
				} )
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

		$scope.setupNewPages = async function(templateSection) {

				if(!templateSection.poiLayerName) {

					// for indicator without poi layer
					let indicatorId = templateSection.indicatorId;
					let spatialUnit, featureCollection, features, geoJSON;
					
					spatialUnit = await $scope.getSpatialUnitByIndicator(indicatorId, templateSection.spatialUnitName)
					$scope.currentSpatialUnit = spatialUnit;
					featureCollection = await $scope.queryFeatures(indicatorId, spatialUnit);
					features = $scope.createLowerCaseNameProperty(featureCollection.features);

					$scope.geoJsonForReachability_byFeatureName = new Map();

					for (let feature of features) {
						$scope.geoJsonForReachability_byFeatureName.set(feature.properties.NAME, feature)
					}

					$scope.geoJsonForReachability_byFeatureName.set("undefined", features);

					geoJSON = { features: features };

					$scope.lastPageOfAddedSectionPrepared = false;
					$scope.pagePreparationIndex = 0;
					// $scope.pagePreparationSize = $scope.config.pages.length; 
					$scope.pagePreparationSize = document.querySelectorAll("[id^='reporting-overview-page-'].reporting-page").length;

					let logProgressIndexSeparator = Math.round($scope.pagePreparationSize / 100 * 10);

					setTimeout(function () {
						$scope.$digest();
					});

					for(let [idx, page] of $scope.config.pages.entries()) {

						if(page.templateSection.indicatorId !== indicatorId) {
								continue; // only do changes to new pages
						}

						setTimeout(async function(){
							// Indicator and spatial unit are the same for all added pages								

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
										
										for(let series of pageElement.echartsOptions.series) {

											series.left = 0;
											series.top = 0;
											series.right = 0;
											series.bottom = 0;
											// series.boundingCoords = boundingCoords,
											series.projection = {
												project: (point) => mercatorProjection_d3(point),
												unproject: (point) => mercatorProjection_d3.invert(point)
											}
										}
						
										if(pageElement.echartsOptions.geo){
											pageElement.echartsOptions.geo[0].top = 0;
											pageElement.echartsOptions.geo[0].left = 0;
											pageElement.echartsOptions.geo[0].right = 0;
											pageElement.echartsOptions.geo[0].bottom = 0;
											pageElement.echartsOptions.geo[0].projection = {
												project: (point) => mercatorProjection_d3(point),
												unproject: (point) => mercatorProjection_d3.invert(point)
											}				
											// pageElement.echartsOptions.geo[0].boundingCoords = boundingCoords
										}
										
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

									if(pageElement.type === "map") {
										await $scope.initializeLeafletMap(page, pageElement, instance, spatialUnit, false)
									}
								}

								// if(pageElement.type === "overallAverage") {
								// 	pageDom.querySelector(".type-overallAverage").style.border = "none";
								// }
		
								// if(pageElement.type === "selectionAverage") {
								// 	pageDom.querySelector(".type-selectionAverage").style.border = "none";
								// }

								if(pageElement.type === "mapLegend") {
									pageElement.isPlaceholder = false;
									pageDom.querySelector(".type-mapLegend").style.display = "none";
								}

								// if(pageElement.type === "overallChange") {
								// 	let wrapper = pageDom.querySelector(".type-overallChange")
								// 	wrapper.style.border = "none";
								// }

								// if(pageElement.type === "selectionChange") {
								// 	let wrapper = pageDom.querySelector(".type-selectionChange")
								// 	wrapper.style.border = "none";
								// }

								if(pageElement.type === "datatable") {
									$scope.createDatatablePage(pElementDom, pageElement);
								}
							}

							// if the last page is reached and full prepared we want to show that to the user
							// wait additionally for 500 ms
							$scope.pagePreparationIndex = idx;

							// every 10 percent log progress to user
							if($scope.pagePreparationIndex % logProgressIndexSeparator === 0){
								$scope.$digest();	
							}	

							if(idx == $scope.pagePreparationSize - 1){
								$scope.lastPageOfAddedSectionPrepared = true;
								setTimeout(function(){
									$scope.$digest();
								}, 1000);
							}
							
						});

						
					}
					$scope.loadingData = false;
					setTimeout(function(){
						$scope.$digest();
					});
				} else {					
					$scope.handleSetupNewPagesForReachability(templateSection)
				}
		}

		

		$scope.handleSetupNewPagesForReachability = async function(templateSection) {
			let poiLayerName = templateSection.poiLayerName;
			let spatialUnit, featureCollection, features, geoJSON, indicatorId;
			// if indicator was chosen
			if( templateSection.indicatorId) {
				indicatorId = templateSection.indicatorId;
			}
			
			if (indicatorId) {
				spatialUnit = await $scope.getSpatialUnitByIndicator(indicatorId, templateSection.spatialUnitName);
				featureCollection = await $scope.queryFeatures(indicatorId, spatialUnit);
			} else {
				spatialUnit = await $scope.getSpatialUnitByName(templateSection.spatialUnitName);
				featureCollection = await $scope.queryFeatures(undefined, spatialUnit);
			}

			features = $scope.createLowerCaseNameProperty(featureCollection.features);
			geoJSON = { features: features };

			$scope.geoJsonForReachability_byFeatureName = new Map();

			for (let feature of features) {
				$scope.geoJsonForReachability_byFeatureName.set(feature.properties.NAME, feature)
			}

			$scope.geoJsonForReachability_byFeatureName.set("undefined", features);		

			$scope.lastPageOfAddedSectionPrepared = false;
			$scope.pagePreparationIndex = 0;
			// $scope.pagePreparationSize = $scope.config.pages.length; 
			$scope.pagePreparationSize = document.querySelectorAll("[id^='reporting-overview-page-'].reporting-page").length;

			for(let [idx, page] of $scope.config.pages.entries()) {

				if(page.templateSection.poiLayerName !== poiLayerName) {
					continue; // only do changes to new pages
				}

				setTimeout(async function(){
					let pageDom = document.querySelector("#reporting-overview-page-" + idx);
					for(let pageElement of page.pageElements) {
						let pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)

						if(pageElement.type === "map") {
							let instance = echarts.init( pElementDom );

							for(let series of pageElement.echartsOptions.series) {

								series.left = 0;
								series.top = 0;
								series.right = 0;
								series.bottom = 0;
								// series.boundingCoords = newBounds,
								series.projection = {
									project: (point) => mercatorProjection_d3(point),
									unproject: (point) => mercatorProjection_d3.invert(point)
								}
							}
			
							if(pageElement.echartsOptions.geo){
								pageElement.echartsOptions.geo[0].top = 0;
								pageElement.echartsOptions.geo[0].left = 0;
								pageElement.echartsOptions.geo[0].right = 0;
								pageElement.echartsOptions.geo[0].bottom = 0;
								pageElement.echartsOptions.geo[0].projection = {
									project: (point) => mercatorProjection_d3(point),
									unproject: (point) => mercatorProjection_d3.invert(point)
								}				
								// pageElement.echartsOptions.geo[0].boundingCoords = newBounds
							}

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

							await $scope.initializeLeafletMap(page, pageElement, instance, spatialUnit, false)
						}
					}

					// if the last page is reached and full prepared we want to show that to the user
					// wait additionally for 500 ms
					$scope.pagePreparationIndex = idx;
					setTimeout(function(){
						$scope.$digest();
					});

					if (idx == $scope.pagePreparationSize - 1) {
						$scope.lastPageOfAddedSectionPrepared = true;
						setTimeout(function () {
							$scope.$digest();
						}, 1000);
					}
				})

			}
			$scope.loadingData = false;
			setTimeout(function(){
				$scope.$digest();
			});
		}

		$rootScope.$on("screenshotsForCurrentSpatialUnitUpdate", function(event){
			// update ui to enable button
			setTimeout(function() {
				$scope.$digest();
			})			
		});

		$scope.initializeLeafletMap = async function(page, pageElement, echartsMap, spatialUnit, forceScreenshot) {
				try {
					let pageIdx = $scope.config.pages.indexOf(page);
					let id = "reporting-overview-leaflet-map-container-" + pageIdx;
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
						zoomSnap: 0,
						// disable any fade and zoom animation in order to get screenshots directly after layer event load was called
						fadeAnimation: false,
						zoomAnimation: false,
					});			

					// manually create a field for attribution so we can control the z-index.
					let prevAttributionDiv = pageDom.querySelector(".map-attribution")
					if(prevAttributionDiv) prevAttributionDiv.remove();
					let attrDiv = document.createElement("div")
					attrDiv.classList.add("map-attribution")
					attrDiv.style.position = "absolute";
					attrDiv.style.bottom = 0;
					attrDiv.style.left = 0;
					attrDiv.style.zIndex = 800;
					let attrImg = await kommonitorDiagramHelperService.createReportingReachabilityMapAttribution();
					attrDiv.appendChild(attrImg);
					pageElementDom.appendChild(attrDiv);

					if($scope.config.template.name.includes("reachability")){
						// also create the legend manually
						let prevLegendDiv = pageDom.querySelector(".map-legend")
						if(prevLegendDiv) prevLegendDiv.remove();
						let legendDiv = document.createElement("div")
						legendDiv.classList.add("map-legend")
						legendDiv.style.position = "absolute";
						legendDiv.style.bottom = 0;
						legendDiv.style.right = 0;
						legendDiv.style.zIndex = 800;
						let isochronesRangeType = page.templateSection.isochronesRangeType;
						let isochronesRangeUnits = page.templateSection.isochronesRangeUnits;
						let legendImg = await kommonitorDiagramHelperService.createReportingReachabilityMapLegend(echartsOptions, spatialUnit, isochronesRangeType, isochronesRangeUnits);
						legendDiv.appendChild(legendImg);
						pageElementDom.appendChild(legendDiv)
					}

					

					// we have the bbox stored in config
					// pageElement.leafletBbox is invalid after export and import. Maybe because the prototype object gets removed...
					// We create a new bounds object from the stored data
					// let bounds = L.latLngBounds(pageElement.leafletBbox._southWest, pageElement.leafletBbox._northEast);

						// let bounds = L.latLngBounds(pageElement.leafletBbox._southWest, pageElement.leafletBbox._northEast);
						// let boundingCoords = [ [bounds.getWest(), bounds.getNorth()], [bounds.getEast(), bounds.getSouth()]]
						let boundingCoords = echartsOptions.series[0].boundingCoords;

						// set bounding box to this feature
						let westLon = boundingCoords[0][0];
						let southLat = boundingCoords[1][1];
						let eastLon = boundingCoords[1][0];
						let northLat = boundingCoords[0][1];

					// Add 2% space on all sides
					// let divisor = 50;
					// let bboxHeight = northLat - southLat;
					// let bboxWidth = eastLon - westLon;
					// northLat += bboxHeight/divisor;
					// southLat -= bboxHeight/divisor;
					// eastLon += bboxWidth/divisor;
					// westLon -= bboxWidth/divisor;

					leafletMap.fitBounds( [[southLat, westLon], [northLat, eastLon]] );
					// leafletMap.fitBounds( bounds );

					let bounds = leafletMap.getBounds()
					
					/*
					as we might have landscape and portrait versions of the same content
					leaflet fitBounds() will not work properly, if the leaflet map is actually not included in the DOM currently
					
					--> hence we make a workaround. if the leaflet coords of northeast and southwest are exactly the same
					then we just ignore it and instead reuse the original echarts coordinates --> they are proper at the beginning of the function  

					*/

					if(bounds.getWest() == bounds.getEast() && bounds.getNorth() == bounds.getSouth()){
						// this is only the case, if leaflet.fitBounds() results in a single coordinate (due to map HTML element not within DOM)	
						// hence, simply use current echarts extent				
					}
					else{
						// normal case, leaflet has properly rendered and zoomed to the given extent
						// thus we use the leaflet coords in order to adjust the echarts extent for proper overlay
						boundingCoords = [ [bounds.getWest(), bounds.getNorth()], [bounds.getEast(), bounds.getSouth()]]
					}

					for(let series of echartsOptions.series) {

						series.left = 0;
						series.top = 0;
						series.right = 0;
						series.bottom = 0;
						series.boundingCoords = boundingCoords,
						series.projection = {
							project: (point) => mercatorProjection_d3(point),
							unproject: (point) => mercatorProjection_d3.invert(point)
						}
					}

					echartsOptions.geo[0].top = 0;
					echartsOptions.geo[0].left = 0;
					echartsOptions.geo[0].right = 0;
					echartsOptions.geo[0].bottom = 0;
					echartsOptions.geo[0].projection = {
						project: (point) => mercatorProjection_d3(point),
						unproject: (point) => mercatorProjection_d3.invert(point)
					}				
					echartsOptions.geo[0].boundingCoords = boundingCoords
					
					echartsMap.setOption(echartsOptions, {
						notMerge: false
					});	
					

					// store spatial unit and feature id to page in order to access it later when the screenshot is needed
					page.spatialUnitId = spatialUnit.spatialUnitId;			
					if(page.area){
						let feature = $scope.geoJsonForReachability_byFeatureName.get(page.area);
						let spatialUnitFeatureId = feature.properties[__env.FEATURE_ID_PROPERTY_NAME];
						page.spatialUnitFeatureId = spatialUnitFeatureId;
					}						
					
					// Attribution is handled in a custom element
					// let leafletLayer = new L.TileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
					let leafletLayer; 
					if (pageElement.selectedBaseMap.layerConfig.layerType === "TILE_LAYER_GRAYSCALE"){
						leafletLayer = new L.tileLayer(pageElement.selectedBaseMap.layerConfig.url);
					}
					else if (pageElement.selectedBaseMap.layerConfig.layerType === "TILE_LAYER"){
						leafletLayer = new L.tileLayer(pageElement.selectedBaseMap.layerConfig.url);
					}
					else if (pageElement.selectedBaseMap.layerConfig.layerType === "WMS"){
						leafletLayer = new L.tileLayer.wms(pageElement.selectedBaseMap.layerConfig.url, { layers: pageElement.selectedBaseMap.layerConfig.layerName_WMS, format: 'image/jpeg' })
					}	
					else{
						// i.e. if on import no baseLayer was available
						// backup: set empty layer
						leafletLayer = new L.tileLayer("");
					}			
					// use the "load" event of the tile layer to hook a function that is triggered once every visible tile is fully loaded
					// here we ntend to make a screenshot of the leaflet image as a background task in order to boost up report preview generation 
					// for all spatial unit features		
					let domNode = leafletMap["_container"];	
					leafletLayer.on("load", function() { 
						// there are pages for two page orientations (landscape and portait)
						// only trigger the screenshot for those pages, that are actually present
						if(forceScreenshot || (page.orientation == $scope.config.template.orientation)){
							kommonitorLeafletScreenshotCacheHelperService.checkForScreenshot(pageElement.selectedBaseMap.layerConfig.name, spatialUnit.spatialUnitId, 
								page.spatialUnitFeatureId, page.orientation, domNode);
						}
										
					});					
					leafletLayer.addTo(leafletMap);		

					// add leaflet map to pageElement in case we need it again later
					pageElement.leafletMap = leafletMap;
					pageElement.leafletBbox = bounds;
					pageElement.echartsOptions = echartsOptions;
				
					// can be used to check if positioning in echarts matches the one from leaflet
					//let geoJsonLayer = L.geoJSON( $scope.geoJsonForReachability.features )
					//geoJsonLayer.addTo(leafletMap)
					//let isochronesLayer = L.geoJSON( $scope.isochrones.features )
					//isochronesLayer.addTo(leafletMap);
				} catch (error) {
					console.error(error)
				}				
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
				console.error(error);
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
				console.error(error);
			});
		}

		
		$scope.filterMapByArea = function(echartsInstance, echartsInstanceOptions, areaName, allFeatures) {
			let mapName = echartsInstanceOptions.series[0].map;
			// filter shown areas if we are in the area-specific part of the template
			let features = allFeatures.filter ( el => {
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

		$scope.getNumberOfMapElements = function(config){
			let firstSection = config.templateSections[0];

			if (firstSection){
				let numberOfMapItems = firstSection.echartsRegisteredMapNames.length;
				// -1 because city overview map might occur twice with separate names
				if (! config.template.name.includes("reachability")){
					numberOfMapItems --;
				}
				
				return numberOfMapItems;
			}
			else{
				return 0;
			}
		};

		$scope.importConfig = function(config) {
			$scope.loadingData = true;
			setTimeout(function(){
				$scope.$digest();
			});
			try {

				let numberOfMapElements = $scope.getNumberOfMapElements(config);		
				// reset leaflet screenshot helper service according to new  number of selected areas
				kommonitorLeafletScreenshotCacheHelperService.resetCounter(numberOfMapElements, false);						

				// restore commune logo for every page, starting at the second
				let communeLogoSrc = ""; // base64 string
				for(let [idx, page] of config.pages.entries()) {
					for(let pageElement of page.pageElements) {
						if(pageElement.type.includes("communeLogo-") && idx === 0) {
							if(pageElement.src && pageElement.src.length) {
								communeLogoSrc = pageElement.src;
							} else {
								break; // no logo was exported
							}
						}

						if(pageElement.type.includes("communeLogo-") && idx > 0) {
							pageElement.src = communeLogoSrc;
						}
					}
				}

				$scope.config.template = config.template;
				$scope.config.pages = config.pages;
				$scope.config.templateSections = config.templateSections;

				// register echarts maps
				for(let section of $scope.config.templateSections) {
					for(let mapName of section.echartsRegisteredMapNames) {
						if($scope.config.template.name.includes("reachability")) {
							if(!mapName.includes(section.spatialUnitName)) {
								continue;
							}
							if(!mapName.includes("_isochrones")) {
								let geoJson = section.echartsMaps.filter( map => map.name === section.poiLayerName)[0].geoJson
								echarts.registerMap(mapName, geoJson)
							} else {
								let geoJson = section.echartsMaps.filter( map => map.name === mapName)[0].geoJson
								echarts.registerMap(mapName, geoJson)
							}
						} else {
							if(!mapName.includes(section.spatialUnitName)) {
								continue;
							}
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
				
				setTimeout(function(){
					$scope.$digest();
				});

				for(let section of $scope.config.templateSections) {
					$scope.setupNewPages(section);
				}

			} catch (error) {
				console.error(error);
				$scope.loadingData = false;
				kommonitorDataExchangeService.displayMapApplicationError(error.message);
			}
		}

		$scope.showThisPage = function(page) {

			if (page.hidden){
				return false;
			}

			let pageWillBeShown = false;
			for(let visiblePage of $scope.filterPagesToShow()){
				if(visiblePage == page) {
					pageWillBeShown = true;
				}
			}
			return pageWillBeShown;
		}

		$scope.getPageNumber = function(index) {
			let pageNumber = 1;
			for(let i = 0; i < index; i ++) {
				if ($scope.showThisPage($scope.config.pages[i])) {
					pageNumber ++;
				}
			}
			return pageNumber;
		}

		$scope.filterPagesToShow = function() {
			let pagesToShow = [];
			let skipNextPage = false;
			for (let i = 0; i < $scope.config.pages.length; i ++) {
				let page = $scope.config.pages[i];
				if ($scope.pageContainsDatatable(i)) {
					pagesToShow.push(page);
					skipNextPage = false;
				}
				else {
					if(skipNextPage == false) {
						pagesToShow.push(page);
						skipNextPage = true;
					}
					else {
						skipNextPage = false;
					}
				}
			}
			return pagesToShow;
		}

		$scope.pageContainsDatatable = function(pageID) {
			let page = $scope.config.pages[pageID];
			let pageContainsDatatable = false;
			for(let pageElement of page.pageElements) {
				if(pageElement.type == "datatable") {
					pageContainsDatatable = true;
				}
			}
			return pageContainsDatatable;
		}


		$scope.exportConfig = function() {
			try {
				let jsonToExport = {};
				
				$scope.config.pages = removeCircularReferences($scope.config.pages);
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
						if(pageElement.type.includes("communeLogo-") && idx > 0) {
							pageElement.src = "";
						}
					}
				}
				
				for(let section of jsonToExport.templateSections) {
					let mapNames = [...new Set(section.echartsRegisteredMapNames)]
					if($scope.config.template.name.includes("reachability")) {
						let mapAdded = false;
						for(let [idx, name] of mapNames.entries()) {
							if(!name.includes(section.spatialUnitName)) {
								continue;
							}
							// store all isochrones
							if(name.includes("_isochrones")) {
								let map = echarts.getMap(name)
								section.echartsMaps.push({
									name: name,
									geoJson: map.geoJson
								})
							}
							// First map with the correct spatial unit
							// All other maps have the same geojson, so we only store them once
							if(!mapAdded && name.includes(section.poiLayerName)) {
								let map = echarts.getMap(mapNames[idx])
								section.echartsMaps.push({
									name: section.poiLayerName,
									geoJson: map.geoJson
								})
								mapAdded = true;
							}

						}
					} else {
						for(let [idx, name] of mapNames.entries()) {
							if(!name.includes(section.spatialUnitName)) {
								continue;
							} else {
								// First map with the correct spatial unit
								let map = echarts.getMap(mapNames[idx])
								section.echartsMaps.push({
									name: mapNames[idx],
									geoJson: map.geoJson
								});
							}
						}
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
				console.error(error);
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
				format === "pdf" && await $scope.generatePdfReport();
				format === "docx" && await $scope.generateWordReport();
				format === "zip" && await $scope.generateZipFolder();
				format === "pptx" && await $scope.generatePptxReport();
			} catch (error) {
				$scope.loadingData = false;
				console.error(error);
				kommonitorDataExchangeService.displayMapApplicationError(error.message);
			}
		}
		
    $scope.generatePptxReport = async function() {

      let doc = new PptxGenJS();

      doc.defineLayout({ name:'A4-landscape', width:29.7, height:21 });
      doc.defineLayout({ name:'A4-portrait', width:21, height:29.7 });

      doc.layout = 'A4-'+$scope.config.pages[0].orientation;

      var fontSize = 42;
      var fontFace = "Source Sans Pro";

      // Font setting
      doc.theme = { headFontFace: fontFace };
      doc.theme = { bodyFontFace: fontFace };

      // Master slide def
      doc.defineSlideMaster({
        title: "TEMPLATE_SLIDE",
        background: { color: "FFFFFF" },
        objects: [
          { // title
            placeholder: {
              options: { 
                name: "slide_title", 
                type: "title", 
                w: "80%", 
                h: 1, 
                bold: true, 
                align: "left",
                fontSize: fontSize,
                fontFace: fontFace
              },
              text: "(page_title)",
            },
          },
          { // subtitle
            placeholder: {
              options: { 
                name: "slide_subtitle", 
                type: "title", 
                w: "80%", 
                h: 1, 
                align: "left",
                fontSize: fontSize,
                fontFace: fontFace
              },
              text: "(page_subtitle)",
            },
          },
          { // footer
            placeholder: {
              options: { 
                name: "slide_footer", 
                type: "title", 
                w: "80%", 
                h: 1, 
                align: "left",
                fontSize: fontSize,
                fontFace: fontFace
              },
              text: "(page_subtitle)",
            },
          },
          { // "Seite" - text
            placeholder: {
              options: { 
                name: "slide_pageNumber", 
                type: "title", 
                w: 3, 
                h: 1, 
                align: "left",
                fontSize: fontSize,
                fontFace: fontFace
              },
              text: "(page_pageNumber)",
            }
          },
        ]
      });

/* 
      // 2. Add a Slide to the presentation
      let slide = doc.addSlide({ masterName: "TEMPLATE_SLIDE" });

      // 3. Add 1+ objects (Tables, Shapes, etc.) to the Slide
      slide.addText("Einwohner [Anzahl]", { placeholder: "slide_title" });
      slide.addText("2022-12-31", { placeholder: "slide_subtitle" });
      slide.addText("Erstellt am 2022-12-31 von M.Mustermann, Testkommune", { placeholder: "slide_footer" }); */


      // Pages

      for(let [idx, page] of $scope.config.pages.entries()) {

				if(!$scope.showThisPage(page)) {
					continue;
				}
        
        // 2. Add a Slide to the presentation
        let slide = doc.addSlide({ masterName: "TEMPLATE_SLIDE" });

        let formatFactor = 3.4;

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

          let pageElementDimensions = {}
					pageElementDimensions.top = pageElement.dimensions.top && pxToInch(pageElement.dimensions.top)*formatFactor;
					pageElementDimensions.bottom = pageElement.dimensions.bottom && pxToInch(pageElement.dimensions.bottom)*formatFactor;
					pageElementDimensions.left = pageElement.dimensions.left && pxToInch(pageElement.dimensions.left)*formatFactor;
					pageElementDimensions.right = pageElement.dimensions.right && pxToInch(pageElement.dimensions.right)*formatFactor;
					pageElementDimensions.width = pageElement.dimensions.width && pxToInch(pageElement.dimensions.width)*formatFactor;
					pageElementDimensions.height = pageElement.dimensions.height && pxToInch(pageElement.dimensions.height)*formatFactor;

					switch(pageElement.type) {
						case "indicatorTitle-landscape":
						case "indicatorTitle-portrait": {
							if (! page.templateSection.pageConfig.showTitle){
								// skip
								continue;
							}
              				slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_title" });
							break;
						}
            
						case "communeLogo-landscape":
						case "communeLogo-portrait": {
							if (! page.templateSection.pageConfig.showLogo){
								// skip
								continue;
							}
							if(pageElement.src && pageElement.src.length) {

								let img = new Image();
								img.src = pageElement.src;
								let imageWidth = img.width;
								let imageHeight = img.height;

								// create an image in width/size of the uploaded one (img object). Then shrink it down to pageElementDimensions, while containing imgRatio
								slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: imageWidth, h: imageHeight, path: pageElement.src, sizing: { type: "contain", w: pageElementDimensions.width, h: pageElementDimensions.height}});
							}
							break;
						}
						case "dataTimestamp-landscape":
						case "dataTimestamp-portrait": {
							if (! page.templateSection.pageConfig.showSubtitle){
								// skip
								continue;
							}
              slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_subtitle" });
							break;
						}
						case "dataTimeseries-landscape":
						case "dataTimeseries-portrait": {
							if (! page.templateSection.pageConfig.showSubtitle){
								// skip
								continue;
							}
              slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, fontSize: fontSize-3, fontFace: fontFace });
							break;
						}
						case "reachability-subtitle-landscape":
						case "reachability-subtitle-portrait": {
							if (! page.templateSection.pageConfig.showSubtitle){
								// skip
								continue;
							}
              slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, fontSize: fontSize-3, fontFace: fontFace });
							break;
						}
						case "footerHorizontalSpacer-landscape":
						case "footerHorizontalSpacer-portrait": {
							if (! page.templateSection.pageConfig.showFooterCreationInfo){
								// skip
								continue;
							}
              slide.addShape(doc.shapes.LINE, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: 0.0, line: { color: '#000000', width: 1 } });
              break;
						}
						case "footerCreationInfo-landscape":
						case "footerCreationInfo-portrait": {  
							if (! page.templateSection.pageConfig.showFooterCreationInfo){
								// skip
								continue;								
							}
              slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_footer" });
							break;
						} 
						case "pageNumber-landscape":
						case "pageNumber-portrait": {
							if (! page.templateSection.pageConfig.showPageNumber){
								// skip
								continue;
							}
							let text = "Seite " + $scope.getPageNumber(idx);
              slide.addText(text, { x: pageElementDimensions.left, y: pageElementDimensions.top, placeholder: "slide_pageNumber" });
							break;
						}
						// template-specific elements
						case "map": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let imageDataUrl = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )
							imageDataUrl = await $scope.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)

              slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, data: imageDataUrl});
							break;
						}
					 	// case "mapLegend" can be ignored since it is included in the map if needed
						 /*
							June 2025: we remove overallAverage and overallChange, overallAverage and selectionAverage from reporting overview pages.
						*/
			// 			case "overallAverage":
			// 			case "selectionAverage": {
			// 				let avgType = pageElement.type === "overallAverage" ? "Gesamtstadt" : "Selektion"
			// 				let text = "Durchschnitt\n" + avgType + ":\n" + pageElement.text.toString();
              
	        //     slide.addShape(doc.shapes.RECTANGLE, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, line: { color: '#000000', width: 1 } });
            //   slide.addText(text, { x: pageElementDimensions.left+0.1, y: pageElementDimensions.top+1, fontSize: fontSize-3, fontFace: fontFace });
			// 				break;
			// 			}
			// 			case "overallChange":
			// 			case "selectionChange": {
			// 				let changeType = pageElement.type === "overallChange" ? "Gesamtstadt" : "Selektion"
			// 				let text = "Durchschnittliche\nVeränderung\n" + changeType + ":\n" + pageElement.text.toString();
              
	        //     slide.addShape(doc.shapes.RECTANGLE, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, line: { color: '#000000', width: 1 } });
            //   slide.addText(text, { x: pageElementDimensions.left+0.1, y: pageElementDimensions.top+1.4, fontSize: fontSize-3, fontFace: fontFace });
			// 				break;
			// 			}
						case "barchart": {
							if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showRankingChartPerArea){
								continue;
							}
							let instance = echarts.getInstanceByDom(pElementDom);
							let base64String = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} );

              slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, data: base64String});
							break;
						}
						case "linechart": {
							if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showLineChartPerArea){
								continue;
							}
							let instance = echarts.getInstanceByDom(pElementDom);
							let base64String = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} );
              
              slide.addImage({ x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, h: pageElementDimensions.height, data: base64String});
							break;
						}
						case "textInput": {
							if (! page.templateSection.pageConfig.showFreeText){
								// skip
								continue;
							}
              slide.addText(pageElement.text, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, fontSize: fontSize-3, fontFace: fontFace });
							break;
						}
						case "datatable": {							

              let table = document.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type + " table");

              let data = [];
              if(table && table.rows.length>0) {
                table.rows.forEach((row, rowIndex) => {
                  
                  let singleRowData = [];
                  if(row.cells && row.cells.length>0) {
                    row.cells.forEach((cell, cellIndex) => {

                      let fillColour = '#dedede';
                      if(rowIndex>0) {
                        if(rowIndex% 2 == 0)
                          fillColour = '#ffffff';
                        else
                          fillColour = '#f9f9f9';
                      }

                      singleRowData.push({
                        text: cell.innerHTML,
                        options: {
                          align: ((cellIndex==1 && !rowIndex==0)?'right':'left'),
                          fontFace: fontFace,
                          fontSize: fontSize-3,
                          bold: ((rowIndex>0)?false:true),
                          fill: fillColour
                        }});
                    });
                    data.push(singleRowData);
                  }
                });
              }

              slide.addTable(data, { x: pageElementDimensions.left, y: pageElementDimensions.top, w: pageElementDimensions.width, rowH: 1, align: "left", border: { pt: "1", color: "#d6d6d6" }});
							break;
						} 
					}
				}
			}
      // pages end

      // 4. Save the Presentation

      let now = getCurrentDateAndTime();
      doc.writeFile({ fileName: now + "_KomMonitor-Report.pptx" });
			$scope.loadingData = false;
			setTimeout(function(){
				$scope.$digest();
			});
    }

		$scope.generatePdfReport = async function() {
			
			// create pdf document
			let doc = new jsPDF({
				margin: 0,	
				unit: 'mm',
				format: 'a4',
				orientation: $scope.config.pages[0].orientation
			});

      let fontName = "Helvetica"; // standard

      if($scope.customFontFile) {
        fontName = 'CustomInternal';
        doc.addFont($scope.customFontFile, fontName, 'normal');
      }

      // external working as well, but unable to check for validity beforehand. Thus resulting in an critical error if invalid at rendering 
     /* 
      doc.addFont('fonts/Comic_Sans_internal.ttf', 'Comic', 'normal');
      doc.addFont('https://fonts.gstatic.com/s/lobster/v30/neILzCirqoswsqX9_oWsMqEzSJQ.ttf', 'Tester', 'normal'); */
      
			doc.setDrawColor(148, 148, 148);
			doc.setFont(fontName, "normal", "normal"); 
			
			for(let [idx, page] of $scope.config.pages.entries()) {

				if(!$scope.showThisPage(page)) {
					continue;
				}

				if(idx > 0) {
					doc.addPage(null, page.orientation);
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
						case "indicatorTitle-landscape":
						case "indicatorTitle-portrait": {
							if (! page.templateSection.pageConfig.showTitle){
								// skip
								continue;
							}
							// Css takes the top-left edge of the element by default.
							// doc.text takes left-bottom, so we ass baseline "top" to achieve the same behavior in jspdf.
							doc.setFont(fontName, "normal", "normal")
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" });
							doc.setFont(fontName, "normal", "normal")
							break;
						}
						case "communeLogo-landscape":
						case "communeLogo-portrait": {
							if (! page.templateSection.pageConfig.showLogo){
								// skip
								continue;
							}
							// only add logo if one was selected
							if(pageElement.src && pageElement.src.length) {
								doc.addImage(pageElement.src, "JPEG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							}
							break;
						}
						case "dataTimestamp-landscape":
						case "dataTimestamp-portrait": {
							if (! page.templateSection.pageConfig.showSubtitle){
								// skip
								continue;
							}
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "dataTimeseries-landscape":
						case "dataTimeseries-portrait": {
							if (! page.templateSection.pageConfig.showSubtitle){
								// skip
								continue;
							}
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "reachability-subtitle-landscape":
						case "reachability-subtitle-portrait": {
							if (! page.templateSection.pageConfig.showSubtitle){
								// skip
								continue;
							}
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "footerHorizontalSpacer-landscape":
						case "footerHorizontalSpacer-portrait": {
							if (! page.templateSection.pageConfig.showFooterCreationInfo){
								// skip
								continue;
							}
							let x1, x2, y1, y2;
							x1 = pageElementDimensions.left;
							x2 = pageElementDimensions.left + pageElementDimensions.width;
							y1 = pageElementDimensions.top;
							y2 = pageElementDimensions.top;
							doc.line(x1, y1, x2, y2);
							break;
						}
						case "footerCreationInfo-landscape":
						case "footerCreationInfo-portrait": {
							if (! page.templateSection.pageConfig.showFooterCreationInfo){
								// skip
								continue;
							}
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "pageNumber-landscape":
						case "pageNumber-portrait": {
							if (! page.templateSection.pageConfig.showPageNumber){
								// skip
								continue;
							}
							let text = "Seite " + $scope.getPageNumber(idx);
							doc.text(text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						// template-specific elements
						case "map": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let imageDataUrl = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )
							imageDataUrl = await $scope.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)

							doc.addImage(imageDataUrl, "PNG", pageElementDimensions.left, pageElementDimensions.top,
								pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						// case "mapLegend" can be ignored since it is included in the map if needed
						 /*
							June 2025: we remove overallAverage and overallChange, overallAverage and selectionAverage from reporting overview pages.
						*/
						// case "overallAverage":
						// case "selectionAverage": {
						// 	let x, y, width, height;
						// 	x = pageElementDimensions.left;
						// 	y = pageElementDimensions.top;
						// 	width = pageElementDimensions.width;
						// 	height = pageElementDimensions.height;
						// 	doc.rect(x, y, width, height);
						// 	let avgType = pageElement.type === "overallAverage" ? "Gesamtstadt" : "Selektion"
						// 	let text = "Durchschnitt\n" + avgType + ":\n" + pageElement.text.toString()
						// 	doc.text(text, pageElementDimensions.left + pxToMilli(5), pageElementDimensions.top + pxToMilli(5), { baseline: "top" });
						// 	break;
						// }
						// case "overallChange":
						// case "selectionChange": {
						// 	let x = pageElementDimensions.left;
						// 	let y = pageElementDimensions.top;
						// 	let width = pageElementDimensions.width;
						// 	let height = pageElementDimensions.height;
						// 	doc.rect(x, y, width, height);
						// 	let changeType = pageElement.type === "overallChange" ? "Gesamtstadt" : "Selektion"
						// 	let text = "Durchschnittliche\nVeränderung\n" + changeType + ":\n" + pageElement.text.toString()
						// 	doc.text(text, x + pxToMilli(5), y + pxToMilli(5), { baseline: "top" });
						// 	break;
						// }
						case "barchart": {
							if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showRankingChartPerArea){
								continue;
							}
							let instance = echarts.getInstanceByDom(pElementDom)
							let base64String = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )
							doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						case "linechart": {
							if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showLineChartPerArea){
								continue;
							}
							let instance = echarts.getInstanceByDom(pElementDom)
							let base64String = instance.getDataURL( {pixelRatio: $scope.echartsImgPixelRatio} )
							doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						case "textInput": {
							if (! page.templateSection.pageConfig.showFreeText){
								// skip
								continue;
							}
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
			setTimeout(function(){
				$scope.$digest();
			});
		}

		
		$scope.generateZipFolder = async function() {
			// creates a zip folder containing all echarts files
			let zip = new JSZip();
			
			// screenshot map attribution and legend only once per section
			for(let [idx, page] of $scope.config.pages.entries()) {
			
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
						imageDataUrl = await $scope.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)
						
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
				setTimeout(function(){
					$scope.$digest();
				});
			});
		}

		let sections = []; // one section per page for now, since this is an easy way to create page breaks

		$scope.generateWordReport = async function() {
			// see docx documentation for more info about the format:
			// https://docx.js.org/#/?id=basic-usage

			let font = "Calibri";
      if($scope.customFontFamily!=undefined) {
        font = $scope.customFontFamily.replace(/['"]+/g,'');
      }
			for(let [idx, page] of $scope.config.pages.entries()) {

				if(!$scope.showThisPage(page)) {
					continue;
				}

				let paragraphs = [];
				let pageDom = document.querySelector("#reporting-overview-page-" + idx);
				for(let pageElement of page.pageElements) {

					let pageElementDimensionsPx = calculateDimensions(pageElement.dimensions, "px");
					let pageElementDimensionsTwip = calculateDimensions(pageElement.dimensions, "twip");
					let pageElementDimensionsEmu = calculateDimensions(pageElement.dimensions, "emu");

					switch(pageElement.type) {
						case "indicatorTitle-landscape":
						case "indicatorTitle-portrait": {
							if (! page.templateSection.pageConfig.showTitle){
								// skip
								continue;
							}
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
						case "communeLogo-landscape":
						case "communeLogo-portrait": {
							if (! page.templateSection.pageConfig.showLogo){
								// skip
								continue;
							}
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
						case "reachability-subtitle-landscape":
						case "dataTimestamp-portrait":
						case "dataTimeseries-portrait":
						case "reachability-subtitle-portrait": {
							if (! page.templateSection.pageConfig.showSubtitle){
								// skip
								continue;
							}
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
						case "footerHorizontalSpacer-portrait":
							if (! page.templateSection.pageConfig.showFooterCreationInfo){
								// skip
								continue;
							}
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
						case "footerCreationInfo-landscape":
						case "footerCreationInfo-portrait": {
							if (! page.templateSection.pageConfig.showFooterCreationInfo){
								// skip
								continue;
							}

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
						case "pageNumber-landscape":
						case "pageNumber-portrait": {
							if (! page.templateSection.pageConfig.showPageNumber){
								// skip
								continue;
							}
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: "Seite " + $scope.getPageNumber(idx),
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
							if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showLineChartPerArea && pageElement.type === "linechart" ){
								continue;
							}
							if(page.type == 'area_specific' && ! page.templateSection.pageConfig.showRankingChartPerArea && pageElement.type === "barchart" ){
								continue;
							}
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

							if(pageElement.type === "map"){
								imageDataUrl = await $scope.createLeafletEChartsMapImage(page, pageDom, pageElement, imageDataUrl)
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
						 /*
							June 2025: we remove overallAverage and overallChange, overallAverage and selectionAverage from reporting overview pages.
						*/
						// case "overallAverage":
						// case "selectionAverage": {
						// 	let paragraph = new docx.Paragraph({
						// 		children: [
						// 			new docx.TextRun({
						// 				text: "Durchschnitt",
						// 				font: font,
						// 				size: 28  // 14pt
						// 			}),
						// 			new docx.TextRun({
						// 				text: pageElement.type === "overallAverage" ? "Gesamtstadt" : "Selektion",
						// 				size: 28,
						// 				font: font,
						// 				break: 1,  // 14pt
						// 			}),
						// 			new docx.TextRun({
						// 				text: pageElement.text.toString(),
						// 				size: 28,
						// 				font: font,
						// 				break: 1  // 14pt
						// 			})
						// 		],
						// 		frame: {
						// 			position: {
						// 				x: pageElementDimensionsTwip.left,
						// 				y: pageElementDimensionsTwip.top,
						// 			},
						// 			width: pageElementDimensionsTwip.width,
						// 			height: pageElementDimensionsTwip.height,
						// 			anchor: {
						// 				horizontal: docx.FrameAnchorType.MARGIN,
						// 				vertical: docx.FrameAnchorType.MARGIN,
						// 			},
						// 			alignment: {
						// 				x: docx.HorizontalPositionAlign.LEFT,
						// 				y: docx.VerticalPositionAlign.TOP,
						// 			}
						// 		},
						// 		border: {
						// 			top: {
						// 				color: "#949494", // gray
						// 				space: 1,
						// 				style: docx.BorderStyle.SINGLE,
						// 				size: 6 
						// 			},
						// 			right: {
						// 				color: "#949494",
						// 				space: 1,
						// 				style: docx.BorderStyle.SINGLE,
						// 				size: 6 
						// 			},
						// 			bottom: {
						// 				color: "#949494",
						// 				space: 1,
						// 				style: docx.BorderStyle.SINGLE,
						// 				size: 6 
						// 			},
						// 			left: {
						// 				color: "#949494",
						// 				space: 1,
						// 				style: docx.BorderStyle.SINGLE,
						// 				size: 6 
						// 			},
						// 		}
						// 	});
							
						// 	paragraphs.push(paragraph);
						// 	break;
						// }
						// case "overallChange":
						// case "selectionChange": {
						// 	let paragraph = new docx.Paragraph({
						// 		children: [
						// 			new docx.TextRun({
						// 				text: "Durchschnittliche",
						// 				font: font,
						// 				size: 28  // 14pt
						// 			}),
						// 			new docx.TextRun({
						// 				text: "Veränderung",
						// 				font: font,
						// 				break: 1,
						// 				size: 28  // 14pt
						// 			}),
						// 			new docx.TextRun({
						// 				text: pageElement.type === "overallChange" ? "Gesamtstadt" : "Selektion",
						// 				break: 1,
						// 				font: font,
						// 				size: 28  // 14pt
						// 			}),
						// 			new docx.TextRun({
						// 				text: pageElement.text.toString(),
						// 				break: 1,
						// 				font: font,
						// 				size: 28  // 14pt
									
						// 			})
						// 		],
						// 		frame: {
						// 			position: {
						// 				x: pageElementDimensionsTwip.left,
						// 				y: pageElementDimensionsTwip.top,
						// 			},
						// 			width: pageElementDimensionsTwip.width,
						// 			height: pageElementDimensionsTwip.height,
						// 			anchor: {
						// 				horizontal: docx.FrameAnchorType.MARGIN,
						// 				vertical: docx.FrameAnchorType.MARGIN,
						// 			},
						// 			alignment: {
						// 				x: docx.HorizontalPositionAlign.LEFT,
						// 				y: docx.VerticalPositionAlign.TOP,
						// 			}
						// 		},
						// 		border: {
						// 			top: {
						// 				color: "#949494", // gray
						// 				space: 1,
						// 				style: docx.BorderStyle.SINGLE,
						// 				size: 6 
						// 			},
						// 			right: {
						// 				color: "#949494",
						// 				space: 1,
						// 				style: docx.BorderStyle.SINGLE,
						// 				size: 6 
						// 			},
						// 			bottom: {
						// 				color: "#949494",
						// 				space: 1,
						// 				style: docx.BorderStyle.SINGLE,
						// 				size: 6 
						// 			},
						// 			left: {
						// 				color: "#949494",
						// 				space: 1,
						// 				style: docx.BorderStyle.SINGLE,
						// 				size: 6 
						// 			},
						// 		}
						// 	});
							
						// 	paragraphs.push(paragraph);
						// 	break;
						// }
						case "textInput": {
							if (! page.templateSection.pageConfig.showFreeText){
								// skip
								continue;
							}
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
								start: $scope.getPageNumber(idx),
								formatType: docx.NumberFormat.DECIMAL,
							},
							size: {
								orientation: page.orientation,
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
				$scope.loadingData = false;
				setTimeout(function(){
					$scope.$digest();
				});
			});
		}

		$scope.createLeafletEChartsMapImage = async function(page, pageDom, pageElement, echartsImgSrc) {
			let result;
			// screenshot leaflet map and merge it with echarts image
			// remove page offset temporarily 
			pageElement.leafletMap.getContainer().style.top = "0px"
			pageElement.leafletMap.getContainer().style.left = "0px"

			// wait for print process to finish
			// var node = document.getElementById(pageDom);
			var node = pageElement.leafletMap["_container"];

			/*
				here we must check if the corresponding leaflet image has already been created and stored within cache
				if not or it's too old, recreate it
				if yes, simply use it to save a lot of time during report generation!
			*/
			let leafletMapScreenshot = kommonitorLeafletScreenshotCacheHelperService.getResourceFromCache(pageElement.selectedBaseMap.layerConfig.name, page.spatialUnitId, page.spatialUnitFeatureId, page.orientation);
			// let leafletMapScreenshot = await domtoimage
            //   .toJpeg(node, { quality: 1.0 })
            //   .then(function (dataUrl) {
            //     return dataUrl;
            //   })
            //   .catch(function (error) {
            //       console.error('oops, something went wrong!', error);
            //   });

			pageElement.leafletMap.getContainer().style.top = "90px"
			pageElement.leafletMap.getContainer().style.left = "15px"
			
			// combine images
			let canvas = document.createElement('canvas');
			let ctx = canvas.getContext('2d', {
				willReadFrequently: true
			  });
			let pageElementDimensionsPx = calculateDimensions(pageElement.dimensions, "px");
			canvas.width = pageElementDimensionsPx.width;
			canvas.height =  pageElementDimensionsPx.height;
			// we have to draw layers in order
			let leafletMapImg = new Image();
			// leafletMapImg.crossOrigin = "anonymous";
			leafletMapImg.width = canvas.width;
			leafletMapImg.height = canvas.height;
			let leafletMapImgDrawn = new Promise( (resolve, reject) => {
				leafletMapImg.onload = function() {
					ctx.drawImage(leafletMapImg, 0, 0, canvas.width, canvas.height);
					resolve();
				}
			})
			leafletMapImg.src = leafletMapScreenshot;
			await leafletMapImgDrawn

			let echartsImg = new Image();
			// echartsImg.crossOrigin = "anonymous";
			let echartsImgDrawn = new Promise( (resolve, reject) => {
				echartsImg.onload = function() {
					ctx.drawImage(echartsImg, 0, 0, canvas.width, canvas.height);
					resolve();
				}
			});
			echartsImg.src = echartsImgSrc;
			await echartsImgDrawn

			let mapAttributionImg = pageDom.querySelector(".map-attribution > img");
			ctx.fillStyle = "white";
			ctx.fillRect(0, canvas.height - mapAttributionImg.height, mapAttributionImg.width, mapAttributionImg.height)
			ctx.drawImage(mapAttributionImg, 0, canvas.height - mapAttributionImg.height);
			let mapLegendImg = pageDom.querySelector(".map-legend > img")
			if(mapLegendImg){
				ctx.fillRect(canvas.width - mapLegendImg.width, canvas.height - mapLegendImg.height, mapLegendImg.width, mapLegendImg.height)
				ctx.drawImage(mapLegendImg, canvas.width - mapLegendImg.width, canvas.height - mapLegendImg.height);
			}		
			result = canvas.toDataURL();
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

		function pxToInch(px) {
			// our preview is 830px wide
			// px / 830  gives us the percentage from the left edge, which can then be stretched to fit the A4 page
			// This is the short version of:
			// px / pxPerMillimeter * pxPerMillimeter * 297 / 830, where pxPerMillimeter = (deviceScreenPpi / 2.54) * 10
			// pxPerMillimeter cancels out there, so it doesn't matter.
			let result = parseInt(px, 10);
			result = Math.round((result/$scope.deviceScreenDpi) * 100) / 100;
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