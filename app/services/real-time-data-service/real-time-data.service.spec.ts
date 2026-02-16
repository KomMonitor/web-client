import { TestBed } from '@angular/core/testing';

import { RealTimeDataService } from './real-time-data.service';

describe('RealTimeDataService', () => {
  let service: RealTimeDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RealTimeDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
