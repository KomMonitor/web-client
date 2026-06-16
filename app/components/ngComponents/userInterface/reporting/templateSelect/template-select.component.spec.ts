import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { TemplateSelectComponent } from './template-select.component';

// TODO(prio6): structuredClone is not defined in the jsdom test env (Angular DI lookup)
describe.skip('TemplateSelectComponent', () => {
  let component: TemplateSelectComponent;
  let fixture: ComponentFixture<TemplateSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TemplateSelectComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(TemplateSelectComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
