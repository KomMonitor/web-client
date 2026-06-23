import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { IconTranslateService } from './icon-translate.service';

describe('IconTranslateService', () => {
  let service: IconTranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(IconTranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
