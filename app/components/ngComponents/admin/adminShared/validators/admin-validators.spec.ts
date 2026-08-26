import { FormControl, FormGroup } from '@angular/forms';
import {
  bboxCompleteValidator,
  isSpatialUnitHierarchyValid,
  periodOfValidityValidator,
  spatialUnitHierarchyValidator,
  uniqueNameValidator,
} from './admin-validators';

/**
 * Pure validator tests, no TestBed — same shape as
 * `resourceMetadataForm/resource-metadata-form.model.spec.ts`.
 *
 * The cases mirror the hand-written `check…()` tests in
 * `spatialUnitAddModal/spatial-unit-add-modal.component.spec.ts` so the
 * behaviour these validators replace stays pinned.
 */

const SPATIAL_UNITS = [
  { spatialUnitLevel: 'Stadt' }, // index 0 — coarsest
  { spatialUnitLevel: 'Stadtteile' },
  { spatialUnitLevel: 'Baublöcke' }, // index 2 — finest
];

describe('uniqueNameValidator', () => {
  const names = () => ['Stadtteile', 'Baublöcke'];

  it('flags a name that already exists', () => {
    const control = new FormControl('Stadtteile', uniqueNameValidator(names));

    expect(control.hasError('uniqueName')).toBe(true);
    expect(control.errors!['uniqueName']).toEqual({ name: 'Stadtteile' });
  });

  it('accepts a new name', () => {
    const control = new FormControl('Quartiere', uniqueNameValidator(names));

    expect(control.valid).toBe(true);
  });

  it('accepts an empty name (Validators.required reports that separately)', () => {
    const control = new FormControl('', uniqueNameValidator(names));

    expect(control.hasError('uniqueName')).toBe(false);
  });

  it('clears a previous verdict on re-validation', () => {
    const control = new FormControl('Stadtteile', uniqueNameValidator(names));
    expect(control.hasError('uniqueName')).toBe(true);

    control.setValue('Quartiere');

    expect(control.hasError('uniqueName')).toBe(false);
  });

  it('compares trimmed and case-insensitively by default', () => {
    const control = new FormControl('  stadtteile ', uniqueNameValidator(names));

    expect(control.hasError('uniqueName')).toBe(true);
  });

  it('compares verbatim when caseSensitive is set', () => {
    const control = new FormControl(
      'stadtteile',
      uniqueNameValidator(names, {
        caseSensitive: true,
      })
    );

    expect(control.hasError('uniqueName')).toBe(false);
  });

  it('accepts the ignored name so edit modals can keep their own', () => {
    const control = new FormControl(
      'Stadtteile',
      uniqueNameValidator(names, { ignore: () => 'Stadtteile' })
    );

    expect(control.hasError('uniqueName')).toBe(false);
  });

  it('re-reads the name list on every validation run', () => {
    let known: string[] = [];
    const control = new FormControl(
      'Quartiere',
      uniqueNameValidator(() => known)
    );
    expect(control.hasError('uniqueName')).toBe(false);

    known = ['Quartiere'];
    control.updateValueAndValidity();

    expect(control.hasError('uniqueName')).toBe(true);
  });
});

describe('periodOfValidityValidator', () => {
  const buildGroup = (startDate: any, endDate: any) =>
    new FormGroup(
      {
        startDate: new FormControl(startDate),
        endDate: new FormControl(endDate),
      },
      { validators: periodOfValidityValidator() }
    );

  it('accepts a start before the end', () => {
    expect(buildGroup('2026-01-01', '2026-12-31').valid).toBe(true);
  });

  it('rejects an end that is not after the start', () => {
    const group = buildGroup('2026-12-31', '2026-01-01');

    expect(group.hasError('periodOfValidity')).toBe(true);
  });

  it('rejects an identical start and end', () => {
    const group = buildGroup('2026-01-01', '2026-01-01');

    expect(group.hasError('periodOfValidity')).toBe(true);
  });

  it('accepts an open-ended period', () => {
    expect(buildGroup('2026-01-01', '').valid).toBe(true);
  });

  it('accepts NgbDateStruct values from the datepicker', () => {
    const group = buildGroup({ year: 2026, month: 1, day: 1 }, { year: 2026, month: 12, day: 31 });

    expect(group.valid).toBe(true);
  });

  it('accepts unparseable input (the date picker guards the format)', () => {
    expect(buildGroup('31.12.2026', 'gestern').valid).toBe(true);
  });
});

