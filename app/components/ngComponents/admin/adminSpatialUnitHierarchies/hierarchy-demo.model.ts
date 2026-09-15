import { Signal, WritableSignal } from '@angular/core';

import { TreeGap } from '../../common/tree-view/tree-view.model';

/**
 * A spatial unit level as it is stored: a flat chain entry, coarsest first.
 *
 * Its `id` identifies the level *within this one chain* — the tree tracks and
 * expands rows by it. It is not the identity of the spatial unit level itself,
 * which is what `RegisteredLevel.id` is. The two worlds are joined by the
 * **name**, the way `levelUsage` and the tenant overview already count.
 */
export interface DemoChainEntry {
  readonly id: string;
  readonly name: string;
}

/**
 * A spatial unit level as the registry knows it — independent of any hierarchy.
 * Stands in for a `SpatialUnitOverviewType`: `id` mirrors `spatialUnitId`,
 * `name` the level name and `datasource` its `metadata.datasource`.
 *
 * Whether a level is assigned is never stored, it is derived: a level is
 * unassigned while no chain of its tenant carries its name. Storing it would
 * mean the datasource of an assigned level had nowhere to live.
 */
export interface RegisteredLevel {
  readonly id: string;
  readonly name: string;
  /** Where the data comes from — free text, shown next to unassigned levels. */
  readonly datasource: string;
  /** Owning tenant; empty where Keycloak names none. */
  readonly mandant: string;
}

/** The same level as the tree renders it — each one nests the next. */
export interface DemoLevel extends DemoChainEntry {
  readonly children: DemoLevel[];
}

export interface DemoHierarchy {
  readonly id: string;
  /** Writable so renaming keeps the hierarchy object — and its state — in place. */
  readonly name: WritableSignal<string>;
  /** Free text under the header; empty when the user left it out. */
  readonly description: WritableSignal<string>;
  /** Owning tenant, as chosen in the dialog; empty without Keycloak. */
  readonly mandant: WritableSignal<string>;
  /** Source of truth: the chain from coarse to fine. Every edit happens here. */
  readonly chain: WritableSignal<readonly DemoChainEntry[]>;
  readonly levels: Signal<readonly DemoLevel[]>;
  readonly levelCount: Signal<number>;
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
  return insertAt(hierarchy, chainPosition(hierarchy, gap), name);
}

/**
 * Appends a level below the deepest one, where it becomes the finest level of
 * the hierarchy. This is what assigning a so far unassigned level does — the
 * gaps in the tree address the positions in between.
 */
export function appendToChain(hierarchy: DemoHierarchy, name: string): DemoChainEntry {
  return insertAt(hierarchy, hierarchy.chain().length, name);
}

/**
 * The one place that adds to a chain: mints the id the tree tracks the level by,
 * splices it in and marks it expanded — a level that is not in `expandedIds`
 * would come up folded and hide everything below it.
 */
function insertAt(hierarchy: DemoHierarchy, position: number, name: string): DemoChainEntry {
  const entry: DemoChainEntry = { id: `level-${nextLevelId++}`, name };

  hierarchy.chain.update((entries) => {
    const next = [...entries];
    next.splice(position, 0, entry);
    return next;
  });
  hierarchy.expandedIds.update((ids) => new Set(ids).add(entry.id));

  return entry;
}

/** The position of a level in its chain, coarsest first; -1 when it is not in it. */
export function indexInChain(hierarchy: DemoHierarchy, level: DemoChainEntry): number {
  return hierarchy.chain().findIndex((entry) => entry.id === level.id);
}

/** Whether moving the level by that many steps would stay inside the chain. */
export function canMoveInChain(
  hierarchy: DemoHierarchy,
  level: DemoChainEntry,
  offset: number
): boolean {
  const index = indexInChain(hierarchy, level);
  if (index < 0) {
    return false;
  }
  const target = index + offset;
  return target >= 0 && target < hierarchy.chain().length;
}

/**
 * Moves a level one step along the chain, i.e. swaps it with the level above or
 * below it. The tree re-nests itself from the new order, and the ids stay with
 * their levels, so what was expanded stays expanded.
 *
 * Returns whether it moved — a step beyond either end of the chain does nothing.
 */
export function moveInChain(
  hierarchy: DemoHierarchy,
  level: DemoChainEntry,
  offset: number
): boolean {
  if (!canMoveInChain(hierarchy, level, offset)) {
    return false;
  }

  const index = indexInChain(hierarchy, level);
  hierarchy.chain.update((entries) => {
    const next = [...entries];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    return next;
  });

  return true;
}

/**
 * Takes a level out of the chain. The neighbours close up, so the level below
 * moves under the one above. Drops the expansion entry as well — the id is gone
 * with the level, and a level re-added under that name gets a new one, which
 * would otherwise come up folded.
 *
 * Returns whether it was removed. The last remaining level stays: an empty
 * hierarchy has no meaning.
 */
export function removeFromChain(hierarchy: DemoHierarchy, level: DemoChainEntry): boolean {
  if (hierarchy.chain().length <= 1 || indexInChain(hierarchy, level) < 0) {
    return false;
  }

  hierarchy.chain.update((entries) => entries.filter((entry) => entry.id !== level.id));
  hierarchy.expandedIds.update((ids) => {
    const next = new Set(ids);
    next.delete(level.id);
    return next;
  });

  return true;
}
