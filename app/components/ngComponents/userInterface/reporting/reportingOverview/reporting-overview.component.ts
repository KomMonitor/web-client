import { jsPDFConstructor } from './../../../../../dependencies/jspdf-autotable/index.d';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { fromJson, toJson } from 'angular';
import * as echarts from 'echarts';
import * as docx from 'docx';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import * as jsPDF from 'jspdf';
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';

@Component({
  selector: 'app-reporting-overview',
  standalone: true,
  templateUrl: './reporting-overview.component.html',
  styleUrls: ['./reporting-overview.component.css'],
  imports: [CommonModule, SafeHtmlPipe]
})
export class ReportingOverviewComponent implements OnInit {

  @Output() selectedWorkflow = new EventEmitter<any[]>();
  @Input() data:any = [];

  constructor(
    private dataExchangeService: DataExchangeService
  ) {}


  ngOnInit(): void {
    let configFileSelected = this.data[0];
    let data:any = this.data[1];
    if(configFileSelected) {
      this.importConfig(data);
    } else {
      this.config.template = JSON.parse(JSON.stringify(data));
      this.config.pages = this.config.template.pages;
      console.log(this.config);
    }
    this.config.templateSections = [];
    let deviceScreenDpi = this.calculateScreenDpi();
    this.pxPerMilli = deviceScreenDpi / 25.4 // /2.54 --> cm, /10 --> mm
  }
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
		config:any = {
			templateSections: [
				// {
				// 	indicator: "",
				// 	poiLayer: ""
				// }
			],
			pages: [],
			template: {}
		};
		loadingData = false;
		echartsImgPixelRatio = 2;
    pxPerMilli;

    sections = []; // one section per page for now, since this is an easy way to create page breaks

		sortableConfig = {
			onEnd: function (e) {
				// nothing for now, config elements get reordered automatically
			}
		};

	/* 	$on("reportingInitializeOverview", function(event, data) {
			// data is a nested array at this point [ [ { template object } ] ]
			this.initialize(data);
		}) */

		onPageTurnClicked(orientation, index) {
			let temp = this.config.pages[index];
			this.config.pages[index] = this.config.pages[index + 1];
			this.config.pages[index + 1] = temp;
		}

		onConfigureNewIndicatorClicked() {
      this.onWorkflowSelect([3,this.config]);
			//this.$emit('reportingConfigureNewIndicatorClicked', [this.config.template]);
		}

		onConfigureNewPoiLayerClicked() {
			//this.$emit('reportingConfigureNewPoiLayerClicked', [this.config.template]);
		}
	
		onBackToTemplateSelectionClicked() {
      this.onWorkflowSelect([1]);
		}

    onWorkflowSelect(value: any[]) {
      this.selectedWorkflow.emit(value);
    }
		/* $on("reportingIndicatorConfigurationCompleted", function(event, data) {
			this.loadingData = true;
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
			this.config.pages = this.config.pages.filter( page => {
				if(page.hasOwnProperty("templateSection")) {
					return page.templateSection.hasOwnProperty("indicatorName");
				} else {
					return false;
				}
			});
			// append to array
			this.config.pages.push(...template.pages);
			
			this.config.templateSections.push(templateSection);
				
			// setup pages after dom exists
			// at this point we still have all the echarts maps registered
			this.setupNewPages(this.config.templateSections.at(-1));
		}); */

