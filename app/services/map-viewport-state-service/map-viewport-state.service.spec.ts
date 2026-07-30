import { TestBed } from '@angular/core/testing';
import { MapViewportStateService } from './map-viewport-state.service';

describe('MapViewportStateService', () => {
  let service: MapViewportStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapViewportStateService);
  });

  it('stores the viewport', () => {
    service.setViewport(51.5, 7.0, 12);

    expect(service.currentLatitude).toBe(51.5);
    expect(service.currentLongitude).toBe(7.0);
    expect(service.currentZoomLevel).toBe(12);
  });
});
