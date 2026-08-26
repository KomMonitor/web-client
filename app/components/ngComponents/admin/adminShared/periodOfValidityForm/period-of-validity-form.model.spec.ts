import {
  buildPeriodOfValidityForm,
  patchPeriodOfValidityForm,
  periodOfValidityFormToApi,
} from './period-of-validity-form.model';

describe('period-of-validity form model', () => {
  describe('buildPeriodOfValidityForm', () => {
    it('starts empty and valid', () => {
      const form = buildPeriodOfValidityForm();

      expect(form.getRawValue()).toEqual({ startDate: '', endDate: '' });
      expect(form.valid).toBe(true);
    });

    it('requires a start date when asked to', () => {
      const form = buildPeriodOfValidityForm({ requireStart: true });

      expect(form.controls.startDate.hasError('required')).toBe(true);
    });

    it('carries the cross-field rule on the group', () => {
      const form = buildPeriodOfValidityForm();
      form.setValue({ startDate: '2026-12-31', endDate: '2026-01-01' });

      expect(form.hasError('periodOfValidity')).toBe(true);
    });

    it('resets to empty strings rather than null', () => {
      const form = buildPeriodOfValidityForm();
      form.setValue({ startDate: '2026-01-01', endDate: '2026-12-31' });

      form.reset();

      expect(form.getRawValue()).toEqual({ startDate: '', endDate: '' });
    });
  });

  describe('patchPeriodOfValidityForm', () => {
    it('normalises NgbDateStruct values to ISO strings', () => {
      const form = buildPeriodOfValidityForm();

      patchPeriodOfValidityForm(form, {
        startDate: { year: 2026, month: 1, day: 5 },
        endDate: { year: 2026, month: 12, day: 31 },
      });

      expect(form.getRawValue()).toEqual({ startDate: '2026-01-05', endDate: '2026-12-31' });
    });

    it('maps missing values to empty strings', () => {
      const form = buildPeriodOfValidityForm();

      patchPeriodOfValidityForm(form, null);

      expect(form.getRawValue()).toEqual({ startDate: '', endDate: '' });
    });
  });

  describe('periodOfValidityFormToApi', () => {
    it('passes ISO strings through', () => {
      const form = buildPeriodOfValidityForm();
      form.setValue({ startDate: '2026-01-01', endDate: '2026-12-31' });

      expect(periodOfValidityFormToApi(form)).toEqual({
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });
    });

    it('maps an empty end date to null', () => {
      const form = buildPeriodOfValidityForm();
      form.setValue({ startDate: '2026-01-01', endDate: '' });

      expect(periodOfValidityFormToApi(form)).toEqual({ startDate: '2026-01-01', endDate: null });
    });
  });
});
