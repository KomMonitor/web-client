import type * as L from 'leaflet';

import { resolveLayerAdapter } from './layer-adapters';
import type {
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
 * survives restyles. Tile events and the zoom range flow back as status.
 */
export class LeafletLayerBinding implements MapLayerBinding {
  private readonly bound = new Map<LayerId, Bound>();
  private order: readonly LayerId[] = [];
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
    const bound = this.bound.get(id);
    const bounds = bound && resolveLayerAdapter(bound.adapter).getBounds(bound.layer);
    if (bounds) {
      this.map.fitBounds(bounds, { maxZoom: ZOOM_TO_MAX_ZOOM });
    }
  }

  setOrder(order: LayerId[]): void {
    this.order = [...order];
    this.bound.forEach((bound, id) => (bound.pane.style.zIndex = String(this.zIndexFor(id))));
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

function applyOpacity(pane: HTMLElement, opacity: number): void {
  pane.style.opacity = opacity < 1 ? String(opacity) : '';
}
