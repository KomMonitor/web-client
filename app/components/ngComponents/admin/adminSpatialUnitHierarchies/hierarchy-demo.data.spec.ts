import {
  AVAILABLE_LEVELS,
  DEMO_HIERARCHIES,
  createDemoHierarchies,
  unusedLevels,
} from './hierarchy-demo.data';

describe('unusedLevels', () => {
  it('drops the names already in the chain', () => {
    const used = AVAILABLE_LEVELS[0];

    const result = unusedLevels([{ id: 'x', name: used }]);

    expect(result).not.toContain(used);
    expect(result).toHaveLength(AVAILABLE_LEVELS.length - 1);
  });

  it('offers the whole pool for an unrelated chain', () => {
    expect(unusedLevels([{ id: 'x', name: 'Stadt Essen' }])).toEqual([...AVAILABLE_LEVELS]);
  });
});

describe('createDemoHierarchies', () => {
  it('builds one hierarchy per source entry, chain intact', () => {
    const hierarchies = createDemoHierarchies();

    expect(hierarchies).toHaveLength(DEMO_HIERARCHIES.length);
    expect(hierarchies[0].name).toBe(DEMO_HIERARCHIES[0].name);
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