describe('isSpatialUnitHierarchyValid', () => {
  it('accepts a lower level that is finer than the upper one', () => {
    expect(isSpatialUnitHierarchyValid(SPATIAL_UNITS, 'Baublöcke', 'Stadt')).toBe(true);
  });

  it('rejects a lower level that is coarser than the upper one', () => {
    expect(isSpatialUnitHierarchyValid(SPATIAL_UNITS, 'Stadt', 'Baublöcke')).toBe(false);
  });

  it('rejects the same level on both ends', () => {
    expect(isSpatialUnitHierarchyValid(SPATIAL_UNITS, 'Stadtteile', 'Stadtteile')).toBe(false);
  });

  it('stays valid while only one end is selected', () => {
    expect(isSpatialUnitHierarchyValid(SPATIAL_UNITS, 'Stadt', null)).toBe(true);
  });

  it('stays valid when a selected level is unknown to the store', () => {
    // Guards the historic `undefined <= undefined` semantics: a findIndex
    // rewrite without the -1 check would evaluate `-1 <= -1` and reject.
    expect(isSpatialUnitHierarchyValid(SPATIAL_UNITS, 'Fremd', 'Auch fremd')).toBe(true);
  });

  it('stays valid when only one selected level is unknown', () => {
    expect(isSpatialUnitHierarchyValid(SPATIAL_UNITS, 'Fremd', 'Stadt')).toBe(true);
  });
});

describe('spatialUnitHierarchyValidator', () => {
  const buildGroup = (lower: any, upper: any) =>
    new FormGroup(
      {
        nextLowerHierarchySpatialUnit: new FormControl(lower),
        nextUpperHierarchySpatialUnit: new FormControl(upper),
      },
      { validators: spatialUnitHierarchyValidator(() => SPATIAL_UNITS) }
    );

  it('reads the levels off the selected dataset objects', () => {
    expect(buildGroup(SPATIAL_UNITS[2], SPATIAL_UNITS[0]).valid).toBe(true);
  });

  it('reports spatialUnitHierarchy on the group', () => {
    const group = buildGroup(SPATIAL_UNITS[0], SPATIAL_UNITS[2]);

    expect(group.hasError('spatialUnitHierarchy')).toBe(true);
  });

  it('stays valid while nothing is selected', () => {
    expect(buildGroup(null, null).valid).toBe(true);
  });
});

describe('bboxCompleteValidator', () => {
  const buildGroup = (minx: any, miny: any, maxx: any, maxy: any) =>
    new FormGroup(
      {
        minx: new FormControl(minx),
        miny: new FormControl(miny),
        maxx: new FormControl(maxx),
        maxy: new FormControl(maxy),
      },
      { validators: bboxCompleteValidator() }
    );

  it('accepts an entirely empty bounding box', () => {
    expect(buildGroup(null, null, null, null).valid).toBe(true);
  });

  it('accepts all four corners', () => {
    expect(buildGroup(1, 2, 3, 4).valid).toBe(true);
  });

  it('accepts a zero corner (0 is a valid coordinate)', () => {
    expect(buildGroup(0, 0, 0, 0).valid).toBe(true);
  });

  it('rejects a partially filled bounding box', () => {
    const group = buildGroup(1, 2, null, '');

    expect(group.hasError('bboxIncomplete')).toBe(true);
  });
});
