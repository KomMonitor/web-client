import { computed, signal } from '@angular/core';

import { TreeGap } from '../../common/tree-view/tree-view.model';

import {
  HierarchyChainEntry,
  HierarchyLevel,
  SpatialUnitHierarchy,
  appendToChain,
  canInsertAtGap,
  canMoveInChain,
  chainPosition,
  indexInChain,
  createHierarchy,
  insertIntoChain,
  moveInChain,
  nest,
  newId,
  removeFromChain,
} from './hierarchy.model';

function hierarchy(names: string[]): SpatialUnitHierarchy {
  const chain = signal<readonly HierarchyChainEntry[]>(
    names.map((name, index) => ({ id: `id-${index}`, name }))
  );
  const levels = computed(() => nest(chain()));
  return {
    id: 'h',
    name: signal('Testhierarchie'),
    mandant: signal(''),
    mandantId: signal(''),
    isPublic: signal(false),
    chain,
    levels,
    levelCount: computed(() => chain().length),
    open: signal(true),
    expandedIds: signal<ReadonlySet<string>>(new Set(chain().map((entry) => entry.id))),
    openGap: signal<TreeGap<HierarchyLevel> | null>(null),
    canInsertAt: (gap) => canInsertAtGap(levels(), gap),
  };
}

/** The chain entry at `index`, as the caller of a chain function holds it. */
function entryAt(h: SpatialUnitHierarchy, index: number): HierarchyChainEntry {
  return h.chain()[index];
}

describe('nest', () => {
  it('turns a coarse-to-fine chain into a nested structure', () => {
    const nested = nest([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ]);

    expect(nested).toHaveLength(1);
    expect(nested[0].name).toBe('A');
    expect(nested[0].children[0].name).toBe('B');
    expect(nested[0].children[0].children[0].name).toBe('C');
    expect(nested[0].children[0].children[0].children).toEqual([]);
  });

  it('ranks the levels from the coarsest one down', () => {
    const nested = nest([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ]);

    expect(nested[0].rank).toBe(1);
    expect(nested[0].children[0].rank).toBe(2);
    expect(nested[0].children[0].children[0].rank).toBe(3);
  });

  it('offers no step beyond either end of the chain', () => {
    const nested = nest([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ]);
    const middle = nested[0].children[0];

    expect([nested[0].canMoveUp, nested[0].canMoveDown]).toEqual([false, true]);
    expect([middle.canMoveUp, middle.canMoveDown]).toEqual([true, true]);
    expect([middle.children[0].canMoveUp, middle.children[0].canMoveDown]).toEqual([true, false]);
  });

  it('lets a single level move nowhere at all', () => {
    const [only] = nest([{ id: 'a', name: 'A' }]);

    expect([only.canMoveUp, only.canMoveDown]).toEqual([false, false]);
  });

  it('handles an empty chain', () => {
    expect(nest([])).toEqual([]);
  });
});

describe('chainPosition', () => {
  const h = hierarchy(['A', 'B', 'C']);

  it('maps a root gap straight to its index', () => {
    expect(chainPosition(h, { parent: null, index: 0 })).toBe(0);
    expect(chainPosition(h, { parent: null, index: 1 })).toBe(1);
  });

  it('maps a child gap to the position after its parent', () => {
    const a = h.levels()[0];
    const b = a.children[0];

    expect(chainPosition(h, { parent: a, index: 0 })).toBe(1);
    expect(chainPosition(h, { parent: b, index: 0 })).toBe(2);
    expect(chainPosition(h, { parent: b, index: 1 })).toBe(3);
  });
});

describe('canInsertAtGap', () => {
  const h = hierarchy(['A', 'B', 'C']);
  const a = h.levels()[0];
  const b = a.children[0];
  const c = b.children[0];

  it('offers the gap before every level', () => {
    expect(canInsertAtGap(h.levels(), { parent: null, index: 0 })).toBe(true);
    expect(canInsertAtGap(h.levels(), { parent: a, index: 0 })).toBe(true);
    expect(canInsertAtGap(h.levels(), { parent: b, index: 0 })).toBe(true);
  });

  it('hides the gap after a level that still has a child — it repeats a deeper one', () => {
    expect(canInsertAtGap(h.levels(), { parent: null, index: 1 })).toBe(false);
    expect(canInsertAtGap(h.levels(), { parent: a, index: 1 })).toBe(false);
  });

  it('offers the gap after the deepest level as the end of the chain', () => {
    expect(canInsertAtGap(h.levels(), { parent: b, index: 1 })).toBe(true);
  });

  it('hides the gap inside the folded-away children of the deepest level', () => {
    expect(canInsertAtGap(h.levels(), { parent: c, index: 0 })).toBe(false);
  });

  it('is what the hierarchy hands the tree', () => {
    expect(h.canInsertAt({ parent: b, index: 1 })).toBe(true);
    expect(h.canInsertAt({ parent: a, index: 1 })).toBe(false);
  });
});

