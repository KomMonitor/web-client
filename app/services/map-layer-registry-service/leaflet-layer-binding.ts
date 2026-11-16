import type * as L from 'leaflet';

import { resolveLayerAdapter } from './layer-adapters';
import type {
  BaseLayerRegistration,
  BoundLayer,
  LayerAdapter,
  LayerId,
  MapLayerBinding,
  MapLayerStatusSink,
} from './map-layer.model';

/** z-index of the topmost layer pane: below overlayPane (400), markerPane (600) and the rest. */
const TOP_Z_INDEX = 390;
/** Lowest z-index, still above the base layer in tilePane (200). */
const BOTTOM_Z_INDEX = 210;
/** Keeps zoomTo from diving to the highest level for a single point. */
const ZOOM_TO_MAX_ZOOM = 17;

interface Bound {
  layer: L.Layer;
  pane: HTMLElement;
  adapter?: Partial<LayerAdapter>;
  visible: boolean;
  /** Unhooks the status handlers from the layer. */
  release(): void;
}

/**
 * Puts the layers of a `MapLayerRegistry` on a Leaflet map. Every layer gets
 * its own pane: the registry's draw order becomes the panes' z-indexes and its
 * opacity the pane's CSS opacity, which fades every kind of layer alike and
 * survives restyles. Tile events and the zoom range flow back as status. The
 * base layer stays in Leaflet's tilePane below them all and is faded itself.
 */
export class LeafletLayerBinding implements MapLayerBinding {
  private readonly bound = new Map<LayerId, Bound>();
  private order: readonly LayerId[] = [];
  private baseLayers = new Map<string, L.Layer>();
  /** The base layer on the map, if any. */
  private baseLayer?: L.Layer;
  private baseLayerOpacity = 1;
  /** Zoom range of all base layers on offer, for the map without a base layer. */
  private baseZoomRange: { min?: number; max?: number } = {};
  private readonly onZoomEnd = () => this.bound.forEach((_, id) => this.reportScale(id));

  constructor(
    private readonly map: L.Map,
    private readonly sink: MapLayerStatusSink
  ) {
    map.on('zoomend', this.onZoomEnd);
  }

  /** Takes every layer off the map and stops listening, e.g. before the map is rebuilt. */
  dispose(): void {
    this.map.off('zoomend', this.onZoomEnd);
    [...this.bound.keys()].forEach((id) => this.unbind(id));
    this.showBaseLayer(null);
  }

  bind(layer: BoundLayer): void {
    const previous = this.bound.get(layer.id);
    if (previous && previous.layer !== layer.layer) {
      this.map.removeLayer(previous.layer);
    }
    previous?.release();

    const pane = this.map.getPane(layer.pane) ?? this.map.createPane(layer.pane);
    pane.style.zIndex = String(this.zIndexFor(layer.id));
    applyOpacity(pane, layer.opacity);
    this.bound.set(layer.id, {
      layer: layer.layer,
      pane,
      adapter: layer.adapter,
      visible: layer.visible,
      release: this.watchStatus(layer.id, layer.layer),
    });
    this.show(layer.layer, layer.visible);
    this.reportScale(layer.id);
  }

  unbind(id: LayerId): void {
    const bound = this.bound.get(id);
    if (!bound) {
      return;
    }
    // The pane stays: the registry hands the same pane name out again for this id.
    this.map.removeLayer(bound.layer);
    bound.release();
    this.bound.delete(id);
  }

  setVisible(id: LayerId, visible: boolean): void {
    const bound = this.bound.get(id);
    if (bound) {
      bound.visible = visible;
      this.show(bound.layer, visible);
    }
  }

  setOpacity(id: LayerId, opacity: number): void {
    const bound = this.bound.get(id);
    if (bound) {
      applyOpacity(bound.pane, opacity);
    }
  }

  zoomTo(id: LayerId): void {
    const bounds = this.boundsOf(id);
    if (bounds) {
      this.map.fitBounds(bounds, { maxZoom: ZOOM_TO_MAX_ZOOM });
    }
  }

  canZoomTo(id: LayerId): boolean {
    return !!this.boundsOf(id);
  }

  /** The Leaflet layer bound under `id`, for code that needs the layer itself (feature search). */
  layerFor(id: LayerId): L.Layer | undefined {
    return this.bound.get(id)?.layer;
  }

  setOrder(order: LayerId[]): void {
    this.order = [...order];
    this.bound.forEach((bound, id) => (bound.pane.style.zIndex = String(this.zIndexFor(id))));
  }

