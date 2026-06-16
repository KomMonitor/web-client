import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { KommonitorDiagramsComponent } from './kommonitor-diagrams.component';

describe('KommonitorDiagramsComponent', () => {
  let component: KommonitorDiagramsComponent;
  let fixture: ComponentFixture<KommonitorDiagramsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KommonitorDiagramsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(KommonitorDiagramsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
