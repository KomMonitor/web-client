import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ClassificationMethodSelectComponent } from './classification-method-select.component';

describe('ClassificationMethodSelectComponent', () => {
  let component: ClassificationMethodSelectComponent;
  let fixture: ComponentFixture<ClassificationMethodSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClassificationMethodSelectComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ClassificationMethodSelectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
