import { reportingData } from './../reporting-modal.component';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { ReportingTemplateFilter } from 'pipes/reporting-template-filter.pipe';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from 'pipes/safe-html.pipe';
import { NgbAccordionModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { ReportingService, WorkflowState } from 'services/reporting-service/reporting.service';

@Component({
  selector: 'app-template-select',
  standalone: true,
  templateUrl: './template-select.component.html',
  styleUrls: ['./template-select.component.scss'],
  imports: [
    CommonModule,
    ReportingTemplateFilter,
    FormsModule,
    SafeHtmlPipe,
    NgbDatepickerModule,
    NgbAccordionModule,
  ],
})
export class TemplateSelectComponent implements OnInit {
  protected reportingService = inject(ReportingService);

  datePickerDate!: any;

  workflowState = WorkflowState;

  ngOnInit(): void {
    this.reportingService.resetAll();
  }

  onChangeDatepickerDate() {
    this.reportingService.generalSettings.creationDate = `${this.datePickerDate.year}-${this.datePickerDate.month}-${this.datePickerDate.day}`;
  }

  /**
   * filters templates to only show the ones matching the given category.
   * @param {*} categoryId
   * @returns
   */
  templateFilter(categoryId) {
    return function (value) {
      return categoryId === value.categoryId;
    };
  }

  onTemplateElementClicked($event, templateId) {
    const el = $event.target;
    el.style.backgroundColor = '#0078D7';
    el.style.color = 'white';
    document.querySelectorAll('.reporting-selectable-template').forEach((element: any) => {
      if (el !== element) {
        element.style.backgroundColor = 'white';
        element.style.color = 'black';
      }
    });

    this.reportingService.changeSelectedTemplate(templateId);
  }

  templateSupportsFreeText() {
    if (!this.reportingService.workingTemplate) return false;

    if (!this.reportingService.workingTemplate.pages) {
      return false;
    }

    for (const page of this.reportingService.workingTemplate.pages) {
      for (const pageElement of page.pageElements) {
        if (pageElement.type === 'textInput') {
          return true;
        }
      }
    }
    return false;
  }

  onTemplateSelected() {
    this.reportingService.bakeInCustomInfo();
    this.reportingService.changeWorkflowState(this.workflowState.reportingOverview);
  }

  onBackToWorkflowSelectionClicked() {
    this.reportingService.changeSelectedTemplate(0);
    this.reportingService.changeWorkflowState(this.workflowState.workflowSelect);
  }
}
