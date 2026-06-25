import { TestBed } from '@angular/core/testing';
import { ChartDisplayStateService } from './chart-display-state.service';

describe('ChartDisplayStateService', () => {
  let service: ChartDisplayStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartDisplayStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('defaults the measure-of-value toggle to false', () => {
    expect(service.isMeasureOfValueChecked).toBe(false);
  });

  it('holds the shared balance/measure-of-value state', () => {
    service.isBalanceChecked = true;
    service.indicatorAndMetadataAsBalance = { id: 'x' };
    service.measureOfValue = 42;
    expect(service.isBalanceChecked).toBe(true);
    expect(service.indicatorAndMetadataAsBalance).toEqual({ id: 'x' });
    expect(service.measureOfValue).toBe(42);
  });
});
