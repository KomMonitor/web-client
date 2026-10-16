import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { InfoTooltipComponent, InfoTooltipPlacement } from './info-tooltip.component';

/** The component where it is used: inside a button that does something on click. */
@Component({
  standalone: true,
  imports: [InfoTooltipComponent],
  template: `
    <button type="button" (click)="clicks = clicks + 1">
      <span>Verwaltungsgliederung</span>
      <app-info-tooltip [text]="text" [placement]="placement" />
    </button>
  `,
})
class HostComponent {
  text = 'Amtliche Gliederung\nnach Satzung';
  placement: InfoTooltipPlacement = 'top';
  clicks = 0;
}

describe('InfoTooltipComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  // jsdom lays nothing out, so the viewport and the panel get sizes here.
  const VIEWPORT_WIDTH = 1000;
  const VIEWPORT_HEIGHT = 800;
  const PANEL_WIDTH = 200;
  const PANEL_HEIGHT = 40;

  beforeEach(() => {
    jest.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(VIEWPORT_WIDTH);
    jest.spyOn(document.documentElement, 'clientHeight', 'get').mockReturnValue(VIEWPORT_HEIGHT);
    jest.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(PANEL_WIDTH);
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(PANEL_HEIGHT);
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  afterEach(() => jest.restoreAllMocks());

  function render(placement: InfoTooltipPlacement = 'top'): void {
    fixture.componentInstance.placement = placement;
    fixture.detectChanges();
  }

  function icon(): HTMLElement {
    return fixture.debugElement.query(By.css('.info-tooltip-icon')).nativeElement;
  }

  function panel(): HTMLElement | null {
    return fixture.debugElement.query(By.css('.info-tooltip-panel'))?.nativeElement ?? null;
  }

  /** The panel's corner as the styles place it. */
  function corner(): { left: number; top: number } {
    return { left: parseFloat(panel()!.style.left), top: parseFloat(panel()!.style.top) };
  }

  /** Fires a mouse event on the icon and lets the panel be measured and placed. */
  async function hover(type: string, clientX = 500, clientY = 300): Promise<void> {
    icon().dispatchEvent(new MouseEvent(type, { clientX, clientY }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('shows no panel until the icon is hovered', () => {
    render();

    expect(panel()).toBeNull();
  });

  it('shows the text while the icon is hovered, line breaks and all', async () => {
    render();

    await hover('mouseenter');
    expect(panel()!.textContent).toBe('Amtliche Gliederung\nnach Satzung');

    await hover('mouseleave');
    expect(panel()).toBeNull();
  });

  // Cursor at (500, 300), panel 200 × 40. Below and to the right the panel
  // keeps more distance: the pointer hangs down and to the right.
  it.each<[InfoTooltipPlacement, { left: number; top: number }]>([
    ['top', { left: 400, top: 300 - 12 - 40 }],
    ['bottom', { left: 400, top: 300 + 24 }],
    ['left', { left: 500 - 12 - 200, top: 280 }],
    ['right', { left: 500 + 20, top: 280 }],
  ])('sits %s of the cursor, centred along the other axis', async (placement, expected) => {
    render(placement);

    await hover('mouseenter', 500, 300);

    expect(corner()).toEqual(expected);
  });

  it('places the panel above the cursor unless told otherwise', async () => {
    fixture.detectChanges();

    await hover('mouseenter', 500, 300);

    expect(corner()).toEqual({ left: 400, top: 248 });
  });

  it.each<[InfoTooltipPlacement, number, number, { left: number; top: number }]>([
    ['top', 500, 30, { left: 400, top: 30 + 24 }],
    ['bottom', 500, 780, { left: 400, top: 780 - 12 - 40 }],
    ['left', 100, 300, { left: 100 + 20, top: 280 }],
    ['right', 900, 300, { left: 900 - 12 - 200, top: 280 }],
  ])('moves to the opposite side where %s has no room', async (placement, x, y, expected) => {
    render(placement);

    await hover('mouseenter', x, y);

    expect(corner()).toEqual(expected);
  });

  it('shifts along the other axis to stay inside the viewport', async () => {
    render('top');

    await hover('mouseenter', VIEWPORT_WIDTH - 20, 300);
    expect(corner().left).toBe(VIEWPORT_WIDTH - PANEL_WIDTH - 8);

    await hover('mousemove', 20, 300);
    expect(corner().left).toBe(8);
  });

  it('shifts down for a side placement next to the top edge', async () => {
    render('right');

    await hover('mouseenter', 500, 10);

    expect(corner().top).toBe(8);
  });

  it('follows the mouse while it moves over the icon', async () => {
    render('top');

    await hover('mouseenter', 500, 300);
    await hover('mousemove', 540, 320);

    expect(corner()).toEqual({ left: 440, top: 268 });
  });

  it('keeps a click on the icon from reaching the surrounding button', () => {
    render();

    icon().click();
    fixture.debugElement.query(By.css('button')).nativeElement.click();

    // Only the click on the button itself counts.
    expect(fixture.componentInstance.clicks).toBe(1);
  });
});
