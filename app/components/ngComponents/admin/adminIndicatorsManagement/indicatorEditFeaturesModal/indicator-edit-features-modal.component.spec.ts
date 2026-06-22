import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IndicatorEditFeaturesModalComponent } from './indicator-edit-features-modal.component';

describe('IndicatorEditFeaturesModalComponent', () => {
  let component: IndicatorEditFeaturesModalComponent;
  let fixture: ComponentFixture<IndicatorEditFeaturesModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IndicatorEditFeaturesModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(IndicatorEditFeaturesModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
