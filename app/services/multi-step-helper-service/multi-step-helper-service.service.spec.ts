import { TestBed } from '@angular/core/testing';

import { MultiStepHelperServiceService } from './multi-step-helper-service.service';

describe('MultiStepHelperServiceService', () => {
  let service: MultiStepHelperServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MultiStepHelperServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
