import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { IndicatorEditIndicatorSpatialUnitRolesModalComponent } from './indicator-edit-indicator-spatial-unit-roles-modal.component';

describe('IndicatorEditIndicatorSpatialUnitRolesModalComponent', () => {
  let component: IndicatorEditIndicatorSpatialUnitRolesModalComponent;
  let fixture: ComponentFixture<IndicatorEditIndicatorSpatialUnitRolesModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IndicatorEditIndicatorSpatialUnitRolesModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(IndicatorEditIndicatorSpatialUnitRolesModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
