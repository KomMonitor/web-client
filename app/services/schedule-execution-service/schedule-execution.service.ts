import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { ProcessesApiService } from 'services/processes-api-service/processes-api.service';

/** How often the watcher polls, and when it gives up. */
const NEW_JOB_POLL_MS = 1000;
const COMPLETION_POLL_MS = 3000;
const MAX_CONSECUTIVE_ERRORS = 5;
/**
 * Upper bound on waiting for the new job id to appear. Without it a schedule
 * whose run never registers would poll for the rest of the session.
 */
const MAX_NEW_JOB_POLLS = 60;

/**
 * Manually triggering a schedule, and following what happens next.
 *
 * The API answers a trigger with no job id, so the new job has to be found by
 * polling the schedule until its `jobIDs` grows. Only then can the run itself
 * be followed to success or failure.
 *
 * Which schedules are currently waiting is exposed as a signal, so the table
 * can disable the button and show a spinner without the DOM poking master does
 * (`$("#btnExecuteScript_…").attr("disabled")`).
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleExecutionService {
  private processesApiService = inject(ProcessesApiService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  private _pendingScheduleIds = signal<ReadonlySet<string>>(new Set());
  readonly pendingScheduleIds = this._pendingScheduleIds.asReadonly();

  /** True while a manual run of this schedule has not produced a job id yet. */
  isPending(scheduleId: string): boolean {
    return this._pendingScheduleIds().has(scheduleId);
  }

  readonly hasPending = computed(() => this._pendingScheduleIds().size > 0);

  /**
   * Triggers a run and returns once the request was accepted. Watching happens
   * in the background; callers do not wait for the job to finish.
   */
  async triggerExecution(schedule: ProcessSchedule): Promise<void> {
    const knownJobCount = (schedule.jobIDs ?? []).length;
    this.markPending(schedule.scheduleID, true);

    try {
      await this.processesApiService.triggerScheduleExecution(schedule.scheduleID);
    } catch (error) {
      this.markPending(schedule.scheduleID, false);
      console.error('Could not trigger execution for schedule ' + schedule.scheduleID + ':', error);
      this.notificationService.showError(
        this.translate.instant('ADMIN_SCRIPTS.EXECUTION_TRIGGER.FAILED')
      );
      throw error;
    }

    this.notificationService.show(
      this.translate.instant('ADMIN_SCRIPTS.EXECUTION_TRIGGER.STARTED')
    );
    void this.watchForNewJob(schedule, knownJobCount, 0);
  }

  /**
   * Polls the schedule until a new job id shows up, then follows that job.
   * Keeps the store in step so both tables see the new job id.
   */
  private async watchForNewJob(
    schedule: ProcessSchedule,
    knownJobCount: number,
    attempt: number
  ): Promise<void> {
    if (attempt >= MAX_NEW_JOB_POLLS) {
      this.markPending(schedule.scheduleID, false);
      this.notificationService.showError(
        this.translate.instant('ADMIN_SCRIPTS.EXECUTION_TRIGGER.NO_JOB_APPEARED')
      );
      return;
    }

    await this.delay(NEW_JOB_POLL_MS);
    const updated = await this.processesApiService.fetchSingleSchedule(schedule.scheduleID);

    if (!updated || (updated.jobIDs ?? []).length <= knownJobCount) {
      void this.watchForNewJob(schedule, knownJobCount, attempt + 1);
      return;
    }

    this.processScriptStore.replaceSingleProcessScriptMetadata(updated);
    this.markPending(schedule.scheduleID, false);

    // Master reads jobIDs[0]; the list is newest-first, and the new id is the
    // one the previous list did not have.
    const newJobId = this.findNewJobId(schedule.jobIDs ?? [], updated.jobIDs ?? []);
    if (newJobId) {
      void this.watchForCompletion(newJobId, updated, 0);
    }
  }

  /** Follows a running job to success or failure and reports the outcome. */
  private async watchForCompletion(
    jobId: string,
    schedule: ProcessSchedule,
    errorCount: number
  ): Promise<void> {
    await this.delay(COMPLETION_POLL_MS);

    const job = await this.processesApiService.fetchJob(jobId);
    if (!job) {
      if (errorCount + 1 >= MAX_CONSECUTIVE_ERRORS) {
        this.notificationService.showError(
          this.translate.instant('ADMIN_SCRIPTS.EXECUTION_TRIGGER.WATCH_FAILED')
        );
        return;
      }
      void this.watchForCompletion(jobId, schedule, errorCount + 1);
      return;
    }

    if (job.status === 'successful') {
      const refreshed = await this.processesApiService.fetchSingleSchedule(schedule.scheduleID);
      if (refreshed) {
        this.processScriptStore.replaceSingleProcessScriptMetadata(refreshed);
      }
      this.notificationService.showSuccess(
        this.translate.instant('ADMIN_SCRIPTS.EXECUTION_TRIGGER.COMPLETED', {
          indicatorName: this.targetIndicatorName(schedule),
        })
      );
      return;
    }

    if (job.status === 'failed') {
      this.notificationService.showError(
        this.translate.instant('ADMIN_SCRIPTS.EXECUTION_TRIGGER.JOB_FAILED', {
          indicatorName: this.targetIndicatorName(schedule),
        })
      );
      return;
    }

    void this.watchForCompletion(jobId, schedule, 0);
  }

  private findNewJobId(before: string[], after: string[]): string | undefined {
    const known = new Set(before);
    return after.find((jobId) => !known.has(jobId));
  }

  private targetIndicatorName(schedule: ProcessSchedule): string {
    const indicatorId = schedule.inputs?.target_indicator_id;
    return (
      this.indicatorStore.getIndicatorMetadataById(indicatorId as string)?.indicatorName ??
      (indicatorId as string) ??
      ''
    );
  }

  private markPending(scheduleId: string, pending: boolean): void {
    this._pendingScheduleIds.update((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(scheduleId);
      } else {
        next.delete(scheduleId);
      }
      return next;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
