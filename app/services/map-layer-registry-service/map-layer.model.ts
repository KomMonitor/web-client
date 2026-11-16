import type * as L from 'leaflet';

/**
 * Types of the map layer registry: the single source of truth for which layers
 * a map shows, their visibility, opacity and order. The registry and the
 * Leaflet binding work with `LayerRegistration`; the layer panel only sees the
 * serializable `LayerEntryState` and never touches Leaflet objects.
 */

/** Stable identity '<source>:<key>', e.g. 'georesource:4711', 'wms:<id>', 'indicator'. */
export type LayerId = string;

/** The kind of Leaflet layer; sources pick the matching pane options (marker shadows, cluster icons). */
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
  /**
   * ... or one created on first show. A rejection marks the entry 'error' and
   * hides it again; the source tells the user why. With both, `layer` is a
   * placeholder that is bound right away and `load` fills it (or replaces it)
   * on first show, e.g. outlines that the old layer control must list before
   * their data is there.
   */
  load?: () => Promise<L.Layer>;
  initial?: { visible?: boolean; opacity?: number };
  capabilities?: Partial<LayerCapabilities>;
  /** Per-layer override of the default adapter, e.g. WMS bounds from the capabilities. */
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

/**
 * What the binding needs to know about a Leaflet layer beyond what Leaflet
 * offers uniformly. Opacity is not part of it: the binding fades the layer's
 * own pane, which covers every kind and survives restyles.
 */
export interface LayerAdapter {
  /** Where `zoomTo` goes; undefined if the layer has no known extent. */
  getBounds(layer: L.Layer): L.LatLngBounds | undefined;
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
  status: LayerStatus;
  /** Outside the layer's min/max zoom. */
  outOfScale: boolean;
  capabilities: LayerCapabilities;
}

/**
 * 'idle': a `load`-only entry that was never shown; 'loading' / 'ready' /
 * 'error': its own loading, or what the binding reports, e.g. for tiles.
 */
export type LayerStatus = 'idle' | 'loading' | 'ready' | 'error';

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
  baseLayer: BaseLayerSelection;
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

/** Preview image of a base layer; `grayscale` asks the gallery for a CSS grayscale filter. */
export interface BaseLayerThumbnail {
  url: string;
  grayscale: boolean;
}

/** What the map hands to the registry for each configured base layer. */
export interface BaseLayerRegistration {
  /** 'base:<configured name>'. */
  id: string;
  title: string;
  /** null: the gallery shows an icon. */
  thumbnail: BaseLayerThumbnail | null;
  layer: L.Layer;
}

/** What the panel renders of a base layer: serializable, no Leaflet objects. */
export interface BaseLayerState {
  id: string;
  title: string;
  thumbnail: BaseLayerThumbnail | null;
}

/** The chosen base layer and its opacity; `id` null is the empty map. */
export interface BaseLayerSelection {
  id: string | null;
  /** 0..1, applied to the base layer itself. */
  opacity: number;
}

/** One group of `MapLayerRegistry.tree()` with its sub groups or entries, top to bottom. */
export interface LayerTreeNode {
  group: LayerGroupDef;
  children: LayerTreeNode[];
  /** Only leaf groups hold entries. */
  entries: LayerEntryState[];
  /** Entries of this group including those of its sub groups. */
  count: number;
}

/** Everything the map side needs to show one registered layer. */
export interface BoundLayer {
  id: LayerId;
  kind: LayerKind;
  /** The pane the source created the layer in, see `MapLayerRegistry.paneFor()`. */
  pane: string;
  layer: L.Layer;
  adapter?: Partial<LayerAdapter>;
  visible: boolean;
  opacity: number;
}

/**
 * Port between the registry and a concrete map. The registry first changes its
 * state and then calls the binding synchronously, so code right after a
 * command already finds the layer on the map.
 */
export interface MapLayerBinding {
  /** Takes over the layer of `layer.id`, replacing a previous one of the same id, and shows it if visible. */
  bind(layer: BoundLayer): void;
  /** Takes the layer of `id` off the map and forgets it. */
  unbind(id: LayerId): void;
  setVisible(id: LayerId, visible: boolean): void;
  /** A factor (0..1) on the layer's own style; the binding applies it to the layer's pane. */
  setOpacity(id: LayerId, opacity: number): void;
  zoomTo(id: LayerId): void;
  /** Whether the layer of `id` is bound and has a known extent, so `zoomTo` would go anywhere. */
  canZoomTo(id: LayerId): boolean;
  /**
   * All registered ids, top to bottom; the binding derives the stacking of the
   * layers from it. It includes entries whose layer is not bound yet, so the
   * binding keeps the order for layers it gets later.
   */
  setOrder(order: LayerId[]): void;
  /** The base layers to offer, in configuration order; replaces the previous ones. */
  bindBaseLayers(layers: readonly BaseLayerRegistration[]): void;
  /** Shows the base layer `id` below all other layers, or none for null. */
  showBaseLayer(id: string | null): void;
  /** Opacity (0..1) of the base layer, kept when another one is shown. */
  setBaseLayerOpacity(opacity: number): void;
}

/** Where a binding reports what it learns from the map, e.g. from tile and zoom events. */
export interface MapLayerStatusSink {
  reportStatus(id: LayerId, status: Exclude<LayerStatus, 'idle'>): void;
  /** Whether the map's zoom is outside the layer's min/max zoom. */
  reportOutOfScale(id: LayerId, outOfScale: boolean): void;
}
