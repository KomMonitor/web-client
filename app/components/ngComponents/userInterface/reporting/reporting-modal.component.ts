import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { WorkflowSelectComponent } from './workflowSelect/workflow-select.component';
import { TemplateSelectComponent } from './templateSelect/template-select.component';
import { ReportingService, WorkflowState } from 'services/reporting-service/reporting.service';
import { ReportGenerationProgressService } from 'services/report-generation-progress-service/report-generation-progress.service';
import { ReportingOverviewComponent } from './reportingOverview/reporting-overview.component';
import { IndicatorAddComponent } from './indicatorAdd/indicator-add.component';

export interface reportingData {
  templateSections: any[];
  pages: any[];
  template: any;
  backupTemplate: any;
}

@Component({
  selector: 'app-reporting-modal',
  templateUrl: './reporting-modal.component.html',
  styleUrls: ['./reporting-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WorkflowSelectComponent,
    TemplateSelectComponent,
    ReportingOverviewComponent,
    IndicatorAddComponent,
  ],
})
export class ReportingModalComponent implements OnInit, OnDestroy {
  protected reportingService = inject(ReportingService);
  protected reportGenerationProgressService = inject(ReportGenerationProgressService);

  activeModal = inject(NgbActiveModal);

  workflowState = WorkflowState;

  ngOnInit() {
    this.reportGenerationProgressService.reportingModalOpen = true;
  }

  ngOnDestroy() {
    this.reportGenerationProgressService.reportingModalOpen = false;
  }

  isWorkflowState(state: WorkflowState | WorkflowState[]) {
    if (Array.isArray(state)) return state.includes(this.reportingService.currentWorkflowState);

    return this.reportingService.currentWorkflowState == state;
  }
}
