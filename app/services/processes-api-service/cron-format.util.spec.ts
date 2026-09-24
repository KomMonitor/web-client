import { describeCron, nextExecution } from './cron-format.util';

describe('cron-format util', () => {
  it('describes a cron pattern in German', () => {
    expect(describeCron('0 0 1 */3 *')).toBe('Um 00:00, an Tag 1 des Monats, alle 3 Monate');
  });

  it('honours the requested locale', () => {
    expect(describeCron('0 0 1 * *', 'en')).toContain('12:00 AM');
  });

  it('shows an unparseable pattern verbatim instead of breaking the cell', () => {
    expect(describeCron('not a cron')).toBe('not a cron');
  });

  it('returns nothing for a missing pattern', () => {
    expect(describeCron(undefined)).toBe('');
    expect(nextExecution(undefined)).toBeUndefined();
  });

  it('computes the next occurrence', () => {
    const next = nextExecution('0 0 1 * *');
    expect(next).toBeInstanceOf(Date);
    expect(next!.getTime()).toBeGreaterThan(Date.now());
    expect(next!.getDate()).toBe(1);
  });

  it('returns undefined rather than throwing on a broken pattern', () => {
    expect(nextExecution('not a cron')).toBeUndefined();
  });
});
