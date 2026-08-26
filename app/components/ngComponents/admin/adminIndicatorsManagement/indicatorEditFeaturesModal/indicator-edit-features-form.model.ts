import { FormControl, FormGroup, FormRecord, Validators } from '@angular/forms';
import type {
  Converter,
  DatasourceType,
} from 'services/resource-import-service/resource-import.model';
import { ImporterParameterRecord } from '../../adminShared/importerForm/importer-form.model';

/**
 * Typed model of the indicator "edit features" modal — the data step.
 *
 * Deliberately *not* built on the shared `ImporterFormGroup`: this modal
 * imports indicator time series rather than geometries, so it has no ID/NAME
 * property, no bounding box and no per-feature validity dates. What it does
 * share is the shape of the two runtime-keyed parameter dictionaries, kept in
 * sync with `syncParameterControls` from the shared importer model.
 *
 * The overview step (feature table, delete toggle, its own spatial-unit select)
 * is grid state and stays outside this form.
 *
 * The required controls mirror the historic four-clause submit gate exactly:
 * converter, data source, target spatial unit and reference key.
 */

export type IndicatorEditFeaturesFormGroup = FormGroup<{
  converter: FormControl<Converter | null>;
  schema: FormControl<string>;
  mimeType: FormControl<string>;
  converterParameters: ImporterParameterRecord;
  datasourceType: FormControl<DatasourceType | null>;
  datasourceTypeParameters: ImporterParameterRecord;
  targetSpatialUnitMetadata: FormControl<any | null>;
  spatialUnitRefKeyProperty: FormControl<string>;
  keepMissingValues: FormControl<boolean>;
  isPublic: FormControl<boolean>;
}>;

export function buildIndicatorEditFeaturesForm(): IndicatorEditFeaturesFormGroup {
  return new FormGroup({
    converter: new FormControl<Converter | null>(null, Validators.required),
    schema: new FormControl('', { nonNullable: true }),
    mimeType: new FormControl('', { nonNullable: true }),
    converterParameters: new FormRecord<FormControl<string>>({}),
    datasourceType: new FormControl<DatasourceType | null>(null, Validators.required),
    datasourceTypeParameters: new FormRecord<FormControl<string>>({}),
    targetSpatialUnitMetadata: new FormControl<any | null>(null, Validators.required),
    spatialUnitRefKeyProperty: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    keepMissingValues: new FormControl(true, { nonNullable: true }),
    isPublic: new FormControl(false, { nonNullable: true }),
  });
}
