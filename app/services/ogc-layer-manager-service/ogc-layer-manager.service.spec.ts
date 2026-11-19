import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import * as L from 'leaflet';

import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { MAIN_MAP_LAYER_GROUPS } from 'services/map-layer-registry-service/layer-group-catalog';
import { MapLayerRegistry } from 'services/map-layer-registry-service/map-layer-registry';
import { MapContext } from 'services/map-service/map-context';

import { OgcLayerManagerService } from './ogc-layer-manager.service';

describe('OgcLayerManagerService', () => {
  let service: OgcLayerManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
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
        layers,
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

    it('is removable in the layer panel only with an owner from its catalogue', () => {
      const owner = { remove: jest.fn((id: string) => layers.unregister(id)) };
      service.addWmsLayer(dataset(), 1, owner);
      service.addWmsLayer(dataset({ id: 'wms-8', title: 'Parks' }), 1);

      expect(layers.entry('wms:wms-7')!.capabilities.remove).toBe(true);
      expect(layers.entry('wms:wms-8')!.capabilities.remove).toBe(false);

      layers.remove('wms:wms-7');
      expect(owner.remove).toHaveBeenCalledWith('wms:wms-7');
      expect(layers.drawOrder()).toEqual(['wms:wms-8']);
    });

    it('keeps a single entry when the same WMS is added again, e.g. from the other catalogue', () => {
      service.addWmsLayer(dataset(), 1);
      service.addWmsLayer(dataset(), 1);

      expect(layers.drawOrder()).toEqual(['wms:wms-7']);
    });

    it('drops all WMS layers after a catalogue reload and leaves the others', () => {
      service.addWmsLayer(dataset(), 1);
      service.addWmsLayer(dataset({ id: 'wms-8', title: 'Parks' }), 1);
      layers.register({
        id: 'georesource:1',
        groupId: 'georesource.point',
        title: 'Schulen',
        kind: 'marker',
        symbol: { kind: 'point', color: '#ff0000' },
        layer: L.featureGroup(),
      });

      service.clearWmsAfterCatalogReload();

      expect(layers.drawOrder()).toEqual(['georesource:1']);
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
    });
  });

  describe('WFS', () => {
    it('tells the user that WFS cannot be shown and unticks the dataset', () => {
      const showError = jest.spyOn(TestBed.inject(NotificationService), 'showError');
      const layers = new MapLayerRegistry(MAIN_MAP_LAYER_GROUPS);
      const context = { map: {}, layers, hideLoadingIcon: jest.fn() } as unknown as MapContext;
      service.initialize(context);
      const dataset: any = { title: 'Bebauungspläne', isSelected: true };

      service.addWfsLayer(dataset, 1, true);

      expect(showError).toHaveBeenCalledWith('MAP_LAYERS.WFS_UNAVAILABLE');
      expect(dataset.isSelected).toBe(false);
      expect(context.hideLoadingIcon).toHaveBeenCalled();
      expect(layers.drawOrder()).toEqual([]);
    });

    it('has nothing to remove or restyle', () => {
      expect(() => service.removeWfsLayer({ title: 'Bebauungspläne' })).not.toThrow();
      expect(() => service.adjustWfsColor({ title: 'Bebauungspläne' }, 1)).not.toThrow();
    });
  });
});
