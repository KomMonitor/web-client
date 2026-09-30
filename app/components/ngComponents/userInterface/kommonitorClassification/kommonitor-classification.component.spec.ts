import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { KommonitorClassificationComponent } from './kommonitor-classification.component';

describe('KommonitorClassificationComponent', () => {
  let component: KommonitorClassificationComponent;
  let fixture: ComponentFixture<KommonitorClassificationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KommonitorClassificationComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(KommonitorClassificationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Dragging/adding a manual break used to floor the pixel-derived value to a whole
   * number, so indicators with a fractional precision could never place a break in
   * between two integers.
   */
  describe('roundBreakValue', () => {
    it('keeps decimals up to the selected indicator precision instead of truncating', () => {
      component['selectionState'].selectedIndicator = { precision: 1 };

      expect(component['roundBreakValue'](12.74)).toBe(12.7);
    });
  });
});
