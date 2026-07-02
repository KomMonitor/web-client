import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ReachabilityIndicatorStatisticsComponent } from './reachability-indicator-statistics.component';

describe('ReachabilityIndicatorStatisticsComponent', () => {
  let component: ReachabilityIndicatorStatisticsComponent;
  let fixture: ComponentFixture<ReachabilityIndicatorStatisticsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReachabilityIndicatorStatisticsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ReachabilityIndicatorStatisticsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
