import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { IndicatorRadarComponent } from './indicator-radar.component';

// TODO(prio6): ECharts initialises on construction; HTMLCanvasElement.getContext
// is not implemented in jsdom, so createComponent throws. Needs canvas mock / DOM env.
describe.skip('IndicatorRadarComponent', () => {
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
