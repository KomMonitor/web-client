import {
  getRequiredGeoresourceIds,
  getRequiredIndicatorIds,
  getTargetIndicatorId,
} from './schedule-inputs.util';

describe('schedule-inputs util', () => {
  const scheduleWith = (inputs: Record<string, unknown>) => ({ inputs }) as any;

  it('reads plain single-indicator inputs', () => {
    const schedule = scheduleWith({
      computation_id_numerator: 'ind-1',
      computation_id_denominator: 'ind-2',
    });
    expect(getRequiredIndicatorIds(schedule)).toEqual(['ind-1', 'ind-2']);
  });

  it("reads the reference indicator that master's dependency check misses", () => {
    expect(getRequiredIndicatorIds(scheduleWith({ reference_id: 'ind-ref' }))).toEqual(['ind-ref']);
  });

  it('reads plain id lists', () => {
    const schedule = scheduleWith({ computation_ids: ['ind-1', 'ind-2'] });
    expect(getRequiredIndicatorIds(schedule)).toEqual(['ind-1', 'ind-2']);
  });

  it('unwraps the {value:{ID}} form of computation_ids_with_polarity', () => {
    const schedule = scheduleWith({
      computation_ids_with_polarity: [
        { value: { ID: 'ind-1', POLARITY: 'NORMAL' } },
        { value: { ID: 'ind-2', POLARITY: 'INVERSE' } },
      ],
    });
    expect(getRequiredIndicatorIds(schedule)).toEqual(['ind-1', 'ind-2']);
  });

  it('also accepts the unwrapped {ID} form', () => {
    const schedule = scheduleWith({ computation_ids_with_polarity: [{ ID: 'ind-1' }] });
    expect(getRequiredIndicatorIds(schedule)).toEqual(['ind-1']);
  });

  it('deduplicates repeated references', () => {
    const schedule = scheduleWith({
      computation_ids: ['ind-1', 'ind-1'],
      computation_id: 'ind-1',
    });
    expect(getRequiredIndicatorIds(schedule)).toEqual(['ind-1']);
  });

  it('ignores inputs that are not dataset references', () => {
    const schedule = scheduleWith({
      compMeth: 'MIN',
      num_value: 3,
      reference_date: '2026-01-01',
      target_time: { value: { mode: 'MISSING', includeDates: [], excludeDates: [] } },
    });
    expect(getRequiredIndicatorIds(schedule)).toEqual([]);
    expect(getRequiredGeoresourceIds(schedule)).toEqual([]);
  });

  it('never reports the target indicator as a required input', () => {
    const schedule = scheduleWith({ target_indicator_id: 'ind-target' });
    expect(getRequiredIndicatorIds(schedule)).toEqual([]);
    expect(getTargetIndicatorId(schedule)).toBe('ind-target');
  });

  it('reads georesource references', () => {
    expect(getRequiredGeoresourceIds(scheduleWith({ georesource_id: 'geo-1' }))).toEqual(['geo-1']);
  });

  it('tolerates missing inputs', () => {
    expect(getRequiredIndicatorIds({} as any)).toEqual([]);
    expect(getRequiredGeoresourceIds({} as any)).toEqual([]);
    expect(getTargetIndicatorId({} as any)).toBeUndefined();
  });
});
