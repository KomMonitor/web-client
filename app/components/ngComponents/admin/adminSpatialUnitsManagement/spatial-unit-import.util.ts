// Pure helpers shared by the spatial-unit importer modals (add / edit-features).

/**
 * Extracts a human-readable message from an arbitrary thrown value or Angular
 * HttpErrorResponse. Falls back to a generic German message.
 */
export function getErrorMessage(error: any): string {
  if (typeof error?.error === 'string') {
    return error.error;
  }
  if (typeof error?.error?.message === 'string') {
    return error.error.message;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return 'Unbekannter Fehler';
}

/**
 * Normalises a date string or NgbDateStruct-like object (`{year, month, day}`)
 * to an ISO `YYYY-MM-DD` string, or null when the value is empty/unrecognised.
 */
export function toIsoDateString(value: any): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  const maybeStruct = value as { year?: number; month?: number; day?: number };
  if (
    maybeStruct &&
    typeof maybeStruct.year === 'number' &&
    typeof maybeStruct.month === 'number' &&
    typeof maybeStruct.day === 'number'
  ) {
    const y = maybeStruct.year;
    const m = String(maybeStruct.month).padStart(2, '0');
    const d = String(maybeStruct.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}
