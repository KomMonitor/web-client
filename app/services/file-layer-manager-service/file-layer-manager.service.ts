import { Injectable, inject } from '@angular/core';
import * as L from 'leaflet';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { FeaturePopupHelperService } from 'services/feature-popup-helper-service/feature-popup-helper.service';
import {
  FileHelperService,
  FileUploadState,
} from 'services/file-helper-service/file-helper.service';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import type {
  LayerSymbol,
  MapLayerOwner,
} from 'services/map-layer-registry-service/map-layer.model';
import { MapContext } from 'services/map-service/map-context';

/**
 * Puts user-imported files on the main map by registering them with its layer
 * registry as 'file:<datasetName>' among the temporary layers. Adding a file
 * again (e.g. another marker color) replaces the layer under the same id, so
 * visibility, opacity and position stay.
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
  /** The registered layers, for restyling them when their color changes. */
  private readonly fileLayers = new Map<string, L.Layer>();

  initialize(context: MapContext) {
    this.context = context;
  }

  /**
   * `opacity` is the start value; the registry fades the layer's pane. The
   * import list's `owner` deselects the file there, which makes the layer
   * removable in the panel; the file stays in the list.
   */
  addFileLayer(dataset, opacity, owner?: MapLayerOwner) {
    const id = fileLayerId(dataset);
    try {
      const pane = this.context.layers.paneFor(id);
      let fileLayer;
      let symbol: LayerSymbol;

      if (dataset.isPOI) {
        fileLayer = L.featureGroup();
        symbol = { kind: 'point', color: dataset.poiMarkerColor };

        dataset.geoJSON.features.forEach((poiFeature) => {
          // index 0 should be longitude and index 1 should be latitude
          const newMarker = this.genericMapHelperService.createCustomMarker(
            poiFeature,
            dataset.poiMarkerStyle,
            dataset.poiMarkerText,
            dataset.poiSymbolColor,
            dataset.poiMarkerColor,
            dataset.poiSymbolBootstrap3Name,
            dataset,
            pane
          );

          fileLayer = this.genericMapHelperService.addPoiMarker(fileLayer, newMarker);
        });
      } else {
        symbol = { kind: dataset.isLOI ? 'line' : 'fill', color: dataset.displayColor };
        fileLayer = L.geoJSON(dataset.geoJSON, {
          pane,
          style: {
            weight: 1,
            opacity: 1,
            color: this.envConfigService.defaultBorderColor,
            dashArray: '',
            fillOpacity: 1,
            fillColor: dataset.displayColor,
          },
          onEachFeature: (feature, layer) => {
            this.featurePopupHelperService.bindFeaturePropertiesPopupOnClick(
              feature,
              layer,
              'fileInfoPopupContent'
            );
          },
        });
      }

      this.context.layers.register({
        id,
        groupId: 'temporary',
        title: dataset.datasetName,
        kind: dataset.isPOI ? 'marker' : 'vector',
        symbol,
        layer: fileLayer,
        initial: { opacity },
        capabilities: { searchable: true, remove: !!owner },
        owner,
      });
      this.fileLayers.set(id, fileLayer);
      this.context.layers.zoomTo(id);

      this.fileHelperService.setValue(FileUploadState.SUCCESS, dataset);
      this.context.map.invalidateSize(true);
    } catch (error) {
      console.error(error);
      // deliver parse errors through the same channel as display errors — the
      // legacy FileLayerError broadcast never had a receiver, so these errors
      // silently never reached the import UI
      this.fileHelperService.setValue(FileUploadState.ERROR, [error, dataset]);
    }
  }

  /** Restyles the file's layer; its transparency lives on the pane and stays. */
  adjustColor(dataset) {
    (this.fileLayers.get(fileLayerId(dataset)) as L.GeoJSON | undefined)?.setStyle({
      weight: 1,
      color: this.envConfigService.defaultBorderColor,
      dashArray: '',
      fillColor: dataset.displayColor,
    });
  }

  removeFileLayer(dataset) {
    const id = fileLayerId(dataset);
    this.context.layers.unregister(id);
    this.fileLayers.delete(id);
  }
}

/** Stable id of an imported file in the layer registry; the import panel keeps names unique. */
function fileLayerId(dataset): string {
  return `file:${dataset.datasetName}`;
}
