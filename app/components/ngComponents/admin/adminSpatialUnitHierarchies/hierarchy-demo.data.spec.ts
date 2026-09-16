import {
  DEMO_HIERARCHIES,
  createDemoHierarchies,
  createHierarchy,
  createLevelRegistry,
} from './hierarchy-demo.data';

describe('createDemoHierarchies', () => {
  it('builds one hierarchy per source entry, chain intact', () => {
    const hierarchies = createDemoHierarchies();

    expect(hierarchies).toHaveLength(DEMO_HIERARCHIES.length);
    expect(hierarchies[0].name()).toBe(DEMO_HIERARCHIES[0].name);
    expect(hierarchies[0].chain().map((entry) => entry.name)).toEqual([
      ...DEMO_HIERARCHIES[0].levels,
    ]);
    expect(hierarchies[0].levelCount()).toBe(DEMO_HIERARCHIES[0].levels.length);
  });

  it('nests the chain and starts it fully expanded', () => {
    const [hierarchy] = createDemoHierarchies();

    expect(hierarchy.levels()).toHaveLength(1);
    expect(hierarchy.levels()[0].children[0].name).toBe(DEMO_HIERARCHIES[0].levels[1]);
    expect(hierarchy.expandedIds().size).toBe(hierarchy.chain().length);
  });

  it('gives every hierarchy its own open gap', () => {
    // A gap is addressed by parent id plus index, and at the root the parent is
    // null everywhere — a shared signal would open the same root gap in every
    // hierarchy at once.
    const first = createDemoHierarchies()[0];
    const second = createDemoHierarchies()[0];

    first.openGap.set({ parent: null, index: 0 });

    expect(second.openGap()).toBeNull();
  });

  it('hands out independent state on every call', () => {
    const first = createDemoHierarchies()[0];
    const second = createDemoHierarchies()[0];

    first.chain.update((entries) => entries.slice(1));

    expect(first.chain().length).not.toBe(second.chain().length);
  });
});

describe('createHierarchy', () => {
  it('builds a single hierarchy from a plain source', () => {
    const hierarchy = createHierarchy({
      id: 'h-1',
      name: 'Schulplanung',
      description: 'Ebenen der Schulentwicklungsplanung.',
      levels: ['Stadt Essen', 'Schulregionen Essen'],
      open: true,
    });

    expect(hierarchy.id).toBe('h-1');
    expect(hierarchy.name()).toBe('Schulplanung');
    expect(hierarchy.description()).toBe('Ebenen der Schulentwicklungsplanung.');
    for (const entry of hierarchy.chain()) {
      expect(entry.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }
    expect(hierarchy.levels()[0].children[0].name).toBe('Schulregionen Essen');
    expect(hierarchy.open()).toBe(true);
    expect(hierarchy.expandedIds().size).toBe(2);
    expect(hierarchy.openGap()).toBeNull();
  });

  it('carries a single level without nesting anything under it', () => {
    const hierarchy = createHierarchy({
      id: 'h-2',
      name: 'Neu',
      levels: ['Quartiere Essen'],
      open: true,
    });

    expect(hierarchy.levelCount()).toBe(1);
    expect(hierarchy.levels()[0].children).toEqual([]);
    // A source without a description leaves the signal empty, not undefined.
    expect(hierarchy.description()).toBe('');
  });
});

describe('createLevelRegistry', () => {
  it('describes every level with a tenant and a data source', () => {
    for (const level of createLevelRegistry()) {
      expect(level.name).not.toBe('');
      expect(level.mandant).not.toBe('');
      expect(level.datasource).not.toBe('');
      expect(level.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }
  });

  it('keeps names and ids unique', () => {
    const registry = createLevelRegistry();

    expect(new Set(registry.map((level) => level.name)).size).toBe(registry.length);
    expect(new Set(registry.map((level) => level.id)).size).toBe(registry.length);
  });

  it('holds every level the seeded hierarchies use, under their own tenant', () => {
    const registry = createLevelRegistry();

    for (const source of DEMO_HIERARCHIES) {
      for (const name of source.levels) {
        const level = registry.find((entry) => entry.name === name);
        expect(level).toBeDefined();
        expect(level?.mandant).toBe(source.mandant);
      }
    }
  });

  it('covers the levels that sit outside every hierarchy as well', () => {
    const names = createLevelRegistry().map((level) => level.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'Schulregionen Essen',
        'Grundschulbezirke Essen',
        'Wahlbezirke Essen',
        'Postleitzahlgebiete Essen',
        'Wahlbezirke Bochum',
      ])
    );
  });

  it('leaves some levels in no hierarchy at all, and one tenant with none', () => {
    const used = new Set(DEMO_HIERARCHIES.flatMap((source) => source.levels));
    const unassigned = createLevelRegistry().filter((level) => !used.has(level.name));

    // At least two tenants have something unassigned, at least one has nothing —
    // both branches of the section are reachable by switching tenant.
    const mandants = new Set(unassigned.map((level) => level.mandant));
    expect(mandants.size).toBeGreaterThan(1);
    expect(mandants.size).toBeLessThan(new Set(DEMO_HIERARCHIES.map((s) => s.mandant)).size);
  });

  it('hands out independent state on every call', () => {
    expect(createLevelRegistry()[0].id).not.toBe(createLevelRegistry()[0].id);
  });
});
