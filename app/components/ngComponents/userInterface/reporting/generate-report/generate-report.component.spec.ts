import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateReportComponent } from './generate-report.component';

describe('GenerateReportComponent', () => {
  let component: GenerateReportComponent;
  let fixture: ComponentFixture<GenerateReportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GenerateReportComponent]
    });
    fixture = TestBed.createComponent(GenerateReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
