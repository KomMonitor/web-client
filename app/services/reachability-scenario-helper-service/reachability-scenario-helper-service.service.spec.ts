import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReachabilityScenarioHelperService } from './reachability-scenario-helper-service.service';

describe('ReachabilityScenarioHelperServiceService', () => {
  let service: ReachabilityScenarioHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReachabilityScenarioHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
