import { TestBed } from '@angular/core/testing';
import { MapOverlayStateService } from './map-overlay-state.service';

describe('MapOverlayStateService', () => {
  let service: MapOverlayStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapOverlayStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('defaults the isochrone legend to false', () => {
    expect(service.isochroneLegend).toBe(false);
  });

  it('holds the shared map overlay state', () => {
    service.wmsUrlForSelectedIndicator = 'http://wms';
    service.baseLayerDefinitionsArray = [{ id: 'osm' }];
    service.reachabilityScenarioOnMainMap = { id: 's1' };
    expect(service.wmsUrlForSelectedIndicator).toBe('http://wms');
    expect(service.baseLayerDefinitionsArray).toEqual([{ id: 'osm' }]);
    expect(service.reachabilityScenarioOnMainMap).toEqual({ id: 's1' });
  });
});
