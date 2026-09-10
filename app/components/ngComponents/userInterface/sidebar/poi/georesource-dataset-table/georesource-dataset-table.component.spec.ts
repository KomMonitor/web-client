import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { GeoresourceDatasetTableComponent } from './georesource-dataset-table.component';
import { WFS_FALLBACK_COLOR } from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';

/**
 * The WFS colour picker is exercised through the component's handlers rather
 * than through the rendered ngx-color-picker dialog: the table needs a fully
 * populated dataset group to render at all, and the handler is where the
 * geometry-type-to-colour-field mapping lives.
 */
describe('GeoresourceDatasetTableComponent', () => {
  let component: GeoresourceDatasetTableComponent;
  let fixture: ComponentFixture<GeoresourceDatasetTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceDatasetTableComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(GeoresourceDatasetTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('WFS colour', () => {
    it('falls back to the Leaflet default when the dataset carries no colour', () => {
      expect(component.wfsColor({ geometryType: 'AOI' })).toBe(WFS_FALLBACK_COLOR);
      expect(component.wfsColor({ geometryType: 'LOI' })).toBe(WFS_FALLBACK_COLOR);
    });

    it('reads the configured colour of the matching geometry type', () => {
      expect(component.wfsColor({ geometryType: 'AOI', aoiColor: '#00aabb' })).toBe('#00aabb');
      expect(component.wfsColor({ geometryType: 'LOI', loiColor: '#112233' })).toBe('#112233');
    });

    it('writes an AOI pick to aoiColor and leaves loiColor alone', () => {
      const dataset: any = { geometryType: 'AOI', aoiColor: '#00aabb', loiColor: '#112233' };

      component.onWfsColorChange('#ff0000', dataset);

      expect(dataset.aoiColor).toBe('#ff0000');
      expect(dataset.loiColor).toBe('#112233');
    });

    it('writes an LOI pick to loiColor and leaves aoiColor alone', () => {
      const dataset: any = { geometryType: 'LOI', aoiColor: '#00aabb', loiColor: '#112233' };

      component.onWfsColorChange('#ff0000', dataset);

      expect(dataset.loiColor).toBe('#ff0000');
      expect(dataset.aoiColor).toBe('#00aabb');
    });

    it('emits the same dataset instance, already carrying the new colour', () => {
      const dataset: any = { geometryType: 'AOI' };
      const emitted: any[] = [];
      component.wfsColorChange.subscribe((value) => emitted.push(value));

      component.onWfsColorChange('#ff0000', dataset);

      expect(emitted).toHaveLength(1);
      // the consumer hands this very object to the layer service, which reads
      // the colour back off it — identity is the contract here
      expect(emitted[0]).toBe(dataset);
      expect(emitted[0].aoiColor).toBe('#ff0000');
    });
  });
});
