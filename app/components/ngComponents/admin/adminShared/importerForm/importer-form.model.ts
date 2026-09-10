import { FormControl, FormGroup, FormRecord, Validators } from '@angular/forms';
import type {
  Converter,
  DatasourceType,
  ImporterObjectsConfig,
  ImporterParameter,
  MappingConfigImport,
  MissingImporterFieldsInput,
} from 'services/resource-import-service/resource-import.model';
import { bboxCompleteValidator } from '../validators/admin-validators';

/**
 * Shared typed model for the importer step of the resource add/edit modals
 * (converter, data source, their runtime-keyed parameters and the bounding
 * box). Model only, no shared component: the markup around these fields
 * differs too much between the four consumers.
 *
 * The parameter dictionaries are `FormRecord`s whose controls are rebuilt from
 * the selected converter / data-source type — see `syncConverterParameterControls`.
 */

/** Synthetic data-source parameters the modals render through the bbox block. */
export const SYNTHETIC_DATASOURCE_PARAMETERS = ['bbox', 'bboxType'];

export type BboxType = '' | 'ref' | 'literal';

export type ImporterParameterRecord = FormRecord<FormControl<string>>;

export type BboxFormGroup = FormGroup<{
  minx: FormControl<string>;
  miny: FormControl<string>;
  maxx: FormControl<string>;
  maxy: FormControl<string>;
}>;

export type ImporterFormGroup = FormGroup<{
  converter: FormControl<Converter | null>;
  schema: FormControl<string>;
  mimeType: FormControl<string>;
  converterParameters: ImporterParameterRecord;
  datasourceType: FormControl<DatasourceType | null>;
  datasourceTypeParameters: ImporterParameterRecord;
  bboxType: FormControl<BboxType>;
  bboxRefSpatialUnitId: FormControl<string>;
  bbox: BboxFormGroup;
  idProperty: FormControl<string>;
  nameProperty: FormControl<string>;
  validStartDateProperty: FormControl<string>;
  validEndDateProperty: FormControl<string>;
  keepAttributes: FormControl<boolean>;
  keepMissingValues: FormControl<boolean>;
}>;

export function buildImporterForm(): ImporterFormGroup {
  return new FormGroup({
    converter: new FormControl<Converter | null>(null, Validators.required),
    schema: new FormControl('', { nonNullable: true }),
    mimeType: new FormControl('', { nonNullable: true }),
    converterParameters: new FormRecord<FormControl<string>>({}),
    datasourceType: new FormControl<DatasourceType | null>(null, Validators.required),
    datasourceTypeParameters: new FormRecord<FormControl<string>>({}),
    bboxType: new FormControl<BboxType>('', { nonNullable: true }),
    bboxRefSpatialUnitId: new FormControl('', { nonNullable: true }),
    bbox: new FormGroup(
      {
        minx: new FormControl('', { nonNullable: true }),
        miny: new FormControl('', { nonNullable: true }),
        maxx: new FormControl('', { nonNullable: true }),
        maxy: new FormControl('', { nonNullable: true }),
      },
      { validators: bboxCompleteValidator() }
    ),
    idProperty: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nameProperty: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    validStartDateProperty: new FormControl('', { nonNullable: true }),
    validEndDateProperty: new FormControl('', { nonNullable: true }),
    keepAttributes: new FormControl(true, { nonNullable: true }),
    keepMissingValues: new FormControl(true, { nonNullable: true }),
  });
}

/**
 * Rebuilds a parameter record so it holds exactly the given parameters,
 * keeping the values of names that survive the change. Mandatory parameters
 * get `Validators.required`.
 */
export function syncParameterControls(
  record: ImporterParameterRecord,
  parameters: readonly ImporterParameter[] | null | undefined,
  skipNames: readonly string[] = []
): void {
  const wanted = (parameters ?? []).filter((parameter) => !skipNames.includes(parameter.name));
  const wantedNames = wanted.map((parameter) => parameter.name);

  Object.keys(record.controls)
    .filter((name) => !wantedNames.includes(name))
    .forEach((name) => record.removeControl(name));

  wanted.forEach((parameter) => {
    const existing = record.controls[parameter.name];
    const value = existing?.value ?? '';
    const validators = parameter.mandatory ? [Validators.required] : [];

    if (!existing) {
      record.addControl(parameter.name, new FormControl(value, { nonNullable: true, validators }));
      return;
    }
    existing.setValidators(validators);
    existing.updateValueAndValidity({ emitEvent: false });
  });
}

/** Syncs the converter parameter record to the selected converter. */
export function syncConverterParameterControls(
  form: ImporterFormGroup,
  converter: Converter | null | undefined
): void {
  syncParameterControls(form.controls.converterParameters, converter?.parameters);
}

/**
 * Syncs the data-source parameter record to the selected type, leaving out the
 * synthetic `bbox`/`bboxType` entries — those are rendered by the dedicated
 * bbox block, exactly as `parseMappingConfig` and `collectMissingImporterFields`
 * already treat them.
 */
export function syncDatasourceParameterControls(
  form: ImporterFormGroup,
  datasourceType: DatasourceType | null | undefined
): void {
  // A FILE data source renders no parameter fields: its single declared
  // parameter (`NAME`, flagged mandatory by the importer) is the uploaded
  // file's server-side name and is filled by the upload, not by the user.
  // Building a required control for it left the form permanently invalid and
  // the submit button — bound to `form.invalid` — could never open.
  const parameters =
    datasourceType?.type === 'FILE' ? [] : (datasourceType?.parameters ?? undefined);

  syncParameterControls(
    form.controls.datasourceTypeParameters,
    parameters,
    SYNTHETIC_DATASOURCE_PARAMETERS
  );
}

