import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { ReachabilityCoverageReportsHelperService } from './reachability-coverage-reports-helper.service';

describe('ReachabilityCoverageReportsHelperService', () => {
  let service: ReachabilityCoverageReportsHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // Legacy AngularJS bridge token, never provided in the migrated app.
        // A unit-test double lets the service be constructed in isolation.
        { provide: 'kommonitorReachabilityCoverageReportsHelperService', useValue: {} },
      ],
    });
    service = TestBed.inject(ReachabilityCoverageReportsHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
