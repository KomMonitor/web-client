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

  describe('opacity slider of the old control', () => {
    function slider(layer: L.Layer): HTMLInputElement {
      const item = checkbox(layer).closest('.leaflet-control-layers-item')!;
      return item.querySelector('input[type="range"]') as HTMLInputElement;
    }

    function slide(input: HTMLInputElement, transparency: string): void {
      input.value = transparency;
      input.dispatchEvent(new Event('change'));
    }

    it('starts at the transparency of the registry entry', () => {
      const registration = area('georesource:1', { initial: { opacity: 0.6 } });

      registry.register(registration);

      expect(Number(slider(registration.layer!).value)).toBeCloseTo(0.4);
    });

    it('fades the pane of a registered layer and leaves its paths alone', () => {
      const registration = area('georesource:1');
      registry.register(registration);
      const path = (registration.layer as L.Polygon).getElement()!;
      const fillOpacity = path.getAttribute('fill-opacity');

      slide(slider(registration.layer!), '0.5');

      expect(registry.entry('georesource:1')?.opacity).toBe(0.5);
      expect(map.getPane(registry.paneFor('georesource:1'))!.style.opacity).toBe('0.5');
      expect(path.getAttribute('fill-opacity')).toBe(fillOpacity);
    });

    it('keeps the old behavior for layers the old sources add themselves', () => {
      const legacy = L.geoJSON({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [7.3, 51.4],
              [7.5, 51.4],
              [7.5, 51.6],
              [7.3, 51.4],
            ],
          ],
        },
      } as any);
      control.addOverlay(legacy, 'Alt', MAP_LAYER_GROUPS.aoi);
      map.addLayer(legacy);

      slide(slider(legacy), '0.5');

      const [path] = legacy.getLayers() as L.Path[];
      expect(path.options.fillOpacity).toBe('0.50');
    });

    it('unhooks itself on dispose', () => {
      bridge.dispose();

      expect(control.opacityHandler).toBeUndefined();
    });
  });

  describe('base layers', () => {
    const tiles = () =>
      L.tileLayer('https://tiles.example/{z}/{x}/{y}.png', { minZoom: 5, maxZoom: 18 });
    const bases = () => [
      { id: 'base:Grau', title: 'OSM Grau', thumbnail: null, layer: tiles() },
      { id: 'base:Farbe', title: 'OSM Farbe', thumbnail: null, layer: tiles() },
      { id: 'base:Luftbild', title: 'Luftbild', thumbnail: null, layer: tiles() },
    ];

    function radios(): HTMLInputElement[] {
      return [...control.getContainer().querySelectorAll('input[type="radio"]')];
    }

    function radio(layer: L.Layer): HTMLInputElement {
      return radios().find((input: any) => input.layerId === L.Util.stamp(layer))!;
    }

    function slider(layer: L.Layer): HTMLInputElement {
      const item = radio(layer).closest('.leaflet-control-layers-item')!;
      return item.querySelector('input[type="range"]') as HTMLInputElement;
    }

    it('lists the base layers as radios in their order, the shown one checked', () => {
      const registrations = bases();

      registry.setBaseLayers(registrations);

      expect(
        control._layers.filter((item: any) => !item.overlay).map((item: any) => item.name)
      ).toEqual(['OSM Grau', 'OSM Farbe', 'Luftbild']);
      expect(radios().map((input) => input.checked)).toEqual([true, false, false]);
      expect(map.hasLayer(registrations[0].layer)).toBe(true);
    });

    it('turns a radio click into the registry choice, in either direction', () => {
      const registrations = bases();
      registry.setBaseLayers(registrations);

      radio(registrations[2].layer).click();
      expect(registry.activeBaseLayer()?.id).toBe('base:Luftbild');
      expect(map.hasLayer(registrations[2].layer)).toBe(true);
      expect(map.hasLayer(registrations[0].layer)).toBe(false);

      radio(registrations[0].layer).click();
      expect(registry.activeBaseLayer()?.id).toBe('base:Grau');
      expect(map.hasLayer(registrations[0].layer)).toBe(true);
      expect(map.hasLayer(registrations[2].layer)).toBe(false);
    });

    it('checks the radio of a base layer the registry chose', () => {
      const registrations = bases();
      registry.setBaseLayers(registrations);

      registry.setBaseLayer('base:Farbe');
      expect(radios().map((input) => input.checked)).toEqual([false, true, false]);

      registry.setBaseLayer(null);
      expect(radios().map((input) => input.checked)).toEqual([false, false, false]);
    });

    it('couples the slider of a base layer to the base layer opacity', () => {
      const registrations = bases();
      registry.setBaseLayers(registrations);
      registry.setBaseLayerOpacity(0.7);
      control._update();
      expect(Number(slider(registrations[0].layer).value)).toBeCloseTo(0.3);

      const input = slider(registrations[0].layer);
      input.value = '0.6';
      input.dispatchEvent(new Event('change'));

      expect(registry.baseLayerOpacity()).toBeCloseTo(0.4);
      expect(registrations[0].layer.options.opacity).toBeCloseTo(0.4);
    });

    it('replaces the listed base layers when the map hands over new ones', () => {
      registry.setBaseLayers(bases());
      const rebuilt = bases().slice(0, 2);

      registry.setBaseLayers(rebuilt);

      const listedBases = control._layers.filter((item: any) => !item.overlay);
      expect(listedBases.map((item: any) => item.layer)).toEqual(rebuilt.map((base) => base.layer));
      expect(map.hasLayer(rebuilt[0].layer)).toBe(true);
    });

    it('stops following the radios on dispose', () => {
      const registrations = bases();
      registry.setBaseLayers(registrations);
      bridge.dispose();

      map.addLayer(registrations[1].layer);

      expect(registry.activeBaseLayer()?.id).toBe('base:Grau');
    });
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
