import {
  CronSelection,
  DEFAULT_CRON_SELECTION,
  buildCron,
  isValidCronPattern,
} from './cron-builder.util';
import { describeCron, nextExecution } from './cron-format.util';

describe('cron-builder util', () => {
  const sel = (overrides: Partial<CronSelection>): CronSelection => ({
    ...DEFAULT_CRON_SELECTION,
    ...overrides,
  });

  describe('once', () => {
    it('pins only the fields the unit determines', () => {
      expect(
        buildCron(sel({ mode: 'once', unit: 'month', minute: 30, hour: 2, dayOfMonth: 5 }))
      ).toBe('30 2 5 * *');
    });

    it('leaves everything open for the minute unit', () => {
      expect(buildCron(sel({ mode: 'once', unit: 'minute' }))).toBe('* * * * *');
    });

    it('adds the month for a yearly time', () => {
      expect(
        buildCron(sel({ mode: 'once', unit: 'year', minute: 0, hour: 3, dayOfMonth: 1, month: 4 }))
      ).toBe('0 3 1 4 *');
    });

    it('uses the weekday for a weekly time', () => {
      expect(
        buildCron(sel({ mode: 'once', unit: 'week', minute: 15, hour: 8, dayOfWeek: 3 }))
      ).toBe('15 8 * * 3');
    });
  });

  describe('interval', () => {
    it('builds every n minutes', () => {
      expect(buildCron(sel({ mode: 'interval', unit: 'minute', intervalValue: 15 }))).toBe(
        '*/15 * * * *'
      );
    });

    it('builds every n hours at a fixed minute', () => {
      expect(buildCron(sel({ mode: 'interval', unit: 'hour', intervalValue: 6, minute: 10 }))).toBe(
        '10 */6 * * *'
      );
    });

    it('builds every n months', () => {
      expect(
        buildCron(sel({ mode: 'interval', unit: 'month', intervalValue: 3, dayOfMonth: 1 }))
      ).toBe('0 0 1 */3 *');
    });

    it('falls back to 1 for a nonsensical interval', () => {
      expect(buildCron(sel({ mode: 'interval', unit: 'minute', intervalValue: 0 }))).toBe(
        '*/1 * * * *'
      );
    });
  });

  describe('everyFirst', () => {
    it('honours the chosen weekday, unlike master', () => {
      // Master emits `*/7` here, which is Sunday whatever the user picked.
      expect(
        buildCron(
          sel({ mode: 'everyFirst', everyFirstIn: 'month', dayOfWeek: 2, minute: 0, hour: 5 })
        )
      ).toBe('0 5 1-7 * 2');
    });

    it('narrows to one month for the yearly variant', () => {
      expect(
        buildCron(
          sel({
            mode: 'everyFirst',
            everyFirstIn: 'year',
            month: 1,
            dayOfWeek: 1,
            minute: 0,
            hour: 5,
          })
        )
      ).toBe('0 5 1-7 1 1');
    });
  });

  describe('the patterns it produces', () => {
    const cases: CronSelection[] = [
      sel({ mode: 'once', unit: 'month' }),
      sel({ mode: 'once', unit: 'week' }),
      sel({ mode: 'interval', unit: 'minute', intervalValue: 5 }),
      sel({ mode: 'interval', unit: 'month', intervalValue: 3 }),
      sel({ mode: 'everyFirst', everyFirstIn: 'month', dayOfWeek: 2 }),
      sel({ mode: 'everyFirst', everyFirstIn: 'year', dayOfWeek: 2 }),
    ];

    it('are all parseable by the libraries that display them', () => {
      for (const selection of cases) {
        const pattern = buildCron(selection);
        expect(isValidCronPattern(pattern)).toBe(true);
        expect(describeCron(pattern)).not.toBe(pattern);
        expect(nextExecution(pattern)).toBeInstanceOf(Date);
      }
    });
  });

  describe('manual patterns', () => {
    it('accepts five fields', () => {
      expect(isValidCronPattern('0 0 1 * *')).toBe(true);
      expect(isValidCronPattern('  */5 * * * *  ')).toBe(true);
    });

    it('rejects anything that is not five fields', () => {
      expect(isValidCronPattern('0 0 1 *')).toBe(false);
      expect(isValidCronPattern('0 0 1 * * *')).toBe(false);
      expect(isValidCronPattern('')).toBe(false);
    });
  });
});
