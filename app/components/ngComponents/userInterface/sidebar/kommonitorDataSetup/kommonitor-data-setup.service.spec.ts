import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import {
  IndicatorsDataset,
  IndicatorsTopicsHierarchy,
} from 'components/ngComponents/models/indicators.models';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeometrySimplificationService } from 'services/geometry-simplification-service/geometry-simplification.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { MapErrorNotificationService } from 'services/map-error-notification-service/map-error-notification.service';
import { MapOverlayStateService } from 'services/map-overlay-state-service/map-overlay-state.service';
import { MapService } from 'services/map-service/map.service';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { MetadataFilterService } from 'services/metadata-filter-service/metadata-filter.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { KommonitorDataSetupService } from './kommonitor-data-setup.service';

describe('KommonitorDataSetupService', () => {
  let service: KommonitorDataSetupService;
  let http: HttpTestingController;
  let mapOverlayState: Record<string, any>;
  let mapErrorNotificationService: Record<string, jest.Mock>;
  let cacheHelperService: Record<string, jest.Mock>;
  let metadataFilterService: Record<string, any>;
  let selectionState: Record<string, any>;
  let georesourceStore: Record<string, jest.Mock>;
  let spatialUnitStore: Record<string, any>;
  let metadataExportService: Record<string, jest.Mock>;
  let broadcastService: Record<string, jest.Mock>;
  let mapService: Record<string, jest.Mock>;
  let geometrySimplification: Record<string, any>;

  beforeEach(() => {
    mapOverlayState = {};
    mapErrorNotificationService = { displayMapApplicationError: jest.fn() };
    cacheHelperService = {
      getBaseUrlToKomMonitorDataAPI_spatialResource: jest.fn().mockReturnValue('http://dm'),
    };
    metadataFilterService = { displayableIndicators_keywordFiltered: [] };
    selectionState = {
      selectedIndicator: {},
      selectedSpatialUnit: { spatialUnitId: 'su-1', spatialUnitLevel: 'Stadtteil' },
      selectedDate: '2024-01-01',
    };
    georesourceStore = {
      getAvailableIndiWmsDatasets: jest.fn().mockReturnValue([]),
      setWmsLayerActive: jest.fn(),
      setWmsLayerInactive: jest.fn(),
    };
    spatialUnitStore = { availableSpatialUnits: [] };
    metadataExportService = { dateToTS: jest.fn((date: Date) => date.getTime()) };
    broadcastService = { broadcast: jest.fn() };
    mapService = { addWmsLayerToMap: jest.fn(), removeWmsLayerFromMap: jest.fn() };
    geometrySimplification = {
      simplifyGeometriesParameterName: 'simplify',
      simplifyGeometries: 'true',
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MapOverlayStateService, useValue: mapOverlayState },
        { provide: MapErrorNotificationService, useValue: mapErrorNotificationService },
        { provide: CacheHelperServiceService, useValue: cacheHelperService },
        { provide: MetadataFilterService, useValue: metadataFilterService },
        { provide: SelectionStateService, useValue: selectionState },
        { provide: GeoresourceMetadataStoreService, useValue: georesourceStore },
        { provide: SpatialUnitMetadataStoreService, useValue: spatialUnitStore },
        { provide: MetadataExportService, useValue: metadataExportService },
        { provide: BroadcastService, useValue: broadcastService },
        { provide: MapService, useValue: mapService },
        { provide: GeometrySimplificationService, useValue: geometrySimplification },
      ],
    });
    service = TestBed.inject(KommonitorDataSetupService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('toExportIndicator', () => {
    it('maps a dataset onto the exporting module Indicator shape', () => {
      const dataset = {
        indicatorId: 'i-1',
        indicatorName: 'Einwohnerzahl',
        applicableSpatialUnits: [{ spatialUnitId: 'su-1', spatialUnitName: 'Stadtteil' }],
        applicableDates: ['2024-01-01', '2023-01-01'],
      } as unknown as IndicatorsDataset;

      expect(service.toExportIndicator(dataset)).toEqual({
        id: 'i-1',
        name: 'Einwohnerzahl',
        spatialUnits: [{ id: 'su-1', name: 'Stadtteil' }],
        availableTimestamps: ['2024-01-01', '2023-01-01'],
      });
    });
  });

  it('prepNgbDates splits ISO date strings into NgbDateStruct', () => {
    expect(service.prepNgbDates(['2024-03-05'])).toEqual([{ year: 2024, month: 3, day: 5 }]);
  });

  it('tsToDateString extracts the year from a timestamp', () => {
    expect(service.tsToDateString(new Date(2024, 0, 1).getTime())).toBe(2024);
  });

  it('datePickerToDateSlider formats a NgbDateStruct as a German day/month/year label', () => {
    expect(service.datePickerToDateSlider({ year: 2024, month: 3, day: 5 })).toBe('5. März 2024');
  });

  it('dateStringToMs round-trips a datePickerToDateSlider label back to the original date', () => {
    // Month and day both >= 10, outside any DST transition: dateStringToMs builds
    // a non-zero-padded ISO string, which `new Date(...)` only parses for two-digit
    // month/day (see the dateStringToMs single-digit month/day finding reported
    // separately - month 1-9 or day 1-9 makes it return NaN).
    const label = service.datePickerToDateSlider({ year: 2024, month: 11, day: 15 });
    const ms = service.dateStringToMs(label);
    const roundTripped = new Date(ms);
    expect(roundTripped.getFullYear()).toBe(2024);
    expect(roundTripped.getMonth()).toBe(10);
    expect(roundTripped.getDate()).toBe(15);
  });

  describe('prepTopicsTree', () => {
    it('annotates every node with its level and parent, recursively', () => {
      const tree = [{ topicId: 't-root', subTopics: [{ topicId: 't-child', subTopics: [] }] }];

      service.prepTopicsTree(tree, 0, undefined);

      expect(tree[0]).toMatchObject({ level: 0, parent: undefined });
      expect(tree[0].subTopics[0]).toMatchObject({ level: 1, parent: 't-root' });
    });
  });

  describe('prepareKeywordFilteredList', () => {
    it('merges indicators and wms datasets, tagging each with its listType', () => {
      metadataFilterService.displayableIndicators_keywordFiltered = [
        { indicatorId: 'i-1', indicatorName: 'Zebra' },
      ];
      georesourceStore['getAvailableIndiWmsDatasets'].mockReturnValue([
        { id: 'w-1', title: 'Apfel' },
      ]);

      const result = service.prepareKeywordFilteredList();

      expect(result.map((e: any) => e.listType)).toEqual(['wms', 'indicator']);
    });

    it('sorts the combined list alphabetically by name/title, case-insensitively', () => {
      metadataFilterService.displayableIndicators_keywordFiltered = [
        { indicatorId: 'i-1', indicatorName: 'zebra' },
        { indicatorId: 'i-2', indicatorName: 'Apfel' },
      ];

      const result = service.prepareKeywordFilteredList();

      expect(result.map((e: any) => e.indicatorId)).toEqual(['i-2', 'i-1']);
    });
  });

  describe('prepareIndicatorTopicsRecursive', () => {
    const topic = (overrides: Partial<IndicatorsTopicsHierarchy>): IndicatorsTopicsHierarchy =>
      ({ subTopics: [], indicatorCount: 1, ...overrides }) as unknown as IndicatorsTopicsHierarchy;

    it('drops topics with no indicators', () => {
      const tree = [topic({ topicId: 't-empty', indicatorCount: 0 }), topic({ topicId: 't-full' })];

      expect(
        service.prepareIndicatorTopicsRecursive(tree, undefined).map((t) => t.topicId)
      ).toEqual(['t-full']);
    });

    it('sorts by displayOrder when topicSorting is custom', () => {
      const tree = [
        topic({ topicId: 't-2', displayOrder: 2 } as any),
        topic({ topicId: 't-1', displayOrder: 1 } as any),
      ];

      expect(service.prepareIndicatorTopicsRecursive(tree, 'custom').map((t) => t.topicId)).toEqual(
        ['t-1', 't-2']
      );
    });

    it('sorts alphabetically when topicSorting is alphabetical', () => {
      const tree = [
        topic({ topicId: 't-b', topicName: 'Zebra' } as any),
        topic({ topicId: 't-a', topicName: 'Apfel' } as any),
      ];

      expect(
        service.prepareIndicatorTopicsRecursive(tree, 'alphabetical').map((t) => t.topicId)
      ).toEqual(['t-a', 't-b']);
    });

    it('recurses into subTopics', () => {
      const tree = [
        topic({
          topicId: 't-root',
          subTopics: [topic({ topicId: 't-child', indicatorCount: 0 })],
        }),
      ];

      const [root] = service.prepareIndicatorTopicsRecursive(tree, undefined);
      expect(root.subTopics).toEqual([]);
    });
  });

  describe('isTopicContainingSelectedIndicator', () => {
    const baseTopic = (overrides: Partial<IndicatorsTopicsHierarchy> = {}) =>
      ({
        indicatorData: [],
        wmsData: [],
        subTopics: [],
        ...overrides,
      }) as unknown as IndicatorsTopicsHierarchy;

    it('is true when the topic directly contains the selected indicator', () => {
      selectionState.selectedIndicator = { indicatorId: 'i-1' };
      const topicNode = baseTopic({ indicatorData: [{ indicatorId: 'i-1' }] as any });

      expect(service.isTopicContainingSelectedIndicator(topicNode)).toBe(true);
    });

    it('is true when the topic has a selected WMS dataset', () => {
      selectionState.selectedIndicator = { indicatorId: 'i-1' };
      const topicNode = baseTopic({ wmsData: [{ isSelected: true }] as any });

      expect(service.isTopicContainingSelectedIndicator(topicNode)).toBe(true);
    });

    it('recurses into subTopics', () => {
      selectionState.selectedIndicator = { indicatorId: 'i-1' };
      const topicNode = baseTopic({
        subTopics: [baseTopic({ indicatorData: [{ indicatorId: 'i-1' }] as any })],
      });

      expect(service.isTopicContainingSelectedIndicator(topicNode)).toBe(true);
    });

    it('is false when neither the topic nor its subTopics match', () => {
      selectionState.selectedIndicator = { indicatorId: 'i-1' };
      const topicNode = baseTopic();

      expect(service.isTopicContainingSelectedIndicator(topicNode)).toBe(false);
    });
  });

  describe('getFirstSpatialUnitForSelectedIndicator', () => {
    it('returns the first available spatial unit applicable to the selected indicator', () => {
      selectionState.selectedIndicator = {
        applicableSpatialUnits: [{ spatialUnitName: 'Stadtteil' }],
      };
      spatialUnitStore.availableSpatialUnits = [
        { spatialUnitLevel: 'Gesamtstadt' },
        { spatialUnitLevel: 'Stadtteil' },
      ];

      expect(service.getFirstSpatialUnitForSelectedIndicator()).toEqual({
        spatialUnitLevel: 'Stadtteil',
      });
    });

    it('returns undefined when no available spatial unit matches', () => {
      selectionState.selectedIndicator = { applicableSpatialUnits: [] };
      spatialUnitStore.availableSpatialUnits = [{ spatialUnitLevel: 'Gesamtstadt' }];

      expect(service.getFirstSpatialUnitForSelectedIndicator()).toBeUndefined();
    });
  });

  describe('createDatesFromIndicatorDates', () => {
    it('converts each date string to a timestamp via MetadataExportService', () => {
      const result = service.createDatesFromIndicatorDates(['2024-01-01', '2023-06-15']);

      expect(metadataExportService['dateToTS']).toHaveBeenCalledTimes(2);
      expect(result).toEqual([new Date(2024, 0, 1).getTime(), new Date(2023, 5, 15).getTime()]);
    });

    it('drops entries MetadataExportService could not convert', () => {
      metadataExportService['dateToTS'].mockReturnValueOnce(undefined);

      expect(service.createDatesFromIndicatorDates(['2024-01-01'])).toEqual([]);
    });
  });

  describe('modifyExports', () => {
    it('resets the overlay urls, then sets them from the matching ogc service entry', () => {
      selectionState.selectedSpatialUnit = { spatialUnitLevel: 'Stadtteil' };
      selectionState.selectedIndicator = {
        ogcServices: [
          { spatialUnit: 'Gesamtstadt', wmsUrl: 'other-wms', wfsUrl: 'other-wfs' },
          { spatialUnit: 'Stadtteil', wmsUrl: 'wms-url', wfsUrl: 'wfs-url' },
        ],
      };

      service.modifyExports(false);

      expect(mapOverlayState['wmsUrlForSelectedIndicator']).toBe('wms-url');
      expect(mapOverlayState['wfsUrlForSelectedIndicator']).toBe('wfs-url');
    });

    it('leaves the urls undefined when no ogc service entry matches the selected spatial unit', () => {
      selectionState.selectedSpatialUnit = { spatialUnitLevel: 'Stadtbezirk' };
      selectionState.selectedIndicator = {
        ogcServices: [{ spatialUnit: 'Gesamtstadt', wmsUrl: 'other-wms', wfsUrl: 'other-wfs' }],
      };

      service.modifyExports(false);

      expect(mapOverlayState['wmsUrlForSelectedIndicator']).toBeUndefined();
      expect(mapOverlayState['wfsUrlForSelectedIndicator']).toBeUndefined();
    });

    it('broadcasts the balance slider update with the currently selected date', () => {
      selectionState.selectedIndicator = { ogcServices: [] };

      service.modifyExports(true);

      expect(broadcastService['broadcast']).toHaveBeenCalledWith(
        BroadcastMessage.UpdateBalanceSlider,
        ['2024-01-01']
      );
    });
  });

  it('updateIndicatorOgcServices sets both overlay urls directly', () => {
    service.updateIndicatorOgcServices(['wms-url', 'wfs-url']);

    expect(mapOverlayState['wmsUrlForSelectedIndicator']).toBe('wms-url');
    expect(mapOverlayState['wfsUrlForSelectedIndicator']).toBe('wfs-url');
  });

  describe('handleWmsOnMap', () => {
    it('adds the layer to the map and marks it active when selected', () => {
      const dataset = { isSelected: true, transparency: 0.25 } as unknown as WmsDataset;

      service.handleWmsOnMap(dataset);

      expect(mapOverlayState['wmsLegendImage']).toBeUndefined();
      expect(mapService['addWmsLayerToMap']).toHaveBeenCalledWith(
        dataset,
        0.75,
        expect.objectContaining({ remove: expect.any(Function) })
      );
      expect(georesourceStore['setWmsLayerActive']).toHaveBeenCalledWith(dataset);
    });

    it('removes the layer from the map and marks it inactive when deselected', () => {
      const dataset = { isSelected: false, transparency: 0 } as unknown as WmsDataset;

      service.handleWmsOnMap(dataset);

      expect(mapService['removeWmsLayerFromMap']).toHaveBeenCalledWith(dataset);
      expect(georesourceStore['setWmsLayerInactive']).toHaveBeenCalledWith(dataset);
    });

    it("the layer's remove callback deselects it and re-runs handleWmsOnMap", () => {
      const dataset = { isSelected: true, transparency: 0 } as unknown as WmsDataset;

      service.handleWmsOnMap(dataset);
      const { remove } = mapService['addWmsLayerToMap'].mock.calls[0][2];
      remove();

      expect(dataset.isSelected).toBe(false);
      expect(mapService['removeWmsLayerFromMap']).toHaveBeenCalledWith(dataset);
    });
  });

  describe('fetchIndicatorGeoJson', () => {
    it('requests the indicator geojson for the selected spatial unit and date', () => {
      selectionState.selectedIndicator = { indicatorId: 'i-1' };

      service.fetchIndicatorGeoJson('2024-01-02').subscribe();

      const req = http.expectOne('http://dm/indicators/i-1/su-1/2024/01/02?simplify=true');
      req.flush({ type: 'FeatureCollection', features: [] });
    });

    it('throws and surfaces a map error when a required parameter is missing', () => {
      selectionState.selectedIndicator = { indicatorId: 'i-1' };
      selectionState.selectedSpatialUnit = undefined;

      expect(() => service.fetchIndicatorGeoJson('2024-01-02')).toThrow();
      expect(mapErrorNotificationService['displayMapApplicationError']).toHaveBeenCalled();
    });
  });
});
