import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { JobOverviewRow } from 'components/ngComponents/models/jobs.models';
import { AuthService } from 'services/auth-service/auth.service';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { SmallBoxComponent } from '../adminDashboardManagement/small-box/small-box.component';
import {
  ExpanableBoxBorderColor,
  ExpandableBoxComponent,
} from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { JobOverviewTableComponent } from './jobOverviewTable/job-overview-table.component';

/** One status tile: how it is counted, labelled and coloured. */
interface StatusTile {
  status: string;
  labelKey: string;
  color: string;
  /** Border of the table box while this tile's filter is active. */
  boxColor: ExpanableBoxBorderColor;
}

const STATUS_TILES: StatusTile[] = [
  {
    status: 'successful',
    labelKey: 'ADMIN_SCRIPTS.EXECUTION.SUCCEEDED_JOBS',
    color: '#00a65a',
    boxColor: 'green',
  },
  {
    status: 'failed',
    labelKey: 'ADMIN_SCRIPTS.EXECUTION.FAILED_JOBS',
    color: '#dd4b39',
    boxColor: 'red',
  },
  {
    status: 'running',
    labelKey: 'ADMIN_SCRIPTS.EXECUTION.ACTIVE_JOBS',
    color: '#00c0ef',
    boxColor: 'cyan',
  },
  {
    status: 'accepted',
    labelKey: 'ADMIN_SCRIPTS.EXECUTION.WAITING_JOBS',
    color: '#ff851b',
    boxColor: 'primary',
  },
];

/**
 * The indicator-calculation page: five tiles over the Processes API job list,
 * and the job table below them.
 *
 * Counting happens here over the loaded jobs — the API offers no per-status
 * endpoint. A click on a tile expands the table and filters it to that status;
 * the same table in a dialog belongs to the script management, which opens it
 * per schedule.
 *
 * The table is rendered only once it has been expanded, because the box keeps
 * its content alive while collapsed. Without that guard the per-job summaries
 * would be fetched on every page visit, whether or not anyone looks.
 */
@Component({
  selector: 'app-admin-script-execution',
  templateUrl: './admin-script-execution.component.html',
  imports: [
    TranslateModule,
    AdminContentViewComponent,
    SmallBoxComponent,
    LoadingOverlayComponent,
    ExpandableBoxComponent,
    JobOverviewTableComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminScriptExecutionComponent implements OnInit {
  private jobOverviewService = inject(JobOverviewService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  protected readonly statusTiles = STATUS_TILES;

  // Signal-backed: filled from the async job load (OnPush).
  protected rows = signal<JobOverviewRow[]>([]);
  protected loadingData = signal(true);

  /** The status a tile click filtered on, or null for all jobs. */
  protected selectedStatus = signal<string | null>(null);
  protected tableCollapsed = signal(true);
  /** Sticky: the table is built on first expand and then kept. */
  protected tableOpened = signal(false);

  /**
   * `jobs` needs a token while the app may run without a login. The service
   * swallows the 401 and returns an empty list, so "no jobs" and "not allowed
   * to see jobs" look the same here — hence the explicit auth check, which
   * shows a login hint instead of a misleading empty state.
   */
  protected loginRequired = computed(() => !this.authService.isAuthenticated());

  protected totalJobs = computed(() => this.rows().length);

  protected counts = computed(() => {
    const rows = this.rows();
    return new Map(
      STATUS_TILES.map((tile) => [
        tile.status,
        this.jobOverviewService.countByStatus(rows, tile.status),
      ])
    );
  });

  /** The tile whose filter is active, if any — it colours the table box. */
  protected selectedTile = computed(() =>
    STATUS_TILES.find((tile) => tile.status === this.selectedStatus())
  );

  protected filteredRows = computed(() => {
    const status = this.selectedStatus();
    return status ? this.rows().filter((row) => row.job.status === status) : this.rows();
  });

  protected tableTitle = computed(() => {
    const count = this.filteredRows().length;
    const tile = this.selectedTile();
    return tile
      ? this.translate.instant('ADMIN_SCRIPTS.EXECUTION.TABLE_TITLE_FILTERED', {
          status: this.translate.instant(tile.labelKey),
          count,
        })
      : this.translate.instant('ADMIN_SCRIPTS.EXECUTION.TABLE_TITLE', { count });
  });

  ngOnInit(): void {
    void this.loadData();
  }

  protected async loadData(): Promise<void> {
    this.loadingData.set(true);
    try {
      this.rows.set(await this.jobOverviewService.loadRows());
    } finally {
      this.loadingData.set(false);
    }
  }

  /**
   * Refresh reloads schedules as well, not just jobs: a job started moments ago
   * is only linked to its target indicator through its schedule's `jobIDs`, so
   * reloading jobs alone shows the wrong indicator or none. Cached summaries go
   * too, since a re-run job reports new ones.
   */
  protected async refreshJobOverviewTable(): Promise<void> {
    this.jobOverviewService.clearSummaryCache();
    await this.loadData();
  }

  protected countFor(status: string): number {
    return this.counts().get(status) ?? 0;
  }

  /** Expands the table and filters it to one status. */
  protected showJobsForStatus(tile: StatusTile): void {
    this.selectedStatus.set(tile.status);
    this.tableCollapsed.set(false);
    this.tableOpened.set(true);
  }

  /**
   * Keeps our copy of the collapsed state in step with the box's own header
   * toggle — without it a tile click could not reopen a box the user closed,
   * because the bound value would not change — and builds the table when it is
   * opened from the header rather than from a tile.
   */
  protected onTableCollapsedChange(collapsed: boolean): void {
    this.tableCollapsed.set(collapsed);
    if (!collapsed) {
      this.tableOpened.set(true);
    }
  }

  protected clearStatusFilter(): void {
    this.selectedStatus.set(null);
  }
}
