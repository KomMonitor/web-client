import { TestBed } from '@angular/core/testing';
import { MandantService } from 'services/mandant-service/mandant.service';
import { SpatialUnitHierarchyApiService } from 'services/spatial-unit-hierarchy-service/spatial-unit-hierarchy-api.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { hierarchyFixture, hierarchyOverview, levelFixture } from './hierarchy.fixture';
import { HierarchyStoreService } from './hierarchy-store.service';
import { RegisteredLevel, SpatialUnitHierarchy } from './hierarchy.model';

/**
 * The page's state on its own: no fixture, no DOM, no dialogs. What the page
 * makes of this state is tested in `admin-spatial-unit-hierarchies.component.spec`,
 * the chain and tenant rules underneath it in `hierarchy.model` and
 * `hierarchy-selectors`.
 */

/** What the store asks `MandantService`, answered from plain values. */
interface Mandants {
  keycloakMandants: readonly string[];
  mandantRefs: readonly { id: string; name: string }[];
  isRealmAdmin: boolean;
  ownMandant: string;
  mandantsToOffer(known: readonly string[]): readonly string[];
  mandantIdOf(name: string): string;
  mandantNameOf(id: string): string;
}

/** The write calls the store makes, recorded and answerable per spec. */
let hierarchyApi: {
  getHierarchies: jest.Mock;
  createHierarchy: jest.Mock;
  updateHierarchy: jest.Mock;
  deleteHierarchy: jest.Mock;
  updateMembers: jest.Mock;
};

/** The spatial units the level registry is derived from. */
let spatialUnits: {
  spatialUnitId: string;
  spatialUnitLevel: string;
  mandantId: string;
  metadata: { datasource: string };
}[] = [];

/**
 * A store on its own, with the tenants Keycloak would name. The store reads
 * `ownMandant` in its constructor, so the fake is in place before it is built.
 * The API answers with nothing; the specs seed the hierarchies themselves.
 */
function storeWith(mandants: Partial<Mandants> = {}): HierarchyStoreService {
  const fake: Mandants = {
    keycloakMandants: [],
    mandantRefs: [],
    isRealmAdmin: false,
    ownMandant: '',
    mandantsToOffer: (known) => known,
    // The specs use the tenant name as its id, so a hierarchy keeps grouping
    // by the same string whichever direction it is read from.
    mandantIdOf: (name) => name,
    mandantNameOf: (id) => id,
    ...mandants,
  };
  spatialUnits = [];
  hierarchyApi = {
    // Left hanging on purpose: the store loads in its constructor, and a load
    // that resolves would replace the seed these specs set right afterwards.
    // The one spec about loading brings its own, resolving fake.
    getHierarchies: jest.fn().mockReturnValue(new Promise<never[]>(() => undefined)),
    // Answers like the server: the created record, with the member levels
    // resolved. The fixture ids are `id-<name>`, so the name reads back off them.
    createHierarchy: jest.fn().mockImplementation((body) =>
      Promise.resolve({
        ...body,
        hierarchyId: 'h-created',
        members: (body.members ?? []).map(
          (member: { spatialUnitId: string; hierarchyLevel: number }) => ({
            ...member,
            spatialUnitLevel: member.spatialUnitId.replace(/^id-/, ''),
          })
        ),
      })
    ),
    updateHierarchy: jest.fn().mockResolvedValue({}),
    deleteHierarchy: jest.fn().mockResolvedValue(undefined),
    updateMembers: jest.fn().mockResolvedValue({}),
  };
  TestBed.configureTestingModule({
    providers: [
      HierarchyStoreService,
      { provide: MandantService, useValue: fake },
      { provide: SpatialUnitHierarchyApiService, useValue: hierarchyApi },
      {
        provide: SpatialUnitMetadataStoreService,
        useValue: {
          get availableSpatialUnits() {
            return spatialUnits;
          },
        },
      },
    ],
  });
  return TestBed.inject(HierarchyStoreService);
}

function hierarchy(name: string, mandant: string, levels: string[]): SpatialUnitHierarchy {
  return hierarchyFixture(name, mandant, levels);
}

function level(name: string, mandant: string): RegisteredLevel {
  return levelFixture(name, mandant);
}

/** Puts the store on data of this spec's own. */
function seed(
  store: HierarchyStoreService,
  hierarchies: SpatialUnitHierarchy[],
  registry: RegisteredLevel[] = []
): void {
  store.hierarchies.set(hierarchies);
  spatialUnits = registry.map((entry) => ({
    spatialUnitId: entry.id,
    spatialUnitLevel: entry.name,
    mandantId: entry.mandant,
    metadata: { datasource: entry.datasource },
  }));
}

