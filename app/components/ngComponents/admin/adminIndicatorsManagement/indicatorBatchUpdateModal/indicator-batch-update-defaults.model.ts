import { FormControl, FormGroup } from '@angular/forms';
import type {
  Converter,
  DatasourceType,
  TimeseriesMapping,
} from 'services/resource-import-service/resource-import.model';
import {
  BatchRowFormGroup,
  BatchUpdateFormGroup,
  visibleConverterParameterNames,
  visibleDatasourceParameterNames,
} from './indicator-batch-update-form.model';

/**
 * The "Standardwert-Funktion": fill one column of the batch list across all rows
 * at once, either only where it is still empty or overwriting what is there.
 *
 * Ported from `kommonitorBatchUpdateHelperService.onClickSaveColDefaultValue`,
 * which addressed the target column through a dotted path string
 * (`mappingObj.converter.separator`) plus hand-written `get`/`set` path walkers,
 * and located the fields it must not touch with
 * `angular.element('[ng-model="…"]')` DOM queries. Here the target is a typed
 * descriptor and the rows are reached through their controls.
 *
 * It also covers more than the original: the four hard-coded parameter columns
 * (separator, NAMESPACE, SCHEMA_LOCATION, URL/payload) become one entry per
 * parameter the selected converters and data-source types actually declare.
 */

/** Row controls that can be filled in bulk and hold a plain string. */
export type BatchTextControl =
  | 'mimeType'
  | 'encoding'
  | 'schema'
  | 'spatialReferenceKeyProperty'
  | 'targetSpatialUnitId';

export type BatchColumnTarget =
  | { kind: 'timeseriesMappings' }
  | { kind: 'converter' }
  | { kind: 'datasourceType' }
  | { kind: 'text'; control: BatchTextControl }
  | { kind: 'converterParameter'; name: string }
  | { kind: 'datasourceParameter'; name: string };

const TEXT_CONTROLS: readonly BatchTextControl[] = [
  'mimeType',
  'encoding',
  'schema',
  'spatialReferenceKeyProperty',
  'targetSpatialUnitId',
];

/** Stable string form of a target, so it can sit in a `<select>` value. */
export function formatColumnTarget(target: BatchColumnTarget): string {
  switch (target.kind) {
    case 'timeseriesMappings':
    case 'converter':
    case 'datasourceType':
      return target.kind;
    case 'text':
      return `text:${target.control}`;
    case 'converterParameter':
      return `converterParameter:${target.name}`;
    case 'datasourceParameter':
      return `datasourceParameter:${target.name}`;
  }
}

export function parseColumnTarget(value: string): BatchColumnTarget | null {
  if (value === 'timeseriesMappings' || value === 'converter' || value === 'datasourceType') {
    return { kind: value };
  }

  const separator = value.indexOf(':');
  if (separator === -1) {
    return null;
  }
  const kind = value.slice(0, separator);
  const name = value.slice(separator + 1);

  if (kind === 'text') {
    return TEXT_CONTROLS.includes(name as BatchTextControl)
      ? { kind: 'text', control: name as BatchTextControl }
      : null;
  }
  if (kind === 'converterParameter' || kind === 'datasourceParameter') {
    return name ? { kind, name } : null;
  }
  return null;
}

/** Every column the current list offers, in table order. */
export function availableColumnTargets(form: BatchUpdateFormGroup): BatchColumnTarget[] {
  return [
    { kind: 'timeseriesMappings' },
    { kind: 'converter' },
    { kind: 'text', control: 'mimeType' },
    { kind: 'text', control: 'encoding' },
    { kind: 'text', control: 'schema' },
    ...visibleConverterParameterNames(form).map(
      (name): BatchColumnTarget => ({ kind: 'converterParameter', name })
    ),
    { kind: 'datasourceType' },
    ...visibleDatasourceParameterNames(form).map(
      (name): BatchColumnTarget => ({ kind: 'datasourceParameter', name })
    ),
    { kind: 'text', control: 'spatialReferenceKeyProperty' },
    { kind: 'text', control: 'targetSpatialUnitId' },
  ];
}

/** i18n key of a target's label; parameters are named by the importer itself. */
export function columnTargetLabelKey(target: BatchColumnTarget): string | null {
  switch (target.kind) {
    case 'timeseriesMappings':
      return 'ADMIN_INDICATORS.TIMESERIES_MAPPING';
    case 'converter':
      return 'ADMIN_INDICATORS.DATASET_SOURCE_FORMAT';
    case 'datasourceType':
      return 'ADMIN_INDICATORS.DATASOURCE_TYPE';
    case 'text':
      switch (target.control) {
        case 'mimeType':
          return 'ADMIN_INDICATORS.SOURCE_FORMAT';
        case 'encoding':
          return null;
        case 'schema':
          return null;
        case 'spatialReferenceKeyProperty':
          return 'ADMIN_INDICATORS.BATCH_MODAL.SPATIAL_REF_KEY_FEATURES';
        case 'targetSpatialUnitId':
          return 'ADMIN_INDICATORS.TARGET_SPATIAL_UNIT';
      }
      break;
    default:
      return null;
  }
  return null;
}

