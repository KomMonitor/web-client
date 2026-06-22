import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ReachbilityScenarioSetupComponent } from './reachbility-scenario-setup.component';

describe('ReachbilityScenarioSetupComponent', () => {
  let component: ReachbilityScenarioSetupComponent;
  let fixture: ComponentFixture<ReachbilityScenarioSetupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReachbilityScenarioSetupComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    fixture = TestBed.createComponent(ReachbilityScenarioSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
