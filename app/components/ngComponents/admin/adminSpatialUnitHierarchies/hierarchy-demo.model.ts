import { Signal, WritableSignal } from '@angular/core';

import { TreeGap } from '../../common/tree-view/tree-view.model';

/** A spatial unit level as it is stored: a flat chain entry, coarsest first. */
export interface DemoChainEntry {
  readonly id: string;
  readonly name: string;
}

/** The same level as the tree renders it — each one nests the next. */
export interface DemoLevel extends DemoChainEntry {
  readonly children: DemoLevel[];
}

export interface DemoHierarchy {
  readonly id: string;
  readonly name: string;
  /** Source of truth: the chain from coarse to fine. Every edit happens here. */
  readonly chain: WritableSignal<readonly DemoChainEntry[]>;
  readonly levels: Signal<readonly DemoLevel[]>;
  readonly levelCount: Signal<number>;
  /** The nested structure as pretty-printed JSON, for the inspector below the tree. */
  readonly json: Signal<string>;
  readonly open: WritableSignal<boolean>;
  readonly expandedIds: WritableSignal<ReadonlySet<string>>;
  /**
   * The gap whose picker panel is open, or null. Per hierarchy on purpose: a gap
   * is addressed by parent id plus index, and at the root the parent is null in
   * every hierarchy — one shared signal would open the same root gap in all of
   * them at once.
   */
  readonly openGap: WritableSignal<TreeGap<DemoLevel> | null>;
}

let nextLevelId = 0;

/** Nests a coarse-to-fine chain so the tree can render it. */
export function nest(entries: readonly DemoChainEntry[]): DemoLevel[] {
  return entries.reduceRight<DemoLevel[]>((children, entry) => [{ ...entry, children }], []);
}

/**
 * Translates a gap in the nested tree into a position in the flat chain. The
 * gap's index counts within the parent's children, which in a chain is the one
 * level below it — so the position is the parent's own plus one, plus that
 * offset. Without a parent the gap sits at the head of the chain.
 *
 * This is the only place that bridges the nested tree and the flat chain.
 */
export function chainPosition(hierarchy: DemoHierarchy, gap: TreeGap<DemoLevel>): number {
  const parentIndex = gap.parent
    ? hierarchy.chain().findIndex((entry) => entry.id === gap.parent!.id)
    : -1;
  return parentIndex + 1 + gap.index;
}

/**
 * Inserts a level at the gap and returns it. The new level is expanded right
 * away — it now carries the rest of the chain as its children, which would
 * otherwise disappear.
 */
export function insertIntoChain(
  hierarchy: DemoHierarchy,
  gap: TreeGap<DemoLevel>,
  name: string
): DemoChainEntry {
  const entry: DemoChainEntry = { id: `level-${nextLevelId++}`, name };
  const position = chainPosition(hierarchy, gap);

  hierarchy.chain.update((entries) => {
    const next = [...entries];
    next.splice(position, 0, entry);
    return next;
  });
  hierarchy.expandedIds.update((ids) => new Set(ids).add(entry.id));

  return entry;
}
