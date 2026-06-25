import { TestBed } from '@angular/core/testing';
import {
  DEFAULT_POI_SIZE,
  LOI_DASH_ARRAY_OBJECTS,
  POI_MARKER_COLORS,
  PoiPresentationService,
} from './poi-presentation.service';

describe('PoiPresentationService', () => {
  let service: PoiPresentationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PoiPresentationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('defaults to the configured POI size and exposes the marker colors', () => {
    expect(service.selectedPoiSize).toBe(DEFAULT_POI_SIZE);
    expect(service.availablePoiMarkerColors).toBe(POI_MARKER_COLORS);
  });

  it('maps a known dash-array string to its SVG', () => {
    const known = LOI_DASH_ARRAY_OBJECTS[1];
    expect(service.getLoiDashSvgFromStringValue(known.dashArrayValue)).toBe(
      known.svgString,
    );
  });

  it('returns an empty string for an unknown dash-array string', () => {
    expect(service.getLoiDashSvgFromStringValue('does-not-exist')).toBe('');
  });
});
