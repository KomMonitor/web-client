import { Injectable, inject } from '@angular/core';
import * as turf from '@turf/turf';
import * as L from 'leaflet';
import { FeaturePopupHelperService } from 'services/feature-popup-helper-service/feature-popup-helper.service';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import { MAP_LAYER_GROUPS, MapContext } from 'services/map-service/map-context';
import { createMarkerClusterGroup } from 'util/leaflet-cluster';

/**
 * Manages the POI/LOI/AOI georesource layers on the main map
 * (map refactoring plan, Phase 3 — extracted from KommonitorMapComponent).
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

  addPoiGeoresource(georesourceMetadataAndGeoJSON, date, useCluster) {
    let markers: any;
    if (useCluster) {
      markers = createMarkerClusterGroup();

      georesourceMetadataAndGeoJSON.geoJSON.features.forEach((poiFeature) => {
        // index 0 should be longitude and index 1 should be latitude
        const newMarker = this.createPoiMarker(poiFeature, georesourceMetadataAndGeoJSON);
        markers.addLayer(this.genericMapHelperService.addPoiMarker(markers, newMarker));
      });
    } else {
      markers = L.featureGroup();

      georesourceMetadataAndGeoJSON.geoJSON.features.forEach((poiFeature) => {
        // index 0 should be longitude and index 1 should be latitude
        const newMarker = this.createPoiMarker(poiFeature, georesourceMetadataAndGeoJSON);
        markers = this.genericMapHelperService.addPoiMarker(markers, newMarker);
      });
    }

    this.context.layerControl.addOverlay(
      markers,
      georesourceMetadataAndGeoJSON.datasetName + '_' + date,
      MAP_LAYER_GROUPS.poi
    );
    markers.addTo(this.context.map);
    this.context.updateSearchControl();
    this.context.map.invalidateSize(true);

    this.context.hideLoadingIcon();
  }

  removePoiGeoresource(georesourceMetadataAndGeoJSON) {
    this.removeLayersByDatasetName(georesourceMetadataAndGeoJSON.datasetName);
  }

  addAoiGeoresource(georesourceMetadataAndGeoJSON, date) {
    const color = georesourceMetadataAndGeoJSON.aoiColor;

    const layer = L.geoJSON(georesourceMetadataAndGeoJSON.geoJSON, {
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

    this.context.layerControl.addOverlay(
      layer,
      georesourceMetadataAndGeoJSON.datasetName + '_' + date,
      MAP_LAYER_GROUPS.aoi
    );
    layer.addTo(this.context.map);
    this.context.updateSearchControl();

    this.context.map.invalidateSize(true);

    this.context.hideLoadingIcon();
  }

  removeAoiGeoresource(georesourceMetadataAndGeoJSON) {
    this.removeLayersByDatasetName(georesourceMetadataAndGeoJSON.datasetName);
  }

  addLoiGeoresource(georesourceMetadataAndGeoJSON, date) {
    const featureGroup = L.featureGroup();

    const style = {
      color: georesourceMetadataAndGeoJSON.loiColor,
      dashArray: georesourceMetadataAndGeoJSON.loiDashArrayString,
      weight: georesourceMetadataAndGeoJSON.loiWidth || 3,
      opacity: 1,
    };

    georesourceMetadataAndGeoJSON.geoJSON.features.forEach((item) => {
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

    this.context.layerControl.addOverlay(
      featureGroup,
      georesourceMetadataAndGeoJSON.datasetName + '_' + date,
      MAP_LAYER_GROUPS.loi
    );
    featureGroup.addTo(this.context.map);
    this.context.updateSearchControl();

    this.context.map.invalidateSize(true);
  }

  removeLoiGeoresource(georesourceMetadataAndGeoJSON) {
    this.removeLayersByDatasetName(georesourceMetadataAndGeoJSON.datasetName);
  }

  private createPoiMarker(poiFeature, georesourceMetadataAndGeoJSON) {
    return this.genericMapHelperService.createCustomMarker(
      poiFeature,
      georesourceMetadataAndGeoJSON.poiMarkerStyle,
      georesourceMetadataAndGeoJSON.poiMarkerText,
      georesourceMetadataAndGeoJSON.poiSymbolColor,
      georesourceMetadataAndGeoJSON.poiMarkerColor,
      georesourceMetadataAndGeoJSON.poiSymbolBootstrap3Name,
      georesourceMetadataAndGeoJSON
    );
  }

  // matches by layer name only (not by group), mirroring the legacy behavior
  private removeLayersByDatasetName(datasetName: string) {
    this.context.layerControl._layers.forEach((layer) => {
      if (layer.name.includes(datasetName + '_')) {
        this.context.layerControl.removeLayer(layer.layer);
        this.context.map.removeLayer(layer.layer);
        this.context.updateSearchControl();
      }
    });

    this.context.hideLoadingIcon();
  }

  private onEachFeatureGeoresource = (feature, layer) => {
    this.featurePopupHelperService.bindFeaturePropertiesPopupOnClick(
      feature,
      layer,
      'georesourceInfoPopupContent'
    );
  };
}
