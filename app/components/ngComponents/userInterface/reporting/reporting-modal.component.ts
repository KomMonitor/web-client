import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowSelectComponent } from './workflowSelect/workflow-select.component';
import { TemplateSelectComponent } from "./templateSelect/template-select.component";

@Component({
  selector: 'app-reporting-modal',
  standalone: true,
  templateUrl: './reporting-modal.component.html',
  styleUrls: ['./reporting-modal.component.css'],
  imports: [CommonModule, WorkflowSelectComponent, TemplateSelectComponent]
})
export class ReportingModalComponent{

  workflowStatus = 0;
  /* 
    0 = workflow select
    1 = template select
    2 = indicator add 
  */

  activeModal = inject(NgbActiveModal);

  onWorkflowDefined(workflow) {

    if(workflow[0]!='') {
      this.workflowStatus = 1;
    }
  }
}
