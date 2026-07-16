import { Injectable, inject } from '@angular/core';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import * as L from 'leaflet';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeaturePopupHelperService } from 'services/feature-popup-helper-service/feature-popup-helper.service';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MAP_LAYER_GROUPS, MapContext } from 'services/map-service/map-context';
import { createMarkerClusterGroup } from 'util/leaflet-cluster';

/**
 * Manages the WMS/WFS layers on the main map
 * (map refactoring plan, Phase 3 — extracted from KommonitorMapComponent).
 */
@Injectable({
  providedIn: 'root',
})
export class OgcLayerManagerService {
  private envConfigService = inject(EnvConfigService);
  private genericMapHelperService = inject(GenericMapHelperService);
  private mapErrorNotificationService = inject(MapErrorNotificationService);
  private featurePopupHelperService = inject(FeaturePopupHelperService);

  private context!: MapContext;

  initialize(context: MapContext) {
    this.context = context;
  }

  addWmsLayer(dataset: WmsDataset, opacity: number) {
    const wmsLayer = L.tileLayer.wms(dataset.connectionDetails.baseUrl, {
      layers: dataset.connectionDetails.layerName,
      transparent: true,
      format: 'image/png',
      minZoom: this.envConfigService.minZoomLevel,
      maxZoom: this.envConfigService.maxZoomLevel,
      opacity: opacity,
    });

    this.context.layerControl.addOverlay(wmsLayer, dataset.title, MAP_LAYER_GROUPS.wms);
    wmsLayer.addTo(this.context.map);
    this.context.updateSearchControl();
    this.context.map.invalidateSize(true);
    this.context.hideLoadingIcon();
  }

  removeWmsLayer(dataset) {
    this.removeLayersByTitle(dataset.title);
  }

  addWfsLayer(dataset, opacity, useCluster) {
    const wfsLayerOptions = {
      url: dataset.url,
      typeNS: dataset.featureTypeNamespace,
      namespaceUri: 'http://mapserver.gis.umn.edu/mapserver',
      typeName: dataset.featureTypeName,
      geometryField: dataset.featureTypeGeometryName,
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

        this.context.map.fitBounds(wfsLayer.getBounds());

        this.context.map.invalidateSize(true);
      });

      wfsLayer.on('click', (event) => {
        const popupContent = this.featurePopupHelperService.buildFeaturePropertiesPopup(
          event.layer.feature.properties,
          'wfsInfoPopupContent'
        );

        const popup: any = L.popup();
        popup.setLatLng(event.latlng).setContent(popupContent).openOn(this.context.map);
      });
      if (poiMarkerLayer) {
        this.context.layerControl.addOverlay(poiMarkerLayer, dataset.title, MAP_LAYER_GROUPS.wfs);
        poiMarkerLayer.addTo(this.context.map);
      } else {
        this.context.layerControl.addOverlay(wfsLayer, dataset.title, MAP_LAYER_GROUPS.wfs);
        wfsLayer.addTo(this.context.map);
      }
      this.context.updateSearchControl();
    } catch (error) {
      this.mapErrorNotificationService.displayMapApplicationError(error);
    }

    this.context.hideLoadingIcon();
  }

  removeWfsLayer(dataset) {
    this.removeLayersByTitle(dataset.title);
  }

  // matches by layer name only (not by group), mirroring the legacy behavior
  private removeLayersByTitle(title: string) {
    this.context.layerControl._layers.forEach((layer) => {
      if (layer.name.includes(title)) {
        this.context.layerControl.removeLayer(layer.layer);
        this.context.map.removeLayer(layer.layer);
      }
    });
    this.context.hideLoadingIcon();
  }

  private getWfsStyle(dataset, opacity) {
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

  private getFilterEncoding(dataset) {
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
        new L.Filter.BBox(
          dataset.featureTypeGeometryName,
          this.context.map.getBounds(),
          L.CRS.EPSG3857
        )
      );
    }

    if (filterExpressions.length == 0) {
      return undefined;
    }

    if (filterExpressions.length < 2) {
      return filterExpressions;
    } else {
      return new L.Filter.And(...filterExpressions);
    }
  }
}
