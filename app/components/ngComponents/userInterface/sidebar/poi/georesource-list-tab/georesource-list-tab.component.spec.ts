import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { GeoresourceListTabComponent } from './georesource-list-tab.component';

describe('GeoresourceListTabComponent', () => {
  let component: GeoresourceListTabComponent;
  let fixture: ComponentFixture<GeoresourceListTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GeoresourceListTabComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(GeoresourceListTabComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
