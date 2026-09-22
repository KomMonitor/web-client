import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { SpatialUnitHierarchyMembershipPOSTInputType } from 'models/data-management-api';
import { LinePatternOption } from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import {
  ImporterFormGroup,
  buildImporterForm,
} from '../../adminShared/importerForm/importer-form.model';
import {
  PeriodOfValidityFormGroup,
  buildPeriodOfValidityForm,
} from '../../adminShared/periodOfValidityForm/period-of-validity-form.model';
import {
  ResourceMetadataFormGroup,
  buildResourceMetadataForm,
  metadataFormToApi,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import {
  SecurityStepGroup,
  buildSecurityStepForm,
} from '../../adminShared/securityForm/security-form.model';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';
import { toIsoDateString } from '../spatial-unit-import.util';
import {
  HierarchyAssignmentRowGroup,
  buildHierarchyAssignmentArray,
} from './hierarchy-assignment.model';

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
  /**
   * The tenant the level is created for. Form state only — the POST body has
   * no `mandantId`, the backend derives it from the owning organization. It
   * narrows the hierarchies offered below and the owners offered in the
   * security step, which is why the choice belongs in the first step rather
   * than being read back out of the third.
   */
  mandantId: FormControl<string>;
  /** The hierarchies the new level joins, each with its place. May be empty. */
  hierarchyAssignments: FormArray<HierarchyAssignmentRowGroup>;
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
  /** Pattern the outline defaults to; the picker options load asynchronously. */
  defaultOutlineDashArray?: LinePatternOption | null;
}

export function buildSpatialUnitAddForm(
  options: SpatialUnitAddFormOptions
): SpatialUnitAddFormGroup {
  const metadata: SpatialUnitMetadataStepGroup = new FormGroup({
    spatialUnitLevel: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, uniqueNameValidator(options.existingLevelNames)],
    }),
    // No `required` on the tenant: without Keycloak nothing names one, and a
    // rule nobody can satisfy would freeze the submit button — the historic bug
    // the note above this function's type describes.
    mandantId: new FormControl('', { nonNullable: true }),
    hierarchyAssignments: buildHierarchyAssignmentArray(),
    isOutlineLayer: new FormControl(false, { nonNullable: true }),
    outlineColor: new FormControl(DEFAULT_OUTLINE_COLOR, { nonNullable: true }),
    outlineWidth: new FormControl(DEFAULT_OUTLINE_WIDTH, { nonNullable: true }),
    outlineDashArray: new FormControl<LinePatternOption | null>(
      options.defaultOutlineDashArray ?? null
    ),
  });

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
 * One deliberate divergence from `SpatialUnitPOSTInputType` is preserved from
 * the pre-Reactive-Forms builder: `outlineDashArrayString` is `undefined` when
 * no pattern is selected.
 *
 * Hierarchy placement rides along as `hierarchies`, the list that replaced the
 * old pair of neighbour-level fields in v6. The caller passes it in rather than
 * the form deriving it, because a row that appends names the hierarchy's
 * current last member, which is not in the form — see `membershipsForRows`.
 *
 * Note the type: the POST wants the **neighbour** shape
 * (`SpatialUnitHierarchyMembershipPOSTInputType`), not the level-based one that
 * `PUT /spatial-units/{id}/hierarchies` takes.
 */
export interface SpatialUnitAddPostBody {
  geoJsonString: string;
  metadata: ReturnType<typeof metadataFormToApi>;
  jsonSchema: undefined;
  permissions: string[];
  // unverified: the wizard posts through the Importer, and whether it forwards
  // `spatialUnitPostBody.hierarchies` verbatim is not recorded anywhere — see
  // documentation/OFFENE_PUNKTE.md.
  hierarchies: SpatialUnitHierarchyMembershipPOSTInputType[];
  spatialUnitLevel: string;
  periodOfValidity: { startDate: string | null; endDate: string | null };
  isOutlineLayer: boolean;
  outlineColor: string;
  outlineWidth: number;
  outlineDashArrayString: string | undefined;
  ownerId: string;
  isPublic: boolean;
}

export function spatialUnitAddFormToApi(
  form: SpatialUnitAddFormGroup,
  permissions: readonly string[] = [],
  hierarchies: readonly SpatialUnitHierarchyMembershipPOSTInputType[] = []
): SpatialUnitAddPostBody {
  const metadata = form.controls.metadata.getRawValue();
  const security = form.controls.security.getRawValue();
  const period = form.controls.data.controls.periodOfValidity.getRawValue();

  return {
    geoJsonString: '', // will be set by the importer
    metadata: metadataFormToApi(form.controls.general),
    jsonSchema: undefined,
    permissions: [...permissions],
    hierarchies: [...hierarchies],
    spatialUnitLevel: metadata.spatialUnitLevel,
    periodOfValidity: {
      endDate: toIsoDateString(period.endDate || null),
      startDate: toIsoDateString(period.startDate || null),
    },
    isOutlineLayer: metadata.isOutlineLayer,
    outlineColor: metadata.outlineColor,
    outlineWidth: metadata.outlineWidth,
    outlineDashArrayString: metadata.outlineDashArray?.dashArrayValue,
    ownerId: security.ownerOrganization,
    isPublic: security.isPublic,
  };
}
