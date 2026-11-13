import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { MapService } from 'services/map-service/map.service';

import { GeoresourceLayerService } from './georesource-layer.service';

describe('GeoresourceLayerService', () => {
  let service: GeoresourceLayerService;
  let http: HttpTestingController;
  let mapService: Record<string, jest.Mock>;
  let poi: any;

  const url = 'http://dm/georesources/g-1/2024/01/01';
  const geoJSON = { type: 'FeatureCollection', features: [] };

  beforeEach(() => {
    poi = {
      georesourceId: 'g-1',
      datasetName: 'Schulen',
      isPOI: true,
      isSelected: true,
      selectedDate: { startDate: '2024-01-01' },
    };
    mapService = {
      showLoadingIcon: jest.fn(),
      hideLoadingIcon: jest.fn(),
      addPoiGeoresourceGeoJSON: jest.fn(),
      removePoiGeoresource: jest.fn(),
      addWfsLayerToMap: jest.fn(),
      removeWfsLayerFromMap: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MapService, useValue: mapService },
        {
          provide: CacheHelperServiceService,
          useValue: { getBaseUrlToKomMonitorDataAPI_spatialResource: () => 'http://dm' },
        },
        {
          provide: GeoresourceMetadataStoreService,
          useValue: { displayableGeoresources_keywordFiltered: [poi], wfsDatasets: [] },
        },
      ],
    });
    service = TestBed.inject(GeoresourceLayerService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // Registering again replaces the layer under the same id and keeps its
  // visibility, opacity and position; removing it first would lose them.
  it('reloads selected georesources without removing them first', () => {
    service.refreshPoiLayers();

    expect(mapService['removePoiGeoresource']).not.toHaveBeenCalled();
    http.expectOne(url).flush(geoJSON);
    expect(mapService['addPoiGeoresourceGeoJSON']).toHaveBeenCalledWith(poi, '2024-01-01', true);
  });

  it('replaces the layer when the date of a selected georesource changes', () => {
    service.onChangeSelectedDate(poi);

    expect(mapService['removePoiGeoresource']).not.toHaveBeenCalled();
    http.expectOne(url).flush(geoJSON);
    expect(mapService['addPoiGeoresourceGeoJSON']).toHaveBeenCalledTimes(1);
  });

  it('does not bring back a georesource deselected while it was loading', () => {
    service.addGeoresourceLayerToMap(poi);
    poi.isSelected = false;

    http.expectOne(url).flush(geoJSON);

    expect(mapService['addPoiGeoresourceGeoJSON']).not.toHaveBeenCalled();
    expect(mapService['hideLoadingIcon']).toHaveBeenCalled();
    expect(service.loadingData).toBe(false);
  });

  it('still removes a georesource when it is deselected', () => {
    poi.isSelected = false;

    service.removeGeoresourceLayerFromMap(poi);

    expect(mapService['removePoiGeoresource']).toHaveBeenCalledWith(poi);
  });
});
