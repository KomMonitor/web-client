import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, DestroyRef, inject, OnInit } from '@angular/core';
import * as L from 'leaflet';
import "leaflet.markercluster";
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { ChartDisplayStateService } from 'services/chart-display-state-service/chart-display-state.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { FilterHelperService } from 'services/filter-helper-service/filter-helper.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';
import jStat from 'jstat';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import * as turf from '@turf/turf';
import domtoimage from 'dom-to-image-more';
import { saveAs } from 'file-saver';
import { OpenStreetMapProvider, SearchControl } from 'leaflet-geosearch';
import 'leaflet-measure';
import 'leaflet-search';

import '../../../../../customizedExternalLibs/leaflet-groupedlayercontrol/leaflet.groupedlayercontrol';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FileHelperService, FileUploadState } from 'services/file-helper-service/file-helper.service';
import { MapService } from 'services/map-service/map.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ReachabilityCombinerService, GeoJSONFeature } from 'services/reachability-combiner-service/reachability-combiner.service';
import { ReachabilityMapHelperService } from 'services/reachability-map-helper-service/reachability-map-helper.service';
import { ReachabilityHelperService } from 'services/reachbility-helper-service/reachability-helper.service';

@Component({
  selector: 'app-kommonitor-map',
  templateUrl: './kommonitor-map.component.html',
  styleUrls: ['./kommonitor-map.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class KommonitorMapComponent implements OnInit, AfterViewInit {

  private readonly destroyRef = inject(DestroyRef);

  private map;
  searchControl: any;
  geosearchControl: any;

  private singleMarkers: L.Marker[] = [];

  datasetContainsNegativeValues: any;

  svgString_outlierLow = '<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' + this.envConfigService.defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' + this.envConfigService.defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' + this.envConfigService.defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_low + ';" />Sorry, your browser does not support inline SVG.</svg>';
  svgString_outlierHigh = '<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' + this.envConfigService.defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' + this.envConfigService.defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' + this.envConfigService.defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_high + ';" />Sorry, your browser does not support inline SVG.</svg>';


  outlierPropertyName = "outlier";
  outlierPropertyValue_high_soft = "high-soft";
  outlierPropertyValue_low_soft = "low-soft";
  outlierPropertyValue_high_extreme = "high-extreme";
  outlierPropertyValue_low_extreme = "low-extreme";
  outlierPropertyValue_no = "no";

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
  showLegendControl = true;
  showLegend = true;
  overlays = new Array();
  baseMaps = new Array();
  spatialUnitLayerGroupName = "Raumebenen";
  georesourceLayerGroupName = "Georessourcen";
  poiLayerGroupName = "Points of Interest";
  loiLayerGroupName = "Lines of Interest";
  aoiLayerGroupName = "Areas of Interest";
  indicatorLayerGroupName = "Indikatoren";
  reachabilityLayerGroupName = "Erreichbarkeiten";
  wmsLayerGroupName = "Web Map Services (WMS)";
  wfsLayerGroupName = "Web Feature Services (WFS)";
  fileLayerGroupName = "Dateilayer";
  spatialUnitOutlineLayerGroupName = "Raumebenen Umringe";

  propertyName;

  sortableLayers = ["Web Map Services (WMS)"];

  highlightTimeout;

  classifyZeroSeparately_backup: any;

  constructor(
    private mapOverlayState: MapOverlayStateService,
    private chartDisplayState: ChartDisplayStateService,
    private mapErrorNotificationService: MapErrorNotificationService,
    private cacheHelperService: CacheHelperServiceService,
    private indicatorValueService: IndicatorValueService,
    private selectionState: SelectionStateService,
    private spatialUnitStore: SpatialUnitMetadataStoreService,
    private http: HttpClient,
    private broadcastService: BroadcastService,
    private visualStyleHelperService: VisualStyleHelperServiceNew,
    private filterHelperService: FilterHelperService,
    private genericMapHelperService: GenericMapHelperService,
    private envConfigService: EnvConfigService,
    private fileHelperService: FileHelperService,
    private mapService: MapService,
    private reachabilityCombinerService: ReachabilityCombinerService
    , private reachabilityMapHelperService: ReachabilityMapHelperService,
    private reachabilityHelperService: ReachabilityHelperService
  ) { }

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
        }
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
        let tile = L.TileLayer.prototype._createTile.call(this);
        tile.crossOrigin = "Anonymous";
        return tile;
      },

      _makeGrayscale: function (img) {
        if (img.getAttribute('data-grayscaled'))
          return;

        img.crossOrigin = '';
        let canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext("2d");
        ctx!.drawImage(img, 0, 0);

        let imgd = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        let pix = imgd.data;
        for (let i = 0, n = pix.length; i < n; i += 4) {
          pix[i] = pix[i + 1] = pix[i + 2] = (this.options.quotaRed * pix[i] + this.options.quotaGreen * pix[i + 1] + this.options.quotaBlue * pix[i + 2]) / this.options.quotaDivider();
        }
        ctx!.putImageData(imgd, 0, 0);
        img.setAttribute('data-grayscaled', true);
        img.src = canvas.toDataURL();
      }
    });

    L.tileLayer.grayscale = function (url, options) {
      return new L.TileLayer.Grayscale(url, options);
    };

    setTimeout(() => {
      this.initSpatialUnitOutlineLayer();
    }, 2000);

    this.mapService.mapRefreshState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (this.mapService.readyForRefresh())
          this.onReplaceIndicatorAsGeoJSON([value.values.indicator, value.values.spatialUnit, value.values.date, value.values.justRestyling, value.values.customComputation]);
      });

    this.mapService.replaceIndicatorLayerSubject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params) {
          this._replaceIndicatorLayer(params.indicator, params.spatialUnitName, params.date, params.isCustomComputation);
        }
      });

    this.mapService.mapRecenter$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (value.resize)
          this.resizeMapOnly();

        if (value.recenter)
          this.recenterMapOnly();
      });

    this.reachabilityCombinerService.reachabilityMapSubject$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (value.features)
          this.addSingleMarker(value?.features);

        if (value.isochronesGeoJson)
          this.addIsochrones(value.isochronesGeoJson);
        else
          this.removeIsochrones();
      });

    // catch broadcast msgs
    this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      let title = broadcastMsg.msg;
      let values: any = broadcastMsg.values;

      switch (title) {
        case 'changeClassifyMethod': {
          this.changeClassifyMethod(values);
        } break;
        case 'changeNumClasses': {
          this.changeNumClasses(values);
        } break;
        case 'replaceIndicatorAsGeoJSON': { // eigentlich alt, wird aber teilweise noch genutzt, todo
          setTimeout(() => this.onReplaceIndicatorAsGeoJSON(values), 1000);
        } break;
        case 'changeSpatialUnit': {
          this.onChangeSpatialUnit();
        } break;
        case 'showLoadingIconOnMap': {
          this.showLoadingIconOnMap();
        } break;
        case 'hideLoadingIconOnMap': {
          this.hideLoadingIconOnMap();
        } break;
        case 'addPoiGeoresourceAsGeoJSON': {
          this.addPoiGeoresourceAsGeoJSON(values);
        } break;
        case 'removePoiGeoresource': {
          this.removePoiGeoresource(values);
        } break;
        case 'addWmsLayerToMap': {
          this.addWmsLayerToMap(values);
        } break;
        case 'removeWmsLayerFromMap': {
          this.removeWmsLayerFromMap(values);
        } break;
        case 'addWfsLayerToMap': {
          this.addWfsLayerToMap(values);
        } break;
        case 'removeWfsLayerFromMap': {
          this.removeWfsLayerFromMap(values)
        } break;
        case 'addLoiGeoresourceAsGeoJSON': {
          this.addLoiGeoresourceAsGeoJSON(values);
        } break;
        case 'removeLoiGeoresource': {
          this.removeLoiGeoresource(values);
        } break;
        case 'addAoiGeoresourceAsGeoJSON': {
          this.addAoiGeoresourceAsGeoJSON(values);
        } break;
        case 'removeAoiGeoresource': {
          this.removeAoiGeoresource(values);
        } break;
        case 'exportMap': {
          this.exportMap();
        } break;
        case 'changeSpatialUnitViaInfoControl': {
          this.changeSpatialUnitViaInfoControl();
        } break;
        case 'toggleInfoControl': {
          this.toggleInfoControl();
        } break;
        case 'toggleLegendControl': {
          this.toggleLegendControl();
        } break;
        case 'changeDynamicBreaks': {
          this.changeDynamicBreaks(values);
        } break;
        case 'allIndicatorPropertiesForCurrentSpatialUnitAndTime setup begin': {
          this.allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin();
        } break;
        case 'restyleCurrentLayer': {
          this.restyleCurrentLayer(values);
        } break;
        case 'preserveHighlightedFeatures': {
          this.preserveHighlightedFeatures();
        } break;
        case 'changeColorScheme': {
          this.changeColorScheme(values);
        } break;
        case 'changeBreaks': {
          this.changeBreaks(values);
        } break;
        case 'unselectAllFeatures': {
          this.unselectAllFeatures();
        } break;
        case 'onGlobalFilterChange': {
          this.onGlobalFilterChange();
        } break;
        case 'openLayerControl': {
          this.openLayerControl();
        } break;
        case 'highlightFeatureOnMap': {
          this.highlightFeatureOnMap(values);
        } break;
        case 'switchHighlightFeatureOnMap': {
          this.switchHighlightFeatureOnMap(values);
        } break;
        case 'unhighlightFeatureOnMap': {
          this.unhighlightFeatureOnMap(values);
        } break;
        case 'toggleExpertControl': {
          this.toggleExpertControl();
        } break;
        case 'addFileLayerToMap': {
          this.addFileLayerToMap(values);
        } break;
        case 'adjustOpacityForFileLayer': {
          this.adjustOpacityForFileLayer(values);
        } break;
        case 'adjustColorForFileLayer': {
          this.adjustColorForFileLayer(values);
        } break;
        case 'replaceReachabilityScenarioOnMainMap': {
          this.replaceReachabilityScenarioOnMainMap(values);
        } break;
        case 'removeReachabilityScenarioFromMainMap': {
          this.removeReachabilityScenarioFromMainMap();
        } break;
      }
    });
  }

  ngAfterViewInit(): void {

    this.initMap();

    if (this.envConfigService.sortableLayers) {
      this.sortableLayers = this.envConfigService.sortableLayers;
    } else {
      this.sortableLayers = ["Web Map Services (WMS)"];
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
        viewbox: "" + (Number(this.envConfigService.initialLongitude) - 0.001) + "," + (Number(this.envConfigService.initialLatitude) - 0.001) + "," + (Number(this.envConfigService.initialLongitude) + 0.001) + "," + (Number(this.envConfigService.initialLatitude) + 0.001)
      },
      searchUrl: this.envConfigService.targetUrlToGeocoderService + '/search',
      reverseUrl: this.envConfigService.targetUrlToGeocoderService + '/reverse'
    });

    this.geosearchControl = SearchControl({
      position: "topleft",
      provider: provider,
      style: 'button',
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: true,                                   // optional: true|false  - default true
      showPopup: false,                                   // optional: true|false  - default false
      marker: {                                           // optional: L.Marker    - default L.Icon.Default
        icon: new L.Icon.Default(),
        draggable: false,
      },
      popupFormat: ({ query, result }) => result.label,   // optional: function    - default returns result label
      maxMarkers: 1,                                      // optional: number      - default 1
      retainZoomLevel: false,                             // optional: true|false  - default false
      animateZoom: true,                                  // optional: true|false  - default true
      autoClose: false,                                   // optional: true|false  - default false
      searchLabel: 'Suche nach Adressen ...',                       // optional: string      - default 'Enter address'
      keepResult: false                                   // optional: true|false  - default false
    });

    this.map.addControl(this.geosearchControl);

    this.searchControl = new this.MultipleResultsLeafletSearch({});
    this.searchControl.addTo(this.map);

    $('.geosearch').toggle();

    $('.leaflet-control-search').toggle();
  }

  initMeasurement() {
    let measureOptions = {
      position: 'topleft',
      primaryLengthUnit: 'meters',
      secondaryLengthUnit: 'kilometers',
      primaryAreaUnit: 'sqmeters',
      activeColor: "#d15c54",
      completedColor: "#d15c54",
      decPoint: ',',
      thousandsSep: '.'
    };

    let measureControl = new L.Control.Measure(measureOptions);
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

    let baseLayerDefinitionsMap = new Map();
    this.mapOverlayState.baseLayerDefinitionsArray = [{
      "layerConfig": {
        name: "leere Karte",
        url: "",
        layerType: "TILE_LAYER",
        layerName_WMS: "",
        attribution_html: "",
        minZoomLevel: this.envConfigService.minZoomLevel,
        maxZoomLevel: this.envConfigService.maxZoomLevel
      }
    }];

    for (let baseMapEntry of this.envConfigService.baseLayers) {

      if (baseMapEntry.layerType === "TILE_LAYER_GRAYSCALE") {
        let grayscaleLayer = new L.tileLayer.grayscale(baseMapEntry.url, { minZoom: baseMapEntry.minZoomLevel, maxZoom: baseMapEntry.maxZoomLevel, attribution: baseMapEntry.attribution_html });
        baseLayerDefinitionsMap.set(baseMapEntry.name, grayscaleLayer);
        this.mapOverlayState.baseLayerDefinitionsArray.push({
          "layerConfig": baseMapEntry
        });
      }
      else if (baseMapEntry.layerType === "TILE_LAYER") {
        let tileLayer = new L.tileLayer(baseMapEntry.url, { minZoom: baseMapEntry.minZoomLevel, maxZoom: baseMapEntry.maxZoomLevel, attribution: baseMapEntry.attribution_html });
        baseLayerDefinitionsMap.set(baseMapEntry.name, tileLayer);
        this.mapOverlayState.baseLayerDefinitionsArray.push({
          "layerConfig": baseMapEntry
        });
      }
      else if (baseMapEntry.layerType === "WMS") {
        let wmsLayer = new L.tileLayer.wms(baseMapEntry.url, { minZoom: baseMapEntry.minZoomLevel, maxZoom: baseMapEntry.maxZoomLevel, attribution: baseMapEntry.attribution_html, layers: baseMapEntry.layerName_WMS, format: 'image/png' });
        baseLayerDefinitionsMap.set(baseMapEntry.name, wmsLayer);
        this.mapOverlayState.baseLayerDefinitionsArray.push({
          "layerConfig": baseMapEntry
        });
      }
    }

    this.map = L.map('ngMap', {
      center: [this.envConfigService.initialLatitude, this.envConfigService.initialLongitude],
      zoom: this.envConfigService.initialZoomLevel,
      zoomDelta: 0.5,
      zoomSnap: 0.5,
      layers: [baseLayerDefinitionsMap.get(this.envConfigService.baseLayers[0].name)]
    });

    this.envConfigService.currentLatitude = this.envConfigService.initialLatitude;
    this.envConfigService.currentLongitude = this.envConfigService.initialLongitude;
    this.envConfigService.currentZoomLevel = this.envConfigService.initialZoomLevel;

    // execute update search control on layer add and remove
    /*    this.map.on('overlayadd',(eo) => {
         this.updateSearchControl();
       });
       this.map.on('overlayremove', (eo) => {
         this.updateSearchControl();
       }); */

    // update zoom and extent
    this.map.on('zoomend', (eo) => {
      let latLng = this.map.getCenter();
      this.envConfigService.currentLatitude = latLng.lat;
      this.envConfigService.currentLongitude = latLng.lng;
      this.envConfigService.currentZoomLevel = this.map.getZoom();
    });
    this.map.on('moveend', (eo) => {
      let latLng = this.map.getCenter();
      this.envConfigService.currentLatitude = latLng.lat;
      this.envConfigService.currentLongitude = latLng.lng;
      this.envConfigService.currentZoomLevel = this.map.getZoom();
    });

    this.baseMaps = [];

    baseLayerDefinitionsMap.forEach((value, key, map) => {
      this.baseMaps[key] = value;
    });

    let groupedOverlays = {
      indicatorLayerGroupName: {

      },
      poiLayerGroupName: {

      },
      loiLayerGroupName: {

      },
      aoiLayerGroupName: {

      },
      wmsLayerGroupName: {

      },
      wfsLayerGroupName: {

      },
      fileLayerGroupName: {

      },
      reachabilityLayerGroupName: {

      },
      spatialUnitOutlineLayerGroupName: {

      }
    };

    this.layerControl = L.control.groupedLayers(this.baseMaps, groupedOverlays, { collapsed: false, position: 'topleft', layers: this.sortableLayers });

    //backup ico groupedLayers not working properly
    //this.layerControl = L.control.layers(this.baseMaps, [], {position: 'topleft'}).addTo(this.map);  

    delete this.layerControl._groupList;
    this.layerControl._groupList = ["", "Raumebene Umringe", "Indikatoren"];

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

      if (this.reachabilityCombinerService.manualMapSelectionMode) {
        this.reachabilityCombinerService.addLocation({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [e.latlng.lng, e.latlng.lat]
          }
        }, true);
      }
    });
  }

  addSingleMarker(locations: GeoJSONFeature[]) {

    this.singleMarkers.forEach(m => this.map.removeLayer(m));
    this.singleMarkers = [];

    locations.forEach(location => {
      // Create a GeoJSON feature for the location
      const poiFeature: any = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [location.geometry.coordinates[0], location.geometry.coordinates[1]]
        },
        properties: {
          name: ''
        }
      };

      const defaultMarkerStyle = {
        poiMarkerStyle: 'default',
        poiMarkerText: 'Start',
        poiSymbolColor: 'white',
        poiMarkerColor: 'blue',
        poiSymbolBootstrap3Name: 'home'
      };

      const newMarker = this.genericMapHelperService.createCustomMarker(poiFeature, defaultMarkerStyle.poiMarkerStyle, defaultMarkerStyle.poiMarkerText, defaultMarkerStyle.poiSymbolColor, defaultMarkerStyle.poiMarkerColor, defaultMarkerStyle.poiSymbolBootstrap3Name, defaultMarkerStyle);
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
      this.reachabilityHelperService.settings.selectedStartPointLayer?.datasetName || 'Manuelle Eingabe',
      isochrones,
      this.reachabilityHelperService.settings.transitMode,
      this.reachabilityHelperService.settings.focus,
      this.reachabilityHelperService.settings.rangeArray,
      this.reachabilityHelperService.settings.useMultipleStartPoints,
      this.reachabilityHelperService.settings.dissolveIsochrones
    );

    this.isochronesLayer.addTo(this.map);
  }

  onGlobalFilterChange() {
    // reset custom layers when global filters change. otherwise douplicates might be added
    this.layerControl._layers = this.layerControl._layers.filter(e => e.overlay === undefined);
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
  };


  refreshNoDataStyle() {

    this.currentIndicatorContainsNoDataValues = false;
    this.svgString_noData = '<svg height="18" width="18">' +
      '<circle style="stroke-opacity: ' + this.envConfigService.defaultFillOpacityForNoDataValues + ';" cx="4" cy="4" r="1.5" stroke="' + this.envConfigService.defaultBorderColorForNoDataValues + '" stroke-width="2" fill="' + this.envConfigService.defaultColorForNoDataValues + '" />' +
      '<circle style="stroke-opacity: ' + this.envConfigService.defaultFillOpacityForNoDataValues + ';" cx="14" cy="4" r="1.5" stroke="' + this.envConfigService.defaultBorderColorForNoDataValues + '" stroke-width="2" fill="' + this.envConfigService.defaultColorForNoDataValues + '" />' +
      '<circle style="stroke-opacity: ' + this.envConfigService.defaultFillOpacityForNoDataValues + ';" cx="4" cy="14" r="1.5" stroke="' + this.envConfigService.defaultBorderColorForNoDataValues + '" stroke-width="2" fill="' + this.envConfigService.defaultColorForNoDataValues + '" />' +
      '<circle style="stroke-opacity: ' + this.envConfigService.defaultFillOpacityForNoDataValues + ';" cx="14" cy="14" r="1.5" stroke="' + this.envConfigService.defaultBorderColorForNoDataValues + '" stroke-width="2" fill="' + this.envConfigService.defaultColorForNoDataValues + '" />' +
      'Sorry, your browser does not support inline SVG.</svg>';

    this.noDataStyle = this.visualStyleHelperService.noDataStyle;
  };

  refreshOutliersStyle() {

    this.containsOutliers_high = false;
    this.containsOutliers_low = false;
    this.outlierMinValue = undefined;
    this.outlierMaxValue = undefined;
    this.showOutlierInfoAlert = false;

    this.svgString_outlierLow = '<svg height="18" width="18"><line x1="10" y1="0" x2="110" y2="100" style="stroke:' + this.envConfigService.defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="0" x2="100" y2="100" style="stroke:' + this.envConfigService.defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_low + ';" /><line x1="0" y1="10" x2="100" y2="110" style="stroke:' + this.envConfigService.defaultColorForOutliers_low + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_low + ';" />Sorry, your browser does not support inline SVG.</svg>';
    this.svgString_outlierHigh = '<svg height="18" width="18"><line x1="8" y1="18" x2="18" y2="8" style="stroke:' + this.envConfigService.defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="18" x2="18" y2="0" style="stroke:' + this.envConfigService.defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_high + ';" /><line x1="0" y1="10" x2="10" y2="0" style="stroke:' + this.envConfigService.defaultColorForOutliers_high + ';stroke-width:2; stroke-opacity: ' + this.envConfigService.defaultFillOpacityForOutliers_high + ';" />Sorry, your browser does not support inline SVG.</svg>';

    // if (this.useTransparencyOnIndicator) {
    //   fillOpacity_high = defaultFillOpacityForOutliers_high;
    //   fillOpacity_low = defaultFillOpacityForOutliers_low;
    // }

    this.outlierStyle_high = this.visualStyleHelperService.outlierStyle_high;
    this.outlierStyle_low = this.visualStyleHelperService.outlierStyle_low;
  };

  refreshFilteredStyle() {
    this.filteredStyle = this.visualStyleHelperService.filteredStyle;
  };

  initSpatialUnitOutlineLayer() {

    for (let spatialUnit of this.spatialUnitStore.availableSpatialUnits) {
      if (spatialUnit.isOutlineLayer) {

        let url = this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
          "/spatial-units/" + spatialUnit.spatialUnitId + "/allFeatures";

        this.http.get(url).subscribe((response: any) => {
          let geoJSON = response;

          let layer = L.geoJSON(geoJSON, {
            style: function (feature) {
              return {
                color: spatialUnit.outlineColor,
                weight: spatialUnit.outlineWidth,
                opacity: 1,
                fillOpacity: 0,
                fill: false,
                dashArray: spatialUnit.outlineDashArrayString
              };
            },
            onEachFeature: this.onEachFeatureSpatialUnit
          });


          this.layerControl.addOverlay(layer, spatialUnit.spatialUnitLevel + "_Umringe", this.spatialUnitOutlineLayerGroupName);
          this.updateSearchControl();
        });
      }
    }
  };

  filterForScreenshot(node) {
    return (
      node.tagName !== 'BUTTON' &&
      node.tagName !== 'A' && (
        node.className instanceof SVGAnimatedString ||
        !node.className.includes('leaflet-control')
      )
    );
  }

  exportMap() {

    let node = document.getElementById("ngMap");

    return domtoimage
      .toBlob(node, {
        "quality": 1.0,
        filter: this.filterForScreenshot,
        width: this.map.getSize().x,
        height: this.map.getSize().y
      }).then((blob) => {
        // FileSaver saveAs method
        saveAs(blob, 'KomMonitor-Screenshot.png');
      }).catch((error) => {
        console.log("Error while exporting map view.");
        console.error(error);

        this.mapErrorNotificationService.displayMapApplicationError;
      });

  }

  isKomMonitorSpecificProperty(propertyKey) {
    let isKomMonitorSpecificProperty = false;

    if (propertyKey == "outlier") {
      isKomMonitorSpecificProperty = true;
    }
    else if (propertyKey == this.envConfigService.VALID_START_DATE_PROPERTY_NAME) {
      isKomMonitorSpecificProperty = true;
    }
    else if (propertyKey == this.envConfigService.VALID_END_DATE_PROPERTY_NAME) {
      isKomMonitorSpecificProperty = true;
    }
    else if (propertyKey == "bbox") {
      isKomMonitorSpecificProperty = true;
    }
    else if (propertyKey.includes(this.envConfigService.indicatorDatePrefix)) {
      isKomMonitorSpecificProperty = true;
    }

    return isKomMonitorSpecificProperty;
  }

  MultipleResultsLeafletSearch = L.Control.Search.extend({

    _makeUniqueKey: function (featureName, featureId) {
      return featureName + " (Name) - " + featureId + " (ID)";
    },

    _searchInLayer: function (layer, retRecords, propName) {
      var self = this, loc;
      var key_withUniqueID;

      if (layer instanceof L.Control.Search.Marker) return;

      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        if (self._getPath(layer.options, propName)) {
          loc = layer.getLatLng();
          loc.layer = layer;
          retRecords[self._getPath(layer.options, propName)] = loc;
        }
        else if (self._getPath(layer.feature.properties, propName)) {
          loc = layer.getLatLng();
          loc.layer = layer;
          key_withUniqueID = this._makeUniqueKey(self._getPath(layer.feature.properties, propName), layer.feature.properties.ID);
          retRecords[key_withUniqueID] = loc;
        }
        else {
          //throw new Error("propertyName '"+propName+"' not found in marker");
          console.warn("propertyName '" + propName + "' not found in marker");
        }
      }
      else if (layer instanceof L.Path || layer instanceof L.Polyline || layer instanceof L.Polygon) {
        if (self._getPath(layer.options, propName)) {
          loc = layer.getBounds().getCenter();
          loc.layer = layer;
          retRecords[self._getPath(layer.options, propName)] = loc;
        }
        else if (self._getPath(layer.feature.properties, propName)) {
          loc = layer.getBounds().getCenter();
          loc.layer = layer;
          key_withUniqueID = this._makeUniqueKey(self._getPath(layer.feature.properties, propName), layer.feature.properties.ID);
          retRecords[key_withUniqueID] = loc;
        }
        else {
          //throw new Error("propertyName '"+propName+"' not found in shape");
          console.warn("propertyName '" + propName + "' not found in shape");
        }
      }
      else if (layer.hasOwnProperty('feature'))//GeoJSON
      {
        if (layer.feature.properties.hasOwnProperty(propName)) {

          key_withUniqueID = this._makeUniqueKey(self._getPath(layer.feature.properties, propName), layer.feature.properties.ID);
          if (layer.getLatLng && typeof layer.getLatLng === 'function') {
            loc = layer.getLatLng();
            loc.layer = layer;
            retRecords[key_withUniqueID] = loc;
          } else if (layer.getBounds && typeof layer.getBounds === 'function') {
            loc = layer.getBounds().getCenter();
            loc.layer = layer;
            retRecords[key_withUniqueID] = loc;
          } else {
            console.warn("Unknown type of Layer");
          }
        }
        else {
          //throw new Error("propertyName '"+propName+"' not found in feature");
          console.warn("propertyName '" + propName + "' not found in feature");
        }
      }
      else if (layer instanceof L.LayerGroup) {
        layer.eachLayer(function (layer) {
          self._searchInLayer(layer, retRecords, propName);
        });
      }
    },
    _defaultMoveToLocation: function (latlng, title, map) {
      if (this.options.zoom)
        this._map.setView(latlng, this.options.zoom);
      else
        this._map.panTo(latlng);

      // add collapse after click on item
      this.collapse();
    },
    _handleAutoresize: function () {
      var maxWidth;

      if (!this._map) {
        this._map = this.map;
      }

      if (this._input.style.maxWidth !== this._map._container.offsetWidth) {
        maxWidth = this._map._container.clientWidth;

        // other side margin + padding + width border + width search-button + width search-cancel
        maxWidth -= 10 + 20 + 1 + 30 + 22;

        this._input.style.maxWidth = maxWidth.toString() + 'px';
      }

      if (this.options.autoResize && (this._container.offsetWidth + 20 < this._map._container.offsetWidth)) {
        this._input.size = this._input.value.length < this._inputMinSize ? this._inputMinSize : this._input.value.length;
      }
    }
  });

  updateSearchControl() {

    const isKomMonitorSpecificProperty = (propertyKey) => {
      let isKomMonitorSpecificProperty = false;

      if (propertyKey == "outlier") {
        isKomMonitorSpecificProperty = true;
      }
      else if (propertyKey == this.envConfigService.VALID_START_DATE_PROPERTY_NAME) {
        isKomMonitorSpecificProperty = true;
      }
      else if (propertyKey == this.envConfigService.VALID_END_DATE_PROPERTY_NAME) {
        isKomMonitorSpecificProperty = true;
      }
      else if (propertyKey == "bbox") {
        isKomMonitorSpecificProperty = true;
      }
      else if (propertyKey.includes(this.envConfigService.indicatorDatePrefix)) {
        isKomMonitorSpecificProperty = true;
      }

      return isKomMonitorSpecificProperty;
    }

    setTimeout(() => {
      if (this.searchControl) {
        try {
          this.map.removeControl(this.searchControl);
          this.searchControl = undefined;
        }
        catch (error) {
          this.mapErrorNotificationService.displayMapApplicationError(error);
        }
      }

      // build L.featureGroup of available POI layers
      let featureLayers: any[] = [];

      for (let layerEntry of this.layerControl._layers) {
        if (layerEntry) {
          if (layerEntry.overlay) {
            if (this.map.hasLayer(layerEntry.layer)) {
              if (layerEntry.group.name === this.poiLayerGroupName || layerEntry.group.name === this.loiLayerGroupName || layerEntry.group.name === this.aoiLayerGroupName || layerEntry.group.name === this.indicatorLayerGroupName || layerEntry.group.name === this.wfsLayerGroupName || layerEntry.group.name === this.fileLayerGroupName) {
                featureLayers.push(layerEntry.layer);
              }
            }

          }
        }
      }

      let layerGroup;
      // if no relevant layers are currently displayed, then
      if (featureLayers.length === 0) {
        this.searchControl = new this.MultipleResultsLeafletSearch({
        });
        this.searchControl.addTo(this.map);

        $('.leaflet-control-search').toggle();
      }
      else {
        layerGroup = L.featureGroup(featureLayers);

        this.searchControl = new this.MultipleResultsLeafletSearch({
          position: "topleft",
          layer: layerGroup,
          initial: false,
          propertyName: this.envConfigService.FEATURE_NAME_PROPERTY_NAME,
          textPlaceholder: "Layer-Objekte nach Name und/oder ID filtern",
          textCancel: "Abbrechen",
          textErr: "Position nicht gefunden",
          hideMarkerOnCollapse: true,
          zoom: 15,
          autoResize: true,
          autoCollapse: false,
          autoType: true,
          formatData: function (json) {	//adds coordinates to name.
            let propName = this.options.propertyName,
              propLoc = this.options.propertyLoc,
              i, jsonret = {};
            if (L.Util.isArray(propLoc))
              for (i in json) {
                if (!this._getPath(json[i], propName)) continue;
                jsonret[this._getPath(json[i], propName) + " (" + json[i][propLoc[0]] + "," + json[i][propLoc[1]] + ")"] = L.latLng(json[i][propLoc[0]], json[i][propLoc[1]]);
              }
            else
              for (i in json) {
                if (!this._getPath(json[i], propName)) continue;
                jsonret[this._getPath(json[i], propName) + " (" + json[i][propLoc][0] + "," + json[i][propLoc][1] + ")"] = L.latLng(this._getPath(json[i], propLoc));
              }
            return jsonret;
          },
          filterData: function (text, records) {
            let I, icase, regSearch, frecords = {};

            text = text.replace(/[.*+?^${}()|[\]\\]/g, '');  //sanitize remove all special characters
            if (text === '')
              return [];

            I = this.options.initial ? '^' : '';  //search only initial text
            icase = !this.options.casesensitive ? 'i' : undefined;

            regSearch = new RegExp(I + text, icase);

            for (let key in records) {

              // make a searchable string from all relevant feature properties
              let recordString = "";
              let record = records[key];
              let recordProperties = record.layer.feature.properties;

              for (let propertyKey in recordProperties) {
                if (recordProperties[propertyKey] && !isKomMonitorSpecificProperty(propertyKey)) {
                  recordString += recordProperties[propertyKey];
                }
              }

              if (regSearch.test(recordString))
                frecords[key] = records[key];
            }

            return frecords;
          },
          buildTip: (text, val) => {
            let emString = "";

            if (val.layer.metadataObject) {
              if (val.layer.metadataObject.isPOI) {
                emString += '<i style="width:14px;height:14px;float:left;" class="awesome-marker-legend awesome-marker-legend-icon-' + val.layer.metadataObject.poiMarkerColor + '">';
                emString += "<span style='margin-left:3px; top:-2px; font-size:0.7em; color:" + val.layer.metadataObject.poiSymbolColor + ";' align='center' class='glyphicon glyphicon-" + val.layer.metadataObject.poiSymbolBootstrap3Name + "' aria-hidden='true'></span>";
                emString += '</i>';
              }
            }
            else {
              emString += "<i style='font-size:1.0em;' class='fas fa-sitemap'></i>";
            }
            return '<a href="" class="search-tip">' + emString + '&nbsp;&nbsp;' + text + '</a>';
          }
        });

        this.searchControl.addTo(this.map);

        $('.leaflet-control-search').toggle();
      }
    }, 200);

  };


  showLoadingIconOnMap() {
    // console.log("Show loading icon on map");
    this.loadingData = true;
  }

  hideLoadingIconOnMap() {
    // console.log("Hide loading icon on map");
    setTimeout(() => {
      this.loadingData = false;
    }, 250);

  }

  // $(document).on('change','#selectSimplifyGeometriesViaInfoControl',function(){
  //   selector = document.getElementById('selectSimplifyGeometriesViaInfoControl');
  //   simplifyGeometries = selector[selector.selectedIndex].value;
  //
  //   kommonitorDataExchangeService.simplifyGeometries = simplifyGeometries;
  //
  //   $rootScope.$broadcast("changeSpatialUnit");
  // });

  changeSpatialUnitViaInfoControl() {
    this.broadcastService.broadcast('changeSpatialUnit');
  }


  appendSpatialUnitOptions() {

    // <form action="select.html">
    //   <label>Künstler(in):
    //     <select name="top5" size="5">
    //       <option>Heino</option>
    //       <option>Michael Jackson</option>
    //       <option>Tom Waits</option>
    //       <option>Nina Hagen</option>
    //       <option>Marianne Rosenberg</option>
    //     </select>
    //   </label>
    // </form>

    // innerHTMLString = "<form>";
    // innerHTMLString += "<label>Raumebene:  ";
    // innerHTMLString += "<select id='selectSpatialUnitViaInfoControl'>";
    //
    //
    // for (option of kommonitorDataExchangeService.availableSpatialUnits){
    //
    //   if (kommonitorDataExchangeService.selectedIndicator.applicableSpatialUnits.some(o => o.spatialUnitName ===  option.spatialUnitLevel)){
    //     innerHTMLString += ' <option value="' + option.spatialUnitLevel + '" ';
    //     if (kommonitorDataExchangeService.selectedSpatialUnit.spatialUnitLevel === option.spatialUnitLevel){
    //       innerHTMLString +=' selected ';
    //     }
    //     innerHTMLString +='>' + option.spatialUnitLevel + '</option>';
    //   }
    // }
    // innerHTMLString += "</select>";
    // innerHTMLString += "</label>";
    // innerHTMLString += "</form>";
    // // innerHTMLString += "<br/>";

    // <div class="dropdown">
    //     <a aria-expanded="false" aria-haspopup="true" role="button" data-toggle="dropdown" class="dropdown-toggle" href="#">
    //       <span id="selected">Chose option</span><span class="caret"></span></a>
    //   <ul class="dropdown-menu">
    //     <li><a href="#">Option 1</a></li>
    //     <li><a href="#">Option 2</a></li>
    //     <li><a href="#">Option 3</a></li>
    //     <li><a href="#">Option 4</a></li>
    //   </ul>
    // </div>

    let innerHTMLString = '<div class="row" style="margin-right: 0px;">';
    innerHTMLString += "<div class='col-sm-3'><div class='text-left'><label>Raumebene:   </label></div></div>";
    innerHTMLString += "<div class='col-sm-9'><div class='text-left'><div id='selectSpatialUnitViaInfoControl' class='dropdown'>";
    innerHTMLString += '<button class="btn btn-primary btn-xs dropdown-toggle" type="button" data-toggle="dropdown"><span id="selectSpatialUnitViaInfoControl_text">' + this.selectionState.selectedSpatialUnit.spatialUnitLevel + '&nbsp;&nbsp;&nbsp;</span><span class="caret"></span></button>';
    innerHTMLString += '<ul id="spatialUnitInfoControlDropdown" class="dropdown-menu">';

    for (let option of this.spatialUnitStore.availableSpatialUnits) {

      if (this.selectionState.isAllowedSpatialUnitForCurrentIndicator(option)) {
        innerHTMLString += ' <li><p style="cursor: pointer; font-size:12px;">' + option.spatialUnitLevel;
        innerHTMLString += '</p></li>';
      }
    }
    innerHTMLString += "</ul>";
    innerHTMLString += "</div></div></div>";
    innerHTMLString += "</div>";

    return innerHTMLString;
  };

  // $scope.appendSimplifyGeometriesOptions(){
  //
  //   // <form action="select.html">
  //   //   <label>Künstler(in):
  //   //     <select name="top5" size="5">
  //   //       <option>Heino</option>
  //   //       <option>Michael Jackson</option>
  //   //       <option>Tom Waits</option>
  //   //       <option>Nina Hagen</option>
  //   //       <option>Marianne Rosenberg</option>
  //   //     </select>
  //   //   </label>
  //   // </form>
  //
  //   innerHTMLString = "<form>";
  //   innerHTMLString += "<label title='Angabe, ob die Geometrien für die Kartendarstellung vereinfacht werden sollen. Jede der Optionen schwach, mittel, stark, reduziert dabei die Stützpunkte der Geometrien um ein Zunehmendes Maß. Dies reduziert die Geometrie-Komplexitität und erhöht die Performanz.'>Geometrie vereinfachen?  ";
  //   innerHTMLString += "<select id='selectSimplifyGeometriesViaInfoControl'>";
  //
  //
  //   for (option of kommonitorDataExchangeService.simplifyGeometriesOptions){
  //       innerHTMLString += ' <option value="' + option.value + '" ';
  //       if (kommonitorDataExchangeService.simplifyGeometries === option.value){
  //         innerHTMLString +=' selected ';
  //       }
  //       innerHTMLString +='>' + option.label + '</option>';
  //   }
  //   innerHTMLString += "</select>";
  //   innerHTMLString += "</label>";
  //   innerHTMLString += "</form>";
  //   // innerHTMLString += "<br/>";
  //
  //   return innerHTMLString;
  // };

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
  };

  toggleLegendControl() {
    if (this.showLegendControl === true) {
      /* use jquery to select your DOM elements that has the class 'legend' */
      $('.legendMap').hide();
      this.showLegendControl = false;

      $('#toggleLegendControlButton').show();
    } else {
      $('.legendMap').show();
      this.showLegendControl = true;

      // button is defined in kommonitor-user-interface component
      $('#toggleLegendControlButton').hide();
    }
  };

  /*
    $scope.appendInfoCloseButton () {
      return '<div id="info_close" class="btn btn-link" style="right: 0px; position: relative; float: right;" title="beenden"><span class="glyphicon glyphicon-remove"></span></div>';
    };
  
    $scope.appendLegendCloseButton () {
      return '<div id="legend_close" class="btn btn-link" style="right: 0px; position: relative; float: right;" title="beenden"><span class="glyphicon glyphicon-remove"></span></div>';
    };
  
    $scope.appendIndicatorInformation(isCustomComputation){
      indicatorInfoHTML = '<div>';
        titel = $scope.indicatorName;
  
        if (isCustomComputation) {
          titel += " - <i>individuelles Berechnungsergebnis</i>";
        }
  
        indicatorInfoHTML += '<h4>' + titel + '</h4><br/>';
        indicatorInfoHTML += '<b>Beschreibung: </b> ' + $scope.indicatorDescription + '<br/>';
        indicatorInfoHTML += '<b>Datenquelle: </b> ' + $scope.currentIndicatorMetadataAndGeoJSON.metadata.datasource + '<br/>';
        indicatorInfoHTML += $scope.appendSpatialUnitOptions();
  
        transparencyDomString = "";
        transparencyDomString += '<br/><div class="row vertical-align" style="margin-right:0px;">';
        transparencyDomString += '<div class="col-sm-3">';
        transparencyDomString += '<div class="text-left">';
        transparencyDomString += '<label>Transparenz</label>';
        transparencyDomString += '</div>';
        transparencyDomString += '</div>';
        transparencyDomString += '<div class="col-sm-7">';
        transparencyDomString += '<div class="text-left">';
        transparencyDomString += '<input style="width:100%;" id="indicatorTransparencyInput" type="range" value="' + (1 - this.visualStyleHelperService.getOpacity()).toFixed(numberOfDecimals) + '" min="0" max="1" step="0.01">';
        transparencyDomString += '</div>';
        transparencyDomString += '</div>';
        transparencyDomString += '<div class="col-sm-2">';
        transparencyDomString += '<div class="text-left">';
        transparencyDomString += '<label id="indicatorTransparencyLabel">' + (1 - kommonitorVisualStyleHelperService.getOpacity()).toFixed(numberOfDecimals) + '</label>';
        transparencyDomString += '</div>';
        transparencyDomString += '</div>';
        transparencyDomString += '</div>';
  
        indicatorInfoHTML += transparencyDomString;
  
        exportDomString = '<br/><div class="btn-group">';
        exportDomString += "<label><i class='fa fa-file-download'></i>&nbsp;&nbsp;&nbsp;Export</label>";
        exportDomString += '<br/><button id="downloadMetadata" class="btn btn-default btn-xs">Metadatenblatt</button>';
        exportDomString += '<button id="downloadGeoJSON" class="btn btn-primary btn-xs">GeoJSON</button>';
        exportDomString += '<button id="downloadShape" class="btn btn-primary btn-xs">ESRI Shape</button>';
        // temporarily disable WMS and WFS export
        exportDomString += '<a style="color:white;pointer-events: none;cursor: default;" class="btn btn-primary btn-xs disabled" href="' + kommonitorDataExchangeService.wmsUrlForSelectedIndicator + '" target="_blank" rel="noopener noreferrer" id="downloadWMS"><span title="WMS Link in Zukunft abrufbar">WMS</span></a>';
        exportDomString += '<a style="color:white;pointer-events: none;cursor: default;" class="btn btn-primary btn-xs disabled" href="' + kommonitorDataExchangeService.wfsUrlForSelectedIndicator + '" target="_blank" rel="noopener noreferrer" id="downloadWFS"><span title="WFS Link in Zukunft abrufbar">WFS</span></a>';
        exportDomString += "</div>";
  
        indicatorInfoHTML += exportDomString;
  
        indicatorInfoHTML += "<br/><br/><hr><br/>";
  
        // indicatorInfoHTML += $scope.appendSimplifyGeometriesOptions();
        return indicatorInfoHTML;
    };
  
    
    $(document).on('click', '#controlIndicatorTransparency', function (e) {
      indicatorTransparencyCheckbox = document.getElementById('controlIndicatorTransparency');
      if (indicatorTransparencyCheckbox.checked) {
        $scope.useTransparencyOnIndicator = true;
      }
      else {
        $scope.useTransparencyOnIndicator = false;
      }
      $rootScope.$broadcast("restyleCurrentLayer", false);
  
      // ensure that highlighted features remain highlighted
      preserveHighlightedFeatures();
    });
  
    $(document).on('click', '#controlIndicatorOutlierDetection', function (e) {
      indicatorOutlierCheckbox = document.getElementById('controlIndicatorOutlierDetection');
      if (indicatorOutlierCheckbox.checked) {
        kommonitorDataExchangeService.useOutlierDetectionOnIndicator = true;
      }
      else {
        kommonitorDataExchangeService.useOutlierDetectionOnIndicator = false;
      }
      $rootScope.$broadcast("restyleCurrentLayer", false);
  
      // ensure that highlighted features remain highlighted
      preserveHighlightedFeatures();
    });
  
    $(document).on('click', '#controlIndicatorZeroClassifyOption', function (e) {
      zeroClassifyCheckbox = document.getElementById('controlIndicatorZeroClassifyOption');
      if (zeroClassifyCheckbox.checked) {
        kommonitorDataExchangeService.classifyZeroSeparately = true;
      }
      else {
        kommonitorDataExchangeService.classifyZeroSeparately = false;
      }
      $rootScope.$broadcast("restyleCurrentLayer", false);
  
      // ensure that highlighted features remain highlighted
      preserveHighlightedFeatures();
    });      
  */

  changeClassifyMethod([method]) {
    this.visualStyleHelperService.classifyMethod = method;

    setTimeout(() => {
      this.visualStyleHelperService.classifyMethod = method;
    }, 350);

    this.broadcastService.broadcast("restyleCurrentLayer", [false]);
  }

  changeNumClasses([num]) {
    this.visualStyleHelperService.numClasses = num;

    setTimeout(() => {
      this.visualStyleHelperService.numClasses = num;
    }, 350);

    this.broadcastService.broadcast("restyleCurrentLayer", [false]);
  }

  changeColorScheme([colorSchemeName]) {
    this.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName = colorSchemeName;

    this.broadcastService.broadcast("restyleCurrentLayer", [false]);
  }

  changeBreaks([breaks]) {
    breaks = [...new Set(breaks)];
    breaks.sort(function (a, b) {
      return a - b;
    });

    this.visualStyleHelperService.manualBrew.breaks = breaks;
    this.updateManualMOVBreaksFromDefaultManualBreaks();

    setTimeout(() => {
      this.visualStyleHelperService.manualBrew.breaks = breaks;
      this.updateManualMOVBreaksFromDefaultManualBreaks();
      this.broadcastService.broadcast("restyleCurrentLayer", [false]);
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
    this.updateManualMOVBreaksFromDefaultManualBreaks();

    this.broadcastService.broadcast("restyleCurrentLayer", [false]);
  }
  /*
    $scope.$on("changeMOV", function (event, mov) {
      $scope.updateManualMOVBreaksFromDefaultManualBreaks();
    });
  
    $(document).on('click', '#controlNoDataDisplay', function (e) {
      controlNoDataDisplayCheckbox = document.getElementById('controlNoDataDisplay');
  
      if (controlNoDataDisplayCheckbox.checked) {
        $scope.applyNoDataDisplay();
      } else {
        $scope.resetNoDataDisplay();
      }
  
      this.broadcastService.broadcast("restyleCurrentLayer", false);
  
      // ensure that highlighted features remain highlighted
      preserveHighlightedFeatures();
    }); 
  
  
    $scope.$on("applyNoDataDisplay", function() {
      $scope.applyNoDataDisplay();
    });
    
    
    $scope.applyNoDataDisplay() {
      kommonitorDataExchangeService.useNoDataToggle = true;
      $scope.featuresWithValues = [];
      for (i = 0; i < $scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features.length; i++) {
        if (!kommonitorDataExchangeService.indicatorValueIsNoData($scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i].properties[$scope.indicatorPropertyName])) {
          $scope.featuresWithValues.push($scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i])
        } else {
          $scope.featuresWithoutValues.push($scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i])
        }
      }
      
      // get feature names array
      let featuresWithValuesNames = [];
      for (i = 0; i < $scope.featuresWithValues.length; i++) {
        featuresWithValuesNames.push( $scope.featuresWithValues[i].properties["name"]);
      }
  
      // store checkbox state
      let completelyRemoveFilteredFeaturesFromDisplayChbState = kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay;
      kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay = true; // set checkbox true
      // perform spatial filter
      kommonitorFilterHelperService.applySpatialFilter_currentSpatialUnitFeatures(featuresWithValuesNames);
      // set checkbox to previous state
      kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay = completelyRemoveFilteredFeaturesFromDisplayChbState;
    }
  
  
    $scope.$on("resetNoDataDisplay", function() {
      $scope.resetNoDataDisplay();
    });
  
    $scope.resetNoDataDisplay() {
      kommonitorDataExchangeService.useNoDataToggle = false;
        let visibleFeatures = $scope.currentIndicatorMetadataAndGeoJSON.geoJSON.features;
        let visibleAndNoDataFeatures = visibleFeatures.concat($scope.featuresWithoutValues);
  
        // get feature names array
        let visibleAndNoDataFeaturesNames = [];
        for (i = 0; i < visibleAndNoDataFeatures.length; i++) {
          visibleAndNoDataFeaturesNames.push( visibleAndNoDataFeatures[i].properties["name"]);
        }
  
        // store checkbox state
        let completelyRemoveFilteredFeaturesFromDisplayChbState = kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay;
        kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay = true; // set checkbox true
        // perform spatial filter
        kommonitorFilterHelperService.applySpatialFilter_currentSpatialUnitFeatures(visibleAndNoDataFeaturesNames);
        // set checkbox to previous state
        kommonitorFilterHelperService.completelyRemoveFilteredFeaturesFromDisplay = completelyRemoveFilteredFeaturesFromDisplayChbState;
  
        $scope.featuresWithoutValues = [];
    }
   */

  /**
   * binds the popup of a clicked output
   * to layer.feature.properties.popupContent
   */
  onEachFeatureSpatialUnit(feature, layer) {
    // does this feature have a property named popupContent?
    layer.on({
      click: function () {

        // propertiesString = "<pre>" + JSON.stringify(feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

        let popupContent = '<div class="spatialUnitInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
        for (let p in feature.properties) {
          popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
        }
        popupContent += '</table></div>';

        layer.bindPopup(popupContent);

        // if (propertiesString)
        //   layer.bindPopup(propertiesString);
      }
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

        let popupContent = '<div class="georesourceInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
        for (let p in feature.properties) {
          popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
        }
        popupContent += '</table></div>';

        layer.bindPopup(popupContent);

        // propertiesString = "<pre>" + JSON.stringify(feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

        // if (propertiesString)
        //   layer.bindPopup(propertiesString);
      }
    });
  }

  /**
   * binds the popup of a clicked output
   * to layer.feature.properties.popupContent
   */

  onEachFeatureIndicator(feature, layer) {

    let indicatorValueText = feature.tempData.indicatorValueText;

    let tooltipHtml = "<b>" + feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] + "</b><br/>" + indicatorValueText + " [" + feature.tempData.unitText + "]";
    layer.bindTooltip(tooltipHtml, {
      sticky: false // If true, the tooltip will follow the mouse instead of being fixed at the feature center.
    });

    layer.on({
      mouseover: (l) => this.highlightFeature(l),
      mouseout: (l) => this.resetHighlight(l),
      click: (l) => this.switchHighlightFeature(l)
    });
  }

  switchHighlightFeature(layer) {

    // add or remove feature within a list of "clicked features"
    // those shall be treated specially, i.e. keep being highlighted
    if (!this.filterHelperService.featureIsCurrentlySelected(layer.target.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
      this.filterHelperService.addFeatureToSelection(layer.target.feature);
      this.highlightClickedFeature(layer.target);
    }

    else {
      //remove from array
      this.filterHelperService.removeFeatureFromSelection(layer.target.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]);
      this.resetHighlightClickedFeature(layer.target);
    }
  }
  /*
    function onEachFeatureCustomIndicator(feature, layer) {
      // does this feature have a property named popupContent?
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlightCustom,
        click: function () {
  
          popupContent = layer.feature.properties;
  
          if (popupContent)
            layer.bindPopup("Indicator: " + JSON.stringify(popupContent));
        }
      });
    }
  
  
    $scope.$on("addSpatialUnitAsGeopackage", function (event) {
  
      console.log('addSpatialUnitAsGeopackage was called');
  
      layer = L.geoPackageFeatureLayer([], {
        geoPackageUrl: './test1234.gpkg',
        layerName: 'test1234',
        style: function (feature) {
          return {
            color: "#F00",
            weight: 1,
            opacity: 1
          };
        },
        onEachFeature: onEachFeatureSpatialUnit
      });
  
      // layer.StyledLayerControl = {
      // 	removable : true,
      // 	visible : true
      // };
  
      $scope.layerControl.addOverlay(layer, "GeoPackage", { groupName: spatialUnitLayerGroupName });
      layer.addTo($scope.map);
      $scope.updateSearchControl();
  
  
    });
  
    $scope.$on("addSpatialUnitAsGeoJSON", function (event, spatialUnitMetadataAndGeoJSON, date) {
  
      console.log('addSpatialUnitAsGeoJSON was called');
  
      // if ($scope.layers.overlays[spatialUnitMetadataAndGeoJSON.spatialUnitLevel]) {
      //     delete $scope.layers.overlays[spatialUnitMetadataAndGeoJSON.spatialUnitLevel];
      //
      //     console.log($scope.layers.overlays);
      // }
  
      layer = L.geoJSON(spatialUnitMetadataAndGeoJSON.geoJSON, {
        style: function (feature) {
          return {
            color: "blue",
            weight: 1,
            opacity: 1
          };
        },
        onEachFeature: onEachFeatureSpatialUnit
      });
  
      // layer.StyledLayerControl = {
      // 	removable : true,
      // 	visible : true
      // };
  
      $scope.layerControl.addOverlay(layer, spatialUnitMetadataAndGeoJSON.spatialUnitLevel + "_" + date, spatialUnitLayerGroupName);
      layer.addTo($scope.map);
      $scope.updateSearchControl();
  
    });
   */
  /* $scope.$on("addGeoresourceAsGeoJSON", function (event, georesourceMetadataAndGeoJSON, date) {

    layer = L.geoJSON(georesourceMetadataAndGeoJSON.geoJSON, {
      style: function (feature) {
        return {
          color: "red",
          weight: 1,
          opacity: 1
        };
      },
      onEachFeature: onEachFeatureGeoresource
    });

    // layer.StyledLayerControl = {
    //   removable : false,
    //   visible : true
    // };

    $scope.layerControl.addOverlay(layer, georesourceMetadataAndGeoJSON.datasetName + "_" + date, georesourceLayerGroupName);
    layer.addTo($scope.map);
    $scope.updateSearchControl();

    $scope.map.invalidateSize(true);
  });        
  */

  addPoiGeoresourceAsGeoJSON([georesourceMetadataAndGeoJSON, date, useCluster]) {

    let markers: any;
    if (useCluster) {

      markers = new L.markerClusterGroup();

      georesourceMetadataAndGeoJSON.geoJSON.features.forEach((poiFeature) => {
        // index 0 should be longitude and index 1 should be latitude
        //.bindPopup( poiFeature.properties.name )
        let newMarker = this.genericMapHelperService.createCustomMarker(poiFeature, georesourceMetadataAndGeoJSON.poiMarkerStyle, georesourceMetadataAndGeoJSON.poiMarkerText, georesourceMetadataAndGeoJSON.poiSymbolColor, georesourceMetadataAndGeoJSON.poiMarkerColor, georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name, georesourceMetadataAndGeoJSON);

        markers.addLayer(this.genericMapHelperService.addPoiMarker(markers, newMarker));
      });
    } else {
      markers = L.featureGroup();

      georesourceMetadataAndGeoJSON.geoJSON.features.forEach((poiFeature) => {
        // index 0 should be longitude and index 1 should be latitude
        //.bindPopup( poiFeature.properties.name )
        let newMarker = this.genericMapHelperService.createCustomMarker(poiFeature, georesourceMetadataAndGeoJSON.poiMarkerStyle, georesourceMetadataAndGeoJSON.poiMarkerText, georesourceMetadataAndGeoJSON.poiSymbolColor, georesourceMetadataAndGeoJSON.poiMarkerColor, georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name, georesourceMetadataAndGeoJSON);

        markers = this.genericMapHelperService.addPoiMarker(markers, newMarker);
      });
    }


    // markers.StyledLayerControl = {
    //   removable : false,
    //   visible : true
    // };


    this.layerControl.addOverlay(markers, georesourceMetadataAndGeoJSON.datasetName + "_" + date, this.poiLayerGroupName);
    markers.addTo(this.map);
    this.updateSearchControl();
    // $scope.map.addLayer( markers );
    this.map.invalidateSize(true);

    this.hideLoadingIconOnMap();
  }


  removePoiGeoresource([georesourceMetadataAndGeoJSON]) {

    let layerName = georesourceMetadataAndGeoJSON.datasetName;

    this.layerControl._layers.forEach((layer) => {
      //if (layer.group.name === poiLayerGroupName && layer.name.includes(layerName + "_")) {
      if (layer.name.includes(layerName + "_")) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
        this.updateSearchControl();
      }
    });

    this.hideLoadingIconOnMap();
  }

  addAoiGeoresourceAsGeoJSON([georesourceMetadataAndGeoJSON, date]) {

    let color = georesourceMetadataAndGeoJSON.aoiColor;

    let layer = L.geoJSON(georesourceMetadataAndGeoJSON.geoJSON, {
      style: (feature) => {
        return {
          fillColor: color,
          color: "black",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.7
        };
      },
      onEachFeature: this.onEachFeatureGeoresource
    });

    // layer.StyledLayerControl = {
    //   removable : false,
    //   visible : true
    // };

    this.layerControl.addOverlay(layer, georesourceMetadataAndGeoJSON.datasetName + "_" + date, this.aoiLayerGroupName);
    layer.addTo(this.map);
    this.updateSearchControl();

    this.map.invalidateSize(true);

    this.hideLoadingIconOnMap();
  }

  removeAoiGeoresource([georesourceMetadataAndGeoJSON]) {

    let layerName = georesourceMetadataAndGeoJSON.datasetName;

    this.layerControl._layers.forEach((layer) => {
      // todo
      //if (layer.group.name === aoiLayerGroupName && layer.name.includes(layerName + "_")) {
      if (layer.name.includes(layerName + "_")) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
        this.updateSearchControl();
      }
    });

    this.hideLoadingIconOnMap();
  }

  addLoiGeoresourceAsGeoJSON([georesourceMetadataAndGeoJSON, date]) {

    let color = georesourceMetadataAndGeoJSON.aoiColor;

    let featureGroup = L.featureGroup();

    let style = {
      color: georesourceMetadataAndGeoJSON.loiColor,
      dashArray: georesourceMetadataAndGeoJSON.loiDashArrayString,
      weight: georesourceMetadataAndGeoJSON.loiWidth || 3,
      opacity: 1
    };

    georesourceMetadataAndGeoJSON.geoJSON.features.forEach((item, i) => {
      let type = item.geometry.type;

      if (type === "Polygon" || type === "MultiPolygon") {
        let lines = turf.polygonToLine(item);

        L.geoJSON(lines, {
          style: style,
          onEachFeature: this.onEachFeatureGeoresource
        }).addTo(featureGroup);
      }
      else {
        L.geoJSON(item, {
          style: style,
          onEachFeature: this.onEachFeatureGeoresource
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

    this.layerControl.addOverlay(featureGroup, georesourceMetadataAndGeoJSON.datasetName + "_" + date, this.loiLayerGroupName);
    featureGroup.addTo(this.map);
    this.updateSearchControl();

    this.map.invalidateSize(true);
  }

  removeLoiGeoresource(georesourceMetadataAndGeoJSON) {

    let layerName = georesourceMetadataAndGeoJSON.datasetName;

    this.layerControl._layers.forEach((layer) => {
      if (layer.name.includes(layerName + "_")) {
        //if (layer.group.name === loiLayerGroupName && layer.name.includes(layerName + "_")) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
        this.updateSearchControl();
      }
    });
    this.hideLoadingIconOnMap();
  }

  addWmsLayerToMap([dataset, opacity]: [WmsDataset, number]) {

    let wmsLayer = L.tileLayer.wms(dataset.connectionDetails.baseUrl, {
      layers: dataset.connectionDetails.layerName,
      transparent: true,
      format: 'image/png',
      minZoom: this.envConfigService.minZoomLevel,
      maxZoom: this.envConfigService.maxZoomLevel,
      opacity: opacity
    });

    this.layerControl.addOverlay(wmsLayer, dataset.title, this.wmsLayerGroupName);
    wmsLayer.addTo(this.map);
    this.updateSearchControl();
    this.map.invalidateSize(true);
    this.hideLoadingIconOnMap();
  }
  /*
    $scope.$on("adjustOpacityForWmsLayer", function (event, dataset, opacity) {
      layerName = dataset.title;
  
      $scope.layerControl._layers.forEach(function (layer) {
        if (layer.group.name === wmsLayerGroupName && layer.name.includes(layerName)) {
          layer.layer.setOpacity(opacity);
        }
      });
    });
  
    $scope.$on("adjustOpacityForAoiLayer", function (event, dataset, opacity) {
      layerName = dataset.datasetName;
  
      $scope.layerControl._layers.forEach(function (layer) {
        if (layer.group.name === aoiLayerGroupName && layer.name.includes(layerName)) {
          layer.layer.setStyle({
            fillOpacity:opacity,
            opacity:opacity
          });
        }
      });
    });
  
    $scope.$on("adjustOpacityForLoiLayer", function (event, dataset, opacity) {
      layerName = dataset.datasetName;
  
      $scope.layerControl._layers.forEach(function (layer) {
        if (layer.group.name === loiLayerGroupName && layer.name.includes(layerName)) {
          layer.layer.setStyle({
            fillOpacity:opacity,
            opacity:opacity
          });
        }
      });
    });
  
    $scope.$on("adjustOpacityForPoiLayer", function (event, dataset, opacity) {
      layerName = dataset.datasetName;
  
      $scope.layerControl._layers.forEach(function (layer) {
        if (layer.group.name === poiLayerGroupName && layer.name.includes(layerName)) {
  
          if(layer.layer._layers){
            for(layerId in layer.layer._layers){
              layer.layer._layers[layerId].setOpacity(opacity);
            }
          } 
          else if(layer.layer._featureGroup){
            for(layerId in layer.layer._featureGroup._layers){
              layer.layer._featureGroup._layers[layerId].setOpacity(opacity);
            }
          }   
          else{                
            layer.layer.setOpacity(opacity);
          } 
        }
      });
    });
    */
  removeWmsLayerFromMap([dataset]) {

    let layerName = dataset.title;

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

    if (dataset.geometryType === "POI") {
      return {
        weight: 1,
        opacity: opacity,
        color: dataset.poiMarkerColor,
        dashArray: '',
        fillOpacity: opacity,
        fillColor: dataset.poiMarkerColor
      };
    }

    else if (dataset.geometryType === "LOI") {
      return {
        weight: dataset.loiWidth,
        opacity: opacity,
        color: dataset.loiColor,
        dashArray: dataset.loiDashArrayString,
        fillOpacity: opacity,
        fillColor: dataset.loiColor
      };
    }

    else {
      return {
        weight: 1,
        opacity: opacity,
        color: dataset.aoiColor,
        dashArray: '',
        fillOpacity: opacity,
        fillColor: dataset.aoiColor
      };
    }

  };

  getFilterEncoding(dataset) {

    let filterExpressions: any[] = [];

    if (dataset.filterEncoding.PropertyIsEqualTo && dataset.filterEncoding.PropertyIsEqualTo.propertyName && dataset.filterEncoding.PropertyIsEqualTo.propertyValue) {
      filterExpressions.push(new L.Filter.EQ(dataset.filterEncoding.PropertyIsEqualTo.propertyName, dataset.filterEncoding.PropertyIsEqualTo.propertyValue));
    }

    if (dataset.filterFeaturesToMapBBOX) {
      filterExpressions.push(new L.Filter.BBox(dataset.featureTypeGeometryName, this.map.getBounds(), L.CRS.EPSG3857));
    }

    if (filterExpressions.length == 0) {
      return undefined;
    }

    if (filterExpressions.length < 2) {
      return filterExpressions;
    }
    else {
      // stringifiedFilterExpressions = [];

      // for (filterExpr of filterExpressions) {
      //   stringifiedFilterExpressions.push(L.XmlUtil.serializeXmlDocumentString(filterExpr.toGml()));
      // }

      // return new L.Filter.And(...stringifiedFilterExpressions);
      return new L.Filter.And(...filterExpressions);
    }

  };

  addWfsLayerToMap([dataset, opacity, useCluster]) {
    let wfsLayerOptions = {
      url: dataset.url,
      typeNS: dataset.featureTypeNamespace,
      namespaceUri: "http://mapserver.gis.umn.edu/mapserver",
      typeName: dataset.featureTypeName,
      geometryField: dataset.featureTypeGeometryName,
      // maxFeatures: null,
      style: this.getWfsStyle(dataset, opacity),
      filter: undefined
    };

    let filterEncoding = this.getFilterEncoding(dataset);
    if (filterEncoding) {
      wfsLayerOptions.filter = filterEncoding;
    }


    let wfsLayer;
    let poiMarkerLayer;

    if (dataset.geometryType === "POI") {

      if (useCluster) {
        poiMarkerLayer = L.markerClusterGroup({
          iconCreateFunction: function (cluster) {
            let childCount = cluster.getChildCount();

            let c = 'cluster-';
            if (childCount < 10) {
              c += 'small';
            } else if (childCount < 30) {
              c += 'medium';
            } else {
              c += 'large';
            }

            let className = "marker-cluster " + c + " awesome-marker-legend-TransparentIcon-" + dataset.poiMarkerColor;

            //'marker-cluster' + c + ' ' +
            return new L.DivIcon({ html: '<div class="awesome-marker-legend-icon-' + dataset.poiMarkerColor + '" ><span>' + childCount + '</span></div>', className: className, iconSize: new L.Point(40, 40) });
          }
        });
      }
      else {
        poiMarkerLayer = L.featureGroup();
      }

      wfsLayer = new L.WFS(wfsLayerOptions);
    }
    else {
      wfsLayer = new L.WFS(wfsLayerOptions);
    }

    try {
      wfsLayer.once('load', () => {

        if (dataset.geometryType === "POI") {
          poiMarkerLayer = this.genericMapHelperService.createCustomMarkersFromWfsPoints(wfsLayer, poiMarkerLayer, dataset);
        }

        console.log("Try to fit bounds on wfsLayer");
        this.map.fitBounds(wfsLayer.getBounds());

        console.log("Tried fit bounds on wfsLayer");

        this.map.invalidateSize(true);
        // $scope.loadingData = false;
      });

      wfsLayer.on('click', (event) => {
        // propertiesString = "<pre>" + JSON.stringify(event.layer.feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

        let popupContent = '<div class="wfsInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
        for (let p in event.layer.feature.properties) {
          popupContent += '<tr><td>' + p + '</td><td>' + event.layer.feature.properties[p] + '</td></tr>';
        }
        popupContent += '</table></div>';

        let popup: any = L.popup();
        popup
          .setLatLng(event.latlng)
          .setContent(popupContent)
          .openOn(this.map);
      });
      if (poiMarkerLayer) {
        this.layerControl.addOverlay(poiMarkerLayer, dataset.title, this.wfsLayerGroupName);
        poiMarkerLayer.addTo(this.map);
      }
      else {
        this.layerControl.addOverlay(wfsLayer, dataset.title, this.wfsLayerGroupName);
        wfsLayer.addTo(this.map);
      }
      this.updateSearchControl();

    }
    catch (error) {
      this.loadingData = false;
      this.mapErrorNotificationService.displayMapApplicationError(error);
    }


    this.hideLoadingIconOnMap();

  }

  /* $scope.$on("adjustOpacityForWfsLayer", function (event, dataset, opacity) {
    layerName = dataset.title;

    $scope.layerControl._layers.forEach(function (layer) {
      if (layer.group.name === wfsLayerGroupName && layer.name.includes(layerName)) {
        // layer.layer.setOpacity(opacity);
        newStyle = getWfsStyle(dataset, opacity);
        // layer.layer.options.style = newStyle;
        if(layer.layer._layers){
          for(layerId in layer.layer._layers){


            if(dataset.geometryType === "POI"){
              layer.layer._layers[layerId].setOpacity(opacity);
            }
            else{
              layer.layer._layers[layerId].setStyle(newStyle);
            }
          }
        }   
        else{                

          if(dataset.geometryType === "POI"){
            layer.layer.setOpacity(opacity);
          }
          else{
            layer.layer.setStyle(newStyle);
          }
        }           
        
      }
    });
  });

  $scope.$on("adjustColorForWfsLayer", function (event, dataset, opacity) {
    layerName = dataset.title;

    $scope.layerControl._layers.forEach(function (layer) {
      if (layer.group.name === wfsLayerGroupName && layer.name.includes(layerName)) {
        newStyle = getWfsStyle(dataset, opacity);

        layer.layer.setStyle(newStyle);
      }
    });
  });
  */
  removeWfsLayerFromMap(dataset) {

    let layerName = dataset.title;

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
          let newMarker = this.genericMapHelperService.createCustomMarker(poiFeature, dataset.poiMarkerStyle, dataset.poiMarkerText, dataset.poiSymbolColor, dataset.poiMarkerColor, dataset.poiSymbolBootstrap3Name, dataset);

          fileLayer = this.genericMapHelperService.addPoiMarker(fileLayer, newMarker);
        });
      }
      else {
        let style = {
          weight: 1,
          opacity: opacity,
          color: this.envConfigService.defaultBorderColor,
          dashArray: '',
          fillOpacity: 1,
          fillColor: dataset.displayColor
        };

        fileLayer = L.geoJSON(dataset.geoJSON, {
          style: style,
          onEachFeature: (feature, layer) => {
            layer.on({
              click: () => {

                // propertiesString = "<pre>" + JSON.stringify(feature.properties, null, ' ').replace(/[\{\}"]/g, '') + "</pre>";

                let popupContent = '<div class="fileInfoPopupContent featurePropertyPopupContent"><table class="table table-condensed">';
                for (let p in feature.properties) {
                  popupContent += '<tr><td>' + p + '</td><td>' + feature.properties[p] + '</td></tr>';
                }
                popupContent += '</table></div>';

                if (popupContent)
                  layer.bindPopup(popupContent);
              }
            });
          }
        });
      }

      this.showFileLayer(fileLayer, dataset);
    } catch (error) {
      console.error(error);
      this.broadcastService.broadcast("FileLayerError", [error, dataset]);
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
  };

  adjustOpacityForFileLayer([dataset, opacity]) {
    let layerName = dataset.datasetName;

    this.layerControl._layers.forEach((layer) => {
      if (layer.group.name === this.fileLayerGroupName && layer.name.includes(layerName)) {
        let newStyle = {
          weight: 1,
          opacity: opacity,
          color: this.envConfigService.defaultBorderColor,
          dashArray: '',
          fillOpacity: opacity,
          fillColor: dataset.displayColor
        };

        // layer.layer.options.style = newStyle;
        layer.layer.setStyle(newStyle);
      }
    });
  }

  adjustColorForFileLayer(dataset) {
    let layerName = dataset.datasetName;
    this.layerControl._layers.forEach((layer) => {
      if (layer.group.name === this.fileLayerGroupName && layer.name.includes(layerName)) {

        let newStyle = {
          weight: 1,
          color: this.envConfigService.defaultBorderColor,
          dashArray: '',
          fillColor: dataset.displayColor
        };

        layer.layer.setStyle(newStyle);

      }
    });
  }

  removeFileLayerFromMap(dataset) {

    let layerName = dataset.datasetName;

    this.layerControl._layers.forEach((layer) => {
      if (layer.group.name === this.fileLayerGroupName && layer.name.includes(layerName)) {
        this.layerControl.removeLayer(layer.layer);
        this.map.removeLayer(layer.layer);
      }
    });
  }

  highlightFeature(e) {

    let layer = e.target;
    this.visualStyleHelperService.setOpacity(layer.options.fillOpacity);

    this.highlightFeatureForLayer(layer);
  }

  highlightFeatureForLayer(layer) {

    this.setTemporarilyHighlightedStyle(layer);

    // update diagrams for hovered feature
    this.broadcastService.broadcast("updateDiagramsForHoveredFeature", [layer.feature.properties]);
  }

  highlightClickedFeature(layer) {

    this.setPermanentlyHighlightedStyle(layer);

    // update diagrams for hovered feature
    this.broadcastService.broadcast("updateDiagramsForHoveredFeature", [layer.feature.properties]);
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
      fillOpacity: fillOpacity
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
      fillOpacity: fillOpacity
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
        if (this.filterHelperService.featureIsCurrentlySelected(layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
          this.setPermanentlyHighlightedStyle(layer);
          this.broadcastService.broadcast("updateDiagramsForHoveredFeature", layer.feature.properties);
        }
      }
    });
  }


  resetHighlight(e) {
    let layer = e.target;
    this.resetHighlightForLayer(layer);

    if (!this.filterHelperService.featureIsCurrentlySelected(layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
      layer.bringToBack();
    }
    //layer.bringToBack();
  }

  resetHighlightForLayer(layer) {

    let style;

    // only restyle feature when not in list of clicked features
    if (!this.filterHelperService.featureIsCurrentlySelected(layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
      if (this.filterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
        style = this.filteredStyle;
      }
      else if (!this.chartDisplayState.isMeasureOfValueChecked) {
        //this.currentIndicatorLayer.resetStyle(layer);
        if (this.indicatorTypeOfCurrentLayer.includes('DYNAMIC')) {
          style = this.visualStyleHelperService.styleDynamicIndicator(layer.feature, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, false);
        }
        else {
          if (this.visualStyleHelperService.classifyMethod == 'manual') {
            style = this.visualStyleHelperService.styleDefault(layer.feature, this.manualBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, this.datasetContainsNegativeValues, false);
          }
          else {
            // von hier, defaultBrew
            style = this.visualStyleHelperService.styleDefault(layer.feature, this.defaultBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, this.datasetContainsNegativeValues, false);
          }
        }
      }
      else {
        style = this.visualStyleHelperService.styleMeasureOfValue(layer.feature, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, false);
      }
      layer.setStyle(style);
    }
    else {
      this.setPermanentlyHighlightedStyle(layer);
    }

    //update diagrams for unhoveredFeature
    this.broadcastService.broadcast("updateDiagramsForUnhoveredFeature", [layer.feature.properties]);
  }

  resetHighlightClickedFeature(layer) {
    let style;
    //this.currentIndicatorLayer.resetStyle(layer);
    if (this.filterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
      layer.setStyle(this.filteredStyle);
    }
    else if (!this.chartDisplayState.isMeasureOfValueChecked) {
      //this.currentIndicatorLayer.resetStyle(layer);
      if (this.indicatorTypeOfCurrentLayer.includes('DYNAMIC')) {
        style = this.visualStyleHelperService.styleDynamicIndicator(layer.feature, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, false);

        layer.setStyle(style);
      }
      else {
        style = this.visualStyleHelperService.styleDefault(layer.feature, this.defaultBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, this.datasetContainsNegativeValues, false);

        layer.setStyle(style);
      }
    }
    else {
      style = this.visualStyleHelperService.styleMeasureOfValue(layer.feature, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, false);

      layer.setStyle(style);
    }
  }
  /*
    function resetHighlightCustom(e) {
      $scope.currentCustomIndicatorLayer.resetStyle(e.target);
      if (!kommonitorFilterHelperService.featureIsCurrentlySelected(e.target.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
        e.target.bringToBack();
      }
    }
   */
  wait = ms => new Promise((r, j) => setTimeout(r, ms))

  // dedicated functions
  recenterMapOnly() {
    setTimeout(() => this.fitBounds()); // mini timeout to cover css transition effects
  };

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

  markOutliers(indicatorMetadataAndGeoJSON, indicatorPropertyName) {
    // identify possible data outliers
    // mark them using a dedicated property

    this.outliers_high = [];
    this.outliers_low = [];

    let valueArray = new Array();

    indicatorMetadataAndGeoJSON.geoJSON.features.forEach((feature) => {
      if (!this.indicatorValueService.indicatorValueIsNoData(feature.properties[indicatorPropertyName])) {
        if (!valueArray.includes(feature.properties[indicatorPropertyName])) {
          valueArray.push(feature.properties[indicatorPropertyName]);
        }
      }
    });

    // https://jstat.github.io/all.html#quartiles
    let quartiles = jStat.quartiles(valueArray);
    let quartile_25 = quartiles[0];
    let quartile_75 = quartiles[2];

    let diff = quartile_75 - quartile_25;
    let whiskerRange_outliers_soft = diff * 1.5;
    let whiskerRange_outliers_extreme = diff * 3;

    let whisker_low_soft = quartile_25 - whiskerRange_outliers_soft;
    let whisker_high_soft = quartile_75 + whiskerRange_outliers_soft;

    let whisker_low_extreme = quartile_25 - whiskerRange_outliers_extreme;
    let whisker_high_extreme = quartile_75 + whiskerRange_outliers_extreme;

    // for now only mark extreme outliers!

    indicatorMetadataAndGeoJSON.geoJSON.features.forEach((feature) => {
      // compare feature value to whiskers and set property
      if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[indicatorPropertyName])) {
        feature.properties[this.outlierPropertyName] = this.outlierPropertyValue_no;
      }
      else if (feature.properties[indicatorPropertyName] < whisker_low_extreme) {
        feature.properties[this.outlierPropertyName] = this.outlierPropertyValue_low_extreme;
        this.containsOutliers_low = true;
        this.outliers_low.push(feature.properties[indicatorPropertyName]);
      }
      // else if (feature.properties[indicatorPropertyName] < whisker_low_soft){
      //   feature.properties[outlierPropertyName] = outlierPropertyValue_low_soft;
      //   this.containsOutliers_low = true;
      //   this.outliers_low.push(feature.properties[indicatorPropertyName]);
      // }
      else if (feature.properties[indicatorPropertyName] > whisker_high_extreme) {
        feature.properties[this.outlierPropertyName] = this.outlierPropertyValue_high_extreme;
        this.containsOutliers_high = true;
        this.outliers_high.push(feature.properties[indicatorPropertyName]);
      }
      // else if (feature.properties[indicatorPropertyName] > whisker_high_soft){
      //   feature.properties[outlierPropertyName] = outlierPropertyValue_high_soft;
      //   this.containsOutliers_high = true;
      //   this.outliers_high.push(feature.properties[indicatorPropertyName]);
      // }
      else {
        feature.properties[this.outlierPropertyName] = this.outlierPropertyValue_no;
      }
    });

    // sort outliers arrays
    this.outliers_high.sort(function (a, b) {
      return a - b;
    });
    this.outliers_low.sort(function (a, b) {
      return a - b;
    });

    return indicatorMetadataAndGeoJSON;
  }


  setNoDataValuesAsNull(indicatorMetadataAndGeoJSON) {

    indicatorMetadataAndGeoJSON.geoJSON.features.forEach((feature) => {
      if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[this.indicatorPropertyName])) {
        feature.properties[this.indicatorPropertyName] = null;
      }
    });

    return indicatorMetadataAndGeoJSON;
  }

  applyDefaultClassificationSettings(indicatorMetadataAndGeoJSON) {
    if (indicatorMetadataAndGeoJSON.defaultClassificationMapping.classificationMethod) {
      this.visualStyleHelperService.classifyMethod = indicatorMetadataAndGeoJSON.defaultClassificationMapping.classificationMethod.toLowerCase();
    }
    if (indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses) {
      this.visualStyleHelperService.numClasses = indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses;
    }
  }

  calcMOVBreaks(breaks, measureOfValue) {
    let movBreaks: any[] = [[], []];
    breaks.forEach((br) => {
      if (br < measureOfValue) {
        movBreaks[1].push(br);
      }
      else {
        movBreaks[0].push(br);
      }
    });
    movBreaks[1].push(measureOfValue);
    movBreaks[0].unshift(measureOfValue);
    return movBreaks;
  }


  applyRegionalDefaultClassification(indicatorMetadataAndGeoJSON) {
    if (indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses) {
      this.visualStyleHelperService.numClasses = indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses;
    }

    let firstBreak;
    let lastBreak;
    if (this.defaultBrew && this.defaultBrew.breaks) {
      firstBreak = this.defaultBrew.breaks[0];
      lastBreak = this.defaultBrew.breaks[this.defaultBrew.breaks.length - 1];
    }
    else {
      firstBreak = this.dynamicDecreaseBrew.breaks[0];
      lastBreak = this.dynamicIncreaseBrew.breaks[this.dynamicIncreaseBrew.breaks.length - 1];
    }

    for (let item of indicatorMetadataAndGeoJSON.defaultClassificationMapping.items) {
      if (item.spatialUnitId == this.selectionState.selectedSpatialUnit.spatialUnitId) {
        let regionalDefaultBreaks = [...item.breaks];
        if (firstBreak < regionalDefaultBreaks[0]) {
          regionalDefaultBreaks.unshift(firstBreak);
        }
        if (lastBreak > regionalDefaultBreaks[regionalDefaultBreaks.length - 1]) {
          regionalDefaultBreaks.push(lastBreak);
        }
        if (this.defaultBrew && this.defaultBrew.breaks) {
          let brew: any = this.visualStyleHelperService.setupManualBrew(
            indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses,
            indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
            regionalDefaultBreaks);
          this.defaultBrew.breaks = regionalDefaultBreaks;
          this.defaultBrew.colors = brew.colors;
          this.visualStyleHelperService.regionalDefaultBreaks = regionalDefaultBreaks;
        }
        else {
          let decreaseBreaks = regionalDefaultBreaks.filter(n => n < 0);
          if (this.dynamicDecreaseBrew.breaks[this.dynamicDecreaseBrew.breaks.length - 1] > decreaseBreaks[decreaseBreaks.length - 1]) {
            decreaseBreaks.push(this.dynamicDecreaseBrew.breaks[this.dynamicDecreaseBrew.breaks.length - 1]);
          }
          let increaseBreaks = regionalDefaultBreaks.filter(n => n > 0);
          if (this.dynamicIncreaseBrew.breaks[0] < increaseBreaks[0]) {
            increaseBreaks.unshift(this.dynamicIncreaseBrew.breaks[0]);
          }

          let decreaseBrew: any = this.visualStyleHelperService.setupManualBrew(
            decreaseBreaks.length - 1,
            this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
            decreaseBreaks);
          let increaseBrew: any = this.visualStyleHelperService.setupManualBrew(
            increaseBreaks.length - 1,
            this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
            increaseBreaks);

          this.dynamicDecreaseBrew.breaks = decreaseBreaks;
          this.dynamicIncreaseBrew.breaks = increaseBreaks;

          this.dynamicDecreaseBrew.colors = decreaseBrew.colors;
          this.dynamicIncreaseBrew.colors = increaseBrew.colors;
        }
      }
    }
  }

  checkAvailabilityOfRegionalDefault(indicatorMetadataAndGeoJSON) {
    let breaksAvailableForSelectedSpatialUnit = false;
    for (let item of indicatorMetadataAndGeoJSON.defaultClassificationMapping.items) {
      if (item.spatialUnitId == this.selectionState.selectedSpatialUnit.spatialUnitId) {
        breaksAvailableForSelectedSpatialUnit = true;
      }
    }
    if (this.visualStyleHelperService.classifyMethod == "regional_default") {
      if (!breaksAvailableForSelectedSpatialUnit || this.chartDisplayState.isBalanceChecked) {
        if (!breaksAvailableForSelectedSpatialUnit) {
          // todo
          // kommonitorToastHelperService.displayWarningToast("Für diese Raumebene ist kein regionaler Standard verfügbar", "Es wird zur Klassifizierungsmethode Gleiches Intervall gewechselt");
        }
        else if (this.chartDisplayState.isBalanceChecked) {
          // todo
          // kommonitorToastHelperService.displayWarningToast("Für die Bilanzierung ist kein regionaler Standard verfügbar", "Es wird zur Klassifizierungsmethode Gleiches Intervall gewechselt");
        }
        this.visualStyleHelperService.classifyMethod = 'equal_interval';
        this.visualStyleHelperService.numClasses = this.visualStyleHelperService.numClasses ? this.visualStyleHelperService.numClasses : 5;
      }
    }
    // todo
    // $rootScope.$broadcast("updateShowRegionalDefaultOption", breaksAvailableForSelectedSpatialUnit && !kommonitorDataExchangeService.isBalanceChecked);
  }

  setClassifyZeroForClassifyMethod() {
    if (this.visualStyleHelperService.classifyMethod == "regional_default") {
      if (this.classifyZeroSeparately_backup == undefined) {
        this.classifyZeroSeparately_backup = this.envConfigService.classifyZeroSeparately;
      }
      this.envConfigService.classifyZeroSeparately = false;
    }
    else {
      this.envConfigService.classifyZeroSeparately = this.classifyZeroSeparately_backup != undefined ? this.classifyZeroSeparately_backup : this.envConfigService.classifyZeroSeparately;
      this.classifyZeroSeparately_backup = undefined;
    }
  }

  onReplaceIndicatorAsGeoJSON([indicatorMetadataAndGeoJSON, spatialUnitName, date, justRestyling, isCustomComputation]) {
    this._replaceIndicatorLayer(indicatorMetadataAndGeoJSON, spatialUnitName, date, isCustomComputation, justRestyling);
  }

  private _replaceIndicatorLayer(indicatorMetadataAndGeoJSON, spatialUnitName, date, isCustomComputation, justRestyling = false) {
    console.log('replaceIndicatorAsGeoJSON was called');

    this.visualStyleHelperService.isCustomComputation = !!isCustomComputation;
    //reset opacity
    this.visualStyleHelperService.setOpacity(this.envConfigService.defaultFillOpacity);

    this.refreshFilteredStyle();
    this.refreshOutliersStyle();
    this.refreshNoDataStyle();

    this.defaultBrew = undefined;
    this.gtMeasureOfValueBrew = undefined;
    this.ltMeasureOfValueBrew = undefined;
    this.manualBrew = undefined;

    this.visualStyleHelperService.manualMOVBreaks = [];
    this.visualStyleHelperService.regionalDefaultMOVBreaks = [];
    this.visualStyleHelperService.regionalDefaultBreaks = [];
    this.visualStyleHelperService.measureOfValueBrewArray = [];
    this.visualStyleHelperService.measureOfValueBrew = [];
    this.visualStyleHelperService.manualBrew = undefined;
    this.visualStyleHelperService.dynamicBrew = undefined;
    this.visualStyleHelperService.dynamicBrewBreaks = [];

    this.currentIndicatorMetadataAndGeoJSON = indicatorMetadataAndGeoJSON;

    if (!justRestyling) {
      // empty layer of possibly selected features
      // kommonitorFilterHelperService.clearSelectedFeatures();
      // kommonitorFilterHelperService.clearFilteredFeatures();

      // todo
      // $rootScope.$broadcast("checkBalanceMenueAndButton");
    }

    console.log("Remove old indicatorLayer if exists");
    if (this.currentIndicatorLayer) {
      // todo "removeLayer" expects key "layer" on each "_layer" elem in currentIndicatorLayer. This may be introduced by the groupedLayer, check
      this.layerControl.removeLayer(this.currentIndicatorLayer);
      this.map.removeLayer(this.currentIndicatorLayer);
    }

    this.currentIndicatorContainsZeroValues = false;

    this.date = date;

    this.indicatorPropertyName = this.envConfigService.indicatorDatePrefix + date;
    this.indicatorName = indicatorMetadataAndGeoJSON.indicatorName;
    this.indicatorDescription = indicatorMetadataAndGeoJSON.metadata.description;
    this.indicatorUnit = indicatorMetadataAndGeoJSON.unit;

    this.currentIndicatorMetadataAndGeoJSON = this.setNoDataValuesAsNull(this.currentIndicatorMetadataAndGeoJSON);

    // identify and mark outliers prior to setting up of styling
    // in styling methods, outliers should be removed from classification!
    this.currentIndicatorMetadataAndGeoJSON = this.markOutliers(this.currentIndicatorMetadataAndGeoJSON, this.indicatorPropertyName);

    this.selectionState.setAllFeaturesProperty(indicatorMetadataAndGeoJSON, this.indicatorPropertyName);
    this.selectionState.setSelectedFeatureProperty(this.filterHelperService.selectedIndicatorFeatureIds, this.indicatorPropertyName);

    this.currentGeoJSONOfCurrentLayer = this.currentIndicatorMetadataAndGeoJSON.geoJSON;

    for (let i = 0; i < indicatorMetadataAndGeoJSON.geoJSON.features.length; i++) {
      let containsZero = false;
      let containsNoData = false;
      if (this.getIndicatorValue_asNumber(indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[this.indicatorPropertyName]) == 0) {
        this.currentIndicatorContainsZeroValues = true;
        containsZero = true;
      };

      if (this.indicatorValueService.indicatorValueIsNoData(indicatorMetadataAndGeoJSON.geoJSON.features[i].properties[this.indicatorPropertyName])) {
        this.currentIndicatorContainsNoDataValues = true;
        containsNoData = true;
      };

      if (containsZero && containsNoData) {
        break;
      }
    }

    ///////////////////////////////// RASTER SPECIAL TREATMENT
    // improve Raster display by eliminiating NoData cells and 
    // omitting display border in style


    if (this.selectionState.selectedSpatialUnitIsRaster()) {
      indicatorMetadataAndGeoJSON.geoJSON.features = indicatorMetadataAndGeoJSON.geoJSON.features.filter(feature => {
        if (this.indicatorValueService.indicatorValueIsNoData(feature.properties[this.indicatorPropertyName])) {
          return false;
        }
        return true;
      });
    }

    let layer;

    this.indicatorTypeOfCurrentLayer = indicatorMetadataAndGeoJSON.indicatorType;

    this.applyDefaultClassificationSettings(indicatorMetadataAndGeoJSON);
    this.checkAvailabilityOfRegionalDefault(indicatorMetadataAndGeoJSON);

    this.setClassifyZeroForClassifyMethod();

    if (this.chartDisplayState.isMeasureOfValueChecked) {
      let measureOfValueBrewArray = this.visualStyleHelperService.setupMeasureOfValueBrew(
        this.currentGeoJSONOfCurrentLayer,
        this.indicatorPropertyName,
        this.envConfigService.defaultColorBrewerPaletteForGtMovValues,
        this.envConfigService.defaultColorBrewerPaletteForLtMovValues,
        this.visualStyleHelperService.classifyMethod,
        this.chartDisplayState.measureOfValue,
        this.visualStyleHelperService.manualMOVBreaks,
        this.visualStyleHelperService.regionalDefaultMOVBreaks,
        this.visualStyleHelperService.numClasses
      );
      this.gtMeasureOfValueBrew = measureOfValueBrewArray[0];
      this.ltMeasureOfValueBrew = measureOfValueBrewArray[1];

      this.visualStyleHelperService.manualMOVBreaks = [];
      this.visualStyleHelperService.manualMOVBreaks[0] = measureOfValueBrewArray[0] ? measureOfValueBrewArray[0].breaks : [];
      this.visualStyleHelperService.manualMOVBreaks[1] = measureOfValueBrewArray[1] ? measureOfValueBrewArray[1].breaks : [];
      this.updateDefaultManualBreaksFromMOVManualBreaks();

      this.propertyName = this.envConfigService.indicatorDatePrefix + date;

      layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
        style: (feature) => {

          feature = this.prepFeatureModelForMapUse(feature);

          if (this.filterHelperService.featureIsCurrentlyFiltered(feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
            return this.filteredStyle;
          }
          return this.visualStyleHelperService.styleMeasureOfValue(feature, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, true);
        },
        onEachFeature: (e, l) => { this.onEachFeatureIndicator(e, l) }
      });

      // this.makeMeasureOfValueLegend(isCustomComputation);

      if (indicatorMetadataAndGeoJSON.indicatorType.includes("DYNAMIC")) {
        let dynamicIndicatorBrewArray = this.visualStyleHelperService.setupDynamicIndicatorBrew(
          indicatorMetadataAndGeoJSON.geoJSON,
          this.indicatorPropertyName,
          this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
          this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
          this.visualStyleHelperService.classifyMethod,
          this.visualStyleHelperService.numClasses,
          []);
        this.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
        this.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
        this.visualStyleHelperService.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
        this.visualStyleHelperService.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
        this.updateDefaultManualBreaksFromMOVManualBreaks();
      }

    }
    else {

      if (indicatorMetadataAndGeoJSON.indicatorType.includes("STATUS")) {
        this.datasetContainsNegativeValues = this.containsNegativeValues(indicatorMetadataAndGeoJSON.geoJSON);
        if (this.datasetContainsNegativeValues) {
          let dynamicIndicatorBrewArray = this.visualStyleHelperService.setupDynamicIndicatorBrew(
            indicatorMetadataAndGeoJSON.geoJSON,
            this.indicatorPropertyName,
            this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
            this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
            this.visualStyleHelperService.classifyMethod,
            this.visualStyleHelperService.numClasses,
            this.visualStyleHelperService.dynamicBrewBreaks);
          this.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
          this.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
        }
        else {
          this.defaultBrew = this.visualStyleHelperService.setupDefaultBrew(indicatorMetadataAndGeoJSON.geoJSON, this.indicatorPropertyName, indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses || 5, indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName, this.visualStyleHelperService.classifyMethod);
        }
        if (this.visualStyleHelperService.classifyMethod == "regional_default") {
          this.applyRegionalDefaultClassification(indicatorMetadataAndGeoJSON);
        }
        this.visualStyleHelperService.manualBrew = this.defaultBrew;

        this.propertyName = this.envConfigService.indicatorDatePrefix + date;

        layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
          style: (feature) => {

            feature = this.prepFeatureModelForMapUse(feature);

            if (this.filterHelperService.featureIsCurrentlyFiltered(feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
              return this.filteredStyle;
            }

            return this.visualStyleHelperService.styleDefault(feature, this.defaultBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, this.datasetContainsNegativeValues, true);
          },
          onEachFeature: (e, l) => { this.onEachFeatureIndicator(e, l) }
        });
        // this.makeDefaultLegend(indicatorMetadataAndGeoJSON.defaultClassificationMapping, this.datasetContainsNegativeValues, isCustomComputation);
      }
      else if (indicatorMetadataAndGeoJSON.indicatorType.includes("DYNAMIC")) {
        let dynamicIndicatorBrewArray = this.visualStyleHelperService.setupDynamicIndicatorBrew(
          indicatorMetadataAndGeoJSON.geoJSON,
          this.indicatorPropertyName,
          this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
          this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
          this.visualStyleHelperService.classifyMethod,
          this.visualStyleHelperService.numClasses,
          this.visualStyleHelperService.dynamicBrewBreaks);
        this.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
        this.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];

        this.propertyName = this.envConfigService.indicatorDatePrefix + date;

        layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
          style: (feature) => {

            feature = this.prepFeatureModelForMapUse(feature);

            if (this.filterHelperService.featureIsCurrentlyFiltered(feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
              return this.filteredStyle;
            }
            return this.visualStyleHelperService.styleDynamicIndicator(feature, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, true);
          },
          onEachFeature: (e, l) => { this.onEachFeatureIndicator(e, l) }
        });
        // this.makeDynamicIndicatorLegend(isCustomComputation);
      }

      this.updateManualMOVBreaksFromDefaultManualBreaks();

    }

    if (this.visualStyleHelperService.classifyMethod == "regional_default"
      && this.chartDisplayState.isMeasureOfValueChecked) {
      this.visualStyleHelperService.regionalDefaultMOVBreaks = this.calcMOVBreaks(
        this.visualStyleHelperService.regionalDefaultBreaks,
        this.chartDisplayState.measureOfValue
      )
      let measureOfValueBrewArray = this.visualStyleHelperService.setupMeasureOfValueBrew(
        this.currentGeoJSONOfCurrentLayer,
        this.indicatorPropertyName,
        this.envConfigService.defaultColorBrewerPaletteForGtMovValues,
        this.envConfigService.defaultColorBrewerPaletteForLtMovValues,
        this.visualStyleHelperService.classifyMethod,
        this.chartDisplayState.measureOfValue,
        this.visualStyleHelperService.manualMOVBreaks,
        this.visualStyleHelperService.regionalDefaultMOVBreaks,
        this.visualStyleHelperService.numClasses
      );
      this.gtMeasureOfValueBrew = measureOfValueBrewArray[0];
      this.ltMeasureOfValueBrew = measureOfValueBrewArray[1];
      this.propertyName = this.envConfigService.indicatorDatePrefix + date;

      layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
        style: (feature) => {

          feature = this.prepFeatureModelForMapUse(feature);

          if (this.filterHelperService.featureIsCurrentlyFiltered(feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
            return this.filteredStyle;
          }
          return this.visualStyleHelperService.styleMeasureOfValue(feature, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, true);
        },
        onEachFeature: (e, l) => { this.onEachFeatureIndicator(e, l) }
      });
    }

    this.currentIndicatorLayer = layer;

    this.broadcastService.broadcast("updateLegendDisplay", [this.currentIndicatorContainsZeroValues, this.datasetContainsNegativeValues, this.currentIndicatorContainsNoDataValues, this.containsOutliers_high, this.containsOutliers_low, this.outliers_low, this.outliers_high, this.selectionState.selectedDate]);

    // if(spatialUnitName.includes("raster") || spatialUnitName.includes("Raster") || spatialUnitName.includes("grid") || spatialUnitName.includes("Grid")){
    //   layer.style.color = undefined;
    // }



    // layer.StyledLayerControl = {
    //   removable : false,
    //   visible : true
    // };

    let layerName = indicatorMetadataAndGeoJSON.indicatorName + "_" + spatialUnitName + "_" + date;

    if (isCustomComputation) {
      layerName += " - individuelles Berechnungsergebnis";
    }

    this.layerControl.addOverlay(layer, layerName, this.indicatorLayerGroupName);
    layer.addTo(this.map);
    this.updateSearchControl();

    // justRestyling = false;

    this.fitBounds();

    if (this.containsOutliers_low || this.containsOutliers_high) {
      this.showOutlierInfoAlert = true;
    }

    this.broadcastService.broadcast("updateDiagrams", [this.currentIndicatorMetadataAndGeoJSON, this.selectionState.selectedSpatialUnit.spatialUnitLevel, this.selectionState.selectedSpatialUnit.spatialUnitId, date, this.defaultBrew, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.chartDisplayState.isMeasureOfValueChecked, this.chartDisplayState.measureOfValue, justRestyling]);
    this.broadcastService.broadcast("indicatortMapDisplayFinished");

    this.map.invalidateSize(true);
    this.hideLoadingIconOnMap();
  }

  prepFeatureModelForMapUse(feature) {
    feature.tempData = {};
    let indicatorValue = feature.properties[this.envConfigService.indicatorDatePrefix + this.date];
    if (this.indicatorValueService.indicatorValueIsNoData(indicatorValue)) {
      feature.tempData.indicatorValueText = "NoData";
    } else {
      feature.tempData.indicatorValueText = this.getIndicatorValue_asFormattedText(indicatorValue);
    }

    feature.tempData.unitText = this.selectionState.selectedIndicator.unit;

    return feature;
  }

  containsNegativeValues(geoJSON) {

    let containsNegativeValues = false;
    this.datasetContainsNegativeValues = false;
    for (let i = 0; i < geoJSON.features.length; i++) {
      if (geoJSON.features[i].properties[this.indicatorPropertyName] < 0) {
        containsNegativeValues = true;
        break;
      }
    }

    return containsNegativeValues;
  };

  onChangeSpatialUnit() {
    this.visualStyleHelperService.dynamicBrewBreaks = null;
  }

  allIndicatorPropertiesForCurrentSpatialUnitAndTime_setup_begin() {
    this.updateManualMOVBreaksFromDefaultManualBreaks();
    this.broadcastService.broadcast("restyleCurrentLayer", [false]);
  }

  restyleCurrentLayer([skipDiagramRefresh]) {
    // transparency = document.getElementById("indicatorTransparencyInput").value;
    // opacity = 1 - transparency;
    //
    // kommonitorVisualStyleHelperService.setOpacity(opacity);

    this.refreshFilteredStyle();
    this.refreshOutliersStyle();
    this.refreshNoDataStyle();

    this.defaultBrew = undefined;
    this.gtMeasureOfValueBrew = undefined;
    this.ltMeasureOfValueBrew = undefined;
    this.manualBrew = undefined;

    this.setClassifyZeroForClassifyMethod();

    let style;
    if (this.currentIndicatorLayer) {

      this.currentIndicatorMetadataAndGeoJSON = this.markOutliers(this.currentIndicatorMetadataAndGeoJSON, this.indicatorPropertyName);
      this.currentGeoJSONOfCurrentLayer = this.currentIndicatorMetadataAndGeoJSON.geoJSON;

      this.currentIndicatorContainsZeroValues = false;

      for (let i = 0; i < this.currentIndicatorMetadataAndGeoJSON.geoJSON.features.length; i++) {
        let containsZero = false;
        let containsNoData = false;
        if (this.getIndicatorValue_asNumber(this.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i].properties[this.indicatorPropertyName]) == 0) {
          this.currentIndicatorContainsZeroValues = true;
          containsZero = true;
        };

        if (this.indicatorValueService.indicatorValueIsNoData(this.currentIndicatorMetadataAndGeoJSON.geoJSON.features[i].properties[this.indicatorPropertyName])) {
          this.currentIndicatorContainsNoDataValues = true;
          containsNoData = true;
        };

        if (containsZero && containsNoData) {
          break;
        }
      }

      this.checkAvailabilityOfRegionalDefault(this.currentIndicatorMetadataAndGeoJSON);

      if (this.chartDisplayState.isMeasureOfValueChecked) {
        let measureOfValueBrewArray = this.visualStyleHelperService.setupMeasureOfValueBrew(
          this.currentGeoJSONOfCurrentLayer,
          this.indicatorPropertyName,
          this.envConfigService.defaultColorBrewerPaletteForGtMovValues,
          this.envConfigService.defaultColorBrewerPaletteForLtMovValues,
          this.visualStyleHelperService.classifyMethod,
          this.chartDisplayState.measureOfValue,
          this.visualStyleHelperService.manualMOVBreaks,
          this.visualStyleHelperService.regionalDefaultMOVBreaks,
          this.visualStyleHelperService.numClasses
        );
        this.gtMeasureOfValueBrew = measureOfValueBrewArray[0];
        this.ltMeasureOfValueBrew = measureOfValueBrewArray[1];

        if (this.visualStyleHelperService.classifyMethod == 'manual') {
          this.updateDefaultManualBreaksFromMOVManualBreaks();
        }

        this.currentIndicatorLayer.eachLayer((layer) => {
          if (this.filterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
            layer.setStyle(this.filteredStyle);
          }
          else {
            style = this.visualStyleHelperService.styleMeasureOfValue(layer.feature, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, true);

            layer.setStyle(style);
          }

        });

        // this.makeMeasureOfValueLegend();
      }
      else {

        if (this.indicatorTypeOfCurrentLayer.includes('DYNAMIC') || this.datasetContainsNegativeValues) {
          let dynamicIndicatorBrewArray = this.visualStyleHelperService.setupDynamicIndicatorBrew(
            this.currentIndicatorMetadataAndGeoJSON.geoJSON,
            this.indicatorPropertyName,
            this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
            this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
            this.visualStyleHelperService.classifyMethod,
            this.visualStyleHelperService.numClasses,
            this.visualStyleHelperService.dynamicBrewBreaks);
          this.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
          this.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];

          if (this.visualStyleHelperService.classifyMethod == "regional_default") {
            this.applyRegionalDefaultClassification(this.currentIndicatorMetadataAndGeoJSON);
          }

          this.currentIndicatorLayer.eachLayer((layer) => {
            if (this.filterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
              layer.setStyle(this.filteredStyle);
            }
            else {
              style = this.visualStyleHelperService.styleDynamicIndicator(layer.feature, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, true);

              layer.setStyle(style);
            }

          });
          // this.makeDynamicIndicatorLegend();
        }
        else {
          this.datasetContainsNegativeValues = this.containsNegativeValues(this.currentGeoJSONOfCurrentLayer);
          if (this.datasetContainsNegativeValues) {
            let dynamicIndicatorBrewArray = this.visualStyleHelperService.setupDynamicIndicatorBrew(
              this.currentIndicatorMetadataAndGeoJSON.geoJSON,
              this.indicatorPropertyName,
              this.envConfigService.defaultColorBrewerPaletteForBalanceIncreasingValues,
              this.envConfigService.defaultColorBrewerPaletteForBalanceDecreasingValues,
              this.visualStyleHelperService.classifyMethod,
              this.visualStyleHelperService.numClasses,
              this.visualStyleHelperService.dynamicBrewBreaks);
            this.dynamicIncreaseBrew = dynamicIndicatorBrewArray[0];
            this.dynamicDecreaseBrew = dynamicIndicatorBrewArray[1];
          }
          else {

            this.defaultBrew = this.visualStyleHelperService.setupDefaultBrew(
              this.currentGeoJSONOfCurrentLayer,
              this.indicatorPropertyName,
              this.visualStyleHelperService.numClasses,
              this.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
              this.visualStyleHelperService.classifyMethod);
          }

          if (this.visualStyleHelperService.classifyMethod == "regional_default") {
            this.applyRegionalDefaultClassification(this.currentIndicatorMetadataAndGeoJSON);
          }
          else if (this.visualStyleHelperService.classifyMethod == 'manual') {
            this.manualBrew = this.visualStyleHelperService.setupManualBrew(
              this.visualStyleHelperService.numClasses,
              this.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
              this.visualStyleHelperService.manualBrew.breaks);

            this.visualStyleHelperService.manualBrew = this.manualBrew;
          }

          this.currentIndicatorLayer.eachLayer((layer) => {
            let style;
            if (this.filterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
              style = this.filteredStyle;
            }
            else {
              if (this.visualStyleHelperService.classifyMethod == 'manual') {
                style = this.visualStyleHelperService.styleDefault(layer.feature, this.manualBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, this.datasetContainsNegativeValues, true);
              }
              else {
                style = this.visualStyleHelperService.styleDefault(layer.feature, this.defaultBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, this.datasetContainsNegativeValues, true);
              }
            }
            layer.setStyle(style);
          });

          this.updateManualMOVBreaksFromDefaultManualBreaks();
          // this.makeDefaultLegend(this.selectionState.selectedIndicator.defaultClassificationMapping, this.datasetContainsNegativeValues);
        }
      }

      if (this.visualStyleHelperService.classifyMethod == "regional_default"
        && this.chartDisplayState.isMeasureOfValueChecked) {
        if (this.visualStyleHelperService.regionalDefaultBreaks.length == 0) {
          this.defaultBrew = this.visualStyleHelperService.setupDefaultBrew(
            this.currentGeoJSONOfCurrentLayer,
            this.indicatorPropertyName,
            this.visualStyleHelperService.numClasses,
            this.currentIndicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
            this.visualStyleHelperService.classifyMethod);
          this.applyRegionalDefaultClassification(this.currentIndicatorMetadataAndGeoJSON);
        }
        this.visualStyleHelperService.regionalDefaultMOVBreaks = this.calcMOVBreaks(
          this.visualStyleHelperService.regionalDefaultBreaks,
          this.chartDisplayState.measureOfValue
        )
        let measureOfValueBrewArray = this.visualStyleHelperService.setupMeasureOfValueBrew(
          this.currentGeoJSONOfCurrentLayer,
          this.indicatorPropertyName,
          this.envConfigService.defaultColorBrewerPaletteForGtMovValues,
          this.envConfigService.defaultColorBrewerPaletteForLtMovValues,
          this.visualStyleHelperService.classifyMethod,
          this.chartDisplayState.measureOfValue,
          this.visualStyleHelperService.manualMOVBreaks,
          this.visualStyleHelperService.regionalDefaultMOVBreaks,
          this.visualStyleHelperService.numClasses
        );
        this.gtMeasureOfValueBrew = measureOfValueBrewArray[0];
        this.ltMeasureOfValueBrew = measureOfValueBrewArray[1];

        this.currentIndicatorLayer.eachLayer((layer) => {
          if (this.filterHelperService.featureIsCurrentlyFiltered(layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME])) {
            layer.setStyle(this.filteredStyle);
          }
          else {
            style = this.visualStyleHelperService.styleMeasureOfValue(layer.feature, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.propertyName, this.envConfigService.useTransparencyOnIndicator, true);

            layer.setStyle(style);
          }

        });
      }

      this.broadcastService.broadcast("updateLegendDisplay", [this.currentIndicatorContainsZeroValues, this.datasetContainsNegativeValues, this.currentIndicatorContainsNoDataValues, this.containsOutliers_high, this.containsOutliers_low, this.outliers_low, this.outliers_high, this.selectionState.selectedDate]);

      if (!skipDiagramRefresh) {
        let justRestyling = true;

        if (this.visualStyleHelperService.classifyMethod == 'manual') {
          this.broadcastService.broadcast("updateDiagrams", [this.currentIndicatorMetadataAndGeoJSON, this.selectionState.selectedSpatialUnit.spatialUnitLevel, this.selectionState.selectedSpatialUnit.spatialUnitId, this.date, this.manualBrew, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.chartDisplayState.isMeasureOfValueChecked, this.chartDisplayState.measureOfValue, justRestyling]);
        }
        else {
          this.broadcastService.broadcast("updateDiagrams", [this.currentIndicatorMetadataAndGeoJSON, this.selectionState.selectedSpatialUnit.spatialUnitLevel, this.selectionState.selectedSpatialUnit.spatialUnitId, this.date, this.defaultBrew, this.gtMeasureOfValueBrew, this.ltMeasureOfValueBrew, this.dynamicIncreaseBrew, this.dynamicDecreaseBrew, this.chartDisplayState.isMeasureOfValueChecked, this.chartDisplayState.measureOfValue, justRestyling]);
        }

      }

      //ensure that highlighted feature remain highlighted
      this.preserveHighlightedFeatures();
    }

    this.map.invalidateSize(true);
  }


  updateDefaultManualBreaksFromMOVManualBreaks() {
    let ltBreaks = [...this.visualStyleHelperService.manualMOVBreaks[0]];
    let gtBreaks = [...this.visualStyleHelperService.manualMOVBreaks[1]];

    ltBreaks.shift()
    gtBreaks.pop();

    if (this.indicatorTypeOfCurrentLayer.includes('DYNAMIC')
      || this.datasetContainsNegativeValues) {
      let decreaseBreaks: any[] = [];
      let increaseBreaks: any[] = [];
      gtBreaks.forEach((br) => {
        if (br < 0) {
          decreaseBreaks.push(br);
        }
        else {
          increaseBreaks.push(br);
        }
      });
      ltBreaks.forEach((br) => {
        if (br < 0) {
          decreaseBreaks.push(br);
        }
        else {
          increaseBreaks.push(br);
        }
      });
      this.visualStyleHelperService.dynamicBrewBreaks = [[...increaseBreaks], [...decreaseBreaks]];
    }

    this.visualStyleHelperService.manualBrew.breaks = [...gtBreaks, ...ltBreaks];
  };

  updateManualMOVBreaksFromDefaultManualBreaks() {
    let gtBreaks: any[] = [];
    let ltBreaks: any[] = [];
    let breaks: any[] = [];

    if (this.indicatorTypeOfCurrentLayer.includes('DYNAMIC') || this.datasetContainsNegativeValues) {
      let decreaseBreaks = this.dynamicDecreaseBrew ? this.dynamicDecreaseBrew.breaks : [];
      let increaseBreaks = this.dynamicIncreaseBrew ? this.dynamicIncreaseBrew.breaks : [];
      let breaks = [...decreaseBreaks, ...increaseBreaks]
    }
    else {
      breaks = this.visualStyleHelperService.manualBrew ? this.visualStyleHelperService.manualBrew.breaks : [];
    }
    breaks.forEach((br) => {
      if (br < this.chartDisplayState.measureOfValue) {
        gtBreaks.push(br);
      }
      else {
        ltBreaks.push(br);
      }
    });
    gtBreaks.push(this.chartDisplayState.measureOfValue);
    ltBreaks.unshift(this.chartDisplayState.measureOfValue);
    this.visualStyleHelperService.manualMOVBreaks = [];
    this.visualStyleHelperService.manualMOVBreaks[0] = ltBreaks;
    this.visualStyleHelperService.manualMOVBreaks[1] = gtBreaks;
  }

  highlightFeatureOnMap([spatialFeatureName]) {

    // console.log("highlight feature on map for featureName " + spatialFeatureName);

    if (!spatialFeatureName) {
      return;
    }
    let done = false;

    this.map.eachLayer((layer) => {
      if (!done && layer.feature) {
        if (layer.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] == spatialFeatureName) {
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

    // console.log("unhighlight feature on map for featureName " + spatialFeatureName);

    let done = false;

    this.map.eachLayer((layer) => {
      if (!done && layer.feature) {
        if (layer.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] == spatialFeatureName) {
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

    // console.log("switch highlight feature on map for featureName " + spatialFeatureName);

    let done = false;

    this.map.eachLayer((layer) => {
      if (!done && layer.feature) {
        if (layer.feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME] == spatialFeatureName) {
          this.switchHighlightFeature(layer);
          done = true;
        }
      }
    });
  }

  unselectAllFeatures() {

    this.filterHelperService.clearSelectedFeatures();
    this.broadcastService.broadcast("restyleCurrentLayer", [false]);
  }

  /*
    $scope.$on("removeAllDrawnPoints", function (event) {
  
      if ($scope.drawnPointFeatures) {
        $scope.drawnPointFeatures.clearLayers();
        $rootScope.$broadcast("onUpdateDrawnPointFeatures");
      }
    });
  
    $scope.$on("enablePointDrawTool", function (event) {
  
      // FeatureGroup is to store editable layers
      if (!$scope.drawnPointFeatures) {
        $scope.drawnPointFeatures = new L.FeatureGroup();
      }
  
      L.drawLocal = {
        edit: {
          toolbar: {
            actions: {
              save: {
                title: "Bearbeitung speichern.",
                text: "Speichern",
              },
              cancel: {
                title: "Bearbeitung verwerfen.",
                text: "Abbrechen",
              },
              clearAll: {
                title: "Alle Features entfernen.",
                text: "Alle Features entfernen",
              },
            },
            buttons: {
              edit: "Layer editieren.",
              editDisabled: "Keine Layer zum editieren vorhanden.",
              remove: "Layer entfernen.",
              removeDisabled: "Keine Layer zum entfernen vorhanden.",
            },
          },
          handlers: {
            edit: {
              tooltip: {
                text: "Bearbeitungspunkte oder Punktmarker ziehen, um Feature zu editieren.",
                subtext: "Abbrechen klicken, um Bearbeitung zu verwefen.",
              },
            },
            remove: {
              tooltip: {
                text: "Feature anklicken, um es zu entfernen",
              },
            },
          }
        },
        draw: {
          toolbar: {
            actions: {
              title: "Zeichnen abbrechen",
              text: "Abbrechen",
            },
            finish: {
              title: "Zeichnen beenden",
              text: "Beenden",
            },
            undo: {
              title: "Zuletzt gezeichneten Punkt entfernen",
              text: "Letzten Punkt entfernen",
            },
            buttons: {
              polyline: "Polylinie zeichnen",
              polygon: "Polygon zeichnen",
              rectangle: "Rechteck zeichnen",
              circle: "Kreis zeichnen",
              marker: "Punkt zeichnen",
              circlemarker: "Kreispunkt zeichnen",
            },
          },
          handlers: {
            circle: {
              tooltip: {
                start: "Klicken und halten, um Kreis zu zeichnen.",
              },
              radius: "Radius",
            },
            circlemarker: {
              tooltip: {
                start: "Klicken, um einen Punkt zu markieren.",
              },
            },
            marker: {
              tooltip: {
                start: "Klicken, um einen Punkt zu markieren.",
              },
            },
            polygon: {
              tooltip: {
                start: "Klicken, um ein Polygon zu beginnen.",
                cont: "Klicken, um das Polygon weiter zu zeichnen.",
                end: "Ersten Punkt anklicken, um Polygon zu beenden.",
              },
            },
            polyline: {
              error: "<strong>Fehler:</strong> Selbstueberschneidung!",
              tooltip: {
                start: "Klicken, um eine Polylinie zu beginnen.",
                cont: "Klicken, um die Polylinie weiter zu zeichnen.",
                end: "Letzten Punkt erneut anklicken, um Polylinie zu beenden.",
              },
            },
            rectangle: {
              tooltip: {
                start: "Klicken und halten, um Rechteck zu zeichnen.",
              },
            },
            simpleshape: {
              tooltip: {
                end: "Maus loslassen, um Zeichnung zu beenden.",
              },
            },
          }
        }
  
      };
  
      $scope.map.addLayer($scope.drawnPointFeatures);
      $scope.drawPointControl = new L.Control.Draw({
        edit: {
          featureGroup: $scope.drawnPointFeatures
        },
        draw: {
          polyline: false,
          polygon: false,
          rectangle: false,
          circle: false,
          circlemarker: false
        },
        position: 'bottomleft'
  
      });
  
      $scope.map.addControl($scope.drawPointControl);
  
      $scope.map.on(L.Draw.Event.CREATED, function (event) {
        layer = event.layer;
  
        $scope.drawnPointFeatures.addLayer(layer);
  
        $rootScope.$broadcast("onUpdateDrawnPointFeatures", $scope.drawnPointFeatures);
      });
  
      $scope.map.on(L.Draw.Event.EDITED, function (event) {
  
        $rootScope.$broadcast("onUpdateDrawnPointFeatures", $scope.drawnPointFeatures);
      });
  
      $scope.map.on(L.Draw.Event.DELETED, function (event) {
  
        $rootScope.$broadcast("onUpdateDrawnPointFeatures", $scope.drawnPointFeatures);
      });
  
    });
  
    $scope.$on("disablePointDrawTool", function (event) {
  
      try {
        $scope.drawPointControl = undefined;
        $scope.map.removeLayer($scope.drawnPointFeatures);
        $scope.map.removeControl($scope.drawPointControl);            
      }
      catch (error) {
        // kommonitorDataExchangeService.displayMapApplicationError(error);
      }
  
    });
  
    $scope.$on("zoomToGeoresourceLayer", async function (event, georesourceMetadata) {
  
      let layerName = georesourceMetadata.datasetName;
  
      let layerGroupName = undefined;
  
      if (georesourceMetadata.isPOI){
        layerGroupName = poiLayerGroupName;
      }
      else if(georesourceMetadata.isLOI){
        layerGroupName = loiLayerGroupName;
      }
      else if(georesourceMetadata.isAOI){
        layerGroupName = aoiLayerGroupName;
      } 
  
      $scope.layerControl._layers.forEach(function (layer) {
        if (layerGroupName && layer.group.name === layerGroupName && layer.name.includes(layerName + "_")) {
          $scope.map.fitBounds(layer.layer.getBounds());
        }
        else if (layer.name.includes(layerName + "_")){
          $scope.map.fitBounds(layer.layer.getBounds());
        }
      });
    });
  */

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
  };

  replaceReachabilityScenarioOnMainMap([reachabilityScenario]) {

    if (this.markerLayer) {
      this.layerControl.removeLayer(this.markerLayer);
      this.map.removeLayer(this.markerLayer);
    }
    if (this.isochroneLayer) {
      this.layerControl.removeLayer(this.isochroneLayer);
      this.map.removeLayer(this.isochroneLayer);
    }

    let poiDataset = reachabilityScenario.reachabilitySettings.selectedStartPointLayer;
    let locationsArray: any[] = [];

    poiDataset.geoJSON.features.forEach((feature: any) => {
      locationsArray.push(feature.geometry.coordinates);
    });

    this.markerLayer = this.reachabilityMapHelperService.makeIsochroneMarkerLayer(locationsArray);

    this.mapOverlayState.reachabilityScenarioOnMainMap = true;

    this.isochroneLayer = this.reachabilityMapHelperService
      .makeIsochroneLayer(
        reachabilityScenario.reachabilitySettings.selectedStartPointLayer.datasetName,
        reachabilityScenario.isochrones_dissolved,
        reachabilityScenario.reachabilitySettings.transitMode,
        reachabilityScenario.reachabilitySettings.focus,
        reachabilityScenario.reachabilitySettings.rangeArray,
        reachabilityScenario.reachabilitySettings.useMultipleStartPoints,
        reachabilityScenario.reachabilitySettings.dissolveIsochrones);

    this.layerControl.addOverlay(this.markerLayer, "Startpunkte der Isochronenberechnung - " + poiDataset.datasetName, this.reachabilityLayerGroupName);
    this.layerControl.addOverlay(this.isochroneLayer, "Erreichbarkeits-Isochronen_" + reachabilityScenario.reachabilitySettings.transitMode + "_" + poiDataset.datasetName, this.reachabilityLayerGroupName);

    this.markerLayer.addTo(this.map);
    this.isochroneLayer.addTo(this.map);

    this.map.invalidateSize(true);
    this.map.fitBounds(this.isochroneLayer.getBounds());
  }

}