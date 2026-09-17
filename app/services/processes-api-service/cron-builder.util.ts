/**
 * Assembling a cron pattern from the dialog's three input modes.
 *
 * Mirrors master's `updateCron` with two deliberate differences, both noted at
 * the rule they affect.
 */

export type CronInputMode = 'once' | 'interval' | 'everyFirst';

/**
 * Units offered for a fixed time. `week` and `year` are valid here but not for
 * `interval` — cron has no "every n weeks" or "every n years" (master drops the
 * year unit in commit `a12deed8`).
 */
export type CronUnit = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export const INTERVAL_UNITS: CronUnit[] = ['minute', 'hour', 'day', 'month'];

export interface CronSelection {
  mode: CronInputMode;
  unit: CronUnit;
  /** For `interval`: the n in "every n units". */
  intervalValue: number;
  minute: number;
  hour: number;
  /** 1–31, used from unit `month` upwards. */
  dayOfMonth: number;
  /** 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number;
  /** 1–12. */
  month: number;
  /** For `everyFirst`: the first matching weekday of the month or of the year. */
  everyFirstIn: 'month' | 'year';
}

export const DEFAULT_CRON_SELECTION: CronSelection = {
  mode: 'once',
  unit: 'month',
  intervalValue: 1,
  minute: 0,
  hour: 0,
  dayOfMonth: 1,
  dayOfWeek: 1,
  month: 1,
  everyFirstIn: 'month',
};

/** Five space-separated fields; each may hold `*`, numbers, lists, ranges, steps. */
const CRON_PATTERN = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/;

export function isValidCronPattern(pattern: string): boolean {
  return CRON_PATTERN.test(pattern ?? '');
}

export function buildCron(selection: CronSelection): string {
  const { mode, unit } = selection;

  // Only the fields the chosen unit actually pins down get a value; everything
  // coarser stays `*`.
  const minute = ['hour', 'day', 'week', 'month', 'year'].includes(unit)
    ? String(selection.minute)
    : '*';
  const hour = ['day', 'week', 'month', 'year'].includes(unit) ? String(selection.hour) : '*';
  const dayOfMonth = ['month', 'year'].includes(unit) ? String(selection.dayOfMonth) : '*';
  const month = unit === 'year' ? String(selection.month) : '*';
  const dayOfWeek = unit === 'week' ? String(selection.dayOfWeek) : '*';

  if (mode === 'once') {
    return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }

  if (mode === 'interval') {
    const n = Math.max(1, Math.trunc(selection.intervalValue) || 1);
    switch (unit) {
      case 'minute':
        return `*/${n} * * * *`;
      case 'hour':
        return `${selection.minute} */${n} * * *`;
      case 'day':
        return `${selection.minute} ${selection.hour} */${n} * *`;
      default:
        // month, and anything the UI should not offer here
        return `${selection.minute} ${selection.hour} ${selection.dayOfMonth} */${n} *`;
    }
  }

  // everyFirst: days 1-7 narrow the month to its first week, the weekday field
  // picks the day within it.
  //
  // Master hardcodes `*/7` in the weekday field, which resolves to Sunday no
  // matter which weekday the user picked — the picker has no effect there. The
  // chosen weekday is used here instead.
  const dayRange = '1-7';
  const monthField = selection.everyFirstIn === 'year' ? String(selection.month) : '*';
  return `${selection.minute} ${selection.hour} ${dayRange} ${monthField} ${selection.dayOfWeek}`;
}
