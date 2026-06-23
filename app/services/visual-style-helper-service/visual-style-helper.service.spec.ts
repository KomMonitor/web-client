import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VisualStyleHelperServiceNew } from './visual-style-helper.service';

describe('VisualStyleHelperServiceNew', () => {
  let service: VisualStyleHelperServiceNew;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VisualStyleHelperServiceNew);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
