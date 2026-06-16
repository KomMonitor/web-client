import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { SingleFeatureEditComponent } from './single-feature-edit.component';

describe('SingleFeatureEditComponent', () => {
  let component: SingleFeatureEditComponent;
  let fixture: ComponentFixture<SingleFeatureEditComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SingleFeatureEditComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(SingleFeatureEditComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
