import { Component, EventEmitter, Output, inject } from '@angular/core';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
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
  private notificationService = inject(NotificationService);

  workflowState = WorkflowState;

  onConfigSelect(event: any) {
    let content = '';
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      content = e.target.result;
      let config: ImportData;
      try {
        config = JSON.parse(content);
      } catch (e) {
        console.error('Configuration is no valid JSON.', e);
        this.notificationService.showError('Die ausgewählte Datei ist keine gültige JSON-Datei.');
        return;
      }

      if (!this.isValidReportingConfig(config)) {
        console.error('Configuration does not have the expected structure.', config);
        this.notificationService.showError(
          'Die ausgewählte Datei enthält keine gültige Reporting-Konfiguration.'
        );
        return;
      }

      this.reportingService.triggerConfigImport(config);
    };
    reader.readAsText(file);
  }

  private isValidReportingConfig(config: any): config is ImportData {
    return (
      !!config &&
      typeof config === 'object' &&
      Array.isArray(config.pages) &&
      Array.isArray(config.templateSections) &&
      !!config.template &&
      typeof config.template.name === 'string'
    );
  }
}
