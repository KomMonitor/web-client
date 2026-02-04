import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { ReportingService, WorkflowState } from 'services/reporting-service/reporting.service';

@Component({
  selector: 'app-workflow-select',
  standalone: true,
  templateUrl: './workflow-select.component.html',
  styleUrls: ['./workflow-select.component.scss'],
  imports: [CommonModule]
})
export class WorkflowSelectComponent {

  @Output() selectedWorkflow = new EventEmitter<any[]>();

  constructor(
    protected reportingService: ReportingService
  ) {}

  onWorkflowSelect(value: any[]) {
    this.selectedWorkflow.emit(value);

    this.reportingService.changeWorkflowState(WorkflowState.templateSelect);
  }

  /* onConfigSelect(event:any) {

    let content = "";
    let file = event.target.files[0];
    if (!file)
        return;
    let reader = new FileReader();
    reader.onload = (e:any) => {
        content = e.target.result;
        let config:string = '';
        try {
            config = JSON.parse(content);
            this.onWorkflowSelect([1,'existing',config]);
        }
        catch (e) {
            console.error("Configuration is no valid JSON.");
        }
        //TODO check if json has correct structure, can be done once config structure is defined
        //$scope.onWorkflowSelected("existing", config);
    };
    reader.readAsText(file);
  } */
}
