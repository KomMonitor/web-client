import { TestBed } from '@angular/core/testing';

import { DataExchangeService } from './data-exchange.service';

describe('DataExchangeService', () => {
  let service: DataExchangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataExchangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
