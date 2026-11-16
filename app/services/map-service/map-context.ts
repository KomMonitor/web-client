import type { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';

/**
 * Narrow handle on the main Leaflet map that KommonitorMapComponent passes to
 * the layer manager services (map refactoring plan, Phase 3). The Leaflet
 * instance itself stays encapsulated in the component — managers only receive
 * this context object and must not hand it on.
 */
export interface MapContext {
  /** The Leaflet map instance of the main map. */
  map: any;
  /** The layer registry of the main map: sources register their layers here. */
  layers: MapLayerRegistry;
  /** Hides the map loading spinner. */
  hideLoadingIcon(): void;
}
