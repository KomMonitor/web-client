import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ReachabilityScenarioModalComponent } from './reachability-scenario-modal.component';

describe('ReachabilityScenarioModalComponent', () => {
  let component: ReachabilityScenarioModalComponent;
  let fixture: ComponentFixture<ReachabilityScenarioModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReachabilityScenarioModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        NgbActiveModal,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ReachabilityScenarioModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
