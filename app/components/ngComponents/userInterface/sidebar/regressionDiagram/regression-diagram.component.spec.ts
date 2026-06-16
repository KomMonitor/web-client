import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { RegressionDiagramComponent } from './regression-diagram.component';

describe('RegressionDiagramComponent', () => {
  let component: RegressionDiagramComponent;
  let fixture: ComponentFixture<RegressionDiagramComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegressionDiagramComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(RegressionDiagramComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