  bindBaseLayers(layers: readonly BaseLayerRegistration[]): void {
    this.baseLayers = new Map(layers.map((base) => [base.id, base.layer]));
    const options = layers.map((base) => base.layer.options ?? {});
    this.baseZoomRange = {
      min: extreme(
        Math.min,
        options.map((option) => option.minZoom)
      ),
      max: extreme(
        Math.max,
        options.map((option) => option.maxZoom)
      ),
    };
  }

  /**
   * Leaflet derives the zoom range of the map from its layers, and marker
   * clusters fail without one. A base layer brings it along; without one, the
   * map is held to the range of all base layers on offer.
   */
  showBaseLayer(id: string | null): void {
    const next = id === null ? undefined : this.baseLayers.get(id);
    if (!next) {
      this.map.setMinZoom(this.baseZoomRange.min);
      this.map.setMaxZoom(this.baseZoomRange.max);
    }
    if (this.baseLayer && this.baseLayer !== next) {
      this.map.removeLayer(this.baseLayer);
    }
    this.baseLayer = next;
    if (next) {
      setLayerOpacity(next, this.baseLayerOpacity);
      // Back to the range of the layers; clearing it first lets Leaflet clamp the zoom on add.
      this.map.setMinZoom(undefined);
      this.map.setMaxZoom(undefined);
      if (!this.map.hasLayer(next)) {
        this.map.addLayer(next);
      }
      this.clampZoom();
    }
  }

  setBaseLayerOpacity(opacity: number): void {
    this.baseLayerOpacity = opacity;
    if (this.baseLayer) {
      setLayerOpacity(this.baseLayer, opacity);
    }
  }

  /**
   * Keeps the zoom within the new base layer's range, should Leaflet not have
   * clamped it, e.g. when the layer was on the map before the range was cleared.
   */
  private clampZoom(): void {
    const zoom = this.map.getZoom();
    const clamped = Math.min(Math.max(zoom, this.map.getMinZoom()), this.map.getMaxZoom());
    if (clamped !== zoom) {
      this.map.setZoom(clamped);
    }
  }

  private boundsOf(id: LayerId): L.LatLngBounds | undefined {
    const bound = this.bound.get(id);
    return bound && resolveLayerAdapter(bound.adapter).getBounds(bound.layer);
  }

  /** Ids without a place in the order yet go to the bottom; Leaflet's CSS would put them at 400. */
  private zIndexFor(id: LayerId): number {
    const index = this.order.indexOf(id);
    return index < 0 ? BOTTOM_Z_INDEX : Math.max(TOP_Z_INDEX - index, BOTTOM_Z_INDEX);
  }

  private show(layer: L.Layer, visible: boolean): void {
    if (visible && !this.map.hasLayer(layer)) {
      this.map.addLayer(layer);
    } else if (!visible && this.map.hasLayer(layer)) {
      this.map.removeLayer(layer);
    }
  }

  /**
   * Turns the tile events of grid layers (WMS, tiles) into a status; other
   * layers do not fire them. Leaflet fires 'load' after the last tile even if
   * some failed, so a failed tile is remembered until the next 'loading'.
   */
  private watchStatus(id: LayerId, layer: L.Layer): () => void {
    let failed = false;
    const handlers = {
      loading: () => {
        failed = false;
        this.sink.reportStatus(id, 'loading');
      },
      tileerror: () => {
        failed = true;
      },
      load: () => this.sink.reportStatus(id, failed ? 'error' : 'ready'),
    };
    layer.on(handlers);
    return () => layer.off(handlers);
  }

  private reportScale(id: LayerId): void {
    const options = this.bound.get(id)?.layer.options ?? {};
    const zoom = this.map.getZoom();
    const outOfScale =
      (options.minZoom !== undefined && zoom < options.minZoom) ||
      (options.maxZoom !== undefined && zoom > options.maxZoom);
    this.sink.reportOutOfScale(id, outOfScale);
  }
}

/** The smallest or largest of the given numbers; undefined if there is none. */
function extreme(
  pick: (...values: number[]) => number,
  values: (number | undefined)[]
): number | undefined {
  const defined = values.filter((value): value is number => typeof value === 'number');
  return defined.length ? pick(...defined) : undefined;
}

/** Tile and WMS layers fade themselves; base layers of other kinds keep their look. */
function setLayerOpacity(layer: L.Layer, opacity: number): void {
  (layer as any).setOpacity?.(opacity);
}

function applyOpacity(pane: HTMLElement, opacity: number): void {
  pane.style.opacity = opacity < 1 ? String(opacity) : '';
}
