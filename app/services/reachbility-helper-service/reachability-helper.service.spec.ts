import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReachabilityHelperService } from './reachability-helper.service';

describe('ReachabilityHelperService', () => {
  let service: ReachabilityHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReachabilityHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
