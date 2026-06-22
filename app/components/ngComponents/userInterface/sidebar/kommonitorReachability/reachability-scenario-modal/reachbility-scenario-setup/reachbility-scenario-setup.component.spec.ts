import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReachbilityScenarioSetupComponent } from './reachbility-scenario-setup.component';

describe('ReachbilityScenarioSetupComponent', () => {
  let component: ReachbilityScenarioSetupComponent;
  let fixture: ComponentFixture<ReachbilityScenarioSetupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReachbilityScenarioSetupComponent]
    });
    fixture = TestBed.createComponent(ReachbilityScenarioSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
