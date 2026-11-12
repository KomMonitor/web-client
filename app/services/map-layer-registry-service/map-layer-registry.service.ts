import { Injectable, InjectionToken, inject } from '@angular/core';
import type * as L from 'leaflet';

import { MAIN_MAP_LAYER_GROUPS } from './layer-group-catalog';
import { LayerControlBridge } from './layer-control-bridge';
import { LeafletLayerBinding } from './leaflet-layer-binding';
import { MapLayerRegistry } from './map-layer-registry';

/**
 * Holds the layer registry of the main map and connects it to the Leaflet map
 * once the map component has built it. Until the old layer control goes (H1),
 * a bridge keeps that control in step.
 */
@Injectable({
  providedIn: 'root',
})
export class MainMapLayersService {
  readonly registry = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
  private bridge?: LayerControlBridge;

  /** Connects the registry to a newly built main map; a previous map is let go first. */
  attach(map: L.Map, layerControl: any): void {
    this.detach();
    this.bridge = new LayerControlBridge(
      new LeafletLayerBinding(map, this.registry),
      layerControl,
      map,
      this.registry
    );
    this.registry.attach(this.bridge);
  }

  /** Lets go of the map, e.g. when the map component is destroyed; the registry keeps its entries. */
  detach(): void {
    this.bridge?.dispose();
    this.bridge = undefined;
    this.registry.detach();
  }
}

/** The registry the layer panel works with; by default the one of the main map. */
export const MAP_LAYER_REGISTRY = new InjectionToken<MapLayerRegistry>('MAP_LAYER_REGISTRY', {
  providedIn: 'root',
  factory: () => inject(MainMapLayersService).registry,
});
