import {
  isTreeNodeExpandable,
  isWithinTreeDepth,
  reorderTreeSiblings,
  toggleTreeId,
  treeIndent,
  treeToneDepth,
} from './tree-view.model';

describe('toggleTreeId', () => {
  it('adds a missing id and removes a present one', () => {
    const empty = new Set<string>();

    const added = toggleTreeId(empty, 'a');
    expect([...added]).toEqual(['a']);

    const removed = toggleTreeId(added, 'a');
    expect([...removed]).toEqual([]);
  });

  it('never mutates the input set', () => {
    const original = new Set(['a']);

    toggleTreeId(original, 'b');
    toggleTreeId(original, 'a');

    expect([...original]).toEqual(['a']);
  });
});

describe('treeIndent', () => {
  it('grows by one step per depth', () => {
    expect([0, 1, 2].map((d) => treeIndent(d, 20, 80))).toEqual([0, 20, 40]);
  });

  it('caps at maxIndent', () => {
    expect(treeIndent(4, 20, 80)).toBe(80);
    expect(treeIndent(99, 20, 80)).toBe(80);
  });

  it('treats a negative depth as the root', () => {
    expect(treeIndent(-3, 20, 80)).toBe(0);
  });
});

describe('treeToneDepth', () => {
  it('reuses the last tint beyond the known depths', () => {
    expect([0, 1, 2, 3, 4, 10].map(treeToneDepth)).toEqual([0, 1, 2, 3, 3, 3]);
  });
});

describe('isTreeNodeExpandable', () => {
  it('is true for a node with children inside the depth limit', () => {
    expect(isTreeNodeExpandable(true, false, 0, 3)).toBe(true);
  });

  it('is false for a leaf without a footer template', () => {
    expect(isTreeNodeExpandable(false, false, 0, null)).toBe(false);
  });

  it('is true for a childless node when a footer template is projected', () => {
    // Opening such a node is how its first child gets added.
    expect(isTreeNodeExpandable(false, true, 0, null)).toBe(true);
  });

  it('is false at and beyond the depth limit', () => {
    expect(isTreeNodeExpandable(true, true, 3, 3)).toBe(false);
    expect(isTreeNodeExpandable(true, true, 4, 3)).toBe(false);
  });

  it('ignores the depth limit when it is null', () => {
    expect(isTreeNodeExpandable(true, false, 99, null)).toBe(true);
  });
});

describe('isWithinTreeDepth', () => {
  it('allows children up to but not at the limit', () => {
    expect(isWithinTreeDepth(2, 3)).toBe(true);
    expect(isWithinTreeDepth(3, 3)).toBe(false);
  });

  it('is unbounded without a limit', () => {
    expect(isWithinTreeDepth(42, null)).toBe(true);
  });
});

describe('reorderTreeSiblings', () => {
  it('moves an item forward', () => {
    expect(reorderTreeSiblings(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves an item backward', () => {
    expect(reorderTreeSiblings(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('returns a fresh array and leaves the input untouched', () => {
    const original = ['a', 'b', 'c'];

    const result = reorderTreeSiblings(original, 0, 1);

    expect(result).not.toBe(original);
    expect(original).toEqual(['a', 'b', 'c']);
  });
});
