import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { GeoresourceLayerManagerService } from './georesource-layer-manager.service';

describe('GeoresourceLayerManagerService', () => {
  let service: GeoresourceLayerManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GeoresourceLayerManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
