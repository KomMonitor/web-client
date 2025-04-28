import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowSelectComponent } from './workflowSelect/workflow-select.component';
import { TemplateSelectComponent } from "./templateSelect/template-select.component";
import { IndicatorAddComponent } from "./indicatorAdd/indicator-add.component";
import { ReportingOverviewComponent } from "./reportingOverview/reporting-overview.component";

@Component({
  selector: 'app-reporting-modal',
  standalone: true,
  templateUrl: './reporting-modal.component.html',
  styleUrls: ['./reporting-modal.component.css'],
  imports: [CommonModule, WorkflowSelectComponent, TemplateSelectComponent, IndicatorAddComponent, IndicatorAddComponent, ReportingOverviewComponent]
})
export class ReportingModalComponent {

  workflowStatus = 0;
  data;
  /* 
    0 = workflow select
    1 = template select
    2 = overview page
    3 = indicator add 
  */

  activeModal = inject(NgbActiveModal);

  onWorkflowDefined(workflow) {
      this.workflowStatus = workflow[0];
      this.data = workflow[1];
  }
}
