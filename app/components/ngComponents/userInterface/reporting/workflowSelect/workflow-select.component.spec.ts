import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowSelectComponent } from './workflow-select.component';

describe('WorkflowSelectComponent', () => {
  let component: WorkflowSelectComponent;
  let fixture: ComponentFixture<WorkflowSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WorkflowSelectComponent]
    });
    fixture = TestBed.createComponent(WorkflowSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