/** A level as the picker hands it over: the spatial unit's own id and name. */
function level(name: string): HierarchyChainEntry {
  return { id: `su-${name}`, name };
}

describe('insertIntoChain', () => {
  it('inserts at the head of the chain', () => {
    const h = hierarchy(['A', 'B']);

    insertIntoChain(h, { parent: null, index: 0 }, level('Neu'));

    expect(h.chain().map((entry) => entry.name)).toEqual(['Neu', 'A', 'B']);
  });

  it('inserts below the parent', () => {
    const h = hierarchy(['A', 'B']);

    insertIntoChain(h, { parent: h.levels()[0], index: 0 }, level('Neu'));

    expect(h.chain().map((entry) => entry.name)).toEqual(['A', 'Neu', 'B']);
  });

  it('expands the new level so the chain below stays visible', () => {
    const h = hierarchy(['A', 'B']);

    const entry = insertIntoChain(h, { parent: null, index: 0 }, level('Neu'));

    expect([...h.expandedIds()]).toContain(entry.id);
  });

  it('keeps the spatial unit id it was handed', () => {
    const h = hierarchy(['A']);

    const entry = insertIntoChain(h, { parent: null, index: 0 }, level('Neu'));

    expect(entry.id).toBe('su-Neu');
    expect(h.chain()[0].id).toBe('su-Neu');
  });

  it('refuses a level the chain already carries', () => {
    const h = hierarchy(['A']);
    const existing = entryAt(h, 0);

    insertIntoChain(h, { parent: null, index: 0 }, existing);

    expect(h.chain()).toHaveLength(1);
  });
});

describe('appendToChain', () => {
  it('adds the level below the deepest one', () => {
    const h = hierarchy(['A', 'B']);

    appendToChain(h, level('Neu'));

    expect(h.chain().map((entry) => entry.name)).toEqual(['A', 'B', 'Neu']);
  });

  it('expands the appended level', () => {
    const h = hierarchy(['A']);

    const appended = appendToChain(h, level('Neu'));

    expect([...h.expandedIds()]).toContain(appended.id);
  });

  it('starts a chain that is still empty', () => {
    const h = hierarchy([]);

    appendToChain(h, level('Neu'));

    expect(h.chain().map((entry) => entry.name)).toEqual(['Neu']);
  });

  it('refuses a level the chain already carries', () => {
    const h = hierarchy(['A']);

    appendToChain(h, entryAt(h, 0));

    expect(h.chain()).toHaveLength(1);
  });
});

describe('indexInChain', () => {
  it('finds the level by id, coarsest first', () => {
    const h = hierarchy(['A', 'B', 'C']);

    expect(indexInChain(h, entryAt(h, 0))).toBe(0);
    expect(indexInChain(h, entryAt(h, 2))).toBe(2);
  });

  it('reports a level that is not in this chain as -1', () => {
    const h = hierarchy(['A']);

    expect(indexInChain(h, { id: 'fremd', name: 'A' })).toBe(-1);
  });
});

describe('canMoveInChain', () => {
  it('offers no step beyond either end of the chain', () => {
    const h = hierarchy(['A', 'B']);

    expect(canMoveInChain(h, entryAt(h, 0), -1)).toBe(false);
    expect(canMoveInChain(h, entryAt(h, 0), 1)).toBe(true);
    expect(canMoveInChain(h, entryAt(h, 1), 1)).toBe(false);
  });

  it('offers nothing for a level that is not in this chain', () => {
    const h = hierarchy(['A', 'B']);

    expect(canMoveInChain(h, { id: 'fremd', name: 'A' }, 1)).toBe(false);
  });
});

