import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  JobResultsResponse,
  JobSummaryEntry,
  ProcessJob,
  ProcessJobsResponse,
} from 'components/ngComponents/models/jobs.models';
import {
  KommonitorUiParams,
  ProcessSchedule,
  ProcessScheduleInputs,
  ProcessSchedulesResponse,
  ProcessSummary,
  ProcessesResponse,
  ScheduleCreatedResponse,
} from 'components/ngComponents/models/schedules.models';
import { firstValueFrom } from 'rxjs';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Access to the OGC Processes API: schedules (what used to be process scripts)
 * and the process catalogue.
 *
 * Deliberately separate from `CacheHelperServiceService`, which owns the Data
 * Management API and its LocalStorage cache. Schedules change with every job
 * run, so that cache does not apply here.
 *
 * `schedules` requires authentication while KomMonitor itself starts without a
 * login, so every read resolves with an empty result on error instead of
 * throwing — a 401 must not take the startup down.
 */
@Injectable({
  providedIn: 'root',
})
export class ProcessesApiService {
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);

  /** Job ids shorter than this are short-lived Prefect-internal ids, not UUIDs. */
  private static readonly MIN_JOB_ID_LENGTH = 34;

  /** Only these process families are offered in the KomMonitor UI. */
  private static readonly UI_PROCESS_ID_PREFIXES = ['KmIndicator', 'KmGeoresource'];

  private get baseUrl(): string {
    return this.envConfigService.targetUrlToProcessesApi;
  }

  async fetchSchedules(): Promise<ProcessSchedule[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ProcessSchedulesResponse>(this.baseUrl + 'schedules')
      );
      return (response.schedules ?? []).map((schedule) => this.withoutTemporaryJobIds(schedule));
    } catch (error) {
      console.error('Could not fetch process schedules:', error);
      return [];
    }
  }

  /**
   * Single schedule. The API answers with the same envelope as the list, so the
   * result is read from `schedules[0]`.
   */
  async fetchSingleSchedule(scheduleId: string): Promise<ProcessSchedule | undefined> {
    try {
      const response = await firstValueFrom(
        this.http.get<ProcessSchedulesResponse>(this.baseUrl + 'schedules/' + scheduleId)
      );
      const schedule = response.schedules?.[0];
      return schedule ? this.withoutTemporaryJobIds(schedule) : undefined;
    } catch (error) {
      console.error('Could not fetch process schedule ' + scheduleId + ':', error);
      return undefined;
    }
  }

  /**
   * The process catalogue, reduced to the families the UI offers. `processes`
   * is public, so this one is expected to succeed even without a login.
   */
  async fetchProcesses(): Promise<ProcessSummary[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ProcessesResponse>(this.baseUrl + 'processes')
      );
      return (response.processes ?? []).filter((process) =>
        ProcessesApiService.UI_PROCESS_ID_PREFIXES.some((prefix) => process.id?.startsWith(prefix))
      );
    } catch (error) {
      console.error('Could not fetch processes:', error);
      return [];
    }
  }

  /**
   * All jobs. `limit` and `offset` are accepted but ignored by the server — the
   * response always holds the complete list and carries no `next` link — so
   * callers that want fewer rows have to cut the list themselves.
   */
  async fetchJobs(): Promise<ProcessJob[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ProcessJobsResponse>(this.baseUrl + 'jobs')
      );
      return response.jobs ?? [];
    } catch (error) {
      console.error('Could not fetch jobs:', error);
      return [];
    }
  }

  /** A single job, used while watching a manually triggered run. */
  async fetchJob(jobId: string): Promise<ProcessJob | undefined> {
    try {
      return await firstValueFrom(this.http.get<ProcessJob>(this.baseUrl + 'jobs/' + jobId));
    } catch (error) {
      console.error('Could not fetch job ' + jobId + ':', error);
      return undefined;
    }
  }

  /**
   * Creates a schedule for a process.
   *
   * Addressed by the process' **PascalCase `id`**, not by the `apiName` that
   * schedules and jobs report afterwards. The answer carries the new id as
   * `scheduling_id`; a freshly created schedule starts out as `NOT_READY`.
   *
   * Rethrows like the other writes: a failed creation has to reach the user.
   */
  async createSchedule(processId: string, inputs: ProcessScheduleInputs): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<ScheduleCreatedResponse>(
        this.baseUrl + 'processes/' + processId + '/schedule',
        { inputs }
      )
    );
    return response.scheduling_id;
  }

  /** Removes a schedule; the API reports this as a dismissal. */
  async deleteSchedule(scheduleId: string): Promise<void> {
    await firstValueFrom(this.http.delete(this.baseUrl + 'schedules/' + scheduleId));
  }

  /**
   * Starts a schedule's process right away, outside its cron plan.
   *
   * Unlike the reads above this one rethrows: a manual trigger is a user
   * action, and silently doing nothing would be worse than an error message.
   * The response carries no job id — the new job only shows up in the
   * schedule's `jobIDs` a moment later, which is what `ScheduleExecutionService`
   * waits for.
   */
  async triggerScheduleExecution(scheduleId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(this.baseUrl + 'schedules/' + scheduleId + '/execution', {})
    );
  }

  /**
   * Per-spatial-unit summary of one job.
   *
   * Only defined for successful jobs: the API answers 400 for a failed one
   * (`InvalidParameterValue` / "job failed"), whose failure text sits in
   * `job.message` instead. Callers should therefore ask only for successful
   * jobs; an unexpected failure still resolves with `undefined` so the table
   * can be built without the details.
   */
  async fetchJobSummary(jobId: string): Promise<JobSummaryEntry[] | undefined> {
    try {
      const response = await firstValueFrom(
        this.http.get<JobResultsResponse>(this.baseUrl + 'jobs/' + jobId + '/results')
      );
      return response.jobSummary ?? [];
    } catch (error) {
      console.error('Could not fetch results for job ' + jobId + ':', error);
      return undefined;
    }
  }

  /** Full description of a single process, including its inputs and UI params. */
  async fetchProcessDescription(processId: string): Promise<ProcessSummary | undefined> {
    try {
      return await firstValueFrom(
        this.http.get<ProcessSummary>(this.baseUrl + 'processes/' + processId)
      );
    } catch (error) {
      console.error('Could not fetch process description for ' + processId + ':', error);
      return undefined;
    }
  }

  /**
   * Reads the KomMonitor UI block out of a process description. It sits in
   * `additional_parameters` and is only populated on the single-process
   * response, never on the list.
   */
  extractKommonitorUiParams(process: ProcessSummary | undefined): KommonitorUiParams | undefined {
    const parameter = process?.additional_parameters?.parameters?.find(
      (entry) => entry.name === 'kommonitorUiParams'
    );
    return parameter?.value?.[0] as KommonitorUiParams | undefined;
  }

  private withoutTemporaryJobIds(schedule: ProcessSchedule): ProcessSchedule {
    return {
      ...schedule,
      jobIDs: (schedule.jobIDs ?? []).filter(
        (jobId) => jobId.length >= ProcessesApiService.MIN_JOB_ID_LENGTH
      ),
    };
  }
}
