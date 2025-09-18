import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { WorkflowSelectComponent } from './workflowSelect/workflow-select.component';
import { TemplateSelectComponent } from "./templateSelect/template-select.component";
import { IndicatorAddComponent } from "./indicatorAdd/indicator-add.component";
import { ReportingOverviewComponent } from "./reportingOverview/reporting-overview.component";

export interface sharedReportingData {
  pageConfig: any;
  reportingConfig: reportingData;
}

export interface reportingData { 
  templateSections:any[],
  pages:any[];
  template:any;
}

@Component({
  selector: 'app-reporting-modal',
  standalone: true,
  templateUrl: './reporting-modal.component.html',
  styleUrls: ['./reporting-modal.component.css'],
  imports: [CommonModule, WorkflowSelectComponent, TemplateSelectComponent, IndicatorAddComponent, IndicatorAddComponent, ReportingOverviewComponent]
})
export class ReportingModalComponent {

  /* 
    0 = workflow select
    1 = template select
    2 = overview page
    3 = indicator add 
  */
  workflowStatus = 0;
  data: sharedReportingData = {
    pageConfig: {
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
    },
    reportingConfig: {
      templateSections: [],
      pages: [],
      template: {}
    }
  }

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
  onWorkflowDefined(workflow) {
    console.log(workflow, this.workflowStatus, this.data)
    this.workflowStatus = workflow[0];

    // for workflow select and template select, don´t override initial this.data
    if(workflow[0]>1)
      this.data = workflow[1];
  }
}
