import { TestBed } from '@angular/core/testing';

import { ReachabilityCombinerService } from './reachability-combiner.service';

describe('ReachabilityCombinerServiceService', () => {
  let service: ReachabilityCombinerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReachabilityCombinerServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
