import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import * as L from 'leaflet';

import { MainMapLayersService } from 'services/map-layer-registry-service/map-layer-registry.service';

import { MapControlsService } from './map-controls.service';

describe('MapControlsService', () => {
  let service: MapControlsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MapControlsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialize', () => {
    it('adds the scale bar and no layer control, which the layer panel replaced', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);
      const map = L.map(container).setView([51.45, 7.0], 12);

      service.initialize(map);

      expect(container.querySelector('.leaflet-control-scale')).not.toBeNull();
      expect(container.querySelector('.leaflet-control-layers')).toBeNull();
      map.remove();
      container.remove();
    });
  });

  describe('address search result', () => {
    let map: L.Map;
    let mainMapLayers: MainMapLayersService;
    let geosearch: any;

    const hit = (label: string, x = 7.01, y = 51.45) => ({ x, y, label });

    beforeEach(() => {
      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 800 });
      Object.defineProperty(container, 'clientHeight', { value: 600 });
      document.body.appendChild(container);
      map = L.map(container, { maxZoom: 18, zoomAnimation: false }).setView([51.45, 7.0], 12);

      mainMapLayers = TestBed.inject(MainMapLayersService);
      service.initialize(map);
      mainMapLayers.attach(map);
      service.initSearchControls();
      geosearch = (service as any).geosearchControl;
    });

    afterEach(() => {
      mainMapLayers.detach();
      const container = map.getContainer();
      map.remove();
      container.remove();
    });

    it('turns the location of a hit into the layer search:result', () => {
      map.fire('geosearch/showlocation', { location: hit('Kettwiger Straße, Essen') });

      const registry = mainMapLayers.registry;
      expect(registry.entry('search:result')).toMatchObject({
        groupId: 'temporary',
        title: 'Kettwiger Straße, Essen',
        kind: 'marker',
        visible: true,
      });
      const pane = map.getPane(registry.paneFor('search:result'))!;
      expect(pane.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1);
      expect(map.getPane('markerPane')!.querySelectorAll('.leaflet-marker-icon')).toHaveLength(0);
    });

    it('replaces the previous hit and keeps its display state', () => {
      const registry = mainMapLayers.registry;
      service.showSearchResult(hit('Erste Adresse'));
      registry.setOpacity('search:result', 0.5);

      service.showSearchResult(hit('Zweite Adresse', 7.02, 51.46));

      expect(registry.drawOrder()).toEqual(['search:result']);
      expect(registry.entry('search:result')).toMatchObject({
        title: 'Zweite Adresse',
        opacity: 0.5,
      });
      const pane = map.getPane(registry.paneFor('search:result'))!;
      expect(pane.querySelectorAll('.leaflet-marker-icon')).toHaveLength(1);
    });

    it('clears the search, input included, when the hit is removed in the layer panel', () => {
      geosearch.searchElement.input.value = 'Adresse';
      geosearch.showResult({ x: 7.01, y: 51.45, label: 'Adresse' }, { query: 'Adresse' });
      expect(mainMapLayers.registry.entry('search:result')!.capabilities.remove).toBe(true);

      mainMapLayers.registry.remove('search:result');

      expect(mainMapLayers.registry.entry('search:result')).toBeUndefined();
      expect(geosearch.searchElement.input.value).toBe('');
      expect(geosearch.markers.getLayers()).toHaveLength(0);
    });

    it('gives origin and address as details, for this session only', async () => {
      service.showSearchResult(hit('Kettwiger Straße, Essen'));

      expect(await mainMapLayers.registry.info('search:result')).toEqual({
        items: [
          { labelKey: 'MAP_LAYERS.INFO.ORIGIN', valueKey: 'MAP_LAYERS.INFO.ORIGINS.SEARCH' },
          { labelKey: 'MAP_LAYERS.INFO.ADDRESS', value: 'Kettwiger Straße, Essen' },
        ],
        noteKey: 'MAP_LAYERS.INFO.SESSION_NOTE',
      });
    });

    it('removes the hit when the search drops its result, but not on other keys', () => {
      geosearch.showResult({ x: 7.01, y: 51.45, label: 'Adresse' }, { query: 'Adresse' });
      expect(mainMapLayers.registry.entry('search:result')).toBeDefined();
      expect(map.hasLayer(geosearch.markers)).toBe(false);

      geosearch.clearResults({ keyCode: 65 } as KeyboardEvent, true);
      expect(mainMapLayers.registry.entry('search:result')).toBeDefined();

      geosearch.close();
      expect(mainMapLayers.registry.entry('search:result')).toBeUndefined();
    });
  });

  describe('feature search', () => {
    let map: L.Map;
    let mainMapLayers: MainMapLayersService;

    const featureLayer = (name: string, pane: string) =>
      L.geoJSON(
        {
          type: 'Feature',
          properties: { NAME: name, ID: name },
          geometry: { type: 'Point', coordinates: [7.01, 51.45] },
        } as any,
        { pane }
      );

    function register(id: string, name: string, searchable = true) {
      const registry = mainMapLayers.registry;
      const layer = featureLayer(name, registry.paneFor(id));
      registry.register({
        id,
        groupId: 'temporary',
        title: name,
        kind: 'vector',
        symbol: { kind: 'fill', color: '#ff0000' },
        layer,
        capabilities: { searchable },
      });
      return layer;
    }

    /** The layers the current feature search covers. */
    const searchedLayers = (): L.Layer[] =>
      (service as any).searchControl?.options.layer?.getLayers() ?? [];

    beforeEach(() => {
      (window as any).__env.FEATURE_NAME_PROPERTY_NAME = 'NAME';
      (window as any).__env.FEATURE_ID_PROPERTY_NAME = 'ID';
      const container = document.createElement('div');
      Object.defineProperty(container, 'clientWidth', { value: 800 });
      Object.defineProperty(container, 'clientHeight', { value: 600 });
      document.body.appendChild(container);
      map = L.map(container, { maxZoom: 18, zoomAnimation: false }).setView([51.45, 7.0], 12);
      mainMapLayers = TestBed.inject(MainMapLayersService);
      service.initialize(map);
      mainMapLayers.attach(map);
    });

    afterEach(() => {
      mainMapLayers.detach();
      const container = map.getContainer();
      map.remove();
      container.remove();
    });

    it('does nothing before the search exists', () => {
      register('file:a', 'Schule A');
      TestBed.tick();

      expect((service as any).searchControl).toBeUndefined();
    });

    it('covers visible searchable layers and finds their features', () => {
      service.initSearchControls();
      const layer = register('file:a', 'Schule A');
      register('file:b', 'Nicht durchsuchbar', false);
      TestBed.tick();

      expect(searchedLayers()).toEqual([layer]);
      expect(Object.keys((service as any).searchControl._recordsFromLayer())).toEqual([
        'Schule A (Name) - Schule A (ID)',
      ]);
    });

    it('rebuilds when a layer is hidden, shown again or replaced', () => {
      service.initSearchControls();
      const first = register('file:a', 'Schule A');
      TestBed.tick();

      mainMapLayers.registry.setVisible('file:a', false);
      TestBed.tick();
      expect(searchedLayers()).toEqual([]);

      mainMapLayers.registry.setVisible('file:a', true);
      TestBed.tick();
      expect(searchedLayers()).toEqual([first]);

      const replacement = register('file:a', 'Schule A2');
      TestBed.tick();
      expect(searchedLayers()).toEqual([replacement]);
    });
  });
});