	/* 	$on("reportingPoiLayerConfigurationCompleted", function(event, data) {
			this.loadingData = true;
			// add indicator to 'added indicators'
			let [poiLayer, indicator, template] = data;

			let templateSection = {
				indicatorName: indicator ? indicator.indicatorName : "",
				indicatorId: indicator ? indicator.indicatorId : "",
				poiLayerName: poiLayer.datasetName,
				spatialUnitName: template.spatialUnitName,
				absoluteLabelPositions: template.absoluteLabelPositions,
				echartsRegisteredMapNames: template.echartsRegisteredMapNames,
				echartsMaps: [],
				isochronesRangeType: template.isochronesRangeType,
				isochronesRangeUnits: template.isochronesRangeUnits
			}
			for(let page of template.pages) {
				page.templateSection = templateSection;
			}
			// remove all pages without property poiLayerName (clean template)
			this.config.pages = this.config.pages.filter( page => {
				if(page.hasOwnProperty("templateSection")) {
					return page.templateSection.hasOwnProperty("poiLayerName");
				} else {
					return false;
				}
			});
			// append to array
			this.config.pages.push(...template.pages);
			this.config.templateSections.push(templateSection);
				
			// setup pages after dom exists
			// at this point we still have all the echarts maps registered
			this.setupNewPages(this.config.templateSections.at(-1));
		}); */

		removeTemplateSection(idx) {
			this.config.templateSections.splice(idx, 1)

			// show empty template if this was the last indicator
			if(this.config.templateSections.length === 0) {
				this.config.pages = this.config.template.pages;
			}
		}

		
	/* 	$watchCollection('config.templateSections', function(newVal, oldVal) {
			
			if(newVal.length < oldVal.length) { // removed
				// find removed section
				let difference = oldVal
					.filter(x => !newVal.includes(x))
					.concat(newVal.filter(x => !oldVal.includes(x)));

				let removedSection = difference[0];
				// remove all pages for that section
				this.config.pages = this.config.pages.filter( page => {
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
					for(let page of this.config.pages) {
						if(page.templateSection.indicatorId === section.indicatorId &&
							page.templateSection.spatialUnitId === section.spatialUnitId &&
							page.templateSection.poiLayerName === section.poiLayerName) {

							sorted.push(page);
						}
					}
				}
				this.config.pages = sorted;
			}
		}); */

		


		setupNewPages(templateSection) {

		/* 	$timeout(async function(templateSection) {
				if(!templateSection.poiLayerName) {

					// for indicator without poi layer
					let indicatorId = templateSection.indicatorId;
					let spatialUnit, featureCollection, features, geoJSON;
					let isFirstPageToAdd = true;
					for(let [idx, page] of this.config.pages.entries()) {

						if(page.templateSection.indicatorId !== indicatorId) {
							continue; // only do changes to new pages
						} else {
							// Indicator and spatial unit are the same for all added pages
							// We only need to query features on the first page that we add
							if(isFirstPageToAdd) {
								isFirstPageToAdd = false;
								spatialUnit = await this.getSpatialUnitByIndicator(indicatorId, page.templateSection.spatialUnitName)
								featureCollection = await this.queryFeatures(indicatorId, spatialUnit);
								features = this.createLowerCaseNameProperty(featureCollection.features);
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
										this.filterMapByArea(instance, pageElement.echartsOptions, page.area, geoJSON.features)
									} else {
										// recreate label positions
										pageElement.echartsOptions.labelLayout(feature) {
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
							}

							if(pageElement.type === "selectionChange") {
								let wrapper = pageDom.querySelector(".type-selectionChange")
								wrapper.style.border = "none";
							}

							if(pageElement.type === "datatable") {
								this.createDatatablePage(pElementDom, pageElement);
							}
						}
					}
					this.loadingData = false;
					$timeout(function(){
						this.$digest();
					});
				} else {
					this.handleSetupNewPagesForReachability(templateSection)
				}
			}, 0, false, templateSection); */
		}

		
    // async
		async handleSetupNewPagesForReachability(templateSection) {
			/* let poiLayerName = templateSection.poiLayerName;
			let spatialUnit, featureCollection, features, geoJSON, indicatorId;
			// if indicator was chosen
			if( templateSection.indicatorId) {
				indicatorId = templateSection.indicatorId;
			}
			let isFirstPageToAdd = true;
			for(let [idx, page] of this.config.pages.entries()) {

				if(page.templateSection.poiLayerName !== poiLayerName) {
					continue; // only do changes to new pages
				} else {
					// PoiLayer, Indicator and spatial unit are the same for all added pages
					// We only need to query features on the first page that we add
					if(isFirstPageToAdd) {
						isFirstPageToAdd = false;
						if(indicatorId) {
							spatialUnit = await this.getSpatialUnitByIndicator(indicatorId, page.templateSection.spatialUnitName);
							featureCollection = await this.queryFeatures(indicatorId, spatialUnit);
						} else {
							spatialUnit = await this.getSpatialUnitByName(page.templateSection.spatialUnitName);
							featureCollection = await this.queryFeatures(undefined, spatialUnit);
						}
						
						features = this.createLowerCaseNameProperty(featureCollection.features);
						geoJSON = { features: features };

					}
				}

				let pageDom:any = document.querySelector("#reporting-overview-page-" + idx);
				for(let pageElement of page.pageElements) {
					let pElementDom = pageDom.querySelector("#reporting-overview-page-" + idx + "-" + pageElement.type)

					if(pageElement.type === "map") {
						let instance = echarts.init( pElementDom );

						if(page.area && page.area.length) {
							// at this point we have not yet set echarts options, so we provide them as an extra parameter
							this.filterMapByArea(instance, pageElement.echartsOptions, page.area, geoJSON.features)
						} else {
							// recreate label positions
							pageElement.echartsOptions.labelLayout(feature) {
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

						await this.initializeLeafletMap(page, pageElement, instance, spatialUnit)
					}
				} 
			}
			this.loadingData = false;
			$timeout(function(){
				this.$digest();
			});*/
		}

