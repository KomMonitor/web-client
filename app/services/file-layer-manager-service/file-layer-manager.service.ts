import { Injectable, inject } from '@angular/core';
import * as L from 'leaflet';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeaturePopupHelperService } from 'services/feature-popup-helper-service/feature-popup-helper.service';
import {
  FileHelperService,
  FileUploadState,
} from 'services/file-helper-service/file-helper.service';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import { MAP_LAYER_GROUPS, MapContext } from 'services/map-service/map-context';

/**
 * Manages user-uploaded file layers on the main map
 * (map refactoring plan, Phase 3 — extracted from KommonitorMapComponent).
 */
@Injectable({
  providedIn: 'root',
})
export class FileLayerManagerService {
  private genericMapHelperService = inject(GenericMapHelperService);
  private envConfigService = inject(EnvConfigService);
  private fileHelperService = inject(FileHelperService);
  private featurePopupHelperService = inject(FeaturePopupHelperService);

  private context!: MapContext;

  initialize(context: MapContext) {
    this.context = context;
  }

  addFileLayer(dataset, opacity) {
    try {
      let fileLayer;

      if (dataset.isPOI) {
        fileLayer = L.featureGroup();

        dataset.geoJSON.features.forEach((poiFeature) => {
          // index 0 should be longitude and index 1 should be latitude
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
            this.featurePopupHelperService.bindFeaturePropertiesPopupOnClick(
              feature,
              layer,
              'fileInfoPopupContent'
            );
          },
        });
      }

      this.showFileLayer(fileLayer, dataset);
    } catch (error) {
      console.error(error);
      // deliver parse errors through the same channel as display errors — the
      // legacy FileLayerError broadcast never had a receiver, so these errors
      // silently never reached the import UI
      this.fileHelperService.setValue(FileUploadState.ERROR, [error, dataset]);
    }
  }

  adjustOpacity(dataset, opacity) {
    const layerName = dataset.datasetName;

    this.context.layerControl._layers.forEach((layer) => {
      if (layer.group.name === MAP_LAYER_GROUPS.file && layer.name.includes(layerName)) {
        const newStyle = {
          weight: 1,
          opacity: opacity,
          color: this.envConfigService.defaultBorderColor,
          dashArray: '',
          fillOpacity: opacity,
          fillColor: dataset.displayColor,
        };

        layer.layer.setStyle(newStyle);
      }
    });
  }

  adjustColor(dataset) {
    const layerName = dataset.datasetName;
    this.context.layerControl._layers.forEach((layer) => {
      if (layer.group.name === MAP_LAYER_GROUPS.file && layer.name.includes(layerName)) {
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

  removeFileLayer(dataset) {
    const layerName = dataset.datasetName;

    this.context.layerControl._layers.forEach((layer) => {
      if (layer.group.name === MAP_LAYER_GROUPS.file && layer.name.includes(layerName)) {
        this.context.layerControl.removeLayer(layer.layer);
        this.context.map.removeLayer(layer.layer);
      }
    });
  }

  private showFileLayer(fileLayer, dataset) {
    try {
      this.context.layerControl.addOverlay(fileLayer, dataset.datasetName, MAP_LAYER_GROUPS.file);
      fileLayer.addTo(this.context.map);

      this.context.map.fitBounds(fileLayer.getBounds());

      this.fileHelperService.setValue(FileUploadState.SUCCESS, dataset);

      this.context.updateSearchControl();

      this.context.map.invalidateSize(true);
    } catch (error) {
      this.fileHelperService.setValue(FileUploadState.ERROR, [error, dataset]);
    }
  }
}
