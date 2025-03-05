import { TestBed } from '@angular/core/testing';

import { GenericMapHelperService } from './generic-map-helper.service';

describe('GenericMapHelperService', () => {
  let service: GenericMapHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenericMapHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
