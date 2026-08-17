import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

import { OgcDataGridHelperService } from './ogc-data-grid-helper.service';

describe('OgcDataGridHelperService', () => {
  let service: OgcDataGridHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OgcDataGridHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
