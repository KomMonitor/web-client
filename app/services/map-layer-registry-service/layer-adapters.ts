import * as L from 'leaflet';

import type { LayerAdapter } from './map-layer.model';

/**
 * Works for every layer kind: groups, GeoJSON and cluster groups report their
 * bounds, a single marker its position, tile and WMS layers only what their
 * `bounds` option says. A layer without a usable extent yields undefined.
 */
export const DEFAULT_LAYER_ADAPTER: LayerAdapter = {
  getBounds(layer: L.Layer): L.LatLngBounds | undefined {
    let bounds: L.LatLngBounds | undefined;
    if (typeof layer.getBounds === 'function') {
      bounds = layer.getBounds();
    } else if (typeof layer.getLatLng === 'function') {
      bounds = L.latLngBounds(layer.getLatLng(), layer.getLatLng());
    } else if (layer.options?.bounds) {
      bounds = L.latLngBounds(layer.options.bounds);
    }
    // An empty group reports bounds without corners.
    return bounds?.isValid() ? bounds : undefined;
  },
};

/** The default adapter with the overrides a registration brings along. */
export function resolveLayerAdapter(override?: Partial<LayerAdapter>): LayerAdapter {
  return { ...DEFAULT_LAYER_ADAPTER, ...override };
}
