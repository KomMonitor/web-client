import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  FormRecord,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import type {
  Converter,
  DatasourceType,
  ImporterParameter,
  TimeseriesMapping,
} from 'services/resource-import-service/resource-import.model';
import type {
  ConverterConfig,
  DatasourceConfig,
} from 'services/resource-import-service/resource-import.service';
import {
  ImporterParameterRecord,
  syncParameterControls,
} from '../../adminShared/importerForm/importer-form.model';
import { timeseriesMappingsRequiredValidator } from '../../adminShared/timeseriesMappingForm/timeseries-mapping-form.model';

/**
 * Typed model of the indicator batch-update list — one `FormGroup` per table row.
 *
 * Deliberately *not* built on the shared `ImporterFormGroup`: that one carries
 * `idProperty`/`nameProperty` as required controls plus the validity dates and
 * the bounding box, none of which apply to an indicator time-series import.
 * What is shared is the shape of the runtime-keyed parameter dictionaries and
 * `syncParameterControls`.
 *
 * Two differences to the legacy `BatchListItem` are worth knowing:
 *
 * - Rows hold **ids**, not metadata objects (`indicatorId`, `targetSpatialUnitId`).
 *   The legacy row held the whole object, which is why it needed `tempResourceId`
 *   and a `refreshNameColumn`/`resizeNameColumnDropdowns` pair: replacing the
 *   store's `availableIndicators` broke the select's object identity. An id
 *   survives a store refresh, and the run step looks the metadata up fresh.
 * - The flattened converter properties (`separator`, `schemaNamespace`,
 *   `schemaLocation`, `crs`, and the data source's `url`/`payload`) are gone.
 *   They live in the two `FormRecord`s under their **real importer parameter
 *   names**, so the two private name-mapping tables the legacy component used to
 *   re-inflate them are no longer needed.
 */

export type BatchRowFormGroup = FormGroup<{
  selected: FormControl<boolean>;
  indicatorId: FormControl<string>;
  /** Name of the imported mapping-table file; informational, not submitted. */
  mappingTableName: FormControl<string>;
  timeseriesMappings: FormControl<TimeseriesMapping[]>;
  converter: FormControl<Converter | null>;
  mimeType: FormControl<string>;
  /**
   * Source encoding. The legacy batch helper honoured this per row (falling back
   * to the converter's first encoding); the shared single-import path never
   * offered the choice.
   */
  encoding: FormControl<string>;
  schema: FormControl<string>;
  converterParameters: ImporterParameterRecord;
  datasourceType: FormControl<DatasourceType | null>;
  datasourceTypeParameters: ImporterParameterRecord;
  /** FILE data sources only; kept on the row so it survives reordering. */
  selectedFile: FormControl<File | null>;
  spatialReferenceKeyProperty: FormControl<string>;
  targetSpatialUnitId: FormControl<string>;
}>;

export type BatchUpdateFormGroup = FormGroup<{
  /** Global for the whole run, as in the legacy modal. */
  keepMissingValues: FormControl<boolean>;
  rows: FormArray<BatchRowFormGroup>;
}>;

/** A file is mandatory exactly for FILE data sources. */
export function fileRequiredWhenFileDatasource(group: AbstractControl): ValidationErrors | null {
  const datasourceType = group.get('datasourceType')?.value as DatasourceType | null;
  if (datasourceType?.type !== 'FILE') {
    return null;
  }

  return group.get('selectedFile')?.value ? null : { fileRequired: true };
}

/**
 * `mimeType` and `schema` are only required when the selected converter offers a
 * choice — mirroring `buildConverterDefinition`, which returns null for a
 * missing schema only if the converter declares schemas.
 */
export function converterChoicesValidator(group: AbstractControl): ValidationErrors | null {
  const converter = group.get('converter')?.value as Converter | null;
  if (!converter) {
    return null;
  }

  const errors: ValidationErrors = {};
  if (converter.mimeTypes?.length && !group.get('mimeType')?.value) {
    errors['mimeTypeRequired'] = true;
  }
  if (converter.schemas?.length && !group.get('schema')?.value) {
    errors['schemaRequired'] = true;
  }

  return Object.keys(errors).length ? errors : null;
}

export function buildBatchRow(): BatchRowFormGroup {
  return new FormGroup(
    {
      selected: new FormControl(true, { nonNullable: true }),
      indicatorId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      mappingTableName: new FormControl('', { nonNullable: true }),
      timeseriesMappings: new FormControl<TimeseriesMapping[]>([], {
        nonNullable: true,
        validators: [timeseriesMappingsRequiredValidator],
      }),
      converter: new FormControl<Converter | null>(null, Validators.required),
      mimeType: new FormControl('', { nonNullable: true }),
      encoding: new FormControl('', { nonNullable: true }),
      schema: new FormControl('', { nonNullable: true }),
      converterParameters: new FormRecord<FormControl<string>>({}),
      datasourceType: new FormControl<DatasourceType | null>(null, Validators.required),
      datasourceTypeParameters: new FormRecord<FormControl<string>>({}),
      selectedFile: new FormControl<File | null>(null),
      spatialReferenceKeyProperty: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      targetSpatialUnitId: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [fileRequiredWhenFileDatasource, converterChoicesValidator] }
  );
}

export function buildBatchUpdateForm(): BatchUpdateFormGroup {
  return new FormGroup({
    keepMissingValues: new FormControl(true, { nonNullable: true }),
    rows: new FormArray<BatchRowFormGroup>([]),
  });
}

