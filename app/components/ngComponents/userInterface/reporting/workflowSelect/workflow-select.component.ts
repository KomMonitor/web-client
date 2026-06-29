import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ImportData, ReportingService, WorkflowState } from 'services/reporting-service/reporting.service';

@Component({
  selector: 'app-workflow-select',
  standalone: true,
  templateUrl: './workflow-select.component.html',
  styleUrls: ['./workflow-select.component.scss'],
  imports: [CommonModule]
})
export class WorkflowSelectComponent {

  workflowState = WorkflowState;

  constructor(
    protected reportingService: ReportingService
  ) {}


  onConfigSelect(event:any) {

    let content = "";
    const file = event.target.files[0];
    if (!file)
      return;
    const reader = new FileReader();
    reader.onload = (e:any) => {
      content = e.target.result;
      try {
        const config:ImportData = JSON.parse(content);
        this.reportingService.triggerConfigImport(config);
      }
      catch (e) {
        console.error("Configuration is no valid JSON.");
      }
      //TODO check if json has correct structure, can be done once config structure is defined
      //$scope.onWorkflowSelected("existing", config);
    };
    reader.readAsText(file);
  }
}
