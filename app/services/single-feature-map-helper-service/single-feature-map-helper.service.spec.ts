import { TestBed } from '@angular/core/testing';

import { SingleFeatureMapHelperService } from './single-feature-map-helper.service';

describe('SingleFeatureMapHelperServiceService', () => {
  let service: SingleFeatureMapHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SingleFeatureMapHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
