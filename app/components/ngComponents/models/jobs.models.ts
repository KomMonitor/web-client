/**
 * Types for the job resources of the OGC Processes API.
 *
 * Hand-maintained like `schedules.models.ts`, and for the same reason: this API
 * ships no usable OpenAPI document. `ProcessJob` was derived from real
 * responses; `JobSummaryEntry` and `JobError` could not be — see the caveat
 * below. Details in `documentation/PROCESSES_API_BEFUNDE.md`.
 */

/**
 * The statuses OGC defines. Only `successful` and `failed` were observed on the
 * demo instance, but the others are part of the standard and the UI counts
 * them, so they are named here.
 */
export type ProcessJobStatus = 'accepted' | 'running' | 'successful' | 'failed' | 'dismissed';

export interface ProcessJob {
  type: 'process';
  jobID: string;
  /** The process' `apiName` in snake_case, like `schedule.processID`. */
  processID: string;
  status: ProcessJobStatus | string;
  /** Carries the failure text when `status` is `failed`; the only place it appears. */
  message: string | null;
  /** Always null on the observed instance — the API does not track progress. */
  progress: number | null;
  parameters?: {
    negotiated_execution_mode?: string;
    generated_outputs?: unknown;
    requested_response_type?: string;
  };
  job_start_datetime: string;
  job_end_datetime: string;
  links?: Array<{ href: string; rel: string; type: string | null; title?: string }>;
}

export interface ProcessJobsResponse {
  jobs: ProcessJob[];
  links?: unknown[];
}

/**
 * One entry of `GET jobs/{id}/results`, per spatial unit.
 *
 * **Not server-verified.** The demo instance holds no successful indicator job,
 * and `results` answers 400 for failed ones, so these field names come from
 * master's own Processes API code rather than from a response. Re-check against
 * a real successful job before relying on them.
 */
export interface JobSummaryEntry {
  spatialUnitId: string;
  numberOfIntegratedIndicatorFeatures: number;
  // Optional because the shape is unverified and master guards both of these
  // before reading them.
  integratedTargetDates?: string[];
  errorsOccurred?: JobError[];
}

export type JobErrorType =
  | 'missingTimestamp'
  | 'missingDataset'
  | 'missingSpatialUnit'
  | 'missingSpatialUnitFeature'
  | 'dataManagementApiError'
  | 'processingError';

export interface JobError {
  type: JobErrorType | string;
  affectedDatasetId: string;
  /** `indicator` or `georesource`; master compares case-insensitively. */
  affectedResourceType: string;
  affectedTimestamps?: string[];
  affectedSpatialUnitFeatures?: string[];
}

/** `results` returns the summary array under this key. */
export interface JobResultsResponse {
  jobSummary?: JobSummaryEntry[];
}

/**
 * A job as the overview table consumes it: the raw job plus everything that has
 * to be joined in from elsewhere (the schedule and the process catalogue).
 */
export interface JobOverviewRow {
  job: ProcessJob;
  /** Resolved through the schedule that owns this job id; may be unknown. */
  targetIndicatorName: string | undefined;
  targetIndicatorId: string | undefined;
  /** Title of the process type, or the raw `processID` when unresolvable. */
  processTitle: string;
}
