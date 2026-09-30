import { FormControl, FormGroup, FormRecord, Validators } from '@angular/forms';
import { fileRequiredForFileDatasource } from '../../adminShared/validators/admin-validators';
import type {
  Converter,
  DatasourceType,
  TimeseriesMapping,
} from 'services/resource-import-service/resource-import.model';
import { ImporterParameterRecord } from '../../adminShared/importerForm/importer-form.model';
import { timeseriesMappingsRequiredValidator } from '../../adminShared/timeseriesMappingForm/timeseries-mapping-form.model';

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
 * The required controls mirror the historic submit gate exactly: converter,
 * data source, target spatial unit, reference key and a non-empty time-series
 * mapping. The mapping clause was missing between the AngularJS port and the
 * reactive-forms conversion, because the time-series editor it depends on had
 * not been ported — the importer silently received `timeseriesMappings: []`.
 *
 * The FILE upload is part of the form as well (`selectedFile`), so a missing
 * file shows up as a field error and a step marking instead of only failing in
 * `buildImporterObjects` at submit time.
 */

export type IndicatorEditFeaturesFormGroup = FormGroup<{
  converter: FormControl<Converter | null>;
  schema: FormControl<string>;
  mimeType: FormControl<string>;
  converterParameters: ImporterParameterRecord;
  datasourceType: FormControl<DatasourceType | null>;
  datasourceTypeParameters: ImporterParameterRecord;
  /**
   * The upload for a FILE data source. The file input is no
   * ControlValueAccessor, so the host writes it from the `(change)` handler.
   */
  selectedFile: FormControl<File | null>;
  targetSpatialUnitMetadata: FormControl<any | null>;
  spatialUnitRefKeyProperty: FormControl<string>;
  timeseriesMappings: FormControl<TimeseriesMapping[]>;
  keepMissingValues: FormControl<boolean>;
  isPublic: FormControl<boolean>;
}>;

export function buildIndicatorEditFeaturesForm(): IndicatorEditFeaturesFormGroup {
  return new FormGroup(
    {
      converter: new FormControl<Converter | null>(null, Validators.required),
      schema: new FormControl('', { nonNullable: true }),
      mimeType: new FormControl('', { nonNullable: true }),
      converterParameters: new FormRecord<FormControl<string>>({}),
      datasourceType: new FormControl<DatasourceType | null>(null, Validators.required),
      datasourceTypeParameters: new FormRecord<FormControl<string>>({}),
      selectedFile: new FormControl<File | null>(null),
      targetSpatialUnitMetadata: new FormControl<any | null>(null, Validators.required),
      spatialUnitRefKeyProperty: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      timeseriesMappings: new FormControl<TimeseriesMapping[]>([], {
        nonNullable: true,
        validators: [timeseriesMappingsRequiredValidator],
      }),
      keepMissingValues: new FormControl(true, { nonNullable: true }),
      isPublic: new FormControl(false, { nonNullable: true }),
    },
    { validators: fileRequiredForFileDatasource('datasourceType') }
  );
}
