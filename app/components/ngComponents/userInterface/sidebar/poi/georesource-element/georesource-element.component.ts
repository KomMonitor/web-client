import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
} from '@angular/core';

/** Highest nesting depth that still gets its own hierarchy color; deeper levels reuse it. */
const MAX_STYLED_LEVEL = 4;

/** Keeps each row's floating description panel addressable by a DOM id of its own. */
let nextTooltipId = 0;

/**
 * Shared row chrome for a single georesource dataset (POI/LOI/AOI/WMS/WFS),
 * styled like `app-topic-element` but for a leaf row instead of a collapsible
 * topic: a clickable area (symbol/legend + title + an info icon showing the
 * description in a mouse-following tooltip, the same technique
 * `app-indicator-metadata-tooltip` uses) that toggles the dataset on the map,
 * plus a trailing area for whatever controls the dataset type needs (date
 * selection, export/metadata icons, favourite star).
 *
 * There is no selection checkbox — clicking the row itself is the toggle, so
 * several dataset rows can be active independently. Purely presentational:
 * the caller owns the toggle side effect and reacts to `rowClick`.
 *
 * ```html
 * <app-georesource-element
 *   [title]="poi.datasetName"
 *   [description]="poi.metadata?.description"
 *   [selected]="poi.isSelected"
 *   (rowClick)="onToggle()"
 * >
 *   <app-export-item-checkbox georesourceElementBeforeToggle ...></app-export-item-checkbox>
 *   <ng-container georesourceElementLeading>...symbol/legend markup...</ng-container>
 *   <ng-container georesourceElementAfterTitle>...zoom icon...</ng-container>
 *   ...date select / export / fav controls...
 * </app-georesource-element>
 * ```
 */
@Component({
  selector: 'app-georesource-element',
  templateUrl: './georesource-element.component.html',
  styleUrls: ['./georesource-element.component.scss'],
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoresourceElementComponent {
  readonly title = input.required<string>();
  readonly description = input<string | null | undefined>(null);
  readonly selected = input(false);
  /** Nesting depth of the enclosing topic, for the same per-level border/background `app-topic-element` uses. */
  readonly level = input(0);

  readonly rowClick = output<void>();

  /** Unique per instance, so several rows rendered at once don't share one tooltip panel. */
  protected readonly tooltipId = `georesource-element-tooltip-${nextTooltipId++}`;

  protected mousePosX = '0px';
  protected mousePosY = '0px';
  private readonly tooltipOffsetX = 20;
  private readonly tooltipOffsetY = -100;

  @HostListener('mousemove', ['$event']) onMouseMove(event: MouseEvent): void {
    this.mousePosX = `${event.clientX + this.tooltipOffsetX}px`;
    this.mousePosY = `${event.clientY + this.tooltipOffsetY}px`;
  }

  protected onInfoMouseover(): void {
    const tooltip = document.getElementById(this.tooltipId);
    if (tooltip) tooltip.style.display = 'block';
  }

  protected onInfoMouseout(): void {
    const tooltip = document.getElementById(this.tooltipId);
    if (tooltip) tooltip.style.display = 'none';
  }

  /** CSS var for this row's level color, swapped for the solid "-selected" variant when applicable. */
  protected readonly levelColorStyling = computed(() => {
    const clampedLevel = Math.min(this.level(), MAX_STYLED_LEVEL);

    if (!this.selected())
      return `border-left: 3px solid var(--kommonitor-hierarchy-level-${clampedLevel})`;
    else
      return `border-left: 3px solid var(--kommonitor-primary); background-color: var(--kommonitor-hierarchy-level-${clampedLevel})`;
  });
}
