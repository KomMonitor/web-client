import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  ResourceMetadataFormGroup,
  buildResourceMetadataForm,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import {
  TopicHierarchyFormGroup,
  buildTopicHierarchyForm,
} from '../../adminShared/topicHierarchyForm/topic-hierarchy-form.model';

/**
 * Typed model of the indicator add wizard.
 *
 * One child group per stepper step, with the group names matching the step keys
 * (`metadata` | `general` | `topics` | `referenceValues` | `security`). Two
 * steps stay outside this form:
 *
 * - step 4 (references) keeps its two draft rows in
 *   `buildIndicatorReferenceDraftForm()` groups — they are staging areas for the
 *   reference tables, not part of the payload, and their required rules must
 *   not gate the wizard;
 * - step 5 (classification) is owned by `IndicatorClassificationStateService`,
 *   which is already signal-based and models a per-spatial-unit break matrix
 *   that wants a `FormArray` of its own.
 *
 * The required controls mirror the step-1 and step-3 entries of
 * `getV3MissingRequiredFields()`. Ownership (step 7) deliberately carries *no*
 * validator: it is required only when creating, not when editing, and `editMode`
 * flips at runtime — that check stays in `getV3MissingRequiredFields()`, which
 * also drives the "missing fields" dialog the wizard shows instead of disabling
 * its submit button.
 */

export type IndicatorBasicStepGroup = FormGroup<{
  datasetName: FormControl<string>;
  indicatorAbbreviation: FormControl<string>;
  indicatorType: FormControl<any | null>;
  showCustomCommaValue: FormControl<boolean>;
  indicatorPrecision: FormControl<any | null>;
  indicatorUnit: FormControl<string>;
  enableFreeTextUnit: FormControl<boolean>;
  indicatorProcessDescription: FormControl<string>;
  indicatorInterpretation: FormControl<string>;
  indicatorTagsString_withCommas: FormControl<string>;
  isHeadlineIndicator: FormControl<boolean>;
  indicatorReferenceDateNote: FormControl<string>;
  indicatorCreationType: FormControl<any | null>;
  indicatorLowestSpatialUnitMetadataObjectForComputation: FormControl<any | null>;
  enableLowestSpatialUnitSelect: FormControl<boolean>;
}>;

/**
 * Step 6. The `additionalComparison*` controls are a staging row for
 * `additionalComparisonValues`, not payload fields of their own; none of the
 * step is mandatory, so they can live in the same group without gating anything.
 */
export type IndicatorReferenceValuesStepGroup = FormGroup<{
  comparisonValueType: FormControl<string | null>;
  comparisonValue: FormControl<number | null>;
  comparisonRegion: FormControl<string | null>;
  comparisonTimeframe: FormControl<string | null>;
  comparisonDescription: FormControl<string>;
  evaluationDirection: FormControl<string | null>;
  toleranceRange: FormControl<number | null>;
  additionalComparisonType: FormControl<string | null>;
  additionalComparisonValue: FormControl<number | null>;
  additionalComparisonDescription: FormControl<string>;
  enableBenchmarking: FormControl<boolean>;
  benchmarkingVisualizationType: FormControl<string | null>;
  greenThreshold: FormControl<number | null>;
  yellowThreshold: FormControl<number | null>;
  redThreshold: FormControl<number | null>;
}>;

/**
 * Step 7. `ownerOrganization` holds either the organization object or a bare id
 * — `enterEditMode` falls back to the raw `ownerId` when the organization is not
 * in the user's list, and the body builder reads `?.organizationalUnitId ?? value`.
 *
 * The advanced-access controls below the ownership block are bound in the
 * template but never reach the payload; they are kept so the template keeps
 * working, not because the API consumes them.
 */
export type IndicatorAccessStepGroup = FormGroup<{
  ownerOrganization: FormControl<any | null>;
  /** Keyword filter of the owner dropdown — UI only, never submitted. */
  ownerOrgFilter: FormControl<string>;
  isPublic: FormControl<boolean>;
  enableTimeRestrictedAccess: FormControl<boolean>;
  enableGeographicRestriction: FormControl<boolean>;
  accessStartDate: FormControl<string>;
  accessEndDate: FormControl<string>;
  allowedRegions: FormControl<any[]>;
  enableAccessLogging: FormControl<boolean>;
}>;

export type IndicatorAddFormGroup = FormGroup<{
  basic: IndicatorBasicStepGroup;
  general: ResourceMetadataFormGroup;
  topics: TopicHierarchyFormGroup;
  referenceValues: IndicatorReferenceValuesStepGroup;
  security: IndicatorAccessStepGroup;
}>;

/** Structural subset of an indicator the uniqueness rule needs. */
export interface IndicatorNameRef {
  /**
   * The API field is `indicatorName` — the wizard's *control* is called
   * `datasetName`. Naming this after the control silently disabled the whole
   * check: every comparison read `undefined` off the store objects.
   */
  indicatorName: string;
  indicatorType: string;
}

export interface IndicatorAddFormOptions {
  /** Existing indicators, re-read on every validation run. */
  existingIndicators: () => readonly IndicatorNameRef[];
  /** The dataset being edited, so it does not collide with itself. */
  currentDatasetName?: () => string | null;
}

