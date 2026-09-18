import { LegendContext, renderFormula, renderLegend } from './legend-template.util';

describe('legend-template util', () => {
  const context = (inputs: Record<string, unknown>): LegendContext => ({
    inputs,
    enumLabel: (key, apiName) => (apiName === 'MEAN' ? 'Arithmetisches Mittel' : apiName),
    indicatorName: (id) => (id ? 'Indikator ' + id : ''),
    indicatorUnit: (id) => (id ? 'Einwohner' : ''),
    georesourceName: (id) => (id ? 'Georessource ' + id : ''),
  });

  it('fills a plain input placeholder', () => {
    expect(
      renderLegend(
        'alle ${number_of_temporal_items} Schritte',
        context({ number_of_temporal_items: 3 })
      )
    ).toBe('alle 3 Schritte');
  });

  it('renders an enum input with its label, not its apiName', () => {
    expect(renderLegend('${aggregation_method}', context({ aggregation_method: 'MEAN' }))).toBe(
      'Arithmetisches Mittel'
    );
  });

  it('resolves the derived indicator selections', () => {
    const rendered = renderLegend(
      '${compIndicatorSelection.indicatorName} in ${compIndicatorSelection.unit}',
      context({ computation_id: 'i1' })
    );
    expect(rendered).toBe('Indikator i1 in Einwohner');
  });

  it('resolves the reference indicator separately from the base one', () => {
    expect(
      renderLegend('${refIndicatorSelection.indicatorName}', context({ reference_id: 'r1' }))
    ).toBe('Indikator r1');
  });

  it('lists the base indicators with their formula letter and unit', () => {
    expect(renderLegend('${list_baseIndicators}', context({ computation_ids: ['a', 'b'] }))).toBe(
      '$A$: Indikator a [Einwohner]<br/>$B$: Indikator b [Einwohner]'
    );
  });

  it('lists base indicators with their polarity', () => {
    const rendered = renderLegend(
      '${list_baseIndicators_withPolarity}',
      context({
        computation_ids_with_polarity: [
          { value: { ID: 'a', POLARITY: 'NORMAL' } },
          { value: { ID: 'b', POLARITY: 'INVERT' } },
        ],
      })
    );
    expect(rendered).toBe(
      '$A$: <b>Indikator a</b> <i>[Einwohner]</i> ; <b>Polarität</b>: NORMAL<br/>' +
        '$B$: <b>Indikator b</b> <i>[Einwohner]</i> ; <b>Polarität</b>: INVERT'
    );
  });

  describe('the bare georesource_filter_legend token', () => {
    it('reads as a dash when no filter is set', () => {
      expect(renderLegend('Filter: georesource_filter_legend', context({}))).toBe('Filter: -');
    });

    it('spells out a plain comparison', () => {
      const rendered = renderLegend(
        'Filter: georesource_filter_legend',
        context({
          comp_filter: {
            compFilterProp: 'art',
            compFilterOperator: 'Equal',
            compFilterPropVal: 'A',
          },
        })
      );
      expect(rendered).toBe("Filter: 'art' 'gleich (=)' 'A'");
    });

    it('spells out a range with both bounds', () => {
      const rendered = renderLegend(
        'georesource_filter_legend',
        context({
          comp_filter: {
            compFilterProp: 'flaeche',
            compFilterOperator: 'Range',
            compFilterPropVal: '10-20',
          },
        })
      );
      expect(rendered).toBe("'flaeche' im Wertebereich von '>=10 bis <20'");
    });

    it('spells out a contains filter', () => {
      const rendered = renderLegend(
        'georesource_filter_legend',
        context({
          comp_filter: {
            compFilterProp: 'name',
            compFilterOperator: 'Contains',
            compFilterPropVal: 'Schule,Kita',
          },
        })
      );
      expect(rendered).toBe("'name' 'enthält' 'Schule, Kita'");
    });
  });

  it('names the selected georesource', () => {
    expect(
      renderLegend('${georesourceSelection.datasetName}', context({ georesource_id: 'g1' }))
    ).toBe('Georessource g1');
  });

  it('leaves an unfilled placeholder visible instead of blanking it', () => {
    expect(renderLegend('${reference_date}', context({}))).toBe('${reference_date}');
    expect(renderLegend('${unknown_thing}', context({}))).toBe('${unknown_thing}');
  });

  it('keeps the LaTeX around the placeholders untouched', () => {
    expect(renderLegend('$$ A \\times ${num_value} $$', context({ num_value: 5 }))).toBe(
      '$$ A \\times 5 $$'
    );
  });

  it('returns an empty string for a process without a legend', () => {
    expect(renderLegend(undefined, context({}))).toBe('');
  });
});

describe('renderFormula', () => {
  it("expands the sum token to the base indicators' letters", () => {
    expect(renderFormula('$$ sum_baseIndicators $$', { computation_ids: ['a', 'b', 'c'] })).toBe(
      '$$ A + B + C $$'
    );
  });

  it('expands the product token', () => {
    expect(renderFormula('$$ prod_baseIndicators $$', { computation_ids: ['a', 'b'] })).toBe(
      '$$ A \\times B $$'
    );
  });

  it('reads the ids out of the polarity list when there is no plain one', () => {
    const formula = renderFormula('$$ sum_baseIndicators $$', {
      computation_ids_with_polarity: [
        { value: { ID: 'a', POLARITY: 'NORMAL' } },
        { value: { ID: 'b', POLARITY: 'INVERT' } },
      ],
    });
    expect(formula).toBe('$$ A + B $$');
  });

  it('returns nothing for a process without a formula', () => {
    expect(renderFormula(undefined, {})).toBe('');
  });
});
