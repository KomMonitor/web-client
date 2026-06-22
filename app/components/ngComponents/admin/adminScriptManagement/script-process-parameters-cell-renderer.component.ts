import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

interface VariableProcessParameter {
  name: string;
  description: string;
  dataType: string;
  defaultValue: any;
  minParameterValueForNumericInputs?: number;
  maxParameterValueForNumericInputs?: number;
}

@Component({
  selector: 'app-script-process-parameters-cell-renderer',
  standalone: true,
  imports: [],
  template: `
    @if (parameters && parameters.length > 0) {
      <table class="table table-condensed table-bordered table-striped table-sm">
        <thead>
          <tr>
            <th style="word-break: normal">Name</th>
            <th style="word-break: normal">Beschreibung</th>
            <th style="word-break: normal">Datentyp</th>
            <th style="word-break: normal">Standard-Wert</th>
            <th style="word-break: normal">erlaubter Wertebereich</th>
          </tr>
        </thead>
        <tbody>
          @for (p of parameters; track p) {
            <tr>
              <td>{{ p.name }}</td>
              <td>{{ p.description }}</td>
              <td>{{ p.dataType }}</td>
              <td>{{ p.defaultValue }}</td>
              <td>
                @if (isNumeric(p.dataType)) {
                  {{ p.minParameterValueForNumericInputs }} -
                  {{ p.maxParameterValueForNumericInputs }}
                } @else {
                  -
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      keine
    }
  `,
})
export class ScriptProcessParametersCellRendererComponent implements ICellRendererAngularComp {
  parameters: VariableProcessParameter[] = [];

  agInit(params: ICellRendererParams): void {
    this.setParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setParams(params);
    return true;
  }

  private setParams(params: ICellRendererParams): void {
    this.parameters = params.data?.variableProcessParameters ?? [];
  }

  isNumeric(dataType: string): boolean {
    return dataType === 'integer' || dataType === 'double';
  }
}
