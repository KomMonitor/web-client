import { TestBed } from '@angular/core/testing';

import { FavService } from './fav.service';

describe('FavService', () => {
  let service: FavService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
