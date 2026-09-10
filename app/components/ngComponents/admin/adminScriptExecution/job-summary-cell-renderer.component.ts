import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

interface SpatialUnitIntegrationSummaryItem {
  spatialUnitId: string;
  spatialUnitName: string;
  numberOfIntegratedIndicatorFeatures: number;
  numberOfIntegratedTargetDates: number;
  integratedTargetDates: string[];
  errorsOccurred: string[];
}

@Component({
  selector: 'app-job-summary-cell-renderer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The six-column summary is far wider than the grid column that hosts it, so
  // it scrolls inside its own cell rather than dictating the column's width.
  styles: `
    .summary-scroll {
      overflow-x: auto;
    }

    .summary-scroll table {
      margin-bottom: 0;
    }

    .summary-scroll th {
      white-space: nowrap;
    }
  `,
  template: `
    @if (summaryItems() && summaryItems()!.length > 0) {
      <div class="summary-scroll">
        <table class="table table-sm table-bordered table-striped">
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
            @for (item of summaryItems()!; track item) {
              <tr>
                <td>{{ item.spatialUnitId }}</td>
                <td>{{ item.spatialUnitName }}</td>
                <td>{{ item.numberOfIntegratedIndicatorFeatures }}</td>
                <td>{{ item.numberOfIntegratedTargetDates }}</td>
                <td>{{ item.integratedTargetDates }}</td>
                <td>
                  @if (item.errorsOccurred && item.errorsOccurred.length > 0) {
                    <pre>{{ item.errorsOccurred | json }}</pre>
                  } @else {
                    keine Fehlermeldungen vorhanden
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      Dieser Job umfasst keine Informationen zur erfolgreichen/gescheiterten Datenintegration
    }
  `,
})
export class JobSummaryCellRendererComponent implements ICellRendererAngularComp {
  // Signal: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  summaryItems = signal<SpatialUnitIntegrationSummaryItem[] | null>(null);

  agInit(params: ICellRendererParams): void {
    this.setParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setParams(params);
    return true;
  }

  private setParams(params: ICellRendererParams): void {
    this.summaryItems.set(params.data.spatialUnitIntegrationSummary ?? null);
  }
}
