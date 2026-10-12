import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { GeoresourceWmsElementComponent } from './georesource-wms-element.component';

function makeWms(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'wms-1',
    title: 'Luftbilder',
    description: 'Aktuelle Luftbilder',
    isSelected: false,
    showLegend: false,
    connectionDetails: {
      baseUrl: 'https://example.org/wms',
      layerName: 'luftbilder',
    },
    ...overrides,
  };
}

describe('GeoresourceWmsElementComponent', () => {
  let fixture: ComponentFixture<GeoresourceWmsElementComponent>;
  let component: GeoresourceWmsElementComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceWmsElementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(GeoresourceWmsElementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.dataset = makeWms();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    component.dataset = makeWms();
    fixture.detectChanges();

    expect(
      fixture.debugElement
        .query(By.css('.georesource-element__title'))
        .nativeElement.textContent.trim()
    ).toBe('Luftbilder');
  });

  it('toggles isSelected and emits toggleWmsOnMap when the row is clicked', () => {
    const dataset = makeWms();
    component.dataset = dataset;
    const emitted: any[] = [];
    component.toggleWmsOnMap.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.georesource-element__toggle')).nativeElement.click();

    expect(dataset.isSelected).toBe(true);
    expect(emitted).toEqual([dataset]);
  });

  it('loads the legend on button click without toggling the row', () => {
    const dataset = makeWms();
    component.dataset = dataset;
    fixture.detectChanges();

    let toggleEmitted = 0;
    component.toggleWmsOnMap.subscribe(() => toggleEmitted++);
    fixture.debugElement.query(By.css('.wms-element__load-legend')).nativeElement.click();

    expect(dataset.showLegend).toBe(true);
    expect(toggleEmitted).toBe(0);
  });

  it('builds the legend image URL from connectionDetails', () => {
    const dataset = makeWms({ showLegend: true });
    component.dataset = dataset;
    fixture.detectChanges();

    const src = fixture.debugElement.query(By.css('.wms-element__legend img')).nativeElement.src;
    expect(src).toContain('https://example.org/wms');
    expect(src).toContain('LAYER=luftbilder');
  });
});
