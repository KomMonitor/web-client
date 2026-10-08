import { CommonModule } from '@angular/common';
import { ApplicationRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import * as echarts from 'echarts';
import * as docx from 'docx';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import * as d3 from 'd3';
import { LeafletScreenshotCacheHelperService } from 'services/leaflet-screenshot-cache-helper-service/leaflet-screenshot-cache-helper.service';
import { HttpClient } from '@angular/common/http';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GenerateReportComponent } from '../generate-report/generate-report.component';
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import {
  ImportData,
  ReportingService,
  WorkflowState,
} from 'services/reporting-service/reporting.service';
import { ReportPagePreparationService } from 'services/report-page-preparation-service/report-page-preparation.service';
import {
  checkVisibility,
  countBackgroundPages,
  createDatatablePage,
  createLowerCaseNameProperty,
  isLastPreviewPage,
  isPageInPreview,
} from 'components/ngComponents/userInterface/reporting/report-preview.utils';
import { ReportGenerationContext } from 'components/ngComponents/userInterface/reporting/report-generation-context.model';

@Component({
  selector: 'app-reporting-overview',
  standalone: true,
  templateUrl: './reporting-overview.component.html',
  styleUrls: ['./reporting-overview.component.scss'],
  imports: [CommonModule, SafeHtmlPipe, DragDropModule],
})
export class ReportingOverviewComponent implements OnInit {
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  protected leafletScreenshotCacheHelperService = inject(LeafletScreenshotCacheHelperService);
  private http = inject(HttpClient);
  protected diagramHelperService = inject(DiagramHelperServiceService);
  private modalService = inject(NgbModal);
  protected reportingService = inject(ReportingService);
  private appRef = inject(ApplicationRef);
  private broadcastService = inject(BroadcastService);
  private destroyRef = inject(DestroyRef);
  private reportPagePreparationService = inject(ReportPagePreparationService);

  lastPageOfAddedSectionPrepared = false;
  deviceScreenDpi;

  currentSpatialUnit;
  pagePreparationSize;
  pagePreparationIndex;

  geoJsonForReachability_byFeatureName;
  featureLookupCache = new Map();

  MAX_PREVIEW_AREA_SPECIFIC_PAGES = 3;
  MAX_PREVIEW_DATATABLE_PAGES = 3;

  mercatorProjection_d3: any = d3.geoMercator();

  loadingData = false;
  loadingReport = false;
  echartsImgPixelRatio = 2;
  pxPerMilli;

  workflowState = WorkflowState;

  ngOnInit(): void {
    this.deviceScreenDpi = this.calculateScreenDpi();
    this.pxPerMilli = this.deviceScreenDpi / 25.4; // /2.54 --> cm, /10 --> mm

    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((broadcastMsg) => {
        if (broadcastMsg.msg === BroadcastMessage.AbortReportGeneration) {
          this.onAbortPreparationClicked();
        }
      });

    if (!this.reportingService.configImportExists()) this.setupPages();
    else this.importConfig();
  }

  getPagePreparationPercent(): number {
    if (!this.pagePreparationSize) return 0;
    return Math.min(100, Math.max(0, (this.pagePreparationIndex / this.pagePreparationSize) * 100));
  }

  onAbortPreparationClicked() {
    this.reportingService.abortPreparation = true;
    this.reportingService.reportGenerationInProgress = false;
    this.pagePreparationIndex = 0;
    this.pagePreparationSize = 0;
    this.leafletScreenshotCacheHelperService.screenshotsForCurrentSpatialUnitUpdate = true;
  }

  showReportLoading() {
    return (
      this.reportingService.currentWorkflowState == this.workflowState.formatSelect ||
      this.reportingService.currentWorkflowState == this.workflowState.reportGeneration
    );
  }

  generateReport() {
    const reportingModalRef = this.modalService.open(GenerateReportComponent, {
      windowClass: 'modal-holder',
      centered: true,
    });
    //reportingModalRef.componentInstance.data = this.data.reportingConfig;
    // this.onWorkflowSelect([4,this.data.reportingConfig]);
  }

  checkVisibility(pageElement, page) {
    return checkVisibility(pageElement, page, page?.templateSection?.pageConfig);
  }

