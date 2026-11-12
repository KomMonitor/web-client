import * as L from 'leaflet';

import { createMarkerClusterGroup } from 'util/leaflet-cluster';

import { MAIN_MAP_LAYER_GROUPS } from './layer-group-catalog';
import { LeafletLayerBinding } from './leaflet-layer-binding';
import type { BoundLayer, LayerRegistration, MapLayerStatusSink } from './map-layer.model';
import { MapLayerRegistry } from './map-layer-registry';

/** A map with a real size (jsdom has no layout), so Leaflet computes bounds and clusters. */
function createMap(): L.Map {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: 800 });
  Object.defineProperty(container, 'clientHeight', { value: 600 });
  document.body.appendChild(container);
  return L.map(container, {
    // markercluster needs a maxZoom, which the base layer usually brings along.
    maxZoom: 18,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
  }).setView([51.5, 7.4], 10);
}

function square(pane: string, offset = 0): L.Polygon {
  return L.polygon(
    [
      [51.4 + offset, 7.3],
      [51.4 + offset, 7.5],
      [51.6 + offset, 7.5],
    ],
    { pane, opacity: 1, fillOpacity: 0.7 }
  );
}

function bound(id: string, layer: L.Layer, overrides: Partial<BoundLayer> = {}): BoundLayer {
  return {
    id,
    kind: 'vector',
    pane: layer.options.pane,
    layer,
    visible: true,
    opacity: 1,
    ...overrides,
  };
}

