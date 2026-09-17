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
import { AdminModalService } from '../adminShared/modal/admin-modal.service';
import { MODAL_WIDE } from 'util/modal-presets';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { SmallBoxComponent } from '../adminDashboardManagement/small-box/small-box.component';
import {
  JobOverviewAccent,
  JobOverviewModalComponent,
} from './jobOverviewModal/job-overview-modal.component';

/** One status tile: how it is counted, labelled and coloured. */
interface StatusTile {
  status: string;
  labelKey: string;
  color: string;
  accent: JobOverviewAccent;
}

const STATUS_TILES: StatusTile[] = [
  {
    status: 'successful',
    labelKey: 'ADMIN_SCRIPTS.EXECUTION.SUCCEEDED_JOBS',
    color: '#00a65a',
    accent: 'green',
  },
  {
    status: 'failed',
    labelKey: 'ADMIN_SCRIPTS.EXECUTION.FAILED_JOBS',
    color: '#dd4b39',
    accent: 'red',
  },
  {
    status: 'running',
    labelKey: 'ADMIN_SCRIPTS.EXECUTION.ACTIVE_JOBS',
    color: '#00c0ef',
    accent: 'cyan',
  },
  {
    status: 'accepted',
    labelKey: 'ADMIN_SCRIPTS.EXECUTION.WAITING_JOBS',
    color: '#ff851b',
    accent: 'orange',
  },
];

/**
 * The indicator-calculation page: five tiles over the Processes API job list.
 *
 * The page itself no longer holds a table. Counting happens here over the
 * loaded jobs — the API offers no per-status endpoint — and a click on a tile
 * opens the job overview dialog filtered to that status.
 */
@Component({
  selector: 'app-admin-script-execution',
  templateUrl: './admin-script-execution.component.html',
  imports: [TranslateModule, AdminContentViewComponent, SmallBoxComponent, LoadingOverlayComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminScriptExecutionComponent implements OnInit {
  private jobOverviewService = inject(JobOverviewService);
  private authService = inject(AuthService);
  private modals = inject(AdminModalService);
  private translate = inject(TranslateService);

  protected readonly statusTiles = STATUS_TILES;

  // Signal-backed: filled from the async job load (OnPush).
  protected rows = signal<JobOverviewRow[]>([]);
  protected loadingData = signal(true);

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

  /** Opens the overview filtered to one status. */
  protected openJobsForStatus(tile: StatusTile): void {
    const rows = this.rows().filter((row) => row.job.status === tile.status);
    void this.modals.open(JobOverviewModalComponent, MODAL_WIDE, {
      rows,
      titleText: this.translate.instant('ADMIN_SCRIPTS.EXECUTION.MODAL_TITLE_STATUS', {
        status: this.translate.instant(tile.labelKey),
      }),
      accent: tile.accent,
    });
  }
}
