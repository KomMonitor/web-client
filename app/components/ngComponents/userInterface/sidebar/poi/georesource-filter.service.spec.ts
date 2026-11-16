import { TestBed } from '@angular/core/testing';

import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';

import { GeoresourceFavoritesService } from './georesource-favorites.service';
import { GeoresourceFilterService } from './georesource-filter.service';

describe('GeoresourceFilterService', () => {
  let service: GeoresourceFilterService;
  let georesourceStore: Record<string, jest.Mock>;
  let favoritesService: Record<string, jest.Mock>;
  let topicHierarchyStore: { topicGeoresourceHierarchy: any[] };

  beforeEach(() => {
    topicHierarchyStore = { topicGeoresourceHierarchy: [] };
    georesourceStore = { onChangeGeoresourceKeywordFilter: jest.fn() };
    favoritesService = { buildFavTopicsTree: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: EnvConfigService,
          useValue: {
            enabledGeoresourcesInfrastructure: ['poi', 'aoi'],
            enabledGeoresourcesGeoservices: ['wms'],
          },
        },
        { provide: GeoresourceMetadataStoreService, useValue: georesourceStore },
        { provide: TopicHierarchyStoreService, useValue: topicHierarchyStore },
        { provide: GeoresourceFavoritesService, useValue: favoritesService },
      ],
    });
    service = TestBed.inject(GeoresourceFilterService);
  });

  it('derives the per-type visibility flags from the env config lists', () => {
    expect(service.showPOI).toBe(true);
    expect(service.showAOI).toBe(true);
    expect(service.showLOI).toBe(false);
    expect(service.showWMS).toBe(true);
    expect(service.showWFS).toBe(false);
  });

  describe('refreshPreppedHierarchy', () => {
    it('drops topics with a zero total count', () => {
      topicHierarchyStore.topicGeoresourceHierarchy = [
        { topicId: 't-empty', totalCount: 0, poiData: [], aoiData: [], loiData: [], subTopics: [] },
        { topicId: 't-full', totalCount: 1, poiData: [], aoiData: [], loiData: [], subTopics: [] },
      ];

      service.refreshPreppedHierarchy();

      expect(service.preppedTopicGeoresourceHierarchy.map((e: any) => e.topicId)).toEqual([
        't-full',
      ]);
    });

    it('seeds selectedDate from the first available period for poi/aoi/loi entries', () => {
      const poi = { georesourceId: 'g-poi', availablePeriodsOfValidity: ['2024-01-01'] };
      const aoi = { georesourceId: 'g-aoi', availablePeriodsOfValidity: ['2024-02-01'] };
      const loi = { georesourceId: 'g-loi', availablePeriodsOfValidity: ['2024-03-01'] };
      topicHierarchyStore.topicGeoresourceHierarchy = [
        {
          topicId: 't-1',
          totalCount: 3,
          poiData: [poi],
          aoiData: [aoi],
          loiData: [loi],
          subTopics: [],
        },
      ];

      service.refreshPreppedHierarchy();

      const [topic] = service.preppedTopicGeoresourceHierarchy;
      expect(topic.poiData[0].selectedDate).toBe('2024-01-01');
      expect(topic.aoiData[0].selectedDate).toBe('2024-02-01');
      expect(topic.loiData[0].selectedDate).toBe('2024-03-01');
    });

    it('recurses into subTopics', () => {
      const childPoi = { georesourceId: 'g-child', availablePeriodsOfValidity: ['2024-04-01'] };
      topicHierarchyStore.topicGeoresourceHierarchy = [
        {
          topicId: 't-parent',
          totalCount: 1,
          poiData: [],
          aoiData: [],
          loiData: [],
          subTopics: [
            {
              topicId: 't-child',
              totalCount: 1,
              poiData: [childPoi],
              aoiData: [],
              loiData: [],
              subTopics: [],
            },
          ],
        },
      ];

      service.refreshPreppedHierarchy();

      const [parent] = service.preppedTopicGeoresourceHierarchy;
      expect(parent.subTopics[0].poiData[0].selectedDate).toBe('2024-04-01');
    });
  });

  describe('onChangeGeoresourceKeywordFilter', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('forwards the keyword and per-type flags to the metadata store', () => {
      service.georesourceNameFilter.value = 'Schule';

      service.onChangeGeoresourceKeywordFilter();

      expect(georesourceStore['onChangeGeoresourceKeywordFilter']).toHaveBeenCalledWith(
        'Schule',
        true,
        false,
        true,
        true,
        false
      );
    });

    it('rebuilds the prepped hierarchy and the favourites topic tree after the debounce delay', () => {
      const refreshSpy = jest.spyOn(service, 'refreshPreppedHierarchy');

      service.onChangeGeoresourceKeywordFilter();
      expect(refreshSpy).not.toHaveBeenCalled();
      expect(favoritesService['buildFavTopicsTree']).not.toHaveBeenCalled();

      jest.advanceTimersByTime(250);

      expect(refreshSpy).toHaveBeenCalled();
      expect(favoritesService['buildFavTopicsTree']).toHaveBeenCalled();
    });
  });
});
