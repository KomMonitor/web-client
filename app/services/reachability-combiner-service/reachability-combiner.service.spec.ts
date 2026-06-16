import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { ReachabilityCombinerService } from './reachability-combiner.service';

describe('ReachabilityCombinerService', () => {
  let service: ReachabilityCombinerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReachabilityCombinerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
