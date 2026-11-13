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
      const layerControl = service.initializeLayerControl(map, {}, []);
      mainMapLayers.attach(map, layerControl);
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
});
