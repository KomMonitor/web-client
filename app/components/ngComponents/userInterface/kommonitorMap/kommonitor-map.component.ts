import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import domtoimage from 'dom-to-image-more';
import { saveAs } from 'file-saver';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { ClassificationStateService } from 'services/classification-state-service/classification-state.service';
import { FeaturePopupHelperService } from 'services/feature-popup-helper-service/feature-popup-helper.service';
import { FileLayerManagerService } from 'services/file-layer-manager-service/file-layer-manager.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import { GeoresourceLayerManagerService } from 'services/georesource-layer-manager-service/georesource-layer-manager.service';
import {
  ClassificationResult,
  IndicatorClassificationService,
} from 'services/indicator-classification-service/indicator-classification.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { MapControlsService } from 'services/map-controls-service/map-controls.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MapViewportStateService } from 'services/map-viewport-state-service/map-viewport-state.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { MAP_LAYER_GROUPS, MapContext } from 'services/map-service/map-context';
import { MapCommand, MapService } from 'services/map-service/map.service';
import { OgcLayerManagerService } from 'services/ogc-layer-manager-service/ogc-layer-manager.service';
import { ReachabilityLayerManagerService } from 'services/reachability-layer-manager-service/reachability-layer-manager.service';

import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import {
  GeoJSONFeature,
  ReachabilityStateService,
} from 'services/reachability-state-service/reachability-state.service';

