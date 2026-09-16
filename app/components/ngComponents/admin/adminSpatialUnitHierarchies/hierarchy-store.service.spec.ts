import { TestBed } from '@angular/core/testing';
import { MandantService } from 'services/mandant-service/mandant.service';

import { createHierarchy } from './hierarchy-demo.data';
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
  isRealmAdmin: boolean;
  ownMandant: string;
  mandantsToOffer(known: readonly string[]): readonly string[];
}

/**
 * A store on its own, with the tenants Keycloak would name. The store reads
 * `ownMandant` in its constructor, so the fake is in place before it is built.
 */
function storeWith(mandants: Partial<Mandants> = {}): HierarchyStoreService {
  const fake: Mandants = {
    keycloakMandants: [],
    isRealmAdmin: false,
    ownMandant: '',
    mandantsToOffer: (known) => known,
    ...mandants,
  };
  TestBed.configureTestingModule({
    providers: [HierarchyStoreService, { provide: MandantService, useValue: fake }],
  });
  return TestBed.inject(HierarchyStoreService);
}

function hierarchy(name: string, mandant: string, levels: string[]): SpatialUnitHierarchy {
  return createHierarchy({ id: name, name, mandant, levels, open: false });
}

function level(name: string, mandant: string): RegisteredLevel {
  return { id: `id-${name}`, name, mandant, datasource: 'Katasteramt' };
}

/** Puts the store on data of this spec's own, in place of the demo content. */
function seed(
  store: HierarchyStoreService,
  hierarchies: SpatialUnitHierarchy[],
  registry: RegisteredLevel[] = []
): void {
  store.hierarchies.set(hierarchies);
  store.levelRegistry.set(registry);
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

    it('counts a level as assigned again as soon as a chain carries it', () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen], [level('Quartiere', 'Stadt Essen')]);
      store.selectMandant('Stadt Essen');

      store.assignLevel(store.unassignedLevels()[0], essen);

      expect(store.unassignedLevels()).toEqual([]);
    });

    it('offers the tenant its own level names to build chains from', () => {
      const store = storeWith();
      seed(store, [ESSEN()], [level('Quartiere', 'Stadt Essen'), level('Ruhr', 'Stadt Bochum')]);

      store.selectMandant('Stadt Essen');
      expect(store.tenantLevelNames()).toEqual(['Quartiere']);

      // The create dialog builds across tenants: it may switch while it is open.
      expect(store.registeredLevelNames()).toEqual(['Quartiere', 'Ruhr']);
    });

    it('registers a level under the tenant it was registered in, not the one on screen', () => {
      const store = storeWith();
      seed(store, [ESSEN(), BOCHUM()]);
      store.selectMandant('Stadt Essen');

      store.registerLevel({ name: 'Ruhrhalbinsel', datasource: 'Katasteramt' }, 'Stadt Bochum');

      expect(store.levelRegistry()).toEqual([
        {
          id: expect.any(String),
          name: 'Ruhrhalbinsel',
          datasource: 'Katasteramt',
          mandant: 'Stadt Bochum',
        },
      ]);
    });

    it('drops a level from the registry', () => {
      const store = storeWith();
      const quartiere = level('Quartiere', 'Stadt Essen');
      seed(store, [], [quartiere, level('Ruhr', 'Stadt Bochum')]);

      store.deleteLevel(quartiere);

      expect(store.levelRegistry().map((entry) => entry.name)).toEqual(['Ruhr']);
    });
  });

  describe('changing a chain', () => {
    it('assigns a level as the finest one of the chain, and unfolds it', () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      store.assignLevel(level('Quartiere', 'Stadt Essen'), essen);

      expect(essen.chain().map((entry) => entry.name)).toEqual(['Stadt', 'Bezirke', 'Quartiere']);
      expect(essen.open()).toBe(true);
    });

    it('inserts a level at the gap of the tree it was chosen at', () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      store.insertLevel(essen, { parent: null, index: 0 }, 'Region');

      expect(essen.chain().map((entry) => entry.name)).toEqual(['Region', 'Stadt', 'Bezirke']);
    });

    it('moves a level one step along the chain', () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      store.moveLevel(essen, essen.levels()[0], 1);

      expect(essen.chain().map((entry) => entry.name)).toEqual(['Bezirke', 'Stadt']);
    });

    it('reports whether a level was really removed, so only that is announced', () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      expect(store.removeLevel(essen, essen.levels()[0])).toBe(true);
      // The last remaining level stays: an empty hierarchy has no meaning.
      expect(store.removeLevel(essen, essen.levels()[0])).toBe(false);
      expect(essen.chain()).toHaveLength(1);
    });
  });

  describe('creating, editing and deleting a hierarchy', () => {
    it('appends the new hierarchy, unfolded, and follows it to its tenant', () => {
      const store = storeWith();
      seed(store, [ESSEN()]);
      store.selectMandant('Stadt Essen');

      const created = store.addHierarchy(
        { name: 'Schulplanung', description: 'Ebenen der Schulplanung.', mandant: 'Stadt Bochum' },
        ['Stadt Bochum', 'Schulregionen']
      );

      expect(store.hierarchies().at(-1)).toBe(created);
      expect(created.chain().map((entry) => entry.name)).toEqual(['Stadt Bochum', 'Schulregionen']);
      expect(created.open()).toBe(true);
      expect(store.selectedMandant()).toBe('Stadt Bochum');
    });

    it('writes the edited metadata and leaves the chain alone', () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen]);

      store.updateHierarchyMetadata(essen, {
        name: 'Verwaltung',
        description: 'Neue Beschreibung.',
        mandant: 'Stadt Bochum',
      });

      expect([essen.name(), essen.description(), essen.mandant()]).toEqual([
        'Verwaltung',
        'Neue Beschreibung.',
        'Stadt Bochum',
      ]);
      expect(essen.chain()).toHaveLength(2);
      // The edited hierarchy stays in view, in the tenant it now belongs to.
      expect(store.selectedMandant()).toBe('Stadt Bochum');
    });

    it('drops a hierarchy without touching the registry', () => {
      const store = storeWith();
      const essen = ESSEN();
      seed(store, [essen, BOCHUM()], [level('Stadt', 'Stadt Essen')]);

      store.deleteHierarchy(essen);

      expect(store.hierarchies().map((entry) => entry.name())).toEqual(['Verwaltung Bochum']);
      expect(store.levelRegistry()).toHaveLength(1);
    });
  });
});
