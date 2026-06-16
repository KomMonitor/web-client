import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { SpatialDataProcessorHelperService } from './spatial-data-processor-helper.service';

describe('SpatialDataProcessorHelperService', () => {
  let service: SpatialDataProcessorHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SpatialDataProcessorHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
