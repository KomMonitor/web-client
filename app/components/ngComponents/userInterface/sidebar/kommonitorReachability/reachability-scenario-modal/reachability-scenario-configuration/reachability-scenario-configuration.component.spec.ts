import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReachabilityScenarioConfigurationComponent } from './reachability-scenario-configuration.component';

describe('ReachabilityScenarioConfigurationComponent', () => {
  let component: ReachabilityScenarioConfigurationComponent;
  let fixture: ComponentFixture<ReachabilityScenarioConfigurationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReachabilityScenarioConfigurationComponent]
    });
    fixture = TestBed.createComponent(ReachabilityScenarioConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
