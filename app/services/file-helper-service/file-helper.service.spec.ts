import { TestBed } from '@angular/core/testing';

import { FileHelperService } from './file-helper.service';

describe('FileHelperService', () => {
  let service: FileHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
