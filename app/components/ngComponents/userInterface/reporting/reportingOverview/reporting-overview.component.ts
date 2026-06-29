import { CommonModule } from '@angular/common';
import { ApplicationRef, Component, OnInit } from '@angular/core';
import * as echarts from 'echarts';
import * as docx from 'docx';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import * as d3 from 'd3';
import { LeafletScreenshotCacheHelperService } from 'services/leaflet-screenshot-cache-helper-service/leaflet-screenshot-cache-helper.service';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GenerateReportComponent } from '../generate-report/generate-report.component';
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { ImportData, ReportingService, WorkflowState } from 'services/reporting-service/reporting.service';

@Component({
  selector: 'app-reporting-overview',
  standalone: true,
  templateUrl: './reporting-overview.component.html',
  styleUrls: ['./reporting-overview.component.scss'],
  imports: [CommonModule, SafeHtmlPipe]
})
export class ReportingOverviewComponent implements OnInit {

  lastPageOfAddedSectionPrepared = false;
  deviceScreenDpi;

  currentSpatialUnit;
  pagePreparationSize;
  pagePreparationIndex;

  geoJsonForReachability_byFeatureName;
  featureLookupCache = new Map();

  MAX_PREVIEW_AREA_SPECIFIC_PAGES = 3;
  MAX_PREVIEW_DATATABLE_PAGES = 3;

  mercatorProjection_d3:any = d3.geoMercator();

  templateBlank:any;

  loadingData = false;
  loadingReport = false;
  echartsImgPixelRatio = 2;
  pxPerMilli;

  sections = []; // one section per page for now, since this is an easy way to create page breaks

  sortableConfig = {
    onEnd: function (e) {
      // nothing for now, config elements get reordered automatically
    }
  };

  workflowState = WorkflowState;

  constructor(
    private mapErrorNotificationService: MapErrorNotificationService,
    private cacheHelperService: CacheHelperServiceService,
    private indicatorStore: IndicatorMetadataStoreService,
    protected leafletScreenshotCacheHelperService: LeafletScreenshotCacheHelperService,
    private http: HttpClient,
    protected diagramHelperService: DiagramHelperServiceService,
    private modalService: NgbModal,
    protected reportingService: ReportingService,
    private envConfigService: EnvConfigService,
    private appRef: ApplicationRef
  ) {}

  ngOnInit(): void {

    this.deviceScreenDpi = this.calculateScreenDpi();
    this.pxPerMilli = this.deviceScreenDpi / 25.4 // /2.54 --> cm, /10 --> mm

    if(!this.reportingService.configImportExists())
      this.setupPages();
    else
      this.importConfig();
  }

  showReportLoading() {
    return (this.reportingService.currentWorkflowState==this.workflowState.formatSelect || this.reportingService.currentWorkflowState==this.workflowState.reportGeneration);
  }

  generateReport() {
    const reportingModalRef = this.modalService.open(GenerateReportComponent, {windowClass: 'modal-holder', centered: true});
    //reportingModalRef.componentInstance.data = this.data.reportingConfig;
   // this.onWorkflowSelect([4,this.data.reportingConfig]);
  }

