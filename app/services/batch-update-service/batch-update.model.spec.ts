import {
  BatchUpdateRowResult,
  formatBatchRowError,
  summariseBatchResults,
} from './batch-update.model';

/**
 * Pure helper tests, no TestBed. The `formatBatchRowError` cases matter beyond
 * formatting: the legacy result modal rendered server strings through
 * `innerHTML`, so the port must guarantee plain text.
 */

describe('formatBatchRowError', () => {
  it('prefers the message of an HTTP error body', () => {
    expect(formatBatchRowError({ error: { message: 'spatial unit unknown' } })).toBe(
      'spatial unit unknown'
    );
  });

  it('falls back to a string error body', () => {
    expect(formatBatchRowError({ error: 'Bad Request' })).toBe('Bad Request');
  });

  it('reads the legacy $http `data` shape', () => {
    expect(formatBatchRowError({ data: { message: 'conversion failed' } })).toBe(
      'conversion failed'
    );
  });

  it("uses an Error's message", () => {
    expect(formatBatchRowError(new Error('upload failed'))).toBe('upload failed');
  });

  it('passes a plain string through', () => {
    expect(formatBatchRowError('nope')).toBe('nope');
  });

  it('pretty-prints an object that carries no message', () => {
    expect(formatBatchRowError([{ code: 42 }])).toBe('[\n  {\n    "code": 42\n  }\n]');
  });

  it('returns an empty string for null and undefined', () => {
    expect(formatBatchRowError(null)).toBe('');
    expect(formatBatchRowError(undefined)).toBe('');
  });

  it('survives a circular structure instead of throwing', () => {
    const circular: Record<string, unknown> = {};
    circular['self'] = circular;

    expect(() => formatBatchRowError(circular)).not.toThrow();
  });

  it('never returns HTML markup, even for the syntax-highlight-shaped input', () => {
    const formatted = formatBatchRowError({
      error: { message: '<span class="key">"a"</span>' },
    });

    // The value is passed through verbatim; what matters is that the function
    // adds no markup of its own, unlike IndicatorValueService.formatError.
    expect(formatted).toBe('<span class="key">"a"</span>');
    expect(formatBatchRowError([{ code: 1 }])).not.toMatch(/<span/);
  });
});

describe('summariseBatchResults', () => {
  const result = (status: 'success' | 'error'): BatchUpdateRowResult => ({
    label: 'x',
    resourceId: 'id',
    status,
    message: '',
  });

  it('counts successes and errors', () => {
    expect(summariseBatchResults([result('success'), result('error'), result('success')])).toEqual({
      total: 3,
      success: 2,
      error: 1,
    });
  });

  it('handles an empty run', () => {
    expect(summariseBatchResults([])).toEqual({ total: 0, success: 0, error: 0 });
  });
});
