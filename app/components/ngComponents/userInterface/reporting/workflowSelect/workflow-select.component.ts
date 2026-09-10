import { Component, EventEmitter, Output, inject } from '@angular/core';
import {
  ImportData,
  ReportingService,
  WorkflowState,
} from 'services/reporting-service/reporting.service';

@Component({
  selector: 'app-workflow-select',
  standalone: true,
  templateUrl: './workflow-select.component.html',
  styleUrls: ['./workflow-select.component.scss'],
  imports: [],
})
export class WorkflowSelectComponent {
  protected reportingService = inject(ReportingService);

  workflowState = WorkflowState;

  onConfigSelect(event: any) {
    let content = '';
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      content = e.target.result;
      try {
        const config: ImportData = JSON.parse(content);
        this.reportingService.triggerConfigImport(config);
      } catch (e) {
        console.error('Configuration is no valid JSON.');
      }
      //TODO check if json has correct structure, can be done once config structure is defined
    };
    reader.readAsText(file);
  }
}
