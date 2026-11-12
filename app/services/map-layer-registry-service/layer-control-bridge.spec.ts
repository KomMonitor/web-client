import * as L from 'leaflet';
import '../../../customizedExternalLibs/leaflet-groupedlayercontrol/leaflet.groupedlayercontrol';

import { MAP_LAYER_GROUPS } from 'services/map-service/map-context';

import { MAIN_MAP_LAYER_GROUPS } from './layer-group-catalog';
import { LayerControlBridge, legacyGroupOf } from './layer-control-bridge';
import { LeafletLayerBinding } from './leaflet-layer-binding';
import type { LayerEntryState, LayerRegistration } from './map-layer.model';
import { MapLayerRegistry } from './map-layer-registry';

function createMap(): L.Map {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: 800 });
  Object.defineProperty(container, 'clientHeight', { value: 600 });
  document.body.appendChild(container);
  return L.map(container, {
    maxZoom: 18,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
  }).setView([51.5, 7.4], 10);
}

describe('LayerControlBridge', () => {
  let map: L.Map;
  let control: any;
  let registry: MapLayerRegistry;
  let bridge: LayerControlBridge;

  function area(id: string, overrides: Partial<LayerRegistration> = {}): LayerRegistration {
    return {
      id,
      groupId: 'georesource.area',
      title: 'Schulen',
      subtitle: '2024-01-01',
      kind: 'vector',
      symbol: { kind: 'fill', color: '#ff0000' },
      layer: L.polygon(
        [
          [51.4, 7.3],
          [51.4, 7.5],
          [51.6, 7.5],
        ],
        { pane: registry.paneFor(id) }
      ),
      ...overrides,
    };
  }

  const listed = (layer: L.Layer) => control._layers.filter((item: any) => item.layer === layer);

  function checkbox(layer: L.Layer): HTMLInputElement {
    const inputs = [...control.getContainer().querySelectorAll('input')] as any[];
    return inputs.find((input) => input.layerId === L.Util.stamp(layer));
  }

  beforeEach(() => {
    map = createMap();
    control = (L.control as any).groupedLayers({}, {}, { collapsed: false });
    map.addControl(control);
    registry = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
    bridge = new LayerControlBridge(new LeafletLayerBinding(map, registry), control, map, registry);
    registry.attach(bridge);
  });

  afterEach(() => {
    const container = map.getContainer();
    map.remove();
    container.remove();
  });

  it('lists a registered layer under its old group and name', () => {
    const registration = area('georesource:1');

    registry.register(registration);

    expect(listed(registration.layer!)).toEqual([
      expect.objectContaining({
        name: 'Schulen_2024-01-01',
        overlay: true,
        group: expect.objectContaining({ name: MAP_LAYER_GROUPS.aoi }),
      }),
    ]);
    expect(checkbox(registration.layer!).checked).toBe(true);
  });

  it('turns a checkbox click into the visibility of the entry', () => {
    const registration = area('georesource:1');
    registry.register(registration);

    checkbox(registration.layer!).click();

    expect(registry.entry('georesource:1')?.visible).toBe(false);
    expect(map.hasLayer(registration.layer!)).toBe(false);

    checkbox(registration.layer!).click();

    expect(registry.entry('georesource:1')?.visible).toBe(true);
    expect(map.hasLayer(registration.layer!)).toBe(true);
  });

  it('unticks the checkbox when the registry hides the layer, without an event loop', () => {
    const registration = area('georesource:1');
    registry.register(registration);
    const removeLayer = jest.spyOn(map, 'removeLayer');
    const setVisible = jest.spyOn(registry, 'setVisible');

    registry.setVisible('georesource:1', false);

    expect(checkbox(registration.layer!).checked).toBe(false);
    expect(removeLayer.mock.calls.filter(([layer]) => layer === registration.layer)).toHaveLength(
      1
    );
    // The bridge echoes the control's 'overlayremove' once; the registry drops it as unchanged.
    expect(setVisible).toHaveBeenCalledTimes(2);
    expect(registry.entry('georesource:1')?.visible).toBe(false);
  });

  it('swaps a replaced layer in the control and keeps it visible', () => {
    const first = area('georesource:1');
    registry.register(first);

    const second = area('georesource:1', { subtitle: '2025-01-01' });
    registry.register(second);

    expect(listed(first.layer!)).toEqual([]);
    expect(listed(second.layer!)).toEqual([
      expect.objectContaining({ name: 'Schulen_2025-01-01' }),
    ]);
    expect(registry.entry('georesource:1')?.visible).toBe(true);
    expect(map.hasLayer(second.layer!)).toBe(true);
  });

  it('drops an unregistered layer from the control', () => {
    const registration = area('georesource:1');
    registry.register(registration);

    registry.unregister('georesource:1');

    expect(listed(registration.layer!)).toEqual([]);
    expect(map.hasLayer(registration.layer!)).toBe(false);
  });

  it('ignores overlays the old sources still add themselves', () => {
    const legacy = L.polygon([
      [51.4, 7.3],
      [51.4, 7.5],
      [51.6, 7.5],
    ]);
    const setVisible = jest.spyOn(registry, 'setVisible');
    control.addOverlay(legacy, 'Alt', MAP_LAYER_GROUPS.aoi);

    map.addLayer(legacy);
    map.removeLayer(legacy);

    expect(setVisible).not.toHaveBeenCalled();
  });

  it('leaves the registry alone when it lets go of the map', () => {
    const registration = area('georesource:1');
    registry.register(registration);

    bridge.dispose();
    registry.detach();

    expect(map.hasLayer(registration.layer!)).toBe(false);
    expect(registry.entry('georesource:1')?.visible).toBe(true);
  });

  describe('legacyGroupOf', () => {
    const entry = (id: string, groupId: string) => ({ id, groupId }) as LayerEntryState;

    it.each([
      ['georesource:1', 'georesource.point', MAP_LAYER_GROUPS.poi],
      ['georesource:2', 'georesource.line', MAP_LAYER_GROUPS.loi],
      ['georesource:3', 'georesource.area', MAP_LAYER_GROUPS.aoi],
      ['wms:4', 'georesource.service', MAP_LAYER_GROUPS.wms],
      ['wfs:Schulen', 'georesource.service', MAP_LAYER_GROUPS.wfs],
      ['indicator', 'indicator', MAP_LAYER_GROUPS.indicator],
      ['reachability:scenario:isochrones', 'reachability', MAP_LAYER_GROUPS.reachability],
      ['outline:7', 'outline', MAP_LAYER_GROUPS.spatialUnitOutline],
      ['file:a.geojson', 'temporary', MAP_LAYER_GROUPS.file],
    ])('lists %s under its old group', (id, groupId, group) => {
      expect(legacyGroupOf(entry(id, groupId))).toBe(group);
    });

    it('does not list what the old control never had', () => {
      expect(legacyGroupOf(entry('search:result', 'temporary'))).toBeUndefined();
    });
  });
});
