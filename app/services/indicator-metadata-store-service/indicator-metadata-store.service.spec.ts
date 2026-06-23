import { TestBed } from '@angular/core/testing';

import { IndicatorMetadataStoreService } from './indicator-metadata-store.service';

describe('IndicatorMetadataStoreService', () => {
  let service: IndicatorMetadataStoreService;

  beforeEach(() => {
    // isDisplayableIndicator reads this env list; ensure it exists for the test runtime
    (window as any).__env = (window as any).__env || {};
    (window as any).__env.arrayOfNameSubstringsForHidingIndicators =
      (window as any).__env.arrayOfNameSubstringsForHidingIndicators || [];

    TestBed.configureTestingModule({});
    service = TestBed.inject(IndicatorMetadataStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setIndicators populates the array + id-map and applies default precision', () => {
    service.setIndicators([
      { indicatorId: 'i1', precision: null },
      { indicatorId: 'i2', precision: 3 },
    ]);
    expect(service.availableIndicators.length).toBe(2);
    expect(service.getIndicatorMetadataById('i1').defaultPrecision).toBe(true);
    expect(service.getIndicatorMetadataById('i2').defaultPrecision).toBe(false);
    expect(service.getIndicatorMetadataById('i2').precision).toBe(3);
  });

  it('addSingleIndicatorMetadata prepends and deleteSingleIndicatorMetadata removes', () => {
    service.setIndicators([{ indicatorId: 'i1', precision: 1 }]);
    service.addSingleIndicatorMetadata({ indicatorId: 'i2', precision: 1 });
    expect(service.availableIndicators[0].indicatorId).toBe('i2');
    expect(service.getIndicatorMetadataById('i2')).toBeDefined();

    service.deleteSingleIndicatorMetadata('i2');
    expect(service.getIndicatorMetadataById('i2')).toBeUndefined();
    expect(service.availableIndicators.length).toBe(1);
  });

  it('modifyIndicatorApplicableSpatialUnitsForLoginRoles filters applicableSpatialUnits + rebuilds displayableIndicators', () => {
    service.setIndicators([
      {
        indicatorId: 'i1',
        precision: 1,
        applicableDates: ['2024'],
        applicableSpatialUnits: [{ spatialUnitName: 'A' }, { spatialUnitName: 'Z' }],
      },
    ]);
    service.modifyIndicatorApplicableSpatialUnitsForLoginRoles([{ spatialUnitLevel: 'A' }]);
    expect(service.availableIndicators[0].applicableSpatialUnits).toEqual([
      { spatialUnitName: 'A' },
    ]);
    expect(service.displayableIndicators.length).toBe(1);
  });
});
