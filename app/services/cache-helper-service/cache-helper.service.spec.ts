import { TestBed } from '@angular/core/testing';

import { CacheHelperServiceService } from './cache-helper.service';

describe('CacheHelperServiceService', () => {
  let service: CacheHelperServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheHelperServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
