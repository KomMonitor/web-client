import { computed, signal } from '@angular/core';
import type * as L from 'leaflet';

import { resolveLeafGroup } from './layer-group-catalog';
import type {
  BoundLayer,
  LayerCapabilities,
  LayerEntryState,
  LayerGroupDef,
  LayerId,
  LayerRegistration,
  LayerTreeNode,
  MapLayerBinding,
} from './map-layer.model';

export const DEFAULT_LAYER_CAPABILITIES: Readonly<LayerCapabilities> = {
  opacity: true,
  zoomTo: true,
  reorder: true,
  remove: false,
  searchable: false,
};

/** The Leaflet side of an entry, kept out of signals on purpose. */
interface LayerSlot {
  registration: LayerRegistration;
  /** The layer on the map side; missing until a `load`-only entry was loaded. */
  layer?: L.Layer;
}

/**
 * Single source of truth for the layers of one map: which exist, whether they
 * are visible, their opacity and order. Sources register their layers here
 * instead of adding them to the map. Every command changes the state first and
 * then calls the attached `MapLayerBinding` synchronously; before `attach()`
 * the registry only buffers. Plain class with signals, so tests and further
 * maps simply create their own instance.
 */
export class MapLayerRegistry {
  private readonly _entries = signal<readonly LayerEntryState[]>([]);
  private readonly slots = new Map<LayerId, LayerSlot>();
  private readonly panes = new Map<LayerId, string>();
  private binding?: MapLayerBinding;

  /** Groups, sub groups and entries for the panel, top to bottom. */
  readonly tree = computed<LayerTreeNode[]>(() => {
    const byGroup = new Map<string, LayerEntryState[]>();
    for (const entry of this._entries()) {
      byGroup.set(entry.groupId, [...(byGroup.get(entry.groupId) ?? []), entry]);
    }
    return this.catalog.map((group) => treeNode(group, byGroup));
  });

  private readonly visible = computed(() =>
    this.tree()
      .flatMap(treeEntries)
      .filter((entry) => entry.visible)
  );

  constructor(private readonly catalog: readonly LayerGroupDef[]) {}

  /** The current state of one entry. */
  entry(id: LayerId): LayerEntryState | undefined {
    return this._entries().find((entry) => entry.id === id);
  }

  /**
   * Visible entries top to bottom, optionally only those with the given
   * capabilities, e.g. `{ searchable: true }`. Reactive inside `computed` and `effect`.
   */
  visibleEntries(filter: Partial<LayerCapabilities> = {}): LayerEntryState[] {
    const wanted = Object.entries(filter) as [keyof LayerCapabilities, boolean][];
    return this.visible().filter((entry) =>
      wanted.every(([capability, value]) => entry.capabilities[capability] === value)
    );
  }

  /**
   * Adds a layer, or replaces the one registered under the same id: then
   * visibility, opacity and position stay and `initial` is ignored, everything
   * else is taken from the new registration.
   */
  register(registration: LayerRegistration): void {
    const { id, groupId } = registration;
    if (!resolveLeafGroup(this.catalog, groupId)) {
      throw new Error(`Layer '${id}': '${groupId}' is no leaf group of the catalogue`);
    }
    if (!registration.layer && !registration.load) {
      throw new Error(`Layer '${id}' has neither a layer nor a load function`);
    }

    const previous = this.entry(id);
    const hadLayer = !!this.slots.get(id)?.layer;
    const entry: LayerEntryState = {
      id,
      groupId,
      title: registration.title,
      subtitle: registration.subtitle,
      kind: registration.kind,
      symbol: registration.symbol,
      visible: previous?.visible ?? registration.initial?.visible ?? true,
      opacity: previous?.opacity ?? clampOpacity(registration.initial?.opacity ?? 1),
      status: registration.layer ? 'ready' : 'idle',
      outOfScale: previous?.outOfScale ?? false,
      capabilities: { ...DEFAULT_LAYER_CAPABILITIES, ...registration.capabilities },
    };
    this.slots.set(id, { registration, layer: registration.layer });
    this._entries.update((entries) =>
      previous?.groupId === groupId
        ? entries.map((existing) => (existing.id === id ? entry : existing))
        : // New entries, and entries moved to another group, start at the top of their list.
          [entry, ...entries.filter((existing) => existing.id !== id)]
    );

    if (registration.layer) {
      this.binding?.bind(this.boundLayer(entry, registration.layer));
    } else if (hadLayer) {
      this.binding?.unbind(id);
    }
  }

