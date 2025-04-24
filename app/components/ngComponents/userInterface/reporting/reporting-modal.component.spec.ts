import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportingModalComponent } from './reporting-modal.component';

describe('ReportingModalComponent', () => {
  let component: ReportingModalComponent;
  let fixture: ComponentFixture<ReportingModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportingModalComponent]
    });
    fixture = TestBed.createComponent(ReportingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
