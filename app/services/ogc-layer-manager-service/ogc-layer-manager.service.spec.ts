import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import * as L from 'leaflet';

import { WmsDataset } from 'components/ngComponents/models/services.models';
import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';
import { MAP_LAYER_GROUPS, MapContext } from 'services/map-service/map-context';

import { OgcLayerManagerService } from './ogc-layer-manager.service';

describe('OgcLayerManagerService', () => {
  let service: OgcLayerManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OgcLayerManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('WMS', () => {
    let layers: MapLayerRegistry;
    let context: MapContext;

    const dataset = (overrides: Partial<WmsDataset> = {}) =>
      ({
        id: 'wms-7',
        title: 'Schulen',
        connectionDetails: { baseUrl: 'https://example.org/wms', layerName: 'schulen' },
        ...overrides,
      }) as WmsDataset;

    beforeEach(() => {
      layers = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
      context = {
        map: { invalidateSize: jest.fn() },
        layerControl: { addOverlay: jest.fn(), removeLayer: jest.fn(), _layers: [] },
        layers,
        updateSearchControl: jest.fn(),
        hideLoadingIcon: jest.fn(),
      };
      service.initialize(context);
    });

    it('registers the WMS as a raster layer of the geodata services', () => {
      service.addWmsLayer(dataset(), 0.6);

      expect(layers.entry('wms:wms-7')).toMatchObject({
        groupId: 'georesource.service',
        title: 'Schulen',
        kind: 'raster',
        symbol: { kind: 'service', serviceType: 'wms' },
        visible: true,
        opacity: 0.6,
      });
      expect(context.layerControl.addOverlay).not.toHaveBeenCalled();
      expect(context.map.invalidateSize).toHaveBeenCalledWith(true);
      expect(context.hideLoadingIcon).toHaveBeenCalled();
    });

    it('creates the tile layer in the pane of its entry and leaves the fading to the pane', () => {
      const register = jest.spyOn(layers, 'register');

      service.addWmsLayer(dataset(), 0.6);

      const layer = register.mock.calls[0][0].layer as L.TileLayer.WMS;
      expect(layer).toBeInstanceOf(L.TileLayer.WMS);
      expect(layer.options).toMatchObject({
        pane: layers.paneFor('wms:wms-7'),
        opacity: 1,
        transparent: true,
      });
      expect((layer as any).wmsParams.layers).toBe('schulen');
    });

    it('keeps a single entry when the same WMS is added again, e.g. from the other catalogue', () => {
      service.addWmsLayer(dataset(), 1);
      service.addWmsLayer(dataset(), 1);

      expect(layers.drawOrder()).toEqual(['wms:wms-7']);
    });

    it('removes only its own entry, not others whose name contains the WMS title', () => {
      layers.register({
        id: 'georesource:1',
        groupId: 'georesource.point',
        title: 'Schulen',
        subtitle: '2024-01-01',
        kind: 'marker',
        symbol: { kind: 'point', color: '#ff0000' },
        layer: L.featureGroup(),
      });
      service.addWmsLayer(dataset(), 1);

      service.removeWmsLayer(dataset());

      expect(layers.drawOrder()).toEqual(['georesource:1']);
      expect(context.layerControl.removeLayer).not.toHaveBeenCalled();
    });
  });

  describe('WFS', () => {
    it('removes only WFS entries of the old control, not namesakes in other groups', () => {
      const wfsLayer = { id: 'wfs' };
      const georesourceLayer = { id: 'georesource' };
      const context: MapContext = {
        map: { removeLayer: jest.fn() },
        layerControl: {
          removeLayer: jest.fn(),
          _layers: [
            { name: 'Schulen', layer: wfsLayer, group: { name: MAP_LAYER_GROUPS.wfs } },
            {
              name: 'Schulen_2024-01-01',
              layer: georesourceLayer,
              group: { name: MAP_LAYER_GROUPS.poi },
            },
          ],
        },
        layers: new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS),
        updateSearchControl: jest.fn(),
        hideLoadingIcon: jest.fn(),
      };
      service.initialize(context);

      service.removeWfsLayer({ title: 'Schulen' });

      expect(context.layerControl.removeLayer).toHaveBeenCalledTimes(1);
      expect(context.layerControl.removeLayer).toHaveBeenCalledWith(wfsLayer);
      expect(context.map.removeLayer).toHaveBeenCalledWith(wfsLayer);
    });
  });
});
