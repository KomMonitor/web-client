import { Injectable, inject } from '@angular/core';
import * as turf from '@turf/turf';
import * as L from 'leaflet';
import { FeaturePopupHelperService } from 'services/feature-popup-helper-service/feature-popup-helper.service';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import {
  MAIN_MAP_LAYER_GROUPS,
  resolveLeafGroup,
} from 'services/map-layer-registry-service/layer-group-catalog';
import type {
  LayerInfo,
  LayerKind,
  LayerSymbol,
  MapLayerOwner,
} from 'services/map-layer-registry-service/map-layer.model';
import { MapContext } from 'services/map-service/map-context';
import { createMarkerClusterGroup } from 'util/leaflet-cluster';

/**
 * Puts the POI/LOI/AOI georesource layers on the main map by registering them
 * with its layer registry as 'georesource:<georesourceId>'. Adding a dataset
 * again (other date, clustering switched) replaces the layer under the same id,
 * so visibility, opacity and position stay. The catalogue hands over an
 * `owner` that deselects the dataset, which makes the layer removable in the
 * layer panel.
 */
@Injectable({
  providedIn: 'root',
})
export class GeoresourceLayerManagerService {
  private genericMapHelperService = inject(GenericMapHelperService);
  private featurePopupHelperService = inject(FeaturePopupHelperService);

  private context!: MapContext;

  initialize(context: MapContext) {
    this.context = context;
  }

  addPoiGeoresource(georesourceMetadataAndGeoJSON, date, useCluster, owner?: MapLayerOwner) {
    const pane = this.context.layers.paneFor(georesourceLayerId(georesourceMetadataAndGeoJSON));
    let markers: any = useCluster ? createMarkerClusterGroup({}, pane) : L.featureGroup();

    georesourceMetadataAndGeoJSON.geoJSON.features.forEach((poiFeature) => {
      const newMarker = this.createPoiMarker(poiFeature, georesourceMetadataAndGeoJSON, pane);
      // binds the popup and adds the marker to the group
      markers = this.genericMapHelperService.addPoiMarker(markers, newMarker);
    });

    this.register(georesourceMetadataAndGeoJSON, date, markers, owner, {
      groupId: 'georesource.point',
      kind: useCluster ? 'cluster' : 'marker',
      symbol: { kind: 'point', color: georesourceMetadataAndGeoJSON.poiMarkerColor },
    });
  }

  removePoiGeoresource(georesourceMetadataAndGeoJSON) {
    this.unregister(georesourceMetadataAndGeoJSON);
  }

  /**
   * After the catalogue was reloaded (global filter change), nothing in it is
   * selected any more, so a georesource still on the map could not be
   * deselected there. Drops them all; should the store ever keep the
   * selection across reloads, this has to keep the selected ones.
   */
  clearAfterCatalogReload() {
    this.context.layers.unregisterWhere((entry) => entry.id.startsWith('georesource:'));
  }

  /** Fits the map to the bounds of the dataset's layer, if it is registered. */
  zoomToLayer(georesourceMetadataAndGeoJSON) {
    this.context.layers.zoomTo(georesourceLayerId(georesourceMetadataAndGeoJSON));
  }

