import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OgcLayerManagerService } from './ogc-layer-manager.service';

describe('OgcLayerManagerService', () => {
  let service: OgcLayerManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OgcLayerManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