		initializeLeafletMap = async function(page, pageElement, map, spatialUnit) {
		/* 	await $timeout(async function(page, pageElement, echartsMap, spatialUnit) {
				let pageIdx = this.config.pages.indexOf(page);
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
				//let geoJsonLayer = L.geoJSON( this.geoJsonForReachability.features )
				//geoJsonLayer.addTo(leafletMap)
				//let isochronesLayer = L.geoJSON( this.isochrones.features )
				//isochronesLayer.addTo(leafletMap);

			}, 0, true, page, pageElement, map, spatialUnit) */
		}

    //async
		getSpatialUnitByName(spatialUnitName) {
			let url;
			url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/spatial-units"
			// send request
		/* 	return await $http({
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
				this.loadingData = false;
				this.dataExchangeService.displayMapApplicationError(error);
				console.error(error);
			}); */
		}

    // async
		getSpatialUnitByIndicator(indicatorId, spatialUnitName) {
			let url;
			url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + indicatorId;
			// send request
		/* 	return await $http({
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
				this.loadingData = false;
				this.dataExchangeService.displayMapApplicationError(error);
				console.error(error);
			}); */
		}

		
		filterMapByArea(echartsInstance, echartsInstanceOptions, areaName, allFeatures) {
			let mapName = echartsInstanceOptions.series[0].map;
			// filter shown areas if we are in the area-specific part of the template
			let features:any = allFeatures.filter ( el => {
				return el.properties.name === areaName
			});

      // todo, ggf falscher "features" transfer
			echarts.registerMap(mapName, features )
			echartsInstance.setOption(echartsInstanceOptions) // set same options, but this updates the map
		}


