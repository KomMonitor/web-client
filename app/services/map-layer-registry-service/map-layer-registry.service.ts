import { Injectable, InjectionToken, inject } from '@angular/core';
import type * as L from 'leaflet';

import { MAIN_MAP_LAYER_GROUPS } from './layer-group-catalog';
import { LocalStorageLayerStatePersistence } from './layer-state-persistence';
import { LeafletLayerBinding } from './leaflet-layer-binding';
import type { LayerId } from './map-layer.model';
import { MapLayerRegistry } from './map-layer-registry';

/**
 * Holds the layer registry of the main map and connects it to the Leaflet map
 * once the map component has built it. The base layer choice and the group
 * order are remembered in localStorage.
 */
@Injectable({
  providedIn: 'root',
})
export class MainMapLayersService {
  readonly registry = new MapLayerRegistry(
    MAIN_MAP_LAYER_GROUPS,
    new LocalStorageLayerStatePersistence()
  );
  private binding?: LeafletLayerBinding;

  /** Connects the registry to a newly built main map; a previous map is let go first. */
  attach(map: L.Map): void {
    this.detach();
    this.binding = new LeafletLayerBinding(map, this.registry);
    this.registry.attach(this.binding);
  }

  /** The Leaflet layer the map shows for `id`; undefined while there is no map or it is not bound. */
  layerFor(id: LayerId): L.Layer | undefined {
    return this.binding?.layerFor(id);
  }

  /** Lets go of the map, e.g. when the map component is destroyed; the registry keeps its entries. */
  detach(): void {
    this.binding?.dispose();
    this.binding = undefined;
    this.registry.detach();
  }
}

/** The registry the layer panel works with; by default the one of the main map. */
export const MAP_LAYER_REGISTRY = new InjectionToken<MapLayerRegistry>('MAP_LAYER_REGISTRY', {
  providedIn: 'root',
  factory: () => inject(MainMapLayersService).registry,
});
