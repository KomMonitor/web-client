import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ICellRendererAngularComp } from "ag-grid-angular";
import { ICellRendererParams } from "ag-grid-community";

interface SpatialUnitIntegrationSummaryItem {
  spatialUnitId: string;
  spatialUnitName: string;
  numberOfIntegratedIndicatorFeatures: number;
  numberOfIntegratedTargetDates: number;
  integratedTargetDates: string[];
  errorsOccurred: string[];
}

@Component({
  selector: "app-job-summary-cell-renderer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container
      *ngIf="summaryItems && summaryItems.length > 0; else noSummary"
    >
      <table class="table table-condensed table-bordered table-striped">
        <thead>
          <tr>
            <th>Raumebenen-Id</th>
            <th>Raumebenen-Name</th>
            <th>Anzahl integrierter Indikatoren-Features</th>
            <th>Anzahl integrierter Zeitstempel</th>
            <th>integrierte Zeitstempel</th>
            <th>Fehlermeldung</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of summaryItems">
            <td>{{ item.spatialUnitId }}</td>
            <td>{{ item.spatialUnitName }}</td>
            <td>{{ item.numberOfIntegratedIndicatorFeatures }}</td>
            <td>{{ item.numberOfIntegratedTargetDates }}</td>
            <td>{{ item.integratedTargetDates }}</td>
            <td>
              <ng-container
                *ngIf="
                  item.errorsOccurred && item.errorsOccurred.length > 0;
                  else noErrors
                "
              >
                <pre>{{ item.errorsOccurred | json }}</pre>
              </ng-container>
              <ng-template #noErrors
                >keine Fehlermeldungen vorhanden</ng-template
              >
            </td>
          </tr>
        </tbody>
      </table>
    </ng-container>
    <ng-template #noSummary>
      Dieser Job umfasst keine Informationen zur erfolgreichen/gescheiterten
      Datenintegration
    </ng-template>
  `,
})
export class JobSummaryCellRendererComponent implements ICellRendererAngularComp {
  summaryItems: SpatialUnitIntegrationSummaryItem[] | null = null;

  agInit(params: ICellRendererParams): void {
    this.setParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setParams(params);
    return true;
  }

  private setParams(params: ICellRendererParams): void {
    this.summaryItems = params.data.spatialUnitIntegrationSummary ?? null;
  }
}
