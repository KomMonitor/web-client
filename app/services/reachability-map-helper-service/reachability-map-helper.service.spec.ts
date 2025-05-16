import { TestBed } from '@angular/core/testing';

import { ReachabilityMapHelperService } from './reachability-map-helper.service';

describe('ReachabilityMapHelperService', () => {
  let service: ReachabilityMapHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReachabilityMapHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
