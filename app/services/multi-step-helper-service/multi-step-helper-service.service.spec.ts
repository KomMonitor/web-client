import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { MultiStepHelperServiceService } from './multi-step-helper-service.service';

describe('MultiStepHelperServiceService', () => {
  let service: MultiStepHelperServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MultiStepHelperServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
