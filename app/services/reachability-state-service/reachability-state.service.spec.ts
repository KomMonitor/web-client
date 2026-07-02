import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReachabilityStateService } from './reachability-state.service';

describe('ReachabilityStateService', () => {
  let service: ReachabilityStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReachabilityStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
