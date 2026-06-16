import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { IndicatorMetadataTooltipComponent } from './indicator-metadata-tooltip.component';

describe('IndicatorMetadataTooltipComponent', () => {
  let component: IndicatorMetadataTooltipComponent;
  let fixture: ComponentFixture<IndicatorMetadataTooltipComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IndicatorMetadataTooltipComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(IndicatorMetadataTooltipComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
