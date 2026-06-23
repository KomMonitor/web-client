import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { GeocoderHelperService } from './geocoder-helper.service';

describe('GeocoderHelperService', () => {
  let service: GeocoderHelperService;

  beforeEach(() => {
    (window as any).__env.targetUrlToGeocoderService = 'https://example.org/nominatim/';
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GeocoderHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
