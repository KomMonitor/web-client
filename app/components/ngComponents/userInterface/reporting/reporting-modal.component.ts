import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { WorkflowSelectComponent } from './workflowSelect/workflow-select.component';
import { TemplateSelectComponent } from './templateSelect/template-select.component';
import { ReportingService, WorkflowState } from 'services/reporting-service/reporting.service';
import { ReportingOverviewComponent } from './reportingOverview/reporting-overview.component';
import { IndicatorAddComponent } from './indicatorAdd/indicator-add.component';


export interface reportingData { 
  templateSections:any[],
  pages:any[];
  template:any;
  backupTemplate:any;
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
    IndicatorAddComponent
  ]
})
export class ReportingModalComponent implements OnInit {

  activeModal = inject(NgbActiveModal);
/* 
  pageConfig = {
    mapLegendBackgroundColor: "rgba(255, 255, 255, 0.75)",
    showMapLabels: true,
    showRankingChartPerArea: true,
    showLineChartPerArea: true,
    showFreeText: true,
    showRankingMeanLine: true,
    showTitle: true,
    showSubtitle: true,
    showLogo: true,
    showFooterCreationInfo: true,
    showPageNumber: true,
    sections: {
      showOverviewSection_unclassified: true,
      showOverviewSection_classified: true,
      showBarchartOverview: true,
      showLinechartOverview: true,
      showBoxplotchartOverview: true,
      showAreaSpecific: true,
      showOverviewSection_reachability: true,
      showDatatable: true
    }
  }
          
  config:any = {
    templateSections: [
      // {
      // 	indicator: "",
      // 	poiLayer: ""
      // }
    ],
    pages: [],
    template: {}
  };
 */

  workflowState = WorkflowState;

  constructor(
    protected reportingService: ReportingService
  ) {}

  ngOnInit() {
    this.reportingService.reportingData$.subscribe(val => {
      console.log('Wert geändert:', val);
    });
  }

  isWorkflowState(state:WorkflowState) {
    return this.reportingService.currentWorkflowState==state;
  }
}
