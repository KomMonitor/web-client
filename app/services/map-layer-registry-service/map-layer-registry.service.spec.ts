import { TestBed } from '@angular/core/testing';
import * as L from 'leaflet';
import '../../../customizedExternalLibs/leaflet-groupedlayercontrol/leaflet.groupedlayercontrol';

import { MAP_LAYER_REGISTRY, MainMapLayersService } from './map-layer-registry.service';

function createMap(): L.Map {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: 800 });
  Object.defineProperty(container, 'clientHeight', { value: 600 });
  document.body.appendChild(container);
  return L.map(container, { maxZoom: 18, zoomAnimation: false, fadeAnimation: false }).setView(
    [51.5, 7.4],
    10
  );
}

function createControl(map: L.Map): any {
  const control = (L.control as any).groupedLayers({}, {}, { collapsed: false });
  map.addControl(control);
  return control;
}

describe('MainMapLayersService', () => {
  let service: MainMapLayersService;
  const maps: L.Map[] = [];

  function newMap(): L.Map {
    const map = createMap();
    maps.push(map);
    return map;
  }

  function register(id: string): L.Layer {
    const layer = L.polygon(
      [
        [51.4, 7.3],
        [51.4, 7.5],
        [51.6, 7.5],
      ],
      { pane: service.registry.paneFor(id) }
    );
    service.registry.register({
      id,
      groupId: 'georesource.area',
      title: id,
      kind: 'vector',
      symbol: { kind: 'fill', color: '#ff0000' },
      layer,
    });
    return layer;
  }

  beforeEach(() => {
    service = TestBed.inject(MainMapLayersService);
  });

  afterEach(() => {
    service.detach();
    maps.splice(0).forEach((map) => {
      const container = map.getContainer();
      map.remove();
      container.remove();
    });
  });

  it('provides its registry as the default MAP_LAYER_REGISTRY', () => {
    expect(TestBed.inject(MAP_LAYER_REGISTRY)).toBe(service.registry);
  });

  it('puts registered layers on the attached map and lists them in the old control', () => {
    const map = newMap();
    const control = createControl(map);
    const before = register('georesource:1');

    service.attach(map, control);
    const after = register('georesource:2');

    expect(map.hasLayer(before)).toBe(true);
    expect(map.hasLayer(after)).toBe(true);
    expect(control._layers.map((item: any) => item.name)).toEqual([
      'georesource:1',
      'georesource:2',
    ]);
  });

  it('moves the layers to a rebuilt map', () => {
    const oldMap = newMap();
    service.attach(oldMap, createControl(oldMap));
    const layer = register('georesource:1');

    const newMapInstance = newMap();
    service.attach(newMapInstance, createControl(newMapInstance));

    expect(oldMap.hasLayer(layer)).toBe(false);
    expect(newMapInstance.hasLayer(layer)).toBe(true);
    expect(service.registry.entry('georesource:1')?.visible).toBe(true);
  });

  it('lets go of the map on detach and keeps the entries', () => {
    const map = newMap();
    service.attach(map, createControl(map));
    const layer = register('georesource:1');

    service.detach();
    service.registry.setVisible('georesource:1', false);
    service.registry.setVisible('georesource:1', true);

    expect(map.hasLayer(layer)).toBe(false);
    expect(service.registry.entry('georesource:1')?.visible).toBe(true);
  });
});
