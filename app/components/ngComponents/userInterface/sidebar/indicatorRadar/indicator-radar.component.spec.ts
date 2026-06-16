import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { IndicatorRadarComponent } from './indicator-radar.component';

describe('IndicatorRadarComponent', () => {
  let component: IndicatorRadarComponent;
  let fixture: ComponentFixture<IndicatorRadarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IndicatorRadarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(IndicatorRadarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