@Component({
  selector: 'app-kommonitor-map',
  templateUrl: './kommonitor-map.component.html',
  styleUrls: ['./kommonitor-map.component.scss'],
  standalone: true,
  imports: [],
})
export class KommonitorMapComponent implements OnInit, AfterViewInit {
  private mapOverlayState = inject(MapOverlayStateService);
  private chartDisplayState = inject(ChartDisplayStateService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private indicatorValueService = inject(IndicatorValueService);
  private selectionState = inject(SelectionStateService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private http = inject(HttpClient);
  private visualStyleHelperService = inject(VisualStyleHelperServiceNew);
  private classificationState = inject(ClassificationStateService);
  private indicatorClassificationService = inject(IndicatorClassificationService);
  private filterHelperService = inject(FilterHelperService);
  private genericMapHelperService = inject(GenericMapHelperService);
  private envConfigService = inject(EnvConfigService);
  private mapService = inject(MapService);
  private reachabilityStateService = inject(ReachabilityStateService);
  private reachabilityMapHelperService = inject(ReachabilityMapHelperService);
  private featurePopupHelperService = inject(FeaturePopupHelperService);
  private georesourceLayerManager = inject(GeoresourceLayerManagerService);
  private ogcLayerManager = inject(OgcLayerManagerService);
  private fileLayerManager = inject(FileLayerManagerService);
  private reachabilityLayerManager = inject(ReachabilityLayerManagerService);
  private mapControlsService = inject(MapControlsService);
  private mapViewportState = inject(MapViewportStateService);
  private metadataBootstrap = inject(MetadataBootstrapService);

  private readonly destroyRef = inject(DestroyRef);

  private map;
  private spatialUnitOutlineLayerInitialized = false;

  private singleMarkers: L.Marker[] = [];

  datasetContainsNegativeValues: any;

  svgString_outlierLow =
    '<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' +
    this.envConfigService.defaultColorForOutliers_low +
    ';stroke-width:2; stroke-opacity: ' +
    this.envConfigService.defaultFillOpacityForOutliers_low +
    ';" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' +
    this.envConfigService.defaultColorForOutliers_low +
    ';stroke-width:2; stroke-opacity: ' +
    this.envConfigService.defaultFillOpacityForOutliers_low +
    ';" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' +
    this.envConfigService.defaultColorForOutliers_low +
    ';stroke-width:2; stroke-opacity: ' +
    this.envConfigService.defaultFillOpacityForOutliers_low +
    ';" />Sorry, your browser does not support inline SVG.</svg>';
  svgString_outlierHigh =
    '<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' +
    this.envConfigService.defaultColorForOutliers_high +
    ';stroke-width:2; stroke-opacity: ' +
    this.envConfigService.defaultFillOpacityForOutliers_high +
    ';" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' +
    this.envConfigService.defaultColorForOutliers_high +
    ';stroke-width:2; stroke-opacity: ' +
    this.envConfigService.defaultFillOpacityForOutliers_high +
    ';" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' +
    this.envConfigService.defaultColorForOutliers_high +
    ';stroke-width:2; stroke-opacity: ' +
    this.envConfigService.defaultFillOpacityForOutliers_high +
    ';" />Sorry, your browser does not support inline SVG.</svg>';

  outlierFillPattern_low;
  outlierFillPattern_high;
  noDataFillPattern;

  outlierStyle_high;
  outlierStyle_low;

  outlierMinValue;
  outlierMaxValue;

  svgString_noData;
  noDataStyle;

  containsOutliers_high = false;
  containsOutliers_low = false;
  outliers_high: any = undefined;
  outliers_low: any = undefined;

  indicatorPropertyName;
  indicatorName;
  indicatorDescription;
  indicatorUnit;

  currentIndicatorLayer;

  // create classyBrew object
  defaultBrew: any = undefined;
  gtMeasureOfValueBrew = undefined;
  ltMeasureOfValueBrew = undefined;
  manualBrew = undefined;
  dynamicDecreaseBrew: any = undefined;
  dynamicIncreaseBrew: any = undefined;

  currentIndicatorMetadataAndGeoJSON;
  currentGeoJSONOfCurrentLayer;
  currentIndicatorContainsZeroValues = false;
  currentIndicatorContainsNoDataValues = false;
  indicatorTypeOfCurrentLayer: any[] = [];

  customIndicatorPropertyName;
  customIndicatorName;
  customIndicatorUnit;

  currentCustomIndicatorLayerOfCurrentLayer;
  customPropertyName;

  currentCustomIndicatorLayer;
  isochronesLayer: any = undefined;
  isochroneMarkerLayer = undefined;

  showOutlierInfoAlert = false;

  drawnPointFeatures = undefined;
  drawPointControl = undefined;

  featuresWithValues = [];
  featuresWithoutValues = [];

  inputLayerCounter = 0;

  loadingData = true;

  drawnItems = new L.FeatureGroup();
  drawControl = undefined;

  allDrawingToolsEnabled = false;
  date: string | undefined = undefined;

  filteredStyle;

  // central map object
  layerControl: any = undefined;
  showLegend = true;
  overlays: any[] = [];
  baseMaps: any[] = [];

  propertyName;

  sortableLayers = ['Web Map Services (WMS)'];

  highlightTimeout;

  // Local precision-resolving wrappers (formerly the DataExchangeService facade glue, Prio7 B1).
  private getIndicatorValue_asNumber(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asNumber(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  private getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFormattedText(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  ngOnInit(): void {
    // add the spatial unit outline layers once the initial metadata bootstrap
    // is complete (replaces the former blind setTimeout(2000))
    this.metadataBootstrap.metadataLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state === MetadataLoadingState.COMPLETE) this.tryInitSpatialUnitOutlineLayer();
      });

    // single render channel for indicator layers (selection changes as well as
    // dataset replacements by filter/balance)
    this.mapService.indicatorRenderRequest$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((request) => {
        this._replaceIndicatorLayer(
          request.indicator,
          request.spatialUnitName,
          request.date,
          request.isCustomComputation,
          request.justRestyling
        );
      });

    this.mapService.mapRecenter$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (value.resize) this.resizeMapOnly();

      if (value.recenter) this.recenterMapOnly();
    });

    this.reachabilityStateService.reachabilityMapSubject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (value.showOnMainMap) {
          if (value.features) this.addSingleMarker(value?.features);

          if (value.isochronesGeoJson) this.addIsochrones(value.isochronesGeoJson);
          else this.removeIsochrones();
        }
      });

    // typed map command channel (map refactoring plan, Phase 5); this component
    // is the single dispatcher for layer/styling/UI commands on the main map
    this.mapService.mapCommand$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((command) => this.handleMapCommand(command));
  }

  private handleMapCommand(command: MapCommand) {
    switch (command.type) {
      // indicator classification controls
      case 'changeClassifyMethod':
        this.changeClassifyMethod(command.method);
        break;
      case 'changeNumClasses':
        this.changeNumClasses(command.numClasses);
        break;
      case 'changeColorScheme':
        this.changeColorScheme(command.colorSchemeName);
        break;
      case 'changeBreaks':
        this.changeBreaks(command.breaks);
        break;
      case 'changeDynamicBreaks':
        this.changeDynamicBreaks(command.breaks);
        break;
      case 'restyleCurrentLayer':
        this.restyleCurrentLayer(command.skipDiagramRefresh);
        break;
      case 'changeDate':
        this.onChangeDate(command.date);
        break;
      case 'changeSpatialUnit':
        this.onChangeSpatialUnit();
        break;
      case 'beginIndicatorTimeSetup':
        this.allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin();
        break;
      // feature highlighting
      case 'highlightFeature':
        this.highlightFeatureOnMap(command.featureName);
        break;
      case 'unhighlightFeature':
        this.unhighlightFeatureOnMap(command.featureName);
        break;
      case 'switchHighlightFeature':
        this.switchHighlightFeatureOnMap(command.featureName);
        break;
      case 'preserveHighlightedFeatures':
        this.preserveHighlightedFeatures();
        break;
      case 'unselectAllFeatures':
        this.unselectAllFeatures();
        break;
      // georesource layers
      case 'addPoiGeoresource':
        this.georesourceLayerManager.addPoiGeoresource(
          command.georesource,
          command.date,
          command.useCluster
        );
        break;
      case 'removePoiGeoresource':
        this.georesourceLayerManager.removePoiGeoresource(command.georesource);
        break;
      case 'addLoiGeoresource':
        this.georesourceLayerManager.addLoiGeoresource(command.georesource, command.date);
        break;
      case 'removeLoiGeoresource':
        this.georesourceLayerManager.removeLoiGeoresource(command.georesource);
        break;
      case 'addAoiGeoresource':
        this.georesourceLayerManager.addAoiGeoresource(command.georesource, command.date);
        break;
      case 'removeAoiGeoresource':
        this.georesourceLayerManager.removeAoiGeoresource(command.georesource);
        break;
      // OGC layers
      case 'addWmsLayer':
        this.ogcLayerManager.addWmsLayer(command.dataset, command.opacity);
        break;
      case 'removeWmsLayer':
        this.ogcLayerManager.removeWmsLayer(command.dataset);
        break;
      case 'addWfsLayer':
        this.ogcLayerManager.addWfsLayer(command.dataset, command.opacity, command.useCluster);
        break;
      case 'removeWfsLayer':
        this.ogcLayerManager.removeWfsLayer(command.dataset);
        break;
      case 'adjustWfsLayerColor':
        this.ogcLayerManager.adjustWfsColor(command.dataset, command.opacity);
        break;
      // file layers
      case 'addFileLayer':
        this.fileLayerManager.addFileLayer(command.dataset, undefined);
        break;
      case 'adjustFileLayerOpacity':
        this.fileLayerManager.adjustOpacity(command.dataset, command.opacity);
        break;
      case 'adjustFileLayerColor':
        this.fileLayerManager.adjustColor(command.dataset);
        break;
      case 'removeFileLayer':
        // formerly unwired on the broadcast bus — file layers could never be removed
        this.fileLayerManager.removeFileLayer(command.dataset);
        break;
      // reachability scenario
      case 'replaceReachabilityScenario':
        this.reachabilityLayerManager.replaceScenario(command.reachabilityScenario);
        break;
      case 'removeReachabilityScenario':
        this.reachabilityLayerManager.removeScenario();
        break;
      // map UI
      case 'showLoadingIcon':
        this.showLoadingIconOnMap();
        break;
      case 'hideLoadingIcon':
        this.hideLoadingIconOnMap();
        break;
      case 'exportMap':
        this.exportMap();
        break;
      case 'toggleExpertControls':
        this.mapControlsService.toggleExpertControls();
        break;
      case 'openLayerControl':
        this.mapControlsService.openLayerControl();
        break;
      case 'onGlobalFilterChange':
        this.onGlobalFilterChange();
        break;
    }
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.initializeLayerManagers();

    if (this.envConfigService.sortableLayers) {
      this.sortableLayers = this.envConfigService.sortableLayers;
    } else {
      this.sortableLayers = ['Web Map Services (WMS)'];
    }

    this.mapControlsService.initSearchControls();
    this.mapControlsService.initMeasureControl();

    // covers the case that the metadata bootstrap completed before the map view existed
    this.tryInitSpatialUnitOutlineLayer();
  }

  private syncViewportState() {
    const latLng = this.map.getCenter();
    this.mapViewportState.setViewport(latLng.lat, latLng.lng, this.map.getZoom());
  }

  // runs once, as soon as both the map view and the metadata bootstrap are ready
  private tryInitSpatialUnitOutlineLayer() {
    if (this.spatialUnitOutlineLayerInitialized) return;
    if (!this.layerControl) return;
    if (this.metadataBootstrap.metadataLoadingState !== MetadataLoadingState.COMPLETE) return;

    this.spatialUnitOutlineLayerInitialized = true;
    this.initSpatialUnitOutlineLayer();
  }

  // hands the layer managers a narrow context; the Leaflet instance itself
  // stays encapsulated in this component
  private initializeLayerManagers() {
    const context: MapContext = {
      map: this.map,
      layerControl: this.layerControl,
      updateSearchControl: () => this.mapControlsService.updateSearchControl(),
      hideLoadingIcon: () => this.hideLoadingIconOnMap(),
    };

    this.georesourceLayerManager.initialize(context);
    this.ogcLayerManager.initialize(context);
    this.fileLayerManager.initialize(context);
    this.reachabilityLayerManager.initialize(context);
  }

  private initMap(): void {
    this.loadingData = true;

    const baseLayersByName = this.genericMapHelperService.createBaseLayers(
      this.envConfigService.baseLayers
    );

    this.mapOverlayState.baseLayerDefinitionsArray = [
      {
        layerConfig: {
          name: 'leere Karte',
          url: '',
          layerType: 'TILE_LAYER',
          layerName_WMS: '',
          attribution_html: '',
          minZoomLevel: this.envConfigService.minZoomLevel,
          maxZoomLevel: this.envConfigService.maxZoomLevel,
        },
      },
      ...this.envConfigService.baseLayers
        .filter((baseMapEntry) => baseLayersByName.has(baseMapEntry.name))
        .map((baseMapEntry) => ({ layerConfig: baseMapEntry })),
    ];

    this.map = L.map('ngMap', {
      center: [this.envConfigService.initialLatitude, this.envConfigService.initialLongitude],
      zoom: this.envConfigService.initialZoomLevel,
      zoomDelta: 0.5,
      zoomSnap: 0.5,
      layers: [baseLayersByName.get(this.envConfigService.baseLayers[0].name)],
    });

    this.mapViewportState.setViewport(
      this.envConfigService.initialLatitude,
      this.envConfigService.initialLongitude,
      this.envConfigService.initialZoomLevel
    );

    // update zoom and extent
    this.map.on('zoomend', () => this.syncViewportState());
    this.map.on('moveend', () => this.syncViewportState());

    this.baseMaps = [];

    baseLayersByName.forEach((value, key) => {
      this.baseMaps[key] = value;
    });

    this.layerControl = this.mapControlsService.initializeLayerControl(
      this.map,
      this.baseMaps,
      this.sortableLayers
    );

    this.outlierFillPattern_low = this.visualStyleHelperService.outlierFillPattern_low;
    this.outlierFillPattern_low.addTo(this.map);

    this.outlierFillPattern_high = this.visualStyleHelperService.outlierFillPattern_high;
    this.outlierFillPattern_high.addTo(this.map);

    this.noDataFillPattern = this.visualStyleHelperService.noDataFillPattern;
    this.noDataFillPattern.addTo(this.map);

    this.map.on('click', async (e: L.LeafletMouseEvent) => {
      if (this.reachabilityStateService.manualMapSelectionMode) {
        this.reachabilityStateService.addLocation(
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [e.latlng.lng, e.latlng.lat],
            },
          },
          true
        );
      }
    });
  }

  addSingleMarker(locations: GeoJSONFeature[]) {
    this.singleMarkers.forEach((m) => this.map.removeLayer(m));
    this.singleMarkers = [];

    locations.forEach((location) => {
      // Create a GeoJSON feature for the location
      const poiFeature: any = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [location.geometry.coordinates[0], location.geometry.coordinates[1]],
        },
        properties: {
          name: '',
        },
      };

      const defaultMarkerStyle = {
        poiMarkerStyle: 'default',
        poiMarkerText: 'Start',
        poiSymbolColor: 'white',
        poiMarkerColor: 'blue',
        poiSymbolBootstrap3Name: 'home',
      };

      const newMarker = this.genericMapHelperService.createCustomMarker(
        poiFeature,
        defaultMarkerStyle.poiMarkerStyle,
        defaultMarkerStyle.poiMarkerText,
        defaultMarkerStyle.poiSymbolColor,
        defaultMarkerStyle.poiMarkerColor,
        defaultMarkerStyle.poiSymbolBootstrap3Name,
        defaultMarkerStyle
      );
      newMarker.addTo(this.map);

      // track to enable deletion
      this.singleMarkers.push(newMarker);

      this.map.setView([location.geometry.coordinates[1], location.geometry.coordinates[0]], 12);
    });
  }

  removeIsochrones() {
    if (this.isochronesLayer) {
      this.map.removeLayer(this.isochronesLayer);
      this.layerControl.removeLayer(this.isochronesLayer);
    }
  }

  addIsochrones(isochrones: any) {
    this.removeIsochrones();

    this.isochronesLayer = this.reachabilityMapHelperService.makeIsochroneLayer(
      this.reachabilityStateService.settings.selectedStartPointLayer?.datasetName ||
        'Manuelle Eingabe',
      isochrones,
      this.reachabilityStateService.settings.transitMode,
      this.reachabilityStateService.settings.focus,
      this.reachabilityStateService.settings.rangeArray,
      this.reachabilityStateService.settings.useMultipleStartPoints,
      this.reachabilityStateService.settings.dissolveIsochrones
    );

    this.isochronesLayer.addTo(this.map);
  }

  onGlobalFilterChange() {
    // reset custom layers when global filters change. otherwise douplicates might be added
    this.layerControl._layers = this.layerControl._layers.filter((e) => e.overlay === undefined);
  }

  onCloseOutlierAlert() {
    this.showOutlierInfoAlert = false;
  }

  refreshNoDataStyle() {
    this.currentIndicatorContainsNoDataValues = false;
    this.svgString_noData =
      '<svg height="18" width="18">' +
      '<circle style="stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForNoDataValues +
      ';" cx="4" cy="4" r="1.5" stroke="' +
      this.envConfigService.defaultBorderColorForNoDataValues +
      '" stroke-width="2" fill="' +
      this.envConfigService.defaultColorForNoDataValues +
      '" />' +
      '<circle style="stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForNoDataValues +
      ';" cx="14" cy="4" r="1.5" stroke="' +
      this.envConfigService.defaultBorderColorForNoDataValues +
      '" stroke-width="2" fill="' +
      this.envConfigService.defaultColorForNoDataValues +
      '" />' +
      '<circle style="stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForNoDataValues +
      ';" cx="4" cy="14" r="1.5" stroke="' +
      this.envConfigService.defaultBorderColorForNoDataValues +
      '" stroke-width="2" fill="' +
      this.envConfigService.defaultColorForNoDataValues +
      '" />' +
      '<circle style="stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForNoDataValues +
      ';" cx="14" cy="14" r="1.5" stroke="' +
      this.envConfigService.defaultBorderColorForNoDataValues +
      '" stroke-width="2" fill="' +
      this.envConfigService.defaultColorForNoDataValues +
      '" />' +
      'Sorry, your browser does not support inline SVG.</svg>';

    this.noDataStyle = this.visualStyleHelperService.noDataStyle;
  }

  refreshOutliersStyle() {
    this.containsOutliers_high = false;
    this.containsOutliers_low = false;
    this.outlierMinValue = undefined;
    this.outlierMaxValue = undefined;
    this.showOutlierInfoAlert = false;

    this.svgString_outlierLow =
      '<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' +
      this.envConfigService.defaultColorForOutliers_low +
      ';stroke-width:2; stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForOutliers_low +
      ';" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' +
      this.envConfigService.defaultColorForOutliers_low +
      ';stroke-width:2; stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForOutliers_low +
      ';" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' +
      this.envConfigService.defaultColorForOutliers_low +
      ';stroke-width:2; stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForOutliers_low +
      ';" />Sorry, your browser does not support inline SVG.</svg>';
    this.svgString_outlierHigh =
      '<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' +
      this.envConfigService.defaultColorForOutliers_high +
      ';stroke-width:2; stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForOutliers_high +
      ';" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' +
      this.envConfigService.defaultColorForOutliers_high +
      ';stroke-width:2; stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForOutliers_high +
      ';" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' +
      this.envConfigService.defaultColorForOutliers_high +
      ';stroke-width:2; stroke-opacity: ' +
      this.envConfigService.defaultFillOpacityForOutliers_high +
      ';" />Sorry, your browser does not support inline SVG.</svg>';

    // if (this.useTransparencyOnIndicator) {
    //   fillOpacity_high = defaultFillOpacityForOutliers_high;
    //   fillOpacity_low = defaultFillOpacityForOutliers_low;
    // }

    this.outlierStyle_high = this.visualStyleHelperService.outlierStyle_high;
    this.outlierStyle_low = this.visualStyleHelperService.outlierStyle_low;
  }

  refreshFilteredStyle() {
    this.filteredStyle = this.visualStyleHelperService.filteredStyle;
  }

  initSpatialUnitOutlineLayer() {
    for (const spatialUnit of this.spatialUnitStore.availableSpatialUnits) {
      if (spatialUnit.isOutlineLayer) {
        const url =
          this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
          '/spatial-units/' +
          spatialUnit.spatialUnitId +
          '/allFeatures';

        this.http.get(url).subscribe((response: any) => {
          const geoJSON = response;

          const layer = L.geoJSON(geoJSON, {
            style: function (feature) {
              return {
                color: spatialUnit.outlineColor,
                weight: spatialUnit.outlineWidth,
                opacity: 1,
                fillOpacity: 0,
                fill: false,
                dashArray: spatialUnit.outlineDashArrayString,
              };
            },
            onEachFeature: this.onEachFeatureSpatialUnit,
          });

          this.layerControl.addOverlay(
            layer,
            spatialUnit.spatialUnitLevel + '_Umringe',
            MAP_LAYER_GROUPS.spatialUnitOutline
          );
          this.mapControlsService.updateSearchControl();
        });
      }
    }
  }

  filterForScreenshot(node) {
    return (
      node.tagName !== 'BUTTON' &&
      node.tagName !== 'A' &&
      (node.className instanceof SVGAnimatedString || !node.className.includes('leaflet-control'))
    );
  }

  exportMap() {
    const node = document.getElementById('ngMap');

    return domtoimage
      .toBlob(node, {
        quality: 1.0,
        filter: this.filterForScreenshot,
        width: this.map.getSize().x,
        height: this.map.getSize().y,
      })
      .then((blob) => {
        // FileSaver saveAs method
        saveAs(blob, 'KomMonitor-Screenshot.png');
      })
      .catch((error) => {
        console.error(error);

        this.mapErrorNotificationService.displayMapApplicationError(error);
      });
  }

  showLoadingIconOnMap() {
    this.loadingData = true;
  }

  hideLoadingIconOnMap() {
    setTimeout(() => {
      this.loadingData = false;
    }, 250);
  }

  changeClassifyMethod(method) {
    this.classificationState.classifyMethod = method;

    setTimeout(() => {
      this.classificationState.classifyMethod = method;
    }, 350);

    this.restyleCurrentLayer(false);
  }

  changeNumClasses(num) {
    this.classificationState.numClasses = num;

    setTimeout(() => {
      this.classificationState.numClasses = num;
    }, 350);

    this.restyleCurrentLayer(false);
  }

  changeColorScheme(colorSchemeName) {
    this.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName =
      colorSchemeName;

    this.restyleCurrentLayer(false);
  }

  changeBreaks(breaks) {
    breaks = [...new Set(breaks)];
    breaks.sort(function (a, b) {
      return a - b;
    });

    this.classificationState.setManualBreaks(breaks);
    this.indicatorClassificationService.updateManualMOVBreaksFromDefaultManualBreaks(
      this.isDynamicOrNegativeLayer()
    );

    setTimeout(() => {
      this.classificationState.setManualBreaks(breaks);
      this.indicatorClassificationService.updateManualMOVBreaksFromDefaultManualBreaks(
        this.isDynamicOrNegativeLayer()
      );
      this.restyleCurrentLayer(false);
    }, 1);
  }

  changeDynamicBreaks(breaks) {
    breaks[0] = [...new Set(breaks[0])];
    breaks[0].sort(function (a, b) {
      return a - b;
    });
    breaks[1] = [...new Set(breaks[1])];
    breaks[1].sort(function (a, b) {
      return a - b;
    });

    this.classificationState.dynamicBrewBreaks = breaks;
    this.classificationState.setDynamicBreaks(1, breaks[1]);
    this.classificationState.setDynamicBreaks(0, breaks[0]);

    setTimeout(() => {
      this.classificationState.dynamicBrewBreaks = breaks;
      this.classificationState.setDynamicBreaks(1, breaks[1]);
      this.classificationState.setDynamicBreaks(0, breaks[0]);
    }, 1);
    this.indicatorClassificationService.updateManualMOVBreaksFromDefaultManualBreaks(
      this.isDynamicOrNegativeLayer()
    );

    this.restyleCurrentLayer(false);
  }

  /**
   * binds the popup of a clicked output
   * to layer.feature.properties.popupContent
   */
  onEachFeatureSpatialUnit = (feature, layer) => {
    this.featurePopupHelperService.bindFeaturePropertiesPopupOnClick(
      feature,
      layer,
      'spatialUnitInfoPopupContent'
    );
  };

  onEachFeatureIndicator(feature, layer) {
    const tooltipHtml = this.featurePopupHelperService.buildIndicatorTooltip(
      feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME],
      feature.tempData.indicatorValueText,
      feature.tempData.unitText
    );
    layer.bindTooltip(tooltipHtml, {
      sticky: false, // If true, the tooltip will follow the mouse instead of being fixed at the feature center.
    });

    layer.on({
      mouseover: (l) => this.highlightFeature(l),
      mouseout: (l) => this.resetHighlight(l),
      click: (l) => this.switchHighlightFeature(l),
    });
  }

  switchHighlightFeature(layer) {
    // add or remove feature within a list of "clicked features"
    // those shall be treated specially, i.e. keep being highlighted
    if (
      !this.filterHelperService.featureIsCurrentlySelected(
        layer.target.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
      )
    ) {
      this.filterHelperService.addFeatureToSelection(layer.target.feature);
      this.highlightClickedFeature(layer.target);
    } else {
      //remove from array
      this.filterHelperService.removeFeatureFromSelection(
        layer.target.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
      );
      this.resetHighlightClickedFeature(layer.target);
    }
  }

  highlightFeature(e) {
    const layer = e.target;
    this.visualStyleHelperService.setOpacity(layer.options.fillOpacity);

    this.highlightFeatureForLayer(layer);
  }

  highlightFeatureForLayer(layer) {
    this.setTemporarilyHighlightedStyle(layer);

    // update diagrams for hovered feature
    this.mapService.notifyFeatureHovered(layer.feature.properties);
  }

  highlightClickedFeature(layer) {
    this.setPermanentlyHighlightedStyle(layer);

    // update diagrams for hovered feature
    this.mapService.notifyFeatureHovered(layer.feature.properties);
  }

  setPermanentlyHighlightedStyle(layer) {
    let fillOpacity = 1;
    if (this.envConfigService.useTransparencyOnIndicator) {
      fillOpacity = this.envConfigService.defaultFillOpacityForHighlightedFeatures;
    }

    layer.setStyle({
      weight: 3,
      color: this.envConfigService.defaultColorForClickedFeatures,
      dashArray: '',
      fillOpacity: fillOpacity,
    });

    clearTimeout(this.highlightTimeout);

    this.highlightTimeout = setTimeout(() => {
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        if (layer._map) {
          layer.bringToFront();
          // also bring possible isochrone layer to front
          // so it will not disapper behing indicator layer
          if (this.isochronesLayer) {
            this.isochronesLayer.bringToFront();
          }
        }
      }
    }, 150);
  }

  setTemporarilyHighlightedStyle(layer) {
    let fillOpacity = 1;
    if (this.envConfigService.useTransparencyOnIndicator) {
      fillOpacity = this.envConfigService.defaultFillOpacity;
    }

    layer.setStyle({
      weight: 3,
      color: this.envConfigService.defaultColorForHoveredFeatures,
      dashArray: '',
      fillOpacity: fillOpacity,
    });

    clearTimeout(this.highlightTimeout);

    this.highlightTimeout = setTimeout(() => {
      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        if (layer._map) {
          layer.bringToFront();
          // also bring possible isochrone layer to front
          // so it will not disapper behing indicator layer
          if (this.isochronesLayer) {
            this.isochronesLayer.bringToFront();
          }
        }
      }
    }, 150);
  }

  preserveHighlightedFeatures() {
    this.map.eachLayer((layer) => {
      if (layer.feature) {
        if (
          this.filterHelperService.featureIsCurrentlySelected(
            layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
          )
        ) {
          this.setPermanentlyHighlightedStyle(layer);
          // the legacy broadcast passed the properties unwrapped, so the
          // receivers' array destructuring got undefined — fixed by the typed event
          this.mapService.notifyFeatureHovered(layer.feature.properties);
        }
      }
    });
  }

  resetHighlight(e) {
    const layer = e.target;
    this.resetHighlightForLayer(layer);

    if (
      !this.filterHelperService.featureIsCurrentlySelected(
        layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
      )
    ) {
      layer.bringToBack();
    }
    //layer.bringToBack();
  }

  resetHighlightForLayer(layer) {
    let style;

    // only restyle feature when not in list of clicked features
    if (
      !this.filterHelperService.featureIsCurrentlySelected(
        layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
      )
    ) {
      if (
        this.filterHelperService.featureIsCurrentlyFiltered(
          layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
        )
      ) {
        style = this.filteredStyle;
      } else if (!this.chartDisplayState.isMeasureOfValueChecked) {
        //this.currentIndicatorLayer.resetStyle(layer);
        if (this.indicatorTypeOfCurrentLayer.includes('DYNAMIC')) {
          style = this.visualStyleHelperService.styleDynamicIndicator(
            layer.feature,
            this.dynamicIncreaseBrew,
            this.dynamicDecreaseBrew,
            this.propertyName,
            this.envConfigService.useTransparencyOnIndicator,
            false
          );
        } else {
          if (this.classificationState.classifyMethod == 'manual') {
            style = this.visualStyleHelperService.styleDefault(
              layer.feature,
              this.manualBrew,
              this.dynamicIncreaseBrew,
              this.dynamicDecreaseBrew,
              this.propertyName,
              this.envConfigService.useTransparencyOnIndicator,
              this.datasetContainsNegativeValues,
              false
            );
          } else {
            // von hier, defaultBrew
            style = this.visualStyleHelperService.styleDefault(
              layer.feature,
              this.defaultBrew,
              this.dynamicIncreaseBrew,
              this.dynamicDecreaseBrew,
              this.propertyName,
              this.envConfigService.useTransparencyOnIndicator,
              this.datasetContainsNegativeValues,
              false
            );
          }
        }
      } else {
        style = this.visualStyleHelperService.styleMeasureOfValue(
          layer.feature,
          this.gtMeasureOfValueBrew,
          this.ltMeasureOfValueBrew,
          this.propertyName,
          this.envConfigService.useTransparencyOnIndicator,
          false
        );
      }
      layer.setStyle(style);
    } else {
      this.setPermanentlyHighlightedStyle(layer);
    }

    //update diagrams for unhoveredFeature
    this.mapService.notifyFeatureUnhovered(layer.feature.properties);
  }

  resetHighlightClickedFeature(layer) {
    let style;
    //this.currentIndicatorLayer.resetStyle(layer);
    if (
      this.filterHelperService.featureIsCurrentlyFiltered(
        layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
      )
    ) {
      layer.setStyle(this.filteredStyle);
    } else if (!this.chartDisplayState.isMeasureOfValueChecked) {
      //this.currentIndicatorLayer.resetStyle(layer);
      if (this.indicatorTypeOfCurrentLayer.includes('DYNAMIC')) {
        style = this.visualStyleHelperService.styleDynamicIndicator(
          layer.feature,
          this.dynamicIncreaseBrew,
          this.dynamicDecreaseBrew,
          this.propertyName,
          this.envConfigService.useTransparencyOnIndicator,
          false
        );

        layer.setStyle(style);
      } else {
        style = this.visualStyleHelperService.styleDefault(
          layer.feature,
          this.defaultBrew,
          this.dynamicIncreaseBrew,
          this.dynamicDecreaseBrew,
          this.propertyName,
          this.envConfigService.useTransparencyOnIndicator,
          this.datasetContainsNegativeValues,
          false
        );

        layer.setStyle(style);
      }
    } else {
      style = this.visualStyleHelperService.styleMeasureOfValue(
        layer.feature,
        this.gtMeasureOfValueBrew,
        this.ltMeasureOfValueBrew,
        this.propertyName,
        this.envConfigService.useTransparencyOnIndicator,
        false
      );

      layer.setStyle(style);
    }
  }
  wait = (ms) => new Promise((r, j) => setTimeout(r, ms));

  // dedicated functions
  recenterMapOnly() {
    setTimeout(() => this.fitBounds()); // mini timeout to cover css transition effects
  }

  // dedicated functions
  resizeMapOnly() {
    setTimeout(() => this.map.invalidateSize(true)); // mini timeout to cover css transition effects
  }

  fitBounds() {
    if (this.map && this.currentIndicatorLayer) {
      this.map.invalidateSize(true);
      // this.map.setView(L.latLng(this.latCenter, this.lonCenter), this.zoomLevel);
      this.map.fitBounds(this.currentIndicatorLayer.getBounds());
    }
  }

  zoomToFeature(e) {
    this.map.fitBounds(e.target.getBounds());
  }

  private _replaceIndicatorLayer(
    indicatorMetadataAndGeoJSON,
    spatialUnitName,
    date,
    isCustomComputation,
    justRestyling = false
  ) {
    this.classificationState.isCustomComputation = !!isCustomComputation;
    //reset opacity
    this.visualStyleHelperService.setOpacity(this.envConfigService.defaultFillOpacity);

    this.refreshFilteredStyle();
    this.refreshOutliersStyle();
    this.refreshNoDataStyle();

    this.currentIndicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;

    if (this.currentIndicatorLayer) {
      this.layerControl.removeLayer(this.currentIndicatorLayer);
      this.map.removeLayer(this.currentIndicatorLayer);
    }

    this.date = date;
    this.indicatorPropertyName = this.envConfigService.indicatorDatePrefix + date;
    this.propertyName = this.indicatorPropertyName;
    this.indicatorName = indicatorMetadataAndGeoJSON.indicatorName;
    this.indicatorDescription = indicatorMetadataAndGeoJSON.metadata.description;
    this.indicatorUnit = indicatorMetadataAndGeoJSON.unit;
    this.indicatorTypeOfCurrentLayer = indicatorMetadataAndGeoJSON.indicatorType;

    const result = this.indicatorClassificationService.buildClassification({
      mode: 'replace',
      indicatorMetadataAndGeoJSON,
      indicatorPropertyName: this.indicatorPropertyName,
      datasetContainsNegativeValues: this.datasetContainsNegativeValues,
    });
    this.adoptClassificationResult(result);
    this.currentGeoJSONOfCurrentLayer = this.currentIndicatorMetadataAndGeoJSON.geoJSON;

    // aggregate stats skip NoData features, so running this after the
    // pipeline's raster filter yields the same values as before
    this.selectionState.setAllFeaturesProperty(
      indicatorMetadataAndGeoJSON,
      this.indicatorPropertyName
    );
    this.selectionState.setSelectedFeatureProperty(
      this.filterHelperService.selectedIndicatorFeatureIds,
      this.indicatorPropertyName
    );

    const layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
      style: (feature) => result.styleFor(feature),
      onEachFeature: (e, l) => {
        this.onEachFeatureIndicator(e, l);
      },
    });
    this.currentIndicatorLayer = layer;

    this.mapService.notifyLegendDisplayUpdated({
      containsZeroValues: this.currentIndicatorContainsZeroValues,
      datasetContainsNegativeValues: this.datasetContainsNegativeValues,
      containsNoDataValues: this.currentIndicatorContainsNoDataValues,
      containsOutliers_high: this.containsOutliers_high,
      containsOutliers_low: this.containsOutliers_low,
      outliers_low: this.outliers_low,
      outliers_high: this.outliers_high,
      selectedDate: this.selectionState.selectedDate,
    });

    let layerName = indicatorMetadataAndGeoJSON.indicatorName + '_' + spatialUnitName + '_' + date;

    if (isCustomComputation) {
      layerName += ' - individuelles Berechnungsergebnis';
    }

    this.layerControl.addOverlay(layer, layerName, MAP_LAYER_GROUPS.indicator);
    layer.addTo(this.map);
    this.mapControlsService.updateSearchControl();

    this.fitBounds();

    if (this.containsOutliers_low || this.containsOutliers_high) {
      this.showOutlierInfoAlert = true;
    }

    this.mapService.notifyDiagramsUpdate({
      indicatorMetadataAndGeoJSON: this.currentIndicatorMetadataAndGeoJSON,
      spatialUnitLevel: this.selectionState.selectedSpatialUnit.spatialUnitLevel,
      spatialUnitId: this.selectionState.selectedSpatialUnit.spatialUnitId,
      date,
      brew: this.defaultBrew,
      gtMeasureOfValueBrew: this.gtMeasureOfValueBrew,
      ltMeasureOfValueBrew: this.ltMeasureOfValueBrew,
      dynamicIncreaseBrew: this.dynamicIncreaseBrew,
      dynamicDecreaseBrew: this.dynamicDecreaseBrew,
      isMeasureOfValueChecked: this.chartDisplayState.isMeasureOfValueChecked,
      measureOfValue: this.chartDisplayState.measureOfValue,
      justRestyling,
    });

    this.map.invalidateSize(true);
    this.hideLoadingIconOnMap();
  }

  /** Copies the pipeline result into the component fields that the legend/diagram broadcasts and the highlight code read. */
  private adoptClassificationResult(result: ClassificationResult) {
    this.defaultBrew = result.defaultBrew;
    this.manualBrew = result.manualBrew;
    this.gtMeasureOfValueBrew = result.gtMeasureOfValueBrew;
    this.ltMeasureOfValueBrew = result.ltMeasureOfValueBrew;
    this.dynamicIncreaseBrew = result.dynamicIncreaseBrew;
    this.dynamicDecreaseBrew = result.dynamicDecreaseBrew;
    this.datasetContainsNegativeValues = result.datasetContainsNegativeValues;
    this.currentIndicatorContainsZeroValues = result.facts.containsZeroValues;
    this.currentIndicatorContainsNoDataValues = result.facts.containsNoDataValues;
    this.containsOutliers_high = result.facts.containsOutliers_high;
    this.containsOutliers_low = result.facts.containsOutliers_low;
    this.outliers_high = result.facts.outliers_high;
    this.outliers_low = result.facts.outliers_low;
  }

  private isDynamicOrNegativeLayer(): boolean {
    return (
      this.indicatorTypeOfCurrentLayer.includes('DYNAMIC') || !!this.datasetContainsNegativeValues
    );
  }

  onChangeDate(date: string) {
    if (!this.currentIndicatorLayer) return;

    this.date = date;
    this.indicatorPropertyName = this.envConfigService.indicatorDatePrefix + date;
    this.propertyName = this.indicatorPropertyName;

    this.restyleCurrentLayer(false);
  }

  onChangeSpatialUnit() {
    this.classificationState.dynamicBrewBreaks = null;
  }

  allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin() {
    this.indicatorClassificationService.updateManualMOVBreaksFromDefaultManualBreaks(
      this.isDynamicOrNegativeLayer()
    );
    this.restyleCurrentLayer(false);
  }

  restyleCurrentLayer(skipDiagramRefresh) {
    this.refreshFilteredStyle();
    this.refreshOutliersStyle();
    this.refreshNoDataStyle();

    this.defaultBrew = undefined;
    this.gtMeasureOfValueBrew = undefined;
    this.ltMeasureOfValueBrew = undefined;
    this.manualBrew = undefined;

    if (this.currentIndicatorLayer) {
      const result = this.indicatorClassificationService.buildClassification({
        mode: 'restyle',
        indicatorMetadataAndGeoJSON: this.currentIndicatorMetadataAndGeoJSON,
        indicatorPropertyName: this.indicatorPropertyName,
        indicatorType: this.indicatorTypeOfCurrentLayer,
        datasetContainsNegativeValues: this.datasetContainsNegativeValues,
      });
      this.adoptClassificationResult(result);
      this.currentGeoJSONOfCurrentLayer = this.currentIndicatorMetadataAndGeoJSON.geoJSON;

      this.currentIndicatorLayer.eachLayer((layer) => {
        layer.setStyle(result.styleFor(layer.feature));

        if (layer.getTooltip()) {
          layer.setTooltipContent(
            this.featurePopupHelperService.buildIndicatorTooltip(
              layer.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME],
              layer.feature.tempData.indicatorValueText,
              layer.feature.tempData.unitText
            )
          );
        }
      });

      this.mapService.notifyLegendDisplayUpdated({
        containsZeroValues: this.currentIndicatorContainsZeroValues,
        datasetContainsNegativeValues: this.datasetContainsNegativeValues,
        containsNoDataValues: this.currentIndicatorContainsNoDataValues,
        containsOutliers_high: this.containsOutliers_high,
        containsOutliers_low: this.containsOutliers_low,
        outliers_low: this.outliers_low,
        outliers_high: this.outliers_high,
        selectedDate: this.selectionState.selectedDate,
      });

      if (!skipDiagramRefresh) {
        const justRestyling = true;
        const brewForDiagrams =
          this.classificationState.classifyMethod == 'manual' ? this.manualBrew : this.defaultBrew;

        this.mapService.notifyDiagramsUpdate({
          indicatorMetadataAndGeoJSON: this.currentIndicatorMetadataAndGeoJSON,
          spatialUnitLevel: this.selectionState.selectedSpatialUnit.spatialUnitLevel,
          spatialUnitId: this.selectionState.selectedSpatialUnit.spatialUnitId,
          date: this.date,
          brew: brewForDiagrams,
          gtMeasureOfValueBrew: this.gtMeasureOfValueBrew,
          ltMeasureOfValueBrew: this.ltMeasureOfValueBrew,
          dynamicIncreaseBrew: this.dynamicIncreaseBrew,
          dynamicDecreaseBrew: this.dynamicDecreaseBrew,
          isMeasureOfValueChecked: this.chartDisplayState.isMeasureOfValueChecked,
          measureOfValue: this.chartDisplayState.measureOfValue,
          justRestyling,
        });
      }

      //ensure that highlighted feature remain highlighted
      this.preserveHighlightedFeatures();
    }

    this.map.invalidateSize(true);
  }

  highlightFeatureOnMap(spatialFeatureName) {
    if (!spatialFeatureName) {
      return;
    }
    let done = false;

    this.map.eachLayer((layer) => {
      if (!done && layer.feature) {
        if (
          layer.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] ==
          spatialFeatureName
        ) {
          this.highlightFeatureForLayer(layer);
          done = true;
        }
      }
    });
  }

  unhighlightFeatureOnMap(spatialFeatureName) {
    if (!spatialFeatureName) {
      return;
    }

    let done = false;

    this.map.eachLayer((layer) => {
      if (!done && layer.feature) {
        if (
          layer.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] ==
          spatialFeatureName
        ) {
          this.resetHighlightForLayer(layer);
          done = true;
        }
      }
    });
  }

  switchHighlightFeatureOnMap(spatialFeatureName) {
    if (!spatialFeatureName) {
      return;
    }

    let done = false;

    this.map.eachLayer((layer) => {
      if (!done && layer.feature) {
        if (
          layer.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] ==
          spatialFeatureName
        ) {
          this.switchHighlightFeature(layer);
          done = true;
        }
      }
    });
  }

  unselectAllFeatures() {
    this.filterHelperService.clearSelectedFeatures();
    this.restyleCurrentLayer(false);
  }
}
