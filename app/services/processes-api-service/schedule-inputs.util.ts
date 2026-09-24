import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';

/**
 * Reading dataset references out of `schedule.inputs`.
 *
 * Which inputs a schedule carries depends on its process, so the referenced
 * indicators are spread over several input names. The lists below cover every
 * input the 19 UI processes of the demo instance declare; inputs that are not
 * dataset references (`compMeth`, `num_value`, `reference_date`, …) are
 * deliberately absent.
 */

/** Inputs holding a single indicator id. */
const SINGLE_INDICATOR_INPUTS = [
  'computation_id',
  'computation_id_numerator',
  'computation_id_denominator',
  // "Referenzindikator" — master's dependency check misses this one.
  'reference_id',
];

/** Inputs holding a list of indicator ids. */
const INDICATOR_LIST_INPUTS = ['computation_ids', 'computation_ids_with_polarity'];

/** Inputs holding a single georesource id. */
const SINGLE_GEORESOURCE_INPUTS = ['georesource_id'];

/**
 * Ids of the indicators a schedule reads as input. The target indicator is not
 * included — use `schedule.inputs.target_indicator_id` for that.
 */
export function getRequiredIndicatorIds(schedule: ProcessSchedule): string[] {
  const ids: string[] = [];

  for (const inputName of SINGLE_INDICATOR_INPUTS) {
    const id = readId(schedule.inputs?.[inputName]);
    if (id) {
      ids.push(id);
    }
  }

  for (const inputName of INDICATOR_LIST_INPUTS) {
    const value = schedule.inputs?.[inputName];
    if (Array.isArray(value)) {
      for (const entry of value) {
        const id = readId(entry);
        if (id) {
          ids.push(id);
        }
      }
    }
  }

  return Array.from(new Set(ids));
}

/** Ids of the georesources a schedule reads as input. */
export function getRequiredGeoresourceIds(schedule: ProcessSchedule): string[] {
  const ids = SINGLE_GEORESOURCE_INPUTS.map((inputName) =>
    readId(schedule.inputs?.[inputName])
  ).filter((id): id is string => !!id);
  return Array.from(new Set(ids));
}

/** The indicator a schedule writes its result to. */
export function getTargetIndicatorId(schedule: ProcessSchedule): string | undefined {
  return readId(schedule.inputs?.target_indicator_id);
}

/**
 * Ids appear either plainly or wrapped. `computation_ids_with_polarity` for
 * instance holds `{ value: { ID, POLARITY } }` entries — master reads `.ID` off
 * the wrapper and comes up empty.
 */
function readId(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value || undefined;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const unwrapped = 'value' in record ? record['value'] : record;
    if (typeof unwrapped === 'string') {
      return unwrapped || undefined;
    }
    if (unwrapped && typeof unwrapped === 'object') {
      const id = (unwrapped as Record<string, unknown>)['ID'];
      return typeof id === 'string' ? id : undefined;
    }
  }
  return undefined;
}
