import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as turf from '@turf/turf';
import {
  CustomSliderComponent,
  DisplayType,
  SliderType,
} from 'components/ngComponents/common/custom-slider/custom-slider.component';
import { DualListBoxComponent } from 'components/ngComponents/customElements/dual-list-box/dual-list-box.component';
import {
  isQualitativeMapping,
  resolveCategoricalColor,
} from 'components/ngComponents/models/classification.models';
import * as d3 from 'd3';
import * as echarts from 'echarts';
import { CategoricalMappingType } from 'models/data-management-api';
import { firstValueFrom } from 'rxjs';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { DiagramHelperServiceService } from 'services/diagram-helper-service/diagram-helper-service.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { LabelService } from 'services/label-service/label.service';
import { LeafletScreenshotCacheHelperService } from 'services/leaflet-screenshot-cache-helper-service/leaflet-screenshot-cache-helper.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { ReachabilityStateService } from 'services/reachability-state-service/reachability-state.service';
import { ReportPagePreparationService } from 'services/report-page-preparation-service/report-page-preparation.service';
import { ReportingService, WorkflowState } from 'services/reporting-service/reporting.service';
import {
  calculateAvg,
  calculateSeriesDataForTimeseries,
  checkVisibility,
  countBackgroundPages,
  createLowerCaseNameProperty,
  isLastPreviewPage,
  isPageInPreview,
} from 'components/ngComponents/userInterface/reporting/report-preview.utils';
import { ReportGenerationContext } from 'components/ngComponents/userInterface/reporting/report-generation-context.model';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';