describe('moveInChain', () => {
  it('swaps the level with its neighbour', () => {
    const h = hierarchy(['A', 'B', 'C']);

    expect(moveInChain(h, entryAt(h, 1), -1)).toBe(true);

    expect(h.chain().map((entry) => entry.name)).toEqual(['B', 'A', 'C']);
  });

  it('leaves the chain alone at its ends', () => {
    const h = hierarchy(['A', 'B']);

    expect(moveInChain(h, entryAt(h, 0), -1)).toBe(false);

    expect(h.chain().map((entry) => entry.name)).toEqual(['A', 'B']);
  });

  it('keeps the ids with their levels, so the expanded state survives', () => {
    const h = hierarchy(['A', 'B']);
    const a = entryAt(h, 0);

    moveInChain(h, a, 1);

    expect(h.chain()[1]).toBe(a);
    expect([...h.expandedIds()]).toContain(a.id);
  });
});

describe('removeFromChain', () => {
  it('closes the chain up around the removed level', () => {
    const h = hierarchy(['A', 'B', 'C']);

    expect(removeFromChain(h, entryAt(h, 1))).toBe(true);

    expect(h.chain().map((entry) => entry.name)).toEqual(['A', 'C']);
  });

  it('drops the expansion entry with the level', () => {
    const h = hierarchy(['A', 'B']);
    const b = entryAt(h, 1);

    removeFromChain(h, b);

    expect([...h.expandedIds()]).not.toContain(b.id);
  });

  it('keeps the last remaining level — an empty hierarchy has no meaning', () => {
    const h = hierarchy(['A']);

    expect(removeFromChain(h, entryAt(h, 0))).toBe(false);

    expect(h.chain()).toHaveLength(1);
  });

  it('reports a level that is not in this chain as not removed', () => {
    const h = hierarchy(['A', 'B']);

    expect(removeFromChain(h, { id: 'fremd', name: 'A' })).toBe(false);

    expect(h.chain()).toHaveLength(2);
  });
});

describe('newId', () => {
  it('hands out a fresh uuid every time', () => {
    const first = newId();

    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(newId()).not.toBe(first);
  });
});

describe('createHierarchy', () => {
  const overview = {
    hierarchyId: 'h-1',
    name: 'Verwaltungsgliederung',
    mandantId: 'm-1',
    isPublic: true,
    members: [
      { spatialUnitId: 'su-b', spatialUnitLevel: 'Bezirke', hierarchyLevel: 1 },
      { spatialUnitId: 'su-a', spatialUnitLevel: 'Stadt', hierarchyLevel: 0 },
      { spatialUnitId: 'su-c', spatialUnitLevel: 'Quartiere', hierarchyLevel: 2 },
    ],
  };

  it('orders the chain by hierarchyLevel, not by arrival', () => {
    const built = createHierarchy(overview, 'Stadt Essen');

    expect(built.chain().map((entry) => entry.name)).toEqual(['Stadt', 'Bezirke', 'Quartiere']);
  });

  it('carries the spatial unit id of every member into the chain', () => {
    const built = createHierarchy(overview, 'Stadt Essen');

    expect(built.chain().map((entry) => entry.id)).toEqual(['su-a', 'su-b', 'su-c']);
  });

  it('takes the metadata over, with the tenant name the caller resolved', () => {
    const built = createHierarchy(overview, 'Stadt Essen');

    expect(built.id).toBe('h-1');
    expect(built.name()).toBe('Verwaltungsgliederung');
    expect(built.mandant()).toBe('Stadt Essen');
    expect(built.mandantId()).toBe('m-1');
    expect(built.isPublic()).toBe(true);
  });

  it('starts folded but fully expanded, so opening it shows the whole chain', () => {
    const built = createHierarchy(overview, 'Stadt Essen');

    expect(built.open()).toBe(false);
    expect([...built.expandedIds()].sort()).toEqual(['su-a', 'su-b', 'su-c']);
  });

  it('copes with a hierarchy that has no members yet', () => {
    const built = createHierarchy({ ...overview, members: undefined }, 'Stadt Essen');

    expect(built.chain()).toEqual([]);
    expect(built.levelCount()).toBe(0);
  });

  it('hands out independent state on every call', () => {
    const first = createHierarchy(overview, 'Stadt Essen');
    const second = createHierarchy(overview, 'Stadt Essen');

    first.name.set('Geändert');

    expect(second.name()).toBe('Verwaltungsgliederung');
  });
});
