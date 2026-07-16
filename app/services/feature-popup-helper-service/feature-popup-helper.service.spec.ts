import { TestBed } from '@angular/core/testing';
import { FeaturePopupHelperService } from './feature-popup-helper.service';

describe('FeaturePopupHelperService', () => {
  let service: FeaturePopupHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeaturePopupHelperService);
  });

  it('builds the property table popup with the given css class', () => {
    const html = service.buildFeaturePropertiesPopup(
      { NAME: 'Mitte', value: 42 },
      'poiInfoPopupContent'
    );

    expect(html).toContain('class="poiInfoPopupContent featurePropertyPopupContent"');
    expect(html).toContain('<tr><td>NAME</td><td>Mitte</td></tr>');
    expect(html).toContain('<tr><td>value</td><td>42</td></tr>');
    expect(html).toContain('<table class="table table-condensed">');
  });

  it('lazily binds the popup on click', () => {
    const handlers: any = {};
    const layer = {
      on: (config) => Object.assign(handlers, config),
      bindPopup: jest.fn(),
    };
    const feature = { properties: { NAME: 'Mitte' } };

    service.bindFeaturePropertiesPopupOnClick(feature, layer, 'georesourceInfoPopupContent');
    expect(layer.bindPopup).not.toHaveBeenCalled();

    handlers.click();
    expect(layer.bindPopup).toHaveBeenCalledWith(
      expect.stringContaining('georesourceInfoPopupContent')
    );
  });

  it('builds the indicator tooltip', () => {
    expect(service.buildIndicatorTooltip('Mitte', '42,5', '%')).toBe('<b>Mitte</b><br/>42,5 [%]');
  });
});
