import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';

/** The side of the cursor the panel sits on; along the other axis it is centred on the cursor. */
export type InfoTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/**
 * Distance from the cursor's hot spot to the panel, per side. The pointer
 * hangs down and to the right of its hot spot, so those two sides keep more.
 */
const OFFSET: Record<InfoTooltipPlacement, number> = { top: 12, bottom: 24, left: 12, right: 20 };

const OPPOSITE: Record<InfoTooltipPlacement, InfoTooltipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/** Space the panel keeps to the edges of the viewport. */
const EDGE = 8;

/** The panel's top left corner, in viewport coordinates. */
interface Corner {
  readonly left: number;
  readonly top: number;
}

/**
 * An info icon that shows a text in a panel following the mouse while the icon
 * is hovered: the look of the description tooltips of indicators
 * (`app-indicator-metadata-tooltip`) and georesources (`app-georesource-element`),
 * as a component of its own.
 *
 * `placement` names the side of the cursor the panel sits on — above (the
 * default), below, left or right of it, and centred on the cursor along the
 * other axis. The panel never runs past an edge of the viewport: where the
 * chosen side has no room it moves to the opposite one, and along the other
 * axis it shifts as far as it has to — next to the right edge of the screen,
 * in the legend, a panel above the cursor moves left.
 *
 * Made to sit inside a `<button>`: the panel is a `span`, and a click on the
 * icon stops at the icon, so reading the info does not trigger the button.
 *
 * ```html
 * <button type="button" (click)="select()">
 *   <span>{{ hierarchy.name }}</span>
 *   <app-info-tooltip [text]="hierarchy.description" placement="bottom" />
 * </button>
 * ```
 */
@Component({
  selector: 'app-info-tooltip',
  templateUrl: './info-tooltip.component.html',
  styleUrls: ['./info-tooltip.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoTooltipComponent {
  readonly text = input.required<string>();
  readonly placement = input<InfoTooltipPlacement>('top');

  protected readonly visible = signal(false);
  private readonly cursor = signal({ x: 0, y: 0 });

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /**
   * The rendered panel's size. Measured, not assumed: the panel is only as
   * big as its text, and centring needs its actual size. Kept across hovers,
   * so from the second one on the panel comes up in place straight away.
   */
  private readonly panelSize = signal({ width: 0, height: 0 });

  /** Where the fixed panel goes: on the chosen side, or the opposite one, held inside the viewport. */
  protected readonly position = computed(() => {
    const { x, y } = this.cursor();
    const { width, height } = this.panelSize();
    const viewport = document.documentElement;
    const maxLeft = viewport.clientWidth - width - EDGE;
    const maxTop = viewport.clientHeight - height - EDGE;

    // Whether the panel runs past the edge of the viewport on the side it is placed on.
    const overflows = (side: InfoTooltipPlacement, corner: Corner): boolean =>
      ({
        top: corner.top < EDGE,
        bottom: corner.top > maxTop,
        left: corner.left < EDGE,
        right: corner.left > maxLeft,
      })[side];

    const preferred = this.placement();
    const first = placeAt(preferred, x, y, width, height);
    const corner = overflows(preferred, first)
      ? placeAt(OPPOSITE[preferred], x, y, width, height)
      : first;
    return {
      left: Math.max(EDGE, Math.min(corner.left, maxLeft)),
      top: Math.max(EDGE, Math.min(corner.top, maxTop)),
    };
  });

  constructor() {
    // Runs when the panel appears, not on every render.
    afterRenderEffect(() => {
      const panel = this.panel()?.nativeElement;
      if (panel) {
        this.panelSize.set({ width: panel.offsetWidth, height: panel.offsetHeight });
      }
    });
  }

  protected show(event: MouseEvent): void {
    this.follow(event);
    this.visible.set(true);
  }

  protected follow(event: MouseEvent): void {
    this.cursor.set({ x: event.clientX, y: event.clientY });
  }

  protected hide(): void {
    this.visible.set(false);
  }
}

/** The panel's top left corner on one side of the cursor, centred on it along the other axis. */
function placeAt(
  side: InfoTooltipPlacement,
  x: number,
  y: number,
  width: number,
  height: number
): Corner {
  switch (side) {
    case 'top':
      return { left: x - width / 2, top: y - OFFSET.top - height };
    case 'bottom':
      return { left: x - width / 2, top: y + OFFSET.bottom };
    case 'left':
      return { left: x - OFFSET.left - width, top: y - height / 2 };
    case 'right':
      return { left: x + OFFSET.right, top: y - height / 2 };
  }
}
