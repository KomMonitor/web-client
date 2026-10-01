import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { GeoresourceWfsElementComponent } from './georesource-wfs-element.component';
import { WFS_FALLBACK_COLOR } from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';

function makeWfs(overrides: Record<string, unknown> = {}): any {
  return {
    title: 'Grundstücke',
    description: 'Flurstücke der Stadt',
    isSelected: false,
    geometryType: 'AOI',
    url: 'https://example.org/wfs',
    ...overrides,
  };
}

describe('GeoresourceWfsElementComponent', () => {
  let fixture: ComponentFixture<GeoresourceWfsElementComponent>;
  let component: GeoresourceWfsElementComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceWfsElementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(GeoresourceWfsElementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    component.dataset = makeWfs();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the title', () => {
    component.dataset = makeWfs();
    fixture.detectChanges();

    expect(
      fixture.debugElement
        .query(By.css('.georesource-element__title'))
        .nativeElement.textContent.trim()
    ).toBe('Grundstücke');
  });

  it('toggles isSelected and emits toggleWfsOnMap when the row is clicked', () => {
    const dataset = makeWfs();
    component.dataset = dataset;
    const emitted: any[] = [];
    component.toggleWfsOnMap.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.georesource-element__toggle')).nativeElement.click();

    expect(dataset.isSelected).toBe(true);
    expect(emitted).toEqual([dataset]);
  });

  describe('WFS colour', () => {
    it('falls back to the Leaflet default when the dataset carries no colour', () => {
      component.dataset = makeWfs({ geometryType: 'AOI' });
      expect(component.wfsColor()).toBe(WFS_FALLBACK_COLOR);
    });

    it('reads the configured colour of the matching geometry type', () => {
      component.dataset = makeWfs({ geometryType: 'LOI', loiColor: '#112233' });
      expect(component.wfsColor()).toBe('#112233');
    });

    it('writes a colour change back onto the dataset and emits it', () => {
      const dataset = makeWfs({ geometryType: 'AOI', aoiColor: '#00aabb' });
      component.dataset = dataset;
      const emitted: any[] = [];
      component.wfsColorChange.subscribe((value) => emitted.push(value));

      component.onWfsColorChange('#ff0000');

      expect(dataset.aoiColor).toBe('#ff0000');
      expect(emitted).toEqual([dataset]);
    });
  });
});
