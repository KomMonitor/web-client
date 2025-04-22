import { TestBed } from '@angular/core/testing';

import { ConfigStorageServiceService } from './config-storage.service';

describe('ConfigStorageServiceService', () => {
  let service: ConfigStorageServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigStorageServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