/** Untranslated fallback label for the targets the importer names itself. */
export function columnTargetPlainLabel(target: BatchColumnTarget): string {
  switch (target.kind) {
    case 'text':
      return target.control === 'encoding' ? 'Encoding' : 'Schema';
    case 'converterParameter':
    case 'datasourceParameter':
      return target.name;
    default:
      return '';
  }
}

export type DefaultValueFormGroup = FormGroup<{
  /** `formatColumnTarget` output of the selected column, or '' for none. */
  column: FormControl<string>;
  /** Value for every string-valued target, including the parameters. */
  textValue: FormControl<string>;
  converterValue: FormControl<Converter | null>;
  datasourceTypeValue: FormControl<DatasourceType | null>;
  timeseriesMappings: FormControl<TimeseriesMapping[]>;
  /** The legacy "Bestehende überschreiben" checkbox. */
  replaceAll: FormControl<boolean>;
}>;

export function buildDefaultValueForm(): DefaultValueFormGroup {
  return new FormGroup({
    column: new FormControl('', { nonNullable: true }),
    textValue: new FormControl('', { nonNullable: true }),
    converterValue: new FormControl<Converter | null>(null),
    datasourceTypeValue: new FormControl<DatasourceType | null>(null),
    timeseriesMappings: new FormControl<TimeseriesMapping[]>([], { nonNullable: true }),
    replaceAll: new FormControl(false, { nonNullable: true }),
  });
}

/**
 * Merges `incoming` into `existing`: entries whose `indicatorValueProperty` is
 * unknown are appended, known ones are replaced only when `replaceAll`.
 *
 * Fixes a bug of the original, which wrote `timeseriesMappings[j] = reference[j]`
 * — the index into the *incoming* array — although the match had been found at
 * index `k` of the existing one, so it overwrote an unrelated entry.
 */
export function mergeTimeseriesMappings(
  existing: readonly TimeseriesMapping[],
  incoming: readonly TimeseriesMapping[],
  replaceAll: boolean
): TimeseriesMapping[] {
  const merged = [...existing];

  incoming.forEach((entry) => {
    const index = merged.findIndex(
      (candidate) => candidate.indicatorValueProperty === entry.indicatorValueProperty
    );

    if (index === -1) {
      merged.push(entry);
      return;
    }
    if (replaceAll) {
      merged[index] = entry;
    }
  });

  return merged;
}

/**
 * Applies the default value to every row. Disabled controls are skipped — the
 * original checked `field.getAttribute('disabled')` on the DOM node for the same
 * reason. Without `replaceAll` only rows whose target is still empty change.
 */
export function applyColumnDefault(
  form: BatchUpdateFormGroup,
  defaults: DefaultValueFormGroup
): number {
  const target = parseColumnTarget(defaults.controls.column.value);
  if (!target) {
    return 0;
  }

  const replaceAll = defaults.controls.replaceAll.value;
  let changed = 0;

  form.controls.rows.controls.forEach((row) => {
    if (applyToRow(row, target, defaults, replaceAll)) {
      changed += 1;
    }
  });

  return changed;
}

function applyToRow(
  row: BatchRowFormGroup,
  target: BatchColumnTarget,
  defaults: DefaultValueFormGroup,
  replaceAll: boolean
): boolean {
  if (target.kind === 'timeseriesMappings') {
    const control = row.controls.timeseriesMappings;
    if (control.disabled) {
      return false;
    }
    const incoming = defaults.controls.timeseriesMappings.value;
    if (incoming.length === 0) {
      return false;
    }
    control.setValue(mergeTimeseriesMappings(control.value, incoming, replaceAll));
    return true;
  }

  if (target.kind === 'converter') {
    return setIfAllowed(row.controls.converter, defaults.controls.converterValue.value, replaceAll);
  }
  if (target.kind === 'datasourceType') {
    return setIfAllowed(
      row.controls.datasourceType,
      defaults.controls.datasourceTypeValue.value,
      replaceAll
    );
  }
  if (target.kind === 'text') {
    return setIfAllowed(
      row.controls[target.control],
      defaults.controls.textValue.value,
      replaceAll
    );
  }

  // Parameter columns only exist on rows whose converter / data-source type
  // declares them; the others are left alone rather than gaining a control.
  const record =
    target.kind === 'converterParameter'
      ? row.controls.converterParameters
      : row.controls.datasourceTypeParameters;

  return setIfAllowed(record.controls[target.name], defaults.controls.textValue.value, replaceAll);
}

function setIfAllowed<T>(
  control: FormControl<T> | undefined,
  value: T,
  replaceAll: boolean
): boolean {
  if (!control || control.disabled) {
    return false;
  }
  if (value === null || value === '') {
    return false;
  }
  if (!replaceAll && !isEmptyValue(control.value)) {
    return false;
  }

  control.setValue(value);
  return true;
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === '';
}
