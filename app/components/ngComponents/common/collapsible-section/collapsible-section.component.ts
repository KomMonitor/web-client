import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';

/**
 * Header colour of a section.
 *
 * 'primary' is the solid accent bar used for top level sections; the 'level-*'
 * tones reuse the `--kommonitor-hierarchy-level-*` custom properties from
 * app.scss so nested sections step down in weight without new colour values.
 * 'muted' is the grey bar for a section that stands beside that structure
 * rather than inside it.
 */
export type CollapsibleSectionTone =
  | 'primary'
  | 'muted'
  | 'level-0'
  | 'level-1'
  | 'level-2'
  | 'level-3';

let nextBodyId = 0;

/**
 * Generic collapsible section with a coloured header bar: caret, title, an
 * optional id chip, an optional meta text and a projected slot for action
 * buttons on the right.
 *
 * Distinct from `expandable-box`, which is a white panel with a thin top border
 * accent and no room for meta text or actions.
 *
 * Mark every button with `header-actions` instead of wrapping them in one
 * container — the slot lays its children out with a gap between them.
 *
 * ```html
 * <app-collapsible-section title="Verwaltungsgliederung" meta="5 Ebenen" [(open)]="open">
 *   <button header-actions type="button" class="btn btn-sm btn-warning" (click)="edit()">
 *     Bearbeiten
 *   </button>
 *   <button header-actions type="button" class="btn btn-sm btn-danger" (click)="remove()">
 *     Löschen
 *   </button>
 *   ...
 * </app-collapsible-section>
 * ```
 */
@Component({
  selector: 'app-collapsible-section',
  templateUrl: './collapsible-section.component.html',
  styleUrls: ['./collapsible-section.component.scss'],
  imports: [NgbCollapseModule, NgTemplateOutlet],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapsibleSectionComponent {
  /** Already translated header text — call sites pipe their i18n key through `| translate`. */
  readonly title = input.required<string>();
  /** Secondary header text, e.g. "5 Ebenen". */
  readonly meta = input<string>();
  /** Identifier shown as a monospace chip, only rendered while `showId` is true. */
  readonly idLabel = input<string>();
  readonly showId = input(false);
  readonly tone = input<CollapsibleSectionTone>('primary');
  /** `false` pins the section open and drops the toggle button entirely. */
  readonly collapsible = input(true);
  /** Two-way bindable via `[(open)]`; ignored while `collapsible` is false. */
  readonly open = model(true);

  /** `ngbCollapse` takes the inverse of `open` — and a pinned section never collapses. */
  protected readonly collapsed = computed(() => this.collapsible() && !this.open());

  protected readonly bodyId = `collapsible-section-body-${nextBodyId++}`;

  protected toggle(): void {
    this.open.update((open) => !open);
  }
}
