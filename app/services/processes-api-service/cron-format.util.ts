import { CronExpressionParser } from 'cron-parser';
import cronstrue from 'cronstrue/i18n';

/**
 * Human-readable rendering of a schedule's cron pattern.
 *
 * Master pairs `cronstrue` with `later` for the next occurrence. `later` has
 * been unmaintained for years, so the next date comes from `cron-parser` here;
 * `cronstrue` is kept, it is what produces the German phrasing.
 */

/** e.g. "Um 00:00, an Tag 1 des Monats, alle 3 Monate". Empty on a broken pattern. */
export function describeCron(cron: string | undefined, locale = 'de'): string {
  if (!cron) {
    return '';
  }
  try {
    return cronstrue.toString(cron, { locale });
  } catch {
    // An unparseable pattern is data, not a bug: show it raw rather than
    // breaking the cell.
    return cron;
  }
}

/** The next occurrence in local time, or undefined if the pattern cannot be parsed. */
export function nextExecution(cron: string | undefined): Date | undefined {
  if (!cron) {
    return undefined;
  }
  try {
    return CronExpressionParser.parse(cron).next().toDate();
  } catch {
    return undefined;
  }
}
