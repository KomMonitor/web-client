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
  ResourceMetadataFormGroup,
  buildResourceMetadataForm,
  metadataFormToApi,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import {
  SecurityStepGroup,
  buildSecurityStepForm,
} from '../../adminShared/securityForm/security-form.model';
import {
  TopicHierarchyFormGroup,
  buildTopicHierarchyForm,
  topicHierarchyToApi,
} from '../../adminShared/topicHierarchyForm/topic-hierarchy-form.model';
import { uniqueNameValidator } from '../../adminShared/validators/admin-validators';
import { LinePatternOption } from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';

/**
 * Typed model of the georesource add wizard, built like its spatial-unit twin:
 * one child group per stepper step, group names matching the step keys
 * (`metadata` | `general` | `topics` | `security` | `data`).
 *
 * The three historic `isPOI`/`isLOI`/`isAOI` flags collapse into a single
 * `georesourceType` control; the serializer expands them again. All nine style
 * fields live in one `style` group and the serializer picks per type, because
 * the API expects every key present with the inactive ones nulled.
 *
 * The attribute-mapping draft row is not part of this form — see the
 * spatial-unit model for why.
 */

export type GeoresourceType = 'poi' | 'loi' | 'aoi';

/** Entry of `POI_MARKER_COLORS`; the API stores the `colorName`. */
export interface PoiMarkerColor {
  colorName: string;
  /** Swatch colour, rendered by the marker/symbol colour dropdowns. */
  colorValue: string;
  [key: string]: unknown;
}

export type GeoresourceStyleGroup = FormGroup<{
  poiIconName: FormControl<string>;
  poiMarkerStyle: FormControl<string>;
  poiMarkerText: FormControl<string>;
  poiMarkerColor: FormControl<PoiMarkerColor | null>;
  poiSymbolColor: FormControl<PoiMarkerColor | null>;
  loiColor: FormControl<string>;
  loiWidth: FormControl<number>;
  loiDashArray: FormControl<LinePatternOption | null>;
  aoiColor: FormControl<string>;
}>;

export type GeoresourceMetadataStepGroup = FormGroup<{
  datasetName: FormControl<string>;
  georesourceType: FormControl<GeoresourceType>;
  style: GeoresourceStyleGroup;
}>;

export type GeoresourceDataStepGroup = FormGroup<{
  periodOfValidity: PeriodOfValidityFormGroup;
  importer: ImporterFormGroup;
}>;

export type GeoresourceAddFormGroup = FormGroup<{
  metadata: GeoresourceMetadataStepGroup;
  general: ResourceMetadataFormGroup;
  topics: TopicHierarchyFormGroup;
  security: SecurityStepGroup;
  data: GeoresourceDataStepGroup;
}>;

export const DEFAULT_POI_ICON_NAME = 'home';
export const DEFAULT_POI_MARKER_STYLE = 'symbol';
export const DEFAULT_LOI_COLOR = '#bf3d2c';
export const DEFAULT_LOI_WIDTH = 3;
export const DEFAULT_AOI_COLOR = '#bf3d2c';
/** Longest marker text the map renderer can fit into a pin. */
export const POI_MARKER_TEXT_MAX_LENGTH = 3;

export interface GeoresourceAddFormOptions {
  /** Keycloak on: the owning organization becomes mandatory. */
  withSecurity: boolean;
  /** Existing dataset names, re-read on every validation run. */
  existingDatasetNames: () => readonly string[];
}

/**
 * The name + type + style block, shared with the georesource edit-metadata
 * modal. `currentDatasetName` lets the edit modal exclude its own record from
 * the uniqueness rule.
 */
export function buildGeoresourceMetadataStep(options: {
  existingDatasetNames: () => readonly string[];
  currentDatasetName?: () => string | null;
}): GeoresourceMetadataStepGroup {
  const style: GeoresourceStyleGroup = new FormGroup({
    poiIconName: new FormControl(DEFAULT_POI_ICON_NAME, { nonNullable: true }),
    poiMarkerStyle: new FormControl(DEFAULT_POI_MARKER_STYLE, { nonNullable: true }),
    poiMarkerText: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(POI_MARKER_TEXT_MAX_LENGTH)],
    }),
    poiMarkerColor: new FormControl<PoiMarkerColor | null>(null),
    poiSymbolColor: new FormControl<PoiMarkerColor | null>(null),
    loiColor: new FormControl(DEFAULT_LOI_COLOR, { nonNullable: true }),
    loiWidth: new FormControl(DEFAULT_LOI_WIDTH, { nonNullable: true }),
    loiDashArray: new FormControl<LinePatternOption | null>(null),
    aoiColor: new FormControl(DEFAULT_AOI_COLOR, { nonNullable: true }),
  });

  return new FormGroup({
    datasetName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        uniqueNameValidator(options.existingDatasetNames, { ignore: options.currentDatasetName }),
      ],
    }),
    georesourceType: new FormControl<GeoresourceType>('poi', { nonNullable: true }),
    style,
  });
}

