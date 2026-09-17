import { ProcessScheduleInputs } from 'components/ngComponents/models/schedules.models';

/**
 * Turning the dialog's field values into the `inputs` object that
 * `POST processes/{id}/schedule` expects.
 *
 * Two rules cannot be read off the process description and were derived from
 * the schedules the server actually stores (see
 * `documentation/PROCESSES_API_ETAPPE0_BEFUNDE.md`):
 *
 * 1. **Only some inputs are wrapped in `{ value: … }`.** It is not "every
 *    object-typed input": `compMeth` is declared `type: object` yet is stored
 *    plain. The wrapped set is fixed and listed below.
 * 2. **Enum inputs are submitted as the bare `apiName` string**, not as the
 *    `{ apiName, displayName }` object the schema's `enum` lists. The object is
 *    for the dropdown; the string goes over the wire.
 */

/** The inputs the API stores wrapped in `{ value: … }`. */
const WRAPPED_INPUTS = new Set(['target_time', 'execution_interval', 'comp_filter']);

/**
 * Content keys that do not match the process' own input key.
 *
 * `georesource_id_line` appears as a box content on
 * `KmGeoresourceLengthLineSegmentsWithinPolygon`, but that process declares
 * `georesource_id` — the line variant only changes which georesources are
 * offered, not where the value is stored.
 */
const INPUT_KEY_BY_BOX_CONTENT: Record<string, string> = {
  georesource_id_line: 'georesource_id',
};

/** The input a box content writes to. */
export function inputKeyForBoxContent(contentKey: string): string {
  return INPUT_KEY_BY_BOX_CONTENT[contentKey] ?? contentKey;
}

export function isWrappedInput(inputKey: string): boolean {
  return WRAPPED_INPUTS.has(inputKey);
}

/** Wraps a value if its input expects the `{ value: … }` envelope. */
export function wrapInputValue(inputKey: string, value: unknown): unknown {
  return isWrappedInput(inputKey) ? { value } : value;
}

export interface TargetTimeSelection {
  mode: 'ALL' | 'MISSING' | 'DATES';
  includeDates: string[];
  excludeDates: string[];
}

export interface ScheduleInputDraft {
  targetIndicatorId: string;
  targetSpatialUnitIds: string[];
  targetTime: TargetTimeSelection;
  cron: string;
  /** Process-specific values, keyed by input name, already unwrapped. */
  processInputs: Record<string, unknown>;
}

/**
 * Builds the `inputs` object for a new schedule. Empty process inputs are
 * dropped rather than submitted as `null` — the API validates on presence, and
 * an explicitly empty value fails where an absent one falls back to its default.
 */
export function buildScheduleInputs(draft: ScheduleInputDraft): ProcessScheduleInputs {
  const inputs: Record<string, unknown> = {
    target_indicator_id: draft.targetIndicatorId,
    target_spatial_units: [...draft.targetSpatialUnitIds],
    target_time: {
      value: {
        mode: draft.targetTime.mode,
        includeDates: [...draft.targetTime.includeDates],
        excludeDates: [...draft.targetTime.excludeDates],
      },
    },
    execution_interval: { value: { cron: draft.cron } },
  };

  for (const [key, value] of Object.entries(draft.processInputs)) {
    if (isEmpty(value)) {
      continue;
    }
    inputs[key] = wrapInputValue(key, value);
  }

  return inputs as unknown as ProcessScheduleInputs;
}

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') {
    return true;
  }
  return Array.isArray(value) && value.length === 0;
}

/**
 * One entry of `computation_ids_with_polarity`. The list is the only input
 * whose *entries* carry the `{ value: … }` envelope rather than the input
 * itself.
 */
export function buildPolarityEntry(indicatorId: string, polarity: string): unknown {
  return { value: { ID: indicatorId, POLARITY: polarity } };
}
