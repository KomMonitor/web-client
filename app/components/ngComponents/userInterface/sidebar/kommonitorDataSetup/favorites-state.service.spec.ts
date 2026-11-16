import { TestBed } from '@angular/core/testing';

import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { FavService } from 'services/fav-service/fav.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';

import { FavoritesStateService } from './favorites-state.service';

describe('FavoritesStateService', () => {
  let service: FavoritesStateService;
  let favService: Record<string, jest.Mock>;
  let broadcastService: Record<string, jest.Mock>;
  let topicHierarchyStore: { topicIndicatorHierarchy: any[]; headlineIndicatorHierarchy: any[] };

  beforeEach(() => {
    topicHierarchyStore = { topicIndicatorHierarchy: [], headlineIndicatorHierarchy: [] };
    favService = {
      getUserInfo: jest.fn().mockReturnValue({}),
      handleFavSelection: jest.fn(),
      storeFavSelection: jest.fn(),
    };
    broadcastService = { broadcast: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: FavService, useValue: favService },
        { provide: TopicHierarchyStoreService, useValue: topicHierarchyStore },
        { provide: BroadcastService, useValue: broadcastService },
      ],
    });
    service = TestBed.inject(FavoritesStateService);
  });

  describe('initFromUserInfo', () => {
    it('adopts favourites present on the user info', () => {
      favService['getUserInfo'].mockReturnValue({
        indicatorFavourites: ['i-1'],
        indicatorTopicFavourites: ['t-1'],
      });

      service.initFromUserInfo();

      expect(service.indicatorFavItems).toEqual(['i-1']);
      expect(service.indicatorTopicFavItems).toEqual(['t-1']);
    });

    it('leaves the defaults untouched when the user info carries no favourites', () => {
      favService['getUserInfo'].mockReturnValue({});

      service.initFromUserInfo();

      expect(service.indicatorFavItems).toEqual([]);
      expect(service.indicatorTopicFavItems).toEqual([]);
    });
  });

  it('isIndicatorFavSelected reflects membership in indicatorFavItems', () => {
    service.indicatorFavItems = ['i-1'];
    expect(service.isIndicatorFavSelected('i-1')).toBe(true);
    expect(service.isIndicatorFavSelected('i-2')).toBe(false);
  });

  describe('onIndicatorFavClick', () => {
    it('toggles the indicator in and back out of the favourites', () => {
      service.onIndicatorFavClick('i-1');
      expect(service.indicatorFavItems).toEqual(['i-1']);

      service.onIndicatorFavClick('i-1');
      expect(service.indicatorFavItems).toEqual([]);
    });

    it('persists the current selection shape and marks it unsaved', () => {
      service.wmsFavItems = ['w-1'];

      service.onIndicatorFavClick('i-1');

      expect(favService['handleFavSelection']).toHaveBeenCalledWith({
        indicatorTopicFavourites: [],
        indicatorFavourites: ['i-1'],
        webServiceFavourites: ['w-1'],
      });
      expect(service.toastStatus).toBe(1);
    });
  });

  it('onWmsFavClick toggles the wms favourite independently of indicator favourites', () => {
    service.onWmsFavClick('w-1');
    expect(service.wmsFavItems).toEqual(['w-1']);
    expect(service.indicatorFavItems).toEqual([]);
  });

  describe('onIndicatorTopicFavClick', () => {
    it('adds the matching topic id, including a nested subTopic', () => {
      topicHierarchyStore.topicIndicatorHierarchy = [
        { topicId: 't-root', subTopics: [{ topicId: 't-child', subTopics: [] }] },
      ];

      service.onIndicatorTopicFavClick('t-child');

      expect(service.indicatorTopicFavItems).toEqual(['t-child']);
    });

    it('removes the topic id on a second click', () => {
      topicHierarchyStore.topicIndicatorHierarchy = [{ topicId: 't-1', subTopics: [] }];

      service.onIndicatorTopicFavClick('t-1');
      service.onIndicatorTopicFavClick('t-1');

      expect(service.indicatorTopicFavItems).toEqual([]);
    });
  });

  describe('onHeadlineIndicatorFavClick', () => {
    beforeEach(() => {
      topicHierarchyStore.headlineIndicatorHierarchy = [
        {
          headlineIndicator: { indicatorId: 'headline-1' },
          baseIndicators: [{ indicatorId: 'base-1' }, { indicatorId: 'base-2' }],
        },
      ];
    });

    it('selects the headline indicator together with its base indicators', () => {
      service.onHeadlineIndicatorFavClick('headline-1');

      expect(service.indicatorFavItems).toEqual(
        expect.arrayContaining(['headline-1', 'base-1', 'base-2'])
      );
    });

    it('deselects the headline indicator together with its base indicators', () => {
      service.indicatorFavItems = ['headline-1', 'base-1', 'base-2'];

      service.onHeadlineIndicatorFavClick('headline-1');

      expect(service.indicatorFavItems).toEqual([]);
    });
  });

  it('onBaseIndicatorFavClick toggles only the given id', () => {
    service.indicatorFavItems = ['headline-1'];

    service.onBaseIndicatorFavClick('base-1');

    expect(service.indicatorFavItems).toEqual(['headline-1', 'base-1']);
  });

  describe('saveFavSelection', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('persists and broadcasts when asked to, then resets the toast after a delay', () => {
      service.saveFavSelection(true);

      expect(favService['storeFavSelection']).toHaveBeenCalled();
      expect(broadcastService['broadcast']).toHaveBeenCalledWith(BroadcastMessage.FavItemsStored, [
        false,
      ]);
      expect(service.toastStatus).toBe(2);

      jest.advanceTimersByTime(1000);
      expect(service.toastStatus).toBe(0);
    });

    it('only updates the toast when not asked to persist', () => {
      service.saveFavSelection(false);

      expect(favService['storeFavSelection']).not.toHaveBeenCalled();
      expect(broadcastService['broadcast']).not.toHaveBeenCalled();
      expect(service.toastStatus).toBe(2);
    });
  });
});