  removeCircularReferences(pages) {
    for (const page of pages) {
      for (const pageElement of page.pageElements) {
        if (pageElement.type === 'map') {
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
    const old_page = this.reportingService.workingTemplate.pages[index];
    const new_page = this.reportingService.workingTemplate.pages[index + 1];
    this.reportingService.workingTemplate.pages[index] = new_page;
    this.reportingService.workingTemplate.pages[index + 1] = old_page;

    setTimeout(async () => {
      // reinit map component

      // we must generate the new leaflet screenshot!
      for (const [elementIdx, mapElement] of new_page.pageElements.entries()) {
        if (mapElement.type !== 'map') continue;
        if (mapElement && mapElement.leafletMap) {
          const pageDom: any = document.querySelector('#reporting-overview-page-' + index);
          const pElementDom = pageDom.querySelector(
            '#reporting-overview-page-' + index + '-map-' + elementIdx
          );
          const instance = echarts.getInstanceByDom(pElementDom);
          await this.reportPagePreparationService.prepareLeafletMapForOverview(
            new_page,
            mapElement,
            elementIdx,
            instance,
            this.currentSpatialUnit,
            true,
            true,
            true,
            this.buildGenerationContext()
          );
        }
      }
    }, 250);
  }

  onConfigureNewIndicatorClicked() {
    this.reportingService.changeWorkflowState(this.workflowState.indicatorConfig);
  }

  onConfigureNewPoiLayerClicked() {
    this.reportingService.changeWorkflowState(this.workflowState.indicatorConfig);
  }

  onBackToTemplateSelectionClicked() {
    this.reportingService.changeWorkflowState(this.workflowState.templateSelect);
  }

  reorderTemplateSections(newVal, oldVal) {
    if (newVal.length < oldVal.length) {
      // removed
      // find removed section
      const difference = oldVal
        .filter((x) => !newVal.includes(x))
        .concat(newVal.filter((x) => !oldVal.includes(x)));

      const removedSection = difference[0];
      // remove all pages for that section
      this.reportingService.workingTemplate.pages =
        this.reportingService.workingTemplate.pages.filter((page) => {
          if (!Object.prototype.hasOwnProperty.call(page, 'templateSection')) return true; // for placeholder

          return (
            page.templateSection.indicatorId !== removedSection.indicatorId ||
            page.templateSection.spatialUnitId !== removedSection.spatialUnitId ||
            page.templateSection.poiLayerName !== removedSection.poiLayerName
          );
        });
    }
    if (newVal.length === oldVal.length) {
      // order changed
      // sort pages according to newVal
      const sorted: any = [];
      for (const section of newVal) {
        for (const page of this.reportingService.workingTemplate.pages) {
          if (
            page.templateSection.indicatorId === section.indicatorId &&
            page.templateSection.spatialUnitId === section.spatialUnitId &&
            page.templateSection.poiLayerName === section.poiLayerName
          ) {
            sorted.push(page);
          }
        }
      }
      this.reportingService.workingTemplate.pages = sorted;
    }
  }

  // only one of indicators/georesources is ever populated for a given template (see
  // onAddBtnClicked in indicator-add.component.ts), but concatenating both keeps this correct
  // either way and matches the order the two @for blocks render in the sidebar list
  onSectionListDropped(event: CdkDragDrop<any[]>) {
    const indicators = this.reportingService.templateSections.indicators;
    const georesources = this.reportingService.templateSections.georesources;
    const oldOrder = [...indicators, ...georesources];
    const newOrder = [...oldOrder];
    moveItemInArray(newOrder, event.previousIndex, event.currentIndex);

    this.reorderTemplateSections(newOrder, oldOrder);

    this.reportingService.setValue({
      ...this.reportingService.currentValue,
      sections: {
        indicators: newOrder.filter((section) => indicators.includes(section)),
        georesources: newOrder.filter((section) => georesources.includes(section)),
      },
    });
  }

  getNumberOfMapElements(config) {
    const firstSection = config.templateSections[0];

    if (firstSection) {
      let numberOfMapItems = firstSection.echartsRegisteredMapNames.length;
      // -1 because city overview map might occur twice with separate names
      if (!config.template.name.includes('reachability')) {
        numberOfMapItems--;
      }

      return numberOfMapItems;
    } else {
      return 0;
    }
  }

  async importConfig() {
    try {
      const config = this.reportingService.importConfig;

      if (config) {
        const numberOfMapElements = this.getNumberOfMapElements(config);
        // reset leaflet screenshot helper service according to new  number of selected areas
        //this.leafletScreenshotCacheHelperService.resetCounter(numberOfMapElements, false);

        // restore commune logo for every page, starting at the second
        let communeLogoSrc = ''; // base64 string
        for (const [idx, page] of config.pages.entries()) {
          for (const pageElement of page.pageElements) {
            if (pageElement.type.includes('communeLogo-') && idx === 0) {
              if (pageElement.src && pageElement.src.length) {
                communeLogoSrc = pageElement.src;
              } else {
                break; // no logo was exported
              }
            }

            if (pageElement.type.includes('communeLogo-') && idx > 0) {
              pageElement.src = communeLogoSrc;
            }
          }
        }

        //this.reportingService.workingTemplate = config.template;
        this.reportingService.workingTemplate.pages = config.pages;
        this.reportingService.setTemplateSectionsFromConfig(config);

        // register echarts maps
        for (const section of this.reportingService.getSectionsAsArray()) {
          for (const mapName of section.echartsRegisteredMapNames) {
            if (this.reportingService.workingTemplate.name.includes('reachability')) {
              if (!mapName.includes(section.spatialUnitName)) {
                continue;
              }
              if (!mapName.includes('_isochrones')) {
                const geoJson = section.echartsMaps.filter(
                  (map) => map.name === section.poiLayerName
                )[0].geoJson;
                echarts.registerMap(mapName, geoJson);
              } else {
                const geoJson = section.echartsMaps.filter((map) => map.name === mapName)[0]
                  .geoJson;
                echarts.registerMap(mapName, geoJson);
              }
            } else {
              if (!mapName.includes(section.spatialUnitName)) {
                continue;
              }
              const geoJson = section.echartsMaps[0].geoJson;
              echarts.registerMap(mapName, geoJson);
            }
          }
        }
        for (const page of this.reportingService.workingTemplate.pages) {
          for (const pageElement of page.pageElements) {
            if (
              pageElement.type === 'map' &&
              Object.prototype.hasOwnProperty.call(pageElement, 'echartsMaps')
            ) {
              for (const map of pageElement.echartsMaps) {
                echarts.registerMap(map.name, map.geoJson);
              }
            }
          }
        }

        // setupPages() already iterates every indicator/georesource section itself
        await this.setupPages();
      }
    } catch (error: any) {
      console.error(error);
      //this.mapErrorNotificationService.displayMapApplicationError(error.message);
    }
  }

  // new to cover added sections
  async setupPages() {
    this.loadingData = true;
    this.reportingService.abortPreparation = false;
    this.reportingService.reportGenerationInProgress = true;
    this.reportingService.reportStatus = 'preparing';
    this.reportingService.reportProgress = 0;

    for (const indicator of this.reportingService.templateSections.indicators) {
      if (this.reportingService.abortPreparation) break;
      await this.setupIndicatorPages(indicator);
    }

    for (const georesource of this.reportingService.templateSections.georesources) {
      if (this.reportingService.abortPreparation) break;
      await this.setupPagesForReachability(georesource);
    }

    this.loadingData = false;

    if (this.reportingService.abortPreparation) {
      this.reportingService.reportGenerationInProgress = false;
      return;
    }

    this.reportingService.reportStatus = 'finished';
    this.reportingService.reportProgress = 100;
    this.reportingService.reportCountdown = 5;
    const countdownInterval = setInterval(() => {
      this.reportingService.reportCountdown--;
      if (this.reportingService.reportCountdown <= 0) {
        clearInterval(countdownInterval);
        this.reportingService.reportGenerationInProgress = false;
      }
    }, 1000);
  }

  getFeatureLookupKey(templateSection) {
    return templateSection.indicatorId
      ? templateSection.indicatorId + '_' + templateSection.spatialUnitName
      : templateSection.poiLayerName + '_' + templateSection.spatialUnitName;
  }

  isPageInPreview(page, _index?: number) {
    return isPageInPreview(
      this.reportingService.workingTemplate.pages,
      page,
      this.MAX_PREVIEW_AREA_SPECIFIC_PAGES,
      this.MAX_PREVIEW_DATATABLE_PAGES
    );
  }

  isLastPreviewPage(page: any): boolean {
    return isLastPreviewPage(
      this.reportingService.workingTemplate.pages,
      page,
      this.MAX_PREVIEW_AREA_SPECIFIC_PAGES,
      this.MAX_PREVIEW_DATATABLE_PAGES
    );
  }

  countBackgroundPages(page: any): number {
    if (!this.reportingService.workingTemplate || !page) return 0;
    return countBackgroundPages(
      this.reportingService.workingTemplate.pages,
      page,
      this.MAX_PREVIEW_AREA_SPECIFIC_PAGES,
      this.MAX_PREVIEW_DATATABLE_PAGES
    );
  }

  // Builds the per-page generation context. Not consumed by the generation methods yet - see
  // report-generation-context.model.ts for why this is introduced ahead of actually using it.
  buildGenerationContext(): ReportGenerationContext {
    return {
      pages: this.reportingService.workingTemplate.pages,
      mercatorProjection_d3: this.mercatorProjection_d3,
      currentSpatialUnit: this.currentSpatialUnit,
      geoJsonForReachability_byFeatureName: this.geoJsonForReachability_byFeatureName,
      featureLookupCache: this.featureLookupCache,
      lastPageOfAddedSectionPrepared: this.lastPageOfAddedSectionPrepared,
      pagePreparationIndex: this.pagePreparationIndex,
      pagePreparationSize: this.pagePreparationSize,
      loadingData: this.loadingData,
      echartsImgPixelRatio: this.echartsImgPixelRatio,
    };
  }

  async preparePage(idx, page, indicatorId, poiLayerName, spatialUnit, geoJSON) {
    const context = this.buildGenerationContext();
    const isPreview = this.isPageInPreview(page, idx);
    page.indexInConfigPages = idx;

    if (!page.generatedData) {
      page.generatedData = {
        echarts: {},
        mapImage: undefined,
        tableData: undefined,
        isComplete: false,
      };
    }

    // route through background processor for stable map capture
    this.reportingService.reportingBackgroundState.pageToProcess_overview = page;
    this.appRef.tick(); // synchronously run CD so the background page elements are in the DOM

    const pageDom = document.getElementById('reporting-background-page');
    if (!pageDom) {
      console.error('Could not find background DOM for page ' + idx);
      return;
    }

    for (const [elementIdx, pageElement] of page.pageElements.entries()) {
      const pElementDom: any = pageDom.querySelector(
        '#reporting-background-page-' + pageElement.type + '-' + elementIdx
      );

      if (!pElementDom) {
        continue;
      }

      if (pageElement.type === 'linechart' && pageElement.showBoxplots) {
        const xAxisLabels = pageElement.echartsOptions.xAxis[0].data;
        pageElement.echartsOptions.dataset[1].transform.config = {
          itemNameFormatter: function (params) {
            return xAxisLabels[params.value];
          },
        };
      }

      if (
        pageElement.type === 'map' ||
        pageElement.type === 'barchart' ||
        pageElement.type === 'linechart'
      ) {
        if (!pageElement.echartsOptions || Object.keys(pageElement.echartsOptions).length === 0) {
          console.warn('No echarts options found for page element', pageElement, 'on page', idx);
          continue;
        }

        const instance = echarts.init(pElementDom);

        if (pageElement.type === 'map') {
          for (const series of pageElement.echartsOptions.series) {
            series.left = 0;
            series.top = 0;
            series.right = 0;
            series.bottom = 0;
            series.projection = {
              project: (point) => this.mercatorProjection_d3(point),
              unproject: (point) => this.mercatorProjection_d3.invert(point),
            };
          }
          if (pageElement.echartsOptions.geo) {
            pageElement.echartsOptions.geo[0].top = 0;
            pageElement.echartsOptions.geo[0].left = 0;
            pageElement.echartsOptions.geo[0].right = 0;
            pageElement.echartsOptions.geo[0].bottom = 0;
            pageElement.echartsOptions.geo[0].projection = {
              project: (point) => this.mercatorProjection_d3(point),
              unproject: (point) => this.mercatorProjection_d3.invert(point),
            };
          }

          if (page.area && page.area.length) {
            this.filterMapByArea(instance, pageElement.echartsOptions, page.area, geoJSON.features);
          } else {
            pageElement.echartsOptions.labelLayout = function (feature) {
              const names = page.templateSection.absoluteLabelPositions.map((el) => el.name);
              const text = feature.text.split('\n')[0];
              if (names.includes(text)) {
                const i = names.indexOf(text);
                return {
                  x: page.templateSection.absoluteLabelPositions[i].x,
                  y: page.templateSection.absoluteLabelPositions[i].y,
                  draggable: false,
                };
              } else {
                return {
                  moveOverlap: 'shiftY',
                  x: feature.rect.x + feature.rect.width / 2,
                  draggable: false,
                };
              }
            };
          }
        }

        pageElement.echartsOptions.animation = false;
        instance.setOption(pageElement.echartsOptions);

        if (pageElement.type === 'map') {
          page.generatedData.mapImage =
            await this.reportPagePreparationService.prepareLeafletMapForOverview(
              page,
              pageElement,
              elementIdx,
              instance,
              spatialUnit,
              false,
              false,
              isPreview,
              context
            );

          if (isPreview) {
            const previewPElementDom: any = document.querySelector(
              '#reporting-overview-page-' + idx + '-' + pageElement.type + '-' + elementIdx
            );
            if (previewPElementDom) {
              // move the rendered echarts canvas (the indicator choropleth) into the visible
              // preview element â€” it only exists in the off-screen background container
              // otherwise, so without this the indicator data never shows up in the overview
              previewPElementDom.innerHTML = '';
              while (pElementDom.firstChild) {
                previewPElementDom.appendChild(pElementDom.firstChild);
              }
              if (page.generatedData.mapImage) {
                previewPElementDom.style.backgroundImage =
                  'url(' + page.generatedData.mapImage + ')';
                previewPElementDom.style.backgroundSize = '100% 100%';
                previewPElementDom.style.backgroundRepeat = 'no-repeat';
              }
            }
          } else {
            instance.dispose();
          }
        } else {
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 500);
            instance.on('finished', () => {
              clearTimeout(timeout);
              resolve(null);
            });
          });

          page.generatedData.echarts[
            pageElement.type + (pageElement.showPercentageChangeToPrevTimestamp ? '_perc' : '')
          ] = instance.getDataURL({ pixelRatio: this.echartsImgPixelRatio });

          if (isPreview) {
            const previewPElementDom: any = document.querySelector(
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
          const previewPageDom = document.getElementById('reporting-overview-page-' + idx);
          if (previewPageDom) {
            const legendNode: any = previewPageDom.querySelector('.type-mapLegend');
            if (legendNode) legendNode.style.display = 'none';
          }
        }
      }

      if (pageElement.type === 'datatable') {
        let targetDom = pElementDom;
        if (isPreview) {
          targetDom = document.querySelector(
            '#reporting-overview-page-' + idx + '-' + pageElement.type + '-' + elementIdx
          );
        }
        createDatatablePage(targetDom, pageElement);
        page.generatedData.tableData = pageElement.tableData;
      }
    }

    page.generatedData.isComplete = true;
    this.reportingService.reportingBackgroundState.pageToProcess_overview = undefined;
  }

  filterMapByArea(echartsInstance, echartsInstanceOptions, areaName, allFeatures) {
    const mapName = echartsInstanceOptions.series[0].map;
    const features = allFeatures.filter((el) => el.properties.name === areaName);
    echarts.registerMap(mapName, { type: 'FeatureCollection', features: features } as any);
    echartsInstance.setOption(echartsInstanceOptions);
  }

  async setupIndicatorPages(indicator) {
    const indicatorId = indicator.indicatorId;
    let spatialUnit, featureCollection, features, geoJSON;

    spatialUnit = await this.getSpatialUnitByIndicator(indicatorId, indicator.spatialUnitName);
    this.currentSpatialUnit = spatialUnit;

    featureCollection = await this.queryFeatures(indicatorId, spatialUnit);
    features = createLowerCaseNameProperty(featureCollection.features);
    this.geoJsonForReachability_byFeatureName = new Map();

    for (const feature of features) {
      this.geoJsonForReachability_byFeatureName.set(feature.properties.NAME, feature);
    }
    this.geoJsonForReachability_byFeatureName.set('undefined', features);
    geoJSON = { features: features };

    const cacheKey = this.getFeatureLookupKey(indicator);
    this.featureLookupCache.set(cacheKey, this.geoJsonForReachability_byFeatureName);

    this.lastPageOfAddedSectionPrepared = false;
    this.pagePreparationIndex = 0;
    this.pagePreparationSize = this.reportingService.workingTemplate.pages.length;

    await new Promise((resolve) => setTimeout(resolve, 150));

    let totalPreparedCount = 0;
    for (const [idx, page] of this.reportingService.workingTemplate.pages.entries()) {
      if (this.reportingService.abortPreparation) {
        return;
      }
      if (page.templateSection.indicatorId !== indicatorId) {
        continue;
      }

      const isPreview = this.isPageInPreview(page, idx);
      if (page.generatedData && page.generatedData.isComplete && !isPreview) {
        continue;
      }

      await this.preparePage(idx, page, indicatorId, undefined, spatialUnit, geoJSON);

      totalPreparedCount++;
      this.pagePreparationIndex = totalPreparedCount;
      this.reportingService.reportProgress = Math.round(
        (totalPreparedCount / this.pagePreparationSize) * 100
      );
    }

    this.lastPageOfAddedSectionPrepared = true;
    this.loadingData = false;
  }

  async setupPagesForReachability(templateSection) {
    const poiLayerName = templateSection.poiLayerName;
    let spatialUnit, featureCollection, features, geoJSON, indicatorId;
    if (templateSection.indicatorId) {
      indicatorId = templateSection.indicatorId;
    }

    if (indicatorId) {
      spatialUnit = await this.getSpatialUnitByIndicator(
        indicatorId,
        templateSection.spatialUnitName
      );
      featureCollection = await this.queryFeatures(indicatorId, spatialUnit);
    } else {
      spatialUnit = await this.getSpatialUnitByName(templateSection.spatialUnitName);
      featureCollection = await this.queryFeatures(undefined, spatialUnit);
    }
    this.currentSpatialUnit = spatialUnit;

    features = createLowerCaseNameProperty(featureCollection.features);
    geoJSON = { features: features };

    this.geoJsonForReachability_byFeatureName = new Map();
    for (const feature of features) {
      this.geoJsonForReachability_byFeatureName.set(feature.properties.NAME, feature);
    }
    this.geoJsonForReachability_byFeatureName.set('undefined', features);

    const cacheKey = this.getFeatureLookupKey(templateSection);
    this.featureLookupCache.set(cacheKey, this.geoJsonForReachability_byFeatureName);

    this.lastPageOfAddedSectionPrepared = false;
    this.pagePreparationIndex = 0;
    this.pagePreparationSize = this.reportingService.workingTemplate.pages.length;

    await new Promise((resolve) => setTimeout(resolve, 150));

    let totalPreparedCount = 0;
    for (const [idx, page] of this.reportingService.workingTemplate.pages.entries()) {
      if (this.reportingService.abortPreparation) {
        return;
      }
      if (page.templateSection.poiLayerName !== poiLayerName) {
        continue;
      }

      const isPreview = this.isPageInPreview(page, idx);
      if (page.generatedData && page.generatedData.isComplete && !isPreview) {
        continue;
      }

      await this.preparePage(idx, page, undefined, poiLayerName, spatialUnit, geoJSON);

      totalPreparedCount++;
      this.pagePreparationIndex = totalPreparedCount;
      this.reportingService.reportProgress = Math.round(
        (totalPreparedCount / this.pagePreparationSize) * 100
      );
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

  //async
  getSpatialUnitByName(spatialUnitName): Promise<any> {
    let url;
    url =
      this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() + '/spatial-units';
    // send request

    return new Promise((resolve) => {
      this.http.get(url).subscribe({
        next: (response: any) => {
          const spatialUnit = response.filter((el) => {
            return el.spatialUnitLevel === spatialUnitName;
          });

          if (spatialUnit.length === 1) resolve(spatialUnit[0]);
        },
        error: (error) => {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          this.loadingData = false;
          this.mapErrorNotificationService.displayMapApplicationError(error);
          console.error(error);
        },
      });
    });
  }

  // async
  getSpatialUnitByIndicator(indicatorId, spatialUnitName): Promise<any> {
    let url;
    url =
      this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
      '/indicators/' +
      indicatorId;

    return new Promise((resolve) => {
      this.http.get(url).subscribe({
        next: (response: any) => {
          const spatialUnit = response.applicableSpatialUnits.filter((el) => {
            return el.spatialUnitName === spatialUnitName;
          });
          if (spatialUnit.length === 1) resolve(spatialUnit[0]);
        },
        error: (error) => {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          this.loadingData = false;
          this.mapErrorNotificationService.displayMapApplicationError(error);
          console.error(error);
        },
      });
    });
  }

  showThisPage(page) {
    return this.reportingService.showThisPage(page, this.reportingService.workingTemplate.pages);
  }

  getPageNumber(index) {
    return this.reportingService.getPageNumber(index, this.reportingService.workingTemplate.pages);
  }

  filterPagesToShow() {
    return this.reportingService.filterPagesToShow(this.reportingService.workingTemplate.pages);
  }

  pageContainsDatatable(pageID) {
    return this.reportingService.pageContainsDatatable(
      pageID,
      this.reportingService.workingTemplate.pages
    );
  }

  exportConfig() {
    try {
      const jsonToExport: any = {};

      this.reportingService.workingTemplate.pages = this.removeCircularReferences(
        this.reportingService.workingTemplate.pages
      );
      const temp = JSON.stringify(
        this.reportingService.workingTemplate.pages,
        function (key, value) {
          // Leaflet map contains cyclic object references so we have to remove it.
          // We have to initialize the map again on import based on the stored boundingbox
          if (key === 'leafletMap') {
            return undefined;
          } else {
            return value;
          }
        }
      );

      jsonToExport.pages = JSON.parse(temp);
      jsonToExport.template = JSON.parse(JSON.stringify(this.reportingService.workingTemplate));
      jsonToExport.templateSections = this.reportingService.getSectionsAsArray();

      // Only store commune logo once (in first page)
      // It is base64 encoded and adds quite a bit to the file size
      for (const [idx, page] of jsonToExport.pages.entries()) {
        for (const pageElement of page.pageElements) {
          if (pageElement.type.includes('communeLogo-') && idx > 0) {
            pageElement.src = '';
          }
        }
      }

      for (const section of jsonToExport.templateSections) {
        const mapNames: any = [...new Set(section.echartsRegisteredMapNames)];
        if (this.reportingService.workingTemplate.name.includes('reachability')) {
          let mapAdded = false;
          for (const [idx, name] of mapNames.entries()) {
            if (!name.includes(section.spatialUnitName)) {
              continue;
            }
            // store all isochrones
            if (name.includes('_isochrones')) {
              const map = echarts.getMap(name);
              section.echartsMaps.push({
                name: name,
                geoJson: map.geoJson,
              });
            }
            // First map with the correct spatial unit
            // All other maps have the same geojson, so we only store them once
            if (!mapAdded && name.includes(section.poiLayerName)) {
              const map = echarts.getMap(mapNames[idx]);
              section.echartsMaps.push({
                name: section.poiLayerName,
                geoJson: map.geoJson,
              });
              mapAdded = true;
            }
          }
        } else {
          for (const [idx, name] of mapNames.entries()) {
            if (!name.includes(section.spatialUnitName)) {
              continue;
            } else {
              // First map with the correct spatial unit
              const map = echarts.getMap(mapNames[idx]);
              section.echartsMaps.push({
                name: mapNames[idx],
                geoJson: map.geoJson,
              });
            }
          }
        }
      }

      const jsonString =
        'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonToExport));
      // to download json, a DOM element is created, clicked and removed
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', jsonString);
      downloadAnchorNode.setAttribute(
        'download',
        this.getCurrentDateAndTime() + '_KomMonitor-Reporting-Konfiguration.json'
      );
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error: any) {
      this.mapErrorNotificationService.displayMapApplicationError(error.message);
      console.error(error);
    }
  }

  getCurrentDateAndTime() {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month: any = date.getMonth() + 1;
    const day: any = date.getDate();
    const time: any = date.getHours();
    const minutes: any = date.getMinutes();
    const seconds: any = date.getSeconds();
    const now = ''.concat(year, '-', month, '-', day, '_', time, '-', minutes, '-', seconds);
    return now;
  }

  // async
  queryFeatures(indicatorId, spatialUnit): Promise<any> {
    // build request
    // query different endpoints depending on if we have an indicator or not
    let url;
    if (!indicatorId) {
      const date = spatialUnit.metadata.lastUpdate.split('-');
      const year = date[0];
      const month = date[1];
      const day = date[2];
      url =
        this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
        '/spatial-units/' +
        spatialUnit.spatialUnitId +
        '/' +
        year +
        '/' +
        month +
        '/' +
        day;
    } else {
      url =
        this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
        '/indicators/' +
        indicatorId +
        '/' +
        spatialUnit.spatialUnitId;
    }

    return new Promise((resolve) => {
      // send request
      this.loadingData = true;

      this.http.get(url).subscribe({
        next: (response) => {
          this.loadingData = false;
          resolve(response);
        },
        error: (error) => {
          // called asynchronously if an error occurs
          // or server returns response with an error status.
          this.loadingData = false;
          this.mapErrorNotificationService.displayMapApplicationError(error);
          console.error(error);
        },
      });
    });
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
    let result = (parseInt(px, 10) / 830) * 297;
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
    result = Math.round((result / this.deviceScreenDpi) * 100) / 100;
    return result;
  }

  pxToTwip(px) {
    const result = parseInt(px, 10) * 15; // 1px = 0.75pt = 15twip
    return (result * this.pxPerMilli * 297) / 830; // scale from 830px to A4 page
  }

  twipToEmus(value) {
    // see: https://startbigthinksmall.wordpress.com/2010/01/04/points-inches-and-emus-measuring-units-in-office-open-xml/
    return value * 635;
  }

  // from: https://stackoverflow.com/a/46406124
  dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    const byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);

    // create a view into the buffer
    const ia = new Uint8Array(ab);

    // set the bytes of the buffer to the correct values
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    const blob = new Blob([ab], { type: mimeString });
    return blob;
  }

  calculateDimensions(dimensions, unit) {
    const result: any = {};
    if (unit === 'px') {
      // also scale our 830px preview up to A4 here
      const scalefactor = (this.pxPerMilli * 297) / 830;
      result.top = dimensions.top && parseInt(dimensions.top, 10) * scalefactor;
      result.bottom = dimensions.bottom && parseInt(dimensions.bottom, 10) * scalefactor;
      result.left = dimensions.left && parseInt(dimensions.left, 10) * scalefactor;
      result.right = dimensions.right && parseInt(dimensions.right, 10) * scalefactor;
      result.width = dimensions.width && parseInt(dimensions.width, 10) * scalefactor;
      result.height = dimensions.height && parseInt(dimensions.height, 10) * scalefactor;
    }
    if (unit === 'milli') {
      result.top = dimensions.top && this.pxToMilli(dimensions.top);
      result.bottom = dimensions.bottom && this.pxToMilli(dimensions.bottom);
      result.left = dimensions.left && this.pxToMilli(dimensions.left);
      result.right = dimensions.right && this.pxToMilli(dimensions.right);
      result.width = dimensions.width && this.pxToMilli(dimensions.width);
      result.height = dimensions.height && this.pxToMilli(dimensions.height);
    }
    if (unit === 'twip') {
      result.top = dimensions.top && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.top));
      result.bottom =
        dimensions.bottom && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.bottom));
      result.left =
        dimensions.left && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.left));
      result.right =
        dimensions.right && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.right));
      result.width =
        dimensions.width && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.width));
      result.height =
        dimensions.height && docx.convertMillimetersToTwip(this.pxToMilli(dimensions.height));
    }
    if (unit === 'emu') {
      result.top =
        dimensions.top &&
        this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.top)));
      result.bottom =
        dimensions.bottom &&
        this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.bottom)));
      result.left =
        dimensions.left &&
        this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.left)));
      result.right =
        dimensions.right &&
        this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.right)));
      result.width =
        dimensions.width &&
        this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.width)));
      result.height =
        dimensions.height &&
        this.twipToEmus(docx.convertMillimetersToTwip(this.pxToMilli(dimensions.height)));
    }
    return result;
  }

  calculateScreenDpi() {
    // create a hidden div that is one inch high
    const div = document.createElement('div');
    div.style.height = '1in';
    div.style.position = 'absolute';
    div.style.left = '-100%';
    div.style.top = '-100%';
    document.getElementsByTagName('body')[0].append(div);
    const dpi = div.offsetHeight;
    div.style.display = 'none';
    return dpi;
  }
}