/** Rebuilds a row's parameter records after its converter / data-source changed. */
export function syncBatchRowParameterControls(row: BatchRowFormGroup): void {
  syncParameterControls(row.controls.converterParameters, row.controls.converter.value?.parameters);
  syncParameterControls(
    row.controls.datasourceTypeParameters,
    row.controls.datasourceType.value?.parameters
  );
}

/**
 * Names of the converter parameters any row currently needs, in converter order
 * and without duplicates. Drives the table's parameter columns, replacing the
 * hard-coded `Trennzeichen` / `Schema` / `NAMESPACE` / `SCHEMA_LOCATION` columns
 * and the `checkColumnsToShowSelectedConverter()` name scan.
 */
export function visibleConverterParameterNames(form: BatchUpdateFormGroup): string[] {
  return collectParameterNames(
    form.controls.rows.controls.map((row) => row.controls.converter.value?.parameters)
  );
}

/** Same for the data-source parameters (URL, payload, …). */
export function visibleDatasourceParameterNames(form: BatchUpdateFormGroup): string[] {
  return collectParameterNames(
    form.controls.rows.controls.map((row) => row.controls.datasourceType.value?.parameters)
  );
}

function collectParameterNames(
  parameterLists: readonly (readonly ImporterParameter[] | null | undefined)[]
): string[] {
  const names: string[] = [];

  parameterLists.forEach((parameters) => {
    (parameters ?? []).forEach((parameter) => {
      if (!names.includes(parameter.name)) {
        names.push(parameter.name);
      }
    });
  });

  return names;
}

/** True when at least one row uses a FILE data source, i.e. needs the file column. */
export function hasFileDatasourceRow(form: BatchUpdateFormGroup): boolean {
  return form.controls.rows.controls.some(
    (row) => row.controls.datasourceType.value?.type === 'FILE'
  );
}

/** i18n keys of the run blockers, in the order the legacy tooltip reported them. */
export const BATCH_RUN_BLOCKER_KEYS = {
  emptyList: 'ADMIN_INDICATORS.BATCH_MODAL.BLOCKER_EMPTY_LIST',
  name: 'ADMIN_INDICATORS.BATCH_MODAL.BLOCKER_NAME',
  timeseriesMapping: 'ADMIN_INDICATORS.BATCH_MODAL.BLOCKER_TIMESERIES_MAPPING',
  converter: 'ADMIN_INDICATORS.BATCH_MODAL.BLOCKER_CONVERTER',
  datasourceType: 'ADMIN_INDICATORS.BATCH_MODAL.BLOCKER_DATASOURCE_TYPE',
  datasource: 'ADMIN_INDICATORS.BATCH_MODAL.BLOCKER_DATASOURCE',
  spatialReferenceKey: 'ADMIN_INDICATORS.BATCH_MODAL.BLOCKER_SPATIAL_REF_KEY',
  targetSpatialUnit: 'ADMIN_INDICATORS.BATCH_MODAL.BLOCKER_TARGET_SPATIAL_UNIT',
} as const;

/**
 * i18n keys of everything that keeps the run button disabled, most actionable
 * first. Replaces `checkIfNameAndFilesChosenInEachRow()`, which wrote German
 * sentences straight into `document.getElementById(...).title`.
 */
export function collectBatchRunBlockers(form: BatchUpdateFormGroup): string[] {
  const rows = form.controls.rows.controls;
  if (rows.length === 0) {
    return [BATCH_RUN_BLOCKER_KEYS.emptyList];
  }

  const blockers: string[] = [];
  const add = (key: string): void => {
    if (!blockers.includes(key)) {
      blockers.push(key);
    }
  };

  rows.forEach((row) => {
    if (row.controls.indicatorId.invalid) {
      add(BATCH_RUN_BLOCKER_KEYS.name);
    }
    if (row.controls.timeseriesMappings.invalid) {
      add(BATCH_RUN_BLOCKER_KEYS.timeseriesMapping);
    }
    if (
      row.controls.converter.invalid ||
      row.hasError('mimeTypeRequired') ||
      row.hasError('schemaRequired')
    ) {
      add(BATCH_RUN_BLOCKER_KEYS.converter);
    }
    if (row.controls.datasourceType.invalid) {
      add(BATCH_RUN_BLOCKER_KEYS.datasourceType);
    }
    if (row.hasError('fileRequired') || row.controls.datasourceTypeParameters.invalid) {
      add(BATCH_RUN_BLOCKER_KEYS.datasource);
    }
    if (row.controls.spatialReferenceKeyProperty.invalid) {
      add(BATCH_RUN_BLOCKER_KEYS.spatialReferenceKey);
    }
    if (row.controls.targetSpatialUnitId.invalid) {
      add(BATCH_RUN_BLOCKER_KEYS.targetSpatialUnit);
    }
    if (row.controls.converterParameters.invalid) {
      add(BATCH_RUN_BLOCKER_KEYS.converter);
    }
  });

  return blockers;
}

/** The converter slice a row contributes to `ResourceImportService`. */
export function batchRowToConverterConfig(row: BatchRowFormGroup): ConverterConfig {
  const value = row.getRawValue();
  return {
    converter: value.converter,
    schema: value.schema,
    mimeType: value.mimeType,
    encoding: value.encoding || undefined,
    converterParameterValues: value.converterParameters,
  };
}

/** The data-source slice a row contributes; batch rows never use a DOM input. */
export function batchRowToDatasourceConfig(row: BatchRowFormGroup): DatasourceConfig {
  const value = row.getRawValue();
  return {
    datasourceType: value.datasourceType,
    datasourceTypeFormValues: value.datasourceTypeParameters,
    selectedFile: value.selectedFile,
    fileInputElement: null,
  };
}
