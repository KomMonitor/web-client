import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { GeoresourceListTabComponent } from './georesource-list-tab.component';
import {
  GeoresourceLayerService,
  WFS_FALLBACK_COLOR,
} from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';

/**
 * Unlike the dataset table, this tab drives {@link GeoresourceLayerService}
 * directly, so the colour handler is verified against a spy on that service.
 */
describe('GeoresourceListTabComponent', () => {
  let component: GeoresourceListTabComponent;
  let fixture: ComponentFixture<GeoresourceListTabComponent>;
  let layerService: GeoresourceLayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceListTabComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(GeoresourceListTabComponent);
    component = fixture.componentInstance;
    layerService = TestBed.inject(GeoresourceLayerService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('WFS colour', () => {
    it('falls back to the Leaflet default when the dataset carries no colour', () => {
      expect(component.wfsColor({ geometryType: 'AOI' })).toBe(WFS_FALLBACK_COLOR);
    });

    it('reads the configured colour of the matching geometry type', () => {
      expect(component.wfsColor({ geometryType: 'LOI', loiColor: '#112233' })).toBe('#112233');
    });

    it('writes the pick to the field matching the geometry type', () => {
      const aoi: any = { geometryType: 'AOI', aoiColor: '#00aabb', loiColor: '#112233' };
      const loi: any = { geometryType: 'LOI', aoiColor: '#00aabb', loiColor: '#112233' };

      component.onWfsColorChange('#ff0000', aoi);
      component.onWfsColorChange('#00ff00', loi);

      expect(aoi.aoiColor).toBe('#ff0000');
      expect(aoi.loiColor).toBe('#112233');
      expect(loi.loiColor).toBe('#00ff00');
      expect(loi.aoiColor).toBe('#00aabb');
    });

    it('restyles the layer once, after the dataset has been updated', () => {
      const spy = jest.spyOn(layerService, 'adjustWfsLayerColor').mockImplementation(() => {});
      const dataset: any = { geometryType: 'AOI' };

      component.onWfsColorChange('#ff0000', dataset);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe(dataset);
      expect(spy.mock.calls[0][0].aoiColor).toBe('#ff0000');
    });
  });
});
