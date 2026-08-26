import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  ImporterFormGroup,
  buildImporterForm,
} from '../../adminShared/importerForm/importer-form.model';
import {
  PeriodOfValidityFormGroup,
  buildPeriodOfValidityForm,
} from '../../adminShared/periodOfValidityForm/period-of-validity-form.model';
import {
  SecurityStepGroup,
  buildSecurityStepForm,
} from '../../adminShared/securityForm/security-form.model';
import {
  ResourceMetadataFormGroup,
  buildResourceMetadataForm,
  metadataFormToApi,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import {
  SpatialUnitLevelRef,
  spatialUnitHierarchyValidator,
  uniqueNameValidator,
} from '../../adminShared/validators/admin-validators';
import { LinePatternOption } from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { toIsoDateString } from '../spatial-unit-import.util';

/**
 * Typed model of the spatial-unit add wizard.
 *
 * One child group per stepper step, with the group names matching the step
 * keys (`metadata` | `general` | `security` | `data`), so the stepper's
 * invalid marking is `addForm.get(stepKey)!.invalid` and the cross-field
 * validators sit at their natural scope.
 *
 * The attribute-mapping draft row is deliberately *not* part of this form: it
 * is a staging area for the mapping table, not part of the payload, and its
 * `required` rules must not gate the wizard's submit button. The host owns it
 * as a separate `buildAttributeMappingDraftForm()` group.
 *
 * `security` is always present; only the `ownerOrganization` requirement is
 * conditional. That keeps the type simple and fixes the historic bug where the
 * submit button stayed disabled forever with Keycloak turned off, because the
 * `!ownerOrganization` clause was unconditional while the field itself was
 * hidden.
 */

export type SpatialUnitMetadataStepGroup = FormGroup<{
  spatialUnitLevel: FormControl<string>;
  nextLowerHierarchySpatialUnit: FormControl<SpatialUnitLevelRef | null>;
  nextUpperHierarchySpatialUnit: FormControl<SpatialUnitLevelRef | null>;
  isOutlineLayer: FormControl<boolean>;
  outlineColor: FormControl<string>;
  outlineWidth: FormControl<number>;
  outlineDashArray: FormControl<LinePatternOption | null>;
}>;

export type SpatialUnitDataStepGroup = FormGroup<{
  periodOfValidity: PeriodOfValidityFormGroup;
  importer: ImporterFormGroup;
}>;

export type SpatialUnitAddFormGroup = FormGroup<{
  metadata: SpatialUnitMetadataStepGroup;
  general: ResourceMetadataFormGroup;
  security: SecurityStepGroup;
  data: SpatialUnitDataStepGroup;
}>;

export const DEFAULT_OUTLINE_COLOR = '#000000';
export const DEFAULT_OUTLINE_WIDTH = 3;

export interface SpatialUnitAddFormOptions {
  /** Keycloak on: the owning organization becomes mandatory. */
  withSecurity: boolean;
  /** Existing level names, re-read on every validation run. */
  existingLevelNames: () => readonly string[];
  /** Spatial units in hierarchy order (coarse first). */
  orderedSpatialUnits: () => readonly SpatialUnitLevelRef[];
  /** Pattern the outline defaults to; the picker options load asynchronously. */
  defaultOutlineDashArray?: LinePatternOption | null;
}

export function buildSpatialUnitAddForm(
  options: SpatialUnitAddFormOptions
): SpatialUnitAddFormGroup {
  const metadata: SpatialUnitMetadataStepGroup = new FormGroup(
    {
      spatialUnitLevel: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, uniqueNameValidator(options.existingLevelNames)],
      }),
      nextLowerHierarchySpatialUnit: new FormControl<SpatialUnitLevelRef | null>(null),
      nextUpperHierarchySpatialUnit: new FormControl<SpatialUnitLevelRef | null>(null),
      isOutlineLayer: new FormControl(false, { nonNullable: true }),
      outlineColor: new FormControl(DEFAULT_OUTLINE_COLOR, { nonNullable: true }),
      outlineWidth: new FormControl(DEFAULT_OUTLINE_WIDTH, { nonNullable: true }),
      outlineDashArray: new FormControl<LinePatternOption | null>(
        options.defaultOutlineDashArray ?? null
      ),
    },
    { validators: spatialUnitHierarchyValidator(options.orderedSpatialUnits) }
  );

  const security = buildSecurityStepForm({ withSecurity: options.withSecurity });

  const data: SpatialUnitDataStepGroup = new FormGroup({
    periodOfValidity: buildPeriodOfValidityForm({ requireStart: true }),
    importer: buildImporterForm(),
  });

  return new FormGroup({
    metadata,
    general: buildResourceMetadataForm(),
    security,
    data,
  });
}

/**
 * POST body for `/spatial-units`.
 *
 * `permissions` comes in as a parameter rather than from the form: the role
 * grid is an imperative AG-Grid read through `@ViewChild`, and stays that way.
 *
 * Two deliberate divergences from `SpatialUnitPOSTInputType` are preserved from
 * the pre-Reactive-Forms builder: the hierarchy levels are sent as explicit
 * `null`, and `outlineDashArrayString` is `undefined` when no pattern is
 * selected.
 */
export interface SpatialUnitAddPostBody {
  geoJsonString: string;
  metadata: ReturnType<typeof metadataFormToApi>;
  jsonSchema: undefined;
  permissions: string[];
  nextLowerHierarchyLevel: string | null;
  spatialUnitLevel: string;
  periodOfValidity: { startDate: string | null; endDate: string | null };
  nextUpperHierarchyLevel: string | null;
  isOutlineLayer: boolean;
  outlineColor: string;
  outlineWidth: number;
  outlineDashArrayString: string | undefined;
  ownerId: string;
  isPublic: boolean;
}

export function spatialUnitAddFormToApi(
  form: SpatialUnitAddFormGroup,
  permissions: readonly string[] = []
): SpatialUnitAddPostBody {
  const metadata = form.controls.metadata.getRawValue();
  const security = form.controls.security.getRawValue();
  const period = form.controls.data.controls.periodOfValidity.getRawValue();

  return {
    geoJsonString: '', // will be set by the importer
    metadata: metadataFormToApi(form.controls.general),
    jsonSchema: undefined,
    permissions: [...permissions],
    nextLowerHierarchyLevel: metadata.nextLowerHierarchySpatialUnit?.spatialUnitLevel ?? null,
    spatialUnitLevel: metadata.spatialUnitLevel,
    periodOfValidity: {
      endDate: toIsoDateString(period.endDate || null),
      startDate: toIsoDateString(period.startDate || null),
    },
    nextUpperHierarchyLevel: metadata.nextUpperHierarchySpatialUnit?.spatialUnitLevel ?? null,
    isOutlineLayer: metadata.isOutlineLayer,
    outlineColor: metadata.outlineColor,
    outlineWidth: metadata.outlineWidth,
    outlineDashArrayString: metadata.outlineDashArray?.dashArrayValue,
    ownerId: security.ownerOrganization,
    isPublic: security.isPublic,
  };
}
