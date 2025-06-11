import { TestBed } from '@angular/core/testing';

import { SpatialDataProcessorHelperService } from './spatial-data-processor-helper.service';

describe('SpatialDataProcessorHelperService', () => {
  let service: SpatialDataProcessorHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpatialDataProcessorHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
