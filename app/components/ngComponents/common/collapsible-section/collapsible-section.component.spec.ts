import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CollapsibleSectionComponent } from './collapsible-section.component';

describe('CollapsibleSectionComponent', () => {
  let fixture: ComponentFixture<CollapsibleSectionComponent>;
  let component: CollapsibleSectionComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CollapsibleSectionComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(CollapsibleSectionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Verwaltungsgliederung');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title and defaults to the primary tone', () => {
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.css('.section-title')).nativeElement.textContent.trim()
    ).toBe('Verwaltungsgliederung');
    expect(fixture.debugElement.query(By.css('.section')).nativeElement.classList).toContain(
      'tone-primary'
    );
  });

  it('toggles open state when the header button is clicked', () => {
    const openChanges: boolean[] = [];
    component.open.subscribe((open) => openChanges.push(open));
    fixture.detectChanges();

    const toggle = fixture.debugElement.query(By.css('.section-toggle'));
    expect(toggle.nativeElement.getAttribute('aria-expanded')).toBe('true');

    toggle.nativeElement.click();
    fixture.detectChanges();

    expect(component.open()).toBe(false);
    expect(openChanges).toEqual([false]);
    expect(toggle.nativeElement.getAttribute('aria-expanded')).toBe('false');

    toggle.nativeElement.click();
    fixture.detectChanges();

    expect(component.open()).toBe(true);
    expect(openChanges).toEqual([false, true]);
  });

  it('flips the caret with the open state', () => {
    fixture.detectChanges();
    const caret = fixture.debugElement.query(By.css('.section-caret')).nativeElement;
    expect(caret.classList).toContain('fa-angle-down');

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(caret.classList).toContain('fa-angle-right');
  });

  it('drops the toggle button and stays open when not collapsible', () => {
    fixture.componentRef.setInput('collapsible', false);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('button.section-toggle'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.section-toggle.static'))).not.toBeNull();
    // A pinned section must not be collapsed by a stale `open` binding.
    // ngbCollapse always keeps the `collapse` class and adds `show` while expanded.
    expect(fixture.debugElement.query(By.css('.section-body')).nativeElement.classList).toContain(
      'show'
    );
  });

  it('shows the id chip only when showId is set', () => {
    fixture.componentRef.setInput('idLabel', 'a1f5c803');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.section-id'))).toBeNull();

    fixture.componentRef.setInput('showId', true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.section-id')).nativeElement.textContent.trim()).toBe(
      'a1f5c803'
    );
  });

  it('omits the meta element when no meta text is given', () => {
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.section-meta'))).toBeNull();

    fixture.componentRef.setInput('meta', '5 Ebenen');
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.section-meta')).nativeElement.textContent.trim()
    ).toBe('5 Ebenen');
  });
});

@Component({
  standalone: true,
  imports: [CollapsibleSectionComponent],
  template: `
    <app-collapsible-section title="Sozialraum-Gliederung" [(open)]="open">
      <button type="button" header-actions class="btn btn-sm btn-warning">Bearbeiten</button>
      <button type="button" header-actions class="btn btn-sm btn-danger">Löschen</button>
      <p class="projected-body">Inhalt</p>
    </app-collapsible-section>
  `,
})
class HostComponent {
  readonly open = signal(true);
}

describe('CollapsibleSectionComponent projection', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideNoopAnimations()],
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('projects header actions into the header and the rest into the body', () => {
    const actions = fixture.debugElement.queryAll(By.css('.section-actions button'));
    expect(actions.map((el) => el.nativeElement.textContent.trim())).toEqual([
      'Bearbeiten',
      'Löschen',
    ]);

    expect(fixture.debugElement.query(By.css('.section-body .projected-body'))).not.toBeNull();
  });

  it('keeps every action a direct child of the slot so the flex gap applies', () => {
    const slot = fixture.debugElement.query(By.css('.section-actions')).nativeElement;

    expect(Array.from(slot.children).map((el) => (el as Element).tagName)).toEqual([
      'BUTTON',
      'BUTTON',
    ]);
  });

  it('writes the open state back to the host through [(open)]', () => {
    fixture.debugElement.query(By.css('.section-toggle')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.open()).toBe(false);
  });
});
