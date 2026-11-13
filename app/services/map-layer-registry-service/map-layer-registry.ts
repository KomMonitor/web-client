import { computed, signal, type WritableSignal } from '@angular/core';
import type * as L from 'leaflet';

import { resolveLeafGroup } from './layer-group-catalog';
import type {
  BoundLayer,
  LayerCapabilities,
  LayerEntryState,
  LayerGroupDef,
  LayerId,
  LayerRegistration,
  LayerStatus,
  LayerTreeNode,
  MapLayerBinding,
  MapLayerStatusSink,
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
  /**
   * The layer on the map side: missing until a `load`-only entry was loaded,
   * a placeholder until an entry with both `layer` and `load` was loaded.
   */
  layer?: L.Layer;
  /** Whether `layer` is the final one; false while a `load` is still due. */
  loaded: boolean;
  loading?: boolean;
}

/**
 * Single source of truth for the layers of one map: which exist, whether they
 * are visible, their opacity and order. Sources register their layers here
 * instead of adding them to the map. Every command changes the state first and
 * then calls the attached `MapLayerBinding` synchronously; before `attach()`
 * the registry only buffers. Plain class with signals, so tests and further
 * maps simply create their own instance.
 *
 * A slot object stands for one registration: replacing or unregistering an
 * entry drops its slot, which turns a load still running for it stale.
 */
export class MapLayerRegistry implements MapLayerStatusSink {
  /** All entries; their order within a group is their order in the panel and on the map. */
  private readonly _entries = signal<readonly LayerEntryState[]>([]);
  /** Top-level groups, top to bottom; sub groups keep the order of the catalogue. */
  private readonly _groupOrder: WritableSignal<readonly LayerGroupDef[]>;
  private readonly slots = new Map<LayerId, LayerSlot>();
  private readonly panes = new Map<LayerId, string>();
  private binding?: MapLayerBinding;
  /** The order the binding got last, so unchanged orders are not sent again. */
  private sentOrder: readonly LayerId[] = [];

  /** Groups, sub groups and entries for the panel, top to bottom. */
  readonly tree = computed<LayerTreeNode[]>(() => {
    const byGroup = new Map<string, LayerEntryState[]>();
    for (const entry of this._entries()) {
      byGroup.set(entry.groupId, [...(byGroup.get(entry.groupId) ?? []), entry]);
    }
    return this._groupOrder().map((group) => treeNode(group, byGroup));
  });

  /** All entries top to bottom, visible or not. */
  private readonly ordered = computed(() => this.tree().flatMap(treeEntries));

  /**
   * Ids of all entries top to bottom: group order, then sub groups, then the
   * position in their list. Hidden and not yet loaded entries count too, so
   * showing a layer never changes the stacking of the others.
   */
  readonly drawOrder = computed(() => this.ordered().map((entry) => entry.id));

  private readonly visible = computed(() => this.ordered().filter((entry) => entry.visible));

  constructor(private readonly catalog: readonly LayerGroupDef[]) {
    this._groupOrder = signal(catalog);
  }

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
    const group = resolveLeafGroup(this.catalog, groupId)?.leaf;
    if (!group) {
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
      opacity: previous?.opacity ?? initialOpacity(registration.initial?.opacity),
      status: registration.load ? 'idle' : 'ready',
      outOfScale: previous?.outOfScale ?? false,
      capabilities: { ...DEFAULT_LAYER_CAPABILITIES, ...registration.capabilities },
    };
    this.slots.set(id, { registration, layer: registration.layer, loaded: !registration.load });
    this._entries.update((entries) =>
      previous?.groupId === groupId
        ? entries.map((existing) => (existing.id === id ? entry : existing))
        : // New entries, and entries moved to another group, start at the top of their list.
          [entry, ...entries.filter((existing) => existing.id !== id)]
    );

    if (registration.layer) {
      // a placeholder, too, so that it can be listed before its data is there
      this.binding?.bind(this.boundLayer(entry, registration.layer));
    } else if (hadLayer) {
      this.binding?.unbind(id);
    }
    if (entry.visible) {
      this.ensureLoaded(id);
    }

