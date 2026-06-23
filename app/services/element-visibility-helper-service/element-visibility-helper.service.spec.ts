import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ElementVisibilityHelperService } from './element-visibility-helper.service';

describe('ElementVisibilityHelperService', () => {
  let service: ElementVisibilityHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ElementVisibilityHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
