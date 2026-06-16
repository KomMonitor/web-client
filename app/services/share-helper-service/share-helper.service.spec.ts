import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";

import { ShareHelperService } from './share-helper.service';

describe('ShareHelperService', () => {
  let service: ShareHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(ShareHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
