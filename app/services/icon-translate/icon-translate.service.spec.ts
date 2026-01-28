import { TestBed } from '@angular/core/testing';

import { IconTranslateService } from './icon-translate.service';

describe('IconTranslateService', () => {
  let service: IconTranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IconTranslateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