/** Applies a parsed mapping-config file, rebuilding both parameter records. */
export function patchImporterFormFromMappingConfig(
  form: ImporterFormGroup,
  parsed: MappingConfigImport
): void {
  form.patchValue({
    converter: parsed.converter,
    schema: parsed.schema ?? '',
    mimeType: parsed.mimeType ?? '',
    datasourceType: parsed.datasourceType,
    idProperty: parsed.idProperty ?? '',
    nameProperty: parsed.nameProperty ?? '',
    validStartDateProperty: parsed.validStartDate ?? '',
    validEndDateProperty: parsed.validEndDate ?? '',
    keepAttributes: parsed.keepAttributes ?? true,
    keepMissingValues: parsed.keepMissingValues ?? true,
  });

  syncConverterParameterControls(form, parsed.converter);
  syncDatasourceParameterControls(form, parsed.datasourceType);
  applyParameterValues(form.controls.converterParameters, parsed.converterParameters);
  applyParameterValues(form.controls.datasourceTypeParameters, parsed.datasourceTypeParameters);

  patchBboxFromDataSourceParameters(form, parsed.dataSourceParameters);
}

/**
 * Applies the `bboxType` / `bbox` entries of a mapping config. A `ref` bbox
 * carries the reference spatial-unit id, a literal one the four comma-separated
 * corners.
 */
export function patchBboxFromDataSourceParameters(
  form: ImporterFormGroup,
  parameters: readonly { name: string; value: string }[] | null | undefined
): void {
  const entries = parameters ?? [];
  const bboxType = (entries.find((entry) => entry.name === 'bboxType')?.value ?? '') as BboxType;
  const bbox = entries.find((entry) => entry.name === 'bbox')?.value ?? '';

  form.controls.bboxType.setValue(bboxType);

  if (bboxType === 'ref') {
    form.controls.bboxRefSpatialUnitId.setValue(bbox);
    form.controls.bbox.reset();
    return;
  }

  form.controls.bboxRefSpatialUnitId.setValue('');
  const [minx = '', miny = '', maxx = '', maxy = ''] = bbox.split(',');
  form.controls.bbox.setValue({ minx, miny, maxx, maxy });
}

function applyParameterValues(
  record: ImporterParameterRecord,
  values: { [key: string]: string } | null | undefined
): void {
  Object.entries(values ?? {}).forEach(([name, value]) => {
    record.controls[name]?.setValue(value ?? '');
  });
}

/**
 * The importer slice of `ImporterObjectsConfig`. The bbox values are folded
 * into `datasourceTypeFormValues` under the dedicated keys
 * `KommonitorImporterHelperService.buildDatasourceTypeDefinition()` expects.
 */
export function importerFormToConfig(
  form: ImporterFormGroup
): Pick<
  ImporterObjectsConfig,
  | 'converter'
  | 'schema'
  | 'mimeType'
  | 'converterParameterValues'
  | 'datasourceType'
  | 'datasourceTypeFormValues'
  | 'idProperty'
  | 'nameProperty'
  | 'keepAttributes'
  | 'keepMissingValues'
> {
  const value = form.getRawValue();
  return {
    converter: value.converter,
    schema: value.schema,
    mimeType: value.mimeType,
    converterParameterValues: value.converterParameters,
    datasourceType: value.datasourceType,
    datasourceTypeFormValues: {
      ...value.datasourceTypeParameters,
      bboxType: value.bboxType,
      bboxRef: value.bboxRefSpatialUnitId,
      bbox_minx: value.bbox.minx,
      bbox_miny: value.bbox.miny,
      bbox_maxx: value.bbox.maxx,
      bbox_maxy: value.bbox.maxy,
    },
    idProperty: value.idProperty,
    nameProperty: value.nameProperty,
    keepAttributes: value.keepAttributes,
    keepMissingValues: value.keepMissingValues,
  };
}

/**
 * Bridge to `ResourceImportService.collectMissingImporterFields()`, which stays
 * as the summary-toast layer. Feeding it from the form keeps the per-field
 * validators and the summary from drifting apart.
 */
export function importerFormToMissingFieldsInput(
  form: ImporterFormGroup,
  extras: Pick<MissingImporterFieldsInput, 'hasFile' | 'startDate' | 'periodOfValidityInvalid'>
): MissingImporterFieldsInput {
  const value = form.getRawValue();
  return {
    converter: value.converter,
    schema: value.schema,
    mimeType: value.mimeType,
    converterParameters: value.converterParameters,
    datasourceType: value.datasourceType,
    datasourceTypeParameters: value.datasourceTypeParameters,
    hasFile: extras.hasFile,
    bboxType: value.bboxType,
    bboxRefSpatialUnitLevel: value.bboxRefSpatialUnitId,
    bboxLiteral: {
      minx: emptyToNull(value.bbox.minx),
      miny: emptyToNull(value.bbox.miny),
      maxx: emptyToNull(value.bbox.maxx),
      maxy: emptyToNull(value.bbox.maxy),
    },
    idProperty: value.idProperty,
    nameProperty: value.nameProperty,
    startDate: extras.startDate,
    periodOfValidityInvalid: extras.periodOfValidityInvalid,
  };
}

function emptyToNull(value: string): string | null {
  return value === '' ? null : value;
}
