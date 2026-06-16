import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MultiSelectSliderComponent } from './multi-select-slider.component';

describe('MultiSelectSliderComponent', () => {
  let component: MultiSelectSliderComponent;
  let fixture: ComponentFixture<MultiSelectSliderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MultiSelectSliderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(MultiSelectSliderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
