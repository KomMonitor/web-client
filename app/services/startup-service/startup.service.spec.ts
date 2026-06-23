import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { StartupService } from './startup.service';

describe('StartupService', () => {
  let service: StartupService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StartupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
