import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { KommonitorDataImportComponent } from './kommonitor-data-import.component';

describe('KommonitorDataImportComponent', () => {
  let component: KommonitorDataImportComponent;
  let fixture: ComponentFixture<KommonitorDataImportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KommonitorDataImportComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(KommonitorDataImportComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
