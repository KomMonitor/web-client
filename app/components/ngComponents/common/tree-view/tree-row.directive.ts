import { Directive, TemplateRef, inject } from '@angular/core';

import { TreeGapContext, TreeNodeFooterContext, TreeRowContext } from './tree-view.model';

/**
 * Marks the template that renders the content of a tree row.
 *
 * ```html
 * <ng-template appTreeRow let-node let-depth="depth"> … </ng-template>
 * ```
 */
@Directive({
  selector: 'ng-template[appTreeRow]',
  standalone: true,
})
export class TreeRowDirective<T> {
  readonly template = inject<TemplateRef<TreeRowContext<T>>>(TemplateRef);

  /** Types `let-node` / `let-depth` etc. under strictTemplates. */
  static ngTemplateContextGuard<T>(
    _directive: TreeRowDirective<T>,
    _context: unknown
  ): _context is TreeRowContext<T> {
    return true;
  }
}

/**
 * Marks an optional template rendered as the last row inside a node's children —
 * the place for an inline "add child" form.
 */
@Directive({
  selector: 'ng-template[appTreeNodeFooter]',
  standalone: true,
})
export class TreeNodeFooterDirective<T> {
  readonly template = inject<TemplateRef<TreeNodeFooterContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: TreeNodeFooterDirective<T>,
    _context: unknown
  ): _context is TreeNodeFooterContext<T> {
    return true;
  }
}

/**
 * Marks an optional template rendered in place of an insert line, at the gap the
 * caller has opened via `[(openGap)]`. The tree only positions it — what it shows
 * is entirely the caller's business.
 */
@Directive({
  selector: 'ng-template[appTreeGap]',
  standalone: true,
})
export class TreeGapDirective<T> {
  readonly template = inject<TemplateRef<TreeGapContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _directive: TreeGapDirective<T>,
    _context: unknown
  ): _context is TreeGapContext<T> {
    return true;
  }
}
