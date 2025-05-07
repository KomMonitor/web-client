import { TestBed } from '@angular/core/testing';

import { ReachabilityHelperService } from './reachability-helper.service';

describe('ReachabilityHelperService', () => {
  let service: ReachabilityHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReachabilityHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
