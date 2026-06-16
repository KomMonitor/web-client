import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ReachabilityPoiInIsoComponent } from './reachability-poi-in-iso.component';

describe('ReachabilityPoiInIsoComponent', () => {
  let component: ReachabilityPoiInIsoComponent;
  let fixture: ComponentFixture<ReachabilityPoiInIsoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReachabilityPoiInIsoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ReachabilityPoiInIsoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
