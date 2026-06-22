import { Component, inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Component({
  selector: 'app-script-indicators-cell-renderer',
  standalone: true,
  imports: [],
  template: `
    @if (indicatorIds && indicatorIds.length > 0) {
      <table class="table table-condensed table-bordered table-striped table-sm">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          @for (id of indicatorIds; track id) {
            <tr>
              <td>{{ id }}</td>
              <td>{{ getIndicatorName(id) }}</td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      keine
    }
  `,
})
export class ScriptIndicatorsCellRendererComponent implements ICellRendererAngularComp {
  private dataExchangeService = inject(DataExchangeService);

  indicatorIds: string[] = [];

  agInit(params: ICellRendererParams): void {
    this.setParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setParams(params);
    return true;
  }

  private setParams(params: ICellRendererParams): void {
    this.indicatorIds = params.data?.requiredIndicatorIds ?? [];
  }

  getIndicatorName(id: string): string {
    return (this.dataExchangeService.getIndicatorMetadataById(id) as any)?.indicatorName ?? '';
  }
}
