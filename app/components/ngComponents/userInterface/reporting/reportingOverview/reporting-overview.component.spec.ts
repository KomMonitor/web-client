import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportingOverviewComponent } from './reporting-overview.component';

describe('ReportingOverviewComponent', () => {
  let component: ReportingOverviewComponent;
  let fixture: ComponentFixture<ReportingOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportingOverviewComponent]
    });
    fixture = TestBed.createComponent(ReportingOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
