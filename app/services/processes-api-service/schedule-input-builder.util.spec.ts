import {
  buildPolarityEntry,
  buildScheduleInputs,
  inputKeyForBoxContent,
  isWrappedInput,
  wrapInputValue,
} from './schedule-input-builder.util';

describe('schedule-input-builder util', () => {
  const draft = (processInputs: Record<string, unknown> = {}) => ({
    targetIndicatorId: 'ind-target',
    targetSpatialUnitIds: ['su-1'],
    targetTime: { mode: 'MISSING' as const, includeDates: [], excludeDates: [] },
    cron: '0 0 1 * *',
    processInputs,
  });

  it('always submits the four common inputs', () => {
    const inputs = buildScheduleInputs(draft()) as any;

    expect(inputs.target_indicator_id).toBe('ind-target');
    expect(inputs.target_spatial_units).toEqual(['su-1']);
    expect(inputs.target_time).toEqual({
      value: { mode: 'MISSING', includeDates: [], excludeDates: [] },
    });
    expect(inputs.execution_interval).toEqual({ value: { cron: '0 0 1 * *' } });
  });

  it('wraps only the inputs the API stores wrapped', () => {
    expect(isWrappedInput('target_time')).toBe(true);
    expect(isWrappedInput('execution_interval')).toBe(true);
    expect(isWrappedInput('comp_filter')).toBe(true);
    // Declared as type: object, yet stored plain.
    expect(isWrappedInput('compMeth')).toBe(false);
    expect(isWrappedInput('computation_ids')).toBe(false);
  });

  it('submits an enum value as the bare apiName', () => {
    const inputs = buildScheduleInputs(draft({ aggregation_method: 'MEAN' })) as any;
    expect(inputs.aggregation_method).toBe('MEAN');
  });

  it('wraps comp_filter but not the id lists', () => {
    const inputs = buildScheduleInputs(
      draft({
        comp_filter: { compFilterProp: 'a', compFilterOperator: '=', compFilterPropVal: '1' },
        computation_ids: ['ind-1', 'ind-2'],
      })
    ) as any;

    expect(inputs.comp_filter).toEqual({
      value: { compFilterProp: 'a', compFilterOperator: '=', compFilterPropVal: '1' },
    });
    expect(inputs.computation_ids).toEqual(['ind-1', 'ind-2']);
  });

  it('drops empty process inputs instead of submitting null', () => {
    const inputs = buildScheduleInputs(
      draft({ computation_id: '', computation_ids: [], num_value: undefined })
    ) as any;

    expect('computation_id' in inputs).toBe(false);
    expect('computation_ids' in inputs).toBe(false);
    expect('num_value' in inputs).toBe(false);
  });

  it('keeps a zero, which is a real value and not emptiness', () => {
    const inputs = buildScheduleInputs(draft({ num_value: 0 })) as any;
    expect(inputs.num_value).toBe(0);
  });

  it('maps the line georesource box onto the input the process declares', () => {
    expect(inputKeyForBoxContent('georesource_id_line')).toBe('georesource_id');
    expect(inputKeyForBoxContent('computation_ids')).toBe('computation_ids');
  });

  it('wraps polarity entries individually, not the list', () => {
    const entry = buildPolarityEntry('ind-1', 'INVERT');
    expect(entry).toEqual({ value: { ID: 'ind-1', POLARITY: 'INVERT' } });

    const inputs = buildScheduleInputs(draft({ computation_ids_with_polarity: [entry] })) as any;
    expect(Array.isArray(inputs.computation_ids_with_polarity)).toBe(true);
    expect(inputs.computation_ids_with_polarity[0]).toEqual(entry);
  });

  it('wrapInputValue leaves plain inputs alone', () => {
    expect(wrapInputValue('computation_id', 'x')).toBe('x');
    expect(wrapInputValue('target_time', { mode: 'ALL' })).toEqual({ value: { mode: 'ALL' } });
  });
});
