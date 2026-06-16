import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AdminFilterConfigComponent } from './admin-filter-config.component';

describe('AdminFilterConfigComponent', () => {
  let component: AdminFilterConfigComponent;
  let fixture: ComponentFixture<AdminFilterConfigComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminFilterConfigComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(AdminFilterConfigComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
