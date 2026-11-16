import { TestBed } from '@angular/core/testing';
import * as L from 'leaflet';

import { MAP_LAYERS_PREFERENCES_STORAGE_KEY } from './layer-state-persistence';
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
    localStorage.clear();
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

  it('puts registered layers on the attached map and hands them out by id', () => {
    const map = newMap();
    const before = register('georesource:1');

    service.attach(map);
    const after = register('georesource:2');

    expect(map.hasLayer(before)).toBe(true);
    expect(map.hasLayer(after)).toBe(true);
    expect(service.layerFor('georesource:2')).toBe(after);
    expect(service.layerFor('georesource:404')).toBeUndefined();
    // no layer control on the map any more: the layer panel lists the layers
    expect(map.getContainer().querySelector('.leaflet-control-layers')).toBeNull();
  });

  it('moves the layers to a rebuilt map', () => {
    const oldMap = newMap();
    service.attach(oldMap);
    const layer = register('georesource:1');

    const newMapInstance = newMap();
    service.attach(newMapInstance);

    expect(oldMap.hasLayer(layer)).toBe(false);
    expect(newMapInstance.hasLayer(layer)).toBe(true);
    expect(service.registry.entry('georesource:1')?.visible).toBe(true);
  });

  it('lets go of the map on detach and keeps the entries', () => {
    const map = newMap();
    service.attach(map);
    const layer = register('georesource:1');

    service.detach();
    service.registry.setVisible('georesource:1', false);
    service.registry.setVisible('georesource:1', true);

    expect(map.hasLayer(layer)).toBe(false);
    expect(service.registry.entry('georesource:1')?.visible).toBe(true);
  });

  it('shows the base layers on the map and remembers the choice in localStorage', () => {
    const tiles = () => L.tileLayer('https://tiles.example/{z}/{x}/{y}.png', { maxZoom: 18 });
    const bases = [
      { id: 'base:A', title: 'A', thumbnail: null, layer: tiles() },
      { id: 'base:B', title: 'B', thumbnail: null, layer: tiles() },
    ];
    const map = newMap();
    service.attach(map);

    service.registry.setBaseLayers(bases);
    expect(map.hasLayer(bases[0].layer)).toBe(true);

    service.registry.setBaseLayer('base:B');
    expect(map.hasLayer(bases[1].layer)).toBe(true);
    // the group order is stored along with it
    expect(JSON.parse(localStorage.getItem(MAP_LAYERS_PREFERENCES_STORAGE_KEY)!)).toMatchObject({
      version: 1,
      baseLayer: { id: 'base:B', opacity: 1 },
    });
  });
});
