import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FileLayerManagerService } from './file-layer-manager.service';

describe('FileLayerManagerService', () => {
  let service: FileLayerManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FileLayerManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
