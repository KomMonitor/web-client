import { TestBed } from '@angular/core/testing';

import { SpatialUnitMetadataStoreService } from './spatial-unit-metadata-store.service';

describe('SpatialUnitMetadataStoreService', () => {
  let service: SpatialUnitMetadataStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpatialUnitMetadataStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setSpatialUnits populates the array and the id map', () => {
    service.setSpatialUnits([
      { spatialUnitId: 's1', spatialUnitLevel: 'A' },
      { spatialUnitId: 's2', spatialUnitLevel: 'B' },
    ]);
    expect(service.availableSpatialUnits.length).toBe(2);
    expect(service.availableSpatialUnits_map.size).toBe(2);
  });

  it('getSpatialUnitMetadataById returns the entry or undefined', () => {
    const unit = { spatialUnitId: 's1', spatialUnitLevel: 'A' };
    service.setSpatialUnits([unit]);
    expect(service.getSpatialUnitMetadataById('s1')).toEqual(unit);
    expect(service.getSpatialUnitMetadataById('missing')).toBeUndefined();
  });
});
