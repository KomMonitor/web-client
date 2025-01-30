import { TestBed } from '@angular/core/testing';

import { ElementVisibilityHelperService } from './element-visibility-helper.service';

describe('ElementVisibilityHelperService', () => {
  let service: ElementVisibilityHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ElementVisibilityHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
