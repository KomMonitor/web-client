import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-workflow-select',
  standalone: true,
  templateUrl: './workflow-select.component.html',
  styleUrls: ['./workflow-select.component.css']
})
export class WorkflowSelectComponent {

  @Output() selectedWorkflow = new EventEmitter<any[]>();

  onWorkflowSelect(value: any[]) {
    this.selectedWorkflow.emit(value);
  }

  onConfigSelect(event:any) {

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
  }
}
