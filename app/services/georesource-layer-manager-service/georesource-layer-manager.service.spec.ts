import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GenericMapHelperService } from 'services/generic-map-helper-service/generic-map-helper.service';
import { MapContext } from 'services/map-service/map-context';
import { GeoresourceLayerManagerService } from './georesource-layer-manager.service';

function makeContext(layers: { name: string; layer: any }[] = []): MapContext {
  return {
    map: { id: 'the-map' },
    layerControl: {
      _layers: layers,
      removeLayer: jest.fn(),
    },
    updateSearchControl: jest.fn(),
    hideLoadingIcon: jest.fn(),
  };
}

describe('GeoresourceLayerManagerService', () => {
  let service: GeoresourceLayerManagerService;
  let genericMapHelperService: GenericMapHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GeoresourceLayerManagerService);
    genericMapHelperService = TestBed.inject(GenericMapHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('zoomToLayer', () => {
    it('fits the map to the bounds of the matching layer', () => {
      const matchingLayer = { id: 'schulen-layer' };
      const context = makeContext([{ name: 'Schulen_2024-01-01', layer: matchingLayer }]);
      service.initialize(context);
      jest.spyOn(genericMapHelperService, 'zoomToLayer').mockImplementation(() => {});

      service.zoomToLayer({ datasetName: 'Schulen' });

      expect(genericMapHelperService.zoomToLayer).toHaveBeenCalledWith(context.map, matchingLayer);
    });

    it('does nothing when no layer matches the dataset name', () => {
      const context = makeContext([{ name: 'Andere_2024-01-01', layer: { id: 'other' } }]);
      service.initialize(context);
      jest.spyOn(genericMapHelperService, 'zoomToLayer').mockImplementation(() => {});

      service.zoomToLayer({ datasetName: 'Schulen' });

      expect(genericMapHelperService.zoomToLayer).not.toHaveBeenCalled();
    });
  });

  describe('removePoiGeoresource', () => {
    it('removes the matching layer from both the layer control and the map', () => {
      const matchingLayer = { id: 'schulen-layer' };
      const context = makeContext([{ name: 'Schulen_2024-01-01', layer: matchingLayer }]);
      context.map.removeLayer = jest.fn();
      service.initialize(context);

      service.removePoiGeoresource({ datasetName: 'Schulen' });

      expect(context.layerControl.removeLayer).toHaveBeenCalledWith(matchingLayer);
      expect(context.map.removeLayer).toHaveBeenCalledWith(matchingLayer);
    });
  });
});
