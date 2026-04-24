import { TestBed } from '@angular/core/testing';

import { OgcDataGridHelperService } from './ogc-data-grid-helper.service';

describe('OgcDataGridHelperService', () => {
  let service: OgcDataGridHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OgcDataGridHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
