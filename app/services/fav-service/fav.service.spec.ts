import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

import { FavService } from './fav.service';

describe('FavService', () => {
  let service: FavService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FavService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
