import { TestBed } from '@angular/core/testing';

import { OgcService } from './ogc.service';

describe('OgcService', () => {
  let service: OgcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OgcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
