import { FormControl, FormGroup } from '@angular/forms';
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
}>;

export function buildSpatialUnitEditFeaturesForm(): SpatialUnitEditFeaturesFormGroup {
  return new FormGroup({
    periodOfValidity: buildPeriodOfValidityForm({ requireStart: true }),
    importer: buildImporterForm(),
    isPartialUpdate: new FormControl(false, { nonNullable: true }),
  });
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
    periodOfValidity: { startDate: period.startDate, endDate: period.endDate },
    isPartialUpdate: form.controls.isPartialUpdate.value,
  };
}
