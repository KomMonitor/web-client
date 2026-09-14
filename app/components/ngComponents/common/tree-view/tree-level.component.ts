import { NgClass, NgTemplateOutlet } from '@angular/common';
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
 * Renders one sibling level of the tree and recurses into the children. Internal
 * to `app-tree-view` — everything except the three values below comes from the
 * root component through `TREE_VIEW_HOST`.
 */
@Component({
  selector: 'app-tree-level',
  templateUrl: './tree-level.component.html',
  styleUrls: ['./tree-level.component.scss'],
  imports: [
    NgClass,
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

  protected readonly indent = computed(() =>
    treeIndent(this.depth(), this.host.indentStep(), this.host.maxIndent())
  );

  protected readonly toneClass = computed(() => {
    const tone = this.host.tone();
    return tone === 'none' ? 'tone-none' : `tone-${tone}-${treeToneDepth(this.depth())}`;
  });

  /** Indent applied to the row box itself — 0 in 'text' mode. */
  protected readonly rowIndent = computed(() =>
    this.host.indentMode() === 'row' ? this.indent() : 0
  );

  /** Indent applied by a spacer inside the row — 0 in 'row' mode. */
  protected readonly textIndent = computed(() =>
    this.host.indentMode() === 'text' ? this.indent() : 0
  );

  protected readonly childDepth = computed(() => this.depth() + 1);

  /** Identifies this level's gaps; null at the root. */
  protected readonly parentId = computed(() => {
    const parent = this.parent();
    return parent === null ? null : this.host.resolveId()(parent);
  });

  private readonly childIndent = computed(() =>
    treeIndent(this.childDepth(), this.host.indentStep(), this.host.maxIndent())
  );

  protected readonly footerRowIndent = computed(() =>
    this.host.indentMode() === 'row' ? this.childIndent() : 0
  );

  protected readonly footerTextIndent = computed(() =>
    this.host.indentMode() === 'text' ? this.childIndent() : 0
  );

  protected trackNode = (_index: number, node: unknown): string => this.host.resolveId()(node);

  protected childrenOf(node: unknown): readonly unknown[] {
    return this.host.resolveChildren()(node) ?? [];
  }

  protected hasChildren(node: unknown): boolean {
    return this.childrenOf(node).length > 0;
  }

  protected isExpandable(node: unknown): boolean {
    return isTreeNodeExpandable(
      this.hasChildren(node),
      this.host.nodeFooterTemplate() !== undefined,
      this.depth(),
      this.host.maxDepth()
    );
  }

  /** Whether the children of this level's nodes may be rendered at all. */
  protected readonly childrenAllowed = computed(() =>
    isWithinTreeDepth(this.depth(), this.host.maxDepth())
  );

  protected isExpanded(node: unknown): boolean {
    return this.isExpandable(node) && this.host.isExpanded(node);
  }

  protected childrenId(node: unknown): string {
    return `tree-children-${this.host.resolveId()(node)}`;
  }

  protected rowContext(node: unknown): TreeRowContext<unknown> {
    return {
      $implicit: node,
      node,
      depth: this.depth(),
      expanded: this.isExpanded(node),
      hasChildren: this.hasChildren(node),
      expandable: this.isExpandable(node),
      toggle: () => this.toggle(node),
    };
  }

  protected footerContext(node: unknown): TreeNodeFooterContext<unknown> {
    return { $implicit: node, node, depth: this.childDepth() };
  }

  protected toggle(node: unknown): void {
    if (this.isExpandable(node)) {
      this.host.toggleNode(node);
    }
  }

  protected onRowClick(node: unknown): void {
    if (this.host.toggleOnRowClick()) {
      this.toggle(node);
    }
  }

  /** Space activates the row like a button, without scrolling the page. */
  protected onRowSpace(event: Event, node: unknown): void {
    if (!this.host.toggleOnRowClick()) {
      return;
    }
    event.preventDefault();
    this.toggle(node);
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
}
