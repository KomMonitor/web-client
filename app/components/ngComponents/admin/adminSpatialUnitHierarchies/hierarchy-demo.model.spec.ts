import { computed, signal } from '@angular/core';

import {
  DemoChainEntry,
  DemoHierarchy,
  appendToChain,
  chainPosition,
  insertIntoChain,
  nest,
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
  };
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
