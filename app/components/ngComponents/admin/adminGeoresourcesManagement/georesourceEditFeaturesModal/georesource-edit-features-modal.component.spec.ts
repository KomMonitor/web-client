import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { GeoresourceEditFeaturesModalComponent } from './georesource-edit-features-modal.component';

describe('GeoresourceEditFeaturesModalComponent', () => {
  let component: GeoresourceEditFeaturesModalComponent;
  let fixture: ComponentFixture<GeoresourceEditFeaturesModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceEditFeaturesModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(GeoresourceEditFeaturesModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
