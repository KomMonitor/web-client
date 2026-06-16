import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { FileHelperService } from './file-helper.service';

describe('FileHelperService', () => {
  let service: FileHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FileHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
