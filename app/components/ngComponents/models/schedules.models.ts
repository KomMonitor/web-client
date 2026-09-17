/**
 * Types for the OGC Processes API (schedules and the process catalogue).
 *
 * Unlike the Data Management API types in `models/data-management-api`, these
 * are hand-maintained: the Processes API ships no usable OpenAPI document
 * (its advertised `/openapi` and `/conformance` endpoints answer 404). The
 * shapes below were derived from real responses of the demo instance — see
 * `documentation/PROCESSES_API_ETAPPE0_BEFUNDE.md`.
 */

/**
 * A scheduled process run. Replaces the former process-script model: what used
 * to be a client-supplied script is now a scheduled invocation of a process
 * that the Processing Engine owns.
 *
 * Every field below was present on every observed schedule, so none are
 * optional.
 */
export interface ProcessSchedule {
  type: 'process';
  /**
   * The process' `apiName` in snake_case (e.g. `km_indicator_multiply`), NOT
   * the PascalCase `id` under which the process is listed and scheduled. Use
   * `ProcessCatalogService` to map between the two.
   */
  processID: string;
  scheduleID: string;
  /**
   * UUIDs of the jobs this schedule produced. The raw response also contains
   * short-lived Prefect-internal ids (`denim-swallow`); they point nowhere and
   * are filtered out on fetch.
   */
  jobIDs: string[];
  /** `READY` once registered; a freshly created schedule starts as `NOT_READY`. */
  status: string;
  /** ISO 8601 with offset, e.g. `2026-05-29T08:43:53.823389+00:00`. */
  scheduleCreated: string;
  scheduleUpdated: string;
  scheduleActive: boolean;
  /** Cron pattern (e.g. every third month). Mirrors `inputs.execution_interval.value.cron`. */
  scheduleCron: string;
  inputs: ProcessScheduleInputs;
}

/**
 * Schedule inputs. The four documented members are present on every schedule;
 * everything else depends on the process and is described by its process
 * description, hence the index signature.
 */
export interface ProcessScheduleInputs {
  target_indicator_id: string;
  target_spatial_units: string[];
  target_time: {
    value: {
      mode: 'ALL' | 'MISSING' | 'DATES' | string;
      includeDates: string[];
      excludeDates: string[];
    };
  };
  execution_interval: { value: { cron: string } };
  [inputName: string]: unknown;
}

export interface ProcessSchedulesResponse {
  schedules: ProcessSchedule[];
  links?: unknown[];
}

/**
 * Answer to `POST processes/{id}/schedule`. Note the key: the new id comes back
 * as `scheduling_id`, not `scheduleID` — which is what the same schedule is
 * called everywhere else.
 */
export interface ScheduleCreatedResponse {
  scheduling_id: string;
}

/** Answer to `DELETE schedules/{id}`; deletion is reported as a dismissal. */
export interface ScheduleDismissedResponse {
  scheduleID: string;
  status: string;
  message?: string;
  links?: unknown[];
}

/**
 * An entry of `GET processes`. `additional_parameters` is empty in the list
 * response — the `apiName` only appears in the single-process description.
 */
export interface ProcessSummary {
  id: string;
  title?: string | Record<string, string>;
  description?: string;
  version?: string;
  jobControlOptions?: string[];
  outputTransmission?: string[];
  /** Only present on the single-process description, never on the list. */
  inputs?: Record<string, ProcessInput>;
  additional_parameters?: ProcessAdditionalParameters;
  links?: unknown[];
}

export interface ProcessAdditionalParameters {
  parameters?: Array<{ name: string; value: unknown[] }>;
}

export interface ProcessesResponse {
  processes: ProcessSummary[];
  links?: unknown[];
}

/**
 * The KomMonitor-specific block a process description carries in
 * `additional_parameters.parameters[name=kommonitorUiParams].value[0]`.
 */
export interface KommonitorUiParams {
  apiName: string;
  longTitle?: string;
  /** The legend text, with `${…}` placeholders; see `legend-template.util`. */
  dynamicLegend?: string;
  /** The LaTeX formula above the legend; carries bare `*_baseIndicators` tokens. */
  dynamicFormula?: string;
  /** A fixed LaTeX formula, used by processes whose formula does not vary with the inputs. */
  formula?: string;
  /** Drives the generated input form; absent on processes without extra inputs. */
  inputBoxes?: KommonitorInputBox[];
  [key: string]: unknown;
}

/**
 * One fieldset of the generated form.
 *
 * `id` picks the widget, `contents` names the inputs that belong in the box.
 * The two are usually the same but not always: the box `comp_meth` holds the
 * input `compMeth`, and `georesource_id_line` names a content key that the
 * process does not declare at all — see `inputKeyForBoxContent`.
 */
export interface KommonitorInputBox {
  id: string;
  title?: string;
  description?: string;
  contents?: string[];
}

/** One option of an enum-typed input. The `apiName` is what gets submitted. */
export interface ProcessInputEnumOption {
  apiName: string;
  displayName: string;
}

/** The `schema` of a single entry under a process description's `inputs`. */
export interface ProcessInputSchema {
  type?: string;
  required?: string[];
  enum?: ProcessInputEnumOption[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  items?: { type?: string };
  properties?: Record<string, unknown>;
}

/** One declared input of a process description. */
export interface ProcessInput {
  title?: string;
  description?: string;
  schema?: ProcessInputSchema;
}