const ESSEN = () => hierarchy('Verwaltung Essen', 'Stadt Essen', ['Stadt', 'Bezirke']);
const BOCHUM = () => hierarchy('Verwaltung Bochum', 'Stadt Bochum', ['Stadt Bochum']);

describe('HierarchyStoreService', () => {
  describe('the tenant it starts in', () => {
    it('opens in the tenant the user belongs to', () => {
      expect(storeWith({ ownMandant: 'Stadt Essen' }).selectedMandant()).toBe('Stadt Essen');
    });

    it('opens in the overview where Keycloak names no tenant', () => {
      expect(storeWith().selectedMandant()).toBe('');
    });

    it('unfolds the hierarchies of that tenant — it is a view entered as well', () => {
      const store = storeWith({ ownMandant: 'Stadt Essen' });
      const own = ESSEN();
      const other = BOCHUM();
      // Straight into the signal: `selectMandant` is what the next test is about.
      store.hierarchies.set([own, other]);
      store.selectedMandant.set('');

      store.selectMandant('Stadt Essen');

      expect([own.open(), other.open()]).toEqual([true, false]);
    });
  });

  describe('loading from the API', () => {
    it('builds its hierarchies from what the API answers', async () => {
      TestBed.configureTestingModule({
        providers: [
          HierarchyStoreService,
          {
            provide: MandantService,
            useValue: {
              keycloakMandants: ['Stadt Essen'],
              mandantRefs: [{ id: 'm-1', name: 'Stadt Essen' }],
              isRealmAdmin: false,
              ownMandant: 'Stadt Essen',
              mandantsToOffer: (known: readonly string[]) => known,
              mandantIdOf: () => 'm-1',
              mandantNameOf: (id: string) => (id === 'm-1' ? 'Stadt Essen' : ''),
            },
          },
          {
            provide: SpatialUnitHierarchyApiService,
            useValue: {
              getHierarchies: () =>
                Promise.resolve([hierarchyOverview('Verwaltung', 'm-1', ['Stadt', 'Bezirke'])]),
            },
          },
          {
            provide: SpatialUnitMetadataStoreService,
            useValue: { availableSpatialUnits: [] },
          },
        ],
      });
      const store = TestBed.inject(HierarchyStoreService);
      await store.reload();

      expect(store.hierarchies()).toHaveLength(1);
      expect(store.hierarchies()[0].mandant()).toBe('Stadt Essen');
      expect(
        store
          .hierarchies()[0]
          .chain()
          .map((entry) => entry.name)
      ).toEqual(['Stadt', 'Bezirke']);
      // The tenant the user lands in is a view they enter as well.
      expect(store.hierarchies()[0].open()).toBe(true);
      expect(store.loading()).toBe(false);
    });

    it('falls back to the raw id where Keycloak names no tenant for it', async () => {
      const store = storeWith({ mandantNameOf: () => '' });
      TestBed.resetTestingModule();

      const built = hierarchyFixture('Verwaltung', 'm-unknown', ['Stadt']);

      expect(store).toBeTruthy();
      expect(built.mandant()).toBe('m-unknown');
    });
  });

  describe('canCreate', () => {
    it('is false where Keycloak names no tenant — mandantId is required', () => {
      expect(storeWith().canCreate()).toBe(false);
    });

    it('is true as soon as one tenant is known', () => {
      expect(storeWith({ mandantRefs: [{ id: 'm-1', name: 'Stadt Essen' }] }).canCreate()).toBe(
        true
      );
    });
  });

  describe('selectMandant', () => {
    it('unfolds every hierarchy of the tenant it switches to', () => {
      const store = storeWith();
      const first = hierarchy('Kreisgliederung', 'Kreis RE', ['Kreis']);
      const second = hierarchy('Rastergliederung', 'Kreis RE', ['Raster']);
      seed(store, [first, second]);

      store.selectMandant('Kreis RE');

      expect([first.open(), second.open()]).toEqual([true, true]);
    });

    it('leaves a folded hierarchy folded until the tenant is entered again', () => {
      const store = storeWith();
      const first = hierarchy('Kreisgliederung', 'Kreis RE', ['Kreis']);
      const second = hierarchy('Rastergliederung', 'Kreis RE', ['Raster']);
      seed(store, [first, second]);
      store.selectMandant('Kreis RE');

      second.open.set(false);
      expect([first.open(), second.open()]).toEqual([true, false]);

      // Leaving for the overview and coming back is entering the view anew.
      store.selectMandant('');
      store.selectMandant('Kreis RE');

      expect([first.open(), second.open()]).toEqual([true, true]);
    });

    it('unfolds nothing on the way to the overview', () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      store.selectMandant('');

      expect(essen.open()).toBe(false);
    });
  });

  describe('what the list shows', () => {
    it('narrows the hierarchies down to the tenant on screen', () => {
      const store = storeWith();
      seed(store, [ESSEN(), BOCHUM()]);

      store.selectMandant('Stadt Bochum');

      expect(store.visibleHierarchies().map((entry) => entry.name())).toEqual([
        'Verwaltung Bochum',
      ]);
    });

    it('shows the tenant overview in place of the list across all tenants', () => {
      const store = storeWith();
      seed(store, [ESSEN(), BOCHUM()]);

      store.selectMandant('');
      expect(store.showMandantOverview()).toBe(true);

      store.selectMandant('Stadt Essen');
      expect(store.showMandantOverview()).toBe(false);
    });

    it('keeps the list where the data knows no tenant — there is nothing to summarize', () => {
      const store = storeWith();
      seed(store, [hierarchy('Ohne Mandant', '', ['Stadt'])]);

      expect(store.selectedMandant()).toBe('');
      expect(store.showMandantOverview()).toBe(false);
      expect(store.visibleHierarchies()).toHaveLength(1);
    });

    it('counts the hierarchies, the distinct levels and the shared ones per tenant', () => {
      const store = storeWith({ keycloakMandants: ['Stadt Essen', 'Stadt Bochum'] });
      seed(store, [
        hierarchy('Verwaltung', 'Stadt Essen', ['Stadt', 'Bezirke', 'Stadtteile']),
        hierarchy('Sozialraum', 'Stadt Essen', ['Stadt', 'Bezirke', 'Quartiere']),
        BOCHUM(),
      ]);

      expect(store.mandantOverview()).toEqual([
        { name: 'Stadt Essen', hierarchyCount: 2, levelCount: 4, sharedLevelCount: 2 },
        { name: 'Stadt Bochum', hierarchyCount: 1, levelCount: 1, sharedLevelCount: 0 },
      ]);
      expect(store.mandantNames()).toEqual(['Stadt Essen', 'Stadt Bochum']);
    });
  });

  describe('canSwitchMandant', () => {
    it("is a platform administrator's view", () => {
      const store = storeWith({ isRealmAdmin: true });
      seed(store, [ESSEN()]);

      expect(store.canSwitchMandant()).toBe(true);
    });

    it('opens up without Keycloak as soon as the data holds more than one tenant', () => {
      const store = storeWith();
      seed(store, [ESSEN()]);
      expect(store.canSwitchMandant()).toBe(false);

      store.hierarchies.update((entries) => [...entries, BOCHUM()]);
      expect(store.canSwitchMandant()).toBe(true);
    });
  });

  describe('the level registry', () => {
    it('lists the tenant levels that no hierarchy uses', () => {
      const store = storeWith();
      seed(
        store,
        [ESSEN()],
        [level('Stadt', 'Stadt Essen'), level('Quartiere', 'Stadt Essen'), level('Ruhr', 'Bochum')]
      );

      store.selectMandant('Stadt Essen');

      expect(store.unassignedLevels().map((entry) => entry.name)).toEqual(['Quartiere']);
    });

    it('counts a level as assigned again as soon as a chain carries it', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen], [level('Quartiere', 'Stadt Essen')]);
      store.selectMandant('Stadt Essen');

      await store.assignLevel(store.unassignedLevels()[0], essen);

      expect(store.unassignedLevels()).toEqual([]);
    });

    it('narrows the levels to the tenant on screen, but hands the dialog all of them', () => {
      const store = storeWith();
      seed(store, [ESSEN()], [level('Quartiere', 'Stadt Essen'), level('Ruhr', 'Stadt Bochum')]);

      store.selectMandant('Stadt Essen');
      expect(store.tenantLevels().map((entry) => entry.name)).toEqual(['Quartiere']);

      // The create dialog gets all of them: it may switch its tenant while it
      // is open, and narrows the list itself against the tenant of its form.
      expect(store.registeredLevels().map((entry) => entry.name)).toEqual(['Quartiere', 'Ruhr']);
    });

    it('reads the registry off the spatial unit store instead of holding one', () => {
      const store = storeWith();
      seed(store, [], [level('Quartiere', 'Stadt Essen')]);

      expect(store.levelRegistry()).toEqual([
        {
          id: 'id-Quartiere',
          name: 'Quartiere',
          datasource: 'Katasteramt',
          mandant: 'Stadt Essen',
        },
      ]);
    });
  });

  describe('changing a chain', () => {
    it('assigns a level as the finest one of the chain, and unfolds it', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      await store.assignLevel(level('Quartiere', 'Stadt Essen'), essen);

      expect(essen.chain().map((entry) => entry.name)).toEqual(['Stadt', 'Bezirke', 'Quartiere']);
      expect(essen.open()).toBe(true);
    });

    it('inserts a level at the gap of the tree it was chosen at', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      await store.insertLevel(
        essen,
        { parent: null, index: 0 },
        {
          id: 'id-Region',
          name: 'Region',
        }
      );

      expect(essen.chain().map((entry) => entry.name)).toEqual(['Region', 'Stadt', 'Bezirke']);
    });

    it('moves a level one step along the chain', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      await store.moveLevel(essen, essen.levels()[0], 1);

      expect(essen.chain().map((entry) => entry.name)).toEqual(['Bezirke', 'Stadt']);
    });

    it('reports whether a level was really removed, so only that is announced', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      await expect(store.removeLevel(essen, essen.levels()[0])).resolves.toBe('saved');
      // The last remaining level stays: an empty hierarchy has no meaning, and
      // nothing is sent for it either.
      await expect(store.removeLevel(essen, essen.levels()[0])).resolves.toBe('rejected');
      expect(essen.chain()).toHaveLength(1);
      expect(hierarchyApi.updateMembers).toHaveBeenCalledTimes(1);
    });
  });

  describe('writing', () => {
    it('sends the whole chain, with the index as the level', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      await store.moveLevel(essen, essen.levels()[0], 1);

      expect(hierarchyApi.updateMembers).toHaveBeenCalledWith(essen.id, [
        { spatialUnitId: 'id-Bezirke', hierarchyLevel: 0 },
        { spatialUnitId: 'id-Stadt', hierarchyLevel: 1 },
      ]);
    });

    it('puts the chain back when the API refuses', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);
      const before = essen.chain();
      hierarchyApi.updateMembers.mockRejectedValue(new Error('400'));

      await expect(store.moveLevel(essen, essen.levels()[0], 1)).resolves.toBe('failed');

      expect(essen.chain()).toEqual(before);
      expect(essen.saving()).toBe(false);
    });

    it('restores the expansion state along with the chain', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);
      const expandedBefore = essen.expandedIds();
      hierarchyApi.updateMembers.mockRejectedValue(new Error('400'));

      await store.insertLevel(essen, { parent: null, index: 0 }, { id: 'id-Neu', name: 'Neu' });

      expect(essen.expandedIds()).toEqual(expandedBefore);
    });

    it('marks the hierarchy as saving while the write is on its way', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);
      let sawSaving = false;
      hierarchyApi.updateMembers.mockImplementation(() => {
        sawSaving = essen.saving();
        return Promise.resolve({});
      });

      await store.moveLevel(essen, essen.levels()[0], 1);

      expect(sawSaving).toBe(true);
      expect(essen.saving()).toBe(false);
    });

    it('lets a late failure not undo what came after it', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      // The first write fails, but only after a second one has already gone out.
      let failFirst!: (reason: Error) => void;
      hierarchyApi.updateMembers
        .mockImplementationOnce(() => new Promise((_, reject) => (failFirst = reject)))
        .mockResolvedValue({});

      const first = store.moveLevel(essen, essen.levels()[0], 1);
      const second = store.moveLevel(essen, essen.levels()[0], 1);
      await second;
      failFirst(new Error('400'));
      await expect(first).resolves.toBe('failed');

      // The outcome of the newer write stands.
      expect(essen.chain().map((entry) => entry.name)).toEqual(['Stadt', 'Bezirke']);
    });

    it('adds nothing when the create call fails', async () => {
      const store = storeWith();
      seed(store, [ESSEN()]);
      hierarchyApi.createHierarchy.mockRejectedValue(new Error('400'));

      const created = await store.addHierarchy(
        { name: 'Schulplanung', mandant: 'Stadt Essen', isPublic: false },
        []
      );

      expect(created).toBeNull();
      expect(store.hierarchies()).toHaveLength(1);
    });

    it('reloads after a failed create, so a half-written one becomes visible', async () => {
      const store = storeWith();
      seed(store, [ESSEN()]);
      hierarchyApi.getHierarchies.mockClear();
      hierarchyApi.createHierarchy.mockRejectedValue(new Error('400'));

      await store.addHierarchy(
        { name: 'Schulplanung', mandant: 'Stadt Essen', isPublic: false },
        []
      );

      // The API creates the hierarchy before it validates the members, so a
      // refused one can still exist on the server.
      expect(hierarchyApi.getHierarchies).toHaveBeenCalled();
    });

    it('sends mandantId and isPublic with every metadata write', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      await store.updateHierarchyMetadata(essen, {
        name: 'Verwaltung',
        mandant: 'Stadt Essen',
        isPublic: true,
      });

      expect(hierarchyApi.updateHierarchy).toHaveBeenCalledWith(essen.id, {
        name: 'Verwaltung',
        mandantId: 'Stadt Essen',
        isPublic: true,
      });
    });

    it('keeps the old metadata when the write fails', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);
      hierarchyApi.updateHierarchy.mockRejectedValue(new Error('400'));

      const saved = await store.updateHierarchyMetadata(essen, {
        name: 'Verwaltung',
        mandant: 'Stadt Bochum',
        isPublic: true,
      });

      expect(saved).toBe(false);
      expect(essen.name()).toBe('Verwaltung Essen');
      expect(essen.saving()).toBe(false);
    });

    it('keeps the hierarchy in the list when the delete fails', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);
      hierarchyApi.deleteHierarchy.mockRejectedValue(new Error('403'));

      await expect(store.deleteHierarchy(essen)).resolves.toBe(false);

      expect(store.hierarchies()).toHaveLength(1);
    });
  });

  describe('creating, editing and deleting a hierarchy', () => {
    it('creates a hierarchy without levels, leaving members out of the body', async () => {
      const store = storeWith();
      seed(store, [ESSEN()]);

      const created = await store.addHierarchy(
        { name: 'Schulplanung', mandant: 'Stadt Bochum', isPublic: false },
        []
      );

      // `members` is optional on the POST, so an empty chain sends no list at
      // all — the hierarchy is created and takes its levels on the page.
      expect(hierarchyApi.createHierarchy).toHaveBeenCalledWith({
        name: 'Schulplanung',
        mandantId: 'Stadt Bochum',
        isPublic: false,
      });
      expect(created).not.toBeNull();
      expect(created.chain()).toEqual([]);
    });

    it('appends the new hierarchy, unfolded, and follows it to its tenant', async () => {
      const store = storeWith();
      seed(store, [ESSEN()]);
      store.selectMandant('Stadt Essen');

      const created = await store.addHierarchy(
        { name: 'Schulplanung', mandant: 'Stadt Bochum', isPublic: false },
        [
          { id: 'id-Stadt Bochum', name: 'Stadt Bochum' },
          { id: 'id-Schulregionen', name: 'Schulregionen' },
        ]
      );

      expect(store.hierarchies().at(-1)).toBe(created);
      expect(created.chain().map((entry) => entry.name)).toEqual(['Stadt Bochum', 'Schulregionen']);
      expect(created.open()).toBe(true);
      expect(store.selectedMandant()).toBe('Stadt Bochum');
    });

    it('writes the edited metadata and leaves the chain alone', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      await store.updateHierarchyMetadata(essen, {
        name: 'Verwaltung',
        mandant: 'Stadt Essen',
        isPublic: true,
      });

      expect([essen.name(), essen.mandant(), essen.isPublic()]).toEqual([
        'Verwaltung',
        'Stadt Essen',
        true,
      ]);
      expect(essen.chain()).toHaveLength(2);
      // The edited hierarchy stays in view, in its tenant.
      expect(store.selectedMandant()).toBe('Stadt Essen');
    });

    it('keeps the tenant, whatever the dialog hands back', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      // The API refuses to move a hierarchy to another tenant, so the dialog
      // does not offer the choice — and the write sends the id the hierarchy
      // already carries rather than one resolved from a name.
      await store.updateHierarchyMetadata(essen, {
        name: 'Verwaltung',
        mandant: 'Stadt Bochum',
        isPublic: true,
      });

      expect(hierarchyApi.updateHierarchy).toHaveBeenCalledWith(essen.id, {
        name: 'Verwaltung',
        mandantId: 'Stadt Essen',
        isPublic: true,
      });
      expect(essen.mandant()).toBe('Stadt Essen');
    });

    it('drops a hierarchy without touching the registry', async () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen, BOCHUM()], [level('Stadt', 'Stadt Essen')]);

      await store.deleteHierarchy(essen);

      expect(store.hierarchies().map((entry) => entry.name())).toEqual(['Verwaltung Bochum']);
      expect(store.levelRegistry()).toHaveLength(1);
    });
  });
});
