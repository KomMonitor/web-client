import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { GlobalFilterHelperService } from './global-filter-helper.service';

describe('GlobalFilterHelperService', () => {
  let service: GlobalFilterHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(GlobalFilterHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
