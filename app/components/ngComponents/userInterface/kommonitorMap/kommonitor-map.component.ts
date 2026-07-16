import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import * as turf from '@turf/turf';
import domtoimage from 'dom-to-image-more';
import { saveAs } from 'file-saver';
import * as L from 'leaflet';
import { OpenStreetMapProvider, SearchControl } from 'leaflet-geosearch';
import 'leaflet-measure';
import 'leaflet-search';
import 'leaflet.markercluster';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import {
  ClassificationResult,
  IndicatorClassificationService,
} from 'services/indicator-classification-service/indicator-classification.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';
import { createMarkerClusterGroup } from 'util/leaflet-cluster';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import {
  FileHelperService,
  FileUploadState,
} from 'services/file-helper-service/file-helper.service';
import { MapService } from 'services/map-service/map.service';
import '../../../../../customizedExternalLibs/leaflet-groupedlayercontrol/leaflet.groupedlayercontrol';

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
  private broadcastService = inject(BroadcastService);
  private visualStyleHelperService = inject(VisualStyleHelperServiceNew);
  private indicatorClassificationService = inject(IndicatorClassificationService);
  private filterHelperService = inject(FilterHelperService);
  private genericMapHelperService = inject(GenericMapHelperService);
  private envConfigService = inject(EnvConfigService);
  private fileHelperService = inject(FileHelperService);
  private mapService = inject(MapService);
  private reachabilityStateService = inject(ReachabilityStateService);
  private reachabilityMapHelperService = inject(ReachabilityMapHelperService);

  private readonly destroyRef = inject(DestroyRef);

  private map;
  searchControl: any;
  geosearchControl: any;

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

  markerLayer: any = undefined;
  isochroneLayer: any = undefined;

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
  date = undefined;

  filteredStyle;

  // central map object
  scaleBar: any = undefined;
  layerControl: any = undefined;
  showInfoControl = true;
  showLegend = true;
  overlays: any[] = [];
  baseMaps: any[] = [];
  spatialUnitLayerGroupName = 'Raumebenen';
  georesourceLayerGroupName = 'Georessourcen';
  poiLayerGroupName = 'Points of Interest';
  loiLayerGroupName = 'Lines of Interest';
  aoiLayerGroupName = 'Areas of Interest';
  indicatorLayerGroupName = 'Indikatoren';
  reachabilityLayerGroupName = 'Erreichbarkeiten';
  wmsLayerGroupName = 'Web Map Services (WMS)';
  wfsLayerGroupName = 'Web Feature Services (WFS)';
  fileLayerGroupName = 'Dateilayer';
  spatialUnitOutlineLayerGroupName = 'Raumebenen Umringe';

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
    L.TileLayer.Grayscale = L.TileLayer.extend({
      options: {
        quotaRed: 21,
        quotaGreen: 71,
        quotaBlue: 8,
        quotaDividerTune: 0,
        quotaDivider: function () {
          return this.quotaRed + this.quotaGreen + this.quotaBlue + this.quotaDividerTune;
        },
      },

      initialize: function (url, options) {
        options = options || {};
        options.crossOrigin = true;
        L.TileLayer.prototype.initialize.call(this, url, options);

        this.on('tileload', (e) => {
          this._makeGrayscale(e.tile);
        });
      },

      _createTile: function () {
        const tile = L.TileLayer.prototype._createTile.call(this);
        tile.crossOrigin = 'Anonymous';
        return tile;
      },

      _makeGrayscale: function (img) {
        if (img.getAttribute('data-grayscaled')) return;

        img.crossOrigin = '';
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0);

        const imgd = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        const pix = imgd.data;
        for (let i = 0, n = pix.length; i < n; i += 4) {
          pix[i] =
            pix[i + 1] =
            pix[i + 2] =
              (this.options.quotaRed * pix[i] +
                this.options.quotaGreen * pix[i + 1] +
                this.options.quotaBlue * pix[i + 2]) /
              this.options.quotaDivider();
        }
        ctx!.putImageData(imgd, 0, 0);
        img.setAttribute('data-grayscaled', true);
        img.src = canvas.toDataURL();
      },
    });

    L.tileLayer.grayscale = function (url, options) {
      return new L.TileLayer.Grayscale(url, options);
    };

    setTimeout(() => {
      this.initSpatialUnitOutlineLayer();
    }, 2000);

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

    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      const title = broadcastMsg.msg;
      const values: any = broadcastMsg.values;

      switch (title) {
        case BroadcastMessage.ChangeClassifyMethod:
          {
            this.changeClassifyMethod(values);
          }
          break;
        case BroadcastMessage.ChangeNumClasses:
          {
            this.changeNumClasses(values);
          }
          break;
        case BroadcastMessage.ChangeSpatialUnit:
          {
            this.onChangeSpatialUnit();
          }
          break;
        case BroadcastMessage.ShowLoadingIconOnMap:
          {
            this.showLoadingIconOnMap();
          }
          break;
        case BroadcastMessage.HideLoadingIconOnMap:
          {
            this.hideLoadingIconOnMap();
          }
          break;
        case BroadcastMessage.AddPoiGeoresourceAsGeoJSON:
          {
            this.addPoiGeoresourceAsGeoJSON(values);
          }
          break;
        case BroadcastMessage.RemovePoiGeoresource:
          {
            this.removePoiGeoresource(values);
          }
          break;
        case BroadcastMessage.AddWmsLayerToMap:
          {
            this.addWmsLayerToMap(values);
          }
          break;
        case BroadcastMessage.RemoveWmsLayerFromMap:
          {
            this.removeWmsLayerFromMap(values);
          }
          break;
        case BroadcastMessage.AddWfsLayerToMap:
          {
            this.addWfsLayerToMap(values);
          }
          break;
        case BroadcastMessage.RemoveWfsLayerFromMap:
          {
            this.removeWfsLayerFromMap(values);
          }
          break;
        case BroadcastMessage.AddLoiGeoresourceAsGeoJSON:
          {
            this.addLoiGeoresourceAsGeoJSON(values);
          }
          break;
        case BroadcastMessage.RemoveLoiGeoresource:
          {
            this.removeLoiGeoresource(values);
          }
          break;
        case BroadcastMessage.AddAoiGeoresourceAsGeoJSON:
          {
            this.addAoiGeoresourceAsGeoJSON(values);
          }
          break;
        case BroadcastMessage.RemoveAoiGeoresource:
          {
            this.removeAoiGeoresource(values);
          }
          break;
        case BroadcastMessage.ExportMap:
          {
            this.exportMap();
          }
          break;
        case BroadcastMessage.ToggleInfoControl:
          {
            this.toggleInfoControl();
          }
          break;
        case BroadcastMessage.ChangeDynamicBreaks:
          {
            this.changeDynamicBreaks(values);
          }
          break;
        case BroadcastMessage.AllIndicatorPropertiesForCurrentSpatialUnitAndTimeSetupBegin:
          {
            this.allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin();
          }
          break;
        case BroadcastMessage.RestyleCurrentLayer:
          {
            this.restyleCurrentLayer(values);
          }
          break;
        case BroadcastMessage.PreserveHighlightedFeatures:
          {
            this.preserveHighlightedFeatures();
          }
          break;
        case BroadcastMessage.ChangeColorScheme:
          {
            this.changeColorScheme(values);
          }
          break;
        case BroadcastMessage.ChangeBreaks:
          {
            this.changeBreaks(values);
          }
          break;
        case BroadcastMessage.UnselectAllFeatures:
          {
            this.unselectAllFeatures();
          }
          break;
        case BroadcastMessage.OnGlobalFilterChange:
          {
            this.onGlobalFilterChange();
          }
          break;
        case BroadcastMessage.OpenLayerControl:
          {
            this.openLayerControl();
          }
          break;
        case BroadcastMessage.HighlightFeatureOnMap:
          {
            this.highlightFeatureOnMap(values);
          }
          break;
        case BroadcastMessage.SwitchHighlightFeatureOnMap:
          {
            this.switchHighlightFeatureOnMap(values);
          }
          break;
        case BroadcastMessage.UnhighlightFeatureOnMap:
          {
            this.unhighlightFeatureOnMap(values);
          }
          break;
        case BroadcastMessage.ToggleExpertControl:
          {
            this.toggleExpertControl();
          }
          break;
        case BroadcastMessage.AddFileLayerToMap:
          {
            this.addFileLayerToMap(values);
          }
          break;
        case BroadcastMessage.AdjustOpacityForFileLayer:
          {
            this.adjustOpacityForFileLayer(values);
          }
          break;
        case BroadcastMessage.AdjustColorForFileLayer:
          {
            this.adjustColorForFileLayer(values);
          }
          break;
        case BroadcastMessage.ReplaceReachabilityScenarioOnMainMap:
          {
            this.replaceReachabilityScenarioOnMainMap(values);
          }
          break;
        case BroadcastMessage.RemoveReachabilityScenarioFromMainMap:
          {
            this.removeReachabilityScenarioFromMainMap();
          }
          break;
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();

    if (this.envConfigService.sortableLayers) {
      this.sortableLayers = this.envConfigService.sortableLayers;
    } else {
      this.sortableLayers = ['Web Map Services (WMS)'];
    }

    this.initSearch();
    this.initMeasurement();
  }

  initSearch() {
    const provider = new OpenStreetMapProvider({
      params: {
        'accept-language': 'de', // render results in Dutch
        countrycodes: 'de', // limit search results to the Netherlands
        addressdetails: 1, // include additional address detail parts
        viewbox:
          '' +
          (Number(this.envConfigService.initialLongitude) - 0.001) +
          ',' +
          (Number(this.envConfigService.initialLatitude) - 0.001) +
          ',' +
          (Number(this.envConfigService.initialLongitude) + 0.001) +
          ',' +
          (Number(this.envConfigService.initialLatitude) + 0.001),
      },
      searchUrl: this.envConfigService.targetUrlToGeocoderService + '/search',
      reverseUrl: this.envConfigService.targetUrlToGeocoderService + '/reverse',
    });

    this.geosearchControl = SearchControl({
      position: 'topleft',
      provider: provider,
      style: 'button',
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: true, // optional: true|false  - default true
      showPopup: false, // optional: true|false  - default false
      marker: {
        // optional: L.Marker    - default L.Icon.Default
        icon: new L.Icon.Default(),
        draggable: false,
      },
      popupFormat: ({ query, result }) => result.label, // optional: function    - default returns result label
      maxMarkers: 1, // optional: number      - default 1
      retainZoomLevel: false, // optional: true|false  - default false
      animateZoom: true, // optional: true|false  - default true
      autoClose: false, // optional: true|false  - default false
      searchLabel: 'Suche nach Adressen ...', // optional: string      - default 'Enter address'
      keepResult: false, // optional: true|false  - default false
    });

    this.map.addControl(this.geosearchControl);

    this.searchControl = new this.MultipleResultsLeafletSearch({});
    this.searchControl.addTo(this.map);

    $('.geosearch').toggle();

    $('.leaflet-control-search').toggle();
  }

  initMeasurement() {
    const measureOptions = {
      position: 'topleft',
      primaryLengthUnit: 'meters',
      secondaryLengthUnit: 'kilometers',
      primaryAreaUnit: 'sqmeters',
      activeColor: '#d15c54',
      completedColor: '#d15c54',
      decPoint: ',',
      thousandsSep: '.',
    };

    const measureControl = new L.Control.Measure(measureOptions);
    measureControl.addTo(this.map);

    // blendet den button erstmalig aus
    $('.leaflet-control-measure').toggle();

    // fix map-jumping with every click
    L.Control.Measure.include({
      // Prevent auto-panning when the capture marker is placed
      _setCaptureMarkerIcon: function () {
        // Turn off autoPan
        this._captureMarker.options.autoPanOnFocus = false;
        // Call the original icon setup
        this._captureMarker.setIcon(
          L.divIcon({
            iconSize: this._map.getSize().multiplyBy(2),
          })
        );
      },

      // override _startMeasure if necessary
      // _startMeasure: function () {
      //   // Your custom override
      // },
    });
  }

  private initMap(): void {
    this.loadingData = true;

    const baseLayerDefinitionsMap = new Map();
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
    ];

    for (const baseMapEntry of this.envConfigService.baseLayers) {
      if (baseMapEntry.layerType === 'TILE_LAYER_GRAYSCALE') {
        const grayscaleLayer = new L.tileLayer.grayscale(baseMapEntry.url, {
          minZoom: baseMapEntry.minZoomLevel,
          maxZoom: baseMapEntry.maxZoomLevel,
          attribution: baseMapEntry.attribution_html,
        });
        baseLayerDefinitionsMap.set(baseMapEntry.name, grayscaleLayer);
        this.mapOverlayState.baseLayerDefinitionsArray.push({
          layerConfig: baseMapEntry,
        });
      } else if (baseMapEntry.layerType === 'TILE_LAYER') {
        const tileLayer = new L.tileLayer(baseMapEntry.url, {
          minZoom: baseMapEntry.minZoomLevel,
          maxZoom: baseMapEntry.maxZoomLevel,
          attribution: baseMapEntry.attribution_html,
        });
        baseLayerDefinitionsMap.set(baseMapEntry.name, tileLayer);
        this.mapOverlayState.baseLayerDefinitionsArray.push({
          layerConfig: baseMapEntry,
        });
      } else if (baseMapEntry.layerType === 'WMS') {
        const wmsLayer = new L.tileLayer.wms(baseMapEntry.url, {
          minZoom: baseMapEntry.minZoomLevel,
          maxZoom: baseMapEntry.maxZoomLevel,
          attribution: baseMapEntry.attribution_html,
          layers: baseMapEntry.layerName_WMS,
          format: 'image/png',
        });
        baseLayerDefinitionsMap.set(baseMapEntry.name, wmsLayer);
        this.mapOverlayState.baseLayerDefinitionsArray.push({
          layerConfig: baseMapEntry,
        });
      }
    }

    this.map = L.map('ngMap', {
      center: [this.envConfigService.initialLatitude, this.envConfigService.initialLongitude],
      zoom: this.envConfigService.initialZoomLevel,
      zoomDelta: 0.5,
      zoomSnap: 0.5,
      layers: [baseLayerDefinitionsMap.get(this.envConfigService.baseLayers[0].name)],
    });

    this.envConfigService.currentLatitude = this.envConfigService.initialLatitude;
    this.envConfigService.currentLongitude = this.envConfigService.initialLongitude;
    this.envConfigService.currentZoomLevel = this.envConfigService.initialZoomLevel;

    // update zoom and extent
    this.map.on('zoomend', (eo) => {
      const latLng = this.map.getCenter();
      this.envConfigService.currentLatitude = latLng.lat;
      this.envConfigService.currentLongitude = latLng.lng;
      this.envConfigService.currentZoomLevel = this.map.getZoom();
    });
    this.map.on('moveend', (eo) => {
      const latLng = this.map.getCenter();
      this.envConfigService.currentLatitude = latLng.lat;
      this.envConfigService.currentLongitude = latLng.lng;
      this.envConfigService.currentZoomLevel = this.map.getZoom();
    });

    this.baseMaps = [];

    baseLayerDefinitionsMap.forEach((value, key, map) => {
      this.baseMaps[key] = value;
    });

    const groupedOverlays = {
      indicatorLayerGroupName: {},
      poiLayerGroupName: {},
      loiLayerGroupName: {},
      aoiLayerGroupName: {},
      wmsLayerGroupName: {},
      wfsLayerGroupName: {},
      fileLayerGroupName: {},
      reachabilityLayerGroupName: {},
      spatialUnitOutlineLayerGroupName: {},
    };

    this.layerControl = L.control.groupedLayers(this.baseMaps, groupedOverlays, {
      collapsed: false,
      position: 'topleft',
      layers: this.sortableLayers,
    });

    //backup ico groupedLayers not working properly
    //this.layerControl = L.control.layers(this.baseMaps, [], {position: 'topleft'}).addTo(this.map);

    delete this.layerControl._groupList;
    this.layerControl._groupList = ['', 'Raumebene Umringe', 'Indikatoren'];

    this.map.addControl(this.layerControl);

    // Hide Leaflet layer control button in favor of a custom button for opening the layer control group
    $('.leaflet-control-layers').hide();

    // Disable dragging when user's cursor enters the element
    this.layerControl.getContainer().addEventListener('mouseover', () => {
      this.map.dragging.disable();
      this.map.touchZoom.disable();
      this.map.doubleClickZoom.disable();
      this.map.scrollWheelZoom.disable();
    });

    // Re-enable dragging when user's cursor leaves the element
    this.layerControl.getContainer().addEventListener('mouseout', () => {
      this.map.dragging.enable();
      this.map.touchZoom.enable();
      this.map.doubleClickZoom.enable();
      this.map.scrollWheelZoom.enable();
    });

    this.scaleBar = L.control.scale({ position: 'bottomleft' });
    this.scaleBar.addTo(this.map);

    // hatch patterns
    // diagonalPattern = new L.PatternPath({ d: "M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" , fill: true });

    // this.outlierFillPattern_high = new L.Pattern();
    // this.outlierFillPattern_high.addShape(diagonalPattern);
    // this.outlierFillPattern_high.addTo(this.map);

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

  openLayerControl() {
    $('.leaflet-control-layers').toggle();
  }

  toggleExpertControl() {
    $('.leaflet-control-search').toggle();
    $('.geosearch').toggle();
    $('.leaflet-control-measure').toggle();
  }

  onCloseOutlierAlert() {
    // $("#outlierInfo").hide();
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
            this.spatialUnitOutlineLayerGroupName
          );
          this.updateSearchControl();
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

  isKomMonitorSpecificProperty(propertyKey) {
    let isKomMonitorSpecificProperty = false;

    if (propertyKey == 'outlier') {
      isKomMonitorSpecificProperty = true;
    } else if (propertyKey == this.envConfigService.VALID_START_DATE_PROPERTY_NAME) {
      isKomMonitorSpecificProperty = true;
    } else if (propertyKey == this.envConfigService.VALID_END_DATE_PROPERTY_NAME) {
      isKomMonitorSpecificProperty = true;
    } else if (propertyKey == 'bbox') {
      isKomMonitorSpecificProperty = true;
    } else if (propertyKey.includes(this.envConfigService.indicatorDatePrefix)) {
      isKomMonitorSpecificProperty = true;
    }

    return isKomMonitorSpecificProperty;
  }

  MultipleResultsLeafletSearch = L.Control.Search.extend({
    _makeUniqueKey: function (featureName, featureId) {
      return featureName + ' (Name) - ' + featureId + ' (ID)';
    },

    _searchInLayer: function (layer, retRecords, propName) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- Leaflet callback relies on the dynamic `this`
      const self = this;
      let loc;
      let key_withUniqueID;

      if (layer instanceof L.Control.Search.Marker) return;

      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        if (self._getPath(layer.options, propName)) {
          loc = layer.getLatLng();
          loc.layer = layer;
          retRecords[self._getPath(layer.options, propName)] = loc;
        } else if (self._getPath(layer.feature.properties, propName)) {
          loc = layer.getLatLng();
          loc.layer = layer;
          key_withUniqueID = this._makeUniqueKey(
            self._getPath(layer.feature.properties, propName),
            layer.feature.properties.ID
          );
          retRecords[key_withUniqueID] = loc;
        } else {
          //throw new Error("propertyName '"+propName+"' not found in marker");
          console.warn("propertyName '" + propName + "' not found in marker");
        }
      } else if (
        layer instanceof L.Path ||
        layer instanceof L.Polyline ||
        layer instanceof L.Polygon
      ) {
        if (self._getPath(layer.options, propName)) {
          loc = layer.getBounds().getCenter();
          loc.layer = layer;
          retRecords[self._getPath(layer.options, propName)] = loc;
        } else if (self._getPath(layer.feature.properties, propName)) {
          loc = layer.getBounds().getCenter();
          loc.layer = layer;
          key_withUniqueID = this._makeUniqueKey(
            self._getPath(layer.feature.properties, propName),
            layer.feature.properties.ID
          );
          retRecords[key_withUniqueID] = loc;
        } else {
          //throw new Error("propertyName '"+propName+"' not found in shape");
          console.warn("propertyName '" + propName + "' not found in shape");
        }
      } else if (Object.prototype.hasOwnProperty.call(layer, 'feature')) //GeoJSON
      {
        if (Object.prototype.hasOwnProperty.call(layer.feature.properties, propName)) {
          key_withUniqueID = this._makeUniqueKey(
            self._getPath(layer.feature.properties, propName),
            layer.feature.properties.ID
          );
          if (layer.getLatLng && typeof layer.getLatLng === 'function') {
            loc = layer.getLatLng();
            loc.layer = layer;
            retRecords[key_withUniqueID] = loc;
          } else if (layer.getBounds && typeof layer.getBounds === 'function') {
            loc = layer.getBounds().getCenter();
            loc.layer = layer;
            retRecords[key_withUniqueID] = loc;
          } else {
            console.warn('Unknown type of Layer');
          }
        } else {
          //throw new Error("propertyName '"+propName+"' not found in feature");
          console.warn("propertyName '" + propName + "' not found in feature");
        }
      } else if (layer instanceof L.LayerGroup) {
        layer.eachLayer(function (layer) {
          self._searchInLayer(layer, retRecords, propName);
        });
      }
    },
    _defaultMoveToLocation: function (latlng, title, map) {
      if (this.options.zoom) this._map.setView(latlng, this.options.zoom);
      else this._map.panTo(latlng);

      // add collapse after click on item
      this.collapse();
    },
    _handleAutoresize: function () {
      let maxWidth;

      if (!this._map) {
        this._map = this.map;
      }

      if (this._input.style.maxWidth !== this._map._container.offsetWidth) {
        maxWidth = this._map._container.clientWidth;

        // other side margin + padding + width border + width search-button + width search-cancel
        maxWidth -= 10 + 20 + 1 + 30 + 22;

        this._input.style.maxWidth = maxWidth.toString() + 'px';
      }

      if (
        this.options.autoResize &&
        this._container.offsetWidth + 20 < this._map._container.offsetWidth
      ) {
        this._input.size =
          this._input.value.length < this._inputMinSize
            ? this._inputMinSize
            : this._input.value.length;
      }
    },
  });

  updateSearchControl() {
    const isKomMonitorSpecificProperty = (propertyKey) => {
      let isKomMonitorSpecificProperty = false;

      if (propertyKey == 'outlier') {
        isKomMonitorSpecificProperty = true;
      } else if (propertyKey == this.envConfigService.VALID_START_DATE_PROPERTY_NAME) {
        isKomMonitorSpecificProperty = true;
      } else if (propertyKey == this.envConfigService.VALID_END_DATE_PROPERTY_NAME) {
        isKomMonitorSpecificProperty = true;
      } else if (propertyKey == 'bbox') {
        isKomMonitorSpecificProperty = true;
      } else if (propertyKey.includes(this.envConfigService.indicatorDatePrefix)) {
        isKomMonitorSpecificProperty = true;
      }

      return isKomMonitorSpecificProperty;
    };

    setTimeout(() => {
      if (this.searchControl) {
        try {
          this.map.removeControl(this.searchControl);
          this.searchControl = undefined;
        } catch (error) {
          this.mapErrorNotificationService.displayMapApplicationError(error);
        }
      }

      // build L.featureGroup of available POI layers
      const featureLayers: any[] = [];

      for (const layerEntry of this.layerControl._layers) {
        if (layerEntry) {
          if (layerEntry.overlay) {
            if (this.map.hasLayer(layerEntry.layer)) {
              if (
                layerEntry.group.name === this.poiLayerGroupName ||
                layerEntry.group.name === this.loiLayerGroupName ||
                layerEntry.group.name === this.aoiLayerGroupName ||
                layerEntry.group.name === this.indicatorLayerGroupName ||
                layerEntry.group.name === this.wfsLayerGroupName ||
                layerEntry.group.name === this.fileLayerGroupName
              ) {
                featureLayers.push(layerEntry.layer);
              }
            }
          }
        }
      }

      let layerGroup;
      // if no relevant layers are currently displayed, then
      if (featureLayers.length === 0) {
        this.searchControl = new this.MultipleResultsLeafletSearch({});
        this.searchControl.addTo(this.map);

        $('.leaflet-control-search').toggle();
      } else {
        layerGroup = L.featureGroup(featureLayers);

        this.searchControl = new this.MultipleResultsLeafletSearch({
          position: 'topleft',
          layer: layerGroup,
          initial: false,
          propertyName: this.envConfigService.FEATURE_NAME_PROPERTY_NAME,
          textPlaceholder: 'Layer-Objekte nach Name und/oder ID filtern',
          textCancel: 'Abbrechen',
          textErr: 'Position nicht gefunden',
          hideMarkerOnCollapse: true,
          zoom: 15,
          autoResize: true,
          autoCollapse: false,
          autoType: true,
          formatData: function (json) {
            //adds coordinates to name.
            let propName = this.options.propertyName,
              propLoc = this.options.propertyLoc,
              i,
              jsonret = {};
            if (L.Util.isArray(propLoc))
              for (i in json) {
                if (!this._getPath(json[i], propName)) continue;
                jsonret[
                  this._getPath(json[i], propName) +
                    ' (' +
                    json[i][propLoc[0]] +
                    ',' +
                    json[i][propLoc[1]] +
                    ')'
                ] = L.latLng(json[i][propLoc[0]], json[i][propLoc[1]]);
              }
            else
              for (i in json) {
                if (!this._getPath(json[i], propName)) continue;
                jsonret[
                  this._getPath(json[i], propName) +
                    ' (' +
                    json[i][propLoc][0] +
                    ',' +
                    json[i][propLoc][1] +
                    ')'
                ] = L.latLng(this._getPath(json[i], propLoc));
              }
            return jsonret;
          },
          filterData: function (text, records) {
            let I,
              icase,
              regSearch,
              frecords = {};

            text = text.replace(/[.*+?^${}()|[\]\\]/g, ''); //sanitize remove all special characters
            if (text === '') return [];

            I = this.options.initial ? '^' : ''; //search only initial text
            icase = !this.options.casesensitive ? 'i' : undefined;

            regSearch = new RegExp(I + text, icase);

            for (const key in records) {
              // make a searchable string from all relevant feature properties
              let recordString = '';
              const record = records[key];
              const recordProperties = record.layer.feature.properties;

              for (const propertyKey in recordProperties) {
                if (recordProperties[propertyKey] && !isKomMonitorSpecificProperty(propertyKey)) {
                  recordString += recordProperties[propertyKey];
                }
              }

              if (regSearch.test(recordString)) frecords[key] = records[key];
            }

            return frecords;
          },
          buildTip: (text, val) => {
            let emString = '';

            if (val.layer.metadataObject) {
              if (val.layer.metadataObject.isPOI) {
                emString +=
                  '<i style="width:14px;height:14px;float:left;" class="awesome-marker-legend awesome-marker-legend-icon-' +
                  val.layer.metadataObject.poiMarkerColor +
                  '">';
                emString +=
                  "<span style='margin-left:3px; top:-2px; font-size:0.7em; color:" +
                  val.layer.metadataObject.poiSymbolColor +
                  ";' align='center' class='glyphicon glyphicon-" +
                  val.layer.metadataObject.poiSymbolBootstrap3Name +
                  "' aria-hidden='true'></span>";
                emString += '</i>';
              }
            } else {
              emString += "<i style='font-size:1.0em;' class='fas fa-sitemap'></i>";
            }
            return '<a href="" class="search-tip">' + emString + '&nbsp;&nbsp;' + text + '</a>';
          },
        });

        this.searchControl.addTo(this.map);

        $('.leaflet-control-search').toggle();
      }
    }, 200);
  }

  showLoadingIconOnMap() {
    this.loadingData = true;
  }

  hideLoadingIconOnMap() {
    setTimeout(() => {
      this.loadingData = false;
    }, 250);
  }

  toggleInfoControl() {
    if (this.showInfoControl === true) {
      /* use jquery to select your DOM elements that has the class 'legend' */
      $('.info').hide();
      this.showInfoControl = false;

      $('#toggleInfoControlButton').show();
    } else {
      $('.info').show();
      this.showInfoControl = true;

      // button is defined in kommonitor-user-interface component
      $('#toggleInfoControlButton').hide();
    }
  }

  changeClassifyMethod([method]) {
    this.visualStyleHelperService.classifyMethod = method;

    setTimeout(() => {
      this.visualStyleHelperService.classifyMethod = method;
    }, 350);

    this.broadcastService.broadcast(BroadcastMessage.RestyleCurrentLayer, [false]);
  }

  changeNumClasses([num]) {
    this.visualStyleHelperService.numClasses = num;

    setTimeout(() => {
      this.visualStyleHelperService.numClasses = num;
    }, 350);

    this.broadcastService.broadcast(BroadcastMessage.RestyleCurrentLayer, [false]);
  }

  changeColorScheme([colorSchemeName]) {
    this.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName =
      colorSchemeName;

    this.broadcastService.broadcast(BroadcastMessage.RestyleCurrentLayer, [false]);
  }

  changeBreaks([breaks]) {
    breaks = [...new Set(breaks)];
    breaks.sort(function (a, b) {
      return a - b;
    });

    this.visualStyleHelperService.manualBrew.breaks = breaks;
    this.indicatorClassificationService.updateManualMOVBreaksFromDefaultManualBreaks(
      this.isDynamicOrNegativeLayer()
    );

    setTimeout(() => {
      this.visualStyleHelperService.manualBrew.breaks = breaks;
      this.indicatorClassificationService.updateManualMOVBreaksFromDefaultManualBreaks(
        this.isDynamicOrNegativeLayer()
      );
      this.broadcastService.broadcast(BroadcastMessage.RestyleCurrentLayer, [false]);
    }, 1);
  }

  changeDynamicBreaks([breaks]) {
    breaks[0] = [...new Set(breaks[0])];
    breaks[0].sort(function (a, b) {
      return a - b;
    });
    breaks[1] = [...new Set(breaks[1])];
    breaks[1].sort(function (a, b) {
      return a - b;
    });

    this.visualStyleHelperService.dynamicBrewBreaks = breaks;
    if (this.visualStyleHelperService.dynamicBrew[1]) {
      this.visualStyleHelperService.dynamicBrew[1].breaks = breaks[1];
    }
    if (this.visualStyleHelperService.dynamicBrew[0]) {
      this.visualStyleHelperService.dynamicBrew[0].breaks = breaks[0];
    }

    setTimeout(() => {
      this.visualStyleHelperService.dynamicBrewBreaks = breaks;
      if (this.visualStyleHelperService.dynamicBrew[1]) {
        this.visualStyleHelperService.dynamicBrew[1].breaks = breaks[1];
      }
      if (this.visualStyleHelperService.dynamicBrew[0]) {
        this.visualStyleHelperService.dynamicBrew[0].breaks = breaks[0];
      }
    }, 1);
    this.indicatorClassificationService.updateManualMOVBreaksFromDefaultManualBreaks(
      this.isDynamicOrNegativeLayer()
    );

    this.broadcastService.broadcast(BroadcastMessage.RestyleCurrentLayer, [false]);
  }

  /**
   * binds the popup of a clicked output
   * to layer.feature.properties.popupContent
   */
  onEachFeatureSpatialUnit(feature, layer) {
    // does this feature have a property named popupContent?
    layer.on({
      click: function () {
        // propertiesString = "<pre>" + JSON.stringify(feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

        let popupContent =
          '<div class="spatialUnitInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
        for (const p in feature.properties) {
          popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
        }
        popupContent += '</table></div>';

        layer.bindPopup(popupContent);

        // if (propertiesString)
        //   layer.bindPopup(propertiesString);
      },
    });
  }

  /**
   * binds the popup of a clicked output
   * to layer.feature.properties.popupContent
   */
  onEachFeatureGeoresource(feature, layer) {
    // does this feature have a property named popupContent?
    layer.on({
      click: () => {
        let popupContent =
          '<div class="georesourceInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
        for (const p in feature.properties) {
          popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
        }
        popupContent += '</table></div>';

        layer.bindPopup(popupContent);

        // propertiesString = "<pre>" + JSON.stringify(feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

        // if (propertiesString)
        //   layer.bindPopup(propertiesString);
      },
    });
  }

  /**
   * binds the popup of a clicked output
   * to layer.feature.properties.popupContent
   */

  onEachFeatureIndicator(feature, layer) {
    const indicatorValueText = feature.tempData.indicatorValueText;

    const tooltipHtml =
      '<b>' +
      feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] +
      '</b><br/>' +
      indicatorValueText +
      ' [' +
      feature.tempData.unitText +
      ']';
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

  addPoiGeoresourceAsGeoJSON([georesourceMetadataAndGeoJSON, date, useCluster]) {
    let markers: any;
    if (useCluster) {
      markers = createMarkerClusterGroup();

      georesourceMetadataAndGeoJSON.geoJSON.features.forEach((poiFeature) => {
        // index 0 should be longitude and index 1 should be latitude
        //.bindPopup( poiFeature.properties.name )
        const newMarker = this.genericMapHelperService.createCustomMarker(
          poiFeature,
          georesourceMetadataAndGeoJSON.poiMarkerStyle,
          georesourceMetadataAndGeoJSON.poiMarkerText,
          georesourceMetadataAndGeoJSON.poiSymbolColor,
          georesourceMetadataAndGeoJSON.poiMarkerColor,
          georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name,
          georesourceMetadataAndGeoJSON
        );

        markers.addLayer(this.genericMapHelperService.addPoiMarker(markers, newMarker));
      });
    } else {
      markers = L.featureGroup();

      georesourceMetadataAndGeoJSON.geoJSON.features.forEach((poiFeature) => {
        // index 0 should be longitude and index 1 should be latitude
        //.bindPopup( poiFeature.properties.name )
        const newMarker = this.genericMapHelperService.createCustomMarker(
          poiFeature,
          georesourceMetadataAndGeoJSON.poiMarkerStyle,
          georesourceMetadataAndGeoJSON.poiMarkerText,
          georesourceMetadataAndGeoJSON.poiSymbolColor,
          georesourceMetadataAndGeoJSON.poiMarkerColor,
          georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name,
          georesourceMetadataAndGeoJSON
        );

        markers = this.genericMapHelperService.addPoiMarker(markers, newMarker);
      });
    }

    // markers.StyledLayerControl = {
    //   removable : false,
    //   visible : true
    // };

    this.layerControl.addOverlay(
      markers,
      georesourceMetadataAndGeoJSON.datasetName + '_' + date,
      this.poiLayerGroupName
    );
    markers.addTo(this.map);
    this.updateSearchControl();
    // $scope.map.addLayer( markers );
    this.map.invalidateSize(true);

    this.hideLoadingIconOnMap();
  }

  removePoiGeoresource([georesourceMetadataAndGeoJSON]) {
    const layerName = georesourceMetadataAndGeoJSON.datasetName;

    this.layerControl._layers.forEach((layer) => {
      //if (layer.group.name === poiLayerGroupName && layer.name.includes(layerName + "_")) {
      if (layer.name.includes(layerName + '_')) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
        this.updateSearchControl();
      }
    });

    this.hideLoadingIconOnMap();
  }

  addAoiGeoresourceAsGeoJSON([georesourceMetadataAndGeoJSON, date]) {
    const color = georesourceMetadataAndGeoJSON.aoiColor;

    const layer = L.geoJSON(georesourceMetadataAndGeoJSON.geoJSON, {
      style: (feature) => {
        return {
          fillColor: color,
          color: 'black',
          weight: 1,
          opacity: 1,
          fillOpacity: 0.7,
        };
      },
      onEachFeature: this.onEachFeatureGeoresource,
    });

    // layer.StyledLayerControl = {
    //   removable : false,
    //   visible : true
    // };

    this.layerControl.addOverlay(
      layer,
      georesourceMetadataAndGeoJSON.datasetName + '_' + date,
      this.aoiLayerGroupName
    );
    layer.addTo(this.map);
    this.updateSearchControl();

    this.map.invalidateSize(true);

    this.hideLoadingIconOnMap();
  }

  removeAoiGeoresource([georesourceMetadataAndGeoJSON]) {
    const layerName = georesourceMetadataAndGeoJSON.datasetName;

    this.layerControl._layers.forEach((layer) => {
      // todo
      //if (layer.group.name === aoiLayerGroupName && layer.name.includes(layerName + "_")) {
      if (layer.name.includes(layerName + '_')) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
        this.updateSearchControl();
      }
    });

    this.hideLoadingIconOnMap();
  }

  addLoiGeoresourceAsGeoJSON([georesourceMetadataAndGeoJSON, date]) {
    const color = georesourceMetadataAndGeoJSON.aoiColor;

    const featureGroup = L.featureGroup();

    const style = {
      color: georesourceMetadataAndGeoJSON.loiColor,
      dashArray: georesourceMetadataAndGeoJSON.loiDashArrayString,
      weight: georesourceMetadataAndGeoJSON.loiWidth || 3,
      opacity: 1,
    };

    georesourceMetadataAndGeoJSON.geoJSON.features.forEach((item, i) => {
      const type = item.geometry.type;

      if (type === 'Polygon' || type === 'MultiPolygon') {
        const lines = turf.polygonToLine(item);

        L.geoJSON(lines, {
          style: style,
          onEachFeature: this.onEachFeatureGeoresource,
        }).addTo(featureGroup);
      } else {
        L.geoJSON(item, {
          style: style,
          onEachFeature: this.onEachFeatureGeoresource,
        }).addTo(featureGroup);
      }
    });

    // georesourceMetadataAndGeoJSON.geoJSON.features.forEach((loiFeature, i) => {
    //   latLngs =
    //   polyline = L.polyline(loiFeature.geometry.coordinates);
    //
    //   geoJSON = polyline.toGeoJSON();
    //
    //   geoJSON_line = L.geoJSON(geoJSON, {
    //     style: style,
    //     onEachFeature: onEachFeatureGeoresource
    //   })
    //
    //   geoJSON_line.addTo(featureGroup);
    // });

    // layer.StyledLayerControl = {
    //   removable : false,
    //   visible : true
    // };

    this.layerControl.addOverlay(
      featureGroup,
      georesourceMetadataAndGeoJSON.datasetName + '_' + date,
      this.loiLayerGroupName
    );
    featureGroup.addTo(this.map);
    this.updateSearchControl();

    this.map.invalidateSize(true);
  }

  removeLoiGeoresource(georesourceMetadataAndGeoJSON) {
    const layerName = georesourceMetadataAndGeoJSON.datasetName;

    this.layerControl._layers.forEach((layer) => {
      if (layer.name.includes(layerName + '_')) {
        //if (layer.group.name === loiLayerGroupName && layer.name.includes(layerName + "_")) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
        this.updateSearchControl();
      }
    });
    this.hideLoadingIconOnMap();
  }

  addWmsLayerToMap([dataset, opacity]: [WmsDataset, number]) {
    const wmsLayer = L.tileLayer.wms(dataset.connectionDetails.baseUrl, {
      layers: dataset.connectionDetails.layerName,
      transparent: true,
      format: 'image/png',
      minZoom: this.envConfigService.minZoomLevel,
      maxZoom: this.envConfigService.maxZoomLevel,
      opacity: opacity,
    });

    this.layerControl.addOverlay(wmsLayer, dataset.title, this.wmsLayerGroupName);
    wmsLayer.addTo(this.map);
    this.updateSearchControl();
    this.map.invalidateSize(true);
    this.hideLoadingIconOnMap();
  }
  removeWmsLayerFromMap([dataset]) {
    const layerName = dataset.title;

    this.layerControl._layers.forEach((layer) => {
      //if (layer.group.name === this.wmsLayerGroupName && layer.name.includes(layerName)) {
      if (layer.name.includes(layerName)) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
      }
    });
    this.hideLoadingIconOnMap();
  }

  getWfsStyle(dataset, opacity) {
    if (dataset.geometryType === 'POI') {
      return {
        weight: 1,
        opacity: opacity,
        color: dataset.poiMarkerColor,
        dashArray: '',
        fillOpacity: opacity,
        fillColor: dataset.poiMarkerColor,
      };
    } else if (dataset.geometryType === 'LOI') {
      return {
        weight: dataset.loiWidth,
        opacity: opacity,
        color: dataset.loiColor,
        dashArray: dataset.loiDashArrayString,
        fillOpacity: opacity,
        fillColor: dataset.loiColor,
      };
    } else {
      return {
        weight: 1,
        opacity: opacity,
        color: dataset.aoiColor,
        dashArray: '',
        fillOpacity: opacity,
        fillColor: dataset.aoiColor,
      };
    }
  }

  getFilterEncoding(dataset) {
    const filterExpressions: any[] = [];

    if (
      dataset.filterEncoding.PropertyIsEqualTo &&
      dataset.filterEncoding.PropertyIsEqualTo.propertyName &&
      dataset.filterEncoding.PropertyIsEqualTo.propertyValue
    ) {
      filterExpressions.push(
        new L.Filter.EQ(
          dataset.filterEncoding.PropertyIsEqualTo.propertyName,
          dataset.filterEncoding.PropertyIsEqualTo.propertyValue
        )
      );
    }

    if (dataset.filterFeaturesToMapBBOX) {
      filterExpressions.push(
        new L.Filter.BBox(dataset.featureTypeGeometryName, this.map.getBounds(), L.CRS.EPSG3857)
      );
    }

    if (filterExpressions.length == 0) {
      return undefined;
    }

    if (filterExpressions.length < 2) {
      return filterExpressions;
    } else {
      // stringifiedFilterExpressions = [];

      // for (filterExpr of filterExpressions) {
      //   stringifiedFilterExpressions.push(L.XmlUtil.serializeXmlDocumentString(filterExpr.toGml()));
      // }

      // return new L.Filter.And(...stringifiedFilterExpressions);
      return new L.Filter.And(...filterExpressions);
    }
  }

  addWfsLayerToMap([dataset, opacity, useCluster]) {
    const wfsLayerOptions = {
      url: dataset.url,
      typeNS: dataset.featureTypeNamespace,
      namespaceUri: 'http://mapserver.gis.umn.edu/mapserver',
      typeName: dataset.featureTypeName,
      geometryField: dataset.featureTypeGeometryName,
      // maxFeatures: null,
      style: this.getWfsStyle(dataset, opacity),
      filter: undefined,
    };

    const filterEncoding = this.getFilterEncoding(dataset);
    if (filterEncoding) {
      wfsLayerOptions.filter = filterEncoding;
    }

    let wfsLayer;
    let poiMarkerLayer;

    if (dataset.geometryType === 'POI') {
      if (useCluster) {
        poiMarkerLayer = createMarkerClusterGroup({
          iconCreateFunction: function (cluster) {
            const childCount = cluster.getChildCount();

            let c = 'cluster-';
            if (childCount < 10) {
              c += 'small';
            } else if (childCount < 30) {
              c += 'medium';
            } else {
              c += 'large';
            }

            const className =
              'marker-cluster ' +
              c +
              ' awesome-marker-legend-TransparentIcon-' +
              dataset.poiMarkerColor;

            //'marker-cluster' + c + ' ' +
            return new L.DivIcon({
              html:
                '<div class="awesome-marker-legend-icon-' +
                dataset.poiMarkerColor +
                '" ><span>' +
                childCount +
                '</span></div>',
              className: className,
              iconSize: new L.Point(40, 40),
            });
          },
        });
      } else {
        poiMarkerLayer = L.featureGroup();
      }

      wfsLayer = new L.WFS(wfsLayerOptions);
    } else {
      wfsLayer = new L.WFS(wfsLayerOptions);
    }

    try {
      wfsLayer.once('load', () => {
        if (dataset.geometryType === 'POI') {
          poiMarkerLayer = this.genericMapHelperService.createCustomMarkersFromWfsPoints(
            wfsLayer,
            poiMarkerLayer,
            dataset
          );
        }

        this.map.fitBounds(wfsLayer.getBounds());

        this.map.invalidateSize(true);
        // $scope.loadingData = false;
      });

      wfsLayer.on('click', (event) => {
        // propertiesString = "<pre>" + JSON.stringify(event.layer.feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

        let popupContent =
          '<div class="wfsInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
        for (const p in event.layer.feature.properties) {
          popupContent +=
            '<tr><td>' + p + '</td><td>' + event.layer.feature.properties[p] + '</td></tr>';
        }
        popupContent += '</table></div>';

        const popup: any = L.popup();
        popup.setLatLng(event.latlng).setContent(popupContent).openOn(this.map);
      });
      if (poiMarkerLayer) {
        this.layerControl.addOverlay(poiMarkerLayer, dataset.title, this.wfsLayerGroupName);
        poiMarkerLayer.addTo(this.map);
      } else {
        this.layerControl.addOverlay(wfsLayer, dataset.title, this.wfsLayerGroupName);
        wfsLayer.addTo(this.map);
      }
      this.updateSearchControl();
    } catch (error) {
      this.loadingData = false;
      this.mapErrorNotificationService.displayMapApplicationError(error);
    }

    this.hideLoadingIconOnMap();
  }

  removeWfsLayerFromMap(dataset) {
    const layerName = dataset.title;

    this.layerControl._layers.forEach((layer) => {
      //if (layer.group.name === wfsLayerGroupName && layer.name.includes(layerName)) {
      if (layer.name.includes(layerName)) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
      }
    });
    this.hideLoadingIconOnMap();
  }

  addFileLayerToMap([dataset, opacity]) {
    try {
      let fileLayer;

      if (dataset.isPOI) {
        fileLayer = L.featureGroup();

        dataset.geoJSON.features.forEach((poiFeature) => {
          // index 0 should be longitude and index 1 should be latitude
          //.bindPopup( poiFeature.properties.name )
          const newMarker = this.genericMapHelperService.createCustomMarker(
            poiFeature,
            dataset.poiMarkerStyle,
            dataset.poiMarkerText,
            dataset.poiSymbolColor,
            dataset.poiMarkerColor,
            dataset.poiSymbolBootstrap3Name,
            dataset
          );

          fileLayer = this.genericMapHelperService.addPoiMarker(fileLayer, newMarker);
        });
      } else {
        const style = {
          weight: 1,
          opacity: opacity,
          color: this.envConfigService.defaultBorderColor,
          dashArray: '',
          fillOpacity: 1,
          fillColor: dataset.displayColor,
        };

        fileLayer = L.geoJSON(dataset.geoJSON, {
          style: style,
          onEachFeature: (feature, layer) => {
            layer.on({
              click: () => {
                // propertiesString = "<pre>" + JSON.stringify(feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

                let popupContent =
                  '<div class="fileInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
                for (const p in feature.properties) {
                  popupContent +=
                    '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
                }
                popupContent += '</table></div>';

                if (popupContent) layer.bindPopup(popupContent);
              },
            });
          },
        });
      }

      this.showFileLayer(fileLayer, dataset);
    } catch (error) {
      console.error(error);
      this.broadcastService.broadcast(BroadcastMessage.FileLayerError, [error, dataset]);
    }
  }

  showFileLayer(fileLayer, dataset) {
    try {
      this.layerControl.addOverlay(fileLayer, dataset.datasetName, this.fileLayerGroupName);
      fileLayer.addTo(this.map);

      this.map.fitBounds(fileLayer.getBounds());

      this.fileHelperService.setValue(FileUploadState.SUCCESS, dataset);

      this.updateSearchControl();

      this.map.invalidateSize(true);
    } catch (error) {
      this.fileHelperService.setValue(FileUploadState.ERROR, [error, dataset]);
    }
  }

  adjustOpacityForFileLayer([dataset, opacity]) {
    const layerName = dataset.datasetName;

    this.layerControl._layers.forEach((layer) => {
      if (layer.group.name === this.fileLayerGroupName && layer.name.includes(layerName)) {
        const newStyle = {
          weight: 1,
          opacity: opacity,
          color: this.envConfigService.defaultBorderColor,
          dashArray: '',
          fillOpacity: opacity,
          fillColor: dataset.displayColor,
        };

        // layer.layer.options.style = newStyle;
        layer.layer.setStyle(newStyle);
      }
    });
  }

  adjustColorForFileLayer(dataset) {
    const layerName = dataset.datasetName;
    this.layerControl._layers.forEach((layer) => {
      if (layer.group.name === this.fileLayerGroupName && layer.name.includes(layerName)) {
        const newStyle = {
          weight: 1,
          color: this.envConfigService.defaultBorderColor,
          dashArray: '',
          fillColor: dataset.displayColor,
        };

        layer.layer.setStyle(newStyle);
      }
    });
  }

  removeFileLayerFromMap(dataset) {
    const layerName = dataset.datasetName;

    this.layerControl._layers.forEach((layer) => {
      if (layer.group.name === this.fileLayerGroupName && layer.name.includes(layerName)) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
      }
    });
  }

  highlightFeature(e) {
    const layer = e.target;
    this.visualStyleHelperService.setOpacity(layer.options.fillOpacity);

    this.highlightFeatureForLayer(layer);
  }

  highlightFeatureForLayer(layer) {
    this.setTemporarilyHighlightedStyle(layer);

    // update diagrams for hovered feature
    this.broadcastService.broadcast(BroadcastMessage.UpdateDiagramsForHoveredFeature, [
      layer.feature.properties,
    ]);
  }

  highlightClickedFeature(layer) {
    this.setPermanentlyHighlightedStyle(layer);

    // update diagrams for hovered feature
    this.broadcastService.broadcast(BroadcastMessage.UpdateDiagramsForHoveredFeature, [
      layer.feature.properties,
    ]);
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
          this.broadcastService.broadcast(
            BroadcastMessage.UpdateDiagramsForHoveredFeature,
            layer.feature.properties
          );
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
          if (this.visualStyleHelperService.classifyMethod == 'manual') {
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
    this.broadcastService.broadcast(BroadcastMessage.UpdateDiagramsForUnhoveredFeature, [
      layer.feature.properties,
    ]);
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
    this.visualStyleHelperService.isCustomComputation = !!isCustomComputation;
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

    this.broadcastService.broadcast(BroadcastMessage.UpdateLegendDisplay, [
      this.currentIndicatorContainsZeroValues,
      this.datasetContainsNegativeValues,
      this.currentIndicatorContainsNoDataValues,
      this.containsOutliers_high,
      this.containsOutliers_low,
      this.outliers_low,
      this.outliers_high,
      this.selectionState.selectedDate,
    ]);

    let layerName = indicatorMetadataAndGeoJSON.indicatorName + '_' + spatialUnitName + '_' + date;

    if (isCustomComputation) {
      layerName += ' - individuelles Berechnungsergebnis';
    }

    this.layerControl.addOverlay(layer, layerName, this.indicatorLayerGroupName);
    layer.addTo(this.map);
    this.updateSearchControl();

    this.fitBounds();

    if (this.containsOutliers_low || this.containsOutliers_high) {
      this.showOutlierInfoAlert = true;
    }

    this.broadcastService.broadcast(BroadcastMessage.UpdateDiagrams, [
      this.currentIndicatorMetadataAndGeoJSON,
      this.selectionState.selectedSpatialUnit.spatialUnitLevel,
      this.selectionState.selectedSpatialUnit.spatialUnitId,
      date,
      this.defaultBrew,
      this.gtMeasureOfValueBrew,
      this.ltMeasureOfValueBrew,
      this.dynamicIncreaseBrew,
      this.dynamicDecreaseBrew,
      this.chartDisplayState.isMeasureOfValueChecked,
      this.chartDisplayState.measureOfValue,
      justRestyling,
    ]);
    this.broadcastService.broadcast(BroadcastMessage.IndicatortMapDisplayFinished);

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

  onChangeSpatialUnit() {
    this.visualStyleHelperService.dynamicBrewBreaks = null;
  }

  allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin() {
    this.indicatorClassificationService.updateManualMOVBreaksFromDefaultManualBreaks(
      this.isDynamicOrNegativeLayer()
    );
    this.broadcastService.broadcast(BroadcastMessage.RestyleCurrentLayer, [false]);
  }

  restyleCurrentLayer([skipDiagramRefresh]) {
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
      });

      this.broadcastService.broadcast(BroadcastMessage.UpdateLegendDisplay, [
        this.currentIndicatorContainsZeroValues,
        this.datasetContainsNegativeValues,
        this.currentIndicatorContainsNoDataValues,
        this.containsOutliers_high,
        this.containsOutliers_low,
        this.outliers_low,
        this.outliers_high,
        this.selectionState.selectedDate,
      ]);

      if (!skipDiagramRefresh) {
        const justRestyling = true;
        const brewForDiagrams =
          this.visualStyleHelperService.classifyMethod == 'manual'
            ? this.manualBrew
            : this.defaultBrew;

        this.broadcastService.broadcast(BroadcastMessage.UpdateDiagrams, [
          this.currentIndicatorMetadataAndGeoJSON,
          this.selectionState.selectedSpatialUnit.spatialUnitLevel,
          this.selectionState.selectedSpatialUnit.spatialUnitId,
          this.date,
          brewForDiagrams,
          this.gtMeasureOfValueBrew,
          this.ltMeasureOfValueBrew,
          this.dynamicIncreaseBrew,
          this.dynamicDecreaseBrew,
          this.chartDisplayState.isMeasureOfValueChecked,
          this.chartDisplayState.measureOfValue,
          justRestyling,
        ]);
      }

      //ensure that highlighted feature remain highlighted
      this.preserveHighlightedFeatures();
    }

    this.map.invalidateSize(true);
  }

  highlightFeatureOnMap([spatialFeatureName]) {
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

  unhighlightFeatureOnMap([spatialFeatureName]) {
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
    this.broadcastService.broadcast(BroadcastMessage.RestyleCurrentLayer, [false]);
  }

  removeReachabilityScenarioFromMainMap() {
    if (this.markerLayer) {
      this.layerControl.removeLayer(this.markerLayer);
      this.map.removeLayer(this.markerLayer);
    }
    if (this.isochroneLayer) {
      this.layerControl.removeLayer(this.isochroneLayer);
      this.map.removeLayer(this.isochroneLayer);
    }

    this.mapOverlayState.reachabilityScenarioOnMainMap = false;
  }

  replaceReachabilityScenarioOnMainMap([reachabilityScenario]) {
    if (this.markerLayer) {
      this.layerControl.removeLayer(this.markerLayer);
      this.map.removeLayer(this.markerLayer);
    }
    if (this.isochroneLayer) {
      this.layerControl.removeLayer(this.isochroneLayer);
      this.map.removeLayer(this.isochroneLayer);
    }

    const poiDataset = reachabilityScenario.reachabilitySettings.selectedStartPointLayer;
    const locationsArray: any[] = [];

    poiDataset.geoJSON.features.forEach((feature: any) => {
      locationsArray.push(feature.geometry.coordinates);
    });

    this.markerLayer = this.reachabilityMapHelperService.makeIsochroneMarkerLayer(locationsArray);

    this.mapOverlayState.reachabilityScenarioOnMainMap = true;

    this.isochroneLayer = this.reachabilityMapHelperService.makeIsochroneLayer(
      reachabilityScenario.reachabilitySettings.selectedStartPointLayer.datasetName,
      reachabilityScenario.isochrones_dissolved,
      reachabilityScenario.reachabilitySettings.transitMode,
      reachabilityScenario.reachabilitySettings.focus,
      reachabilityScenario.reachabilitySettings.rangeArray,
      reachabilityScenario.reachabilitySettings.useMultipleStartPoints,
      reachabilityScenario.reachabilitySettings.dissolveIsochrones
    );

    this.layerControl.addOverlay(
      this.markerLayer,
      'Startpunkte der Isochronenberechnung - ' + poiDataset.datasetName,
      this.reachabilityLayerGroupName
    );
    this.layerControl.addOverlay(
      this.isochroneLayer,
      'Erreichbarkeits-Isochronen_' +
        reachabilityScenario.reachabilitySettings.transitMode +
        '_' +
        poiDataset.datasetName,
      this.reachabilityLayerGroupName
    );

    this.markerLayer.addTo(this.map);
    this.isochroneLayer.addTo(this.map);

    this.map.invalidateSize(true);
    this.map.fitBounds(this.isochroneLayer.getBounds());
  }
}
