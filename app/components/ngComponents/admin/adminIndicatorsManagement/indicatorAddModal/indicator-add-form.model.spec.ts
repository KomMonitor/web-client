import { FormControl, FormGroup } from '@angular/forms';

import { IndicatorNameRef, indicatorNameUniqueValidator } from './indicator-add-form.model';

/**
 * The indicator name is unique *per indicator type*, which is why this rule
 * exists next to the shared `uniqueNameValidator` instead of reusing it.
 *
 * It was dead code until 2026-08-31: the comparison read `datasetName` off the
 * store objects, which carry the name under `indicatorName` — so every check
 * compared `undefined` and no duplicate was ever flagged, not even an exactly
 * identical one. Nothing covered the rule, and the `IndicatorNameRef` interface
 * prescribed the wrong field, so the compiler agreed with the mistake.
 */
describe('indicatorNameUniqueValidator', () => {
  const EXISTING: IndicatorNameRef[] = [
    { indicatorName: 'A1 - SGB II-Bezug', indicatorType: 'STATUS_ABSOLUTE' },
    { indicatorName: 'Bevölkerungsdichte', indicatorType: 'DYNAMIC_ABSOLUTE' },
  ];

  /** The rule reads the sibling `indicatorType` control, so it needs a parent. */
  const validate = (
    name: string,
    typeApiName: string | null,
    currentDatasetName?: () => string | null
  ) => {
    const group = new FormGroup({
      datasetName: new FormControl(name, {
        nonNullable: true,
        validators: [indicatorNameUniqueValidator(() => EXISTING, currentDatasetName)],
      }),
      indicatorType: new FormControl<{ apiName: string } | null>(
        typeApiName ? { apiName: typeApiName } : null
      ),
    });
    // The control is validated once on construction, before it has a parent —
    // and the rule reads the sibling type through that parent. The wizard does
    // the same thing through `checkDatasetName()`.
    group.controls.datasetName.updateValueAndValidity();
    return group.controls.datasetName.errors;
  };

  it('rejects an existing name of the same type', () => {
    expect(validate('A1 - SGB II-Bezug', 'STATUS_ABSOLUTE')).toEqual({
      uniqueName: { name: 'A1 - SGB II-Bezug' },
    });
  });

  it('rejects a name differing only in case', () => {
    expect(validate('a1 - sgb ii-bezug', 'STATUS_ABSOLUTE')).toEqual({
      uniqueName: { name: 'a1 - sgb ii-bezug' },
    });
  });

  it('rejects a name differing only in surrounding blanks', () => {
    expect(validate('  A1 - SGB II-Bezug  ', 'STATUS_ABSOLUTE')).toEqual({
      uniqueName: { name: '  A1 - SGB II-Bezug  ' },
    });
  });

  it('accepts the same name under a different indicator type', () => {
    expect(validate('A1 - SGB II-Bezug', 'DYNAMIC_ABSOLUTE')).toBeNull();
  });

  it('accepts a new name', () => {
    expect(validate('Ein ganz neuer Indikator', 'STATUS_ABSOLUTE')).toBeNull();
  });

  it('stays quiet while no indicator type is chosen', () => {
    expect(validate('A1 - SGB II-Bezug', null)).toBeNull();
  });

  it('stays quiet for an empty name', () => {
    expect(validate('   ', 'STATUS_ABSOLUTE')).toBeNull();
  });

  it('lets the edited indicator keep its own name', () => {
    expect(validate('A1 - SGB II-Bezug', 'STATUS_ABSOLUTE', () => 'A1 - SGB II-Bezug')).toBeNull();
  });

  it('lets the edited indicator keep its own name across case and blanks', () => {
    expect(
      validate('  a1 - sgb ii-bezug ', 'STATUS_ABSOLUTE', () => 'A1 - SGB II-Bezug')
    ).toBeNull();
  });
});
