import type * as L from 'leaflet';

import { MAP_LAYER_GROUPS } from 'services/map-service/map-context';

import type { LeafletLayerBinding } from './leaflet-layer-binding';
import type { BoundLayer, LayerEntryState, LayerId, MapLayerBinding } from './map-layer.model';
import type { MapLayerRegistry } from './map-layer-registry';

/** Old group names by id prefix; checked first, since one new group spans several old ones. */
const LEGACY_GROUP_BY_PREFIX: [prefix: string, group: string][] = [
  ['wms:', MAP_LAYER_GROUPS.wms],
  ['wfs:', MAP_LAYER_GROUPS.wfs],
  ['file:', MAP_LAYER_GROUPS.file],
];

const LEGACY_GROUP_BY_GROUP: Record<string, string> = {
  'georesource.point': MAP_LAYER_GROUPS.poi,
  'georesource.line': MAP_LAYER_GROUPS.loi,
  'georesource.area': MAP_LAYER_GROUPS.aoi,
  indicator: MAP_LAYER_GROUPS.indicator,
  reachability: MAP_LAYER_GROUPS.reachability,
  outline: MAP_LAYER_GROUPS.spatialUnitOutline,
};

/** Where an entry appears in the old control; undefined for entries it never had, e.g. 'search:result'. */
export function legacyGroupOf(entry: LayerEntryState): string | undefined {
  const byPrefix = LEGACY_GROUP_BY_PREFIX.find(([prefix]) => entry.id.startsWith(prefix));
  return byPrefix ? byPrefix[1] : LEGACY_GROUP_BY_GROUP[entry.groupId];
}

/** The old naming '<title>_<date>'. */
function legacyName(entry: LayerEntryState): string {
  return entry.subtitle ? `${entry.title}_${entry.subtitle}` : entry.title;
}

/**
 * Keeps the old grouped layer control in step with the registry until the new
 * panel replaces it (H1): every bound layer is listed under its old group
 * name, which the feature search still filters by, and a checkbox click turns
 * into `registry.setVisible()`. Everything else goes straight to the Leaflet
 * binding. The control's opacity slider stays unconnected.
 *
 * The control reports every add and remove of a listed layer on the map as
 * 'overlayadd' / 'overlayremove', no matter who caused it. A layer therefore
 * leaves the control before it leaves the map, or replacing it would hide the
 * entry. Changes the registry made itself come back as no-ops, since its state
 * is already set when the binding runs.
 */
export class LayerControlBridge implements MapLayerBinding {
  private readonly idsByLayer = new Map<L.Layer, LayerId>();
  private readonly layersById = new Map<LayerId, L.Layer>();

  private readonly onOverlayAdd = (event: { layer: L.Layer }) => this.toggle(event.layer, true);
  private readonly onOverlayRemove = (event: { layer: L.Layer }) => this.toggle(event.layer, false);

  constructor(
    private readonly inner: LeafletLayerBinding,
    private readonly control: any,
    private readonly map: L.Map,
    private readonly registry: MapLayerRegistry
  ) {
    map.on('overlayadd', this.onOverlayAdd);
    map.on('overlayremove', this.onOverlayRemove);
  }

  bind(layer: BoundLayer): void {
    this.unlist(layer.id);
    this.inner.bind(layer);
    const entry = this.registry.entry(layer.id);
    const group = entry && legacyGroupOf(entry);
    if (entry && group) {
      this.control.addOverlay(layer.layer, legacyName(entry), group);
      this.idsByLayer.set(layer.layer, layer.id);
      this.layersById.set(layer.id, layer.layer);
    }
  }

  unbind(id: LayerId): void {
    this.unlist(id);
    this.inner.unbind(id);
  }

  setVisible(id: LayerId, visible: boolean): void {
    this.inner.setVisible(id, visible);
  }

  setOpacity(id: LayerId, opacity: number): void {
    this.inner.setOpacity(id, opacity);
  }

  zoomTo(id: LayerId): void {
    this.inner.zoomTo(id);
  }

  setOrder(order: LayerId[]): void {
    this.inner.setOrder(order);
  }

  /** Stops listening first, so clearing the old map does not hide anything in the registry. */
  dispose(): void {
    this.map.off('overlayadd', this.onOverlayAdd);
    this.map.off('overlayremove', this.onOverlayRemove);
    this.inner.dispose();
  }

  private toggle(layer: L.Layer, visible: boolean): void {
    const id = this.idsByLayer.get(layer);
    if (id) {
      this.registry.setVisible(id, visible);
    }
  }

  private unlist(id: LayerId): void {
    const layer = this.layersById.get(id);
    if (layer) {
      this.control.removeLayer(layer);
      this.idsByLayer.delete(layer);
      this.layersById.delete(id);
    }
  }
}
