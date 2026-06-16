import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { LeafletScreenshotCacheHelperService } from './leaflet-screenshot-cache-helper.service';

describe('LeafletScreenshotCacheHelperService', () => {
  let service: LeafletScreenshotCacheHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LeafletScreenshotCacheHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
