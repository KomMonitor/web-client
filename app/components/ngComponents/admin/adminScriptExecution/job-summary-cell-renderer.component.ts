import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import {
  JobError,
  JobOverviewRow,
  JobSummaryEntry,
} from 'components/ngComponents/models/jobs.models';
import { downloadJson } from 'util/json-file.util';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { JobErrorBoxComponent } from './job-error-box.component';

/** One summary row, with the spatial unit name already resolved. */
interface SummaryRow {
  spatialUnitLabel: string;
  numberOfIntegratedIndicatorFeatures: number;
  integratedTargetDates: string[];
  /** Flattened: the API declares a list of lists, master reads a flat one. */
  errors: JobError[];
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
    @if (canDownload()) {
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary mb-2"
        [title]="'ADMIN_SCRIPTS.JOB_SUMMARY.DOWNLOAD_ERRORS_TOOLTIP' | translate"
        (click)="download()"
      >
        <i class="fas fa-file-export"></i>&nbsp;{{
          'ADMIN_SCRIPTS.JOB_SUMMARY.DOWNLOAD_ERRORS' | translate
        }}
      </button>
    }

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
                  @if (row.errors.length > 0) {
                    @for (error of row.errors; track error) {
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
      // One level of flattening serves both shapes: a declared list of lists
      // collapses, an already flat list is unchanged.
      errors: ((entry.errorsOccurred ?? []) as (JobError | JobError[])[]).flat(),
      entry,
    }));
  });

  protected failureMessage = computed(() => {
    const job = this.row()?.job;
    return job?.status === 'failed' ? job.message : null;
  });

  /**
   * Only offer the download where there is something to hand over. The export
   * jobs of the demo are successful, carry no summary and no message — their
   * cell stays as empty as before.
   */
  protected canDownload = computed(() => this.summaryRows().length > 0 || !!this.failureMessage());

  /**
   * The job's error information as a file, replacing the log download that the
   * Processing Engine offered and the Processes API does not.
   *
   * Raw field names, not the translated box texts: the file is meant to be
   * forwarded to whoever runs the backend. `downloadJson` passes a string
   * through unchanged, so the indentation survives.
   */
  protected download(): void {
    const row = this.row();
    if (!row) {
      return;
    }

    const payload = {
      jobID: row.job.jobID,
      status: row.job.status,
      processID: row.job.processID,
      processTitle: row.processTitle,
      targetIndicatorId: row.targetIndicatorId ?? null,
      targetIndicatorName: row.targetIndicatorName ?? null,
      job_start_datetime: row.job.job_start_datetime,
      job_end_datetime: row.job.job_end_datetime,
      message: row.job.message,
      jobSummary: this.jobOverviewService.getSummary(row.job.jobID) ?? [],
    };

    downloadJson(`Job_Fehler_Export-${row.job.jobID}.json`, JSON.stringify(payload, null, 2));
  }

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
