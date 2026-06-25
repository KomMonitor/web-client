import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import * as turf from '@turf/turf';
import domtoimage from 'dom-to-image-more';

import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import { VisualStyleHelperServiceNew } from 'services/visual-style-helper-service/visual-style-helper.service';
import { ReachabilityScenarioHelperService } from 'services/reachability-scenario-helper-service/reachability-scenario-helper-service.service';

@Injectable({
  providedIn: 'root',
})
export class ReachabilityMapHelperService {
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);
  private dataExchangeService = inject(DataExchangeService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private genericMapHelperService = inject(GenericMapHelperService);
  private visualStyleHelperService = inject(VisualStyleHelperServiceNew);
  private reachabilityScenarioHelperService = inject(ReachabilityScenarioHelperService);
  private envConfService = inject(EnvConfigService);
  private indicatorValueService = inject(IndicatorValueService);
  private selectionState = inject(SelectionStateService);

  // Local precision-resolving wrapper (formerly the DataExchangeService facade glue, Prio7 B1).
  private getIndicatorValue_asFormattedText(indicatorValue, precision = undefined) {
    return this.indicatorValueService.getIndicatorValue_asFormattedText(
      indicatorValue,
      this.selectionState.resolveSelectedPrecision(precision)
    );
  }

  private domId_indicatorStatistics!: string;

  /* Map of mapParts for certain dom IDs
    {
      "map": mapObject,
      "layerControl": layerControl,
      "backgroundLayer": backgroundLayer,
      "geosearchControl": geosearchControl,
      "screenshoter": screenshoter,
      "isochroneLayers": {
        "markerLayer": markerLayer,
        "isochroneLayer": isochroneLayer
      },
      "poiInIsoLayers": poiInIsoLayersMap, // map object
      "indicatorStatistics": {
        "poiLayer": poiLayer, // layer with enhanced indicatorStatisticInformation
        "poiIsochroneLayer": poiIsochroneLayer, // individual isochrone of active clicked poi
        
        "indicatorLayer": indicatorLayer  // the indicator of interest on the spatial unit of interest
      }
    }
    */
  public mapPartsMap = new Map();

  getMapParts_byDomId(domId: string) {
    return this.mapPartsMap.get(domId);
  }

  initReachabilityGeoMap(domId: string) {
    let mapParts = this.mapPartsMap.get(domId);

    if (mapParts && mapParts.map) {
      this.genericMapHelperService.clearMap(mapParts.map);
    }

    mapParts = this.genericMapHelperService.initMap(
      domId,
      true,
      true,
      false,
      true,
      undefined,
      undefined
    );

    mapParts.isochroneLayers = {
      markerLayer: undefined,
      isochroneLayer: undefined,
      poiInIsoLayers: new Map(),
    };

    this.mapPartsMap.set(domId, mapParts);
    return mapParts;
  }

  invalidateMaps() {
    for (const [key] of this.mapPartsMap) {
      this.invalidateMap(key);
    }
  }

  async takeScreenshot_image(domId: string, overridedPluginOptions?: any) {
    const node: any = document.getElementById(domId);
    const options = overridedPluginOptions || {
      quality: 1.0,
      width: 400,
      height: 400,
    };

    try {
      return await domtoimage.toJpeg(node, options);
    } catch (error) {
      console.log('Error while exporting map view.');
      console.error(error);
      this.dataExchangeService.displayMapApplicationError(error);
      return undefined;
    }
  }

  invalidateMap(domId: string) {
    const mapParts = this.mapPartsMap.get(domId);
    if (mapParts && mapParts.map) {
      this.genericMapHelperService.invalidateMap(mapParts.map);
      this.zoomToIsochroneLayer(domId);
    }
  }

  zoomToIsochroneLayers() {
    for (const [key] of this.mapPartsMap) {
      this.zoomToIsochroneLayer(key);
    }
  }

  zoomToIsochroneLayer(domId: string) {
    const mapParts = this.mapPartsMap.get(domId);
    if (
      mapParts &&
      mapParts.map &&
      mapParts.isochroneLayers &&
      mapParts.isochroneLayers.isochroneLayer
    ) {
      this.genericMapHelperService.zoomToLayer(
        mapParts.map,
        mapParts.isochroneLayers.isochroneLayer
      );
    }
  }

  zoomToIndicatorLayer(domId: string) {
    const mapParts = this.mapPartsMap.get(domId);
    if (
      mapParts &&
      mapParts.map &&
      mapParts.indicatorStatistics &&
      mapParts.indicatorStatistics.indicatorLayer
    ) {
      this.genericMapHelperService.zoomToLayer(
        mapParts.map,
        mapParts.indicatorStatistics.indicatorLayer
      );
    }
  }

  zoomToIndicatorFeature(domId: string, feature: any) {
    const mapParts = this.mapPartsMap.get(domId);
    if (
      mapParts &&
      mapParts.map &&
      mapParts.indicatorStatistics &&
      mapParts.indicatorStatistics.indicatorLayer
    ) {
      for (const layerKey in mapParts.indicatorStatistics.indicatorLayer._layers) {
        if (
          Object.prototype.hasOwnProperty.call(
            mapParts.indicatorStatistics.indicatorLayer._layers,
            layerKey
          )
        ) {
          const layer = mapParts.indicatorStatistics.indicatorLayer._layers[layerKey];
          if (
            layer.feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME] ===
            feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]
          ) {
            mapParts.map.fitBounds(layer.getBounds());
            mapParts.map.invalidateSize(true);
          }
        }
      }
    }
  }

  zoomToMarkerLayer(domId: string) {
    const mapParts = this.mapPartsMap.get(domId);
    if (
      mapParts &&
      mapParts.map &&
      mapParts.isochroneLayers &&
      mapParts.isochroneLayers.markerLayer
    ) {
      this.genericMapHelperService.zoomToLayer(mapParts.map, mapParts.isochroneLayers.markerLayer);
    }
  }

  styleIsochrones(_feature: any) {
    return {
      color: 'red',
      weight: 1,
      opacity: 1,
    };
  }

  onEachFeature_isochrones(feature: any, layer: L.Layer) {
    layer.on({
      click: () => {
        let isochroneValue = layer.feature.properties.value;

        if (this.dataExchangeService.isochroneLegend.reachMode_apiValue === 'time') {
          isochroneValue /= 60; // transform seconds to minutes
        }
        const popupContent = `${isochroneValue} ${this.dataExchangeService.isochroneLegend.cutOffUnit}`;

        if (popupContent) {
          layer.bindPopup(`Isochrone: ${JSON.stringify(popupContent)}`);
        }
      },
    });
  }

  addDataLayertoSingleFeatureGeoMap(geoJSON: any, domId: string) {
    const mapParts = this.mapPartsMap.get(domId);
    if (mapParts) {
      mapParts.dataLayer = this.genericMapHelperService.addDataLayer(
        geoJSON,
        mapParts.map,
        undefined,
        '',
        this.onEachFeature_isochrones,
        undefined,
        this.styleIsochrones
      );
    }
  }

  makeIsochroneMarkerLayer(lonLatArray: number[][]): L.FeatureGroup {
    const markerLayer = L.featureGroup();
    lonLatArray.forEach((lonLat) => {
      const layer = L.marker([lonLat[1], lonLat[0]]);
      layer.bindPopup('Startpunkt der Isochronenberechnung');
      layer.addTo(markerLayer);
    });
    return markerLayer;
  }

  replaceIsochroneMarker(domId: string, lonLatArray: number[][]) {
    const mapParts = this.mapPartsMap.get(domId);

    if (
      mapParts &&
      mapParts.isochroneLayers &&
      mapParts.isochroneLayers.markerLayer &&
      mapParts.layerControl
    ) {
      mapParts.layerControl.removeLayer(mapParts.isochroneLayers.markerLayer);
      mapParts.map.removeLayer(mapParts.isochroneLayers.markerLayer);
    }

    mapParts.isochroneLayers.markerLayer = this.makeIsochroneMarkerLayer(lonLatArray);
    mapParts.layerControl.addOverlay(
      mapParts.isochroneLayers.markerLayer,
      'Startpunkte für Isochronenberechnung'
    );
    mapParts.isochroneLayers.markerLayer.addTo(mapParts.map);

    this.invalidateMap(domId);
    this.zoomToMarkerLayer(domId);

    this.mapPartsMap.set(domId, mapParts);
  }

  makeIsochroneLayer(
    datasetName: string,
    geoJSON: any,
    transitMode: string,
    reachMode: string,
    cutOffValues: number[],
    useMultipleStartPoints: boolean,
    dissolveIsochrones: boolean
  ): L.FeatureGroup {
    const isochroneLayer = L.featureGroup();

    let cutOffUnitValue = 'Meter';
    let reachModeValue = 'Distanz';
    if (reachMode === 'time') {
      cutOffUnitValue = 'Minuten';
      reachModeValue = 'Zeit';
    }

    let transitModeValue = 'Passant';
    switch (transitMode) {
      case 'buffer':
        transitModeValue = 'Puffer (Luftlinie)';
        break;
      case 'cycling-regular':
        transitModeValue = 'Fahrrad';
        break;
      case 'driving-car':
        transitModeValue = 'PKW';
        break;
      case 'wheelchair':
        transitModeValue = 'Barrierefrei';
        break;
      default:
        transitModeValue = 'Passant';
    }

    this.dataExchangeService.isochroneLegend = {
      datasetName,
      transitMode: transitModeValue,
      reachMode: reachModeValue,
      reachMode_apiValue: reachMode,
      colorValueEntries: [],
      cutOffValues,
      cutOffUnit: cutOffUnitValue,
    };

    const colors = ['green', 'yellow', 'orange', 'red', 'brown'];
    const sortedCutoffs = [...cutOffValues].sort((a, b) => a - b);
    this.dataExchangeService.isochroneLegend.colorValueEntries = sortedCutoffs
      .map((value, index) => ({
        color: colors[index % colors.length],
        value: value,
      }))
      .reverse();

    if (useMultipleStartPoints && dissolveIsochrones) {
      geoJSON = this.mergeIntersectingIsochrones(geoJSON);
    }

    geoJSON.features.sort((a: any, b: any) => a.properties.value - b.properties.value);

    for (let i = geoJSON.features.length - 1; i >= 0; i--) {
      const feature = geoJSON.features[i];
      const styleIndex = this.getStyleIndexForFeature(
        feature,
        this.dataExchangeService.isochroneLegend.colorValueEntries,
        reachMode
      );
      const style = {
        color: this.dataExchangeService.isochroneLegend.colorValueEntries[styleIndex].color,
        weight: 1,
        opacity: 0.4,
        fillOpacity: 0.3,
      };
      L.geoJSON(feature, {
        style,
        onEachFeature: (feat, layer) => this.onEachFeature_isochrones(feat, layer),
      }).addTo(isochroneLayer);
    }

    return isochroneLayer;
  }

  replaceIsochroneGeoJSON(
    domId: string,
    datasetName: string,
    geoJSON: any,
    transitMode: string,
    reachMode: string,
    cutOffValues: number[],
    useMultipleStartPoints: boolean,
    dissolveIsochrones: boolean
  ) {
    const mapParts = this.mapPartsMap.get(domId);

    if (
      mapParts &&
      mapParts.isochroneLayers &&
      mapParts.isochroneLayers.isochroneLayer &&
      mapParts.layerControl
    ) {
      mapParts.layerControl.removeLayer(mapParts.isochroneLayers.isochroneLayer);
      mapParts.map.removeLayer(mapParts.isochroneLayers.isochroneLayer);
    }

    mapParts.isochroneLayers.isochroneLayer = this.makeIsochroneLayer(
      datasetName,
      geoJSON,
      transitMode,
      reachMode,
      cutOffValues,
      useMultipleStartPoints,
      dissolveIsochrones
    );
    mapParts.layerControl.addOverlay(
      mapParts.isochroneLayers.isochroneLayer,
      `Erreichbarkeits-Isochronen_${transitMode}`
    );
    mapParts.isochroneLayers.isochroneLayer.addTo(mapParts.map);

    this.invalidateMap(domId);
    this.zoomToIsochroneLayer(domId);

    this.mapPartsMap.set(domId, mapParts);
  }

  private getStyleIndexForFeature(
    feature: any,
    colorValueEntries: any[],
    reachMode: string
  ): number {
    let featureCutOffValue = feature.properties.value;
    if (reachMode === 'time') {
      featureCutOffValue /= 60;
    }
    const entry = colorValueEntries.find((e) => e.value === parseInt(featureCutOffValue));
    return entry ? colorValueEntries.indexOf(entry) : 0;
  }

  private mergeIntersectingIsochrones(geoJSON: any): any {
    try {
      return turf.dissolve(geoJSON, { propertyName: 'value' });
    } catch (e) {
      console.error('Dissolving Isochrones failed with error: ', e);
      console.error('Will return undissolved isochrones');
      return geoJSON;
    }
  }

  removeReachabilityLayers(domId: string) {
    const mapParts = this.mapPartsMap.get(domId);
    if (mapParts) {
      this.genericMapHelperService.removeLayerFromLayerControl(
        mapParts.layerControl,
        mapParts.isochroneLayers.markerLayer
      );
      this.genericMapHelperService.removeLayerFromLayerControl(
        mapParts.layerControl,
        mapParts.isochroneLayers.isochroneLayer
      );
      this.genericMapHelperService.removeLayerFromMap(
        mapParts.map,
        mapParts.isochroneLayers.markerLayer
      );
      this.genericMapHelperService.removeLayerFromMap(
        mapParts.map,
        mapParts.isochroneLayers.isochroneLayer
      );
    }
  }

  generatePoiMarkers(
    georesourceMetadataAndGeoJSON: any,
    useCluster: boolean,
    geojsonPropName: string
  ): L.Layer {
    let markers: L.Layer;
    if (useCluster) {
      markers = (L as any).markerClusterGroup({
        iconCreateFunction: (cluster: any) => {
          const childCount = cluster.getChildCount();
          let c = 'cluster-';
          if (childCount < 10) c += 'small';
          else if (childCount < 30) c += 'medium';
          else c += 'large';
          const className = `marker-cluster ${c} awesome-marker-legend-TransparentIcon-${georesourceMetadataAndGeoJSON.poiMarkerColor}`;
          return new L.DivIcon({
            html: `<div class="awesome-marker-legend-icon-${georesourceMetadataAndGeoJSON.poiMarkerColor}"><span>${childCount}</span></div>`,
            className,
            iconSize: new L.Point(40, 40),
          });
        },
      });
    } else {
      markers = L.layerGroup();
    }

    georesourceMetadataAndGeoJSON[geojsonPropName].features.forEach((poiFeature: any) => {
      const newMarker = this.genericMapHelperService.createCustomMarker(
        poiFeature,
        georesourceMetadataAndGeoJSON.poiMarkerStyle,
        georesourceMetadataAndGeoJSON.poiMarkerText,
        georesourceMetadataAndGeoJSON.poiSymbolColor,
        georesourceMetadataAndGeoJSON.poiMarkerColor,
        georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name,
        georesourceMetadataAndGeoJSON
      );
      this.genericMapHelperService.addPoiMarker(markers, newMarker);
    });

    return markers;
  }

  addPoiGeoresourceGeoJSON_reachabilityAnalysis(
    domId: string,
    georesourceMetadataAndGeoJSON: any,
    date: string,
    useCluster: boolean
  ) {
    const mapParts = this.mapPartsMap.get(domId);

    if (
      mapParts &&
      mapParts.isochroneLayers &&
      mapParts.isochroneLayers.poiInIsoLayers &&
      mapParts.isochroneLayers.poiInIsoLayers.has(georesourceMetadataAndGeoJSON.georesourceId)
    ) {
      const layer = mapParts.isochroneLayers.poiInIsoLayers.get(
        georesourceMetadataAndGeoJSON.georesourceId
      );
      this.genericMapHelperService.removeLayerFromMap(mapParts.map, layer);
      this.genericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, layer);
    }

    const markers = this.generatePoiMarkers(
      georesourceMetadataAndGeoJSON,
      useCluster,
      'geoJSON_poiInIsochrones'
    );
    mapParts.isochroneLayers.poiInIsoLayers.set(
      georesourceMetadataAndGeoJSON.georesourceId,
      markers
    );
    mapParts.layerControl.addOverlay(
      markers,
      `${georesourceMetadataAndGeoJSON.datasetName}_${date}_inEinzugsgebiet`
    );
    markers.addTo(mapParts.map);

    this.invalidateMap(domId);
    this.zoomToIsochroneLayer(domId);

    this.mapPartsMap.set(domId, mapParts);
  }

  removePoiGeoresource_reachabilityAnalysis(domId: string, georesourceMetadataAndGeoJSON: any) {
    const mapParts = this.mapPartsMap.get(domId);

    if (
      mapParts &&
      mapParts.isochroneLayers &&
      mapParts.isochroneLayers.poiInIsoLayers &&
      mapParts.isochroneLayers.poiInIsoLayers.has(georesourceMetadataAndGeoJSON.georesourceId)
    ) {
      const layer = mapParts.isochroneLayers.poiInIsoLayers.get(
        georesourceMetadataAndGeoJSON.georesourceId
      );
      this.genericMapHelperService.removeLayerFromMap(mapParts.map, layer);
      this.genericMapHelperService.removeLayerFromLayerControl(mapParts.layerControl, layer);
    }

    this.invalidateMap(domId);
    this.zoomToIsochroneLayer(domId);

    this.mapPartsMap.set(domId, mapParts);
  }

  initReachabilityIndicatorStatisticsGeoMap(domId: string) {
    let mapParts = this.mapPartsMap.get(domId);

    if (domId !== 'leaflet_map_poi_individual_indicator_coverage') {
      this.domId_indicatorStatistics = domId;
    }

    if (mapParts && mapParts.map) {
      this.genericMapHelperService.clearMap(mapParts.map);
    }

    mapParts = this.genericMapHelperService.initMap(
      domId,
      true,
      true,
      false,
      true,
      undefined,
      undefined
    );

    mapParts.isochroneLayers = {
      markerLayer: undefined,
      isochroneLayer: undefined,
      poiInIsoLayers: new Map(),
    };
    mapParts.indicatorStatistics = {
      poiLayer: undefined,
      poiIsochroneLayer: undefined,
      indicatorLayer: undefined,
    };

    this.mapPartsMap.set(domId, mapParts);
    return mapParts;
  }

  removeOldLayers_reachabilityIndicatorStatistics(domId: string) {
    const mapParts = this.mapPartsMap.get(domId);
    if (mapParts && mapParts.indicatorStatistics) {
      if (mapParts.indicatorStatistics.poiLayer) {
        this.genericMapHelperService.removeLayerFromMap(
          mapParts.map,
          mapParts.indicatorStatistics.poiLayer
        );
        this.genericMapHelperService.removeLayerFromLayerControl(
          mapParts.layerControl,
          mapParts.indicatorStatistics.poiLayer
        );
      }
      if (mapParts.indicatorStatistics.poiIsochroneLayer) {
        this.genericMapHelperService.removeLayerFromMap(
          mapParts.map,
          mapParts.indicatorStatistics.poiIsochroneLayer
        );
        this.genericMapHelperService.removeLayerFromLayerControl(
          mapParts.layerControl,
          mapParts.indicatorStatistics.poiIsochroneLayer
        );
      }
      if (mapParts.indicatorStatistics.indicatorLayer) {
        this.genericMapHelperService.removeLayerFromMap(
          mapParts.map,
          mapParts.indicatorStatistics.indicatorLayer
        );
        this.genericMapHelperService.removeLayerFromLayerControl(
          mapParts.layerControl,
          mapParts.indicatorStatistics.indicatorLayer
        );
      }
    }
    if (mapParts && mapParts.indicatorLegendControl) {
      this.genericMapHelperService.removeControlFromMap(
        mapParts.map,
        mapParts.indicatorLegendControl
      );
    }
  }

  async fetchIndicatorForSpatialUnit(
    indicatorId: string,
    spatialUnitId: string,
    timestamp: string
  ): Promise<any> {
    const [year, month, day] = timestamp.split('-');
    const url = `${this.dataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource()}/indicators/${indicatorId}/${spatialUnitId}/${year}/${month}/${day}?${this.dataExchangeService.simplifyGeometriesParameterName}=${this.dataExchangeService.simplifyGeometries}`;
    return await lastValueFrom(this.http.get(url));
  }

  onEachFeatureIndicator(
    feature: any,
    layer: L.Layer,
    indicatorProperty: string,
    _indicatorStatisticsCandidate: any
  ) {
    const indicatorValue = feature.properties[indicatorProperty];
    const indicatorValueText = this.indicatorValueService.indicatorValueIsNoData(indicatorValue)
      ? 'NoData'
      : this.getIndicatorValue_asFormattedText(indicatorValue);
    const tooltipHtml = `<b>${feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]}</b><br/>${indicatorValueText} [${this.selectionState.selectedIndicator.unit}]`;
    layer.bindTooltip(tooltipHtml, { sticky: false });
  }

  async generateIndicatorLayer(
    indicatorMetadataAndGeoJSON: any,
    indicatorPropertyName: string,
    defaultBrew: any,
    indicatorStatisticsCandidate: any
  ): Promise<L.GeoJSON> {
    const outlierDetection_currentGLobalValue = this.envConfService.useOutlierDetectionOnIndicator;
    this.envConfService.useOutlierDetectionOnIndicator = false;
    const layer = L.geoJSON(indicatorMetadataAndGeoJSON.geoJSON, {
      style: (feature) =>
        this.visualStyleHelperService.styleDefault(
          feature,
          defaultBrew,
          undefined,
          undefined,
          indicatorPropertyName,
          true,
          false,
          true
        ),
      onEachFeature: (feature, layer) =>
        this.onEachFeatureIndicator(
          feature,
          layer,
          indicatorPropertyName,
          indicatorStatisticsCandidate
        ),
    });
    this.envConfService.useOutlierDetectionOnIndicator = outlierDetection_currentGLobalValue;
    return layer;
  }

  async setupIndicator(indicatorStatisticsCandidate: any) {
    const { indicatorId } = indicatorStatisticsCandidate.indicator;
    const { spatialUnitId } = indicatorStatisticsCandidate.spatialUnit;
    const { timestamp } = indicatorStatisticsCandidate;
    const indicatorMetadataAndGeoJSON =
      this.indicatorStore.getIndicatorMetadataById(indicatorId);
    indicatorMetadataAndGeoJSON.geoJSON = await this.fetchIndicatorForSpatialUnit(
      indicatorId,
      spatialUnitId,
      timestamp
    );
    indicatorStatisticsCandidate.indicator.geoJSON = indicatorMetadataAndGeoJSON.geoJSON;
    return indicatorMetadataAndGeoJSON;
  }

  getMapsParts_byDomId(domId: string) {
    return this.mapPartsMap.get(domId);
  }

  async replaceReachabilityIndicatorStatisticsOnMap(
    domId: string,
    poiDataset: any,
    original_nonDissolved_isochrones: any,
    indicatorStatisticsCandidate: any
  ) {
    const mapParts = this.mapPartsMap.get(domId);
    this.removeOldLayers_reachabilityIndicatorStatistics(domId);

    const indicatorMetadataAndGeoJSON = await this.setupIndicator(indicatorStatisticsCandidate);
    const { timestamp } = indicatorStatisticsCandidate;
    const indicatorPropertyName = this.envConfigService.indicatorDatePrefix + timestamp;

    this.visualStyleHelperService.backupCurrentBrewObjects_forMainMapIndicator();
    const defaultBrew = this.visualStyleHelperService.setupDefaultBrew(
      indicatorMetadataAndGeoJSON.geoJSON,
      indicatorPropertyName,
      indicatorMetadataAndGeoJSON.defaultClassificationMapping.numClasses,
      indicatorMetadataAndGeoJSON.defaultClassificationMapping.colorBrewerSchemeName,
      this.visualStyleHelperService.classifyMethod,
      true,
      indicatorMetadataAndGeoJSON
    );

    const indicatorLayer = await this.generateIndicatorLayer(
      indicatorMetadataAndGeoJSON,
      indicatorPropertyName,
      defaultBrew,
      indicatorStatisticsCandidate
    );
    const indicatorLegendControl = this.generateIndicatorLegend(defaultBrew);
    indicatorLegendControl.addTo(mapParts.map);
    mapParts.indicatorLegendControl = indicatorLegendControl;

    const poiLayer = this.generatePoiLayerForIndicatorStatistic(
      poiDataset,
      original_nonDissolved_isochrones,
      indicatorStatisticsCandidate
    );

    mapParts.indicatorStatistics.poiLayer = poiLayer;
    mapParts.indicatorStatistics.indicatorLayer = indicatorLayer;

    mapParts.layerControl.addOverlay(poiLayer, poiDataset.datasetName);
    poiLayer.addTo(mapParts.map);

    mapParts.layerControl.addOverlay(
      indicatorLayer,
      `${indicatorStatisticsCandidate.indicator.indicatorName} [${indicatorStatisticsCandidate.indicator.unit}]`
    );
    indicatorLayer.addTo(mapParts.map);

    if (
      mapParts &&
      mapParts.isochroneLayers &&
      mapParts.isochroneLayers.isochroneLayer &&
      mapParts.layerControl
    ) {
      mapParts.map.removeLayer(mapParts.isochroneLayers.isochroneLayer);
      mapParts.isochroneLayers.isochroneLayer.addTo(mapParts.map);
    }

    this.invalidateMap(domId);
    this.mapPartsMap.set(domId, mapParts);
    this.visualStyleHelperService.resetCurrentBrewObjects_forMainMapIndicator();
  }

  generateIndicatorLegend(defaultBrew: any): L.Control {
    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
      const grades = defaultBrew.breaks.map((b: number) =>
        this.getIndicatorValue_asFormattedText(b)
      );
      const div = L.DomUtil.create('div', 'reachabilityIndicatorInfo reachabilityIndicatorLegend');
      for (let i = 0; i < defaultBrew.colors.length; i++) {
        div.innerHTML += `<i style="background:${defaultBrew.colors[i]}"></i> ${grades[i]}${grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+'}`;
      }
      return div;
    };
    return legend;
  }

  getIndicatorFeature_forSpatialUnitFeatureId(
    indicatorGeoJSON: any,
    spatialUnitFeatureId: string
  ): any {
    return indicatorGeoJSON.features.find(
      (feature: any) =>
        feature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME] === spatialUnitFeatureId
    );
  }

  generatePoiPopupContent(poiFeature: any, indicatorStatisticsCandidate: any): string {
    let html = `<div style='max-height: 30vh; overflow:auto;'><h3>${poiFeature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]}</h3>`;

    poiFeature.properties.individualIsochronePruneResults.sort((a: any, b: any) => {
      const range_a = Number(a.poiFeatureId.split('_').pop());
      const range_b = Number(b.poiFeatureId.split('_').pop());
      return range_a - range_b;
    });

    for (const isochronePruneResult of poiFeature.properties.individualIsochronePruneResults) {
      const range = isochronePruneResult.poiFeatureId.split('_').pop();
      const unit =
        this.reachabilityScenarioHelperService.tmpActiveScenario.reachabilitySettings.focus ===
        'distance'
          ? 'Meter'
          : 'Minuten';
      html += `<h4>${range} [${unit}]</h4><h4><i>Gesamtgebiet</i></h4>`;
      html += `<i>${this.getIndicatorValue_asFormattedText(isochronePruneResult.overallCoverage[0].absoluteCoverage)} von ${this.getIndicatorValue_asFormattedText(indicatorStatisticsCandidate.coverageResult.timeseries[0].value)} [${indicatorStatisticsCandidate.indicator.unit}]</i><br/>`;
      html += `entspricht <i>${this.getIndicatorValue_asFormattedText(isochronePruneResult.overallCoverage[0].relativeCoverage * 100)} [%]</i><br/><br/>`;

      for (const spatialUnitCoverageEntry of isochronePruneResult.spatialUnitCoverage) {
        const indicatorFeature = this.getIndicatorFeature_forSpatialUnitFeatureId(
          indicatorStatisticsCandidate.indicator.geoJSON,
          spatialUnitCoverageEntry.spatialUnitFeatureId
        );
        html += `<h4><i>${indicatorFeature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]}</i></h4>`;
        html += `<i>${this.getIndicatorValue_asFormattedText(spatialUnitCoverageEntry.coverage[0].absoluteCoverage)} von ${this.getIndicatorValue_asFormattedText(indicatorFeature.properties[this.envConfigService.indicatorDatePrefix + indicatorStatisticsCandidate.timestamp])} [${indicatorStatisticsCandidate.indicator.unit}]</i><br/>`;
        html += `entspricht <i>${this.getIndicatorValue_asFormattedText(spatialUnitCoverageEntry.coverage[0].relativeCoverage * 100)} [%]</i><br/><br/>`;
      }
      html += '<br/><hr><br/>';
    }
    html += '</div>';
    return html;
  }

  onClickPoiMarker_indicatorStatistics(event: L.LeafletEvent) {
    this.removeSinglePoiIsochroneLayer(this.domId_indicatorStatistics);
    const feature = (event.target as any).feature;
    const poiIsochroneLayer = this.generateSinglePoiIsochroneLayer(feature);
    this.addSinglePoiIsochroneLayer(
      this.domId_indicatorStatistics,
      feature,
      poiIsochroneLayer,
      false
    );
  }

  removeSinglePoiIsochroneLayer(domId: string) {
    const mapParts = this.mapPartsMap.get(domId);
    if (
      mapParts &&
      mapParts.indicatorStatistics &&
      mapParts.indicatorStatistics.poiIsochroneLayer &&
      mapParts.layerControl
    ) {
      mapParts.layerControl.removeLayer(mapParts.indicatorStatistics.poiIsochroneLayer);
      mapParts.map.removeLayer(mapParts.indicatorStatistics.poiIsochroneLayer);
    }
    this.mapPartsMap.set(domId, mapParts);
  }

  addSinglePoiIsochroneLayer(
    domId: string,
    feature: any,
    poiIsochroneLayer: L.FeatureGroup,
    zoomToLayer: boolean
  ) {
    const mapParts = this.mapPartsMap.get(domId);
    mapParts.indicatorStatistics.poiIsochroneLayer = poiIsochroneLayer;
    mapParts.layerControl.addOverlay(
      mapParts.indicatorStatistics.poiIsochroneLayer,
      `Isochronen um Punkt '${feature.properties[this.envConfigService.FEATURE_NAME_PROPERTY_NAME]}'`
    );
    mapParts.indicatorStatistics.poiIsochroneLayer.addTo(mapParts.map);

    if (zoomToLayer) {
      mapParts.map.fitBounds(mapParts.indicatorStatistics.poiIsochroneLayer.getBounds());
    }

    this.invalidateMap(domId);
    this.mapPartsMap.set(domId, mapParts);
  }

  generateSinglePoiIsochroneLayer(feature: any): L.FeatureGroup {
    const poiIsochroneLayer = L.featureGroup();
    const isochrones = feature.properties.individualIsochrones;
    isochrones.sort((a: any, b: any) => a.properties.value - b.properties.value);

    for (let i = isochrones.length - 1; i >= 0; i--) {
      const styleIndex = this.getStyleIndexForFeature(
        isochrones[i],
        this.dataExchangeService.isochroneLegend.colorValueEntries,
        this.dataExchangeService.isochroneLegend.reachMode_apiValue
      );
      const style = {
        color: this.dataExchangeService.isochroneLegend.colorValueEntries[styleIndex].color,
        weight: 1,
        opacity: 0.4,
        fillOpacity: 0.3,
      };
      L.geoJSON(isochrones[i], {
        style,
        onEachFeature: (feat, layer) => this.onEachFeature_isochrones(feat, layer),
      }).addTo(poiIsochroneLayer);
    }
    return poiIsochroneLayer;
  }

  generatePoiMarkers_indicatorStatistics(
    poiDataset: any,
    indicatorStatisticsCandidate: any
  ): L.Layer {
    const markers = this.generatePoiMarkers(poiDataset, false, 'geoJSON_reachability');
    (markers as L.LayerGroup).eachLayer((marker: any) => {
      const feature = marker.feature;
      const popupContent = this.generatePoiPopupContent(feature, indicatorStatisticsCandidate);
      marker.bindPopup(popupContent);
      marker.on('click', (e: L.LeafletEvent) => this.onClickPoiMarker_indicatorStatistics(e));
    });
    return markers;
  }

  generatePoiLayerForIndicatorStatistic(
    poiDataset: any,
    original_nonDissolved_isochrones: any,
    indicatorStatisticsCandidate: any
  ): L.Layer {
    let poiMap = this.initPoiMap(poiDataset.geoJSON_reachability);
    poiMap = this.attachIndividualIsochronesToPOIs(poiMap, original_nonDissolved_isochrones);
    poiMap = this.attachIndividualIsochronePruneResultsToPOIs(
      poiMap,
      indicatorStatisticsCandidate.coverageResult
    );
    poiDataset.geoJSON_reachability.features = Array.from(poiMap.values());
    return this.generatePoiMarkers_indicatorStatistics(poiDataset, indicatorStatisticsCandidate);
  }

  initPoiMap(poiGeoJSON: any): Map<string, any> {
    const poiMap = new Map<string, any>();
    for (const poiFeature of poiGeoJSON.features) {
      delete poiFeature.properties.individualIsochrones;
      delete poiFeature.properties.individualIsochronePruneResults;
      poiMap.set(
        `${poiFeature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME]}`,
        poiFeature
      );
    }
    return poiMap;
  }

  attachIndividualIsochronesToPOIs(
    poiMap: Map<string, any>,
    original_nonDissolved_isochrones: any
  ): Map<string, any> {
    for (const isochroneFeature of original_nonDissolved_isochrones.features) {
      const poiFeatureID = isochroneFeature.properties[
        this.envConfigService.FEATURE_ID_PROPERTY_NAME
      ].substring(
        0,
        isochroneFeature.properties[this.envConfigService.FEATURE_ID_PROPERTY_NAME].lastIndexOf('_')
      );
      const poiFeature = poiMap.get(poiFeatureID);
      if (poiFeature) {
        if (!poiFeature.properties.individualIsochrones) {
          poiFeature.properties.individualIsochrones = [];
        }
        poiFeature.properties.individualIsochrones.push(isochroneFeature);
        poiMap.set(poiFeatureID, poiFeature);
      }
    }
    return poiMap;
  }

  attachIndividualIsochronePruneResultsToPOIs(
    poiMap: Map<string, any>,
    isochronePruneResults: any
  ): Map<string, any> {
    for (const [key, value] of poiMap) {
      value.properties.individualIsochronePruneResults = [];
      poiMap.set(key, value);
    }

    for (const poiCoverage_foreach_range of isochronePruneResults.poiCoverage) {
      const poiFeatureID = poiCoverage_foreach_range.poiFeatureId.substring(
        0,
        poiCoverage_foreach_range.poiFeatureId.lastIndexOf('_')
      );
      const poiFeature = poiMap.get(poiFeatureID);
      if (poiFeature) {
        if (!poiFeature.properties.individualIsochronePruneResults) {
          poiFeature.properties.individualIsochronePruneResults = [];
        }
        poiFeature.properties.individualIsochronePruneResults.push(poiCoverage_foreach_range);
        poiMap.set(poiFeatureID, poiFeature);
      }
    }
    return poiMap;
  }
}
