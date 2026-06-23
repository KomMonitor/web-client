import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CacheHelperServiceService } from './cache-helper.service';

describe('CacheHelperServiceService', () => {
  let service: CacheHelperServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CacheHelperServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
