import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReachabilityIndicatorStatisticsComponent } from './reachability-indicator-statistics.component';

describe('ReachabilityIndicatorStatisticsComponent', () => {
  let component: ReachabilityIndicatorStatisticsComponent;
  let fixture: ComponentFixture<ReachabilityIndicatorStatisticsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReachabilityIndicatorStatisticsComponent]
    });
    fixture = TestBed.createComponent(ReachabilityIndicatorStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
