import { TestBed } from '@angular/core/testing';

import { GeocoderHelperService } from './geocoder-helper.service';

describe('GeocoderHelperService', () => {
  let service: GeocoderHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeocoderHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