    if (group.maxEntries !== undefined && previous?.groupId !== groupId) {
      // The newcomer is on top, so the oldest entries at the bottom make room.
      const overflow = this._entries()
        .filter((existing) => existing.groupId === groupId)
        .slice(group.maxEntries);
      overflow.forEach((evicted) => this.evict(evicted.id));
    }
    this.syncOrder();
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
    this.syncOrder();
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
    if (visible) {
      // The first show of an entry with `load`, or a new attempt after an error.
      this.ensureLoaded(id);
    }
  }

  /**
   * `value` is a factor (0..1) on the layer's own style, applied to its pane, so
   * sources may restyle freely; values outside are clamped.
   */
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

  /** For the binding: tile loading and errors of a bound layer. Ignored for entries without one. */
  reportStatus(id: LayerId, status: Exclude<LayerStatus, 'idle'>): void {
    if (this.slots.get(id)?.layer && this.entry(id)?.status !== status) {
      this.patch(id, { status });
    }
  }

  /** For the binding: whether the map's zoom is outside the layer's zoom range. */
  reportOutOfScale(id: LayerId, outOfScale: boolean): void {
    if (this.entry(id)?.outOfScale !== outOfScale) {
      this.patch(id, { outOfScale });
    }
  }

  zoomTo(id: LayerId): void {
    if (this.slots.get(id)?.layer) {
      this.binding?.zoomTo(id);
    }
  }

  /**
   * Moves an entry to position `toIndex` (0 = top) of its own list; it never
   * changes groups. Ignored for groups that are not sortable and for entries
   * that may not be reordered.
   */
  moveEntry(id: LayerId, toIndex: number): void {
    const entry = this.entry(id);
    if (
      !entry ||
      Number.isNaN(toIndex) ||
      !entry.capabilities.reorder ||
      resolveLeafGroup(this.catalog, entry.groupId)?.leaf.sortable === false
    ) {
      return;
    }
    const entries = this._entries();
    const from = entries.filter((other) => other.groupId === entry.groupId).indexOf(entry);
    const others = entries.filter((other) => other.id !== id);
    const list = others.filter((other) => other.groupId === entry.groupId);
    const to = clampIndex(toIndex, list.length);
    if (to === from) {
      return;
    }
    // Insert before the entry that is to follow it, or right after the last one of the list.
    const at =
      to < list.length ? others.indexOf(list[to]) : others.indexOf(list[list.length - 1]) + 1;
    this._entries.set([...others.slice(0, at), entry, ...others.slice(at)]);
    this.syncOrder();
  }

  /** Moves a top-level group to position `toIndex` (0 = top); sub groups keep their order. */
  moveGroup(groupId: string, toIndex: number): void {
    const groups = this._groupOrder();
    const from = groups.findIndex((group) => group.id === groupId);
    if (from < 0 || Number.isNaN(toIndex)) {
      return;
    }
    const to = clampIndex(toIndex, groups.length - 1);
    if (to === from) {
      return;
    }
    const others = groups.filter((group) => group.id !== groupId);
    this._groupOrder.set([...others.slice(0, to), groups[from], ...others.slice(to)]);
    this.syncOrder();
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
    for (const entry of this.ordered()) {
      const layer = this.slots.get(entry.id)?.layer;
      if (layer) {
        binding.bind(this.boundLayer(entry, layer));
      }
    }
    this.syncOrder(true);
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

  /** Starts the `load` of an entry, unless it is loaded already or loading. */
  private ensureLoaded(id: LayerId): void {
    const slot = this.slots.get(id);
    const load = slot?.registration.load;
    if (!slot || !load || slot.loaded || slot.loading) {
      return;
    }
    slot.loading = true;
    this.patch(id, { status: 'loading' });
    // The executor turns a synchronous throw of `load` into a rejection as well.
    new Promise<L.Layer>((resolve) => resolve(load())).then(
      (layer) => this.loaded(id, slot, layer),
      () => this.loadFailed(id, slot)
    );
  }

  private loaded(id: LayerId, slot: LayerSlot, layer: L.Layer): void {
    if (this.slots.get(id) !== slot) {
      return; // replaced or unregistered meanwhile
    }
    slot.loading = false;
    slot.layer = layer;
    slot.loaded = true;
    this.patch(id, { status: 'ready' });
    const entry = this.entry(id);
    if (entry) {
      // With the current state: an entry hidden meanwhile is bound hidden. A
      // placeholder that came back filled is the same layer, which the binding keeps.
      this.binding?.bind(this.boundLayer(entry, layer));
    }
  }

  /**
   * Hides the entry again, so the next show is a new attempt. The registry only
   * records the status; telling the user why is up to the source's `load`.
   */
  private loadFailed(id: LayerId, slot: LayerSlot): void {
    if (this.slots.get(id) !== slot) {
      return;
    }
    slot.loading = false;
    this.patch(id, { status: 'error', visible: false });
    if (slot.layer) {
      // a placeholder shown for the attempt goes off the map again
      this.binding?.setVisible(id, false);
    }
  }

  /** Drops an entry that lost its place; its owner deselects it in its catalogue. */
  private evict(id: LayerId): void {
    this.slots.get(id)?.registration.owner?.remove?.(id);
    // The owner normally unregisters it; make sure it is gone either way.
    this.unregister(id);
  }

  /** Hands the draw order to the binding if it changed since it was last sent. */
  private syncOrder(force = false): void {
    if (!this.binding) {
      return;
    }
    const order = this.drawOrder();
    if (!force && sameIds(order, this.sentOrder)) {
      return;
    }
    this.sentOrder = order;
    this.binding.setOrder(order);
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

function sameIds(a: readonly LayerId[], b: readonly LayerId[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/** A whole number between 0 and `max`. */
function clampIndex(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.trunc(value)));
}

/**
 * Missing or NaN means opaque: sources pass `1 - transparency`, and catalogue
 * entries may lack a transparency, which Leaflet used to ignore silently.
 */
function initialOpacity(value: number | undefined): number {
  return value === undefined || Number.isNaN(value) ? 1 : clampOpacity(value);
}

function clampOpacity(value: number): number {
  return Math.min(1, Math.max(0, value));
}
