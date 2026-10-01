import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import {
  GeoresourceVectorElementComponent,
  GeoresourceVectorKind,
} from './georesource-vector-element.component';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { GeoresourceExportModeService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-export-mode.service';

function makeDataset(overrides: Partial<GeoresourcesDataset> = {}): GeoresourcesDataset {
  return {
    georesourceId: 'dataset-1',
    datasetName: 'Schulen',
    isSelected: false,
    availablePeriodsOfValidity: [],
    metadata: { description: 'Alle Schulen im Stadtgebiet' },
    ...overrides,
  } as GeoresourcesDataset;
}

describe('GeoresourceVectorElementComponent', () => {
  let fixture: ComponentFixture<GeoresourceVectorElementComponent>;
  let component: GeoresourceVectorElementComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceVectorElementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(GeoresourceVectorElementComponent);
    component = fixture.componentInstance;
    component.kind = 'poi';
  });

  it('should create', () => {
    component.dataset = makeDataset();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    component.dataset = makeDataset();
    fixture.detectChanges();

    expect(
      fixture.debugElement
        .query(By.css('.georesource-element__title'))
        .nativeElement.textContent.trim()
    ).toBe('Schulen');
  });

  it('toggles isSelected and emits toggleGeoresourceOnMap when the row is clicked', () => {
    const dataset = makeDataset();
    component.dataset = dataset;
    const emitted: GeoresourcesDataset[] = [];
    component.toggleGeoresourceOnMap.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.georesource-element__toggle')).nativeElement.click();

    expect(dataset.isSelected).toBe(true);
    expect(emitted).toEqual([dataset]);
  });

  it('only shows the zoom icon once selected, and emits zoomToLayer without re-triggering the toggle', () => {
    const dataset = makeDataset();
    component.dataset = dataset;
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.vector-element__zoom'))).toBeNull();

    dataset.isSelected = true;
    fixture.detectChanges();

    let toggleEmitted = 0;
    let zoomEmitted = 0;
    component.toggleGeoresourceOnMap.subscribe(() => toggleEmitted++);
    component.zoomToLayer.subscribe(() => zoomEmitted++);

    fixture.debugElement.query(By.css('.vector-element__zoom')).nativeElement.click();

    expect(zoomEmitted).toBe(1);
    expect(toggleEmitted).toBe(0);
  });

  it('shows the favourite star only when enabled, and emits favToggled with the georesourceId', () => {
    component.dataset = makeDataset({ georesourceId: 'dataset-42' });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.fav-star'))).toBeNull();

    component.showFavSelection = true;
    fixture.detectChanges();

    const emitted: (string | null | undefined)[] = [];
    component.favToggled.subscribe((value) => emitted.push(value));
    fixture.debugElement.query(By.css('.fav-star')).nativeElement.click();

    expect(emitted).toEqual(['dataset-42']);
  });

  it('renders the export checkbox before the toggle button, once export mode is on', () => {
    component.dataset = makeDataset();
    TestBed.inject(GeoresourceExportModeService).exportMode.set(true);
    fixture.detectChanges();

    const row = fixture.debugElement.query(By.css('.georesource-element')).nativeElement;
    const checkbox = row.querySelector('app-export-item-checkbox');
    const toggle = row.querySelector('.georesource-element__toggle');

    expect(checkbox).not.toBeNull();
    expect(
      checkbox.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  describe('legend per kind', () => {
    it('renders the POI marker legend for kind "poi"', () => {
      component.kind = 'poi';
      component.dataset = makeDataset({ poiMarkerColor: 'red' });
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.awesome-marker-legend-icon-red'))).not.toBeNull();
      expect(fixture.debugElement.query(By.css('.poiColorLegend'))).toBeNull();
    });

    it.each<[GeoresourceVectorKind, keyof GeoresourcesDataset]>([
      ['loi', 'loiColor'],
      ['aoi', 'aoiColor'],
    ])('renders a flat colour swatch for kind "%s"', (kind, colorField) => {
      component.kind = kind;
      component.dataset = makeDataset({ [colorField]: '#112233' } as Partial<GeoresourcesDataset>);
      fixture.detectChanges();

      const legend = fixture.debugElement.query(By.css('.poiColorLegend'));
      expect(legend).not.toBeNull();
      expect((legend.nativeElement as HTMLElement).style.background).toBe('rgb(17, 34, 51)');
    });
  });
});
