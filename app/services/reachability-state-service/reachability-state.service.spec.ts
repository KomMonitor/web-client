import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReachabilityStateService } from './reachability-state.service';

describe('ReachabilityStateService', () => {
  let service: ReachabilityStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReachabilityStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isolates an unroutable point via bisection and still returns isochrones for the rest', async () => {
    const locations = [
      [7.1, 51.4],
      [7.2, 51.5],
      [7.3, 51.6],
    ];
    const locationIds = ['a', 'b', 'c'];

    jest.spyOn(service, 'fetchIsochrones').mockImplementation((batch: any) => {
      // simulate ORS failing any request that still contains the unroutable point ('b', the
      // one with longitude 7.2), succeeding otherwise - mirrors a 500 "Unable to build an
      // isochrone map." response that fails the whole batch, not just the bad point
      if (batch.some((loc: any) => loc[0] === 7.2)) {
        return Promise.reject(new Error('Unable to build an isochrone map.'));
      }
      return Promise.resolve({
        type: 'FeatureCollection',
        features: batch.map((_loc: any, idx: number) => ({
          type: 'Feature',
          properties: { group_index: idx, value: 100 },
          geometry: { type: 'Polygon', coordinates: [] },
        })),
      });
    });

    const result = await service['resolveIsochronesForLocations'](locations, locationIds);

    expect(service.skippedLocationIds).toEqual(['b']);
    expect(result.features.map((f: any) => f.properties.ID)).toEqual(['a_100', 'c_100']);
  });
});
