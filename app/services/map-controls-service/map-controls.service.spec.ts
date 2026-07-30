import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MapControlsService } from './map-controls.service';

describe('MapControlsService', () => {
  let service: MapControlsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MapControlsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
