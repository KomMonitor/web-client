import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  forwardRef,
  input,
  model,
  output,
} from '@angular/core';

import { TreeLevelComponent } from './tree-level.component';
import { TreeGapDirective, TreeNodeFooterDirective, TreeRowDirective } from './tree-row.directive';
import {
  TREE_VIEW_HOST,
  TreeChildrenFn,
  TreeGap,
  TreeIdFn,
  TreeIndentMode,
  TreeReorderEvent,
  TreeViewHost,
  TreeViewTone,
  toggleTreeId,
} from './tree-view.model';

/**
 * Generic, domain-free tree: it owns the structure — nesting, indentation,
 * expand/collapse, drag & drop reordering and the dashed insert lines — while
 * the caller supplies the row content as a template.
 *
 * ```html
 * <app-tree-view
 *   [nodes]="hierarchy.levels"
 *   [idOf]="levelId"
 *   [childrenOf]="levelChildren"
 *   [(expandedIds)]="expanded"
 * >
 *   <ng-template appTreeRow let-level let-depth="depth">
 *     <span>{{ depth + 1 }}. {{ level.name }}</span>
 *   </ng-template>
 * </app-tree-view>
 * ```
 *
 * The component never mutates `nodes`: reordering and inserting are reported as
 * events, so the caller keeps control over persistence and rollback.
 */
@Component({
  selector: 'app-tree-view',
  templateUrl: './tree-view.component.html',
  styleUrls: ['./tree-view.component.scss'],
  imports: [TreeLevelComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: TREE_VIEW_HOST, useExisting: forwardRef(() => TreeViewComponent) }],
})
export class TreeViewComponent<T> implements TreeViewHost<T> {
  /** The root level. Never mutated by this component. */
  readonly nodes = input.required<readonly T[]>();

  /** Stable key per node — used for the expanded set and for `@for` tracking. */
  readonly idOf = input.required<TreeIdFn<T>>();

  /** Children of a node. Defaults to `subTopics`, the field every existing tree in this app uses. */
  readonly childrenOf = input<TreeChildrenFn<T>>(
    (node) => (node as { subTopics?: readonly T[] }).subTopics
  );

  /** Open nodes, two-way bindable via `[(expandedIds)]` so the caller can persist them. */
  readonly expandedIds = model<ReadonlySet<string>>(new Set<string>());

  /** Deepest level that may be expanded, 0-based. `null` means unlimited. */
  readonly maxDepth = input<number | null>(null);

  readonly indentStep = input(20);
  readonly maxIndent = input(80);

  /** 'accent' rails the depth on the left edge, 'filled' tints the whole row, 'none' does neither. */
  readonly tone = input<TreeViewTone>('accent');

  /** 'text' keeps rows full width and indents their content, 'row' shifts the whole row. */
  readonly indentMode = input<TreeIndentMode>('text');

  /** Enables drag & drop reordering among siblings. */
  readonly reorderable = input(false);
  readonly reorder = output<TreeReorderEvent<T>>();

  /** Set to render dashed insert lines between and after the siblings. */
  readonly insertLabel = input<string>();

  /**
   * Decides which gaps get a line at all. Every level offers one gap before each
   * sibling plus one at the end, which is right for a branching tree but not
   * always: in a chain, where each level holds a single child, the trailing gap
   * of one level addresses the same position as the leading gap of the next.
   */
  readonly canInsertAt = input<(gap: TreeGap<T>) => boolean>(() => true);

  /**
   * Draws the gap after the last sibling of a level one step deeper, at the
   * indent of a child rather than of a sibling. For a chain that is what the
   * position means: below the deepest level there are no siblings left, so
   * appending there adds a child to it, and the indent says so.
   *
   * Only the trailing gap of a non-empty level is affected — in an empty level
   * the single gap is the first position, not an append.
   */
  readonly trailingGapAsChild = input(false);

  /**
   * Emitted when an insert line is clicked — but only while no `appTreeGap`
   * template is projected. With one, the click opens that slot instead and the
   * caller acts from inside it.
   */
  readonly insert = output<TreeGap<T>>();

  /**
   * The gap whose `appTreeGap` slot is open, two-way bindable via `[(openGap)]`.
   * The caller owns it and may open or close a slot itself.
   */
  readonly openGap = model<TreeGap<T> | null>(null);

  /** Accessible name of the caret button, e.g. "Unterebenen anzeigen". */
  readonly toggleLabel = input<string>();

  /** Whether clicking anywhere on a row toggles it, not just the caret. */
  readonly toggleOnRowClick = input(false);

  private readonly rowDirective = contentChild(TreeRowDirective<T>);
  private readonly nodeFooterDirective = contentChild(TreeNodeFooterDirective<T>);
  private readonly gapDirective = contentChild(TreeGapDirective<T>);

  readonly rowTemplate = computed(() => this.rowDirective()?.template);
  readonly nodeFooterTemplate = computed(() => this.nodeFooterDirective()?.template);
  readonly gapTemplate = computed(() => this.gapDirective()?.template);

  isExpanded(node: T): boolean {
    return this.expandedIds().has(this.idOf()(node));
  }

  toggleNode(node: T): void {
    this.expandedIds.update((ids) => toggleTreeId(ids, this.idOf()(node)));
  }

  emitReorder(event: TreeReorderEvent<T>): void {
    this.reorder.emit(event);
  }

  activateGap(gap: TreeGap<T>): void {
    if (this.gapTemplate()) {
      this.openGap.set(gap);
      return;
    }
    this.insert.emit(gap);
  }

  isGapOpen(parentId: string | null, index: number): boolean {
    const open = this.openGap();
    if (!open || open.index !== index) {
      return false;
    }
    const openParentId = open.parent ? this.idOf()(open.parent) : null;
    return openParentId === parentId;
  }

  closeGap(): void {
    this.openGap.set(null);
  }
}
