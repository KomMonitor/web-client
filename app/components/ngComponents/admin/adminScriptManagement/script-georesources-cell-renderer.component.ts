import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";

@Component({
  selector: "app-script-georesources-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container
      *ngIf="georesourceIds && georesourceIds.length > 0; else none"
    >
      <table class="table table-condensed table-bordered table-striped table-sm">
        <thead>
          <tr>
            <th>Id</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let id of georesourceIds">
            <td>{{ id }}</td>
            <td>{{ getGeoresourceName(id) }}</td>
          </tr>
        </tbody>
      </table>
    </ng-container>
    <ng-template #none>keine</ng-template>
  `,
})
export class ScriptGeoresourcesCellRendererComponent implements ICellRendererAngularComp {
  private dataExchangeService = inject(DataExchangeService);

  georesourceIds: string[] = [];

  agInit(params: ICellRendererParams): void {
    this.setParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setParams(params);
    return true;
  }

  private setParams(params: ICellRendererParams): void {
    this.georesourceIds = params.data?.requiredGeoresourceIds ?? [];
  }

  getGeoresourceName(id: string): string {
    return (
      (this.dataExchangeService.getGeoresourceMetadataById(id) as any)
        ?.datasetName ?? ""
    );
  }
}
