import { TestBed } from '@angular/core/testing';

import { ScriptHelperService } from './script-helper.service';

describe('ScriptHelperService', () => {
  let service: ScriptHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScriptHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
