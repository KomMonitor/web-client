import { TestBed } from '@angular/core/testing';

import { ReachabilityCoverageReportsHelperService } from './reachability-coverage-reports-helper.service';

describe('ReachabilityCoverageReportsHelperService', () => {
  let service: ReachabilityCoverageReportsHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReachabilityCoverageReportsHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
