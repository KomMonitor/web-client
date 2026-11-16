import { Injectable, Injector, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import * as L from 'leaflet';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import type { LayerInfo, MapLayerOwner } from 'services/map-layer-registry-service/map-layer.model';
import { MapContext } from 'services/map-service/map-context';

/**
 * Manages the OGC service layers on the main map: WMS through the layer
 * registry; WFS cannot be shown at the moment (see `addWfsLayer`).
 */
@Injectable({
  providedIn: 'root',
})
export class OgcLayerManagerService {
  private envConfigService = inject(EnvConfigService);
  private notificationService = inject(NotificationService);
  /** Resolves the TranslateService only for the WFS notice, so the map works without it. */
  private injector = inject(Injector);

  private context!: MapContext;

  initialize(context: MapContext) {
    this.context = context;
  }

  /**
   * Registers the WMS with the map's layer registry, which puts it on the map
   * and into the layer panel. Both catalogues (georesources and indicator
   * selection) end up here. `opacity` is the start value; the registry fades
   * the layer's pane, so the tile layer itself stays opaque. The catalogue's
   * `owner` deselects the WMS there, which makes it removable in the panel.
   */
  addWmsLayer(dataset: WmsDataset, opacity: number, owner?: MapLayerOwner) {
    const id = wmsLayerId(dataset);
    const wmsLayer = L.tileLayer.wms(dataset.connectionDetails.baseUrl, {
      layers: dataset.connectionDetails.layerName,
      transparent: true,
      format: 'image/png',
      minZoom: this.envConfigService.minZoomLevel,
      maxZoom: this.envConfigService.maxZoomLevel,
      pane: this.context.layers.paneFor(id),
    });

    const details: LayerInfo = {
      items: [
        {
          labelKey: 'MAP_LAYERS.INFO.SERVICE',
          value: (dataset.connectionDetails.serviceType ?? 'wms').toUpperCase(),
        },
        { labelKey: 'MAP_LAYERS.INFO.LAYER_NAME', value: dataset.connectionDetails.layerName },
        { labelKey: 'MAP_LAYERS.INFO.SOURCE', value: dataset.datasource, html: true },
      ],
    };
    this.context.layers.register({
      id,
      groupId: 'georesource.service',
      title: dataset.title,
      kind: 'raster',
      symbol: { kind: 'service', serviceType: 'wms' },
      layer: wmsLayer,
      initial: { opacity },
      capabilities: { remove: !!owner },
      owner,
      info: () => details,
    });
    this.context.map.invalidateSize(true);
    this.context.hideLoadingIcon();
  }

  /**
   * After the service catalogue was reloaded (global filter change), no WMS in
   * it is selected any more, so one still on the map could not be deselected
   * there. Drops them all; see GeoresourceLayerManagerService for the same.
   */
  clearWmsAfterCatalogReload() {
    this.context.layers.unregisterWhere((entry) => entry.id.startsWith('wms:'));
  }

  removeWmsLayer(dataset: WmsDataset) {
    this.context.layers.unregister(wmsLayerId(dataset));
    this.context.hideLoadingIcon();
  }

  /**
   * WFS layers cannot be shown on the main map for now: leaflet-wfst is not
   * loaded, and the former code relied on the old layer control. Choosing one
   * in the catalogue tells the user so and unticks it again; showing WFS
   * through the layer registry is still to be done.
   */
  addWfsLayer(dataset, _opacity?, _useCluster?) {
    dataset.isSelected = false;
    const translate = this.injector.get(TranslateService);
    this.notificationService.showError(translate.instant('MAP_LAYERS.WFS_UNAVAILABLE'));
    this.context?.hideLoadingIcon();
  }

  removeWfsLayer(_dataset) {
    // nothing to do: no WFS reaches the map, see addWfsLayer()
  }

  adjustWfsColor(_dataset, _opacity) {
    // nothing to do: no WFS reaches the map, see addWfsLayer()
  }
}

/** Stable id of a WMS in the layer registry, the same from both catalogues. */
function wmsLayerId(dataset: WmsDataset): string {
  return `wms:${dataset.id}`;
}
