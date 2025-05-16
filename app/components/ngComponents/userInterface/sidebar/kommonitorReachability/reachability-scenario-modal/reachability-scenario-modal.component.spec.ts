import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReachabilityScenarioModalComponent } from './reachability-scenario-modal.component';

describe('ReachabilityScenarioModalComponent', () => {
  let component: ReachabilityScenarioModalComponent;
  let fixture: ComponentFixture<ReachabilityScenarioModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReachabilityScenarioModalComponent]
    });
    fixture = TestBed.createComponent(ReachabilityScenarioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