/**
 * Unlike the other resources an indicator name is unique only *per indicator
 * type* — the historic `checkDatasetName()` compared `datasetName` **and**
 * `indicatorType.apiName`. The rule therefore lives here rather than reusing
 * the shared `uniqueNameValidator`, and reads the sibling type control.
 */
export function indicatorNameUniqueValidator(
  existingIndicators: () => readonly IndicatorNameRef[],
  currentDatasetName?: () => string | null
): (control: AbstractControl) => ValidationErrors | null {
  // Same normalisation as the shared `uniqueNameValidator`: a name differing
  // only in case or in surrounding blanks is a duplicate for the API, and
  // letting it through only moved the collision to the server.
  const normalize = (value: string): string => value.trim().toLowerCase();

  return (control: AbstractControl): ValidationErrors | null => {
    const name = control.value;
    if (typeof name !== 'string' || name.trim() === '') {
      return null;
    }
    // Without a chosen type the historic check did not fire either.
    const type = control.parent?.get('indicatorType')?.value?.apiName;
    if (!type) {
      return null;
    }
    const candidate = normalize(name);
    const current = currentDatasetName?.();
    if (typeof current === 'string' && normalize(current) === candidate) {
      return null;
    }

    const taken = (existingIndicators() ?? []).some(
      (indicator) =>
        typeof indicator?.indicatorName === 'string' &&
        normalize(indicator.indicatorName) === candidate &&
        indicator?.indicatorType === type
    );
    return taken ? { uniqueName: { name } } : null;
  };
}

export function buildIndicatorAddForm(options: IndicatorAddFormOptions): IndicatorAddFormGroup {
  const basic: IndicatorBasicStepGroup = new FormGroup({
    datasetName: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        indicatorNameUniqueValidator(options.existingIndicators, options.currentDatasetName),
      ],
    }),
    indicatorAbbreviation: new FormControl('', { nonNullable: true }),
    indicatorType: new FormControl<any | null>(null),
    showCustomCommaValue: new FormControl(false, { nonNullable: true }),
    indicatorPrecision: new FormControl<any | null>(null),
    indicatorUnit: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    enableFreeTextUnit: new FormControl(false, { nonNullable: true }),
    indicatorProcessDescription: new FormControl('', { nonNullable: true }),
    indicatorInterpretation: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    indicatorTagsString_withCommas: new FormControl('', { nonNullable: true }),
    isHeadlineIndicator: new FormControl(false, { nonNullable: true }),
    indicatorReferenceDateNote: new FormControl('', { nonNullable: true }),
    indicatorCreationType: new FormControl<any | null>(null, Validators.required),
    indicatorLowestSpatialUnitMetadataObjectForComputation: new FormControl<any | null>(null),
    enableLowestSpatialUnitSelect: new FormControl(false, { nonNullable: true }),
  });

  const referenceValues: IndicatorReferenceValuesStepGroup = new FormGroup({
    comparisonValueType: new FormControl<string | null>(null),
    comparisonValue: new FormControl<number | null>(null),
    comparisonRegion: new FormControl<string | null>(null),
    comparisonTimeframe: new FormControl<string | null>(null),
    comparisonDescription: new FormControl('', { nonNullable: true }),
    evaluationDirection: new FormControl<string | null>(null),
    toleranceRange: new FormControl<number | null>(null),
    additionalComparisonType: new FormControl<string | null>(null),
    additionalComparisonValue: new FormControl<number | null>(null),
    additionalComparisonDescription: new FormControl('', { nonNullable: true }),
    enableBenchmarking: new FormControl(false, { nonNullable: true }),
    benchmarkingVisualizationType: new FormControl<string | null>(null),
    greenThreshold: new FormControl<number | null>(null),
    yellowThreshold: new FormControl<number | null>(null),
    redThreshold: new FormControl<number | null>(null),
  });

  const security: IndicatorAccessStepGroup = new FormGroup({
    ownerOrganization: new FormControl<any | null>(null),
    ownerOrgFilter: new FormControl('', { nonNullable: true }),
    isPublic: new FormControl(false, { nonNullable: true }),
    enableTimeRestrictedAccess: new FormControl(false, { nonNullable: true }),
    enableGeographicRestriction: new FormControl(false, { nonNullable: true }),
    accessStartDate: new FormControl('', { nonNullable: true }),
    accessEndDate: new FormControl('', { nonNullable: true }),
    allowedRegions: new FormControl<any[]>([], { nonNullable: true }),
    enableAccessLogging: new FormControl(false, { nonNullable: true }),
  });

  return new FormGroup({
    basic,
    general: buildResourceMetadataForm(),
    topics: buildTopicHierarchyForm({ requireMainTopic: true }),
    referenceValues,
    security,
  });
}

/**
 * One staging row of the step-4 reference tables (indicator or georesource).
 * Kept out of the wizard form: it is not submitted, and its required rules must
 * not gate the submit path.
 */
export type IndicatorReferenceDraftGroup = FormGroup<{
  selected: FormControl<any | null>;
  referenceDescription: FormControl<string>;
}>;

export function buildIndicatorReferenceDraftForm(): IndicatorReferenceDraftGroup {
  return new FormGroup({
    selected: new FormControl<any | null>(null, Validators.required),
    referenceDescription: new FormControl('', { nonNullable: true }),
  });
}
