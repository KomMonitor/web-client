import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { GeoresourceElementComponent } from './georesource-element.component';

@Component({
  standalone: true,
  imports: [GeoresourceElementComponent],
  template: `
    <app-georesource-element title="Schulen">
      <span georesourceElementBeforeToggle class="marker">before</span>
    </app-georesource-element>
  `,
})
class HostComponent {}

describe('GeoresourceElementComponent', () => {
  let fixture: ComponentFixture<GeoresourceElementComponent>;
  let component: GeoresourceElementComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [GeoresourceElementComponent] });
    fixture = TestBed.createComponent(GeoresourceElementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('title', 'Schulen');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    fixture.componentRef.setInput('title', 'Schulen');
    fixture.detectChanges();

    expect(
      fixture.debugElement
        .query(By.css('.georesource-element__title'))
        .nativeElement.textContent.trim()
    ).toBe('Schulen');
  });

  it('emits rowClick when the row is clicked', () => {
    let emitted = 0;
    component.rowClick.subscribe(() => emitted++);
    fixture.componentRef.setInput('title', 'Schulen');
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.georesource-element__toggle')).nativeElement.click();
    expect(emitted).toBe(1);
  });

  it('shows an info icon only when a description is set', () => {
    fixture.componentRef.setInput('title', 'Schulen');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.georesource-element__info'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.georesource-element__info-tooltip'))).toBeNull();

    fixture.componentRef.setInput('description', 'Alle Schulen im Stadtgebiet');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.georesource-element__info'))).not.toBeNull();
  });

  it('shows the description in a tooltip panel on hover, and hides it again on mouseout', () => {
    fixture.componentRef.setInput('title', 'Schulen');
    fixture.componentRef.setInput('description', 'Alle Schulen im Stadtgebiet');
    fixture.detectChanges();

    const info = fixture.debugElement.query(By.css('.georesource-element__info'));
    const tooltip = fixture.debugElement.query(By.css('.georesource-element__info-tooltip'))
      .nativeElement as HTMLElement;
    expect(tooltip.textContent?.trim()).toBe('Alle Schulen im Stadtgebiet');
    expect(tooltip.style.display).toBe('');

    info.triggerEventHandler('mouseover', {});
    expect(tooltip.style.display).toBe('block');

    info.triggerEventHandler('mouseout', {});
    expect(tooltip.style.display).toBe('none');
  });

  it('positions the tooltip panel off the current mouse position', () => {
    fixture.componentRef.setInput('title', 'Schulen');
    fixture.componentRef.setInput('description', 'Alle Schulen im Stadtgebiet');
    fixture.detectChanges();

    fixture.debugElement
      .query(By.css('.georesource-element'))
      .nativeElement.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 100, clientY: 200, bubbles: true })
      );
    fixture.detectChanges();

    const tooltip = fixture.debugElement.query(By.css('.georesource-element__info-tooltip'))
      .nativeElement as HTMLElement;
    expect(tooltip.style.left).toBe('120px');
    expect(tooltip.style.top).toBe('100px');
  });

  it('does not toggle the row when the info icon itself is clicked', () => {
    let emitted = 0;
    component.rowClick.subscribe(() => emitted++);
    fixture.componentRef.setInput('title', 'Schulen');
    fixture.componentRef.setInput('description', 'Alle Schulen im Stadtgebiet');
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.georesource-element__info')).nativeElement.click();
    expect(emitted).toBe(0);
  });

  it('fills the row with the level color only once selected', () => {
    fixture.componentRef.setInput('title', 'Schulen');
    fixture.componentRef.setInput('level', 1);
    fixture.detectChanges();
    let row = fixture.debugElement.query(By.css('.georesource-element'))
      .nativeElement as HTMLElement;
    expect(row.style.backgroundColor).toBe('');

    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();
    row = fixture.debugElement.query(By.css('.georesource-element')).nativeElement as HTMLElement;
    expect(row.style.backgroundColor).toBe('var(--kommonitor-hierarchy-level-1)');
  });

  it('projects georesourceElementBeforeToggle content before the toggle button', () => {
    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();

    const row = hostFixture.debugElement.query(By.css('.georesource-element')).nativeElement;
    const marker = row.querySelector('.marker');
    const toggle = row.querySelector('.georesource-element__toggle');

    expect(marker).not.toBeNull();
    expect(marker.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
