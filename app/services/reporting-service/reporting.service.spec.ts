import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  let service: ReportingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
