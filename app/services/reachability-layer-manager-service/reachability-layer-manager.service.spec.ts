import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ReachabilityLayerManagerService } from './reachability-layer-manager.service';

describe('ReachabilityLayerManagerService', () => {
  let service: ReachabilityLayerManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReachabilityLayerManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
