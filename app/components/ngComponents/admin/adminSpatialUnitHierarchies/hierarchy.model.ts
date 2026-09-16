import { Signal, WritableSignal } from '@angular/core';

import { v4 as uuidv4 } from 'uuid';
import { TreeGap } from '../../common/tree-view/tree-view.model';

/**
 * A spatial unit level as it is stored: a flat chain entry, coarsest first.
 *
 * Its `id` identifies the level *within this one chain* — the tree tracks and
 * expands rows by it. It is not the identity of the spatial unit level itself,
 * which is what `RegisteredLevel.id` is. The two worlds are joined by the
 * **name**, the way `levelUsage` and the tenant overview already count.
 */
export interface HierarchyChainEntry {
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

/**
 * The same level as the tree renders it — each one nests the next.
 *
 * Rank and move-ability are properties of the row, so they are derived once
 * with the tree instead of asked per row and change detection cycle. They
 * follow from the position in the chain, which is exactly what nesting knows.
 */
export interface HierarchyLevel extends HierarchyChainEntry {
  readonly children: HierarchyLevel[];
  /** Position in the chain, 1-based — rank 1 is the coarsest level. */
  readonly rank: number;
  /** False for the coarsest level: there is nothing above it to swap with. */
  readonly canMoveUp: boolean;
  /** False for the finest level: there is nothing below it to swap with. */
  readonly canMoveDown: boolean;
}

export interface SpatialUnitHierarchy {
  readonly id: string;
  /** Writable so renaming keeps the hierarchy object — and its state — in place. */
  readonly name: WritableSignal<string>;
  /** Free text under the header; empty when the user left it out. */
  readonly description: WritableSignal<string>;
  /** Owning tenant, as chosen in the dialog; empty without Keycloak. */
  readonly mandant: WritableSignal<string>;
  /** Source of truth: the chain from coarse to fine. Every edit happens here. */
  readonly chain: WritableSignal<readonly HierarchyChainEntry[]>;
  readonly levels: Signal<readonly HierarchyLevel[]>;
  readonly levelCount: Signal<number>;
  readonly open: WritableSignal<boolean>;
  readonly expandedIds: WritableSignal<ReadonlySet<string>>;
  /**
   * The gap whose picker panel is open, or null. Per hierarchy on purpose: a gap
   * is addressed by parent id plus index, and at the root the parent is null in
   * every hierarchy — one shared signal would open the same root gap in all of
   * them at once.
   */
  readonly openGap: WritableSignal<TreeGap<HierarchyLevel> | null>;
  /**
   * Which gaps of the tree offer an insert line — `canInsertAtGap` over this
   * hierarchy's levels. Built once with the hierarchy: the tree takes it as an
   * input, and a fresh function on every change detection run would keep
   * rewriting that input and never settle.
   */
  readonly canInsertAt: (gap: TreeGap<HierarchyLevel>) => boolean;
}

/**
 * The one source of ids in this page — hierarchies, registry levels and chain
 * entries alike. A uuid is what the backend hands out, and unlike a module-wide
 * counter it carries no state that survives from one call, or one test, to the
 * next.
 */
export function newId(): string {
  return uuidv4();
}

/** Nests a coarse-to-fine chain so the tree can render it. */
export function nest(entries: readonly HierarchyChainEntry[]): HierarchyLevel[] {
  return entries.reduceRight<HierarchyLevel[]>(
    (children, entry, index) => [
      {
        ...entry,
        children,
        rank: index + 1,
        canMoveUp: canMoveAt(index, entries.length, -1),
        canMoveDown: canMoveAt(index, entries.length, 1),
      },
    ],
    []
  );
}

/**
 * Whether a step of `offset` from this position stays inside a chain of that
 * length — the one rule behind both `canMoveInChain` and the `canMoveUp` /
 * `canMoveDown` of a row. A position outside the chain can move nowhere.
 */
function canMoveAt(index: number, length: number, offset: number): boolean {
  if (index < 0) {
    return false;
  }
  const target = index + offset;
  return target >= 0 && target < length;
}

/**
 * Translates a gap in the nested tree into a position in the flat chain. The
 * gap's index counts within the parent's children, which in a chain is the one
 * level below it — so the position is the parent's own plus one, plus that
 * offset. Without a parent the gap sits at the head of the chain.
 *
 * This is the only place that bridges the nested tree and the flat chain.
 */
export function chainPosition(
  hierarchy: SpatialUnitHierarchy,
  gap: TreeGap<HierarchyLevel>
): number {
  const parentIndex = gap.parent
    ? hierarchy.chain().findIndex((entry) => entry.id === gap.parent!.id)
    : -1;
  return parentIndex + 1 + gap.index;
}

/**
 * Whether the tree offers an insert line at this gap of a chain.
 *
 * A hierarchy is a chain, so every level holds exactly one child and the gap
 * *before* a level is the only position it names on its own: the gap after
 * that child would address the same slot as the leading gap one level deeper.
 *
 * The end of the chain is the exception. The deepest level has no child, so
 * its children area stays folded away — the gap inside it can never be
 * clicked. The gap *after* the deepest level takes its place, and that is the
 * "append at the end" position.
 */
export function canInsertAtGap(
  levels: readonly HierarchyLevel[],
  gap: TreeGap<HierarchyLevel>
): boolean {
  // Inside the folded-away children area of a childless level; the trailing
  // gap one level up addresses the same position and is reachable.
  if (gap.parent && gap.parent.children.length === 0) {
    return false;
  }
  if (gap.index === 0) {
    return true;
  }
  // A trailing gap only names a position of its own at the end of the chain.
  const siblings = gap.parent ? gap.parent.children : levels;
  return siblings[gap.index - 1]?.children.length === 0;
}

/**
 * Inserts a level at the gap and returns it. The new level is expanded right
 * away — it now carries the rest of the chain as its children, which would
 * otherwise disappear.
 */
export function insertIntoChain(
  hierarchy: SpatialUnitHierarchy,
  gap: TreeGap<HierarchyLevel>,
  name: string
): HierarchyChainEntry {
  return insertAt(hierarchy, chainPosition(hierarchy, gap), name);
}

/**
 * Appends a level below the deepest one, where it becomes the finest level of
 * the hierarchy. This is what assigning a so far unassigned level does — the
 * gaps in the tree address the positions in between.
 */
export function appendToChain(hierarchy: SpatialUnitHierarchy, name: string): HierarchyChainEntry {
  return insertAt(hierarchy, hierarchy.chain().length, name);
}

/**
 * The one place that adds to a chain: mints the id the tree tracks the level by,
 * splices it in and marks it expanded — a level that is not in `expandedIds`
 * would come up folded and hide everything below it.
 */
function insertAt(
  hierarchy: SpatialUnitHierarchy,
  position: number,
  name: string
): HierarchyChainEntry {
  const entry: HierarchyChainEntry = { id: newId(), name };

  hierarchy.chain.update((entries) => {
    const next = [...entries];
    next.splice(position, 0, entry);
    return next;
  });
  hierarchy.expandedIds.update((ids) => new Set(ids).add(entry.id));

  return entry;
}

/** The position of a level in its chain, coarsest first; -1 when it is not in it. */
export function indexInChain(hierarchy: SpatialUnitHierarchy, level: HierarchyChainEntry): number {
  return hierarchy.chain().findIndex((entry) => entry.id === level.id);
}

/** Whether moving the level by that many steps would stay inside the chain. */
export function canMoveInChain(
  hierarchy: SpatialUnitHierarchy,
  level: HierarchyChainEntry,
  offset: number
): boolean {
  return canMoveAt(indexInChain(hierarchy, level), hierarchy.chain().length, offset);
}

/**
 * Moves a level one step along the chain, i.e. swaps it with the level above or
 * below it. The tree re-nests itself from the new order, and the ids stay with
 * their levels, so what was expanded stays expanded.
 *
 * Returns whether it moved — a step beyond either end of the chain does nothing.
 */
export function moveInChain(
  hierarchy: SpatialUnitHierarchy,
  level: HierarchyChainEntry,
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
export function removeFromChain(
  hierarchy: SpatialUnitHierarchy,
  level: HierarchyChainEntry
): boolean {
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
