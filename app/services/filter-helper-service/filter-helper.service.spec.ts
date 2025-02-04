import { TestBed } from '@angular/core/testing';

import { FilterHelperService } from './filter-helper.service';

describe('FilterHelperService', () => {
  let service: FilterHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilterHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