describe('LeafletLayerBinding', () => {
  let map: L.Map;
  let sink: jest.Mocked<MapLayerStatusSink>;
  let binding: LeafletLayerBinding;

  const pane = (name: string) => map.getPane(name)!;

  beforeEach(() => {
    map = createMap();
    sink = { reportStatus: jest.fn(), reportOutOfScale: jest.fn() };
    binding = new LeafletLayerBinding(map, sink);
  });

  afterEach(() => {
    const container = map.getContainer();
    map.remove();
    container.remove();
  });

  describe('panes', () => {
    it('puts a visible layer into its own pane', () => {
      const polygon = square('mapLayer1');

      binding.bind(bound('georesource:1', polygon));

      expect(map.hasLayer(polygon)).toBe(true);
      expect(polygon.getElement()!.closest('.leaflet-mapLayer1-pane')).toBe(pane('mapLayer1'));
    });

    it('keeps a hidden layer off the map until it is shown', () => {
      const polygon = square('mapLayer1');

      binding.bind(bound('georesource:1', polygon, { visible: false }));
      expect(pane('mapLayer1')).toBeDefined();
      expect(map.hasLayer(polygon)).toBe(false);

      binding.setVisible('georesource:1', true);
      expect(map.hasLayer(polygon)).toBe(true);

      binding.setVisible('georesource:1', false);
      expect(map.hasLayer(polygon)).toBe(false);
    });

    it('adds a layer only once', () => {
      const polygon = square('mapLayer1');
      const addLayer = jest.spyOn(map, 'addLayer');

      binding.bind(bound('georesource:1', polygon));
      binding.bind(bound('georesource:1', polygon));
      binding.setVisible('georesource:1', true);

      // Leaflet also adds the SVG renderer of the new pane, which is not counted here.
      expect(addLayer.mock.calls.filter(([layer]) => layer === polygon)).toHaveLength(1);
    });

    it('swaps a replaced layer within the same pane', () => {
      const first = square('mapLayer1');
      const second = square('mapLayer1', 0.1);
      binding.bind(bound('georesource:1', first));

      binding.bind(bound('georesource:1', second));

      expect(map.hasLayer(first)).toBe(false);
      expect(map.hasLayer(second)).toBe(true);
      expect(second.getElement()!.closest('.leaflet-mapLayer1-pane')).toBe(pane('mapLayer1'));
    });

    it('takes an unbound layer off the map, keeps its pane and stops listening', () => {
      const tiles = L.tileLayer('https://example.org/{z}/{x}/{y}.png', { pane: 'mapLayer1' });
      binding.bind(bound('wms:1', tiles, { kind: 'raster', visible: false }));
      const polygon = square('mapLayer2');
      binding.bind(bound('georesource:1', polygon));

      binding.unbind('georesource:1');
      binding.unbind('wms:1');
      binding.unbind('wms:404');
      sink.reportStatus.mockClear();
      tiles.fire('loading');

      expect(map.hasLayer(polygon)).toBe(false);
      expect(pane('mapLayer2')).toBeDefined();
      expect(sink.reportStatus).not.toHaveBeenCalled();
    });
  });

  describe('opacity', () => {
    it('fades the pane and leaves the ratio of fill and stroke alone', () => {
      const polygon = square('mapLayer1');
      binding.bind(bound('georesource:1', polygon, { opacity: 0.8 }));
      expect(pane('mapLayer1').style.opacity).toBe('0.8');

      binding.setOpacity('georesource:1', 0.5);

      const path = polygon.getElement()!;
      expect(pane('mapLayer1').style.opacity).toBe('0.5');
      expect(path.getAttribute('fill-opacity')).toBe('0.7');
      expect(path.getAttribute('stroke-opacity')).toBe('1');

      binding.setOpacity('georesource:1', 1);
      expect(pane('mapLayer1').style.opacity).toBe('');
    });

    it('fades the cluster icons along with the markers', () => {
      const cluster = createMarkerClusterGroup({ clusterPane: 'mapLayer1' });
      cluster.addLayers([
        L.marker([51.5, 7.4], { pane: 'mapLayer1' }),
        L.marker([51.5001, 7.4001], { pane: 'mapLayer1' }),
      ]);

      binding.bind(bound('georesource:1', cluster, { kind: 'cluster', pane: 'mapLayer1' }));
      binding.setOpacity('georesource:1', 0.4);

      const icon = map.getContainer().querySelector('.marker-cluster');
      expect(icon).not.toBeNull();
      expect(icon!.closest('.leaflet-mapLayer1-pane')).toBe(pane('mapLayer1'));
      expect(pane('mapLayer1').style.opacity).toBe('0.4');
    });
  });

  describe('stacking', () => {
    it('stacks the panes by the draw order, top first', () => {
      binding.setOrder(['georesource:1', 'indicator']);
      binding.bind(bound('indicator', square('mapLayer1')));
      binding.bind(bound('georesource:1', square('mapLayer2')));

      expect(pane('mapLayer2').style.zIndex).toBe('390');
      expect(pane('mapLayer1').style.zIndex).toBe('389');

      binding.setOrder(['indicator', 'georesource:1']);

      expect(pane('mapLayer1').style.zIndex).toBe('390');
      expect(pane('mapLayer2').style.zIndex).toBe('389');
    });

    it('puts layers without a place in the order at the bottom', () => {
      const ids = Array.from({ length: 200 }, (_, index) => `file:${index}`);
      binding.setOrder(ids);

      binding.bind(bound('file:199', square('mapLayer1')));
      binding.bind(bound('georesource:1', square('mapLayer2')));

      expect(pane('mapLayer1').style.zIndex).toBe('210');
      expect(pane('mapLayer2').style.zIndex).toBe('210');
    });
  });

  describe('zoomTo', () => {
    it('fits the map to the bounds of the layer', () => {
      const polygon = square('mapLayer1');
      const fitBounds = jest.spyOn(map, 'fitBounds');
      binding.bind(bound('georesource:1', polygon));

      binding.zoomTo('georesource:1');

      expect(fitBounds).toHaveBeenCalledWith(polygon.getBounds(), { maxZoom: 17 });
    });

    it('prefers the bounds of the adapter override and skips layers without bounds', () => {
      const fitBounds = jest.spyOn(map, 'fitBounds');
      const extent = L.latLngBounds([51, 7], [52, 8]);
      const wms = { layers: 'a', pane: 'mapLayer1' };
      binding.bind(
        bound('wms:1', L.tileLayer.wms('https://example.org/wms', wms), {
          kind: 'raster',
          visible: false,
          adapter: { getBounds: () => extent },
        })
      );
      binding.bind(
        bound('wms:2', L.tileLayer.wms('https://example.org/wms', { ...wms, pane: 'mapLayer2' }), {
          kind: 'raster',
          visible: false,
        })
      );

      binding.zoomTo('wms:2');
      binding.zoomTo('wms:404');
      binding.zoomTo('wms:1');

      expect(fitBounds).toHaveBeenCalledTimes(1);
      expect(fitBounds).toHaveBeenCalledWith(extent, { maxZoom: 17 });
    });
  });

  describe('status', () => {
    let tiles: L.TileLayer;

    beforeEach(() => {
      tiles = L.tileLayer('https://example.org/{z}/{x}/{y}.png', { pane: 'mapLayer1' });
      binding.bind(bound('wms:1', tiles, { kind: 'raster', visible: false }));
    });

    it('reports tile loading as loading and ready', () => {
      tiles.fire('loading');
      expect(sink.reportStatus).toHaveBeenLastCalledWith('wms:1', 'loading');

      tiles.fire('load');
      expect(sink.reportStatus).toHaveBeenLastCalledWith('wms:1', 'ready');
    });

    it('reports an error when a tile failed, until the next loading', () => {
      tiles.fire('loading');
      tiles.fire('tileerror');
      tiles.fire('load');
      expect(sink.reportStatus).toHaveBeenLastCalledWith('wms:1', 'error');

      tiles.fire('loading');
      tiles.fire('load');
      expect(sink.reportStatus).toHaveBeenLastCalledWith('wms:1', 'ready');
    });

    it('reports whether the zoom is outside the zoom range of the layer', () => {
      const detailed = L.tileLayer('https://example.org/{z}/{x}/{y}.png', {
        pane: 'mapLayer2',
        minZoom: 12,
      });

      binding.bind(bound('wms:2', detailed, { kind: 'raster', visible: false }));
      expect(sink.reportOutOfScale).toHaveBeenLastCalledWith('wms:2', true);

      sink.reportOutOfScale.mockClear();
      map.setZoom(12);
      expect(sink.reportOutOfScale).toHaveBeenCalledWith('wms:2', false);
      expect(sink.reportOutOfScale).toHaveBeenCalledWith('wms:1', false);
    });
  });

  describe('dispose', () => {
    it('takes every layer off the map and stops reporting', () => {
      const polygon = square('mapLayer1');
      const tiles = L.tileLayer('https://example.org/{z}/{x}/{y}.png', { pane: 'mapLayer2' });
      binding.bind(bound('georesource:1', polygon));
      binding.bind(bound('wms:1', tiles, { kind: 'raster', visible: false }));

      binding.dispose();
      sink.reportStatus.mockClear();
      sink.reportOutOfScale.mockClear();
      tiles.fire('loading');
      map.setZoom(12);

      expect(map.hasLayer(polygon)).toBe(false);
      expect(sink.reportStatus).not.toHaveBeenCalled();
      expect(sink.reportOutOfScale).not.toHaveBeenCalled();
    });
  });

  describe('with the registry', () => {
    let registry: MapLayerRegistry;

    function polygonEntry(id: string, groupId: string, offset = 0): LayerRegistration {
      return {
        id,
        groupId,
        title: id,
        kind: 'vector',
        symbol: { kind: 'fill', color: '#ff0000' },
        layer: square(registry.paneFor(id), offset),
      };
    }

    beforeEach(() => {
      registry = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
      registry.attach(new LeafletLayerBinding(map, registry));
      registry.register(polygonEntry('indicator', 'indicator'));
      registry.register(polygonEntry('georesource:1', 'georesource.area'));
    });

    it('restacks the panes when a group moves', () => {
      const indicator = pane(registry.paneFor('indicator'));
      const georesource = pane(registry.paneFor('georesource:1'));
      expect([georesource.style.zIndex, indicator.style.zIndex]).toEqual(['390', '389']);

      registry.moveGroup('indicator', 0);

      expect([indicator.style.zIndex, georesource.style.zIndex]).toEqual(['390', '389']);
    });

    it('keeps a replaced layer in the same pane', () => {
      const replacement = polygonEntry('georesource:1', 'georesource.area', 0.1);

      registry.register(replacement);

      const paneName = registry.paneFor('georesource:1');
      expect(replacement.layer!.getElement()!.closest(`.leaflet-${paneName}-pane`)).toBe(
        pane(paneName)
      );
      expect(pane(paneName).querySelectorAll('path')).toHaveLength(1);
    });

    it('fades the pane and feeds tile events back into the entry', () => {
      const tiles = L.tileLayer('https://example.org/{z}/{x}/{y}.png', {
        pane: registry.paneFor('wms:1'),
      });
      registry.register({
        id: 'wms:1',
        groupId: 'georesource.service',
        title: 'WMS',
        kind: 'raster',
        symbol: { kind: 'service', serviceType: 'wms' },
        layer: tiles,
        initial: { visible: false },
      });

      registry.setOpacity('wms:1', 0.3);
      tiles.fire('loading');

      expect(pane(registry.paneFor('wms:1')).style.opacity).toBe('0.3');
      expect(registry.entry('wms:1')?.status).toBe('loading');
    });
  });
});
