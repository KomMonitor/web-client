import { FormControl, FormGroup, ValidationErrors } from '@angular/forms';
import { fileRequiredForFileDatasource } from '../../adminShared/validators/admin-validators';
import {
  ImporterFormGroup,
  buildImporterForm,
} from '../../adminShared/importerForm/importer-form.model';
import {
  PeriodOfValidityFormGroup,
  buildPeriodOfValidityForm,
} from '../../adminShared/periodOfValidityForm/period-of-validity-form.model';

/**
 * Typed model of the spatial-unit "edit features" modal.
 *
 * Only the second stepper step (`data`) is a form; the first one is the AG-Grid
 * feature table with its delete toggle and stays imperative. The attribute
 * mapping draft row is owned separately by the host — it is a staging area, not
 * part of the payload.
 */

export type SpatialUnitEditFeaturesFormGroup = FormGroup<{
  periodOfValidity: PeriodOfValidityFormGroup;
  importer: ImporterFormGroup;
  isPartialUpdate: FormControl<boolean>;
  /**
   * The upload for a FILE data source. The file input is no
   * ControlValueAccessor, so the host writes it from the `(change)` handler.
   */
  selectedFile: FormControl<File | null>;
}>;

export function buildSpatialUnitEditFeaturesForm(): SpatialUnitEditFeaturesFormGroup {
  return new FormGroup(
    {
      periodOfValidity: buildPeriodOfValidityForm({ requireStart: true }),
      importer: buildImporterForm(),
      isPartialUpdate: new FormControl(false, { nonNullable: true }),
      selectedFile: new FormControl<File | null>(null),
    },
    { validators: fileRequiredForFileDatasource() }
  );
}

/**
 * PUT body for `/spatial-units/{id}`. The validity dates are passed through
 * unnormalised, preserving the pre-Reactive-Forms builder.
 */
export interface SpatialUnitEditFeaturesPutBody {
  geoJsonString: string;
  periodOfValidity: { startDate: string; endDate: string };
  isPartialUpdate: boolean;
}

export function spatialUnitEditFeaturesFormToApi(
  form: SpatialUnitEditFeaturesFormGroup
): SpatialUnitEditFeaturesPutBody {
  const period = form.controls.periodOfValidity.getRawValue();
  return {
    geoJsonString: '', // will be set by the importer
    // `?? ''` keeps the wire format: clearing the field writes null into the
    // control (the picker no longer forces today), the body still sends ''.
    periodOfValidity: { startDate: period.startDate, endDate: period.endDate ?? '' },
    isPartialUpdate: form.controls.isPartialUpdate.value,
  };
}
