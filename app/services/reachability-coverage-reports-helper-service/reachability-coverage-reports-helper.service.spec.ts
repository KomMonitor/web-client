import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { ReachabilityCoverageReportsHelperService } from './reachability-coverage-reports-helper.service';

// TODO(prio6): depends on legacy AngularJS service kommonitorReachabilityCoverageReportsHelperService (no Angular provider)
describe.skip('ReachabilityCoverageReportsHelperService', () => {
  let service: ReachabilityCoverageReportsHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReachabilityCoverageReportsHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
