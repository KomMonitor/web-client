import { TestBed } from '@angular/core/testing';

import { VisualStyleHelperService } from './visual-style-helper.service';

describe('VisualStyleHelperService', () => {
  let service: VisualStyleHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisualStyleHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
