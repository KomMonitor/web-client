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
 * Typed model of the georesource "edit features" modal — the batch-import step.
 *
 * The overview step is the AG-Grid feature table and the single-feature step is
 * `<app-single-feature-edit>`; both stay outside this form. The attribute
 * mapping draft row is owned separately by the host.
 *
 * Unlike the add wizards this modal assembles its importer definitions itself
 * rather than going through `ResourceImportService`, so only the field shapes
 * are shared here — see `georesourceEditFeaturesFormToApi` for the wire format.
 */

export type GeoresourceEditFeaturesFormGroup = FormGroup<{
  periodOfValidity: PeriodOfValidityFormGroup;
  importer: ImporterFormGroup;
  isPartialUpdate: FormControl<boolean>;
}>;

export function buildGeoresourceEditFeaturesForm(): GeoresourceEditFeaturesFormGroup {
  return new FormGroup({
    periodOfValidity: buildPeriodOfValidityForm({ requireStart: true }),
    importer: buildImporterForm(),
    isPartialUpdate: new FormControl(false, { nonNullable: true }),
  });
}
