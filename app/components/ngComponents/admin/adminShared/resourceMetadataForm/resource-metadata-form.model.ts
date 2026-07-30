import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonMetadataType } from 'models/data-management-api';
import { toIsoDateString } from '../../adminSpatialUnitsManagement/spatial-unit-import.util';

/**
 * Shared typed form model for the "Allgemeine Metadaten" block that is part of
 * every resource add/edit modal (spatial units, georesources, indicators).
 * The form value keeps `updateInterval` as the option object used by the
 * select boxes; `metadataFormToApi` converts to the API wire format
 * (`updateInterval` as apiName string, `lastUpdate` as ISO date).
 */

/** Entry of `window.__env.updateIntervalOptions` (runtime config). */
export interface UpdateIntervalOption {
  apiName: string;
  displayName: string;
}

export interface ResourceMetadataFormValue {
  description: string;
  databasis: string;
  datasource: string;
  contact: string;
  updateInterval: UpdateIntervalOption | null;
  lastUpdate: string;
  literature: string;
  note: string;
  sridEPSG: number;
}

export type ResourceMetadataFormGroup = FormGroup<{
  description: FormControl<string>;
  databasis: FormControl<string>;
  datasource: FormControl<string>;
  contact: FormControl<string>;
  updateInterval: FormControl<UpdateIntervalOption | null>;
  lastUpdate: FormControl<string>;
  literature: FormControl<string>;
  note: FormControl<string>;
  sridEPSG: FormControl<number>;
}>;

export const DEFAULT_SRID_EPSG = 4326;

/**
 * Creates the typed metadata form. Required fields match the historic
 * hand-written checks in the add/edit modals: description, datasource,
 * contact, updateInterval and lastUpdate.
 */
export function buildResourceMetadataForm(): ResourceMetadataFormGroup {
  return new FormGroup({
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    databasis: new FormControl('', { nonNullable: true }),
    datasource: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contact: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    updateInterval: new FormControl<UpdateIntervalOption | null>(null, Validators.required),
    lastUpdate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    literature: new FormControl('', { nonNullable: true }),
    note: new FormControl('', { nonNullable: true }),
    sridEPSG: new FormControl(DEFAULT_SRID_EPSG, { nonNullable: true }),
  });
}

/**
 * Resets the form and applies an API-shaped metadata object (as found in
 * dataset metadata or exported metadata files), resolving the
 * `updateInterval` apiName against the available options.
 */
export function patchMetadataFormFromApi(
  form: ResourceMetadataFormGroup,
  metadata: Partial<CommonMetadataType> | null | undefined,
  updateIntervalOptions: UpdateIntervalOption[]
): void {
  const meta = metadata ?? {};
  form.reset();
  form.patchValue({
    description: meta.description ?? '',
    databasis: meta.databasis ?? '',
    datasource: meta.datasource ?? '',
    contact: meta.contact ?? '',
    lastUpdate: meta.lastUpdate ?? '',
    literature: meta.literature ?? '',
    note: meta.note ?? '',
    sridEPSG: meta.sridEPSG ?? DEFAULT_SRID_EPSG,
    updateInterval:
      (updateIntervalOptions ?? []).find((option) => option.apiName === meta.updateInterval) ??
      null,
  });
}

/** Serializes the form to the API metadata shape used in POST/PATCH/export bodies. */
export function metadataFormToApi(form: ResourceMetadataFormGroup): CommonMetadataType {
  const value = form.getRawValue();
  return {
    description: value.description,
    databasis: value.databasis,
    datasource: value.datasource,
    contact: value.contact,
    updateInterval: (value.updateInterval?.apiName ??
      'ARBITRARY') as CommonMetadataType['updateInterval'],
    lastUpdate: toIsoDateString(value.lastUpdate) ?? '',
    literature: value.literature,
    note: value.note,
    sridEPSG: value.sridEPSG,
  };
}
