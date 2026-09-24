import { NgTemplateOutlet } from '@angular/common';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPreview,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

import {
  TREE_VIEW_HOST,
  TreeGapContext,
  TreeNodeFooterContext,
  TreeRowContext,
  isTreeNodeExpandable,
  isWithinTreeDepth,
  reorderTreeSiblings,
  treeIndent,
  treeToneDepth,
} from './tree-view.model';

/**
 * Everything one row of this level needs, derived once per change instead of on
 * every template read. Resolving it in the template meant walking from the node
 * to its children, depth limit and expanded state a handful of times per row and
 * change detection cycle — and handing `ngTemplateOutlet` a freshly built context
 * object every time, which made it rewrite the row context on every cycle.
 */
interface TreeRow {
  readonly node: unknown;
  readonly id: string;
  readonly children: readonly unknown[];
  readonly expandable: boolean;
  readonly expanded: boolean;
  /** Target of the caret's `aria-controls`. */
  readonly childrenId: string;
  readonly context: TreeRowContext<unknown>;
  readonly footerContext: TreeNodeFooterContext<unknown>;
  /** Does nothing unless the row is expandable. */
  readonly toggle: () => void;
}

/**
 * The indent of one row, split over the two places it can be applied. The indent
 * modes are exclusive, so one of the two is always 0.
 */
interface TreeIndent {
  /** Shifts the whole row box ('row' mode). */
  readonly row: number;
  /** Width of the spacer inside the row, which keeps it full width ('text' mode). */
  readonly text: number;
}

/**
 * Renders one sibling level of the tree and recurses into the children. Internal
 * to `app-tree-view` — everything except the three values below comes from the
 * root component through `TREE_VIEW_HOST`.
 */
@Component({
  selector: 'app-tree-level',
  templateUrl: './tree-level.component.html',
  styleUrls: ['./tree-level.component.scss'],
  imports: [
    NgTemplateOutlet,
    NgbCollapseModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPreview,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeLevelComponent {
  protected readonly host = inject(TREE_VIEW_HOST);

  readonly nodes = input.required<readonly unknown[]>();
  /** 0-based. */
  readonly depth = input(0);
  /** null at the root level. */
  readonly parent = input<unknown | null>(null);

  protected readonly toneClass = computed(() => {
    const tone = this.host.tone();
    return tone === 'none' ? 'tone-none' : `tone-${tone}-${treeToneDepth(this.depth())}`;
  });

  protected readonly childDepth = computed(() => this.depth() + 1);

  /** Indent of this level's rows. */
  protected readonly indent = computed(() => this.indentAt(this.depth()));

  /** Indent of the node footer, which sits one level deeper than its node. */
  protected readonly childIndent = computed(() => this.indentAt(this.childDepth()));

  /** Identifies this level's gaps; null at the root. */
  protected readonly parentId = computed(() => {
    const parent = this.parent();
    return parent === null ? null : this.host.idOf()(parent);
  });

  /** Whether the children of this level's nodes may be rendered at all. */
  protected readonly childrenAllowed = computed(() =>
    isWithinTreeDepth(this.depth(), this.host.maxDepth())
  );

  protected readonly rows = computed<readonly TreeRow[]>(() => {
    const idOf = this.host.idOf();
    const childrenOf = this.host.childrenOf();
    const depth = this.depth();
    const childDepth = this.childDepth();
    const maxDepth = this.host.maxDepth();
    const hasNodeFooter = this.host.nodeFooterTemplate() !== undefined;

    return this.nodes().map((node) => {
      const id = idOf(node);
      const children = childrenOf(node) ?? [];
      const hasChildren = children.length > 0;
      const expandable = isTreeNodeExpandable(hasChildren, hasNodeFooter, depth, maxDepth);
      const expanded = expandable && this.host.isExpanded(node);
      const toggle = () => {
        if (expandable) {
          this.host.toggleNode(node);
        }
      };

      return {
        node,
        id,
        children,
        expandable,
        expanded,
        childrenId: `tree-children-${id}`,
        context: { $implicit: node, node, depth, expanded, hasChildren, expandable, toggle },
        footerContext: { $implicit: node, node, depth: childDepth },
        toggle,
      };
    });
  });

  protected onRowClick(row: TreeRow): void {
    if (this.host.toggleOnRowClick()) {
      row.toggle();
    }
  }

  /** Space activates the row like a button, without scrolling the page. */
  protected onRowSpace(event: Event, row: TreeRow): void {
    if (!this.host.toggleOnRowClick()) {
      return;
    }
    event.preventDefault();
    row.toggle();
  }

  protected onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    // Never mutate the bound array — the host owns the data and decides whether
    // the new order survives (it may have to roll back on a failed request).
    this.host.emitReorder({
      parent: this.parent(),
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      nodes: reorderTreeSiblings(this.nodes(), event.previousIndex, event.currentIndex),
    });
  }

  /**
   * Indent of the gap at `index`. Normally the level's own — the gap sits among
   * its rows. The trailing gap of a non-empty level is the exception when the
   * host asks for it: there it addresses a child of the last row, not another
   * sibling, and is drawn one step in.
   */
  protected gapIndent(index: number): TreeIndent {
    const isTrailing = index > 0 && index === this.rows().length;
    return isTrailing && this.host.trailingGapAsChild() ? this.childIndent() : this.indent();
  }

  protected canInsertAt(index: number): boolean {
    return this.host.canInsertAt()({ parent: this.parent(), index });
  }

  protected onInsert(index: number): void {
    this.host.activateGap({ parent: this.parent(), index });
  }

  protected gapContext(index: number): TreeGapContext<unknown> {
    const gap = { parent: this.parent(), index };
    return {
      $implicit: gap,
      gap,
      depth: this.depth(),
      close: () => this.host.closeGap(),
    };
  }

  private indentAt(depth: number): TreeIndent {
    const indent = treeIndent(depth, this.host.indentStep(), this.host.maxIndent());
    return this.host.indentMode() === 'row' ? { row: indent, text: 0 } : { row: 0, text: indent };
  }
}
