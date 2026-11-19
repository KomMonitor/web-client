import { TestBed } from '@angular/core/testing';

import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { FavService } from 'services/fav-service/fav.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';

import { GeoresourceFavoritesService } from './georesource-favorites.service';

describe('GeoresourceFavoritesService', () => {
  let service: GeoresourceFavoritesService;
  let favService: Record<string, jest.Mock>;
  let broadcastService: Record<string, jest.Mock>;
  let topicHierarchyStore: { topicGeoresourceHierarchy: any[] };

  beforeEach(() => {
    topicHierarchyStore = { topicGeoresourceHierarchy: [] };
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
    service = TestBed.inject(GeoresourceFavoritesService);
  });

  describe('initFromUserInfo', () => {
    it('adopts poi/wms favourites into both the live and fav-tab lists', () => {
      favService['getUserInfo'].mockReturnValue({
        georesourceFavourites: ['g-1'],
        webServiceFavourites: ['w-1'],
      });

      service.initFromUserInfo();

      expect(service.poiFavItems).toEqual(['g-1']);
      expect(service.wmsFavItems).toEqual(['w-1']);
      expect(service.FavTabPoiFavItems).toEqual(['g-1']);
      expect(service.FavTabWmsFavItems).toEqual(['w-1']);
    });

    it('adopts topic favourites independently of poi/wms favourites', () => {
      favService['getUserInfo'].mockReturnValue({ georesourceTopicFavourites: ['t-1'] });

      service.initFromUserInfo();

      expect(service.georesourceTopicFavItems).toEqual(['t-1']);
      expect(service.FavTabGeoresourceTopicFavItems).toEqual(['t-1']);
      expect(service.poiFavItems).toEqual([]);
    });

    it('leaves the defaults untouched when the user info carries no favourites', () => {
      favService['getUserInfo'].mockReturnValue({});

      service.initFromUserInfo();

      expect(service.poiFavItems).toEqual([]);
      expect(service.georesourceTopicFavItems).toEqual([]);
    });
  });

  describe('buildFavTopicsTree / prepTopicsTree', () => {
    it('annotates every node with its level and parent, recursively', () => {
      topicHierarchyStore.topicGeoresourceHierarchy = [
        { topicId: 't-root', subTopics: [{ topicId: 't-child', subTopics: [] }] },
      ];

      service.buildFavTopicsTree();

      const [root] = service.georesourceFavTopicsTree;
      expect(root).toMatchObject({ level: 0, parent: undefined });
      expect(root.subTopics[0]).toMatchObject({ level: 1, parent: 't-root' });
    });
  });

  describe('selection predicates', () => {
    beforeEach(() => {
      service.georesourceTopicFavItems = ['t-1'];
      service.poiFavItems = ['g-1'];
      service.wmsFavItems = ['w-1'];
    });

    it('georesourceTopicFavSelected checks membership by id', () => {
      expect(service.georesourceTopicFavSelected('t-1')).toBe(true);
      expect(service.georesourceTopicFavSelected('t-2')).toBe(false);
    });

    it('poiFavSelected accepts a single id or an array of entries carrying georesourceId', () => {
      expect(service.poiFavSelected('g-1')).toBe(true);
      expect(service.poiFavSelected('g-2')).toBe(false);
      expect(service.poiFavSelected([{ georesourceId: 'g-2' }, { georesourceId: 'g-1' }])).toBe(
        true
      );
      expect(service.poiFavSelected([{ georesourceId: 'g-2' }])).toBe(false);
    });

    it('wmsFavSelected accepts a single id or an array of entries carrying id', () => {
      expect(service.wmsFavSelected('w-1')).toBe(true);
      expect(service.wmsFavSelected([{ id: 'w-2' }, { id: 'w-1' }])).toBe(true);
      expect(service.wmsFavSelected([{ id: 'w-2' }])).toBe(false);
    });
  });

  describe('onPoiFavClick / onWmsFavClick', () => {
    it('toggles the poi id in and out of poiFavItems', () => {
      service.onPoiFavClick('g-1');
      expect(service.poiFavItems).toEqual(['g-1']);

      service.onPoiFavClick('g-1');
      expect(service.poiFavItems).toEqual([]);
    });

    it('toggles the wms id in and out of wmsFavItems', () => {
      service.onWmsFavClick('w-1');
      expect(service.wmsFavItems).toEqual(['w-1']);

      service.onWmsFavClick('w-1');
      expect(service.wmsFavItems).toEqual([]);
    });

    it('persists the current selection shape through FavService', () => {
      service.onPoiFavClick('g-1');

      expect(favService['handleFavSelection']).toHaveBeenCalledWith({
        georesourceTopicFavourites: [],
        georesourceFavourites: ['g-1'],
      });
    });
  });

  describe('onGeoresourceTopicFavClick', () => {
    it('selects a nested topic and marks it unsaved', () => {
      topicHierarchyStore.topicGeoresourceHierarchy = [
        { topicId: 't-root', subTopics: [{ topicId: 't-child', subTopics: [] }] },
      ];

      service.onGeoresourceTopicFavClick('t-child');

      expect(service.georesourceTopicFavItems).toEqual(['t-child']);
      expect(service.toastStatus).toBe(1);
    });

    it('deselects an already-selected topic', () => {
      topicHierarchyStore.topicGeoresourceHierarchy = [{ topicId: 't-1', subTopics: [] }];

      service.onGeoresourceTopicFavClick('t-1');
      service.onGeoresourceTopicFavClick('t-1');

      expect(service.georesourceTopicFavItems).toEqual([]);
    });
  });

  describe('onHandleFavSelection', () => {
    it('syncs the fav-tab copies when not called from the fav tab itself', () => {
      service.georesourceTopicFavItems = ['t-1'];
      service.poiFavItems = ['g-1'];

      service.onHandleFavSelection(false);

      expect(service.FavTabGeoresourceTopicFavItems).toEqual(['t-1']);
      expect(service.FavTabPoiFavItems).toEqual(['g-1']);
    });

    it('leaves the fav-tab copies as-is when called from the fav tab', () => {
      service.FavTabGeoresourceTopicFavItems = ['t-old'];
      service.georesourceTopicFavItems = ['t-new'];

      service.onHandleFavSelection(true);

      expect(service.FavTabGeoresourceTopicFavItems).toEqual(['t-old']);
    });
  });

  describe('onSaveFavSelection / favItemsStored', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('persists and broadcasts when asked to, then resets the toast after a delay', () => {
      service.poiFavItems = ['g-1'];

      service.onSaveFavSelection([true]);

      expect(favService['storeFavSelection']).toHaveBeenCalled();
      expect(service.FavTabPoiFavItems).toEqual(['g-1']);
      expect(broadcastService['broadcast']).toHaveBeenCalledWith(
        BroadcastMessage.GeoFavItemsStored,
        [false]
      );
      expect(service.toastStatus).toBe(2);

      jest.advanceTimersByTime(1000);
      expect(service.toastStatus).toBe(0);
    });

    it('syncs the fav-tab copies but skips persistence/broadcast when asked not to', () => {
      service.onSaveFavSelection([false]);

      expect(favService['storeFavSelection']).not.toHaveBeenCalled();
      expect(broadcastService['broadcast']).not.toHaveBeenCalled();
      expect(service.toastStatus).toBe(2);
    });

    it('favItemsStored syncs the fav-tab copies without persisting or broadcasting', () => {
      service.favItemsStored();

      expect(favService['storeFavSelection']).not.toHaveBeenCalled();
      expect(broadcastService['broadcast']).not.toHaveBeenCalled();
    });
  });

  describe('checkGeoresourceDataFavItems', () => {
    it('adds the georesourceId of every poi/aoi/loi entry when selecting', () => {
      const entry = {
        poiData: [{ georesourceId: 'g-poi' }],
        aoiData: [{ georesourceId: 'g-aoi' }],
        loiData: [{ georesourceId: 'g-loi' }],
      };

      service.checkGeoresourceDataFavItems(entry, true);

      expect(service.poiFavItems.sort()).toEqual(['g-aoi', 'g-loi', 'g-poi']);
    });

    it('removes them again when deselecting', () => {
      service.poiFavItems = ['g-poi', 'g-other'];
      const entry = { poiData: [{ georesourceId: 'g-poi' }], aoiData: [], loiData: [] };

      service.checkGeoresourceDataFavItems(entry, false);

      expect(service.poiFavItems).toEqual(['g-other']);
    });
  });

  describe('checkGeoresourceTopicFavItemsRecursive', () => {
    it('selects every topic in the tree plus their poi/aoi/loi data', () => {
      const tree = [
        {
          topicId: 't-1',
          poiData: [{ georesourceId: 'g-1' }],
          aoiData: [],
          loiData: [],
          subTopics: [{ topicId: 't-1-1', poiData: [], aoiData: [], loiData: [], subTopics: [] }],
        },
      ];

      service.checkGeoresourceTopicFavItemsRecursive(tree, true);

      expect(service.georesourceTopicFavItems.sort()).toEqual(['t-1', 't-1-1']);
      expect(service.poiFavItems).toEqual(['g-1']);
    });
  });

  describe('fav-tab visibility helpers', () => {
    let root: any;
    let child: any;

    beforeEach(() => {
      root = {
        topicId: 't-root',
        poiData: [],
        aoiData: [],
        loiData: [],
        wmsData: [],
        subTopics: [
          {
            topicId: 't-child',
            poiData: [{ georesourceId: 'g-1' }],
            aoiData: [],
            loiData: [],
            wmsData: [{ id: 'w-1' }],
            subTopics: [],
          },
        ],
      };
      child = root.subTopics[0];

      topicHierarchyStore.topicGeoresourceHierarchy = [root];
      service.buildFavTopicsTree();
      // buildFavTopicsTree re-preps the tree in place, so re-grab the annotated nodes.
      root = service.georesourceFavTopicsTree[0];
      child = root.subTopics[0];
    });

    it('favTabShowTopic is false when nothing underneath is favourited', () => {
      expect(service.favTabShowTopic(child)).toBe(false);
    });

    it('favTabShowTopic is true when a descendant poi is favourited', () => {
      service.FavTabPoiFavItems = ['g-1'];
      expect(service.favTabShowTopic(child)).toBe(true);
    });

    it('favTabShowTopic is true when a descendant wms dataset is favourited', () => {
      service.FavTabWmsFavItems = ['w-1'];
      expect(service.favTabShowTopic(child)).toBe(true);
    });

    it('favTabShowTopic is true when the topic itself is a favourite', () => {
      service.FavTabGeoresourceTopicFavItems = ['t-child'];
      expect(service.favTabShowTopic(child)).toBe(true);
    });

    it('topicInFavTopBottom is true when an ancestor topic is favourited', () => {
      service.FavTabGeoresourceTopicFavItems = ['t-root'];
      expect(service.topicInFavTopBottom(child)).toBe(true);
    });

    it('FavTabShowPOIHeader is true when any of poi/aoi/loi/wms data is favourited', () => {
      service.FavTabWmsFavItems = ['w-1'];
      expect(service.FavTabShowPOIHeader(child)).toBe(true);
    });

    it('FavTabShowPoi is true when the given georesourceId is favourited', () => {
      service.FavTabPoiFavItems = ['g-1'];
      expect(service.FavTabShowPoi(child, 'g-1')).toBe(true);
      expect(service.FavTabShowPoi(child, 'g-other')).toBe(false);
    });
  });

  it('georesourceInFavItems checks georesourceId membership across a list of entries', () => {
    expect(
      service.georesourceInFavItems([{ georesourceId: 'g-1' }, { georesourceId: 'g-2' }], ['g-2'])
    ).toBe(true);
    expect(service.georesourceInFavItems([{ georesourceId: 'g-1' }], ['g-2'])).toBe(false);
  });

  it('wmsInFavItems checks id membership across a list of wms datasets', () => {
    expect(service.wmsInFavItems([{ id: 'w-1' } as any, { id: 'w-2' } as any], ['w-2'])).toBe(true);
    expect(service.wmsInFavItems([{ id: 'w-1' } as any], ['w-2'])).toBe(false);
  });
});