@Component({
  selector: 'app-indicator-add',
  templateUrl: './indicator-add.component.html',
  styleUrls: ['./indicator-add.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DualListBoxComponent,
    CustomSliderComponent,
  ],
})
export class IndicatorAddComponent implements OnInit {
  protected mapOverlayState = inject(MapOverlayStateService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private indicatorValueService = inject(IndicatorValueService);
  private selectionState = inject(SelectionStateService);
  protected georesourceStore = inject(GeoresourceMetadataStoreService);
  protected spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  protected indicatorStore = inject(IndicatorMetadataStoreService);
  protected metadataExportService = inject(MetadataExportService);
  protected labelService = inject(LabelService);
  private diagramHelperService = inject(DiagramHelperServiceService);
  private visualStyleHelperService = inject(VisualStyleHelperServiceNew);
  private httpClient = inject(HttpClient);
  private broadcastService = inject(BroadcastService);
  private reachabilityStateService = inject(ReachabilityStateService);
  protected leafletScreenshotCacheHelperService = inject(LeafletScreenshotCacheHelperService);
  protected reportingService = inject(ReportingService);
  private fb = inject(FormBuilder);
  private envConfigService = inject(EnvConfigService);
  private destroyRef = inject(DestroyRef);
  private reportPagePreparationService = inject(ReportPagePreparationService);

  sliderDisplaMode = DisplayType;
  sliderType = SliderType;
  sliderValues!: any[];
  sliderPositions!: any[];

  dateSlider: any;

  private _slider?: CustomSliderComponent;

  @ViewChild(CustomSliderComponent)
  set slider(value: CustomSliderComponent | undefined) {
    if (value) {
      this._slider = value;
    }
  }

  datesAsMs;

  workflowState = WorkflowState;

  spatialUnitSelect = new FormControl();
  baseMapSelect = new FormControl();
  indicatorSelect = new FormControl();

  numAreaSpecificPagesToShow: number = 20;

  configForm = this.fb.nonNullable.group({
    sectionContentControl: this.fb.nonNullable.group(
      this.reportingService.config.sectionContentControl
    ),
    sectionControl: this.fb.nonNullable.group(this.reportingService.config.sectionControl),
    headerFooterControl: this.fb.nonNullable.group(
      this.reportingService.config.headerFooterControl
    ),
  });

  template: any = undefined;
  isochrones;
  typeOfMovement;
  geoJsonForReachability;
  reachabilityTemplateGeoMapOptions;
  draggingLabelForFeature;
  isochronesRangeType;
  isochronesRangeUnits;
  intervalArr: any[] = [];

  indicatorNameFilter = '';
  poiNameFilter = '';
  selectedIndicator: any = undefined;
  private spatialUnitChangeTimeoutHandle: any;
  private indicatorSelectedTimeoutHandle: any;

  /** Whether the currently selected indicator uses qualitative (categorical) classification. */
  get selectedIndicatorIsCategorical(): boolean {
    return isQualitativeMapping(this.selectedIndicator?.defaultClassificationMapping);
  }

  selectedPoiLayer: any = undefined;
  availablePoiLayers: any[] = [];
  displayableIndicatorsByNameTimeseries;
  displayableIndicatorsByName;
  displayableIndicatorsByNameReachability;
  filteredAvailablePoiLayers;

  availableFeaturesBySpatialUnit: any = {};
  selectedSpatialUnit: any;
  selectedAreas: any[] = [];

  allSpatialUnitsForReachability;

  testOptions: any = {
    items: [],
  };
  reloadManualList = false;
  reloadTimestampsDualList = false;

  dualListAreasOptions: any = {
    items: [],
    selectedItems: [],
  };
  reloadAreasDualList = false;
  dualListTimestampsOptions;
  dualListSpatialUnitsOptions;
  indexOfFirstAreaSpecificPage;
  isochronesSeriesData;

  selectedTimestamps: any[] = [];
  absoluteLabelPositions: any[] = [];
  showMapLabels = true;
  showRankingMeanLine = true;
  echartsOptions: any = {
    map: {
      // "2017-12-31": ...
      // "2018-12-31": ...
    },
    bar: {
      // "2017-12-31": ...
      // "2018-12-31": ...
    },
    line: {}, // no timestamp needed here
  };
  echartsRegisteredMapNames: any[] = [];

  loadingData = false;
  diagramsPrepared = false;
  isFirstUpdateOnIndicatorOrPoiLayerSelection = true;
  showResetIsochronesBtn = false;

  isochronesTypeOfMovementMapping = {
    'foot-walking': 'FuÃŸgÃ¤nger',
    'driving-car': 'Auto',
    'cycling-regular': 'Fahrrad',
    wheelchair: 'Barrierefrei',
    buffer: 'Puffer',
  };

  geoJsonForReachability_byFeatureName;
  geoJsonForSelectedIndicator_byFeatureName;

  mercatorProjection_d3: any = d3.geoMercator();

  timeseriesAdjustedOnSpatialUnitChange;

  pageConfig = this.configForm.getRawValue();

  selectedBaseMap;

  lastPageOfAddedSectionPrepared;
  pagePreparationIndex;
  pagePreparationSize;

  readonly MAX_PREVIEW_AREA_SPECIFIC_PAGES = 3;
  readonly MAX_PREVIEW_DATATABLE_PAGES = 3;
  preparationNeeded = true;

  // Resolve the indicator precision from the current selection before
  // delegating to IndicatorValueService.
  private getIndicatorValue_asNumber(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asNumber(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  ngOnInit(): void {
    // originally called by "reportingConfigureNewIndicatorShown" when +Indicator clicked
    this.initialize();

    //this.baseMapSelect = new FormControl(this.mapOverlayState.baseLayerDefinitionsArray[0]);

    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((broadcastMsg) => {
        const title = broadcastMsg.msg;
        const values: any = broadcastMsg.values;

        switch (title) {
          case 'reportingConfigureNewIndicatorShown':
            {
              this.initialize();
            }
            break;
          case 'reportingConfigureNewPoiLayerShown':
            {
              this.initialize();
            }
            break;
          case BroadcastMessage.ReportingIsochronesCalculationStarted:
            {
              this.reportingIsochronesCalculationStarted();
            }
            break;
          case BroadcastMessage.ReportingIsochronesCalculationFinished:
            {
              this.reportingIsochronesCalculationFinished(values);
            }
            break;
          case BroadcastMessage.AbortReportGeneration:
            {
              this.onAbortPreparationClicked();
            }
            break;
        }
      });

    // init leafletScreenshot service after DB has beeon initialized
    this.leafletScreenshotCacheHelperService.init();
  }

  initialize() {
    // this is re-invoked (via the broadcastService subscription below) on an already-mounted
    // instance whenever the user starts adding another indicator/POI layer without the component
    // being torn down first, so clear out the previous run's selection state before rebuilding it
    this.reset();

    this.loadingData = true;

    // resets cloned template for preview (NOT working template in overview)
    this.reportingService.resetTemplateClone();

    this.setAreaSpecificPagesVisibility();

    // give each page a unique id to track it by in ng-repeat
    for (const page of this.reportingService.clonedTemplate.pages) {
      page.id = this.reportingService.nextTemplatePageId();
    }

    if (this.reportingService.clonedTemplate.name.includes('timestamp'))
      this.indexOfFirstAreaSpecificPage = 6;
    if (this.reportingService.clonedTemplate.name.includes('timeseries'))
      this.indexOfFirstAreaSpecificPage = 8;
    if (this.reportingService.clonedTemplate.name.includes('reachability'))
      this.indexOfFirstAreaSpecificPage = 2;

    this.initializeDualLists();

    this.availablePoiLayers = this.georesourceStore.availableGeoresources.filter(
      (georesource) => georesource.isPOI
    );
    this.filteredAvailablePoiLayers = this.availablePoiLayers.sort(this.sortByDatasetName);

    this.displayableIndicatorsByNameTimeseries = this.indicatorStore.displayableIndicators
      .filter((e: any) => e.applicableDates.length > 0)
      .sort(this.sortByindicatorName);
    this.displayableIndicatorsByName = this.indicatorStore.displayableIndicators.sort(
      this.sortByindicatorName
    );
    this.displayableIndicatorsByNameReachability = this.indicatorStore.displayableIndicators
      .filter((e: any) => {
        if (!this.selectedSpatialUnit) return false;
        return (
          e.applicableSpatialUnits &&
          e.applicableSpatialUnits.some(
            (su: any) => su.spatialUnitId === this.selectedSpatialUnit.spatialUnitId
          )
        );
      })
      .sort(this.sortByindicatorName);

    this.selectedBaseMap = this.mapOverlayState.baseLayerDefinitionsArray[1];

    this.loadingData = false;
  }

  setAreaSpecificPagesVisibility() {
    if (this.pageConfig.sectionControl.showAreaSpecific === false)
      this.reportingService.clonedTemplate.pages.map((page) => {
        if (page.type == 'area_specific') page.hidden = true;
      });
  }

  onChangePageSettings() {
    this.pageConfig = this.configForm.getRawValue();

    this.onChangeShowPageSection();
  }

  onChangeShowPageSection() {
    this.loadingData = true;

    // now iterate over pages and adjust visibility according to settings
    // save that config at template level to adjust it in overview component and during export as well
    for (const page of this.reportingService.clonedTemplate.pages) {
      if (page.type == 'map_overview_unclassified') {
        page.hidden = !this.pageConfig.sectionControl.showOverviewSection_unclassified;
        continue;
      }
      if (page.type == 'map_overview_classified') {
        page.hidden = !this.pageConfig.sectionControl.showOverviewSection_classified;
        continue;
      }
      if (page.type == 'barchart_overview') {
        page.hidden = !this.pageConfig.sectionControl.showBarchartOverview;
        continue;
      }
      if (page.type == 'linechart_overview') {
        page.hidden = !this.pageConfig.sectionControl.showLinechartOverview;
        continue;
      }
      if (page.type == 'boxplot_overview') {
        page.hidden = !this.pageConfig.sectionControl.showBoxplotchartOverview;
        continue;
      }
      if (page.type == 'area_specific') {
        page.hidden = !this.pageConfig.sectionControl.showAreaSpecific;
        continue;
      }
      if (page.type == 'map_overview_reachability') {
        page.hidden = !this.pageConfig.sectionControl.showOverviewSection_reachability;
        continue;
      }
      if (page.type == 'datatable') {
        page.hidden = !this.pageConfig.sectionControl.showDatatable;
        continue;
      }
    }

    this.reportingService.clonedTemplate.pageConfig = this.pageConfig;

    this.loadingData = false;
  }

  checkVisibility(pageElement, page) {
    return checkVisibility(pageElement, page, this.pageConfig);
  }

  onChangePageConfig() {
    // just visual updates and make sure that config is set at selected template
    // in order to apply this config in overview and for report generation!
    this.loadingData = true;

    this.reportingService.clonedTemplate.pageConfig = this.pageConfig;

    this.loadingData = false;
  }

  onChangeShowMapLabels() {
    this.pageConfig.sectionContentControl.showMapLabels =
      this.configForm.controls.sectionContentControl.controls.showMapLabels.value;

    for (let i = 0; i < this.reportingService.clonedTemplate.pages.length; i++) {
      const page = this.reportingService.clonedTemplate.pages[i];
      const pageElement = page.pageElements.find((el: any) => el.type === 'map');
      if (!pageElement || !pageElement.echartsOptions) continue;

      const options = pageElement.echartsOptions;
      options.series[0].label.show = this.pageConfig.sectionContentControl.showMapLabels;
      if (options.series[0].select) {
        options.series[0].select.label.show = this.pageConfig.sectionContentControl.showMapLabels;
      }
      for (const item of options.series[0].data) {
        if (typeof item.label === 'undefined') item.label = {};
        item.label.show = this.pageConfig.sectionContentControl.showMapLabels;
      }

      // also update live instance if in preview DOM
      const mapDom: any = document.querySelector('#reporting-addIndicator-page-' + i + '-map');
      if (mapDom) {
        const instance: any = echarts.getInstanceByDom(mapDom);
        if (instance) instance.setOption(options, { replaceMerge: ['series'] });
      }
    }
  }

  async onChangeSelectedBaseMap() {
    // reinitiate page building from the scratch as easiest solution
    this.loadingData = true;
    this.preparationNeeded = true;

    this.leafletScreenshotCacheHelperService.resetCounter_keepingCurrentTargetFeatures(false);
    // new user workflow: onTriggerPreparationClicked is the only place to start page generation

    this.loadingData = false;
  }

  onChangeShowRankingMeanLine() {
    this.pageConfig.sectionContentControl.showRankingMeanLine =
      this.configForm.controls.sectionContentControl.controls.showRankingMeanLine.value;

    for (let i = 0; i < this.reportingService.clonedTemplate.pages.length; i++) {
      const page = this.reportingService.clonedTemplate.pages[i];
      const pageElement = page.pageElements.find((el: any) => el.type === 'barchart');
      if (!pageElement || !pageElement.echartsOptions) continue;

      const options = pageElement.echartsOptions;
      if (!this.pageConfig.sectionContentControl.showRankingMeanLine) {
        options.series[0].markLine_backup = options.series[0].markLine;
        options.series[0].markLine = {};
      } else {
        options.series[0].markLine = options.series[0].markLine_backup || {};
      }

      // also update live instance if in preview DOM
      const barChartDom: any = document.querySelector(
        '#reporting-addIndicator-page-' + i + '-barchart'
      );
      if (barChartDom) {
        const instance: any = echarts.getInstanceByDom(barChartDom);
        if (instance) instance.setOption(options, { replaceMerge: ['series'] });
      }
    }
  }

  onPOINameFilterChange(event: any) {
    const value = event.target.value;
    this.filteredAvailablePoiLayers = this.availablePoiLayers
      .filter((e: any) => e.datasetName.toLowerCase().includes(value))
      .sort(this.sortByDatasetName);
  }

  onIndicatorNameFilterChange(event: any) {
    const value = event.target.value;
    this.displayableIndicatorsByNameTimeseries = this.indicatorStore.displayableIndicators
      .filter(
        (e: any) => e.indicatorName.toLowerCase().includes(value) && e.applicableDates.length > 0
      )
      .sort(this.sortByindicatorName);
    this.displayableIndicatorsByName = this.indicatorStore.displayableIndicators
      .filter((e: any) => e.indicatorName.toLowerCase().includes(value))
      .sort(this.sortByindicatorName);
  }

  onBackToOverviewClicked() {
    this.reportingService.changeWorkflowState(this.workflowState.reportingOverview);
  }

  async onSelectedAreasChanged(newVal) {
    if (typeof this.reportingService.clonedTemplate === 'undefined') return;
    this.loadingData = true;
    this.preparationNeeded = true;

    this.selectedAreas = newVal;

    // to make things easier we remove all area-specific pages and recreate them using newVal
    // this approach is not optimized for performance and might have to change in the future

    // remove all area-specific pages hier
    this.reportingService.clonedTemplate.pages = this.reportingService.clonedTemplate.pages.filter(
      (page) => {
        return !Object.prototype.hasOwnProperty.call(page, 'area');
      }
    );
    let numberOfTargetSpatialUnitFeatures = 0;
    if (newVal && newVal.length) {
      numberOfTargetSpatialUnitFeatures = newVal.length;
    }
    // reset leaflet screenshot helper service according to new  number of selected areas
    // add one page to display the total map of all selected spatial unit features
    numberOfTargetSpatialUnitFeatures++;
    this.leafletScreenshotCacheHelperService.resetCounter(numberOfTargetSpatialUnitFeatures, false);

    if (this.reportingService.clonedTemplate.name.includes('timestamp'))
      this.updateAreasForTimestampTemplates(newVal);
    if (this.reportingService.clonedTemplate.name.includes('timeseries'))
      this.updateAreasForTimeseriesTemplates(newVal);
    if (this.reportingService.clonedTemplate.name.includes('reachability'))
      this.updateAreasForReachabilityTemplates(newVal);

    // skip automatic diagram update; page/diagram generation only starts once the
    // user clicks "Vorschau & Report-Seiten generieren"
    this.loadingData = false;
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

  updateAreasForTimestampTemplates(newVal) {
    let pagesToInsertPerTimestamp: any[] = [];
    for (const area of newVal) {
      const landscapePageToInsert: any = this.reportingService.getAreaSpecificPageClone(
        this.indexOfFirstAreaSpecificPage
      );
      landscapePageToInsert.area = area.name;
      landscapePageToInsert.id = this.reportingService.nextTemplatePageId();
      pagesToInsertPerTimestamp.push(landscapePageToInsert);

      const portraitPageToInsert: any = this.reportingService.getAreaSpecificPageClone(
        this.indexOfFirstAreaSpecificPage + 1
      );
      portraitPageToInsert.area = area.name;
      portraitPageToInsert.id = this.reportingService.nextTemplatePageId();
      pagesToInsertPerTimestamp.push(portraitPageToInsert);
    }

    // sort alphabetically by area name
    pagesToInsertPerTimestamp.sort((a, b) => {
      const textA = a.area.toLowerCase();
      const textB = b.area.toLowerCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });

    // insert area-specific pages for each timestamp
    // right now the area-specific part is missing and we have to figure out where it was.
    // get pages per timestamp -> insert new ones starting at indexOfFirstAreaSpecificPage -> replace per timestamp in this.reportingService.clonedTemplate.pages
    if (this.selectedTimestamps.length) {
      let idx = 0;
      for (const timestamp of this.selectedTimestamps) {
        // pagesForTimestamp is the template-section for that timestamp
        let pagesForTimestamp = this.reportingService.clonedTemplate.pages.filter((page) => {
          const dateEl = page.pageElements.find((el) => {
            return el.type.includes('dataTimestamp-');
          });

          return dateEl.text === timestamp.name;
        });
        // set index to first page of that timestamp
        // this is where we want to start replacing pages later
        idx = this.reportingService.clonedTemplate.pages.indexOf(pagesForTimestamp[0]);
        // create a deep copy so we can assign new ids
        // we must remove leafletMap, as this causes CircularReference Errors
        // it will be added again during page creation anyway
        pagesForTimestamp = this.removeCircularReferences(pagesForTimestamp);
        pagesForTimestamp = JSON.parse(JSON.stringify(pagesForTimestamp));

        // setup pages before inserting
        for (const pageToInsert of pagesToInsertPerTimestamp) {
          pageToInsert.pageElements.forEach((el) => {
            if (el.type.includes('indicatorTitle-')) {
              el.text =
                this.selectedIndicator.indicatorName + ' [' + this.selectedIndicator.unit + ']';
              if (pageToInsert.area) {
                el.text += ', ' + pageToInsert.area;
              }
              el.isPlaceholder = false;
            }

            if (el.type.includes('dataTimestamp-')) {
              el.text = timestamp.name;
              el.isPlaceholder = false;
            }
          });

          // hier: el.text += ", " + pageToInsert.area somehow always takes the area text of the last area.. maybe rebuilds

          // diagrams have to be inserted later because the div element does not yet exist
        }

        const numberOfPagesToReplace = pagesForTimestamp.length;
        // insert area-specific pages
        pagesToInsertPerTimestamp = JSON.parse(JSON.stringify(pagesToInsertPerTimestamp));
        for (const page of pagesToInsertPerTimestamp)
          page.id = this.reportingService.nextTemplatePageId();
        pagesForTimestamp.splice(
          this.indexOfFirstAreaSpecificPage,
          0,
          ...pagesToInsertPerTimestamp
        );
        // assign new ids
        for (const page of pagesForTimestamp) page.id = this.reportingService.nextTemplatePageId();
        // then replace the whole timstamp-section with the new pages
        this.reportingService.clonedTemplate.pages.splice(
          idx,
          numberOfPagesToReplace,
          ...pagesForTimestamp
        );
      }
    } else {
      pagesToInsertPerTimestamp = JSON.parse(JSON.stringify(pagesToInsertPerTimestamp));
      for (const page of pagesToInsertPerTimestamp)
        page.id = this.reportingService.nextTemplatePageId();
      // no timestamp selected, which makes inserting easier
      this.reportingService.clonedTemplate.pages.splice(
        this.indexOfFirstAreaSpecificPage,
        0,
        ...pagesToInsertPerTimestamp
      );
    }
  }

  updateAreasForTimeseriesTemplates(newVal) {
    let pagesToInsert: any[] = [];
    for (const area of newVal) {
      const landscapePageToInsert: any = this.reportingService.getAreaSpecificPageClone(
        this.indexOfFirstAreaSpecificPage
      );
      landscapePageToInsert.area = area.name;
      landscapePageToInsert.id = this.reportingService.nextTemplatePageId();
      pagesToInsert.push(landscapePageToInsert);

      const portraitPageToInsert: any = this.reportingService.getAreaSpecificPageClone(
        this.indexOfFirstAreaSpecificPage + 1
      );
      portraitPageToInsert.area = area.name;
      portraitPageToInsert.id = this.reportingService.nextTemplatePageId();
      pagesToInsert.push(portraitPageToInsert);
    }

    // sort alphabetically by area name
    pagesToInsert.sort((a, b) => {
      const textA = a.area.toLowerCase();
      const textB = b.area.toLowerCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });

    // since we are dealing with a timeseries we don't have to care about inserting area-pages multiple times for different timestamps
    // we do it only once

    // setup pages before inserting
    for (const pageToInsert of pagesToInsert) {
      const titleEl = pageToInsert.pageElements.find((el) => {
        return el.type.includes('indicatorTitle-');
      });
      titleEl.text =
        this.selectedIndicator.indicatorName + ' [' + this.selectedIndicator.unit + ']';
      if (pageToInsert.area) {
        titleEl.text += ', ' + pageToInsert.area;
      }
      titleEl.isPlaceholder = false;

      const dateEl = pageToInsert.pageElements.find((el) => {
        return el.type.includes('dataTimeseries-');
      });
      const includeInBetweenValues = false;
      const dsValues: any = this.getFormattedDateSliderValues(includeInBetweenValues);
      dateEl.text = dsValues.from + ' - ' + dsValues.to;
      dateEl.isPlaceholder = false;

      // diagrams have to be inserted later because the div element does not yet exist
    }

    // insert area-specific pages
    pagesToInsert = JSON.parse(JSON.stringify(pagesToInsert));
    for (const page of pagesToInsert) page.id = this.reportingService.nextTemplatePageId();
    this.reportingService.clonedTemplate.pages.splice(
      this.indexOfFirstAreaSpecificPage,
      0,
      ...pagesToInsert
    );
  }

  updateAreasForReachabilityTemplates(newVal) {
    // we only have one timestamp here (the most recent one)
    const pagesToInsert: any[] = [];
    for (const area of newVal) {
      // get pages to insert from untouched template
      const landscapePageToInsert: any = this.reportingService.getAreaSpecificPageClone(
        this.indexOfFirstAreaSpecificPage
      );
      landscapePageToInsert.area = area.name;
      landscapePageToInsert.id = this.reportingService.nextTemplatePageId();
      pagesToInsert.push(landscapePageToInsert);

      const portraitPageToInsert: any = this.reportingService.getAreaSpecificPageClone(
        this.indexOfFirstAreaSpecificPage + 1
      );
      portraitPageToInsert.area = area.name;
      portraitPageToInsert.id = this.reportingService.nextTemplatePageId();
      pagesToInsert.push(portraitPageToInsert);
    }

    // sort alphabetically by area name
    pagesToInsert.sort((a, b) => {
      const textA = a.area.toLowerCase();
      const textB = b.area.toLowerCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });

    // we select the most recent timestamp programmatically and don't allow user to change it, so this should be 1 here
    if (this.selectedTimestamps.length === 1) {
      // setup pages before inserting
      for (const pageToInsert of pagesToInsert) {
        const titleEl = pageToInsert.pageElements.find((el) => {
          return el.type.includes('indicatorTitle-');
        });
        titleEl.text = 'Entfernungen fÃ¼r ' + this.selectedPoiLayer.datasetName;
        if (pageToInsert.area) {
          titleEl.text += ', ' + pageToInsert.area;
        }
        titleEl.isPlaceholder = false;

        const subtitleEl = pageToInsert.pageElements.find((el) => {
          return el.type.includes('reachability-subtitle-');
        });
        subtitleEl.text = this.selectedTimestamps[0].name;
        if (this.isochrones)
          subtitleEl.text += ', ' + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
        if (this.selectedIndicator) subtitleEl.text += ', ' + this.selectedIndicator.indicatorName;
        subtitleEl.isPlaceholder = false;

        // diagrams have to be inserted later because the div element does not yet exist
      }

      // create a deep copy so we can assign new ids
      //pagesToInsert = JSON.parse(JSON.stringify(pagesToInsert));
      const numberOfPagesToReplace = this.reportingService.clonedTemplate.pages.length - 2; // basically everything until the end of the template (-2 because we start at second page)
      // insert area-specific pages
      for (const page of pagesToInsert) page.id = this.reportingService.nextTemplatePageId();

      this.reportingService.clonedTemplate.pages.splice(
        this.indexOfFirstAreaSpecificPage,
        numberOfPagesToReplace,
        ...pagesToInsert
      );
    }
  }

  // internal array changes do not work with ng-change
  async onSelectedTimestampsChanged(newVal, oldVal) {
    const mappedNewVal = newVal.map((e) => e.name);
    const mappedOldVal = oldVal.map((e) => e.name);

    if (typeof this.reportingService.clonedTemplate === 'undefined') return;
    this.loadingData = true;
    this.preparationNeeded = true;

    // get difference between old and new value (the timestamps selected / deselected)
    const difference = oldVal
      .filter((x) => !mappedNewVal.includes(x.name))
      .concat(newVal.filter((x) => !mappedOldVal.includes(x.name)));

    this.selectedTimestamps = newVal;

    // if selected
    if (newVal.length > oldVal.length) {
      // if this was the first timestamp
      if (newVal.length === 1) {
        // no need to insert pages, we just replace the placeholder timestamp
        for (const page of this.reportingService.clonedTemplate.pages) {
          for (const pageElement of page.pageElements) {
            if (pageElement.type.includes('dataTimestamp-')) {
              pageElement.text = difference[0].name;
              pageElement.isPlaceholder = false;
            }
          }
        }
      }

      if (newVal.length > 1) {
        for (const timestampToInsert of difference) {
          // setup pages to insert first
          const pagesToInsert = this.reportingService.getTemplatePagesForReinsert();
          for (const page of pagesToInsert) {
            page.id = this.reportingService.nextTemplatePageId();
          }
          // insert additional page for each selected area, replace the placeholder page
          const areaSpecificPages: any[] = [];
          // copy placeholder page for each selected area
          for (const area of this.selectedAreas) {
            const tempArea: any = area;
            const page = this.reportingService.getAreaSpecificPageClone(
              this.indexOfFirstAreaSpecificPage
            );
            page.area = tempArea.name;
            page.id = this.reportingService.nextTemplatePageId();
            areaSpecificPages.push(page);

            // repeat for the same area page with other orientation
            const page_otherOrientation = this.reportingService.getAreaSpecificPageClone(
              this.indexOfFirstAreaSpecificPage + 1
            );
            page_otherOrientation.area = area.name;
            page_otherOrientation.id = this.reportingService.nextTemplatePageId();
            areaSpecificPages.push(page_otherOrientation);
          }

          // sort alphabetically by area name
          areaSpecificPages.sort((a, b) => {
            const textA = a.area.toLowerCase();
            const textB = b.area.toLowerCase();
            return textA < textB ? -1 : textA > textB ? 1 : 0;
          });

          // remove two placeholders due to 2 orientations
          pagesToInsert.splice(this.indexOfFirstAreaSpecificPage, 2, ...areaSpecificPages);

          // setup pages before inserting them
          for (const pageToInsert of pagesToInsert) {
            for (const pageElement of pageToInsert.pageElements) {
              if (pageElement.type.includes('indicatorTitle-')) {
                pageElement.text =
                  this.selectedIndicator.indicatorName + ' [' + this.selectedIndicator.unit + ']';
                if (pageToInsert.area) {
                  pageElement.text += ', ' + pageToInsert.area;
                }
                pageElement.isPlaceholder = false;
              }

              if (pageElement.type.includes('dataTimestamp-')) {
                pageElement.text = timestampToInsert.name;
                pageElement.isPlaceholder = false;
              }
            }
          }

          // determine position to insert pages (ascending timestamps) and insert them
          // iterate pages and check timestamp for each one
          let pagesInserted = false;
          for (let i = this.reportingService.clonedTemplate.pages.length - 1; i >= 0; i--) {
            //iterate in reverse because we might extend the array while iterating
            const page = this.reportingService.clonedTemplate.pages[i];

            for (const pElement of page.pageElements) {
              if (pElement.type.includes('dataTimestamp-')) {
                // compare timestamps
                const date1 = timestampToInsert.name;
                const date2 = pElement.text;
                const date1Updated = new Date(date1.replace(/-/g, '/'));
                const date2Updated = new Date(date2.replace(/-/g, '/'));

                // if page timestamp is newer than difference timestamp
                if (date1Updated > date2Updated) {
                  // insert pages before pages with that timestamp
                  // i+1 because we want to insert after the page that has the older timestamp
                  this.reportingService.clonedTemplate.pages.splice(i + 1, 0, ...pagesToInsert);

                  pagesInserted = true;
                }
              }
            }

            if (pagesInserted) {
              break;
            }
          }

          if (!pagesInserted) {
            // happens if the timestamp to insert is the oldest one
            this.reportingService.clonedTemplate.pages.splice(0, 0, ...pagesToInsert); //prepend pages
          }
        }

        // in case all timestamps were added at once and none was present before we still have placeholder pages at this point
        // all other pages got prepended since we compared against an invalid date.
        // remove those pages
        for (let i = this.reportingService.clonedTemplate.pages.length - 1; i >= 0; i--) {
          //iterate in reverse because we might extend the array while iterating
          const page = this.reportingService.clonedTemplate.pages[i];
          for (const pElement of page.pageElements) {
            if (pElement.type.includes('dataTimestamp-')) {
              if (pElement.isPlaceholder) {
                this.reportingService.clonedTemplate.pages.splice(i, 1);
              }
            }
          }
        }
      }
    }

    // if deselected (including the case where the last remaining timestamp was removed:
    // `difference` then covers every previously-selected timestamp, so the same per-timestamp
    // filter below removes all of their pages too)
    if (newVal.length < oldVal.length) {
      // remove all pages that belong to removed timestamps
      for (const timestampToRemove of difference) {
        this.reportingService.clonedTemplate.pages =
          this.reportingService.clonedTemplate.pages.filter((page) => {
            const timestampEl = page.pageElements.find((el) => {
              return el.type.includes('dataTimestamp-');
            });

            return timestampEl ? timestampEl.text != timestampToRemove.name : true;
          });
      }
    }

    // There is one more special case for the reachbility template, where we only have one timestamp set at all times,
    // but that one might change if we change the spatial unit
    if (
      newVal.length === oldVal.length &&
      newVal.length === 1 &&
      newVal[0].name != oldVal[0].name
    ) {
      // simply update the timestamp on all pages
      for (const page of this.reportingService.clonedTemplate.pages) {
        for (const pageElement of page.pageElements) {
          if (pageElement.type.includes('reachability-subtitle-')) {
            pageElement.text = newVal[0].name;
            if (this.isochrones)
              pageElement.text += ', ' + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
            if (this.selectedIndicator)
              pageElement.text += ', ' + this.selectedIndicator.indicatorName;
          }
          break;
        }
      }
    }

    // skip automatic diagram update; page/diagram generation only starts once the
    // user clicks "Vorschau & Report-Seiten generieren"
    this.loadingData = false;
  }

  reportingConfigureNewIndicatorShown() {
    this.initialize();
  }

  reportingConfigureNewPoiLayerShown() {
    this.initialize();
  }

  sortByindicatorName(a, b) {
    if (a.indicatorName > b.indicatorName) return 1;
    else return -1;
  }

  sortByDatasetName(a, b) {
    if (a.datasetName > b.datasetName) return 1;
    else return -1;
  }

  initializeDualLists() {
    this.dualListTimestampsOptions = {
      label: 'Zeitpunkte',
      boxItemsHeight: 'md',
      items: [],
      button: { leftText: 'Alle auswÃ¤hlen', rightText: 'Alle entfernen' },
      selectedItems: [],
    };

    this.dualListSpatialUnitsOptions = {
      label: 'Raumebenen',
      boxItemsHeight: 'md',
      items: [],
      button: { leftText: 'Alle auswÃ¤hlen', rightText: 'Alle entfernen' },
      selectedItems: [],
    };
  }

  queryMostRecentGeoresourceFeatures(georesource) {
    // Most likely this is only a temporary method
    // It checks the availablePeriodsOfValidity and takes the most recent one to query features.

    const timestamp = georesource.availablePeriodsOfValidity.at(-1).startDate;
    const timestampSplit = timestamp.split('-');
    const year = timestampSplit[0];
    const month = timestampSplit[1];
    const day = timestampSplit[2];

    let url = this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource();
    url += '/georesources/' + georesource.georesourceId + '/' + year + '/' + month + '/' + day;

    return this.httpClient.get(url);
  }

  async onSpatialUnitChanged() {
    this.selectedSpatialUnit = this.spatialUnitSelect.value;
    this.loadingData = true;
    this.preparationNeeded = true;
    this.displayableIndicatorsByNameReachability = this.indicatorStore.displayableIndicators
      .filter(
        (e: any) =>
          e.applicableSpatialUnits &&
          e.applicableSpatialUnits.some(
            (su: any) => su.spatialUnitId === this.selectedSpatialUnit.spatialUnitId
          )
      )
      .sort(this.sortByindicatorName);

    $('#reporting-spatialUnitChangeWarning').hide();
    this.timeseriesAdjustedOnSpatialUnitChange = false;
    await this.updateAreasInDualList(false); // after that spatialUnitFeatures are available
    // kommonitorLeafletScreenshotCacheHelperService.clearScreenshotMap();

    // a rapid second spatial-unit change before this fires must not run both callbacks
    // concurrently against the same mutable selection/template state
    clearTimeout(this.spatialUnitChangeTimeoutHandle);
    this.spatialUnitChangeTimeoutHandle = setTimeout(async () => {
      let validTimestamps: any = [];
      // There might be different valid timestamps for the new spatial unit.
      if (this.selectedIndicator) {
        validTimestamps = this.getValidTimestampsForSpatialUnit(this.selectedSpatialUnit);

        // Check if the currently selected timestamps are also available for the new spatial unit.
        // If one is not, deselect is and show an info to user
        const selectedTimestamps_old = [...this.selectedTimestamps];
        this.selectedTimestamps = this.selectedTimestamps.filter((el: any) => {
          return validTimestamps.includes(el.name);
        });
        // if any timestamp was deselected show a warning alert
        // except for reachability template, it doesn't matter there
        if (
          selectedTimestamps_old.length > this.selectedTimestamps.length &&
          !this.reportingService.clonedTemplate.name.includes('-reachability')
        ) {
          $('#reporting-spatialUnitChangeWarning').show();
        }
      } else {
        // without selected indicator we have to fall back to the last update of the new spatial unit
        const mostRecentTimestampName = this.selectedSpatialUnit.metadata.lastUpdate;
        validTimestamps.push(mostRecentTimestampName);
      }

      if (this.reportingService.clonedTemplate.name.includes('timeseries')) {
        // Similar procedure as with timestamps
        const oldTimeseries = this.getFormattedDateSliderValues(true);

        const dateSliderDate = this.getFormatedSliderReturn();
        const from = new Date(dateSliderDate.from);
        const to = new Date(dateSliderDate.to);
        const filteredTimeseries = validTimestamps.filter((el) => {
          const date = new Date(el);
          date.setHours(0); // remove time-offset...TODO is there a better way?
          return from <= date && date <= to;
        });

        const isEqualTimeseries =
          oldTimeseries.dates.length == filteredTimeseries.length &&
          oldTimeseries.dates.every(function (element, index) {
            return element === filteredTimeseries[index];
          });

        if (!isEqualTimeseries) {
          // timeseries changed
          $('#reporting-spatialUnitChangeWarning').show();
          // try to set slider to previously selected timestamps
          if (
            validTimestamps.includes(oldTimeseries.from) &&
            validTimestamps.includes(oldTimeseries.to)
          ) {
            //this.dateSlider = this.initializeDateRangeSlider( validTimestamps, filteredTimeseries[0], filteredTimeseries.at(-1));
          } else {
            //this.dateSlider = this.initializeDateRangeSlider( validTimestamps );
            this.timeseriesAdjustedOnSpatialUnitChange = true; // show additional text in warning alert
          }
        } else {
          // the selected part of the timeseries has the same dates so we don't have to show a warning
          // but the timeseries could still include older or newer dates
          this.dateSlider = this.initializeDateRangeSlider(
            validTimestamps,
            filteredTimeseries[0],
            filteredTimeseries.at(-1)
          );
        }
      }

      // prepare arrays for updateDualList
      validTimestamps = validTimestamps.map((el) => {
        return {
          properties: {
            NAME: el,
          },
        };
      });
      const timestampsToSelect = this.selectedTimestamps.map((el) => {
        return {
          properties: {
            NAME: el.name,
          },
        };
      });

      //this.updateDualList(this.dualListTimestampsOptions, validTimestamps, timestampsToSelect);

      this.selectedTimestamps = timestampsToSelect;
      // fire $watch('selectedAreas') function manually to remove pages
      this.selectedAreas = [];
      await this.onSelectedAreasChanged(this.selectedAreas);
      // updateAreasInDualList does not trigger diagram updates
      // we have the wrong geometries set at this point, causing area selection to fail.
      // echarts requires properties.name to be present, create it from properties.NAME unless it exists
      let features;
      if (this.reportingService.clonedTemplate.name.includes('reachability')) {
        if (this.selectedIndicator) {
          features = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName];
        } else {
          features = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitLevel];
        }
        features = createLowerCaseNameProperty(features);
        this.geoJsonForReachability = { features: features };
      } else {
        features = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName];
        features = createLowerCaseNameProperty(features);
        const geoJSON = { features: features };
        this.selectedIndicator.geoJSON = geoJSON;
      }

      // no need to check if diagrams are prepared here since we have to prepare them again anyway
      setTimeout(async () => {
        // prepare diagrams for all selected timestamps with all features
        // Preparing all diagrams is not possible without an indicator, which might happen in the reachability template
        // User selects a poi layer first and we set the most recent timestamp programmatically, triggering this function without selected Indicator
        // We only need an echarts geoMap to show isochrones, POIs and spatial unit borders
        if (this.selectedIndicator) {
          if (this.reportingService.clonedTemplate.name.includes('reachability')) {
            this.reachabilityTemplateGeoMapOptions = this.prepareReachabilityEchartsMap();
          } else if (this.reportingService.clonedTemplate.name.includes('timeseries')) {
            const values = this.getFormattedDateSliderValues(true);
            let classifyUsingWholeTimeseries = false;
            let isTimeseries = true;
            this.prepareDiagrams(
              this.selectedIndicator,
              this.selectedSpatialUnit,
              values.to,
              classifyUsingWholeTimeseries,
              isTimeseries,
              values.from,
              values.to
            );
            // prepare diagrams again for most recent timestamp of slider and for whole timeseries (changes).
            classifyUsingWholeTimeseries = true;
            isTimeseries = false;
            this.prepareDiagrams(
              this.selectedIndicator,
              this.selectedSpatialUnit,
              values.to,
              classifyUsingWholeTimeseries,
              isTimeseries,
              undefined,
              undefined
            );
          } else {
            for (const timestamp of this.selectedTimestamps) {
              const classifyUsingWholeTimeseries = false;
              const isTimeseries = false;
              this.prepareDiagrams(
                this.selectedIndicator,
                this.selectedSpatialUnit,
                timestamp.name,
                classifyUsingWholeTimeseries,
                isTimeseries,
                undefined,
                undefined
              );
            }
          }
        } else {
          this.reachabilityTemplateGeoMapOptions = this.prepareReachabilityEchartsMap();
        }

        // page/diagram generation only starts once the user clicks
        // "Vorschau & Report-Seiten generieren"
        this.loadingData = false;
      });
    }, 1000);
  }

  async updateAreasInDualList(selectAll = true) {
    // this happens for the reachability template on poi selection
    if (typeof this.selectedIndicator === 'undefined') {
      // no indicator selected (reachability/POI flow) -- fall back to the reachability
      // spatial unit list instead of dereferencing the indicator that doesn't exist here
      const spatialUnit = this.selectedSpatialUnit
        ? this.selectedSpatialUnit
        : this.allSpatialUnitsForReachability?.[0];

      const response: any = await firstValueFrom(this.queryFeatures(undefined, spatialUnit));
      this.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitLevel] = response.features;
      const allAreas = this.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitLevel];
      this.updateAreasDualList(allAreas, selectAll ? allAreas : undefined);
    } else {
      const indicator = this.selectedIndicator;

      const spatialUnit = this.selectedSpatialUnit
        ? this.selectedSpatialUnit
        : this.selectedIndicator.applicableSpatialUnits[0];
      const indicatorId = indicator.indicatorId;

      // on indicator change
      if (this.availableFeaturesBySpatialUnit.indicatorId != indicator.indicatorId) {
        // clear all cached features
        this.availableFeaturesBySpatialUnit = {};
        this.availableFeaturesBySpatialUnit.indicatorId = indicatorId;
      }

      const response: any = await firstValueFrom(this.queryFeatures(indicatorId, spatialUnit));
      // save response to scope to avoid further requests
      this.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName] = response.features;
      const allAreas = this.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName];
      // items loaded; full selection (select-all) is applied by the caller after this returns
      this.updateAreasDualList(allAreas, undefined);
    }
  }

  queryFeatures(indicatorId, spatialUnit) {
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
    // send request
    return this.httpClient.get(url);
  }

  onUpdatedManualSelectedAreas(event: any) {
    this.onSelectedAreasChanged(event);
  }

  async onUpdatedManualSelectedTimestamps(event: any) {
    await this.onSelectedTimestampsChanged(event, this.selectedTimestamps);
  }

  updateTimestampsDualList(data, selectedItems) {
    let dualListInput = data.map((el, i) => {
      return { name: el.properties.NAME, id: i }; // we need this as an object for IndicatorValueService.createDualListInputArray
    });
    dualListInput = this.indicatorValueService.createDualListInputArray(
      dualListInput,
      'name',
      'id'
    );

    let newSelectedItems: any[] = [];
    // if there are items to select
    if (selectedItems && selectedItems.length > 0) {
      if (data.length === selectedItems.length) {
        const dualListSelected = selectedItems.map((el, i) => {
          return { name: el.properties.NAME, id: i };
        });
        newSelectedItems = this.indicatorValueService.createDualListInputArray(
          dualListSelected,
          'name',
          'id'
        );
      } else {
        const items: any[] = [];
        let index: number = 0;
        for (const item of selectedItems) {
          if (Object.prototype.hasOwnProperty.call(item, 'properties')) {
            if (Object.prototype.hasOwnProperty.call(item.properties, 'NAME')) {
              items.push({ name: item.properties.NAME, id: index });
              index++;
            }
          }
        }
        newSelectedItems = this.indicatorValueService.createDualListInputArray(items, 'name', 'id');
      }
    }

    // Replace the object reference so Angular detects the [data] input change
    this.dualListTimestampsOptions = {
      ...this.dualListTimestampsOptions,
      items: dualListInput,
      selectedItems: newSelectedItems,
    };
    this.reloadTimestampsDualList = !this.reloadTimestampsDualList;
  }

  updateAreasDualList(data, selectedItems) {
    let dualListInput = data.map((el, i) => {
      return { name: el.properties.NAME, id: i };
    });
    dualListInput = this.indicatorValueService.createDualListInputArray(
      dualListInput,
      'name',
      'id'
    );

    let newSelectedItems: any[] = [];
    if (selectedItems && selectedItems.length > 0) {
      if (data.length === selectedItems.length) {
        const dualListSelected = selectedItems.map((el, i) => {
          return { name: el.properties.NAME, id: i };
        });
        newSelectedItems = this.indicatorValueService.createDualListInputArray(
          dualListSelected,
          'name',
          'id'
        );
      } else {
        const items: any[] = [];
        let index: number = 0;
        for (const item of selectedItems) {
          if (Object.prototype.hasOwnProperty.call(item, 'properties')) {
            if (Object.prototype.hasOwnProperty.call(item.properties, 'NAME')) {
              items.push({ name: item.properties.NAME, id: index });
              index++;
            }
          }
        }
        newSelectedItems = this.indicatorValueService.createDualListInputArray(items, 'name', 'id');
      }
    }

    // Replace the object reference so Angular detects the [data] input change
    // (mutation alone only triggers ngOnChanges via the reload toggle, which can
    // miss updates if Zone.js doesn't run a CD cycle between the assignments)
    this.dualListAreasOptions = { items: dualListInput, selectedItems: newSelectedItems };
    this.reloadAreasDualList = !this.reloadAreasDualList;
  }

  // availableFeaturesBySpatialUnit has to be populated before this method is called.
  // Also it is only called in situations where an indicator is selected.
  getValidTimestampsForSpatialUnit(spatialUnit) {
    const validTimestamps: any = []; // result
    // Iterate all features and add all properties that start with "DATE_" to 'validTimestamps'
    const features = this.availableFeaturesBySpatialUnit[spatialUnit.spatialUnitName];
    if (!features) {
      const error = new Error('Tried to get valid timestamps but no features were cached.');
      this.mapErrorNotificationService.displayMapApplicationError(error.message);
    }
    for (const feature of features) {
      let props = Object.keys(feature.properties);
      props = props.filter((prop) => {
        return prop.startsWith('DATE_');
      });

      for (const prop of props) {
        const timestamp = prop.replace('DATE_', '');
        if (!validTimestamps.includes(timestamp)) {
          validTimestamps.push(timestamp);
        }
      }
    }

    return validTimestamps;
  }

  addIsochronesBboxProperties() {
    // Calculates and adds a bbox property for each feature and for overall layer
    // These do not exist if the type of movement is "buffer" ( = isochrones not generated by ors)

    const overallBbox: any[] = [];
    const features = this.isochrones.features;
    for (let i = 0; i < this.isochrones.features.length; i++) {
      // calculate bbox for feature
      if (!features[i].bbox || !features[i].bbox.length) {
        features[i].properties.bbox = turf.bbox(features[i]);
      }

      // check if we have to adjust overall bbox
      if (overallBbox.length === 0) {
        overallBbox.push(...features[i].properties.bbox);
      } else {
        const bbox = features[i].properties.bbox;
        overallBbox[0] = bbox[0] < overallBbox[0] ? bbox[0] : overallBbox[0];
        overallBbox[1] = bbox[1] < overallBbox[1] ? bbox[1] : overallBbox[1];
        overallBbox[2] = bbox[2] > overallBbox[2] ? bbox[2] : overallBbox[2];
        overallBbox[3] = bbox[3] > overallBbox[3] ? bbox[3] : overallBbox[3];
      }
    }

    this.isochrones.bbox = overallBbox;
  }

  addIsochronesCenterLocationProperty() {
    this.isochrones.centerLocations = [];
    // We probably have multiple isochrones with the same center.
    // Keep track of the value property and only calculate center coords once per isochrones group.
    const firstIsochroneRangeValue = this.isochrones.features[0].properties.value;
    for (const feature of this.isochrones.features) {
      if (feature.properties.value === firstIsochroneRangeValue) {
        // bbox format: [lower left lon, lower left lat, upper right lon, upper right lat]
        if (!feature.properties.bbox) {
          const bbox = turf.bbox(feature); // calculate bbox for each feature
          feature.properties.bbox = bbox;
        }
        const bbox = feature.properties.bbox;
        const centerLon = bbox[0] + (bbox[2] - bbox[0]) / 2;
        const centerLat = bbox[1] + (bbox[3] - bbox[1]) / 2;
        this.isochrones.centerLocations.push([centerLon, centerLat]);
      }
    }
  }

  reportingIsochronesCalculationStarted() {
    this.loadingData = true;
  }

  async reportingIsochronesCalculationFinished([isochrones]) {
    this.isochrones = isochrones;

    // this.typeOfMovement = this.isochrones.metadata.query.profile;
    this.typeOfMovement = this.reachabilityStateService.settings.transitMode;

    if (this.typeOfMovement === 'buffer') {
      this.isochronesRangeType = 'distance';
      this.isochronesRangeUnits = 'm';
    } else {
      // this.isochronesRangeType = this.isochrones.metadata.query.range_type;
      // this.isochronesRangeUnits = this.isochrones.metadata.query.units;
      this.isochronesRangeType = this.reachabilityStateService.settings.focus;
      this.isochronesRangeUnits = this.isochronesRangeType == 'distance' ? 'm' : 's';
    }

    // for type buffer the bbox field doesn't exist, so we have to create it.
    this.addIsochronesBboxProperties();
    if (!this.isochrones.centerLocations) this.addIsochronesCenterLocationProperty();

    // Add a new property that is used as a unique id and can be used by echarts
    // For buffer there is no group_index, so we use the ID
    if (this.typeOfMovement === 'buffer') {
      for (const feature of this.isochrones.features) {
        feature.properties.echartsId = feature.properties.ID + '-' + feature.properties.value;
      }
    } else {
      for (const feature of this.isochrones.features) {
        feature.properties.echartsId =
          feature.properties.group_index + '-' + feature.properties.value;
      }
    }

    this.isochronesSeriesData = this.convertIsochronesToSeriesData(this.isochrones);

    this.showResetIsochronesBtn = true;

    // TODO performance could be improved if we just iterate pages and update echarts
    await this.initializeAllDiagrams();
    this.loadingData = false;
  }

  async resetIsochrones() {
    this.isochrones = undefined;
    this.typeOfMovement = undefined;
    this.isochronesRangeType = undefined;
    this.isochronesRangeUnits = undefined;
    this.isochronesSeriesData = undefined;
    // TODO performance could be improved if we just iterate pages and update echarts
    if (this.diagramsPrepared) {
      await this.initializeAllDiagrams();
    }
    this.showResetIsochronesBtn = false;
  }

  //async
  async onPoiLayerSelected(poiLayer) {
    try {
      this.preparationNeeded = true;
      this.absoluteLabelPositions = [];
      this.diagramsPrepared = false;
      this.isFirstUpdateOnIndicatorOrPoiLayerSelection = true;
      this.selectedPoiLayer = poiLayer;

      this.queryMostRecentGeoresourceFeatures(this.selectedPoiLayer)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.selectedPoiLayer!.geoJSON = response;
          },
          error: (error) => {
            this.loadingData = false;
            this.mapErrorNotificationService.displayMapApplicationError(error);
            console.error(error);
          },
        });

      // reachability config requires this new property
      this.selectedPoiLayer.geoJSON_reachability = this.selectedPoiLayer.geoJSON;

      this.broadcastService.broadcast(BroadcastMessage.ReportingPoiLayerSelected, [
        this.selectedPoiLayer,
      ]);

      // get a new template (in case another poi layer was selected previously)
      // Indicator might not be selected at this point, so we take all available
      // spatial units instead of the applicable ones.
      const spatialUnits: any = this.spatialUnitStore.availableSpatialUnits;
      this.allSpatialUnitsForReachability = spatialUnits; // needed for spatial unit selection in 3rd tab
      if (!this.selectedSpatialUnit) {
        this.selectedSpatialUnit = this.spatialUnitStore.availableSpatialUnits[0];
        this.spatialUnitSelect = new FormControl(this.selectedSpatialUnit);
        await this.updateAreasInDualList(); // this populates availableFeaturesBySpatialUnit
      }

      setTimeout(() => {
        let mostRecentTimestampName;
        if (this.selectedSpatialUnit.metadata) {
          mostRecentTimestampName = this.selectedSpatialUnit.metadata.lastUpdate;
        } else {
          // Happens when poiLayer is changed after an indicator was selected
          // ( = spatial unit is the one from the indicator endpoint, not the spatial unit endpoint)
          mostRecentTimestampName = this.allSpatialUnitsForReachability.filter((spatialUnit) => {
            return spatialUnit.spatialUnitId === this.selectedSpatialUnit.spatialUnitId;
          })[0].metadata.lastUpdate;
        }
        this.selectedTimestamps = [
          {
            category: mostRecentTimestampName,
            name: mostRecentTimestampName,
          },
        ];

        // update information in preview
        for (const page of this.reportingService.clonedTemplate.pages) {
          for (const el of page.pageElements) {
            if (el.type.includes('indicatorTitle-')) {
              el.text = 'Entfernungen fÃ¼r ' + this.selectedPoiLayer.datasetName;
              el.isPlaceholder = false;
              // no area-specific pages in template since diagrams are not prepared yet
              // and area/timestamp/timeseries changes are done after that
            }

            if (el.type.includes('reachability-subtitle-')) {
              el.text = this.selectedTimestamps[0].name;
              if (this.isochrones)
                el.text += ', ' + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
              if (this.selectedIndicator) el.text += ', ' + this.selectedIndicator.indicatorName;
              el.isPlaceholder = false;
            }
          }
        }

        // get all features of largest spatial unit
        let features;
        if (this.selectedIndicator) {
          features = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName];
        } else {
          features = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitLevel];
        }
        features = createLowerCaseNameProperty(features);
        // we might have no indicator so we store the geometries directly on the scope
        this.geoJsonForReachability = {
          features: features,
        };

        // Preparing all diagrams is not possible without an indicator
        // We only need an echarts geoMap to show isochrones, POIs and spatial unit borders
        this.reachabilityTemplateGeoMapOptions = this.prepareReachabilityEchartsMap();

        // select all areas by default
        let allAreas;
        if (this.selectedSpatialUnit.spatialUnitName) {
          allAreas = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName];
        } else {
          allAreas = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitLevel];
        }

        // select all areas by default
        let areasListInput = allAreas.map((el, i) => {
          return { name: el.properties.NAME, id: i }; // we need this as an object for IndicatorValueService.createDualListInputArray
        });
        areasListInput = this.indicatorValueService.createDualListInputArray(
          areasListInput,
          'name',
          'id'
        );

        this.selectedAreas = areasListInput;

        this.initReachabilityTemplate();

        const allTabs: any = document.querySelectorAll('#reporting-add-indicator-tab-list li');
        for (const tab of allTabs) {
          this.enableTab(tab);
        }

        // mark that preparation is required; actual page/diagram generation only
        // starts once the user clicks "Vorschau & Report-Seiten generieren"
        this.preparationNeeded = true;
        this.loadingData = false;
      }, 1000);
    } catch (error) {
      console.error(error);
      this.mapErrorNotificationService.displayMapApplicationError(error);
      this.loadingData = false;
    }
  }

  initReachabilityTemplate() {
    // to make things easier we remove all area-specific pages and recreate them using newVal
    // this approach is not optimized for performance and might have to change in the future

    let numberOfTargetSpatialUnitFeatures = 0;
    if (this.selectedAreas && this.selectedAreas.length) {
      numberOfTargetSpatialUnitFeatures = this.selectedAreas.length;
    }
    // reset leaflet screenshot helper service according to new  number of selected areas
    // add one page to display the total map of all selected spatial unit features
    numberOfTargetSpatialUnitFeatures++;
    this.leafletScreenshotCacheHelperService.resetCounter(numberOfTargetSpatialUnitFeatures, false);

    if (this.reportingService.clonedTemplate.name.includes('timestamp'))
      this.updateAreasForTimestampTemplates(this.selectedAreas);
    if (this.reportingService.clonedTemplate.name.includes('timeseries'))
      this.updateAreasForTimeseriesTemplates(this.selectedAreas);
    if (this.reportingService.clonedTemplate.name.includes('reachability'))
      this.updateAreasForReachabilityTemplates(this.selectedAreas);
  }

  calculateOverallBoundingBoxFromGeoJSON(features) {
    const result: any[] = [];
    for (const feature of features) {
      // check if we have to modify our overall bbox (result)
      if (result.length === 0) {
        // for first feature
        result.push(...feature.properties.bbox);
        continue;
      } else {
        // all other features
        const bbox = feature.properties.bbox;
        result[0] = bbox[0] < result[0] ? bbox[0] : result[0];
        result[1] = bbox[1] < result[1] ? bbox[1] : result[1];
        result[2] = bbox[2] > result[2] ? bbox[2] : result[2];
        result[3] = bbox[3] > result[3] ? bbox[3] : result[3];
      }
    }
    // changed here due to "invalid boundingCoords" error
    //return result;
    return [
      [result[0], result[3]],
      [result[2], result[1]],
    ];
  }

  setMostRecentIndicatorDataToReachabilityMap(seriesOptions) {
    const mostRecentTimestampName = this.selectedIndicator.applicableDates.at(-1);
    let features;
    if (this.selectedSpatialUnit.spatialUnitName) {
      features = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName];
    } else {
      features = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitLevel];
    }
    const newSeriesData = features.map((feature) => {
      const name = feature.properties.NAME;
      let value = feature.properties['DATE_' + mostRecentTimestampName];
      value = Math.round(value * 100) / 100;
      return {
        name: name,
        value: value,
      };
    });
    seriesOptions.data = newSeriesData;
    return seriesOptions;
  }

  async resetOptionalIndicator() {
    if (!this.selectedIndicator) {
      return;
    }

    this.selectedIndicator = undefined;
    // since we don't have an indicator selected anymore we reset the spatial unit
    this.selectedSpatialUnit = this.allSpatialUnitsForReachability.filter((spatialUnit) => {
      return spatialUnit.spatialUnitLevel === this.selectedSpatialUnit.spatialUnitName;
    })[0];

    // let filter = this.selectedIndicator.applicableSpatialUnits.filter( spatialUnit => {
    // 	return spatialUnit.spatialUnitName === this.selectedSpatialUnit.spatialUnitLevel;
    // })
    // this.selectedSpatialUnit = filter[0];

    for (let i = 0; i < this.reportingService.clonedTemplate.pages.length; i++) {
      const page = this.reportingService.clonedTemplate.pages[i];
      for (const pageElement of page.pageElements) {
        if (pageElement.type === 'map') {
          const domNode: any = document.querySelector('#reporting-addIndicator-page-' + i + '-map');
          if (domNode) {
            const map: any = echarts.getInstanceByDom(domNode);
            if (map) {
              const options = map.getOption();
              options.series[0].data = [];
              options.series[0].label.formatter = '{b}';
              map.setOption(options, { replaceMerge: ['series'] });
              pageElement.echartsOptions = options;
              if (page.generatedData) {
                page.generatedData.echarts[pageElement.type] = map.getDataURL({ pixelRatio: 2 });
              }
            }
          } else {
            if (page.generatedData && page.generatedData.isComplete) {
              await this.preparePageForIndicatorAdd(i, page);
            }
          }
        }

        if (pageElement.type.includes('reachability-subtitle-')) {
          pageElement.text = this.selectedTimestamps[0].name;
          if (this.isochrones) {
            pageElement.text += ', ' + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
          }

          pageElement.isPlaceholder = false;
        }
      }
    }
  }

  async handleIndicatorSelectForReachability(indicator) {
    this.selectedIndicator = indicator;
    const indicatorId = this.selectedIndicator.indicatorId;
    const featureCollection: any = await firstValueFrom(
      this.queryFeatures(indicatorId, this.selectedSpatialUnit)
    );

    this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitLevel] =
      featureCollection.features;
    const allAreas = this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitLevel];
    this.updateAreasDualList(allAreas, undefined); // don't select any areas

    if (!this.selectedSpatialUnit.spatialUnitName) {
      // set the applicable spatial unit from the indicator as selected spatial unit
      const filter = this.selectedIndicator.applicableSpatialUnits.filter((spatialUnit) => {
        return spatialUnit.spatialUnitName === this.selectedSpatialUnit.spatialUnitLevel;
      });
      if (filter && filter.length) {
        this.selectedSpatialUnit = filter[0];
      }
    }

    this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName] =
      featureCollection.features;
    this.selectedIndicator.geoJSON = featureCollection;
    this.selectedIndicator.geoJSON.features = createLowerCaseNameProperty(
      this.selectedIndicator.geoJSON.features
    );
    if (
      this.selectedIndicator.geoJSON.features[0] &&
      !this.selectedIndicator.geoJSON.features[0].properties.bbox
    ) {
      for (const feature of this.selectedIndicator.geoJSON.features) {
        const bbox = turf.bbox(feature); // calculate bbox for each feature
        feature.properties.bbox = bbox;
      }
    }

    for (let i = 0; i < this.reportingService.clonedTemplate.pages.length; i++) {
      const page = this.reportingService.clonedTemplate.pages[i];
      for (const pageElement of page.pageElements) {
        if (pageElement.type === 'map') {
          const domNode: any = document.querySelector('#reporting-addIndicator-page-' + i + '-map');
          if (domNode) {
            const map: any = echarts.getInstanceByDom(domNode);
            if (map) {
              const options: any = map.getOption();
              const seriesOptions = this.setMostRecentIndicatorDataToReachabilityMap(
                options.series[0]
              );
              options.series[0] = seriesOptions;
              options.series[0].label.formatter = '{b}\n{c}';
              map.setOption(options, { replaceMerge: ['series'] });
              pageElement.echartsOptions = options;
              if (page.generatedData) {
                page.generatedData.echarts[pageElement.type] = map.getDataURL({ pixelRatio: 2 });
              }
            }
          } else {
            if (page.generatedData && page.generatedData.isComplete) {
              await this.preparePageForIndicatorAdd(i, page);
            }
          }
        }

        if (pageElement.type.includes('reachability-subtitle-')) {
          pageElement.text = this.selectedTimestamps[0].name;
          if (this.isochrones) {
            pageElement.text += ', ' + this.isochronesTypeOfMovementMapping[this.typeOfMovement];
          }
          pageElement.text += ', ' + indicator.indicatorName;
          pageElement.isPlaceholder = false;
        }
      }
    }

    setTimeout(() => {
      this.loadingData = false;
    }, 3000);
  }

  async onIndicatorSelected() {
    const indicator = this.indicatorSelect.value;

    try {
      this.loadingData = true;
      if (this.reportingService.clonedTemplate.name.includes('reachability')) {
        await this.handleIndicatorSelectForReachability(indicator);
        return;
      }

      this.selectedIndicator = undefined;
      this.selectedTimestamps = [];
      this.selectedAreas = [];
      this.selectedSpatialUnit = undefined;
      this.availableFeaturesBySpatialUnit = {};
      this.absoluteLabelPositions = [];
      this.echartsOptions = {
        map: {},
        bar: {},
        line: {},
      };
      this.diagramsPrepared = false;
      // set indicator manually.
      // if we use ng-model it gets converted to string instead of an object
      this.selectedIndicator = indicator;

      // get a new template (in case another indicator was selected previously)
      this.reportingService.resetTemplateClone();
      this.setAreaSpecificPagesVisibility();
      for (const page of this.reportingService.clonedTemplate.pages) {
        page.id = this.reportingService.nextTemplatePageId();
      }
      this.reportingService.clonedTemplate.pageConfig = this.pageConfig;

      // set spatial unit to highest available one
      const spatialUnits = this.spatialUnitStore.availableSpatialUnits;

      // go from highest to lowest spatial unit and check if it is available.
      for (const spatialUnit of spatialUnits) {
        const applicableSpatialUnitsFiltered = this.selectedIndicator.applicableSpatialUnits.filter(
          (unit) => {
            return unit.spatialUnitId === spatialUnit.spatialUnitId;
          }
        );

        if (applicableSpatialUnitsFiltered.length === 1) {
          this.selectedSpatialUnit = applicableSpatialUnitsFiltered[0];
          this.spatialUnitSelect = new FormControl(this.selectedSpatialUnit);
          break;
        }
      }

      if (!this.selectedSpatialUnit) {
        throw new Error('No applicable spatial unit found.');
      }

      await this.updateAreasInDualList(); // this populates this.availableFeaturesBySpatialUnit

      // a rapid second indicator selection before this fires must not run both callbacks
      // concurrently against the same mutable selection/template state
      clearTimeout(this.indicatorSelectedTimeoutHandle);
      this.indicatorSelectedTimeoutHandle = setTimeout(async () => {
        // select most recent timestamp that is valid for the largest spatial unit
        const dates = this.selectedIndicator.applicableDates;
        const timestampsForSelectedSpatialUnit = this.getValidTimestampsForSpatialUnit(
          this.selectedSpatialUnit
        );
        timestampsForSelectedSpatialUnit.sort();

        const availableTimestamps = dates
          .filter((name) => {
            // filter dates to only show the ones valid for selected spatial unit
            return timestampsForSelectedSpatialUnit.includes(name);
          })
          .map((name) => {
            // then convert all timestamps to required format ("feature")
            return { properties: { NAME: name } };
          });

        const mostRecentTimestampName = timestampsForSelectedSpatialUnit.at(-1);
        const mostRecentTimestamp = availableTimestamps.filter((el) => {
          return el.properties.NAME === mostRecentTimestampName;
        });
        if (this.reportingService.clonedTemplate.name.includes('timeseries')) {
          this.initializeDateRangeSlider(timestampsForSelectedSpatialUnit, 0, 1);
        }
        // update information in preview
        for (const page of this.reportingService.clonedTemplate.pages) {
          for (const el of page.pageElements) {
            if (el.type.includes('indicatorTitle-')) {
              el.text = indicator.indicatorName + ' [' + indicator.unit + ']';
              el.isPlaceholder = false;
              // no area-specific pages in template since diagrams are not prepared yet
              // and area/timestamp/timeseries changes are done after that
            }

            if (el.type.includes('dataTimestamp-')) {
              el.text = mostRecentTimestampName;
              el.isPlaceholder = false;
            }

            if (el.type.includes('dataTimeseries-')) {
              const dsValues: any = this.getFormattedDateSliderValues(1);
              el.text = dsValues.from + ' - ' + dsValues.to;
              el.isPlaceholder = false;
            }
          }
        }

        // get all features of largest spatial unit
        let features =
          this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName];
        features = createLowerCaseNameProperty(features);
        const geoJson = {
          features: features,
        };

        // add new prop to indicator metadata, because it is expected that way by kommonitorVisualStyleHelperService
        // used in prepareDiagrams
        this.selectedIndicator.geoJSON = geoJson;
        let classifyUsingWholeTimeseries = false;
        const isTimeseries = false;
        this.prepareDiagrams(
          this.selectedIndicator,
          this.selectedSpatialUnit,
          mostRecentTimestampName,
          classifyUsingWholeTimeseries,
          isTimeseries,
          undefined,
          undefined
        );
        // We have to update time and areas. Usually both of these would result in a diagram update.
        // We want to skip the first one and only update diagrams once everything is ready for better performance.

        this.isFirstUpdateOnIndicatorOrPoiLayerSelection = true;
        if (this.reportingService.clonedTemplate.name.includes('timeseries')) {
          // This is an exception from the process above
          this.isFirstUpdateOnIndicatorOrPoiLayerSelection = false;
          classifyUsingWholeTimeseries = false;
          const values: any = this.getFormattedDateSliderValues(1);
          const isTimeseries = true;
          this.prepareDiagrams(
            this.selectedIndicator,
            this.selectedSpatialUnit,
            mostRecentTimestampName,
            classifyUsingWholeTimeseries,
            isTimeseries,
            values.from,
            values.to
          );
        } else {
          //this.updateDualList(this.dualListTimestampsOptions, availableTimestamps, mostRecentTimestamp)
          this.updateTimestampsDualList(availableTimestamps, mostRecentTimestamp);
        }

        // select all areas by default
        const allAreas =
          this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName];
        this.updateAreasDualList(allAreas, allAreas);

        const allTabs: any = document.querySelectorAll('#reporting-add-indicator-tab-list li');
        for (const tab of allTabs) {
          this.enableTab(tab);
        }

        let areasListInput = allAreas.map((el, i) => {
          return { name: el.properties.NAME, id: i }; // we need this as an object for IndicatorValueService.createDualListInputArray
        });
        areasListInput = this.indicatorValueService.createDualListInputArray(
          areasListInput,
          'name',
          'id'
        );

        let timestampsListInput = availableTimestamps.map((el, i) => {
          return { name: el.properties.NAME, id: i }; // we need this as an object for IndicatorValueService.createDualListInputArray
        });
        timestampsListInput = this.indicatorValueService.createDualListInputArray(
          timestampsListInput,
          'name',
          'id'
        );

        let timestampsListSelected = mostRecentTimestamp.map((el, i) => {
          return { name: el.properties.NAME, id: i }; // we need this as an object for IndicatorValueService.createDualListInputArray
        });
        timestampsListSelected = this.indicatorValueService.createDualListInputArray(
          timestampsListSelected,
          'name',
          'id'
        );

        this.selectedAreas = areasListInput;
        this.selectedTimestamps = timestampsListSelected;

        if (this.reportingService.clonedTemplate.name.includes('timestamp'))
          this.updateAreasForTimestampTemplates(areasListInput);
        if (this.reportingService.clonedTemplate.name.includes('timeseries'))
          this.updateAreasForTimeseriesTemplates(areasListInput);
        if (this.reportingService.clonedTemplate.name.includes('reachability'))
          this.updateAreasForReachabilityTemplates(areasListInput);

        if (this.selectedAreas.length > 0)
          this.leafletScreenshotCacheHelperService.resetCounter(
            this.selectedAreas.length + 1,
            false
          );

        // mark that preparation is required; actual page/diagram generation only
        // starts once the user clicks "Vorschau & Report-Seiten generieren"
        this.preparationNeeded = true;
        this.loadingData = false;
      }, 1000);
    } catch (error) {
      console.error(error);
      this.mapErrorNotificationService.displayMapApplicationError(error);
      this.loadingData = false;
    }
  }

  updateAreaSpecificSettings(areasListInput) {
    if (areasListInput.length < this.numAreaSpecificPagesToShow) {
      this.pageConfig.sectionControl.showAreaSpecific = true;
      this.reportingService.clonedTemplate.pageConfig = this.pageConfig;
      this.configForm.controls.sectionControl.controls.showAreaSpecific.setValue(true);
    } else {
      this.pageConfig.sectionControl.showAreaSpecific = false;
      this.reportingService.clonedTemplate.pageConfig = this.pageConfig;
      this.configForm.controls.sectionControl.controls.showAreaSpecific.setValue(false);
    }
  }

  reset() {
    this.pagePreparationIndex = 0;
    this.pagePreparationSize = 0;
    this.indicatorNameFilter = '';
    this.poiNameFilter = '';
    this.selectedIndicator = undefined;
    this.availableFeaturesBySpatialUnit = {};
    this.selectedSpatialUnit = undefined;
    this.selectedAreas = [];
    this.selectedTimestamps = [];
    this.indexOfFirstAreaSpecificPage = undefined;
    this.echartsOptions = {
      map: {},
      bar: {},
      line: {},
    };
    this.loadingData = false;
    this.reportingService.resetTemplatePageIdCounter();
    this.echartsRegisteredMapNames = [];

    for (let i = 2; i < 7; i++) {
      const tab = document.querySelector('#reporting-add-indicator-tab' + i);
      this.disableTab(tab);
    }
  }

  onAddBtnClicked() {
    const templateSection = {
      indicatorName: this.selectedIndicator ? this.selectedIndicator.indicatorName : '',
      indicatorId: this.selectedIndicator ? this.selectedIndicator.indicatorId : '',
      poiLayerName: this.selectedPoiLayer ? this.selectedPoiLayer.datasetName : '',
      georesourceId: this.selectedPoiLayer ? this.selectedPoiLayer.georesourceId : '',
      spatialUnitName:
        this.selectedSpatialUnit.spatialUnitName ?? this.selectedSpatialUnit.spatialUnitLevel,
      absoluteLabelPositions: this.absoluteLabelPositions,
      echartsRegisteredMapNames: this.echartsRegisteredMapNames,
      echartsMaps: [],
      pageConfig: jQuery.extend(true, {}, this.pageConfig),
      isochronesRangeType: this.isochronesRangeType,
      isochronesRangeUnits: this.isochronesRangeUnits,
    };

    // remove pages not visible
    this.reportingService.clonedTemplate.pages = this.reportingService.clonedTemplate.pages.filter(
      (e) => e.hidden !== true
    );

    // echarts configs / table data were already captured onto each page/pageElement by
    // preparePageForIndicatorAdd during generation (page.generatedData, pageElement.echartsOptions,
    // pageElement.tableData) â€” most pages are never rendered into the visible preview DOM (only the
    // first few area-specific/datatable pages are), so it can't be re-scraped from the DOM here.
    for (const page of this.reportingService.clonedTemplate.pages) {
      page.templateSection = templateSection;
    }

    this.reportingService.clonedTemplate.absoluteLabelPositions = this.absoluteLabelPositions;
    this.reportingService.clonedTemplate.echartsRegisteredMapNames = [
      ...new Set(this.echartsRegisteredMapNames),
    ];
    this.reportingService.clonedTemplate.isochronesRangeType = this.isochronesRangeType;
    this.reportingService.clonedTemplate.isochronesRangeUnits = this.isochronesRangeUnits;

    if (!this.reportingService.clonedTemplate.name.includes('reachability'))
      this.reportingService.addIndicatorSection(templateSection);
    else this.reportingService.addPoiSection(templateSection);

    this.reportingService.changeWorkflowState(this.workflowState.reportingOverview);
  }

  enableTab(tab: Element | null) {
    if (!tab?.firstElementChild) return;
    tab.classList.remove('tab-disabled');
    tab.firstElementChild.classList.remove('disabled');
    tab.firstElementChild.removeAttribute('tabindex');
  }

  disableTab(tab: Element | null) {
    if (!tab?.firstElementChild) return;
    tab.classList.add('tab-disabled');
    tab.firstElementChild.classList.add('disabled');
    tab.firstElementChild.setAttribute('tabindex', '-1');
  }

  // creates and returns a series data array for each range threshold
  convertIsochronesToSeriesData(isochrones) {
    const result: any[] = []; // array of series data config objects
    let ranges: any[] = [];
    if (this.checkNestedPropExists(isochrones, 'info', 'query', 'profile')) {
      ranges = isochrones.info.query.ranges.split(',');
    } else if (Object.prototype.hasOwnProperty.call(isochrones, 'features')) {
      // for buffer
      for (const feature of isochrones.features) {
        if (this.checkNestedPropExists(feature, 'properties', 'value')) {
          ranges.push(Number(feature.properties.value));
        }
      }
      ranges = [...new Set(ranges)]; // remove dupes
    }
    if (!ranges || ranges.length === 0) {
      throw new Error('Could not determine ranges from isochrones. Is the format correct?');
    }
    const rangesInt = ranges.map((e) => parseInt(e)); // assuming we only get integer values as input here
    const colorArr: any[] = [];
    if (ranges.length === 1) colorArr.push('green');
    if (ranges.length === 2) colorArr.push(...['green', 'yellow']);
    if (ranges.length === 3) colorArr.push(...['green', 'yellow', 'red']);
    if (ranges.length === 4) colorArr.push(...['green', 'yellow', 'orange', 'red']);
    // If we have more than five ranges the last color is used again for now. Can be extended if there is need for it.
    if (ranges.length >= 5) colorArr.push(...['green', 'yellow', 'orange', 'red', 'brown']);

    // one series per range value, so we can control the z value and legend display more easily.
    for (let [idx, range] of rangesInt.entries()) {
      if (idx >= colorArr.length) idx = colorArr.length - 1;
      const seriesData: any[] = [];
      const data = isochrones.features
        .filter((feature) => {
          return Number(feature.properties.value) == Number(range); // get features for this range threshold
        })
        .map((feature) => {
          return {
            name: feature.properties.echartsId,
            value: feature.properties.value,
            itemStyle: {
              areaColor: colorArr[idx],
              color: colorArr[idx],
              opacity: 0.3,
            },
            label: {
              show: false,
            },
            emphasis: {
              disabled: true,
            },
          };
        });
      seriesData.push(...data);
      result.push(seriesData);
    }

    return result;
  }

  // async
  async createMapForReachability(wrapper, page, pageElement, context: ReportGenerationContext) {
    let options = JSON.parse(JSON.stringify(this.reachabilityTemplateGeoMapOptions));
    // add indictor data if it is available
    if (this.selectedIndicator) {
      options.series[0] = this.setMostRecentIndicatorDataToReachabilityMap(options.series[0]);
      options.series[0].label.formatter = '{b}\n{c}';
    }

    // register a new echarts map with a unique name (needed when filtering by area)
    // check if there is a map registered for this combination, if not register one with all features
    let mapName = this.selectedPoiLayer.datasetName + '_' + this.selectedSpatialUnit.spatialUnitId;
    if (page.area && page.area.length) mapName += '_' + page.area;
    if (!this.echartsRegisteredMapNames.includes(mapName)) {
      echarts.registerMap(mapName, this.geoJsonForReachability);
      this.echartsRegisteredMapNames.push(mapName);
    }

    options.series[0].map = mapName;
    options.geo.map = mapName;

    // Add isochrones if possible
    // In echarts one map can only handle one series
    // But we need the isochrones in different series to control their z-indexes (show smaller isochrones above larger ones)
    // That's why we need to register one map per range threshold, that only contains a subset of isochrones.
    if (this.isochrones) {
      for (const seriesData of this.isochronesSeriesData) {
        const range = seriesData[0].value;
        const registeredMap = echarts.getMap(
          this.selectedPoiLayer.datasetName + '_isochrones-' + range
        );
        if (!registeredMap) {
          const isochrones = this.isochrones.features.filter((feature) => {
            // only weak comparison to allow string == number comparison
            return feature.properties.value == range;
          });
          const featureCollection: any = {
            features: isochrones,
          };
          echarts.registerMap(
            this.selectedPoiLayer.datasetName + '_isochrones-' + range,
            featureCollection
          );
          this.echartsRegisteredMapNames.push(
            this.selectedPoiLayer.datasetName + '_isochrones-' + range
          );
        }
      }

      const bbox = this.isochrones.bbox; // [left, bottom, right, top]
      const isochronesBboxForEcharts = [
        [bbox[0], bbox[3]],
        [bbox[2], bbox[1]],
      ]; // [left, top], [right, bottom]

      for (const [idx, seriesData] of this.isochronesSeriesData.entries()) {
        const series = {
          name: 'isochrones-' + seriesData[0].value,
          type: 'map',
          roam: false,
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          boundingCoords: isochronesBboxForEcharts,
          map: this.selectedPoiLayer.datasetName + '_isochrones-' + seriesData[0].value,
          nameProperty: 'echartsId',
          cursor: 'default',
          select: {
            disabled: true,
          },
          z: 90 - idx, // first one has smallest threshold and gets highest index
          data: seriesData,
        };
        options.series.push(series);
      }
    }

    // Add poi markers as additional series
    const centerPointSeriesData = this.selectedPoiLayer.geoJSON.features.map((feature) => {
      return feature.geometry.coordinates;
    });

    const centerPointSeries = {
      name: 'centerPoints',
      type: 'scatter',
      coordinateSystem: 'geo',
      symbol: 'image://icons/marker-icon.png',
      symbolSize: [17, 26],
      symbolOffset: [0, '-50%'],
      itemStyle: {
        opacity: 1,
      },
      cursor: 'default',
      data: centerPointSeriesData,
      label: {
        show: false,
      },
      emphasis: {
        disabled: true,
      },
      z: 200,
    };
    options.series.push(centerPointSeries);

    const map = echarts.init(wrapper);

    // label positioning
    options = this.enableManualLabelPositioningAcrossPages(page, options, map);

    map.setOption(options, {
      replaceMerge: ['series', 'geo'],
    });

    this.loadingData = false;

    return map;
  }

  // async
  async createPageElement_Map(wrapper, page, pageElement, context: ReportGenerationContext) {
    if (this.reportingService.clonedTemplate.name.includes('reachability')) {
      const map = await this.createMapForReachability(wrapper, page, pageElement, context);
      return map;
    }

    // check if there is a map registered for this combination, if not register one with all features
    let mapName: any = undefined;
    let timestamp: any = undefined;

    // get the timestamp from pageElement, not from dom because dom might not be up to date yet
    let dateElement;
    if (this.reportingService.clonedTemplate.name.includes('reachability')) {
      dateElement = page.pageElements.find((el) => {
        return el.type.includes('reachability-subtitle-');
      });
      timestamp = dateElement.text.split(',')[0];
    } else {
      // the other two templates
      dateElement = page.pageElements.find((el) => {
        // pageElement references the map here
        // do the comparison like this because we have maps with dataTimestamp and dataTimeseries in the timeseries template
        return el.type.includes(pageElement.isTimeseries ? 'dataTimeseries-' : 'dataTimestamp-');
      });

      if (pageElement.isTimeseries) {
        timestamp = dateElement.text.split(' - ')[1]; // get the recent timestamp
      } else {
        timestamp = dateElement.text;
      }
    }

    if (this.reportingService.clonedTemplate.name.includes('reachability')) {
      mapName =
        this.selectedIndicator.indicatorId +
        '_' +
        timestamp +
        '_' +
        this.selectedSpatialUnit.spatialUnitName;
    } else {
      mapName =
        this.selectedIndicator.indicatorId +
        '_' +
        dateElement.text +
        '_' +
        this.selectedSpatialUnit.spatialUnitName;
    }

    if (pageElement.classify) mapName += '_classified';
    if (pageElement.isTimeseries) mapName += '_timeseries';
    if (page.area && page.area.length) mapName += '_' + page.area;

    if (!this.echartsRegisteredMapNames.includes(mapName)) {
      echarts.registerMap(mapName, this.selectedIndicator.geoJSON);
      this.echartsRegisteredMapNames.push(mapName);
    }

    const map = echarts.init(wrapper);
    if (pageElement.isTimeseries) {
      timestamp += '_relative';
    }

    let options = JSON.parse(JSON.stringify(this.echartsOptions.map[timestamp]));

    // default changes for all reporting maps
    options.title.show = false;
    options.grid = undefined;
    options.visualMap.axisLabel = { fontSize: 10 };
    options.toolbox.show = false;
    options.visualMap.left = 'right';
    const series = options.series[0];
    series.roam = false;
    series.selectedMode = false;

    const overallBbox = this.calculateOverallBoundingBoxFromGeoJSON(
      this.selectedIndicator.geoJSON.features
    );

    // hier
    options.geo = {
      map: mapName,
      z: 1,
      itemStyle: {
        opacity: 0,
      },
      roam: false,
      boundingCoords: overallBbox,
    };

    if (pageElement.isTimeseries) {
      const includeInBetweenDates = true;
      const timeseries = this.getFormattedDateSliderValues(includeInBetweenDates);
      series.data = calculateSeriesDataForTimeseries(
        this.selectedIndicator.geoJSON.features,
        timeseries
      );
    }

    series.map = mapName; // update the map with the one registered above
    series.name = mapName;

    const areaNames = this.selectedAreas.map((el: any) => {
      return el.name;
    });

    if (pageElement.classify === true) {
      options.visualMap.show = true;
      options.visualMap.backgroundColor =
        this.pageConfig.sectionContentControl.mapLegendBackgroundColor;
    } else {
      options.visualMap.show = false;
    }

    series.data.forEach((el) => {
      el.itemStyle = el.itemStyle ? el.itemStyle : {};
      el.emphasis = el.emphasis ? el.emphasis : {};
      el.emphasis.itemStyle = el.emphasis.itemStyle ? el.emphasis.itemStyle : {};
      el.label = el.label ? el.label : {};
      el.visualMap = false;

      if (pageElement.classify === false) {
        if (areaNames.includes(el.name)) {
          // show selected areas (don't classify color by value)
          el.label.formatter = '{b}\n{c}';
          el.label.show = true;
          el.label.textShadowColor = '#ffffff';
          el.label.textShadowBlur = 2;
          el.itemStyle.areaColor = 'rgb(255, 153, 51, 0.6)';
          el.itemStyle.color = 'rgb(255, 153, 51, 0.6)';
          el.emphasis.itemStyle.areaColor = 'rgb(255, 153, 51, 0.6)';
          el.emphasis.itemStyle.color = 'rgb(255, 153, 51, 0.6)';
        } else {
          // Only show borders for any other areas
          el.itemStyle.color = 'rgba(255, 255, 255, 0)';
          el.itemStyle.areaColor = 'rgba(255, 255, 255, 0)';
          el.emphasis.itemStyle.color = 'rgba(255, 255, 255, 0)';
          el.emphasis.itemStyle.areaColor = 'rgba(255, 255, 255, 0)';
          el.label.show = false;
        }
      }

      if (pageElement.classify === true) {
        if (areaNames.includes(el.name)) {
          el.visualMap = true;
          el.label.formatter = '{b}\n{c}';
          // get color from visual map to overwrite yellow color
          let color = 'rgba(0, 0, 0, 0.5)';
          let opacity = 1;
          if (this.selectedIndicatorIsCategorical) {
            // categorical values are matched by category, not by numeric range
            color = resolveCategoricalColor(
              el.value,
              this.selectedIndicator.defaultClassificationMapping?.categoricalData ?? []
            );
          } else {
            for (const [idx, piece] of options.visualMap.pieces.entries()) {
              // for the last index (highest value) value can equal the upper boundary
              if (idx === options.visualMap.pieces.length - 1) {
                if (piece.min <= el.value && el.value <= piece.max) {
                  color = piece.color;
                  opacity = piece.opacity;
                  break;
                }
              }

              // for all other pieces check if it is withing the boundaries, (including lower one, excluding upper one)
              if (piece.min <= el.value && el.value < piece.max) {
                color = piece.color;
                opacity = piece.opacity;
                break;
              }
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
          el.itemStyle.color = 'rgb(255, 255, 255)';
          el.itemStyle.areaColor = 'rgb(255, 255, 255)';
          el.emphasis.itemStyle.color = 'rgb(255, 255, 255)';
          el.emphasis.itemStyle.areaColor = 'rgb(255, 255, 255)';
          el.label.show = false;
        }
      }
    });

    // label positioning
    options = this.enableManualLabelPositioningAcrossPages(page, options, map);

    map.setOption(options);
    pageElement.echartsOptions = options;
    return map;
  }

  enableManualLabelPositioningAcrossPages(page, options, map) {
    if (!page.area) {
      options.labelLayout = (feature) => {
        if (feature.seriesIndex != 0) {
          // index 0 are the borders / indicator
          return;
        }
        // Set fixed position for labels that were previously dragged by user
        // For all other labels try to avoid overlaps
        const names = this.absoluteLabelPositions.map((el) => el.name);
        const text = feature.text.split('\n')[0]; // area name is the first line
        if (names.includes(text)) {
          const idx = names.indexOf(text);
          return {
            x: this.absoluteLabelPositions[idx].x,
            y: this.absoluteLabelPositions[idx].y,
            draggable: true,
          };
        } else {
          return {
            moveOverlap: 'shiftY',
            x: feature.rect.x + feature.rect.width / 2,
            draggable: true,
          };
        }
      };

      options.labelLine = {
        show: true,
        showAbove: false,
        lineStyle: {
          color: '#555',
        },
      };

      map.getZr().on('mousedown', (event) => {
        // on label drag
        if (event.target) {
          const target = event.target;
          if (target.parent && target.parent.type === 'text') {
            // get the feature which this label belongs to
            // When user clicks on the label, one of the child elements is clicked
            // Child elements can be something like: first line of text, second line of text, (white) label background
            // These elements all have the same parent, which we can use to navigate to the parent and then find the correct child (area name)
            const parent = target.parent;
            let areaNameChild;
            for (const child of parent._children) {
              // we assume that the area name is the first child with text ("the first line")
              if (child.style.text && child.style.text.length > 0) {
                areaNameChild = child;
                break;
              }
            }
            this.draggingLabelForFeature = areaNameChild.style.text;
          }
        }
      });

      map.getZr().on('mouseup', (event) => {
        if (event.target) {
          const target = event.target;
          if (target.parent && target.parent.type === 'text') {
            // for all other maps, that are not area-specific, do the exact same label drag
            const newX = target.parent.x;
            const newY = target.parent.y;
            const names = this.absoluteLabelPositions.map((el: any) => el.name);
            if (names.includes(this.draggingLabelForFeature)) {
              const idx = names.indexOf(this.draggingLabelForFeature);
              this.absoluteLabelPositions[idx].x = newX;
              this.absoluteLabelPositions[idx].y = newY;
            } else {
              this.absoluteLabelPositions.push({
                name: this.draggingLabelForFeature,
                x: newX,
                y: newY,
              });
            }

            for (const [idx, page] of this.reportingService.clonedTemplate.pages.entries()) {
              for (const pageElement of page.pageElements) {
                if (pageElement.type === 'map' && !page.area) {
                  const domNode: any = document.getElementById(
                    'reporting-addIndicator-page-' + idx + '-map'
                  );
                  const map: any = echarts.getInstanceByDom(domNode);
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

  createPageElement_BarChartDiagram(wrapper, page, context: ReportGenerationContext) {
    // get timestamp from pageElement, not from dom because dom might not be up to date yet
    // barcharts are only used in timestamp templates so we don't have to check for timeseries for now
    const dateElement = page.pageElements.find((el) => {
      return el.type.includes('dataTimestamp-');
    });
    const timestamp = dateElement.text;

    const barChart = echarts.init(wrapper);
    const options = JSON.parse(JSON.stringify(this.echartsOptions.bar[timestamp]));

    // default changes
    options.xAxis.name = '';
    options.title.textStyle.fontSize = 12;
    options.title.text = '';
    options.yAxis.axisLabel = { fontSize: 10 };
    options.title.show = true;
    options.grid.top = 35;
    options.grid.bottom = 5;
    options.toolbox.show = false;
    options.visualMap[0].show = false; // only needed to set the color for avg
    // background (non-preview) pages are captured via getDataURL() immediately after
    // setOption() with no wait -- with the default animation enabled that snapshot lands
    // mid-animation (bars still near zero height), so axis/labels show but bars don't;
    // disabling animation makes setOption() render the final state synchronously
    options.animation = false;
    options.xAxis.axisLabel.show = true;
    options.yAxis.name = ''; // included in header of each page
    options.xAxis.name = ''; // always timestamps
    // black text with halo effect for better visibility
    if (!options.textStyle) options.textStyle = {};
    options.textStyle.color = 'black';
    options.textStyle.textShadowColor = '#ffffff';
    options.textStyle.textShadowBlur = 2;

    // filter series data and xAxis labels
    if (page.area && page.area.length) {
      options.series[0].data = options.series[0].data.filter((el) => {
        return el.name === page.area;
      });
      const areaNames = options.series[0].data.map((obj) => obj.name);
      options.xAxis.data = areaNames;
    } else {
      // only show selected areas in the "overview" diagram
      let areaNames = this.selectedAreas.map((obj: any) => obj.name);
      options.series[0].data = options.series[0].data.filter((el) => {
        return areaNames.includes(el.name);
      });
      areaNames = options.series[0].data.map((obj) => obj.name);
      options.xAxis.data = areaNames;
    }

    options.series[0].data.sort(function (a, b) {
      if (typeof a.value == 'number' && typeof b.value == 'number') {
        return a.value - b.value;
      } else {
        return -1;
      }
    });

    // add average bars - skipped for categorical indicators, which have no meaningful average
    if (!this.selectedIndicatorIsCategorical) {
      // add data element for the overall average
      const overallAvgValue = calculateAvg(
        this.selectedIndicator,
        timestamp,
        false,
        this.selectedAreas
      );
      const overallAvgElementName =
        page.area && page.area.length
          ? 'Durchschnitt\nder\nRaumeinheit'
          : 'Durchschnitt der Raumeinheit';
      const dataObjOverallAvg: any = {
        name: overallAvgElementName,
        value: overallAvgValue,
        opacity: 1,
      };
      // get color for avg from visual map and disable opacity
      let colorOverallAvg = '';
      for (const piece of options.visualMap[0].pieces) {
        if (piece.min <= dataObjOverallAvg.value && dataObjOverallAvg.value < piece.max) {
          colorOverallAvg = piece.color;
        }
        piece.opacity = 1;
      }
      dataObjOverallAvg.color = colorOverallAvg;
      options.series[0].data.push(dataObjOverallAvg);
      options.xAxis.data.push(dataObjOverallAvg.name);

      // same for selection average
      // add more data elements for the overall and selection average
      const selectionAvgValue = calculateAvg(
        this.selectedIndicator,
        timestamp,
        true,
        this.selectedAreas
      );
      const selectionAvgElementName =
        page.area && page.area.length
          ? 'Durchschnitt\nder\nSelektion'
          : 'Durchschnitt der Selektion';
      const dataObjSelectionAvg: any = {
        name: selectionAvgElementName,
        value: selectionAvgValue,
        opacity: 1,
      };
      // get color for avg from visual map and disable opacity
      let colorSelectionAvg = '';
      for (const piece of options.visualMap[0].pieces) {
        if (piece.min <= dataObjSelectionAvg.value && dataObjSelectionAvg.value < piece.max) {
          colorSelectionAvg = piece.color;
        }
        piece.opacity = 1;
      }
      dataObjSelectionAvg.color = colorSelectionAvg;
      options.series[0].data.push(dataObjSelectionAvg);
      options.xAxis.data.push(dataObjSelectionAvg.name);
    }

    options.series[0].emphasis.itemStyle = {}; // don't show border on hover

    barChart.setOption(options, {
      replaceMerge: ['series'], // take the new series data, don't update part of the old one
    });
    return barChart;
  }

  createPageElement_TimelineDiagram(wrapper, page, pageElement, context: ReportGenerationContext) {
    // no need to get a timestamp here

    const lineChart = echarts.init(wrapper);

    const vals: any = this.getFormattedDateSliderValues(true);
    const timeline = vals.dates;
    // get standard options, create a copy of the options to not change anything in the service
    const options = JSON.parse(JSON.stringify(this.echartsOptions.line));
    options.title.textStyle.fontSize = 12;
    options.title.text = 'Zeitreihe';
    options.yAxis.axisLabel = { fontSize: 10 };
    options.xAxis.axisLabel = { fontSize: 10 };
    options.legend.show = false;
    // background (non-preview) pages are captured via getDataURL() immediately after
    // setOption() with no wait -- disable animation so the line/area is rendered in full
    // synchronously, same reasoning as createPageElement_BarChartDiagram
    options.animation = false;
    options.grid.top = 35;
    options.grid.bottom = 5;
    options.title.show = true;
    options.toolbox.show = false;
    options.yAxis.name = ''; // included in header of each page
    options.xAxis.name = ''; // always timestamps

    // diagram contains avg series by default
    // if it should be shown we adjust it to our timeseries
    // future dates (compared to max slider value) were already filtered in prepareDiagrams
    // we have to remove dates older than min slider value here
    // we also have to filter xAxis labels accordingly
    const timeseries: any = this.getFormattedDateSliderValues(true);
    const oldestSelectedTimestamp = timeseries.from;
    let timestampsToRemoveCounter = 0;
    // use the axis labels to find out how many data points have to be removed later
    let timestampReached = false;
    while (!timestampReached) {
      if (oldestSelectedTimestamp === options.xAxis.data[0]) {
        timestampReached = true;
      } else {
        options.xAxis.data.shift();
        timestampsToRemoveCounter += 1;
      }
    }

    if (pageElement.showAverage) {
      options.series = options.series.filter((series) => {
        return (
          series.name === this.labelService.rankingChartAverageLabel ||
          series.name === this.labelService.rankingChartRegionalReferenceValueLabel
        );
      });

      for (let i = 0; i < timestampsToRemoveCounter; i++) {
        options.series[0].data.shift();
      }
    } else {
      options.series = [];
    }

    if (pageElement.showAreas) {
      let areaNames: any[] = [];
      // in area specific part only add one line
      if (page.area && page.area.length) {
        areaNames.push(page.area);
      } else {
        // else add one line for each selected area
        areaNames = this.selectedAreas.map((el: any) => {
          return el.name;
        });
      }

      for (const areaName of areaNames) {
        const data: any[] = [];
        const filtered = this.selectedIndicator.geoJSON.features.filter((feature) => {
          return feature.properties.NAME === areaName;
        });

        for (const timestamp of timeline) {
          const value = filtered[0].properties['DATE_' + timestamp];
          data.push(value);
        }

        const series: any = {};
        series.name = areaName;
        series.type = 'line';
        series.data = data;
        series.lineStyle = {
          normal: {
            width: 2,
            type: 'solid',
          },
        };
        series.itemStyle = {
          normal: {
            borderWidth: 3,
          },
        };

        options.series.push(series);
      }
    }

    if (pageElement.showPercentageChangeToPrevTimestamp) {
      for (const series of options.series) {
        series.data = this.transformSeriesDataToPercentageChange(series.data);
      }
      options.xAxis.data.shift();
      options.title.text = 'VerÃ¤nderung zum Vorjahr';
    }

    if (pageElement.showBoxplots) {
      // we assume that boxplots are only shown when showAreas is false (might change in the future).
      // so we have to get the data of all areas first
      let areaNames: any = [];
      areaNames = this.selectedAreas.map((el: any) => {
        return el.name;
      });

      // create a nested array with each inner array containing all area-values for one timestamp
      const datasetSource: any[] = [];
      for (const timestamp of timeline) {
        const valuesForTimestamp: any[] = [];
        // filter features to selected areas
        const selectedAreasFeatures = this.selectedIndicator.geoJSON.features.filter((feature) => {
          return areaNames.includes(feature.properties.NAME);
        });
        // get values for each feature
        for (const feature of selectedAreasFeatures) {
          const value = feature.properties['DATE_' + timestamp];
          valuesForTimestamp.push(value);
        }

        datasetSource.push(valuesForTimestamp);
      }

      const xAxisLabels = options.xAxis.data;
      options.dataset = [
        {
          source: datasetSource,
        },
        {
          transform: {
            type: 'boxplot',
            config: {
              // params is 0, 1, 2, ...
              // we can use this as an index to get the actual label and return it
              itemNameFormatter: function (params) {
                return xAxisLabels[params.value];
              },
            },
          },
        },
        {
          fromDatasetIndex: 1,
          fromTransformResult: 1,
        },
      ];

      // add a new series that references the boxplots
      options.series.push({
        name: 'boxplot',
        type: 'boxplot',
        datasetIndex: 1, // overlap boxplots and avg. line
      });
    }

    lineChart.setOption(options, {
      replaceMerge: ['series'], // take the new series data, don't update part of the old one
    });
    return lineChart;
  }

  filterMapByAreaName(echartsInstance, areaName, targetFeature) {
    const options = echartsInstance.getOption();
    const mapName = options.series[0].map;

    const features: any = {
      features: [targetFeature],
    };

    echarts.registerMap(mapName, features);

    // echart map bounds are defined by a bounding box, which has to be updated as well.
    if (!targetFeature.properties.bbox) {
      targetFeature.properties.bbox = turf.bbox(targetFeature);
    }
    const bbox = targetFeature.properties.bbox; // [east, south, west, north]

    const newBounds = [
      [bbox[2], bbox[3]],
      [bbox[0], bbox[1]],
    ]; // [[west, north], [east, south]]
    options.series[0].boundingCoords = newBounds;
    echartsInstance.setOption(options, {
      replaceMerge: ['series'],
    });
  }

  async clearScreenshotCache() {
    await this.leafletScreenshotCacheHelperService.clearScreenshotCache();

    // now retrigger the generation of all screenshots
    // by simply calling the changeBaseMap method
    // this will reinit all diagrams, including leafletScreenshots
    this.onChangeSelectedBaseMap();
  }

  prepareDiagrams(
    selectedIndicator,
    selectedSpatialUnit,
    timestampName,
    classifyUsingWholeTimeseries,
    isTimeseries,
    fromDate,
    toDate
  ) {
    // if is  timeseries we must modify the indicator type of the given indicator, since it should display changes over time and hence
    // must be treated as dynamic indicator
    const indicator = JSON.parse(JSON.stringify(selectedIndicator));
    const targetTimestamp = timestampName;
    const isCategorical = isQualitativeMapping(indicator.defaultClassificationMapping);
    const categoricalData: CategoricalMappingType[] =
      indicator.defaultClassificationMapping?.categoricalData ?? [];

    // qualitative indicators have no numeric "change over time" concept - the
    // timeseries/dynamic reinterpretation below only applies to numeric indicators
    if (isTimeseries && !isCategorical) {
      const indicatorType = indicator.indicatorType;
      if (indicatorType.includes('ABSOLUTE')) {
        indicator.indicatorType = 'DYNAMIC_ABSOLUTE';
      } else if (indicatorType.includes('RELATIVE')) {
        indicator.indicatorType = 'DYNAMIC_RELATIVE';
      } else if (indicatorType.includes('STANDARDIZED')) {
        indicator.indicatorType = 'DYNAMIC_STANDARDIZED';
      }

      // compute and set actual change values to perform correct colorization of features
      indicator.geoJSON.features = this.calculateAndSetSeriesDataForTimeseries(
        indicator.geoJSON.features,
        fromDate,
        toDate
      );
    }

    // set settings useOutlierDetectionOnIndicator and classifyUsingWholeTimeseries to false to have consistent reporting setup
    // we need to undo these changes afterwards, so we store the current values in a backup first
    const useOutlierDetectionOnIndicator_backup =
      this.envConfigService.useOutlierDetectionOnIndicator;
    const classifyUsingWholeTimeseries_backup = this.envConfigService.classifyUsingWholeTimeseries;
    const classifyZeroSeparately_backup = this.envConfigService.classifyZeroSeparately;
    this.envConfigService.useOutlierDetectionOnIndicator = false;
    this.envConfigService.classifyUsingWholeTimeseries = false;
    if (classifyUsingWholeTimeseries) {
      this.envConfigService.classifyUsingWholeTimeseries = true;
    }

    const timestampPrefix = this.envConfigService.indicatorDatePrefix + timestampName;

    // categorical indicators have no numeric classes/breaks/classify method - the
    // brew setup below is a purely quantitative concept and is skipped entirely
    let defaultBrew;
    let dynamicIncreaseBrew;
    let dynamicDecreaseBrew;
    if (!isCategorical) {
      const numClasses = indicator.defaultClassificationMapping.numClasses
        ? indicator.defaultClassificationMapping.numClasses
        : 5;
      const colorCodeStandard = indicator.defaultClassificationMapping.colorBrewerSchemeName;
      const colorCodePositiveValues =
        this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues;
      const colorCodeNegativeValues =
        this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues;
      const classifyMethod = this.envConfigService.defaultClassifyMethod;

      // setup brew
      defaultBrew = this.visualStyleHelperService.setupDefaultBrew(
        indicator.geoJSON,
        timestampPrefix,
        numClasses,
        colorCodeStandard,
        classifyMethod,
        true,
        selectedIndicator
      );
      //let manualBrew = kommonitorVisualStyleHelperService.setupManualBrew(indicator.geoJSON, timestampPrefix, numClasses, colorCodeStandard, classifyMethod, true, selectedIndicator);
      const dynamicBrewsArray = this.visualStyleHelperService.setupDynamicIndicatorBrew(
        indicator.geoJSON,
        timestampPrefix,
        colorCodePositiveValues,
        colorCodeNegativeValues,
        classifyMethod,
        numClasses,
        ''
      );
      dynamicIncreaseBrew = dynamicBrewsArray[0];
      dynamicDecreaseBrew = dynamicBrewsArray[1];
    }

    // setup diagram resources
    this.diagramHelperService.prepareAllDiagramResources_forReportingIndicator(
      indicator,
      selectedSpatialUnit.spatialUnitName,
      timestampName,
      defaultBrew,
      undefined,
      undefined,
      dynamicIncreaseBrew,
      dynamicDecreaseBrew,
      false,
      0,
      true,
      isCategorical,
      categoricalData
    );
    // at this point the echarts instance has one map registered (geoMapChart).
    // that is the "default" map, which can be used to create individual maps for indicator + date + spatialUnit (+ area) combinations later

    // set settings classifyUsingWholeTimeseries and useOutlierDetectionOnIndicator and classifyZeroSeparately back to their prior values
    this.envConfigService.useOutlierDetectionOnIndicator = useOutlierDetectionOnIndicator_backup;
    this.envConfigService.classifyUsingWholeTimeseries = classifyUsingWholeTimeseries_backup;
    this.envConfigService.classifyZeroSeparately = classifyZeroSeparately_backup;

    // copy and save echarts options so we can re-use them later
    if (isTimeseries && !isCategorical) {
      timestampName += '_relative'; // save relative indicator separately
    }
    this.echartsOptions.map[timestampName] = JSON.parse(
      JSON.stringify(this.diagramHelperService.getGeoMapChartOptions())
    );
    this.echartsOptions.bar[timestampName] = JSON.parse(
      JSON.stringify(this.diagramHelperService.getBarChartOptions())
    );
    this.echartsOptions.bar[timestampName].visualMap.show = true;
    // no timestamp needed here
    this.echartsOptions.line = JSON.parse(
      JSON.stringify(this.diagramHelperService.getLineChartOptions())
    );

    // if is timeseries then the original value for the toDate timestamp must be used instead of the computed change value above
    if (isTimeseries && !isCategorical) {
      // series[0] is average line
      // replace the value for same index same toDate
      const originalFeatures = selectedIndicator.geoJSON.features;
      let sumToDate = 0;
      let counter = 0;

      for (const feature of originalFeatures) {
        if (
          !this.indicatorValueService.indicatorValueIsNoData(feature.properties[timestampPrefix])
        ) {
          sumToDate += feature.properties[timestampPrefix];
          counter++;
        }
      }

      const toDateIndex = selectedIndicator.applicableDates.indexOf(targetTimestamp);

      this.echartsOptions.line.series[0].data[toDateIndex] = this.getIndicatorValue_asNumber(
        sumToDate / counter
      );
    }

    this.diagramsPrepared = true;
  }

  prepareReachabilityEchartsMap() {
    if (
      this.geoJsonForReachability.features[0] &&
      !this.geoJsonForReachability.features[0].properties.bbox
    ) {
      for (const feature of this.geoJsonForReachability.features) {
        const bbox = turf.bbox(feature); // calculate bbox for each feature
        feature.properties.bbox = bbox;
      }
    }
    const overallBbox = this.calculateOverallBoundingBoxFromGeoJSON(
      this.geoJsonForReachability.features
    );
    // change format of bbox to match the format needed for echarts
    /* overallBbox = [
      [overallBbox[0], overallBbox[3]], // north-west lon lat
      [overallBbox[2], overallBbox[1]] // south-east lon lat
    ] */

    const mapName = 'reachabilityMap'; // gets overwritten later anyway
    echarts.registerMap(mapName, this.geoJsonForReachability);

    const geoMapOptions = {
      // geo component is only needed for isochrone center markers to work
      geo: {
        map: mapName,
        z: 1,
        itemStyle: {
          opacity: 0,
        },
        roam: false,
        boundingCoords: overallBbox,
      },
      backgroundColor: 'rgba(255,255,255,0)', // transparent, because we draw it over the leaflet map
      series: [
        {
          name: 'spatialUnitBoundaries',
          type: 'map',
          roam: false,
          boundingCoords: overallBbox,
          map: mapName,
          cursor: 'default',
          itemStyle: {
            areaColor: 'rgb(255, 255, 255, 0)',
            borderColor: 'rgb(50, 50, 50)',
            borderWidth: 3,
            color: 'rgb(255, 255, 255, 0)',
          },
          label: {
            show: true,
            backgroundColor: 'white',
            padding: [1, 2, 1, 2], // [top, right, bottom, left]
          },
          emphasis: {
            disabled: true,
          },
          z: 100,
          data: [],
        },
      ],
    };

    // We can set this here because this function is only relevant for reachability.
    // The other diagrams don't have to be prepared since they are not used.
    this.diagramsPrepared = true;

    return geoMapOptions;
  }

  isPageInPreview(page: any, _index?: number): boolean {
    return isPageInPreview(
      this.reportingService.clonedTemplate.pages,
      page,
      this.MAX_PREVIEW_AREA_SPECIFIC_PAGES,
      this.MAX_PREVIEW_DATATABLE_PAGES
    );
  }

  isLastPreviewPage(page: any): boolean {
    return isLastPreviewPage(
      this.reportingService.clonedTemplate.pages,
      page,
      this.MAX_PREVIEW_AREA_SPECIFIC_PAGES,
      this.MAX_PREVIEW_DATATABLE_PAGES
    );
  }

  countBackgroundPages(page: any): number {
    if (!this.reportingService.clonedTemplate || !page) return 0;
    return countBackgroundPages(
      this.reportingService.clonedTemplate.pages,
      page,
      this.MAX_PREVIEW_AREA_SPECIFIC_PAGES,
      this.MAX_PREVIEW_DATATABLE_PAGES
    );
  }

  getPagePreparationPercent(): number {
    if (!this.pagePreparationSize) return 0;
    return Math.min(100, Math.max(0, (this.pagePreparationIndex / this.pagePreparationSize) * 100));
  }

  async onTriggerPreparationClicked() {
    this.loadingData = true;
    this.reportingService.abortPreparation = false;
    this.preparationNeeded = false;
    this.reportingService.reportGenerationInProgress = true;
    this.reportingService.reportStatus = 'preparing';
    this.reportingService.reportProgress = 0;
    try {
      await this.initializeAllDiagrams();
    } catch (error) {
      console.error('Report preparation failed:', error);
      this.mapErrorNotificationService.displayMapApplicationError(error);
      this.preparationNeeded = true;
      this.reportingService.reportGenerationInProgress = false;
    } finally {
      this.loadingData = false;
    }
  }

  onAbortPreparationClicked() {
    this.reportingService.abortPreparation = true;
    this.preparationNeeded = true;
    this.reportingService.reportGenerationInProgress = false;

    // these two footer indicators aren't gated by preparationNeeded, so they'd otherwise
    // keep showing the stale "X von Y" from whichever page the loop was on when it noticed
    // the abort flag and returned
    this.pagePreparationIndex = 0;
    this.pagePreparationSize = 0;
    this.leafletScreenshotCacheHelperService.screenshotsForCurrentSpatialUnitUpdate = true;
  }

  // async
  async initializeAllDiagrams() {
    if (!this.reportingService.clonedTemplate) return;
    if (
      this.reportingService.clonedTemplate.name.includes('timestamp') &&
      this.selectedTimestamps.length === 0
    ) {
      return;
    }
    if (!this.diagramsPrepared) {
      throw new Error("Diagrams can't be initialized since they were not prepared previously.");
    }

    // prepare O(1) access to geoJSON features used within each page
    if (this.selectedIndicator) {
      this.geoJsonForSelectedIndicator_byFeatureName = new Map();
      for (const feature of this.selectedIndicator.geoJSON.features) {
        if (!feature.properties.bbox) feature.properties.bbox = turf.bbox(feature);

        this.geoJsonForSelectedIndicator_byFeatureName.set(feature.properties.NAME, feature);
      }
      this.geoJsonForReachability_byFeatureName = this.geoJsonForSelectedIndicator_byFeatureName;
    } else {
      this.geoJsonForReachability_byFeatureName = new Map();

      for (const feature of this.geoJsonForReachability.features) {
        if (!feature.properties.bbox) feature.properties.bbox = turf.bbox(feature);
        this.geoJsonForReachability_byFeatureName.set(feature.properties.NAME, feature);
      }
      this.geoJsonForSelectedIndicator_byFeatureName = this.geoJsonForReachability_byFeatureName;
    }

    this.lastPageOfAddedSectionPrepared = false;
    this.reportingService.abortPreparation = false;
    this.pagePreparationIndex = 0;
    this.pagePreparationSize = this.reportingService.clonedTemplate.pages.length;
    let logProgressIndexSeparator = Math.round((this.pagePreparationSize / 100) * 10);
    if (logProgressIndexSeparator < 1) logProgressIndexSeparator = 1;

    this.loadingData = false;

    // Wait for Angular to render new pages in DOM before processing
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Phase 1: Process preview pages first for fast user feedback
    const processedPageIds = new Set<any>();
    let totalPreparedCount = 0;

    for (let i = 0; i < this.reportingService.clonedTemplate.pages.length; i++) {
      if (this.reportingService.abortPreparation) {
        this.reportingService.reportGenerationInProgress = false;
        return;
      }
      if (!this.reportingService.clonedTemplate) {
        this.reportingService.reportGenerationInProgress = false;
        return;
      }

      const page = this.reportingService.clonedTemplate.pages[i];
      if (this.isPageInPreview(page, i)) {
        await this.preparePageForIndicatorAdd(i, page);
        processedPageIds.add(page.id);
        totalPreparedCount++;
        this.pagePreparationIndex = totalPreparedCount;
        this.reportingService.reportProgress = Math.round(
          (totalPreparedCount / this.pagePreparationSize) * 100
        );
      }
    }

    // Phase 2: Process remaining background pages
    for (let i = 0; i < this.reportingService.clonedTemplate.pages.length; i++) {
      if (this.reportingService.abortPreparation) {
        this.reportingService.reportGenerationInProgress = false;
        return;
      }
      if (!this.reportingService.clonedTemplate) {
        this.reportingService.reportGenerationInProgress = false;
        return;
      }
      if (
        !this.selectedIndicator &&
        !this.reportingService.clonedTemplate.name.includes('reachability')
      ) {
        this.reportingService.reportGenerationInProgress = false;
        return;
      }

      const page = this.reportingService.clonedTemplate.pages[i];
      if (!processedPageIds.has(page.id)) {
        await this.preparePageForIndicatorAdd(i, page);
        processedPageIds.add(page.id);
        totalPreparedCount++;
        this.pagePreparationIndex = totalPreparedCount;
        this.reportingService.reportProgress = Math.round(
          (totalPreparedCount / this.pagePreparationSize) * 100
        );
      }
    }

    this.lastPageOfAddedSectionPrepared = true;
    this.pagePreparationIndex = this.pagePreparationSize;
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

    // Enable optional tabs for reachability after preparation is finished
    if (this.reportingService.clonedTemplate.name.includes('-reachability')) {
      const allTabs: any = document.querySelectorAll('#reporting-add-indicator-tab-list li');
      for (const tab of allTabs) {
        this.enableTab(tab);
      }
    }

    setTimeout(() => {
      this.onChangePageConfig();
      this.onChangeShowPageSection();
    });
  }

  // Builds the per-page generation context. Not consumed by the generation methods yet - see
  // report-generation-context.model.ts for why this is introduced ahead of actually using it.
  buildGenerationContext(): ReportGenerationContext {
    return {
      pages: this.reportingService.clonedTemplate.pages,
      mercatorProjection_d3: this.mercatorProjection_d3,
      selectedIndicator: this.selectedIndicator,
      selectedAreas: this.selectedAreas,
      selectedSpatialUnit: this.selectedSpatialUnit,
      selectedPoiLayer: this.selectedPoiLayer,
      selectedBaseMap: this.selectedBaseMap,
      pageConfig: this.pageConfig,
      echartsOptions: this.echartsOptions,
      geoJsonForReachability: this.geoJsonForReachability,
      isochrones: this.isochrones,
      isochronesSeriesData: this.isochronesSeriesData,
      isochronesRangeType: this.isochronesRangeType,
      isochronesRangeUnits: this.isochronesRangeUnits,
      reachabilityTemplateGeoMapOptions: this.reachabilityTemplateGeoMapOptions,
      selectedIndicatorIsCategorical: this.selectedIndicatorIsCategorical,
      availableFeaturesBySpatialUnit: this.availableFeaturesBySpatialUnit,
      geoJsonForSelectedIndicator_byFeatureName: this.geoJsonForSelectedIndicator_byFeatureName,
      geoJsonForReachability_byFeatureName: this.geoJsonForReachability_byFeatureName,
      echartsRegisteredMapNames: this.echartsRegisteredMapNames,
      absoluteLabelPositions: this.absoluteLabelPositions,
      draggingLabelForFeature: this.draggingLabelForFeature,
    };
  }

  async preparePageForIndicatorAdd(idx: number, page: any) {
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

    // Route all rendering through the off-screen background processor for stable captures.
    // We build the child elements directly in the DOM instead of relying on appRef.tick()
    // to flush Angular's *ngFor â€” tick() swallows view errors silently and may skip views.
    this.reportingService.reportingBackgroundState.pageToProcess_add = page;

    const pageDom = document.getElementById('reporting-addIndicator-background-page');
    if (!pageDom) {
      console.error('Could not find background DOM for page ' + idx);
      return;
    }

    // Clear stale children from the previous page and rebuild them to match what *ngFor would create.
    pageDom.innerHTML = '';
    for (const [i, pe] of page.pageElements.entries()) {
      const div = document.createElement('div');
      div.id = 'reporting-addIndicator-background-page-' + pe.type + '-' + i;
      div.className = 'type-' + pe.type;
      const dims = pe.dimensions;
      const border = pe.type.includes('footerHorizontalSpacer-')
        ? pe.css || ''
        : 'border: dashed gray 1px;';
      const zIndex = pe.type === 'map' ? 20 : 1;
      div.style.cssText =
        'position: absolute; top: ' +
        dims.top +
        '; left: ' +
        dims.left +
        '; width: ' +
        dims.width +
        '; height: ' +
        dims.height +
        '; ' +
        border +
        ' z-index: ' +
        zIndex +
        ';';
      pageDom.appendChild(div);
    }

    for (const [elementIdx, pageElement] of page.pageElements.entries()) {
      const pElementDom = document.getElementById(
        'reporting-addIndicator-background-page-' + pageElement.type + '-' + elementIdx
      ) as HTMLElement;
      if (!pElementDom) continue;

      switch (pageElement.type) {
        case 'map': {
          const map = await this.createPageElement_Map(pElementDom, page, pageElement, context);

          if (page.area && page.area.length) {
            if (this.selectedIndicator) {
              this.filterMapByAreaName(
                map,
                page.area,
                this.geoJsonForSelectedIndicator_byFeatureName.get(page.area)
              );
            } else {
              this.filterMapByAreaName(
                map,
                page.area,
                this.geoJsonForReachability_byFeatureName.get(page.area)
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
          }

          page.generatedData.mapImage =
            await this.reportPagePreparationService.prepareLeafletMapForIndicatorAdd(
              page,
              pageElement,
              elementIdx,
              map,
              isPreview,
              context
            );
          pageElement.isPlaceholder = false;
          page.generatedData.echarts[pageElement.type] = map.getDataURL({ pixelRatio: 2 });
          // pageElement.echartsOptions (incl. the custom projection functions) is already
          // set by prepareLeafletMapForIndicatorAdd above - do not overwrite it with a
          // JSON-cloned copy, which would silently drop those functions

          if (isPreview) {
            const previewEl =
              document.querySelector(
                '#reporting-addIndicator-page-' + idx + '-' + pageElement.type + '-' + elementIdx
              ) ||
              document.querySelector(
                '#reporting-addIndicator-page-' + idx + '-' + pageElement.type
              );
            if (previewEl) {
              previewEl.innerHTML = '';
              while (pElementDom.firstChild) previewEl.appendChild(pElementDom.firstChild);
              if (page.generatedData.mapImage) {
                (previewEl as HTMLElement).style.backgroundImage =
                  'url(' + page.generatedData.mapImage + ')';
                (previewEl as HTMLElement).style.backgroundSize = '100% 100%';
                (previewEl as HTMLElement).style.backgroundRepeat = 'no-repeat';
              }
            }
          } else {
            map.dispose();
          }
          break;
        }
        case 'mapLegend': {
          pageElement.isPlaceholder = false;
          if (isPreview) {
            const previewPageDom = document.getElementById('reporting-addIndicator-page-' + idx);
            const legendDom = previewPageDom?.querySelector(
              '.type-mapLegend'
            ) as HTMLElement | null;
            if (legendDom) legendDom.style.display = 'none';
          }
          break;
        }
        case 'barchart': {
          this.createPageElement_BarChartDiagram(pElementDom, page, context);
          pageElement.isPlaceholder = false;
          const barChartInstance = echarts.getInstanceByDom(pElementDom) as any;
          page.generatedData.echarts[pageElement.type] = barChartInstance?.getDataURL({
            pixelRatio: 2,
          });
          if (barChartInstance) {
            // keep the object as returned by getOption() (not a JSON-cloned copy) so any
            // function-valued option properties (formatters etc.) survive
            pageElement.echartsOptions = barChartInstance.getOption();
          }
          if (isPreview) {
            const previewEl = document.querySelector(
              '#reporting-addIndicator-page-' + idx + '-' + pageElement.type
            );
            if (previewEl) {
              previewEl.innerHTML = '';
              while (pElementDom.firstChild) previewEl.appendChild(pElementDom.firstChild);
            }
          }
          break;
        }
        case 'linechart': {
          this.createPageElement_TimelineDiagram(pElementDom, page, pageElement, context);
          pageElement.isPlaceholder = false;
          const chartKey = pageElement.showPercentageChangeToPrevTimestamp
            ? 'linechart_perc'
            : 'linechart';
          const lineChartInstance = echarts.getInstanceByDom(pElementDom) as any;
          page.generatedData.echarts[chartKey] = lineChartInstance?.getDataURL({ pixelRatio: 2 });
          if (lineChartInstance) {
            // keep the object as returned by getOption() (not a JSON-cloned copy) so any
            // function-valued option properties (formatters etc.) survive
            pageElement.echartsOptions = lineChartInstance.getOption();
          }
          if (isPreview) {
            const allLinechartEls = document.querySelectorAll(
              '#reporting-addIndicator-page-' + idx + ' .type-linechart'
            );
            const targetEl = pageElement.showPercentageChangeToPrevTimestamp
              ? allLinechartEls[1]
              : allLinechartEls[0];
            if (targetEl) {
              targetEl.innerHTML = '';
              while (pElementDom.firstChild) targetEl.appendChild(pElementDom.firstChild);
            }
          }
          break;
        }
        case 'datatable': {
          // Remove extra datatable pages before recreating them
          let nextPage =
            idx < this.reportingService.clonedTemplate.pages.length - 1
              ? this.reportingService.clonedTemplate.pages[idx + 1]
              : undefined;
          if (nextPage) {
            let nextIncludesDT = nextPage.pageElements
              .map((el: any) => el.type)
              .includes('datatable');
            while (nextIncludesDT) {
              this.reportingService.clonedTemplate.pages.splice(idx + 1, 1);
              nextPage =
                idx < this.reportingService.clonedTemplate.pages.length - 1
                  ? this.reportingService.clonedTemplate.pages[idx + 1]
                  : undefined;
              nextIncludesDT = nextPage
                ? nextPage.pageElements.map((el: any) => el.type).includes('datatable')
                : false;
            }
          }
          const timeseries = this.reportingService.clonedTemplate.name.includes('timeseries')
            ? this.getFormattedDateSliderValues(true)
            : undefined;
          this.reportPagePreparationService.createDatatablePageForIndicatorAdd(
            pElementDom,
            page,
            timeseries,
            context
          );

          // capture the rendered table now; background pages never reach the visible
          // preview DOM, so this can't be scraped later when the section is added
          const columnHeaders = Array.from(pElementDom.querySelectorAll('th'));
          const columnNames: any[] = [];
          for (const header of columnHeaders) {
            columnNames.push((header as HTMLElement).innerText);
          }
          pageElement.columnNames = columnNames;

          const tableData: any[] = [];
          const rows = Array.from(pElementDom.querySelectorAll('tbody tr'));
          for (const row of rows) {
            const rowData: any[] = [];
            const fields = Array.from((row as HTMLElement).querySelectorAll('td'));
            for (const field of fields) {
              rowData.push((field as HTMLElement).innerText);
            }
            tableData.push(rowData);
          }
          pageElement.tableData = tableData;
          page.generatedData.tableData = tableData;

          if (isPreview) {
            const previewEl =
              document.querySelector(
                '#reporting-addIndicator-page-' + idx + '-' + pageElement.type + '-' + elementIdx
              ) ||
              document.querySelector(
                '#reporting-addIndicator-page-' + idx + '-' + pageElement.type
              );
            if (previewEl) {
              previewEl.innerHTML = '';
              while (pElementDom.firstChild) previewEl.appendChild(pElementDom.firstChild);
            }
          }
          break;
        }
      }
    }

    page.generatedData.isComplete = true;
    this.reportingService.reportingBackgroundState.pageToProcess_add = undefined;
  }

  showThisPage(page) {
    return this.reportingService.showThisPage(page, this.reportingService.clonedTemplate.pages);
  }

  filterPagesToShow() {
    return this.reportingService.filterPagesToShow(this.reportingService.clonedTemplate.pages);
  }

  pageContainsDatatable(pageID) {
    return this.reportingService.pageContainsDatatable(
      pageID,
      this.reportingService.clonedTemplate.pages
    );
  }

  getPageNumber(index) {
    return this.reportingService.getPageNumber(index, this.reportingService.clonedTemplate.pages);
  }

  calculateAndSetSeriesDataForTimeseries(features, fromDate, toDate) {
    for (const feature of features) {
      let value = feature.properties['DATE_' + toDate] - feature.properties['DATE_' + fromDate];
      if (typeof value == 'number') {
        value = Math.round(value * 100) / 100;
      }
      feature.properties['DATE_' + toDate] = value;
    }

    return features;
  }

  createDatesFromIndicatorDates(indicatorDates) {
    const datesAsMs: any[] = [];
    for (const indicatorDate of indicatorDates) {
      // year-month-day
      const dateComponents = indicatorDate.split('-');
      datesAsMs.push(
        this.metadataExportService.dateToTS(
          new Date(
            Number(dateComponents[0]),
            Number(dateComponents[1]) - 1,
            Number(dateComponents[2])
          )
        )
      );
    }
    return datesAsMs;
  }

  getFormatedSliderReturn() {
    const data: any | undefined = this._slider?.getSliderValues();

    if (data) {
      const [dayFrom, monthFrom, yearFrom] = data[0].split('.');
      const fromMs: number = new Date(
        Number(yearFrom),
        Number(monthFrom) - 1,
        Number(dayFrom)
      ).getTime();

      const [dayTo, monthTo, yearTo] = data[1].split('.');
      const toMs: number = new Date(Number(yearTo), Number(monthTo) - 1, Number(dayTo)).getTime();

      return {
        from: fromMs,
        to: toMs,
      };
    }

    return {
      from: this.datesAsMs[0],
      to: this.datesAsMs[this.datesAsMs.length - 1],
    };
  }

  tsToDateString(dateAsMs) {
    const date = new Date(dateAsMs);
    return date.getFullYear();

    /* return date.toLocaleDateString("de-DE", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }); */
  }

  prettifyDateSliderLabels(dateAsMs) {
    return this.metadataExportService.tsToDate_withOptionalUpdateInterval(
      dateAsMs,
      this.selectedIndicator.metadata.updateInterval
    );
  }

  onChangeDateSliderInterval() {
    this.preparationNeeded = true;
    this.loadingData = true;
    // needed to tell angular something has changed

    // setup all pages with the new timeseries
    const values = this.getFormattedDateSliderValues(true);
    // prepare diagrams again for most recent timestamp of slider and for whole timeseries (changes).
    let classifyUsingWholeTimeseries = false;
    let isTimeseries = true;
    this.prepareDiagrams(
      this.selectedIndicator,
      this.selectedSpatialUnit,
      values.to,
      classifyUsingWholeTimeseries,
      isTimeseries,
      values.from,
      values.to
    );
    isTimeseries = false;
    classifyUsingWholeTimeseries = true;
    this.prepareDiagrams(
      this.selectedIndicator,
      this.selectedSpatialUnit,
      values.to,
      classifyUsingWholeTimeseries,
      isTimeseries,
      undefined,
      undefined
    );

    // set dates on all pages according to new slider values
    for (const page of this.reportingService.clonedTemplate.pages) {
      const dateEl = page.pageElements.find((el) => {
        return el.type.includes('dataTimestamp-') || el.type.includes('dataTimeseries-');
      });

      if (dateEl.type.includes('dataTimestamp-')) {
        dateEl.text = values.to;
      }
      if (dateEl.type.includes('dataTimeseries-')) {
        dateEl.text = values.from + ' - ' + values.to;
      }
    }

    // page/diagram generation only starts once the user clicks
    // "Vorschau & Report-Seiten generieren"
    this.loadingData = false;
  }

  getFormattedDateSliderValues(includeInBetweenValues) {
    const dateSliderDate = this.getFormatedSliderReturn();

    /* if(!this.dateSlider)
				throw new Error("Tried to get dateslider values but dateslider was not defined."); */

    let from: any = new Date(dateSliderDate.from);
    let to: any = new Date(dateSliderDate.to);

    let inBetweenDates;
    if (includeInBetweenValues) {
      // get all valid timestamps for this spatial unit that lie in between from and to
      const validTimestamps = this.getValidTimestampsForSpatialUnit(this.selectedSpatialUnit);
      inBetweenDates = validTimestamps.filter((el) => {
        const date = new Date(el);
        date.setHours(0); // remove time-offset...TODO is there a better way?

        return from < date && date < to;
      });
    }
    // append zeros to month and year if needed
    let month = from.getMonth() + 1; // months start with 0
    let day = from.getDate();
    from = from.getFullYear() + '-';
    if (month < 10) from += '0';
    from += month + '-';
    if (day < 10) from += '0';
    from += day;

    month = to.getMonth() + 1; // months start with 0
    day = to.getDate();
    to = to.getFullYear() + '-';
    if (month < 10) to += '0';
    to += month + '-';
    if (day < 10) to += '0';
    to += day;

    const result = {
      from: from,
      to: to,
      dates: includeInBetweenValues ? [from, ...inBetweenDates, to] : [], // all dates in the interval, including "from" and "to"
    };

    return result;
  }

  initializeDateRangeSlider(availableDates, min, max) {
    this.datesAsMs = this.createDatesFromIndicatorDates(availableDates);

    this.sliderValues = this.createDateArray(availableDates);
    this.sliderPositions = [this.sliderValues[0], this.sliderValues[this.sliderValues.length - 1]];
  }

  createDateArray(dates: number[]): Date[] {
    return dates.map((d) => new Date(d));
  }

  validateConfiguration() {
    // indicator has to be selected (unless template is reachability)
    // at least one area has to be selected (unless template is reachability)
    // for timestamps:
    // at least one timestamp has to be selected
    // for timeseries
    // slider position must include at least two timestamps
    let isIndicatorSelected = false;
    let isAreaSelected = false;
    let isTimestampSelected = false;

    if (!this.reportingService.clonedTemplate) {
      return false;
    }

    if (
      this.selectedIndicator ||
      this.reportingService.clonedTemplate.name.includes('reachability')
    ) {
      isIndicatorSelected = true;
    }
    if (
      this.selectedAreas.length >= 1 ||
      this.reportingService.clonedTemplate.name.includes('reachability')
    ) {
      isAreaSelected = true;
    }

    if (
      (this.reportingService.clonedTemplate.name.includes('timestamp') ||
        this.reportingService.clonedTemplate.name.includes('reachability')) &&
      this.selectedTimestamps.length >= 1
    ) {
      isTimestampSelected = true;
    }

    if (this.reportingService.clonedTemplate.name.includes('timeseries')) {
      if (!this.selectedSpatialUnit) return false;

      if (!this.availableFeaturesBySpatialUnit[this.selectedSpatialUnit.spatialUnitName]) {
        return false;
      }
      const timeseries = this.getFormattedDateSliderValues(true).dates;
      if (timeseries.length >= 1) {
        isTimestampSelected = true; // reuse variable here
      }
    }

    if (isIndicatorSelected && isAreaSelected && isTimestampSelected && !this.loadingData) {
      return true;
    } else {
      return false;
    }
  }

  transformSeriesDataToPercentageChange(dataArr) {
    // we need at least two timestamps
    if (dataArr.length <= 1) {
      const error = new Error('Can not calculate percentage change from a single timestamp.');
      this.mapErrorNotificationService.displayMapApplicationError(error.message);
    }
    const result: any[] = [];
    for (let i = 1; i < dataArr.length; i++) {
      const datapoint = dataArr[i];
      const prevDatapoint = dataArr[i - 1];
      let value: any = (datapoint - prevDatapoint) / prevDatapoint;
      value *= 100;
      value = Math.round(value * 100) / 100;
      result.push(value);
    }
    return result;
  }

  // https://stackoverflow.com/a/2631198/18450475
  checkNestedPropExists(obj, ...levels: string[]) {
    let current = obj;
    for (const [idx, level] of levels.entries()) {
      if (current === undefined) return false;
      if (idx === levels.length - 1) return Object.prototype.hasOwnProperty.call(current, level);
      current = current[level];
    }
    return false;
  }
}
