import { InjectionToken, Signal, TemplateRef } from '@angular/core';

/** Reads the children of a node. */
export type TreeChildrenFn<T> = (node: T) => readonly T[] | null | undefined;

/** Stable key of a node — used for the expanded set and for `@for` tracking. */
export type TreeIdFn<T> = (node: T) => string;

/**
 * How a row shows its depth.
 * - 'accent': white row with a coloured rail on its left edge (the design draft's look)
 * - 'filled': the whole row carries the depth tint
 * - 'none': no depth styling at all
 */
export type TreeViewTone = 'accent' | 'filled' | 'none';

/**
 * Where the indent is applied.
 * - 'text': rows keep full width and their content is pushed in by a spacer
 * - 'row': the whole row is shifted right
 */
export type TreeIndentMode = 'text' | 'row';

/** How many distinct depth tints exist; deeper rows reuse the last one. */
export const TREE_TONE_DEPTHS = 4;

export interface TreeReorderEvent<T> {
  /** null = root level. */
  readonly parent: T | null;
  readonly previousIndex: number;
  readonly currentIndex: number;
  /** The siblings in their NEW order — a fresh array, never the bound one. */
  readonly nodes: readonly T[];
}

/**
 * A position between two siblings. Doubles as the payload of the `insert` output
 * and as the address of the currently open gap slot.
 */
export interface TreeGap<T> {
  /** null = root level. */
  readonly parent: T | null;
  /** Position between the siblings; `nodes.length` means "append at the end". */
  readonly index: number;
}

/** Context handed to the caller's `appTreeRow` template. */
export interface TreeRowContext<T> {
  readonly $implicit: T;
  readonly node: T;
  /** 0-based. */
  readonly depth: number;
  readonly expanded: boolean;
  readonly hasChildren: boolean;
  readonly expandable: boolean;
  readonly toggle: () => void;
}

/** Context handed to the caller's `appTreeGap` template. */
export interface TreeGapContext<T> {
  readonly $implicit: TreeGap<T>;
  readonly gap: TreeGap<T>;
  readonly depth: number;
  /** Closes the slot by resetting `openGap`. */
  readonly close: () => void;
}

/** Context handed to the caller's `appTreeNodeFooter` template. */
export interface TreeNodeFooterContext<T> {
  readonly $implicit: T;
  readonly node: T;
  readonly depth: number;
}

/**
 * What the recursive level component needs from the root component. Passing it
 * through DI instead of through inputs keeps the recursion down to the three
 * values that actually change per level (nodes, depth, parent).
 */
export interface TreeViewHost<T> {
  readonly rowTemplate: Signal<TemplateRef<TreeRowContext<T>> | undefined>;
  readonly nodeFooterTemplate: Signal<TemplateRef<TreeNodeFooterContext<T>> | undefined>;
  readonly gapTemplate: Signal<TemplateRef<TreeGapContext<T>> | undefined>;
  readonly childrenOf: Signal<TreeChildrenFn<T>>;
  readonly idOf: Signal<TreeIdFn<T>>;
  readonly maxDepth: Signal<number | null>;
  readonly indentStep: Signal<number>;
  readonly maxIndent: Signal<number>;
  readonly tone: Signal<TreeViewTone>;
  readonly indentMode: Signal<TreeIndentMode>;
  readonly reorderable: Signal<boolean>;
  readonly insertLabel: Signal<string | undefined>;
  readonly canInsertAt: Signal<(gap: TreeGap<T>) => boolean>;
  readonly toggleLabel: Signal<string | undefined>;
  readonly toggleOnRowClick: Signal<boolean>;

  isExpanded(node: T): boolean;
  toggleNode(node: T): void;
  emitReorder(event: TreeReorderEvent<T>): void;
  /** Opens the gap slot when a gap template is projected, emits `insert` otherwise. */
  activateGap(gap: TreeGap<T>): void;
  /** Compares by `idOf(parent)` and index, not by object identity. */
  isGapOpen(parentId: string | null, index: number): boolean;
  closeGap(): void;
}

export const TREE_VIEW_HOST = new InjectionToken<TreeViewHost<unknown>>('TREE_VIEW_HOST');

/**
 * Returns a new set with `id` flipped. Never mutates the input: the expanded set
 * is a signal value, and an in-place change would be invisible to OnPush views.
 */
export function toggleTreeId(ids: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(ids);
  if (!next.delete(id)) {
    next.add(id);
  }
  return next;
}

/** Indent of a row in px, capped so deep chains stay readable. */
export function treeIndent(depth: number, step: number, maxIndent: number): number {
  return Math.min(Math.max(depth, 0) * step, maxIndent);
}

/** Which of the depth tints a row uses; deeper rows reuse the last one. */
export function treeToneDepth(depth: number): number {
  return Math.min(Math.max(depth, 0), TREE_TONE_DEPTHS - 1);
}

/** Whether the children of a node at `depth` may be rendered at all. */
export function isWithinTreeDepth(depth: number, maxDepth: number | null): boolean {
  return maxDepth === null || depth < maxDepth;
}

/**
 * Whether a node's children area can be opened at all. A childless node is still
 * expandable when a footer template is projected: opening it is how the first
 * child gets added.
 */
export function isTreeNodeExpandable(
  hasChildren: boolean,
  hasNodeFooter: boolean,
  depth: number,
  maxDepth: number | null
): boolean {
  return isWithinTreeDepth(depth, maxDepth) && (hasChildren || hasNodeFooter);
}

/** The siblings in their new order, as a fresh array. */
export function reorderTreeSiblings<T>(
  nodes: readonly T[],
  previousIndex: number,
  currentIndex: number
): T[] {
  const next = [...nodes];
  const [moved] = next.splice(previousIndex, 1);
  next.splice(currentIndex, 0, moved);
  return next;
}