  checkVisibility(pageElement, page){
    if(! page || !page.templateSection || !page.templateSection.pageConfig){
      return true;
    }

    switch(pageElement.type) {
      case "indicatorTitle-landscape":
      case "indicatorTitle-portrait": {
        return page.templateSection.pageConfig.headerFooterControl.showTitle;
      }

      case "communeLogo-landscape":
      case "communeLogo-portrait": {
        return page.templateSection.pageConfig.headerFooterControl.showLogo;
      }
      case "dataTimestamp-landscape":
      case "dataTimestamp-portrait": {
        return page.templateSection.pageConfig.headerFooterControl.showSubtitle;
      }
      case "dataTimeseries-landscape":
      case "dataTimeseries-portrait": {
        return page.templateSection.pageConfig.headerFooterControl.showSubtitle;
      }
      case "reachability-subtitle-landscape":
      case "reachability-subtitle-portrait": {
        return page.templateSection.pageConfig.headerFooterControl.showSubtitle;
      }
      case "footerHorizontalSpacer-landscape":
      case "footerHorizontalSpacer-portrait": {
        return page.templateSection.pageConfig.headerFooterControl.showFooterCreationInfo;
      }
      case "footerCreationInfo-landscape":
      case "footerCreationInfo-portrait": {  
        return page.templateSection.pageConfig.headerFooterControl.showFooterCreationInfo;
      } 
      case "pageNumber-landscape":
      case "pageNumber-portrait": {
        return page.templateSection.pageConfig.headerFooterControl.showPageNumber;
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
          return page.templateSection.pageConfig.sectionContentControl.showRankingChartPerArea;
        }
        return true;					
      }
      case "linechart": {
        if(page.type == 'area_specific'){
          return page.templateSection.pageConfig.sectionContentControl.showLineChartPerArea;
        }
        return true;
      }
      case "textInput": {
        return page.templateSection.pageConfig.sectionContentControl.showFreeText;
      }
      case "datatable": {
        return page.templateSection.pageConfig.sectionControl.showDatatable;
      }
      default:{
        return true;
      }
    }
  }

  removeCircularReferences(pages){			
		for (const page of pages) {
			for (const pageElement of page.pageElements) {
				if(pageElement.type === "map"){
					delete pageElement.leafletMap;
				}
			}
		}

		return pages;
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

	/* 	$on("reportingInitializeOverview", function(event, data) {
			// data is a nested array at this point [ [ { template object } ] ]
			this.initialize(data);
		}) */

		onPageTurnClicked(orientation, index) {
			let old_page = this.reportingService.workingTemplate.pages[index];
			let new_page = this.reportingService.workingTemplate.pages[index + 1];
			this.reportingService.workingTemplate.pages[index] = new_page;
			this.reportingService.workingTemplate.pages[index + 1] = old_page;


			setTimeout(async () => {
				// reinit map component

				// we must generate the new leaflet screenshot!
				for (const [elementIdx, mapElement] of new_page.pageElements.entries()) {
					if (mapElement.type !== 'map') continue;
					if (mapElement && mapElement.leafletMap) {
						let pageDom: any = document.querySelector('#reporting-overview-page-' + index);
						let pElementDom = pageDom.querySelector('#reporting-overview-page-' + index + '-map-' + elementIdx);
						let instance = echarts.getInstanceByDom(pElementDom);
						await this.initializeLeafletMap(new_page, mapElement, elementIdx, instance, this.currentSpatialUnit, true, true);
					}
				}

			}, 250)
		}

		onConfigureNewIndicatorClicked() {
      this.reportingService.changeWorkflowState(this.workflowState.indicatorConfig)
		}

		onConfigureNewPoiLayerClicked() {
      this.reportingService.changeWorkflowState(this.workflowState.indicatorConfig)
		}
	
		onBackToTemplateSelectionClicked() {
      this.reportingService.changeWorkflowState(this.workflowState.templateSelect);
		}

		reportingIndicatorConfigurationCompleted([indicator, template, templateBlank]) {

		/* 	this.loadingData = true;
      this.reportingService.workingTemplate = template;
      this.templateBlank = templateBlank;
			
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
			this.reportingService.workingTemplate.pages =  this.reportingService.workingTemplate.pages.filter( page => {
				if(page.hasOwnProperty("templateSection")) {
					return page.templateSection.hasOwnProperty("indicatorName");
				} else {
					return false;
				}
			});
			// append to array
			//this.reportingService.workingTemplate.pages.push(...template.pages);

      let exists = this.reportingService.config.templateSections.filter(e => e.indicatorId==indicator.indicatorId);
      if(exists.length==0)
			  this.reportingService.config.templateSections.push(templateSection);
				
			// setup pages after dom exists
			// at this point we still have all the echarts maps registered
			this.setupNewPages(this.reportingService.config.templateSections.at(-1)); */
		}

		reportingPoiLayerConfigurationCompleted([poiLayer, indicator, template, templateBlank]) {

      this.loadingData = true;
      //this.reportingService.workingTemplate = template;
      this.templateBlank = templateBlank;

      // add indicator to 'added indicators'
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
      this.reportingService.workingTemplate.pages = this.reportingService.workingTemplate.pages.filter( page => {
        if(page.hasOwnProperty("templateSection")) {
          return page.templateSection.hasOwnProperty("poiLayerName");
        } else {
          return false;
        }
      });
      // append to array
      //this.reportingService.workingTemplate.pages.push(...template.pages);
      
      /* let exists = this.reportingService.config.templateSections.filter(e => e.poiLayerName==poiLayer.datasetName);
      if(exists.length==0)
        this.reportingService.config.templateSections.push(templateSection);
        
      // setup pages after dom exists
      // at this point we still have all the echarts maps registered
      this.setupNewPages(this.reportingService.config.templateSections.at(-1)); */
		}
		
		reorderTemplateSections(newVal, oldVal) {
			
			if(newVal.length < oldVal.length) { // removed
				// find removed section
				let difference = oldVal
					.filter(x => !newVal.includes(x))
					.concat(newVal.filter(x => !oldVal.includes(x)));

				let removedSection = difference[0];
				// remove all pages for that section
				this.reportingService.workingTemplate.pages = this.reportingService.workingTemplate.pages.filter( page => {
					if(!page.hasOwnProperty("templateSection")) return true; // for placeholder
					
					return page.templateSection.indicatorId !== removedSection.indicatorId ||
						page.templateSection.spatialUnitId !== removedSection.spatialUnitId ||
						page.templateSection.poiLayerName !== removedSection.poiLayerName
				});
			}
			if(newVal.length === oldVal.length) { // order changed
				// sort pages according to newVal
				let sorted:any = [];
				for(let section of newVal) {
					for(let page of this.reportingService.workingTemplate.pages) {
						if(page.templateSection.indicatorId === section.indicatorId &&
							page.templateSection.spatialUnitId === section.spatialUnitId &&
							page.templateSection.poiLayerName === section.poiLayerName) {

							sorted.push(page);
						}
					}
				}
				this.reportingService.workingTemplate.pages = sorted;
			}
		}

    getNumberOfMapElements(config){
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
    }

    importConfig() {

      try {

        let config = this.reportingService.importConfig;

        if(config) {
          let numberOfMapElements = this.getNumberOfMapElements(config);		
          // reset leaflet screenshot helper service according to new  number of selected areas
          //this.leafletScreenshotCacheHelperService.resetCounter(numberOfMapElements, false);	

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

          //this.reportingService.workingTemplate = config.template;
          this.reportingService.workingTemplate.pages = config.pages;
          this.reportingService.setTemplateSectionsFromConfig(config);

          // register echarts maps
          for(let section of this.reportingService.getSectionsAsArray()) {
            for(let mapName of section.echartsRegisteredMapNames) {
              if(this.reportingService.workingTemplate.name.includes("reachability")) {
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
          for(let page of this.reportingService.workingTemplate.pages) {
            for(let pageElement of page.pageElements) {
              if(pageElement.type === "map" && pageElement.hasOwnProperty("echartsMaps")) {
                for(let map of pageElement.echartsMaps) {
                  echarts.registerMap(map.name, map.geoJson)
                }
              }
            }
          }
        

          for(let section of this.reportingService.getSectionsAsArray()) {
            this.setupPages();
          }
        }
			} catch (error:any) {
				console.error(error);
				//this.mapErrorNotificationService.displayMapApplicationError(error.message);
			}
    } 

    // new to cover added sections
    async setupPages() {

      this.loadingData = true;

      this.reportingService.templateSections.indicators.forEach(async indicator => {
        await this.setupIndicatorPages(indicator);
      });

      this.reportingService.templateSections.georesources.forEach(async georesource => {
        await this.setupPagesForReachability(georesource);
      });

      this.loadingData = false;
		}

    getFeatureLookupKey(templateSection) {
      return templateSection.indicatorId
        ? (templateSection.indicatorId + '_' + templateSection.spatialUnitName)
        : (templateSection.poiLayerName + '_' + templateSection.spatialUnitName);
    }

    isPageInPreview(page, index) {
      if (page.type !== 'area_specific' && page.type !== 'datatable') {
        return true;
      }
      if (page.type === 'area_specific') {
        let areaSpecificPages = this.reportingService.workingTemplate.pages.filter((p: any) => p.type === 'area_specific');
        let areaIdx = areaSpecificPages.indexOf(page);
        return areaIdx < this.MAX_PREVIEW_AREA_SPECIFIC_PAGES;
      }
      if (page.type === 'datatable') {
        let datatablePages = this.reportingService.workingTemplate.pages.filter((p: any) => p.type === 'datatable');
        let datatableIdx = datatablePages.indexOf(page);
        return datatableIdx < this.MAX_PREVIEW_DATATABLE_PAGES;
      }
      return true;
    }

    isLastPreviewPage(page: any): boolean {
      if (page.type === 'area_specific') {
        const areaPages = this.reportingService.workingTemplate.pages.filter((p: any) => p.type === 'area_specific');
        return areaPages.indexOf(page) === this.MAX_PREVIEW_AREA_SPECIFIC_PAGES - 1;
      }
      if (page.type === 'datatable') {
        const dtPages = this.reportingService.workingTemplate.pages.filter((p: any) => p.type === 'datatable');
        return dtPages.indexOf(page) === this.MAX_PREVIEW_DATATABLE_PAGES - 1;
      }
      return false;
    }

    countBackgroundPages(page: any): number {
      if (!this.reportingService.workingTemplate || !page) return 0;
      if (page.type === 'area_specific') {
        const areaPages = this.reportingService.workingTemplate.pages.filter((p: any) => p.type === 'area_specific');
        return Math.max(0, areaPages.length - this.MAX_PREVIEW_AREA_SPECIFIC_PAGES);
      }
      if (page.type === 'datatable') {
        const dtPages = this.reportingService.workingTemplate.pages.filter((p: any) => p.type === 'datatable');
        return Math.max(0, dtPages.length - this.MAX_PREVIEW_DATATABLE_PAGES);
      }
      return 0;
    }

    async preparePage(idx, page, indicatorId, poiLayerName, spatialUnit, geoJSON) {
      let isPreview = this.isPageInPreview(page, idx);
      page.indexInConfigPages = idx;

      if (!page.generatedData) {
        page.generatedData = {
          echarts: {},
          mapImage: undefined,
          tableData: undefined,
          isComplete: false
        };
      }

      // route through background processor for stable map capture
      this.reportingService.reportingBackgroundState.pageToProcess_overview = page;
      this.appRef.tick(); // synchronously run CD so the background page elements are in the DOM

      let pageDom = document.getElementById('reporting-background-page');
      if (!pageDom) {
        console.error('Could not find background DOM for page ' + idx);
        return;
      }

      for (let [elementIdx, pageElement] of page.pageElements.entries()) {
        let pElementDom: any = pageDom.querySelector('#reporting-background-page-' + pageElement.type + '-' + elementIdx);

        if (!pElementDom) {
          continue;
        }

        if (pageElement.type === 'linechart' && pageElement.showBoxplots) {
          let xAxisLabels = pageElement.echartsOptions.xAxis[0].data;
          pageElement.echartsOptions.dataset[1].transform.config = {
            itemNameFormatter: function (params) {
              return xAxisLabels[params.value];
            }
          };
        }

        if (pageElement.type === 'map' || pageElement.type === 'barchart' || pageElement.type === 'linechart') {
          if (!pageElement.echartsOptions || Object.keys(pageElement.echartsOptions).length === 0) {
            console.warn('No echarts options found for page element', pageElement, 'on page', idx);
            continue;
          }

          let instance = echarts.init(pElementDom);

          if (pageElement.type === 'map') {
            for (let series of pageElement.echartsOptions.series) {
              series.left = 0;
              series.top = 0;
              series.right = 0;
              series.bottom = 0;
              series.projection = {
                project: (point) => this.mercatorProjection_d3(point),
                unproject: (point) => this.mercatorProjection_d3.invert(point)
              };
            }
            if (pageElement.echartsOptions.geo) {
              pageElement.echartsOptions.geo[0].top = 0;
              pageElement.echartsOptions.geo[0].left = 0;
              pageElement.echartsOptions.geo[0].right = 0;
              pageElement.echartsOptions.geo[0].bottom = 0;
              pageElement.echartsOptions.geo[0].projection = {
                project: (point) => this.mercatorProjection_d3(point),
                unproject: (point) => this.mercatorProjection_d3.invert(point)
              };
            }

            if (page.area && page.area.length) {
              this.filterMapByArea(instance, pageElement.echartsOptions, page.area, geoJSON.features);
            } else {
              pageElement.echartsOptions.labelLayout = function(feature) {
                let names = page.templateSection.absoluteLabelPositions.map(el => el.name);
                let text = feature.text.split('\n')[0];
                if (names.includes(text)) {
                  let i = names.indexOf(text);
                  return {
                    x: page.templateSection.absoluteLabelPositions[i].x,
                    y: page.templateSection.absoluteLabelPositions[i].y,
                    draggable: false
                  };
                } else {
                  return {
                    moveOverlap: 'shiftY',
                    x: feature.rect.x + feature.rect.width / 2,
                    draggable: false
                  };
                }
              };
            }
          }

          pageElement.echartsOptions.animation = false;
          instance.setOption(pageElement.echartsOptions);

          if (pageElement.type === 'map') {
            page.generatedData.mapImage = await this.initializeLeafletMap(page, pageElement, elementIdx, instance, spatialUnit, false, false);

            if (isPreview) {
              let previewPElementDom: any = document.querySelector(
                '#reporting-overview-page-' + idx + '-' + pageElement.type + '-' + elementIdx
              );
              if (previewPElementDom && page.generatedData.mapImage) {
                previewPElementDom.style.backgroundImage = 'url(' + page.generatedData.mapImage + ')';
                previewPElementDom.style.backgroundSize = '100% 100%';
                previewPElementDom.style.backgroundRepeat = 'no-repeat';
              }
            }
          } else {
            await new Promise(resolve => {
              let timeout = setTimeout(resolve, 500);
              instance.on('finished', () => {
                clearTimeout(timeout);
                resolve(null);
              });
            });

            page.generatedData.echarts[pageElement.type + (pageElement.showPercentageChangeToPrevTimestamp ? '_perc' : '')] =
              instance.getDataURL({ pixelRatio: this.echartsImgPixelRatio });

            if (isPreview) {
              let previewPElementDom: any = document.querySelector(
                '#reporting-overview-page-' + idx + '-' + pageElement.type + '-' + elementIdx
              );
              if (previewPElementDom) {
                previewPElementDom.innerHTML = '';
                while (pElementDom.firstChild) {
                  previewPElementDom.appendChild(pElementDom.firstChild);
                }
              }
            }

            if (!isPreview) {
              instance.dispose();
            }
          }
        }

        if (pageElement.type === 'mapLegend') {
          pageElement.isPlaceholder = false;
          if (isPreview) {
            let previewPageDom = document.getElementById('reporting-overview-page-' + idx);
            if (previewPageDom) {
              let legendNode: any = previewPageDom.querySelector('.type-mapLegend');
              if (legendNode) legendNode.style.display = 'none';
            }
          }
        }

        if (pageElement.type === 'datatable') {
          let targetDom = pElementDom;
          if (isPreview) {
            targetDom = document.querySelector('#reporting-overview-page-' + idx + '-' + pageElement.type + '-' + elementIdx);
          }
          this.createDatatablePage(targetDom, pageElement);
          page.generatedData.tableData = pageElement.tableData;
        }
      }
    }

    filterMapByArea(echartsInstance, echartsInstanceOptions, areaName, allFeatures) {
      let mapName = echartsInstanceOptions.series[0].map;
      let features = allFeatures.filter(el => el.properties.name === areaName);
      echarts.registerMap(mapName, { type: 'FeatureCollection', features: features } as any);
      echartsInstance.setOption(echartsInstanceOptions);
    }

    async setupIndicatorPages(indicator) {

      let indicatorId = indicator.indicatorId;
      let spatialUnit, featureCollection, features, geoJSON;

      spatialUnit = await this.getSpatialUnitByIndicator(indicatorId, indicator.spatialUnitName);
      this.currentSpatialUnit = spatialUnit;

      featureCollection = await this.queryFeatures(indicatorId, spatialUnit);
      features = this.createLowerCaseNameProperty(featureCollection.features);
      this.geoJsonForReachability_byFeatureName = new Map();

      for (let feature of features) {
        this.geoJsonForReachability_byFeatureName.set(feature.properties.NAME, feature);
      }
      this.geoJsonForReachability_byFeatureName.set('undefined', features);
      geoJSON = { features: features };

      let cacheKey = this.getFeatureLookupKey(indicator);
      this.featureLookupCache.set(cacheKey, this.geoJsonForReachability_byFeatureName);

      this.lastPageOfAddedSectionPrepared = false;
      this.pagePreparationIndex = 0;
      this.pagePreparationSize = this.reportingService.workingTemplate.pages.length;

      let logProgressIndexSeparator = Math.round(this.pagePreparationSize / 100 * 10);

      await new Promise(resolve => setTimeout(resolve, 150));

      for (let [idx, page] of this.reportingService.workingTemplate.pages.entries()) {

        if (page.templateSection.indicatorId !== indicatorId) {
          continue;
        }

        let isPreview = this.isPageInPreview(page, idx);
        if (page.generatedData && page.generatedData.isComplete && !isPreview) {
          continue;
        }

        await this.preparePage(idx, page, indicatorId, undefined, spatialUnit, geoJSON);

        this.pagePreparationIndex = idx;
      }

      this.lastPageOfAddedSectionPrepared = true;
      this.loadingData = false;
    }

    async setupPagesForReachability(templateSection) {
      let poiLayerName = templateSection.poiLayerName;
      let spatialUnit, featureCollection, features, geoJSON, indicatorId;
      if (templateSection.indicatorId) {
        indicatorId = templateSection.indicatorId;
      }

      if (indicatorId) {
        spatialUnit = await this.getSpatialUnitByIndicator(indicatorId, templateSection.spatialUnitName);
        featureCollection = await this.queryFeatures(indicatorId, spatialUnit);
      } else {
        spatialUnit = await this.getSpatialUnitByName(templateSection.spatialUnitName);
        featureCollection = await this.queryFeatures(undefined, spatialUnit);
      }

      features = this.createLowerCaseNameProperty(featureCollection.features);
      geoJSON = { features: features };

      this.geoJsonForReachability_byFeatureName = new Map();
      for (let feature of features) {
        this.geoJsonForReachability_byFeatureName.set(feature.properties.NAME, feature);
      }
      this.geoJsonForReachability_byFeatureName.set('undefined', features);

      let cacheKey = this.getFeatureLookupKey(templateSection);
      this.featureLookupCache.set(cacheKey, this.geoJsonForReachability_byFeatureName);

      this.lastPageOfAddedSectionPrepared = false;
      this.pagePreparationIndex = 0;
      this.pagePreparationSize = this.reportingService.workingTemplate.pages.length;

      await new Promise(resolve => setTimeout(resolve, 150));

      for (let [idx, page] of this.reportingService.workingTemplate.pages.entries()) {

        if (page.templateSection.poiLayerName !== poiLayerName) {
          continue;
        }

        let isPreview = this.isPageInPreview(page, idx);
        if (page.generatedData && page.generatedData.isComplete && !isPreview) {
          continue;
        }

        await this.preparePage(idx, page, undefined, poiLayerName, spatialUnit, geoJSON);

        this.pagePreparationIndex = idx;
      }

      this.lastPageOfAddedSectionPrepared = true;
      this.loadingData = false;
    }

    /* $rootScope.$on("screenshotsForCurrentSpatialUnitUpdate", function(event){
			// update ui to enable button
			setTimeout(function() {
				this.$digest();
			})			
		});

 */

		async initializeLeafletMap(page, pageElement, elementIdx: number, echartsMap, spatialUnit, forceScreenshot, isVisible) {
			try {
					let pageIdx = this.reportingService.workingTemplate.pages.indexOf(page);

					// store spatial unit and feature id before cache check
					page.spatialUnitId = spatialUnit.spatialUnitId;
					if (page.area) {
						let cacheKey = this.getFeatureLookupKey(page.templateSection);
						let featureMap = this.featureLookupCache.get(cacheKey);
						if (!featureMap) featureMap = this.geoJsonForReachability_byFeatureName;
						let feature = featureMap.get(page.area);
						if (feature) {
							page.spatialUnitFeatureId = feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME];
						}
					}

					// check cache before creating leaflet map
					let cachedScreenshot = this.leafletScreenshotCacheHelperService.getResourceFromCache(
						pageElement.selectedBaseMap.layerConfig.name, page.spatialUnitId,
						page.spatialUnitFeatureId, page.orientation, this.reportingService.workingTemplate.name
					);
					if (cachedScreenshot) {
						return await this.leafletScreenshotCacheHelperService.checkForScreenshot(
							pageElement.selectedBaseMap.layerConfig.name, spatialUnit.spatialUnitId,
							page.spatialUnitFeatureId, page.orientation, null, this.reportingService.workingTemplate.name
						);
					}

					let id = 'reporting-background-leaflet-map-container-' + elementIdx;
					let pageDom: any = document.getElementById('reporting-background-page');
					let pageElementDomId = 'reporting-background-page-map-' + elementIdx;
					let pageElementDom: any = document.getElementById(pageElementDomId);
					let oldMapNode = document.getElementById(id);
					if (oldMapNode) {
						oldMapNode.remove();
					}
					let div: any = document.createElement('div');
					div.id = id;
					div.style.position = 'absolute';
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
						zoomSnap: 0,
						fadeAnimation: false,
						zoomAnimation: false,
					});

					// manually create attribution overlay with controlled z-index
					let prevAttributionDiv = pageDom.querySelector('.map-attribution');
					if (prevAttributionDiv) prevAttributionDiv.remove();
					let attrDiv: any = document.createElement('div');
					attrDiv.classList.add('map-attribution');
					attrDiv.style.position = 'absolute';
					attrDiv.style.bottom = 0;
					attrDiv.style.left = 0;
					attrDiv.style.zIndex = 800;
					let attrImg = await this.diagramHelperService.createReportingReachabilityMapAttribution();
					attrDiv.appendChild(attrImg);
					if (pageElementDom) pageElementDom.appendChild(attrDiv);

					if (this.reportingService.workingTemplate.name.includes('reachability')) {
						let prevLegendDiv = pageDom.querySelector('.map-legend');
						if (prevLegendDiv) prevLegendDiv.remove();
						let legendDiv: any = document.createElement('div');
						legendDiv.classList.add('map-legend');
						legendDiv.style.position = 'absolute';
						legendDiv.style.bottom = 0;
						legendDiv.style.right = 0;
						legendDiv.style.zIndex = 800;
						let isochronesRangeType = page.templateSection.isochronesRangeType;
						let isochronesRangeUnits = page.templateSection.isochronesRangeUnits;
						let legendImg = await this.diagramHelperService.createReportingReachabilityMapLegend(echartsOptions, spatialUnit, isochronesRangeType, isochronesRangeUnits);
						page.templateSection.legendImg = legendImg;
						legendDiv.appendChild(legendImg);
						if (pageElementDom) pageElementDom.appendChild(legendDiv);

						if (!page.spatialUnitFeatureId) {
							page.spatialUnitFeatureId = 'reachability-page-' + pageIdx;
						}
					}

					let boundingCoords = echartsOptions.series[0].boundingCoords;
					let westLon = boundingCoords[0][0];
					let southLat = boundingCoords[1][1];
					let eastLon = boundingCoords[1][0];
					let northLat = boundingCoords[0][1];

					leafletMap.fitBounds([[southLat, westLon], [northLat, eastLon]]);
					let bounds = leafletMap.getBounds();

					if (!(bounds.getWest() == bounds.getEast() && bounds.getNorth() == bounds.getSouth())) {
						boundingCoords = [[bounds.getWest(), bounds.getNorth()], [bounds.getEast(), bounds.getSouth()]];
					}

					for (let series of echartsOptions.series) {
						series.left = 0;
						series.top = 0;
						series.right = 0;
						series.bottom = 0;
						series.boundingCoords = boundingCoords;
						series.projection = {
							project: (point) => this.mercatorProjection_d3(point),
							unproject: (point) => this.mercatorProjection_d3.invert(point)
						};
					}

					echartsOptions.geo[0].top = 0;
					echartsOptions.geo[0].left = 0;
					echartsOptions.geo[0].right = 0;
					echartsOptions.geo[0].bottom = 0;
					echartsOptions.geo[0].projection = {
						project: (point) => this.mercatorProjection_d3(point),
						unproject: (point) => this.mercatorProjection_d3.invert(point)
					};
					echartsOptions.geo[0].boundingCoords = boundingCoords;

					echartsMap.setOption(echartsOptions, { notMerge: false });

					let leafletLayer: any;
					if (pageElement.selectedBaseMap.layerConfig.layerType === 'TILE_LAYER_GRAYSCALE') {
						leafletLayer = new L.tileLayer(pageElement.selectedBaseMap.layerConfig.url);
					} else if (pageElement.selectedBaseMap.layerConfig.layerType === 'TILE_LAYER') {
						leafletLayer = new L.tileLayer(pageElement.selectedBaseMap.layerConfig.url);
					} else if (pageElement.selectedBaseMap.layerConfig.layerType === 'WMS') {
						leafletLayer = new L.tileLayer.wms(pageElement.selectedBaseMap.layerConfig.url, { layers: pageElement.selectedBaseMap.layerConfig.layerName_WMS, format: 'image/jpeg' });
					} else {
						leafletLayer = new L.tileLayer('');
					}

					let screenshotPromise = new Promise<string>((resolve) => {
						leafletLayer.on('load', async () => {
							await new Promise(r => setTimeout(r, 500));
							let dataUrl = await this.leafletScreenshotCacheHelperService.checkForScreenshot(
								pageElement.selectedBaseMap.layerConfig.name, spatialUnit.spatialUnitId,
								page.spatialUnitFeatureId, page.orientation, leafletMap['_container'],
								this.reportingService.workingTemplate.name
							);
							resolve(dataUrl);
						});
					});

					leafletMap.invalidateSize(false);
					leafletLayer.addTo(leafletMap);

					pageElement.leafletMap = leafletMap;
					pageElement.leafletBbox = bounds;
					pageElement.echartsOptions = echartsOptions;

					let dataUrl = await screenshotPromise;

					if (!dataUrl || (!dataUrl.startsWith('data:image') && !dataUrl.startsWith('blob:')) || dataUrl.length < 10) {
						console.warn('Invalid leaflet map screenshot generated for page ' + pageIdx);
						if (!isVisible) {
							leafletMap.remove();
							div.remove();
						}
						return undefined;
					}

					if (!isVisible) {
						leafletMap.remove();
						div.remove();
					}

					return dataUrl;

				} catch (error) {
					console.error(error);
					return undefined;
				}
		}

    //async
		getSpatialUnitByName(spatialUnitName): Promise<any> {
			let url;
			url = this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/spatial-units"
			// send request

      return new Promise(resolve => {
        this.http.get(url).subscribe({
          next: (response:any) => {
            let spatialUnit = response.filter( el => {
              return el.spatialUnitLevel === spatialUnitName;
            })

            if(spatialUnit.length === 1)
              resolve(spatialUnit[0]);
          },
          error: error => {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            this.loadingData = false;
            this.mapErrorNotificationService.displayMapApplicationError(error);
            console.error(error);
          }
        });
      });
		}

    // async
		getSpatialUnitByIndicator(indicatorId, spatialUnitName): Promise<any> {
			let url;
			url = this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() + "/indicators/" + indicatorId;

      return new Promise(resolve => {
        this.http.get(url).subscribe({
          next: (response:any) => {
            let spatialUnit = response.applicableSpatialUnits.filter( el => {
              return el.spatialUnitName === spatialUnitName;
            })
            if(spatialUnit.length === 1) 
              resolve(spatialUnit[0]);
          },
          error: error => {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            this.loadingData = false;
            this.mapErrorNotificationService.displayMapApplicationError(error);
            console.error(error);
          }
        });
      });
      
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

		showThisPage(page) {

      /* if(page.hidden){
				return false;
			} */

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
				if (this.showThisPage(this.reportingService.workingTemplate.pages[i])) {
					pageNumber ++;
				}
			}
			return pageNumber;
		}

		filterPagesToShow() {
			let pagesToShow:any[] = [];
			let skipNextPage = false;
			for (let i = 0; i < this.reportingService.workingTemplate.pages.length; i ++) {
				let page = this.reportingService.workingTemplate.pages[i];
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

			let page = this.reportingService.workingTemplate.pages[pageID];
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

				this.reportingService.workingTemplate.pages = this.removeCircularReferences(this.reportingService.workingTemplate.pages);
				let temp = JSON.stringify( this.reportingService.workingTemplate.pages, function(key, value) {
					// Leaflet map contains cyclic object references so we have to remove it.
					// We have to initialize the map again on import based on the stored boundingbox
					if(key === "leafletMap") {
						return undefined;
					} else {
						return value;
					}
				})

				jsonToExport.pages = JSON.parse( temp )
				jsonToExport.template = JSON.parse(JSON.stringify( this.reportingService.workingTemplate ));
				jsonToExport.templateSections = this.reportingService.getSectionsAsArray();

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
					if(this.reportingService.workingTemplate.name.includes("reachability")) {
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

				let jsonString = "data:text/json;charset=utf-8," + encodeURIComponent( JSON.stringify(jsonToExport) );
				// to download json, a DOM element is created, clicked and removed
				let downloadAnchorNode = document.createElement('a');
				downloadAnchorNode.setAttribute("href", jsonString);
				downloadAnchorNode.setAttribute("download", this.getCurrentDateAndTime() + "_KomMonitor-Reporting-Konfiguration.json");
				document.body.appendChild(downloadAnchorNode); // required for firefox
				downloadAnchorNode.click();
				downloadAnchorNode.remove();
			} catch (error:any) {
				this.mapErrorNotificationService.displayMapApplicationError(error.message);
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
			for(let indicator of this.indicatorStore.availableIndicators) {
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
		queryFeatures(indicatorId, spatialUnit): Promise<any> {
			// build request
			// query different endpoints depending on if we have an indicator or not
			let url;
			if(!indicatorId) {
				let date = spatialUnit.metadata.lastUpdate.split("-")
				let year = date[0]
				let month = date[1]
				let day = date[2]
				url = this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
					"/spatial-units/" + spatialUnit.spatialUnitId + "/" + year + "/" + month + "/" + day; 
			} else {
				url = this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
					"/indicators/" + indicatorId + "/" + spatialUnit.spatialUnitId;
			}

      return new Promise(resolve => {
        // send request
        this.loadingData = true;

        this.http.get(url).subscribe({
          next: response => {
            this.loadingData = false;
            resolve(response);
          },
          error: error => {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            this.loadingData = false;
            this.mapErrorNotificationService.displayMapApplicationError(error);
            console.error(error);
          }
        });
      });
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

    pxToInch(px) {
			// our preview is 830px wide
			// px / 830  gives us the percentage from the left edge, which can then be stretched to fit the A4 page
			// This is the short version of:
			// px / pxPerMillimeter * pxPerMillimeter * 297 / 830, where pxPerMillimeter = (deviceScreenPpi / 2.54) * 10
			// pxPerMillimeter cancels out there, so it doesn't matter.
			let result = parseInt(px, 10);
			result = Math.round((result/this.deviceScreenDpi) * 100) / 100;
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
