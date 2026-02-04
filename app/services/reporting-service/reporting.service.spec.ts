import { TestBed } from '@angular/core/testing';

import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
