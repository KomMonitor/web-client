import { Injectable, inject } from '@angular/core';
import {
  JobOverviewRow,
  JobSummaryEntry,
  ProcessJob,
} from 'components/ngComponents/models/jobs.models';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { ProcessCatalogStoreService } from 'services/process-catalog-store-service/process-catalog-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { ProcessesApiService } from 'services/processes-api-service/processes-api.service';
import { getTargetIndicatorId } from 'services/processes-api-service/schedule-inputs.util';

/**
 * Turns Processes API jobs into rows the overview table can show.
 *
 * A job does not know which indicator it computed — that lives on the schedule
 * that spawned it. So every row is a three-way join: the job itself, the
 * schedule that lists its id (for the target indicator), and the process
 * catalogue (for the readable name of the computation type).
 *
 * Shared rather than page-local because both the indicator-calculation page and
 * the script management table open the same job overview.
 */
@Injectable({
  providedIn: 'root',
})
export class JobOverviewService {
  private processesApiService = inject(ProcessesApiService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private processCatalogStore = inject(ProcessCatalogStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);

  /**
   * How many jobs the overview keeps, newest first.
   *
   * The server ignores `limit`, so the cut has to happen here. 50 matches what
   * master asked the server for; whether this should be configurable is still
   * open (`INDIKATORENBERECHNUNG_PROCESSES_API.md`, offene Frage 3).
   */
  static readonly MAX_JOBS = 50;

  /** Summaries are fetched per job on demand and kept for the session. */
  private summaryCache = new Map<string, JobSummaryEntry[]>();

  /**
   * Reloads schedules and jobs and joins them into rows.
   *
   * Schedules come first and are written back into the store: a job started
   * moments ago is only reachable through its schedule's `jobIDs`, so a stale
   * schedule list shows the wrong target indicator (or none).
   */
  async loadRows(): Promise<JobOverviewRow[]> {
    const schedules = await this.processesApiService.fetchSchedules();
    this.processScriptStore.setProcessScripts(schedules);

    const jobs = await this.processesApiService.fetchJobs();
    return this.buildRows(jobs, schedules);
  }

  /** Joins jobs against schedules and the process catalogue, newest first. */
  buildRows(jobs: ProcessJob[], schedules: ProcessSchedule[]): JobOverviewRow[] {
    const scheduleByJobId = this.buildScheduleByJobIdMap(schedules);

    return [...jobs]
      .sort((a, b) => this.startedAt(b) - this.startedAt(a))
      .slice(0, JobOverviewService.MAX_JOBS)
      .map((job) => this.toRow(job, scheduleByJobId.get(job.jobID)));
  }

  /**
   * `Map<jobID, schedule>` over every schedule's `jobIDs`. A job id can only
   * belong to one schedule, so later duplicates are ignored.
   */
  buildScheduleByJobIdMap(schedules: ProcessSchedule[]): Map<string, ProcessSchedule> {
    const map = new Map<string, ProcessSchedule>();
    for (const schedule of schedules) {
      for (const jobId of schedule.jobIDs ?? []) {
        if (!map.has(jobId)) {
          map.set(jobId, schedule);
        }
      }
    }
    return map;
  }

  /** Counts per status over the rows currently shown. */
  countByStatus(rows: JobOverviewRow[], status: string): number {
    return rows.filter((row) => row.job.status === status).length;
  }

  /**
   * Summaries for the given rows, successful jobs only — `results` answers 400
   * for a failed job. A job whose summary cannot be fetched is simply absent
   * from the result, so the table still renders.
   */
  async loadSummaries(rows: JobOverviewRow[]): Promise<Map<string, JobSummaryEntry[]>> {
    const missing = rows.filter(
      (row) => row.job.status === 'successful' && !this.summaryCache.has(row.job.jobID)
    );

    for (const row of missing) {
      const summary = await this.processesApiService.fetchJobSummary(row.job.jobID);
      if (summary) {
        this.summaryCache.set(row.job.jobID, summary);
      }
    }

    return this.summaryCache;
  }

  getSummary(jobId: string): JobSummaryEntry[] | undefined {
    return this.summaryCache.get(jobId);
  }

  /** Drops cached summaries so a refresh re-reads them. */
  clearSummaryCache(): void {
    this.summaryCache.clear();
  }

  private toRow(job: ProcessJob, schedule: ProcessSchedule | undefined): JobOverviewRow {
    const targetIndicatorId = schedule ? getTargetIndicatorId(schedule) : undefined;
    const indicatorMetadata = targetIndicatorId
      ? this.indicatorStore.getIndicatorMetadataById(targetIndicatorId)
      : undefined;

    return {
      job,
      targetIndicatorId,
      targetIndicatorName: indicatorMetadata?.indicatorName,
      // Falls back to the raw processID: jobs also reference processes that
      // carry no apiName at all, such as the export processes.
      processTitle: this.processCatalogStore.getProcessTitleByApiName(job.processID),
    };
  }

  private startedAt(job: ProcessJob): number {
    const timestamp = Date.parse(job.job_start_datetime ?? '');
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}
