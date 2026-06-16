import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { ConfigStorageService } from './config-storage.service';

describe('ConfigStorageService', () => {
  let service: ConfigStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConfigStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
