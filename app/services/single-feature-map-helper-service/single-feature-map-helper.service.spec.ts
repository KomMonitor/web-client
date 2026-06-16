import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { SingleFeatureMapHelperService } from './single-feature-map-helper.service';

describe('SingleFeatureMapHelperServiceService', () => {
  let service: SingleFeatureMapHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SingleFeatureMapHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
