import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { FilterHelperService } from './filter-helper.service';

describe('FilterHelperService', () => {
  let service: FilterHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FilterHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