  addAoiGeoresource(georesourceMetadataAndGeoJSON, date, owner?: MapLayerOwner) {
    const color = georesourceMetadataAndGeoJSON.aoiColor;

    const layer = L.geoJSON(georesourceMetadataAndGeoJSON.geoJSON, {
      pane: this.context.layers.paneFor(georesourceLayerId(georesourceMetadataAndGeoJSON)),
      style: () => {
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

    this.register(georesourceMetadataAndGeoJSON, date, layer, owner, {
      groupId: 'georesource.area',
      kind: 'vector',
      symbol: { kind: 'fill', color },
    });
  }

  removeAoiGeoresource(georesourceMetadataAndGeoJSON) {
    this.unregister(georesourceMetadataAndGeoJSON);
  }

  addLoiGeoresource(georesourceMetadataAndGeoJSON, date, owner?: MapLayerOwner) {
    const pane = this.context.layers.paneFor(georesourceLayerId(georesourceMetadataAndGeoJSON));
    const featureGroup = L.featureGroup();

    const style = {
      color: georesourceMetadataAndGeoJSON.loiColor,
      dashArray: georesourceMetadataAndGeoJSON.loiDashArrayString,
      weight: georesourceMetadataAndGeoJSON.loiWidth || 3,
      opacity: 1,
    };

    georesourceMetadataAndGeoJSON.geoJSON.features.forEach((item) => {
      const type = item.geometry.type;
      const lines = type === 'Polygon' || type === 'MultiPolygon' ? turf.polygonToLine(item) : item;

      L.geoJSON(lines, {
        pane,
        style: style,
        onEachFeature: this.onEachFeatureGeoresource,
      }).addTo(featureGroup);
    });

    this.register(georesourceMetadataAndGeoJSON, date, featureGroup, owner, {
      groupId: 'georesource.line',
      kind: 'vector',
      symbol: { kind: 'line', color: georesourceMetadataAndGeoJSON.loiColor },
    });
  }

  removeLoiGeoresource(georesourceMetadataAndGeoJSON) {
    this.unregister(georesourceMetadataAndGeoJSON);
  }

  /** The date becomes the subtitle of the entry. */
  private register(
    georesourceMetadataAndGeoJSON,
    date: string,
    layer: L.Layer,
    owner: MapLayerOwner | undefined,
    entry: { groupId: string; kind: LayerKind; symbol: LayerSymbol }
  ) {
    // taken now: the dataset's GeoJSON is replaced when it is loaded for another date
    const details: LayerInfo = {
      items: [
        {
          labelKey: 'MAP_LAYERS.INFO.TYPE',
          valueKey: resolveLeafGroup(MAIN_MAP_LAYER_GROUPS, entry.groupId)?.leaf.i18nKey,
        },
        {
          labelKey: 'MAP_LAYERS.INFO.FEATURES',
          value: georesourceMetadataAndGeoJSON.geoJSON?.features?.length,
        },
        { labelKey: 'MAP_LAYERS.INFO.AS_OF', value: date },
        {
          labelKey: 'MAP_LAYERS.INFO.SOURCE',
          value: georesourceMetadataAndGeoJSON.metadata?.datasource,
          html: true,
        },
      ],
    };
    this.context.layers.register({
      id: georesourceLayerId(georesourceMetadataAndGeoJSON),
      title: georesourceMetadataAndGeoJSON.datasetName,
      subtitle: date,
      layer,
      capabilities: { searchable: true, remove: !!owner },
      owner,
      info: () => details,
      ...entry,
    });
    this.context.map.invalidateSize(true);
    this.context.hideLoadingIcon();
  }

  private unregister(georesourceMetadataAndGeoJSON) {
    this.context.layers.unregister(georesourceLayerId(georesourceMetadataAndGeoJSON));
    this.context.hideLoadingIcon();
  }

  private createPoiMarker(poiFeature, georesourceMetadataAndGeoJSON, pane: string) {
    return this.genericMapHelperService.createCustomMarker(
      poiFeature,
      georesourceMetadataAndGeoJSON.poiMarkerStyle,
      georesourceMetadataAndGeoJSON.poiMarkerText,
      georesourceMetadataAndGeoJSON.poiSymbolColor,
      georesourceMetadataAndGeoJSON.poiMarkerColor,
      georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name,
      georesourceMetadataAndGeoJSON,
      pane
    );
  }

  private onEachFeatureGeoresource = (feature, layer) => {
    this.featurePopupHelperService.bindFeaturePropertiesPopupOnClick(
      feature,
      layer,
      'georesourceInfoPopupContent'
    );
  };
}

/** Stable id of a georesource in the layer registry, independent of its date. */
function georesourceLayerId(georesource): string {
  return `georesource:${georesource.georesourceId}`;
}
