import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  afterEveryRender,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { JobOverviewRow } from 'components/ngComponents/models/jobs.models';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';
import { JobSummaryCellRendererComponent } from '../job-summary-cell-renderer.component';

/** Never shrink below this, however little room is left. */
const MIN_FILL_HEIGHT = 300;

/**
 * Breathing room under the grid, on top of what is measured below it.
 *
 * It also absorbs the few pixels the admin shell ends up taller than the
 * viewport: its `min-height: 100vh` plus its own spacing, which no element
 * below the grid reports.
 */
const BOTTOM_GAP = 16;

const STATUS_ICONS: Record<string, string> = {
  successful: 'fas fa-circle-check',
  failed: 'fas fa-circle-xmark',
  running: 'fas fa-spinner',
  accepted: 'fas fa-hourglass-start',
  dismissed: 'fas fa-ban',
};

/**
 * The job table: three columns over a set of jobs the caller has filtered.
 *
 * Its own component because two hosts show it — the indicator-calculation page
 * below its status tiles, and the dialog the script management opens per
 * schedule. The caller passes the rows; this component only loads the per-job
 * summaries behind its own spinner.
 *
 * It deliberately never re-sets `rowData` on its own: the summary cache is a
 * signal, so those cells redraw themselves, and a rebuilt grid would drop the
 * user's filter, sort and column widths. The binding changes only when the host
 * hands over a different set of rows, which is a rebuild the user asked for.
 */
@Component({
  selector: 'app-job-overview-table',
  standalone: true,
  imports: [TranslateModule, AgGridAngular, LoadingOverlayComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './job-overview-table.component.html',
})
export class JobOverviewTableComponent implements OnChanges {
  private jobOverviewService = inject(JobOverviewService);
  private gridHelper = inject(KommonitorDataGridHelperService);
  private translate = inject(TranslateService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The jobs to show. The host has already filtered them. */
  @Input({ required: true }) rows: JobOverviewRow[] = [];
  /**
   * A CSS length, or `fill` to take whatever room is left below the grid.
   *
   * `fill` is measured rather than expressed in CSS: the admin shell scrolls
   * the whole page instead of constraining it, so there is no height chain a
   * percentage could resolve against. Without it the page and the grid each
   * bring their own scrollbar.
   */
  @Input() height = '70vh';

  /** The resolved height that reaches the grid. */
  protected gridHeight = signal('70vh');

  // Signal-backed: set from the async summary load (OnPush).
  protected loadingSummaries = signal(true);

  protected columnDefs: ColDef[] = this.buildColumnDefs();
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

  constructor() {
    // Re-measured after every render, so the grid follows the layout above it
    // — the filter button appearing, the tiles wrapping on a narrow viewport.
    // The signal only notifies on a real change, so this settles immediately.
    afterEveryRender(() => this.updateHeight());

    const onResize = () => this.updateHeight();
    window.addEventListener('resize', onResize);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('resize', onResize));
  }

  /**
   * Summaries follow the rows, so switching the status filter loads what the
   * new selection needs. `loadSummaries()` caches and only asks for successful
   * jobs it has not seen.
   *
   * `ngOnChanges` rather than an `effect`: `loadSummaries()` reads the cache
   * signal, so an effect would track it and retrigger itself on its own write.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rows']) {
      void this.loadSummaries();
    }
    if (changes['height']) {
      this.updateHeight();
    }
  }

  /**
   * Measured against the document, not the viewport, so scrolling cannot feed
   * back into the height and make the grid grow as the page moves.
   *
   * What sits below the grid is measured in two parts, and neither of them
   * moves with the grid's own height: the padding its box adds underneath, and
   * the page footer. Measuring instead to the footer's position would feed
   * back on itself — the footer is pushed to the bottom of a flex column, so
   * shrinking the grid grows the gap above it, and the grid would shrink again
   * with every pass.
   */
  private updateHeight(): void {
    if (this.height !== 'fill') {
      this.gridHeight.set(this.height);
      return;
    }

    const grid = this.host.nativeElement.querySelector('ag-grid-angular');
    if (!grid) {
      return;
    }

    const gridRect = grid.getBoundingClientRect();
    const box = grid.closest('expandable-box') ?? this.host.nativeElement.parentElement;
    const boxPadding = box ? box.getBoundingClientRect().bottom - gridRect.bottom : 0;
    const footerHeight =
      document.querySelector<HTMLElement>('.content-wrapper > footer')?.offsetHeight ?? 0;
    const below = boxPadding + footerHeight + BOTTOM_GAP;
    const available = window.innerHeight - (gridRect.top + window.scrollY) - below;

    this.gridHeight.set(`${Math.max(MIN_FILL_HEIGHT, Math.round(available))}px`);
  }

  private async loadSummaries(): Promise<void> {
    this.loadingSummaries.set(true);
    try {
      // Summaries are per job and only exist for successful ones; a failure
      // here must still leave the table visible.
      await this.jobOverviewService.loadSummaries(this.rows);
    } catch {
      // The service tolerates a single failed fetch on its own; this covers
      // the case where the whole load gives up. The rows stay, without their
      // summaries.
    } finally {
      this.loadingSummaries.set(false);
    }
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
