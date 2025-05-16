import { TestBed } from '@angular/core/testing';

import { ReachabilityScenarioHelperService } from './reachability-scenario-helper-service.service';

describe('ReachabilityScenarioHelperServiceService', () => {
  let service: ReachabilityScenarioHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReachabilityScenarioHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
