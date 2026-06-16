import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { ReportingService } from './reporting.service';

// TODO(prio6): service constructor uses structuredClone which is not defined in the Node 18 jsdom test env
describe.skip('ReportingService', () => {
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