  unregister(id: LayerId): void {
    const slot = this.slots.get(id);
    if (!slot) {
      return;
    }
    this.slots.delete(id);
    this._entries.update((entries) => entries.filter((entry) => entry.id !== id));
    if (slot.layer) {
      this.binding?.unbind(id);
    }
  }

  /** E.g. drops every entry of a source that is no longer in its reloaded catalogue. */
  unregisterWhere(predicate: (entry: LayerEntryState) => boolean): void {
    for (const entry of this._entries().filter(predicate)) {
      this.unregister(entry.id);
    }
  }

  setVisible(id: LayerId, visible: boolean): void {
    if (this.entry(id)?.visible === visible || !this.patch(id, { visible })) {
      return;
    }
    if (this.slots.get(id)?.layer) {
      this.binding?.setVisible(id, visible);
    }
  }

  /** `value` is a factor (0..1) on the layer's own style; values outside are clamped. */
  setOpacity(id: LayerId, value: number): void {
    if (Number.isNaN(value)) {
      return;
    }
    const opacity = clampOpacity(value);
    if (this.entry(id)?.opacity === opacity || !this.patch(id, { opacity })) {
      return;
    }
    if (this.slots.get(id)?.layer) {
      this.binding?.setOpacity(id, opacity);
    }
  }

  /** Applies the opacity again, after the source restyled its layer without it. */
  reapply(id: LayerId): void {
    const entry = this.entry(id);
    if (entry && this.slots.get(id)?.layer) {
      this.binding?.setOpacity(id, entry.opacity);
    }
  }

  zoomTo(id: LayerId): void {
    if (this.slots.get(id)?.layer) {
      this.binding?.zoomTo(id);
    }
  }

  /**
   * The pane a source creates the layer of `id` in. Stable for the id, also
   * across unregistering, and safe as a CSS class name, which ids like
   * 'wfs:<title>' are not.
   */
  paneFor(id: LayerId): string {
    let pane = this.panes.get(id);
    if (!pane) {
      pane = `mapLayer${this.panes.size + 1}`;
      this.panes.set(id, pane);
    }
    return pane;
  }

  /**
   * Connects the registry to a map and binds every buffered entry. Calling it
   * again moves to the new binding, e.g. after the map component was rebuilt.
   */
  attach(binding: MapLayerBinding): void {
    this.binding = binding;
    for (const entry of this.tree().flatMap(treeEntries)) {
      const layer = this.slots.get(entry.id)?.layer;
      if (layer) {
        binding.bind(this.boundLayer(entry, layer));
      }
    }
  }

  /** Back to buffering, e.g. when the map is destroyed. */
  detach(): void {
    this.binding = undefined;
  }

  private boundLayer(entry: LayerEntryState, layer: L.Layer): BoundLayer {
    return {
      id: entry.id,
      kind: entry.kind,
      pane: this.paneFor(entry.id),
      layer,
      adapter: this.slots.get(entry.id)?.registration.adapter,
      visible: entry.visible,
      opacity: entry.opacity,
    };
  }

  /** Changes one entry; false if there is none under `id`. */
  private patch(id: LayerId, changes: Partial<LayerEntryState>): boolean {
    if (!this.slots.has(id)) {
      return false;
    }
    this._entries.update((entries) =>
      entries.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry))
    );
    return true;
  }
}

function treeNode(group: LayerGroupDef, byGroup: Map<string, LayerEntryState[]>): LayerTreeNode {
  const children = (group.children ?? []).map((child) => treeNode(child, byGroup));
  const entries = children.length ? [] : (byGroup.get(group.id) ?? []);
  const count = children.reduce((sum, child) => sum + child.count, entries.length);
  return { group, children, entries, count };
}

/** All entries of a node and its sub groups, top to bottom. */
function treeEntries(node: LayerTreeNode): LayerEntryState[] {
  return [...node.entries, ...node.children.flatMap(treeEntries)];
}

function clampOpacity(value: number): number {
  return Math.min(1, Math.max(0, value));
}
