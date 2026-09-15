import { computed, signal } from '@angular/core';

import { TreeGap } from '../../common/tree-view/tree-view.model';

import {
  DemoChainEntry,
  DemoHierarchy,
  DemoLevel,
  appendToChain,
  canInsertAtGap,
  canMoveInChain,
  chainPosition,
  indexInChain,
  insertIntoChain,
  moveInChain,
  nest,
  removeFromChain,
} from './hierarchy-demo.model';

function hierarchy(names: string[]): DemoHierarchy {
  const chain = signal<readonly DemoChainEntry[]>(
    names.map((name, index) => ({ id: `id-${index}`, name }))
  );
  const levels = computed(() => nest(chain()));
  return {
    id: 'h',
    name: signal('Testhierarchie'),
    description: signal(''),
    mandant: signal(''),
    chain,
    levels,
    levelCount: computed(() => chain().length),
    open: signal(true),
    expandedIds: signal<ReadonlySet<string>>(new Set(chain().map((entry) => entry.id))),
    openGap: signal<TreeGap<DemoLevel> | null>(null),
    canInsertAt: (gap) => canInsertAtGap(levels(), gap),
  };
}

/** The chain entry at `index`, as the caller of a chain function holds it. */
function entryAt(h: DemoHierarchy, index: number): DemoChainEntry {
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

describe('insertIntoChain', () => {
  it('inserts at the head of the chain', () => {
    const h = hierarchy(['A', 'B']);

    insertIntoChain(h, { parent: null, index: 0 }, 'Neu');

    expect(h.chain().map((entry) => entry.name)).toEqual(['Neu', 'A', 'B']);
  });

  it('inserts below the parent', () => {
    const h = hierarchy(['A', 'B']);

    insertIntoChain(h, { parent: h.levels()[0], index: 0 }, 'Neu');

    expect(h.chain().map((entry) => entry.name)).toEqual(['A', 'Neu', 'B']);
  });

  it('expands the new level so the chain below stays visible', () => {
    const h = hierarchy(['A', 'B']);

    const entry = insertIntoChain(h, { parent: null, index: 0 }, 'Neu');

    expect([...h.expandedIds()]).toContain(entry.id);
  });

  it('gives every inserted level its own id', () => {
    const h = hierarchy(['A']);

    const first = insertIntoChain(h, { parent: null, index: 0 }, 'Eins');
    const second = insertIntoChain(h, { parent: null, index: 0 }, 'Zwei');

    expect(first.id).not.toBe(second.id);
  });
});

describe('appendToChain', () => {
  it('adds the level below the deepest one', () => {
    const h = hierarchy(['A', 'B']);

    appendToChain(h, 'Neu');

    expect(h.chain().map((entry) => entry.name)).toEqual(['A', 'B', 'Neu']);
  });

  it('expands the appended level and gives it its own id', () => {
    const h = hierarchy(['A']);

    const first = appendToChain(h, 'Eins');
    const second = appendToChain(h, 'Zwei');

    expect([...h.expandedIds()]).toContain(second.id);
    expect(first.id).not.toBe(second.id);
  });

  it('starts a chain that is still empty', () => {
    const h = hierarchy([]);

    appendToChain(h, 'Neu');

    expect(h.chain().map((entry) => entry.name)).toEqual(['Neu']);
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
