import type * as L from 'leaflet';

/**
 * Types of the map layer registry: the single source of truth for which layers
 * a map shows, their visibility, opacity and order. The registry and the
 * Leaflet binding work with `LayerRegistration`; the layer panel only sees the
 * serializable `LayerEntryState` and never touches Leaflet objects.
 */

/** Stable identity '<source>:<key>', e.g. 'georesource:4711', 'wms:<id>', 'indicator'. */
export type LayerId = string;

/** Selects the adapter that knows how to fade, bound and place the Leaflet layer. */
export type LayerKind = 'raster' | 'vector' | 'marker' | 'cluster';

/** One group of the layer panel. Groups are data: the panel and registry never branch on group ids. */
export interface LayerGroupDef {
  /** Unique within its catalogue; sub group ids are prefixed with '<parent id>.', e.g. 'georesource.point'. */
  id: string;
  /** Translation key of the group title. */
  i18nKey: string;
  /** Sub groups in a fixed order; a group with children holds no entries itself. */
  children?: readonly LayerGroupDef[];
  /** Whether the user may reorder the entries of this group (default true). */
  sortable?: boolean;
  /** Upper limit of entries, e.g. 1 for the indicator. */
  maxEntries?: number;
  /** An empty group is either hidden or shown with `emptyHintI18nKey`. */
  whenEmpty?: 'hide' | 'hint';
  /** Translation key of the hint an empty group shows, telling where its layers come from. */
  emptyHintI18nKey?: string;
}

/** What a source hands to the registry instead of adding a layer to the map itself. */
export interface LayerRegistration {
  id: LayerId;
  /** Leaf group, e.g. 'georesource.point'. */
  groupId: string;
  title: string;
  /** E.g. the reference date, instead of the former '_<date>' name suffix. */
  subtitle?: string;
  kind: LayerKind;
  symbol: LayerSymbol;
  /** A ready-made layer ... */
  layer?: L.Layer;
  /** ... or one created on first show (outlines). */
  load?: () => Promise<L.Layer>;
  initial?: { visible?: boolean; opacity?: number };
  capabilities?: Partial<LayerCapabilities>;
  /** Per-layer override of the kind's adapter, e.g. the indicator's opacity. */
  adapter?: Partial<LayerAdapter>;
  info?: () => LayerInfo | Promise<LayerInfo>;
  owner?: MapLayerOwner;
}

export interface LayerCapabilities {
  opacity: boolean;
  zoomTo: boolean;
  reorder: boolean;
  remove: boolean;
  /** Feeds the feature search, replaces the hard-coded group list. */
  searchable: boolean;
}

/** Applies opacity, bounds and pane to the Leaflet layer of one layer kind. */
export interface LayerAdapter {
  /** `opacity` is a factor (0..1) on the layer's own style, not an absolute value. */
  setOpacity(layer: L.Layer, opacity: number): void;
  getBounds(layer: L.Layer): L.LatLngBounds | undefined;
  /** Moves layers that were created without a pane option, e.g. the children of leaflet-wfst. */
  assignPane?(layer: L.Layer, pane: string): void;
}

/** What the panel renders: serializable, no Leaflet objects. */
export interface LayerEntryState {
  id: LayerId;
  groupId: string;
  title: string;
  subtitle?: string;
  kind: LayerKind;
  symbol: LayerSymbol;
  visible: boolean;
  /** 0..1, factor on the layer's own style. */
  opacity: number;
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** Outside the layer's min/max zoom. */
  outOfScale: boolean;
  capabilities: LayerCapabilities;
}

/** Callbacks into the source that registered the entry. */
export interface MapLayerOwner {
  /** Removed in the panel -> deselect it in the sidebar catalogue. */
  remove?(id: LayerId): void;
  /** Recreates the layer from a snapshot (share link, saved map state). */
  restore?(entry: LayerSnapshotEntry): Promise<void>;
}

/** Persisted or shared form of the panel state, versioned. */
export interface LayerPanelSnapshot {
  version: 1;
  groupOrder: string[];
  baseLayer: { id: string | null; opacity: number };
  entries: LayerSnapshotEntry[];
}

export interface LayerSnapshotEntry {
  id: LayerId;
  visible: boolean;
  opacity: number;
  /** Position within its list. */
  index: number;
  /** E.g. the georesource date, needed to restore the layer. */
  variant?: string;
}

export type LayerSymbol =
  | { kind: 'fill'; color: string }
  | { kind: 'point'; color: string }
  | { kind: 'line'; color: string }
  | { kind: 'outline'; color: string; dashed?: boolean }
  | { kind: 'isochrone' }
  | { kind: 'service'; serviceType: 'wms' | 'wfs' };

export interface LayerInfo {
  title: string;
  /** E.g. ['Raumebene: Stadtteile', 'Stand 2024-12-31', 'Einheit: %']. */
  lines: string[];
}

export interface BaseLayerEntry {
  id: string;
  title: string;
  thumbnailUrl?: string;
  /** null = the empty base layer. */
  layer: L.Layer | null;
}
