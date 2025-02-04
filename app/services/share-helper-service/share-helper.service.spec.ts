import { TestBed } from '@angular/core/testing';

import { ShareHelperService } from './share-helper.service';

describe('ShareHelperService', () => {
  let service: ShareHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShareHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
