export enum MetadataLoadingState {
  NONE,
  INPROGRESS,
  COMPLETE,
  ERROR,
}

export const UPDATE_INTERVAL_LABELS = new Map<string, string>([
  ['ARBITRARY', 'beliebig'],
  ['YEARLY', 'jährlich'],
  ['HALF_YEARLY', 'halbjährig'],
  ['MONTHLY', 'monatlich'],
  ['QUARTERLY', 'vierteljährlich'],
]);

export const DATE_PICKER_OPTIONS = {
  autoclose: true,
  language: 'de',
  format: 'yyyy-mm-dd',
} as const;