export function buildGeoresourceAddForm(
  options: GeoresourceAddFormOptions
): GeoresourceAddFormGroup {
  const metadata = buildGeoresourceMetadataStep({
    existingDatasetNames: options.existingDatasetNames,
  });

  const data: GeoresourceDataStepGroup = new FormGroup({
    periodOfValidity: buildPeriodOfValidityForm({ requireStart: true }),
    importer: buildImporterForm(),
  });

  return new FormGroup({
    metadata,
    general: buildResourceMetadataForm(),
    topics: buildTopicHierarchyForm({ requireMainTopic: true }),
    security: buildSecurityStepForm({ withSecurity: options.withSecurity }),
    data,
  });
}

/**
 * POST body for `/georesources`.
 *
 * The permission field is named `permissions`, matching
 * `GeoresourcePOSTInputType`, the spatial-unit twin and the AngularJS original
 * (which renamed `allowedRoles` to `permissions` in `cbc8640a`, long before the
 * fork point). The Angular port had reintroduced the old name, which silently
 * dropped every georesource permission.
 *
 * One divergence is preserved verbatim from the pre-Reactive-Forms builder: the
 * validity dates are passed through without normalisation.
 */
export interface GeoresourceAddPostBody {
  geoJsonString: string;
  permissions: string[];
  metadata: ReturnType<typeof metadataFormToApi>;
  jsonSchema: null;
  datasetName: string;
  periodOfValidity: { startDate: string; endDate: string };
  isAOI: boolean;
  isLOI: boolean;
  isPOI: boolean;
  topicReference: string;
  ownerId: string;
  isPublic: boolean;
  poiSymbolBootstrap3Name: string | null;
  poiSymbolColor: string | null;
  poiMarkerColor: string | null;
  poiMarkerStyle: string | null;
  poiMarkerText: string | null;
  loiDashArrayString: string | null;
  loiColor: string | null;
  loiWidth: number;
  aoiColor: string | null;
}

export function georesourceAddFormToApi(
  form: GeoresourceAddFormGroup,
  permissions: readonly string[] = []
): GeoresourceAddPostBody {
  const metadata = form.controls.metadata.getRawValue();
  const style = metadata.style;
  const security = form.controls.security.getRawValue();
  const period = form.controls.data.controls.periodOfValidity.getRawValue();
  const type = metadata.georesourceType;

  return {
    geoJsonString: '', // will be set by the importer
    permissions: [...permissions],
    metadata: metadataFormToApi(form.controls.general),
    jsonSchema: null,
    datasetName: metadata.datasetName,
    periodOfValidity: { startDate: period.startDate, endDate: period.endDate },
    isAOI: type === 'aoi',
    isLOI: type === 'loi',
    isPOI: type === 'poi',
    topicReference: topicHierarchyToApi(form.controls.topics),
    ownerId: security.ownerOrganization,
    isPublic: security.isPublic,

    // Every style key is always present; the inactive ones are nulled. Note
    // `loiWidth` falls back to the default rather than null outside the LOI
    // branch, and an unset LOI dash array serialises to '' — both preserved
    // from the historic builder.
    poiSymbolBootstrap3Name: type === 'poi' ? style.poiIconName : null,
    poiSymbolColor: type === 'poi' ? (style.poiSymbolColor?.colorName ?? '') : null,
    poiMarkerColor: type === 'poi' ? (style.poiMarkerColor?.colorName ?? '') : null,
    poiMarkerStyle: type === 'poi' ? style.poiMarkerStyle : null,
    poiMarkerText: type === 'poi' ? style.poiMarkerText : null,
    loiDashArrayString: type === 'loi' ? (style.loiDashArray?.dashArrayValue ?? '') : null,
    loiColor: type === 'loi' ? style.loiColor : null,
    loiWidth: type === 'loi' ? style.loiWidth : DEFAULT_LOI_WIDTH,
    aoiColor: type === 'aoi' ? style.aoiColor : null,
  };
}
