import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { OgcService } from './ogc.service';

describe('OgcService', () => {
  let service: OgcService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OgcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