		createDatatableSkeleton(colNamesArr) {

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


		createDatatablePage(pElementDom, pageElement) {
			pElementDom.innerHTML = "";
			pElementDom.style.border = "none"; // hide dotted border from outer dom element
			pElementDom.style.justifyContent = "flex-start"; // align table at top instead of center
			// add data
			let table = this.createDatatableSkeleton(pageElement.columnNames);
			let tbody:any = table.querySelector("tbody")
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


		importConfig(config) {
			this.loadingData = true;

			try {
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

				this.config.template = config.template;
				this.config.pages = config.pages;
				this.config.templateSections = config.templateSections;

				// register echarts maps
				for(let section of this.config.templateSections) {
					for(let mapName of section.echartsRegisteredMapNames) {
						if(this.config.template.name.includes("reachability")) {
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
				for(let page of this.config.pages) {
					for(let pageElement of page.pageElements) {
						if(pageElement.type === "map" && pageElement.hasOwnProperty("echartsMaps")) {
							for(let map of pageElement.echartsMaps) {
								echarts.registerMap(map.name, map.geoJson)
							}
						}
					}
				}
			

				for(let section of this.config.templateSections) {
					this.setupNewPages(section);
				}
			} catch (error:any) {
				console.error(error);
				this.loadingData = false;
				this.dataExchangeService.displayMapApplicationError(error.message);
			}
		}

		showThisPage(page) {
			let pageWillBeShown = false;
			for(let visiblePage of this.filterPagesToShow()){
				if(visiblePage == page) {
					pageWillBeShown = true;
				}
			}
			return pageWillBeShown;
		}

		getPageNumber(index) {
			let pageNumber = 1;
			for(let i = 0; i < index; i ++) {
				if (this.showThisPage(this.config.pages[i])) {
					pageNumber ++;
				}
			}
			return pageNumber;
		}

		filterPagesToShow() {
			let pagesToShow:any[] = [];
			let skipNextPage = false;
			for (let i = 0; i < this.config.pages.length; i ++) {
				let page = this.config.pages[i];
				if (this.pageContainsDatatable(i)) {
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

		pageContainsDatatable(pageID) {
			let page = this.config.pages[pageID];
			let pageContainsDatatable = false;
			for(let pageElement of page.pageElements) {
				if(pageElement.type == "datatable") {
					pageContainsDatatable = true;
				}
			}
			return pageContainsDatatable;
		}


		exportConfig() {
			try {
				let jsonToExport:any = {};
				
				let temp = JSON.stringify( this.config.pages, function(key, value) {
					// Leaflet map contains cyclic object references so we have to remove it.
					// We have to initialize the map again on import based on the stored boundingbox
					if(key === "leafletMap") {
						return undefined;
					} else {
						return value;
					}
				})

				jsonToExport.pages = JSON.parse( temp )
				jsonToExport.template = fromJson(toJson( this.config.template ));
				jsonToExport.templateSections = this.config.templateSections;

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
					let mapNames:any = [...new Set(section.echartsRegisteredMapNames)]
					if(this.config.template.name.includes("reachability")) {
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

				let jsonString = "data:text/json;charset=utf-8," + encodeURIComponent( toJson(jsonToExport) );
				// to download json, a DOM element is created, clicked and removed
				let downloadAnchorNode = document.createElement('a');
				downloadAnchorNode.setAttribute("href", jsonString);
				downloadAnchorNode.setAttribute("download", this.getCurrentDateAndTime() + "_KomMonitor-Reporting-Konfiguration.json");
				document.body.appendChild(downloadAnchorNode); // required for firefox
				downloadAnchorNode.click();
				downloadAnchorNode.remove();
			} catch (error:any) {
				this.dataExchangeService.displayMapApplicationError(error.message);
				console.error(error)
			}
			
		}

		getCurrentDateAndTime() {
			let date = new Date();
			let year = date.getFullYear().toString();
			let month:any = date.getMonth() + 1;
			let day:any = date.getDate();
			let time:any = date.getHours();
			let minutes:any = date.getMinutes();
			let seconds:any = date.getSeconds();
			let now = "".concat(year, "-", month, "-", day, "_", time, "-", minutes, "-", seconds);
			return now;
		}


		getIndicatorByName(indicatorName) {
			let result;
			for(let indicator of this.dataExchangeService.pipedData.availableIndicators) {
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

    // async
		queryFeatures(indicatorId, spatialUnit) {
			// build request
			// query different endpoints depending on if we have an indicator or not
			let url;
			if(!indicatorId) {
				let date = spatialUnit.metadata.lastUpdate.split("-")
				let year = date[0]
				let month = date[1]
				let day = date[2]
				url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
					"/spatial-units/" + spatialUnit.spatialUnitId + "/" + year + "/" + month + "/" + day; 
			} else {
				url = this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
					"/indicators/" + indicatorId + "/" + spatialUnit.spatialUnitId;
			}
			// send request
			this.loadingData = true;
		/* 	return await $http({
				url: url,
				method: "GET"
			}).then(function successCallback(response) {
				this.loadingData = false;
				return response.data;
			}, function errorCallback(error) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
				this.loadingData = false;
				this.dataExchangeService.displayMapApplicationError(error);
				console.error(error);
			}); */
		}

		createLowerCaseNameProperty(features) {
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

/* 		$on("reportingGenerateReport", function(event, format) {
			this.generateReport(format);
		}); */

    //async
		generateReport(format) {
			this.loadingData = true;
 
			try {
				format === "pdf" && this.generatePdfReport();
				format === "docx" && this.generateWordReport();
				format === "zip" && this.generateZipFolder();
			} catch (error:any) {
				this.loadingData = false;
				console.error(error);
				this.dataExchangeService.displayMapApplicationError(error.message);
			}
		}
			
    // async
		generatePdfReport() {
			
			// create pdf document
			/* let doc = new jsPDF({
				margin: 0,	
				unit: 'mm',
				format: 'a4',
				orientation: this.config.pages[0].orientation
			});

			// general settings
			let fontName = "Helvetica";
			doc.setDrawColor(148, 148, 148);
			doc.setFont(fontName, "normal", "normal"); // name, normal/italic, fontweight
			
			for(let [idx, page] of this.config.pages.entries()) {

				if(!this.showThisPage(page)) {
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
					pageElementDimensions.top = pageElement.dimensions.top && this.pxToMilli(pageElement.dimensions.top);
					pageElementDimensions.bottom = pageElement.dimensions.bottom && this.pxToMilli(pageElement.dimensions.bottom);
					pageElementDimensions.left = pageElement.dimensions.left && this.pxToMilli(pageElement.dimensions.left);
					pageElementDimensions.right = pageElement.dimensions.right && this.pxToMilli(pageElement.dimensions.right);
					pageElementDimensions.width = pageElement.dimensions.width && this.pxToMilli(pageElement.dimensions.width);
					pageElementDimensions.height = pageElement.dimensions.height && this.pxToMilli(pageElement.dimensions.height);
					
					// TODO some cases could be merged, but it's better to do that later when stuff works
					switch(pageElement.type) {
						case "indicatorTitle-landscape":
						case "indicatorTitle-portrait": {
							// Css takes the top-left edge of the element by default.
							// doc.text takes left-bottom, so we ass baseline "top" to achieve the same behavior in jspdf.
							doc.setFont(fontName, "Bold")
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" });
							doc.setFont(fontName, "normal", "normal")
							break;
						}
						case "communeLogo-landscape":
						case "communeLogo-portrait": {
							// only add logo if one was selected
							if(pageElement.src && pageElement.src.length) {
								doc.addImage(pageElement.src, "JPEG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							}
							break;
						}
						case "dataTimestamp-landscape":
						case "dataTimestamp-portrait": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "dataTimeseries-landscape":
						case "dataTimeseries-portrait": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "reachability-subtitle-landscape":
						case "reachability-subtitle-portrait": {
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "footerHorizontalSpacer-landscape":
						case "footerHorizontalSpacer-portrait": {
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
							doc.text(pageElement.text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						case "pageNumber-landscape":
						case "pageNumber-portrait": {
							let text = "Seite " + this.getPageNumber(idx);
							doc.text(text, pageElementDimensions.left, pageElementDimensions.top, { baseline: "top" })
							break;
						}
						// template-specific elements
						case "map": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let imageDataUrl = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} )

							if(this.config.template.name.includes("reachability")) {
								try {
									imageDataUrl = await this.createReachabilityMapImage(pageDom, pageElement, imageDataUrl)
								} catch(error) {
									this.loadingData = false;
									this.dataExchangeService.displayMapApplicationError(error);
									console.error(error);
								}
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
							doc.text(text, pageElementDimensions.left + this.pxToMilli(5), pageElementDimensions.top + this.pxToMilli(5), { baseline: "top" });
							break;
						}
						case "overallChange":
						case "selectionChange": {
							let x = pageElementDimensions.left;
							let y = pageElementDimensions.top;
							let width = pageElementDimensions.width;
							let height = pageElementDimensions.height;
							doc.rect(x, y, width, height);
							let changeType = pageElement.type === "overallChange" ? "Gesamtstadt" : "Selektion"
							let text = "Durchschnittliche\nVeränderung\n" + changeType + ":\n" + pageElement.text.toString()
							doc.text(text, x + this.pxToMilli(5), y + this.pxToMilli(5), { baseline: "top" });
							break;
						}
						case "barchart": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} )
							doc.addImage(base64String, "PNG", pageElementDimensions.left, pageElementDimensions.top,
									pageElementDimensions.width, pageElementDimensions.height, "", 'MEDIUM');
							break;
						}
						case "linechart": {
							let instance = echarts.getInstanceByDom(pElementDom)
							let base64String = instance.getDataURL( {pixelRatio: this.echartsImgPixelRatio} )
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
			this.loadingData = false;
			$timeout(function(){
				this.$digest();
			}); */
		}

		
		generateZipFolder = async function() {
			/* // creates a zip folder containing all echarts files
			let zip = new JSZip();
			
			// screenshot map attribution and legend only once per section
			for(let [idx, page] of this.config.pages.entries()) {
			
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
							pixelRatio: this.echartsImgPixelRatio
						});

						if(this.config.template.name.includes("reachability")) {
							try {
								imageDataUrl = await this.createReachabilityMapImage(pageDom, pageElement, imageDataUrl)
							} catch(error) {
								this.loadingData = false;
								this.dataExchangeService.displayMapApplicationError(error);
								console.error(error);
							}
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
				this.loadingData = false;
				$timeout(function(){
					this.$digest();
				});
			}); */
		}

    // async
		generateWordReport() {
			// see docx documentation for more info about the format:
			// https://docx.js.org/#/?id=basic-usage

			/* let font = "Calibri";
			
			for(let [idx, page] of this.config.pages.entries()) {

				if(!this.showThisPage(page)) {
					continue;
				}

				let paragraphs:any[] = [];
				let pageDom = document.querySelector("#reporting-overview-page-" + idx);
				for(let pageElement of page.pageElements) {

					let pageElementDimensionsPx = calculateDimensions(pageElement.dimensions, "px");
					let pageElementDimensionsTwip = calculateDimensions(pageElement.dimensions, "twip");
					let pageElementDimensionsEmu = calculateDimensions(pageElement.dimensions, "emu");

					switch(pageElement.type) {
						case "indicatorTitle-landscape":
						case "indicatorTitle-portrait": {
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
							let paragraph = new docx.Paragraph({
								children: [
									new docx.TextRun({
										text: "Seite " + this.getPageNumber(idx),
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
							 		pixelRatio: this.echartsImgPixelRatio
							});

							if(this.config.template.name.includes("reachability")) {
								try {
									imageDataUrl = await this.createReachabilityMapImage(pageDom, pageElement, imageDataUrl)
								} catch(error) {
									this.loadingData = false;
									this.dataExchangeService.displayMapApplicationError(error);
									console.error(error);
								}
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
								start: this.getPageNumber(idx),
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

			let doc:any = new docx.Document(docxConfig);
		
			let filename = getCurrentDateAndTime() + "_KomMonitor-Report"
			// Used to export the file into a .docx file
			docx.Packer.toBlob(doc).then((blob) => {
				saveAs(blob, filename + ".docx");
				this.loadingData = false;
			
			}); */
		}

    //async
		createReachabilityMapImage(pageDom, pageElement, echartsImgSrc) {
			/* let result;
			// screenshot leaflet map and merge it with echarts image
			// remove page offset temporarily 
			pageElement.leafletMap.getContainer().style.top = "0px"
			pageElement.leafletMap.getContainer().style.left = "0px"

			// wait for print process to finish
			// var node = document.getElementById(pageDom);
			var node = pageElement.leafletMap["_container"];

			let leafletMapScreenshot = await domtoimage
              .toJpeg(node, { quality: 1.0 })
              .then(function (dataUrl) {
                return dataUrl;
              })
              .catch(function (error) {
                  console.error('oops, something went wrong!', error);
              });

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
			// leafletMapImg.crossOrigin = "anonymous";
			leafletMapImg.width = canvas.width;
			leafletMapImg.height = canvas.height;
			let leafletMapImgDrawn = new Promise( (resolve, reject) => {
				leafletMapImg.onload() {
					ctx.drawImage(leafletMapImg, 0, 0, canvas.width, canvas.height);
					resolve();
				}
			})
			leafletMapImg.src = leafletMapScreenshot;
			await leafletMapImgDrawn

			let echartsImg = new Image();
			// echartsImg.crossOrigin = "anonymous";
			let echartsImgDrawn = new Promise( (resolve, reject) => {
				echartsImg.onload() {
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
			ctx.fillRect(canvas.width - mapLegendImg.width, canvas.height - mapLegendImg.height, mapLegendImg.width, mapLegendImg.height)
			ctx.drawImage(mapLegendImg, canvas.width - mapLegendImg.width, canvas.height - mapLegendImg.height);
			result = canvas.toDataURL();
			return result; */
		}

		pxToMilli(px) {
			// our preview is 830px wide
			// px / 830  gives us the percentage from the left edge, which can then be stretched to fit the A4 page
			// This is the short version of:
			// px / pxPerMillimeter * pxPerMillimeter * 297 / 830, where pxPerMillimeter = (deviceScreenPpi / 2.54) * 10
			// pxPerMillimeter cancels out there, so it doesn't matter.
			let result = parseInt(px, 10) / 830 * 297;
			result = Math.round(result * 100) / 100;
			return result;
		}

		pxToTwip(px) {
			let result = parseInt(px, 10) * 15; // 1px = 0.75pt = 15twip
			return result * this.pxPerMilli*297 / 830 // scale from 830px to A4 page
		}

		twipToEmus(value) {
			// see: https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/
			return value * 635;
		}

		// from: https://stackoverflow.com/a/46406124
		dataURItoBlob(dataURI) {
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

		calculateDimensions(dimensions, unit) {
			let result:any = {};
			if(unit === "px") {
				// also scale our 830px preview up to A4 here
				let scalefactor = this.pxPerMilli*297 / 830
				result.top = dimensions.top && parseInt(dimensions.top, 10) * scalefactor;
				result.bottom = dimensions.bottom && parseInt(dimensions.bottom, 10) * scalefactor;
				result.left = dimensions.left && parseInt(dimensions.left, 10) * scalefactor;
				result.right = dimensions.right && parseInt(dimensions.right, 10) * scalefactor;
				result.width = dimensions.width && parseInt(dimensions.width, 10) * scalefactor;
				result.height = dimensions.height && parseInt(dimensions.height, 10) * scalefactor;
			}
			if(unit === "milli") {
				result.top = dimensions.top && this.pxToMilli(dimensions.top);
				result.bottom = dimensions.bottom && this.pxToMilli(dimensions.bottom);
				result.left = dimensions.left && this.pxToMilli(dimensions.left);
				result.right = dimensions.right && this.pxToMilli(dimensions.right);
				result.width = dimensions.width && this.pxToMilli(dimensions.width);
				result.height = dimensions.height && this.pxToMilli(dimensions.height);
			}
			if(unit === "twip") {
				result.top = dimensions.top && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.top));
				result.bottom = dimensions.bottom && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.bottom));
				result.left = dimensions.left && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.left));
				result.right = dimensions.right && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.right));
				result.width = dimensions.width && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.width));
				result.height = dimensions.height && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.height));
			}
			if(unit === "emu") {
				result.top = dimensions.top && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.top)));
				result.bottom = dimensions.bottom && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.bottom)));
				result.left = dimensions.left && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.left)));
				result.right = dimensions.right && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.right)));
				result.width = dimensions.width && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.width)));
				result.height = dimensions.height && this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.height)));
			}
			return result;
		}


		calculateScreenDpi() {
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
