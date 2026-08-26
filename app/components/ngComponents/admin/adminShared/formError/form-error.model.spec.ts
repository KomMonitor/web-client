import { FORM_ERROR_I18N_PREFIX, resolveFormError } from './form-error.model';

/** Pure mapping tests, no TestBed. */
describe('resolveFormError', () => {
  it('returns null without errors', () => {
    expect(resolveFormError(null)).toBeNull();
    expect(resolveFormError(undefined)).toBeNull();
    expect(resolveFormError({})).toBeNull();
  });

  it('maps a boolean error to its i18n key without params', () => {
    expect(resolveFormError({ required: true })).toEqual({
      key: `${FORM_ERROR_I18N_PREFIX}REQUIRED`,
      params: {},
    });
  });

  it('spreads an object error value into the params', () => {
    expect(resolveFormError({ minlength: { requiredLength: 5, actualLength: 2 } })).toEqual({
      key: `${FORM_ERROR_I18N_PREFIX}MIN_LENGTH`,
      params: { requiredLength: 5, actualLength: 2 },
    });
  });

  it('wraps a scalar error value as { value }', () => {
    expect(resolveFormError({ minDate: '2026-01-01' })).toEqual({
      key: `${FORM_ERROR_I18N_PREFIX}MIN_DATE`,
      params: { value: '2026-01-01' },
    });
  });

  it('prefers the most actionable error when several are present', () => {
    const resolved = resolveFormError({ uniqueName: { name: 'x' }, required: true });

    expect(resolved!.key).toBe(`${FORM_ERROR_I18N_PREFIX}REQUIRED`);
  });

  it('maps the shared admin validators', () => {
    expect(resolveFormError({ uniqueName: { name: 'Stadtteile' } })).toEqual({
      key: `${FORM_ERROR_I18N_PREFIX}UNIQUE_NAME`,
      params: { name: 'Stadtteile' },
    });
    expect(resolveFormError({ periodOfValidity: true })!.key).toBe(
      `${FORM_ERROR_I18N_PREFIX}PERIOD_OF_VALIDITY`
    );
    expect(resolveFormError({ spatialUnitHierarchy: true })!.key).toBe(
      `${FORM_ERROR_I18N_PREFIX}SPATIAL_UNIT_HIERARCHY`
    );
    expect(resolveFormError({ bboxIncomplete: true })!.key).toBe(
      `${FORM_ERROR_I18N_PREFIX}BBOX_INCOMPLETE`
    );
  });

  it('falls back to a generic message for an unmapped validator', () => {
    expect(resolveFormError({ someCustomRule: true })).toEqual({
      key: `${FORM_ERROR_I18N_PREFIX}UNKNOWN`,
      params: { code: 'someCustomRule' },
    });
  });

  it('never returns a raw validator key as the message', () => {
    const resolved = resolveFormError({ whatever: { detail: 1 } });

    expect(resolved!.key.startsWith(FORM_ERROR_I18N_PREFIX)).toBe(true);
  });
});
