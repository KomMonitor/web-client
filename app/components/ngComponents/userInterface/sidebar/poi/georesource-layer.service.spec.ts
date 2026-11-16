import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import type { MapLayerOwner } from 'services/map-layer-registry-service/map-layer.model';
import { MapService } from 'services/map-service/map.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';

import { GeoresourceFilterService } from './georesource-filter.service';
import { GeoresourceLayerService } from './georesource-layer.service';

describe('GeoresourceLayerService', () => {
  let service: GeoresourceLayerService;
  let http: HttpTestingController;
  let mapService: Record<string, jest.Mock>;
  let poi: any;
  let catalogue: any[];
  let topic: any;

  const url = 'http://dm/georesources/g-1/2024/01/01';
  const geoJSON = { type: 'FeatureCollection', features: [] };

  beforeEach(() => {
    poi = {
      georesourceId: 'g-1',
      datasetName: 'Schulen',
      isPOI: true,
      isSelected: true,
      selectedDate: { startDate: '2024-01-01' },
      topicReference: 't-1',
    };
    catalogue = [poi];
    topic = {
      topicId: 't-1',
      isSelected: true,
      poiData: [poi],
      loiData: [],
      aoiData: [],
      subTopics: [],
    };
    mapService = {
      showLoadingIcon: jest.fn(),
      hideLoadingIcon: jest.fn(),
      addPoiGeoresourceGeoJSON: jest.fn(),
      removePoiGeoresource: jest.fn(),
      addWfsLayerToMap: jest.fn(),
      removeWfsLayerFromMap: jest.fn(),
      addWmsLayerToMap: jest.fn(),
      removeWmsLayerFromMap: jest.fn(),
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
          useValue: {
            get displayableGeoresources_keywordFiltered() {
              return catalogue;
            },
            wfsDatasets: [],
          },
        },
        {
          provide: GeoresourceFilterService,
          useValue: { preppedTopicGeoresourceHierarchy: [topic] },
        },
        {
          provide: TopicHierarchyStoreService,
          useValue: { topicGeoresourceHierarchy: [topic] },
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
    expect(mapService['addPoiGeoresourceGeoJSON']).toHaveBeenCalledWith(
      poi,
      '2024-01-01',
      true,
      expect.objectContaining({ remove: expect.any(Function) })
    );
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
  describe('removed in the layer panel', () => {
    /** The owner the dataset's layer was added with. */
    function addedOwner(): MapLayerOwner {
      service.addGeoresourceLayerToMap(poi);
      http.expectOne(url).flush(geoJSON);
      return mapService['addPoiGeoresourceGeoJSON'].mock.calls[0][3];
    }

    it('unticks the dataset and its topic and removes the layer', () => {
      addedOwner().remove!('georesource:g-1');

      expect(poi.isSelected).toBe(false);
      expect(topic.isSelected).toBe(false);
      expect(mapService['removePoiGeoresource']).toHaveBeenCalledWith(poi);
    });

    it('also unticks the copy the catalogue shows after a keyword filter change', () => {
      const owner = addedOwner();
      const shown = { ...poi };
      catalogue = [shown];

      owner.remove!('georesource:g-1');

      expect([poi.isSelected, shown.isSelected]).toEqual([false, false]);
      expect(mapService['removePoiGeoresource']).toHaveBeenCalledWith(shown);
    });
  });

  it('lets the layer panel remove a WMS by unticking it', () => {
    const wms: any = { id: 'w-1', title: 'Luftbild', isSelected: true, transparency: 0.2 };
    service.handleWmsOnMap(wms);
    const owner: MapLayerOwner = mapService['addWmsLayerToMap'].mock.calls[0][2];

    owner.remove!('wms:w-1');

    expect(wms.isSelected).toBe(false);
    expect(mapService['removeWmsLayerFromMap']).toHaveBeenCalledWith(wms);
  });
});
