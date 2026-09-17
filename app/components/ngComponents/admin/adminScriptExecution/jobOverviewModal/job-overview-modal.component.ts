import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { JobOverviewRow } from 'components/ngComponents/models/jobs.models';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';
import { JobSummaryCellRendererComponent } from '../job-summary-cell-renderer.component';

/** Header accent of the dialog, matching the tile that opened it. */
export type JobOverviewAccent = 'primary' | 'green' | 'red' | 'cyan' | 'orange';

const ACCENT_COLORS: Record<JobOverviewAccent, string> = {
  primary: '#337ab7',
  green: '#00a65a',
  red: '#dd4b39',
  cyan: '#00c0ef',
  orange: '#ff851b',
};

const STATUS_ICONS: Record<string, string> = {
  successful: 'fas fa-circle-check',
  failed: 'fas fa-circle-xmark',
  running: 'fas fa-spinner',
  accepted: 'fas fa-hourglass-start',
  dismissed: 'fas fa-ban',
};

/**
 * The job overview table.
 *
 * Lives in a dialog rather than on the page because two places open it: the
 * indicator-calculation tiles (filtered by status) and — from package B on —
 * the script management table (filtered to one schedule's jobs). Callers pass
 * the rows they want shown plus a title; this dialog only loads the per-job
 * summaries, behind its own spinner.
 */
@Component({
  selector: 'app-job-overview-modal',
  standalone: true,
  imports: [TranslateModule, AgGridAngular, LoadingOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-overview-modal.component.html',
})
export class JobOverviewModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private jobOverviewService = inject(JobOverviewService);
  private gridHelper = inject(KommonitorDataGridHelperService);
  private translate = inject(TranslateService);

  /** The jobs to show. The caller has already filtered them. */
  @Input({ required: true }) rows: JobOverviewRow[] = [];
  @Input() titleText = '';
  @Input() accent: JobOverviewAccent = 'primary';

  // Signal-backed: set from the async summary load (OnPush).
  protected loadingSummaries = signal(true);
  protected rowData = signal<JobOverviewRow[]>([]);

  protected columnDefs: ColDef[] = [];
  protected defaultColDef: ColDef = {
    ...this.gridHelper.buildDefaultColDef(),
    wrapHeaderText: true,
    autoHeaderHeight: true,
  };
  protected gridOptions: GridOptions = {
    ...this.gridHelper.buildGridOptions(),
    // No bulk action exists on jobs, so rows are not selectable.
    rowSelection: undefined,
    suppressRowClickSelection: true,
  };

  get accentColor(): string {
    return ACCENT_COLORS[this.accent];
  }

  async ngOnInit(): Promise<void> {
    this.columnDefs = this.buildColumnDefs();
    this.rowData.set(this.rows);

    try {
      // Summaries are per job and only exist for successful ones; a failure
      // here must still leave the table visible.
      await this.jobOverviewService.loadSummaries(this.rows);
    } finally {
      this.loadingSummaries.set(false);
      // Re-set so the summary cells re-read the now-filled cache.
      this.rowData.set([...this.rows]);
    }
  }

  close(): void {
    this.activeModal.close();
  }

  private buildColumnDefs(): ColDef[] {
    return [
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_JOB'),
        pinned: 'left',
        minWidth: 240,
        maxWidth: 320,
        cellRenderer: (params) => {
          const row = params.data as JobOverviewRow;
          const indicatorName =
            row.targetIndicatorName ??
            this.translate.instant('ADMIN_SCRIPTS.GRID.UNKNOWN_TARGET_INDICATOR');
          return `<div><strong>${indicatorName}</strong></div>
<div>${row.processTitle}</div>
<div><small class="text-muted">${row.job.jobID}</small></div>`;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => {
          const row = params.data as JobOverviewRow;
          return [row.targetIndicatorName, row.processTitle, row.job.jobID]
            .filter(Boolean)
            .join(' ');
        },
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_EXECUTION'),
        minWidth: 200,
        maxWidth: 260,
        cellRenderer: (params) => {
          const job = (params.data as JobOverviewRow).job;
          const icon = STATUS_ICONS[job.status] ?? 'fas fa-circle-question';
          const statusLabel = this.statusLabel(job.status);
          return `<div>${this.formatDateTime(job.job_end_datetime)}</div>
<div><i class="${icon}"></i> ${statusLabel}</div>`;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => this.statusLabel((params.data as JobOverviewRow).job.status),
        comparator: (_a, _b, nodeA, nodeB) => {
          const rowA = nodeA.data as JobOverviewRow;
          const rowB = nodeB.data as JobOverviewRow;
          return (
            Date.parse(rowA.job.job_start_datetime ?? '') -
            Date.parse(rowB.job.job_start_datetime ?? '')
          );
        },
        sort: 'desc',
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_JOB_SUMMARY'),
        minWidth: 320,
        cellRenderer: JobSummaryCellRendererComponent,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) =>
          JSON.stringify(
            this.jobOverviewService.getSummary((params.data as JobOverviewRow).job.jobID) ?? ''
          ),
      },
    ];
  }

  private statusLabel(status: string): string {
    const key = 'ADMIN_SCRIPTS.JOB_STATUS.' + status.toUpperCase();
    const label = this.translate.instant(key);
    // ngx-translate echoes the key back when it is missing.
    return label === key ? status : label;
  }

  private formatDateTime(value: string | undefined): string {
    if (!value) {
      return '';
    }
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? value : new Date(timestamp).toLocaleString('de-DE');
  }
}
