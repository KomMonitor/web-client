import { getErrorMessage, toIsoDateString } from './spatial-unit-import.util';

describe('spatial-unit-import.util', () => {
  describe('getErrorMessage', () => {
    it('returns a string error body verbatim', () => {
      expect(getErrorMessage({ error: 'boom' })).toBe('boom');
    });

    it('prefers a nested error.message', () => {
      expect(getErrorMessage({ error: { message: 'nested' } })).toBe('nested');
    });

    it('falls back to error.message', () => {
      expect(getErrorMessage({ message: 'top-level' })).toBe('top-level');
    });

    it('falls back to a generic message for unrecognised shapes', () => {
      expect(getErrorMessage(null)).toBe('Unbekannter Fehler');
      expect(getErrorMessage({})).toBe('Unbekannter Fehler');
    });
  });

  describe('toIsoDateString', () => {
    it('returns null for empty values', () => {
      expect(toIsoDateString('')).toBeNull();
      expect(toIsoDateString(null)).toBeNull();
      expect(toIsoDateString(undefined)).toBeNull();
    });

    it('passes through an existing string', () => {
      expect(toIsoDateString('2026-06-30')).toBe('2026-06-30');
    });

    it('formats an NgbDateStruct-like object with zero-padding', () => {
      expect(toIsoDateString({ year: 2026, month: 6, day: 3 })).toBe('2026-06-03');
    });

    it('returns null for an unrecognised object', () => {
      expect(toIsoDateString({ foo: 1 })).toBeNull();
    });
  });
});
