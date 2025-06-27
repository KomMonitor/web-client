import { TestBed } from '@angular/core/testing';

import { GlobalFilterHelperService } from './global-filter-helper.service';

describe('GlobalFilterHelperService', () => {
  let service: GlobalFilterHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalFilterHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
