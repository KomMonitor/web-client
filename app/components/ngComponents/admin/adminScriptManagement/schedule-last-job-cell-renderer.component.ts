import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';

interface LastJobParams extends ICellRendererParams {
  onShowJobs: (schedule: ProcessSchedule) => void;
}

const STATUS_ICONS: Record<string, string> = {
  successful: 'fas fa-circle-check text-success',
  failed: 'fas fa-circle-xmark text-danger',
  running: 'fas fa-spinner text-info',
  accepted: 'fas fa-hourglass-start text-warning',
  dismissed: 'fas fa-ban text-muted',
};

/**
 * Column: when this schedule last ran, and how it went.
 *
 * Reads from the jobs the page already loaded. Master instead fires two HTTP
 * requests per row from inside the renderer and writes the answer back with
 * `getElementById().innerHTML`.
 */
@Component({
  selector: 'app-schedule-last-job-cell-renderer',
  standalone: true,
  imports: [TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (latestJob(); as job) {
      <div><i class="far fa-calendar"></i> {{ endedAt() }}</div>
      <div><i [class]="statusIcon()"></i> {{ statusLabel() | translate }}</div>
    } @else {
      <div>{{ 'ADMIN_SCRIPTS.GRID.NO_JOBS' | translate }}</div>
    }

    <button
      type="button"
      class="btn btn-sm btn-outline-secondary mt-2"
      [title]="'ADMIN_SCRIPTS.GRID.SHOW_JOBS' | translate"
      (click)="showJobs()"
    >
      <i class="fas fa-table"></i>
    </button>
  `,
})
export class ScheduleLastJobCellRendererComponent implements ICellRendererAngularComp {
  private jobOverviewService = inject(JobOverviewService);

  // Signal: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  private schedule = signal<ProcessSchedule | undefined>(undefined);
  private onShowJobs?: (schedule: ProcessSchedule) => void;

  protected latestJob = computed(() => {
    const schedule = this.schedule();
    return schedule ? this.jobOverviewService.getLatestRowForSchedule(schedule)?.job : undefined;
  });

  protected endedAt = computed(() => {
    const value = this.latestJob()?.job_end_datetime;
    if (!value) {
      return '';
    }
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? value : new Date(timestamp).toLocaleString('de-DE');
  });

  protected statusIcon = computed(
    () => STATUS_ICONS[this.latestJob()?.status ?? ''] ?? 'fas fa-circle-question'
  );

  protected statusLabel = computed(() => {
    const status = this.latestJob()?.status;
    return status ? 'ADMIN_SCRIPTS.JOB_STATUS.' + status.toUpperCase() : '';
  });

  agInit(params: LastJobParams): void {
    this.setParams(params);
  }

  refresh(params: LastJobParams): boolean {
    this.setParams(params);
    return true;
  }

  protected showJobs(): void {
    const schedule = this.schedule();
    if (schedule) {
      this.onShowJobs?.(schedule);
    }
  }

  private setParams(params: LastJobParams): void {
    this.schedule.set(params.data as ProcessSchedule);
    this.onShowJobs = params.onShowJobs;
  }
}
