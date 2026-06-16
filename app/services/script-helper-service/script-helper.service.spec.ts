import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { ScriptHelperService } from './script-helper.service';

describe('ScriptHelperService', () => {
  let service: ScriptHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ScriptHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
