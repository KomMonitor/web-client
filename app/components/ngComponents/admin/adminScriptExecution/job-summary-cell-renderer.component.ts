import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { JobOverviewRow, JobSummaryEntry } from 'components/ngComponents/models/jobs.models';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { JobErrorBoxComponent } from './job-error-box.component';

/** One summary row, with the spatial unit name already resolved. */
interface SummaryRow {
  spatialUnitLabel: string;
  numberOfIntegratedIndicatorFeatures: number;
  integratedTargetDates: string[];
  entry: JobSummaryEntry;
}

/**
 * The per-spatial-unit summary of a job.
 *
 * Summaries are not part of the job list; they are fetched separately and kept
 * in `JobOverviewService`, which this renderer reads. A failed job has no
 * summary at all — `results` answers 400 for one — so its failure text from
 * `job.message` is shown instead, since that is the only place it exists.
 */
@Component({
  selector: 'app-job-summary-cell-renderer',
  standalone: true,
  imports: [TranslateModule, JobErrorBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The table is wider than the grid column hosting it, so it scrolls inside
  // its own cell rather than dictating the column's width.
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

    .date-list {
      columns: 5;
      margin: 0;
      padding-left: 1.25rem;
      word-break: break-word;
    }

    .failure-message {
      white-space: pre-wrap;
      margin-bottom: 0;
    }
  `,
  template: `
    @if (summaryRows().length > 0) {
      <div class="summary-scroll">
        <table class="table table-sm table-bordered table-striped">
          <thead>
            <tr>
              <th>{{ 'ADMIN_SCRIPTS.JOB_SUMMARY.SPATIAL_UNIT' | translate }}</th>
              <th>{{ 'ADMIN_SCRIPTS.JOB_SUMMARY.INTEGRATED_FEATURES' | translate }}</th>
              <th>{{ 'ADMIN_SCRIPTS.JOB_SUMMARY.INTEGRATED_TARGET_DATES' | translate }}</th>
              <th>{{ 'ADMIN_SCRIPTS.JOB_SUMMARY.ERRORS' | translate }}</th>
            </tr>
          </thead>
          <tbody>
            @for (row of summaryRows(); track row.entry) {
              <tr>
                <td>{{ row.spatialUnitLabel }}</td>
                <td>
                  {{
                    row.numberOfIntegratedIndicatorFeatures ||
                      ('ADMIN_SCRIPTS.JOB_SUMMARY.NONE' | translate)
                  }}
                </td>
                <td>
                  @if (row.integratedTargetDates.length > 0) {
                    <ul class="date-list">
                      @for (date of row.integratedTargetDates; track date) {
                        <li>{{ date }}</li>
                      }
                    </ul>
                  } @else {
                    {{ 'ADMIN_SCRIPTS.JOB_SUMMARY.NONE' | translate }}
                  }
                </td>
                <td>
                  @if (row.entry.errorsOccurred?.length) {
                    @for (error of row.entry.errorsOccurred; track error) {
                      <app-job-error-box [error]="error" />
                    }
                  } @else {
                    {{ 'ADMIN_SCRIPTS.JOB_SUMMARY.NONE' | translate }}
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else if (failureMessage()) {
      <p class="failure-message text-danger">{{ failureMessage() }}</p>
    } @else {
      {{ 'ADMIN_SCRIPTS.JOB_SUMMARY.EMPTY' | translate }}
    }
  `,
})
export class JobSummaryCellRendererComponent implements ICellRendererAngularComp {
  private jobOverviewService = inject(JobOverviewService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);

  // Signal: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  private row = signal<JobOverviewRow | undefined>(undefined);

  protected summaryRows = computed<SummaryRow[]>(() => {
    const row = this.row();
    if (!row) {
      return [];
    }
    const summary = this.jobOverviewService.getSummary(row.job.jobID) ?? [];
    return summary.map((entry) => ({
      spatialUnitLabel: this.spatialUnitLabel(entry.spatialUnitId),
      numberOfIntegratedIndicatorFeatures: entry.numberOfIntegratedIndicatorFeatures,
      integratedTargetDates: [...(entry.integratedTargetDates ?? [])].sort(),
      entry,
    }));
  });

  protected failureMessage = computed(() => {
    const job = this.row()?.job;
    return job?.status === 'failed' ? job.message : null;
  });

  agInit(params: ICellRendererParams): void {
    this.setParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setParams(params);
    return true;
  }

  private setParams(params: ICellRendererParams): void {
    this.row.set(params.data as JobOverviewRow);
  }

  /** Only the id comes with the summary; the readable level name is local. */
  private spatialUnitLabel(spatialUnitId: string): string {
    return (
      this.spatialUnitStore.getSpatialUnitMetadataById(spatialUnitId)?.spatialUnitLevel ??
      spatialUnitId
    );
  }
}
