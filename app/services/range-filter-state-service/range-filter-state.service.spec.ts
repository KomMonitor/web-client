import { TestBed } from '@angular/core/testing';
import { RangeFilterStateService } from './range-filter-state.service';

describe('RangeFilterStateService', () => {
  let service: RangeFilterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RangeFilterStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('holds the shared range-filter state', () => {
    service.rangeFilterData = { min: 0, max: 10 };
    service.rangeFilterIsApplied = true;
    expect(service.rangeFilterData).toEqual({ min: 0, max: 10 });
    expect(service.rangeFilterIsApplied).toBe(true);
  });
});
