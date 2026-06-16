import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { DataExchangeService } from './data-exchange.service';

describe('DataExchangeService', () => {
  let service: DataExchangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DataExchangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
