import { TestBed } from '@angular/core/testing';

import { LeafletScreenshotCacheHelperService } from './leaflet-screenshot-cache-helper.service';

describe('LeafletScreenshotCacheHelperService', () => {
  let service: LeafletScreenshotCacheHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeafletScreenshotCacheHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
