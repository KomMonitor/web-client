import {
  buildSpatialUnitMetadataPatchBody,
  convertEmptyToNull,
  validatePeriodOfValidity,
  validateSpatialUnitMetadata,
} from './spatial-unit-metadata.util';

/**
 * Pure helper tests, no TestBed. Added alongside the shared admin validators,
 * which delegate their period-of-validity rule to `validatePeriodOfValidity()`
 * — this file is what pins that rule.
 */

describe('convertEmptyToNull', () => {
  it.each([
    ['', null],
    [undefined, null],
    [null, null],
  ])('maps %p to null', (input, expected) => {
    expect(convertEmptyToNull(input)).toBe(expected);
  });

  it('keeps a non-empty value', () => {
    expect(convertEmptyToNull('text')).toBe('text');
  });

  it('keeps falsy values that are not empty', () => {
    expect(convertEmptyToNull(0)).toBe(0);
    expect(convertEmptyToNull(false)).toBe(false);
  });
});

describe('validatePeriodOfValidity', () => {
  it('accepts a start before the end', () => {
    expect(validatePeriodOfValidity('2026-01-01', '2026-12-31')).toEqual({ isValid: true });
  });

  it('rejects an end before the start', () => {
    const result = validatePeriodOfValidity('2026-12-31', '2026-01-01');

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects an identical start and end', () => {
    expect(validatePeriodOfValidity('2026-01-01', '2026-01-01').isValid).toBe(false);
  });

  it('accepts an open-ended period', () => {
    expect(validatePeriodOfValidity('2026-01-01', '')).toEqual({ isValid: true });
    expect(validatePeriodOfValidity('', '2026-12-31')).toEqual({ isValid: true });
  });

  it('accepts unparseable dates instead of guessing', () => {
    expect(validatePeriodOfValidity('gestern', 'morgen')).toEqual({ isValid: true });
  });
});

describe('validateSpatialUnitMetadata', () => {
  it('requires a spatial unit level', () => {
    const result = validateSpatialUnitMetadata({}, '   ');

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('accepts a non-empty level', () => {
    expect(validateSpatialUnitMetadata({}, 'Stadtteile')).toEqual({ isValid: true, errors: [] });
  });
});

describe('buildSpatialUnitMetadataPatchBody', () => {
  const metadata = {
    note: '',
    literature: 'Literatur',
    updateInterval: { apiName: 'YEARLY', displayName: 'jährlich' },
    sridEPSG: 25832,
    datasource: 'Quelle',
    contact: 'Kontakt',
    lastUpdate: '2026-01-01',
    description: 'Beschreibung',
    databasis: '',
  };

  it('trims the dataset name and maps empty metadata fields to null', () => {
    const body = buildSpatialUnitMetadataPatchBody(
      '  Stadtteile  ',
      metadata,
      'Baublöcke',
      'Stadt',
      true,
      '#123456',
      4,
      '5,5'
    );

    expect(body.datasetName).toBe('Stadtteile');
    expect(body.metadata.note).toBeNull();
    expect(body.metadata.databasis).toBeNull();
    expect(body.metadata.updateInterval).toBe('YEARLY');
    expect(body.metadata.sridEPSG).toBe(25832);
  });

  it('falls back to the default outline style and SRID', () => {
    const body = buildSpatialUnitMetadataPatchBody(
      'Stadtteile',
      { ...metadata, sridEPSG: 0, updateInterval: null },
      null,
      null,
      false,
      '',
      0,
      null
    );

    expect(body.metadata.sridEPSG).toBe(4326);
    expect(body.metadata.updateInterval).toBeNull();
    expect(body.outlineColor).toBe('#bf3d2c');
    expect(body.outlineWidth).toBe(2);
    expect(body.outlineDashArrayString).toBeNull();
  });
});
