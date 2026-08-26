import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { downloadJson, readJsonFile } from 'util/json-file.util';
import {
  patchMetadataFormFromApi,
  ResourceMetadataFormGroup,
  ResourceMetadataFormValue,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import {
  patchTopicHierarchyFromChain,
  topicHierarchyToApi,
  topicOptionsFor,
} from '../../adminShared/topicHierarchyForm/topic-hierarchy-form.model';
import {
  buildIndicatorAddForm,
  buildIndicatorReferenceDraftForm,
} from './indicator-add-form.model';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';
import { IndicatorClassificationStateService } from './indicator-classification-state.service';

/**
 * Holds the entire form state and state-manipulating logic for the
 * "add indicator" wizard. Provided at the modal-component level (not root),
 * so each opened modal gets a fresh instance that is discarded with the modal.
 * The step child components and the modal shell all share this single instance.
 */
@Injectable()
export class IndicatorAddFormStateService {
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private envConfigService = inject(EnvConfigService);
  private topicHierarchyService = inject(TopicHierarchyService);
  private accessControlService = inject(AccessControlService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private destroyRef = inject(DestroyRef);

  // Classification (wizard step 5) state + logic, peeled off into its own service.
  // Everything classification-related delegates here; templates read it via
  // `state.classification.*`.
  readonly classification = inject(IndicatorClassificationStateService);

  // Edit mode: when the wizard is opened to edit an existing indicator, this
  // holds the source dataset and its id. In this mode the modal submits a
  // metadata PATCH (see buildPatchBody_indicators_v3) instead of a POST.
  editMode = false;
  editIndicatorDataset: any = null;
  editIndicatorId: string | null = null;

  // Multi-step form; the security step is only present when Keycloak is
  // enabled, mirroring the conditional step component in the template.
  readonly stepper = new WizardStepper([
    { key: 'metadata', label: 'ADMIN_SHARED_UI.STEP_LABELS.INDICATOR_METADATA' },
    { key: 'general', label: 'ADMIN_SHARED_UI.STEP_LABELS.GENERAL_METADATA' },
    { key: 'topics', label: 'ADMIN_SHARED_UI.TOPICS.TITLE' },
    { key: 'references', label: 'ADMIN_SHARED_UI.STEP_LABELS.REFERENCES' },
    { key: 'classification', label: 'ADMIN_SHARED_UI.STEP_LABELS.CLASSIFICATION_OPTIONS' },
    { key: 'referenceValues', label: 'ADMIN_SHARED_UI.STEP_LABELS.REGIONAL_REFERENCE_VALUES' },
    {
      key: 'security',
      label: 'ADMIN_SHARED_UI.SECURITY.ACCESS_OWNERSHIP_TITLE',
      when: () => this.envConfigService.enableKeycloakSecurity,
    },
  ]);

  // Form data
  /**
   * Bumped whenever an async code path rewrites plain form-state fields in
   * bulk (metadata file import, owner-organization fetch). The OnPush wizard
   * shell and step components mirror this via an `effect` + `markForCheck`,
   * so their templates re-read the plain fields afterwards.
   */
  readonly stateRevision = signal(0);
  private bumpStateRevision(): void {
    this.stateRevision.update((revision) => revision + 1);
  }

  // Signal-backed behind getter/setter shims: written across await boundaries
  // by the wizard shell while its OnPush template reads them.
  private readonly _loadingData = signal(false);
  get loadingData(): boolean {
    return this._loadingData();
  }
  set loadingData(value: boolean) {
    this._loadingData.set(value);
  }

  /**
   * Typed model of the wizard, one child group per stepper step. The accessors
   * below keep the historic property names working for the body builders, the
   * step templates and the spec.
   */
  readonly addForm = buildIndicatorAddForm({
    existingIndicators: () => (this.indicatorStore.availableIndicators ?? []) as any[],
    currentDatasetName: () => this.editIndicatorDataset?.datasetName ?? null,
  });

  private get basicStep() {
    return this.addForm.controls.basic;
  }

  constructor() {
    // The name uniqueness rule is scoped per indicator type, so a type change
    // has to re-run it. The name control revalidates itself on its own change.
    this.basicStep.controls.indicatorType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.basicStep.controls.datasetName.updateValueAndValidity());

    // Side effects that used to hang off (ngModelChange) in the step templates.
    const security = this.addForm.controls.security;
    security.controls.ownerOrgFilter.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.filterOrganizations());
    security.controls.ownerOrganization.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.rebuildRoleManagementGrid());
    this.addForm.controls.referenceValues.controls.comparisonValueType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.onComparisonValueTypeChange());
  }

  // Basic form data
  get datasetName(): string {
    return this.basicStep.controls.datasetName.value;
  }
  set datasetName(value: string) {
    this.basicStep.controls.datasetName.setValue(value ?? '');
  }
  get datasetNameInvalid(): boolean {
    return this.basicStep.controls.datasetName.hasError('uniqueName');
  }
  get indicatorAbbreviation(): string {
    return this.basicStep.controls.indicatorAbbreviation.value;
  }
  set indicatorAbbreviation(value: string) {
    this.basicStep.controls.indicatorAbbreviation.setValue(value ?? '');
  }
  get indicatorType(): any {
    return this.basicStep.controls.indicatorType.value;
  }
  set indicatorType(value: any) {
    this.basicStep.controls.indicatorType.setValue(value ?? null);
  }
  get isHeadlineIndicator(): boolean {
    return this.basicStep.controls.isHeadlineIndicator.value;
  }
  set isHeadlineIndicator(value: boolean) {
    this.basicStep.controls.isHeadlineIndicator.setValue(!!value);
  }
  get indicatorUnit(): string {
    return this.basicStep.controls.indicatorUnit.value;
  }
  set indicatorUnit(value: string) {
    this.basicStep.controls.indicatorUnit.setValue(value ?? '');
  }
  get enableFreeTextUnit(): boolean {
    return this.basicStep.controls.enableFreeTextUnit.value;
  }
  set enableFreeTextUnit(value: boolean) {
    this.basicStep.controls.enableFreeTextUnit.setValue(!!value);
  }
  get indicatorProcessDescription(): string {
    return this.basicStep.controls.indicatorProcessDescription.value;
  }
  set indicatorProcessDescription(value: string) {
    this.basicStep.controls.indicatorProcessDescription.setValue(value ?? '');
  }
  get indicatorTagsString_withCommas(): string {
    return this.basicStep.controls.indicatorTagsString_withCommas.value;
  }
  set indicatorTagsString_withCommas(value: string) {
    this.basicStep.controls.indicatorTagsString_withCommas.setValue(value ?? '');
  }
  get indicatorInterpretation(): string {
    return this.basicStep.controls.indicatorInterpretation.value;
  }
  set indicatorInterpretation(value: string) {
    this.basicStep.controls.indicatorInterpretation.setValue(value ?? '');
  }
  get indicatorCreationType(): any {
    return this.basicStep.controls.indicatorCreationType.value;
  }
  set indicatorCreationType(value: any) {
    this.basicStep.controls.indicatorCreationType.setValue(value ?? null);
  }
  get indicatorLowestSpatialUnitMetadataObjectForComputation(): any {
    return this.basicStep.controls.indicatorLowestSpatialUnitMetadataObjectForComputation.value;
  }
  set indicatorLowestSpatialUnitMetadataObjectForComputation(value: any) {
    this.basicStep.controls.indicatorLowestSpatialUnitMetadataObjectForComputation.setValue(
      value ?? null
    );
  }
  get enableLowestSpatialUnitSelect(): boolean {
    return this.basicStep.controls.enableLowestSpatialUnitSelect.value;
  }
  set enableLowestSpatialUnitSelect(value: boolean) {
    this.basicStep.controls.enableLowestSpatialUnitSelect.setValue(!!value);
  }
  get indicatorPrecision(): any {
    return this.basicStep.controls.indicatorPrecision.value;
  }
  set indicatorPrecision(value: any) {
    this.basicStep.controls.indicatorPrecision.setValue(value ?? null);
  }
  get showCustomCommaValue(): boolean {
    return this.basicStep.controls.showCustomCommaValue.value;
  }
  set showCustomCommaValue(value: boolean) {
    this.basicStep.controls.showCustomCommaValue.setValue(!!value);
  }
  get indicatorReferenceDateNote(): string {
    return this.basicStep.controls.indicatorReferenceDateNote.value;
  }
  set indicatorReferenceDateNote(value: string) {
    this.basicStep.controls.indicatorReferenceDateNote.setValue(value ?? '');
  }

  // Metadata
  /**
   * The shared "Allgemeine Metadaten" block. Returns the same instance on every
   * call — never rebuild it here.
   */
  get metadataForm(): ResourceMetadataFormGroup {
    return this.addForm.controls.general;
  }
  /** Read-only view of the metadata form value for post-/patch-body building. */
  get metadata(): ResourceMetadataFormValue {
    return this.metadataForm.getRawValue();
  }

  // References
  indicatorReferences_adminView: any[] = [];
  indicatorReferences_apiRequest: any[] = [];
  georesourceReferences_adminView: any[] = [];
  georesourceReferences_apiRequest: any[] = [];

  // Topic hierarchy. `indicatorTopic_*` (payload side) and `selected*Topic*`
  // (UI side) used to be two parallel field sets kept in sync by hand; both are
  // views of the shared four-level cascade now.
  get indicatorTopic_mainTopic(): any {
    return this.addForm.controls.topics.controls.mainTopic.value;
  }
  set indicatorTopic_mainTopic(value: any) {
    this.addForm.controls.topics.controls.mainTopic.setValue(value ?? null);
  }
  get indicatorTopic_subTopic(): any {
    return this.addForm.controls.topics.controls.subTopic.value;
  }
  set indicatorTopic_subTopic(value: any) {
    this.addForm.controls.topics.controls.subTopic.setValue(value ?? null);
  }
  get indicatorTopic_subsubTopic(): any {
    return this.addForm.controls.topics.controls.subsubTopic.value;
  }
  set indicatorTopic_subsubTopic(value: any) {
    this.addForm.controls.topics.controls.subsubTopic.setValue(value ?? null);
  }
  get indicatorTopic_subsubsubTopic(): any {
    return this.addForm.controls.topics.controls.subsubsubTopic.value;
  }
  set indicatorTopic_subsubsubTopic(value: any) {
    this.addForm.controls.topics.controls.subsubsubTopic.setValue(value ?? null);
  }

  // Step 3: Topic Hierarchy — the shared four-level cascade.
  get selectedTopic(): any {
    return this.addForm.controls.topics.controls.mainTopic.value;
  }
  set selectedTopic(value: any) {
    this.addForm.controls.topics.controls.mainTopic.setValue(value ?? null);
  }
  get selectedSubTopic(): any {
    return this.addForm.controls.topics.controls.subTopic.value;
  }
  set selectedSubTopic(value: any) {
    this.addForm.controls.topics.controls.subTopic.setValue(value ?? null);
  }
  get selectedSubSubTopic(): any {
    return this.addForm.controls.topics.controls.subsubTopic.value;
  }
  set selectedSubSubTopic(value: any) {
    this.addForm.controls.topics.controls.subsubTopic.setValue(value ?? null);
  }
  get selectedSubSubSubTopic(): any {
    return this.addForm.controls.topics.controls.subsubsubTopic.value;
  }
  set selectedSubSubSubTopic(value: any) {
    this.addForm.controls.topics.controls.subsubsubTopic.setValue(value ?? null);
  }
  // Option lists per level, derived from the level above.
  get availableSubTopics(): any[] {
    return [...topicOptionsFor(this.addForm.controls.topics, 'subTopic', this.availableTopics)];
  }
  get availableSubSubTopics(): any[] {
    return [...topicOptionsFor(this.addForm.controls.topics, 'subsubTopic', this.availableTopics)];
  }
  get availableSubSubSubTopics(): any[] {
    return [
      ...topicOptionsFor(this.addForm.controls.topics, 'subsubsubTopic', this.availableTopics),
    ];
  }
  additionalTopic: any = null;
  additionalSubTopic: any = null;
  additionalSubTopics: any[] = [];
  additionalTopicAssignments: Array<{ topic: any; subTopic: any }> = [];

  // Role management
  get ownerOrganization(): any {
    return this.addForm.controls.security.controls.ownerOrganization.value;
  }
  set ownerOrganization(value: any) {
    this.addForm.controls.security.controls.ownerOrganization.setValue(value ?? null);
  }
  get ownerOrgFilter(): string {
    return this.addForm.controls.security.controls.ownerOrgFilter.value;
  }
  set ownerOrgFilter(value: string) {
    this.addForm.controls.security.controls.ownerOrgFilter.setValue(value ?? '');
  }
  get isPublic(): boolean {
    return this.addForm.controls.security.controls.isPublic.value;
  }
  set isPublic(value: boolean) {
    this.addForm.controls.security.controls.isPublic.setValue(!!value);
  }

  // The role grid is the shared <app-role-management-grid> rendered by the step-7
  // access component. Because the step components are created/destroyed while
  // navigating the wizard, step 7 attaches its grid here on view init and detaches
  // it on destroy; the selection is harvested into `storedPermissionIds` so it
  // survives leaving the step. The grid only appears once an owner organization is
  // chosen (`showRoleForm`), mirroring the sibling spatial-unit/georesource add modals.
  showRoleForm = false;
  private attachedRoleGrid: RoleManagementGridComponent | null = null;
  private storedPermissionIds: string[] | null = null;

  // Import/Export functionality
  metadataImportSettings: any = null;
  private readonly _indicatorMetadataImportError = signal('');
  get indicatorMetadataImportError(): string {
    return this._indicatorMetadataImportError();
  }
  set indicatorMetadataImportError(value: string) {
    this._indicatorMetadataImportError.set(value);
  }

  // Success/Error data
  successMessage = '';
  errorMessage = '';
  private readonly _successMessagePart = signal('');
  get successMessagePart(): string {
    return this._successMessagePart();
  }
  set successMessagePart(value: string) {
    this._successMessagePart.set(value);
  }
  private readonly _errorMessagePart = signal('');
  get errorMessagePart(): string {
    return this._errorMessagePart();
  }
  set errorMessagePart(value: string) {
    this._errorMessagePart.set(value);
  }

  // Available options
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  indicatorTypeOptions: any[] = [];
  availableIndicators: any[] = [];
  availableGeoresources: any[] = [];
  availableTopics: any[] = [];

  // Step 6: Regional Comparison Values
  private get referenceValuesStep() {
    return this.addForm.controls.referenceValues;
  }
  get comparisonValueType(): string | null {
    return this.referenceValuesStep.controls.comparisonValueType.value;
  }
  set comparisonValueType(value: string | null) {
    this.referenceValuesStep.controls.comparisonValueType.setValue(value ?? null);
  }
  get comparisonValue(): number | null {
    return this.referenceValuesStep.controls.comparisonValue.value;
  }
  set comparisonValue(value: number | null) {
    this.referenceValuesStep.controls.comparisonValue.setValue(value ?? null);
  }
  get comparisonRegion(): string | null {
    return this.referenceValuesStep.controls.comparisonRegion.value;
  }
  set comparisonRegion(value: string | null) {
    this.referenceValuesStep.controls.comparisonRegion.setValue(value ?? null);
  }
  get comparisonTimeframe(): string | null {
    return this.referenceValuesStep.controls.comparisonTimeframe.value;
  }
  set comparisonTimeframe(value: string | null) {
    this.referenceValuesStep.controls.comparisonTimeframe.setValue(value ?? null);
  }
  get comparisonDescription(): string {
    return this.referenceValuesStep.controls.comparisonDescription.value;
  }
  set comparisonDescription(value: string) {
    this.referenceValuesStep.controls.comparisonDescription.setValue(value ?? '');
  }
  get evaluationDirection(): string | null {
    return this.referenceValuesStep.controls.evaluationDirection.value;
  }
  set evaluationDirection(value: string | null) {
    this.referenceValuesStep.controls.evaluationDirection.setValue(value ?? null);
  }
  get toleranceRange(): number | null {
    return this.referenceValuesStep.controls.toleranceRange.value;
  }
  set toleranceRange(value: number | null) {
    this.referenceValuesStep.controls.toleranceRange.setValue(value ?? null);
  }

  // Additional comparison values (staging row + the collected list)
  get additionalComparisonType(): string | null {
    return this.referenceValuesStep.controls.additionalComparisonType.value;
  }
  set additionalComparisonType(value: string | null) {
    this.referenceValuesStep.controls.additionalComparisonType.setValue(value ?? null);
  }
  get additionalComparisonValue(): number | null {
    return this.referenceValuesStep.controls.additionalComparisonValue.value;
  }
  set additionalComparisonValue(value: number | null) {
    this.referenceValuesStep.controls.additionalComparisonValue.setValue(value ?? null);
  }
  get additionalComparisonDescription(): string {
    return this.referenceValuesStep.controls.additionalComparisonDescription.value;
  }
  set additionalComparisonDescription(value: string) {
    this.referenceValuesStep.controls.additionalComparisonDescription.setValue(value ?? '');
  }
  additionalComparisonValues: Array<{ type: string; value: number; description: string }> = [];

  // Benchmarking configuration
  get enableBenchmarking(): boolean {
    return this.referenceValuesStep.controls.enableBenchmarking.value;
  }
  set enableBenchmarking(value: boolean) {
    this.referenceValuesStep.controls.enableBenchmarking.setValue(!!value);
  }
  get benchmarkingVisualizationType(): string | null {
    return this.referenceValuesStep.controls.benchmarkingVisualizationType.value;
  }
  set benchmarkingVisualizationType(value: string | null) {
    this.referenceValuesStep.controls.benchmarkingVisualizationType.setValue(value ?? null);
  }
  get greenThreshold(): number | null {
    return this.referenceValuesStep.controls.greenThreshold.value;
  }
  set greenThreshold(value: number | null) {
    this.referenceValuesStep.controls.greenThreshold.setValue(value ?? null);
  }
  get yellowThreshold(): number | null {
    return this.referenceValuesStep.controls.yellowThreshold.value;
  }
  set yellowThreshold(value: number | null) {
    this.referenceValuesStep.controls.yellowThreshold.setValue(value ?? null);
  }
  get redThreshold(): number | null {
    return this.referenceValuesStep.controls.redThreshold.value;
  }
  set redThreshold(value: number | null) {
    this.referenceValuesStep.controls.redThreshold.setValue(value ?? null);
  }

  // Step 7: Access Control and Ownership
  // Base list of organizations the user may assign as owner (full accessControl
  // for admins, resource-creator subset otherwise); `filteredOrganizations` is the
  // filtered view of it shown in the dropdown.
  ownerOrganizations: any[] = [];
  // Signal-backed shim: filled after the async access-control fetch while the
  // OnPush step-7 template iterates it.
  private readonly _filteredOrganizations = signal<any[]>([]);
  get filteredOrganizations(): any[] {
    return this._filteredOrganizations();
  }
  set filteredOrganizations(value: any[]) {
    this._filteredOrganizations.set(value);
  }

  // Advanced access control. Bound in the step-7 template but never part of the
  // payload — kept so the template keeps working, not because the API reads it.
  private get securityStep() {
    return this.addForm.controls.security;
  }
  get enableTimeRestrictedAccess(): boolean {
    return this.securityStep.controls.enableTimeRestrictedAccess.value;
  }
  set enableTimeRestrictedAccess(value: boolean) {
    this.securityStep.controls.enableTimeRestrictedAccess.setValue(!!value);
  }
  get enableGeographicRestriction(): boolean {
    return this.securityStep.controls.enableGeographicRestriction.value;
  }
  set enableGeographicRestriction(value: boolean) {
    this.securityStep.controls.enableGeographicRestriction.setValue(!!value);
  }
  get accessStartDate(): string {
    return this.securityStep.controls.accessStartDate.value;
  }
  set accessStartDate(value: string) {
    this.securityStep.controls.accessStartDate.setValue(value ?? '');
  }
  get accessEndDate(): string {
    return this.securityStep.controls.accessEndDate.value;
  }
  set accessEndDate(value: string) {
    this.securityStep.controls.accessEndDate.setValue(value ?? '');
  }
  get allowedRegions(): any[] {
    return this.securityStep.controls.allowedRegions.value;
  }
  set allowedRegions(value: any[]) {
    this.securityStep.controls.allowedRegions.setValue(value ?? []);
  }
  availableRegions: any[] = [];
  get enableAccessLogging(): boolean {
    return this.securityStep.controls.enableAccessLogging.value;
  }
  set enableAccessLogging(value: boolean) {
    this.securityStep.controls.enableAccessLogging.setValue(!!value);
  }

  // Temporary variables for references
  indicatorNameFilter = '';
  /**
   * Staging rows of the two reference tables. Deliberately outside `addForm`:
   * they are not submitted, and their required rules must not gate the wizard.
   */
  readonly indicatorReferenceDraft = buildIndicatorReferenceDraftForm();
  readonly georesourceReferenceDraft = buildIndicatorReferenceDraftForm();
  get tmpIndicatorReference_selectedIndicatorMetadata(): any {
    return this.indicatorReferenceDraft.controls.selected.value;
  }
  set tmpIndicatorReference_selectedIndicatorMetadata(value: any) {
    this.indicatorReferenceDraft.controls.selected.setValue(value ?? null);
  }
  get tmpIndicatorReference_referenceDescription(): string {
    return this.indicatorReferenceDraft.controls.referenceDescription.value;
  }
  set tmpIndicatorReference_referenceDescription(value: string) {
    this.indicatorReferenceDraft.controls.referenceDescription.setValue(value ?? '');
  }
  georesourceNameFilter = '';
  get tmpGeoresourceReference_selectedGeoresourceMetadata(): any {
    return this.georesourceReferenceDraft.controls.selected.value;
  }
  set tmpGeoresourceReference_selectedGeoresourceMetadata(value: any) {
    this.georesourceReferenceDraft.controls.selected.setValue(value ?? null);
  }
  get tmpGeoresourceReference_referenceDescription(): string {
    return this.georesourceReferenceDraft.controls.referenceDescription.value;
  }
  set tmpGeoresourceReference_referenceDescription(value: string) {
    this.georesourceReferenceDraft.controls.referenceDescription.setValue(value ?? '');
  }

  // Step 4: Filtered lists for references
  filteredIndicators: any[] = [];
  filteredGeoresources: any[] = [];

  // Post body
  postBody_indicators: any = null;

  displayOrder = 0;

  loadInitialData() {
    this.loadingData = true;

    // Load available spatial units
    if (this.spatialUnitStore.availableSpatialUnits) {
      this.availableSpatialUnits = this.spatialUnitStore.availableSpatialUnits;
      this.indicatorLowestSpatialUnitMetadataObjectForComputation =
        this.availableSpatialUnits.length > 0 ? this.availableSpatialUnits[0] : null;
    }

    // Load update interval options
    if (this.envConfigService && this.envConfigService.updateIntervalOptions) {
      this.updateIntervalOptions = this.envConfigService.updateIntervalOptions;
    }

    // Load indicator type options
    if (this.envConfigService && this.envConfigService.indicatorTypeOptions) {
      this.indicatorTypeOptions = this.envConfigService.indicatorTypeOptions;
      this.indicatorType =
        this.indicatorTypeOptions.length > 0 ? this.indicatorTypeOptions[0] : null;
    }

    // Load available indicators
    if (this.indicatorStore.availableIndicators) {
      this.availableIndicators = this.indicatorStore.availableIndicators;
    }

    // Load available georesources
    if (this.georesourceStore.availableGeoresources) {
      this.availableGeoresources = this.georesourceStore.availableGeoresources;
    }

    // Load available topics
    if (this.topicStore.availableTopics) {
      this.availableTopics = this.topicStore.availableTopics;
    }

    // Load color brewer schemes and initialize the per-spatial-unit classification tabs.
    this.classification.init(this.availableSpatialUnits);

    // Initialize filtered lists for Step 4
    this.filteredIndicators = this.availableIndicators || [];
    this.filteredGeoresources = this.availableGeoresources || [];

    // Initialize data for Step 7
    this.loadOwnerOrganizations();
    this.availableRegions = this.availableSpatialUnits || [];

    this.loadingData = false;
  }

  initializeMultiStepForm() {
    // The role-management grid is (re)built from the admin access-control data once
    // it is available (see prepareOwnerOrganizationList / rebuildRoleManagementGrid),
    // so nothing to build here up front.

    // Initialize classification tabs (palettes were already loaded in loadInitialData).
    this.classification.onNumClassesChanged(this.classification.numClassesPerSpatialUnit());
  }

  /**
   * The rule is `indicatorNameUniqueValidator` on the control now — it reads the
   * sibling indicator-type control, so a type change has to re-run it too.
   */
  checkDatasetName() {
    this.addForm.controls.basic.controls.datasetName.updateValueAndValidity();
  }

  // Reference management methods
  onAddOrUpdateIndicatorReference() {
    if (
      this.tmpIndicatorReference_selectedIndicatorMetadata &&
      this.tmpIndicatorReference_referenceDescription
    ) {
      const tmpReference = {
        indicatorMetadata: this.tmpIndicatorReference_selectedIndicatorMetadata,
        referenceDescription: this.tmpIndicatorReference_referenceDescription,
      };

      let processed = false;
      for (let index = 0; index < this.indicatorReferences_adminView.length; index++) {
        const indicatorReference = this.indicatorReferences_adminView[index];
        if (
          indicatorReference.indicatorMetadata.indicatorId ===
          tmpReference.indicatorMetadata.indicatorId
        ) {
          // replace object
          this.indicatorReferences_adminView[index] = tmpReference;
          processed = true;
          break;
        }
      }

      if (!processed) {
        // new entry
        this.indicatorReferences_adminView.push(tmpReference);
      }

      this.tmpIndicatorReference_selectedIndicatorMetadata = null;
      this.tmpIndicatorReference_referenceDescription = '';
    }
  }

  onClickEditIndicatorReference(indicatorReference: any) {
    this.tmpIndicatorReference_selectedIndicatorMetadata = indicatorReference.indicatorMetadata;
    this.tmpIndicatorReference_referenceDescription = indicatorReference.referenceDescription;
  }

  onClickDeleteIndicatorReference(indicatorReference: any) {
    for (let index = 0; index < this.indicatorReferences_adminView.length; index++) {
      if (
        this.indicatorReferences_adminView[index].indicatorMetadata.indicatorId ===
        indicatorReference.indicatorMetadata.indicatorId
      ) {
        // remove object
        this.indicatorReferences_adminView.splice(index, 1);
        break;
      }
    }
  }

  onAddOrUpdateGeoresourceReference() {
    if (
      this.tmpGeoresourceReference_selectedGeoresourceMetadata &&
      this.tmpGeoresourceReference_referenceDescription
    ) {
      const tmpReference = {
        georesourceMetadata: this.tmpGeoresourceReference_selectedGeoresourceMetadata,
        referenceDescription: this.tmpGeoresourceReference_referenceDescription,
      };

      let processed = false;
      for (let index = 0; index < this.georesourceReferences_adminView.length; index++) {
        const georesourceReference = this.georesourceReferences_adminView[index];
        if (
          georesourceReference.georesourceMetadata.georesourceId ===
          tmpReference.georesourceMetadata.georesourceId
        ) {
          // replace object
          this.georesourceReferences_adminView[index] = tmpReference;
          processed = true;
          break;
        }
      }

      if (!processed) {
        // new entry
        this.georesourceReferences_adminView.push(tmpReference);
      }

      this.tmpGeoresourceReference_selectedGeoresourceMetadata = null;
      this.tmpGeoresourceReference_referenceDescription = '';
    }
  }

  onClickEditGeoresourceReference(georesourceReference: any) {
    this.tmpGeoresourceReference_selectedGeoresourceMetadata =
      georesourceReference.georesourceMetadata;
    this.tmpGeoresourceReference_referenceDescription = georesourceReference.referenceDescription;
  }

  onClickDeleteGeoresourceReference(georesourceReference: any) {
    for (let index = 0; index < this.georesourceReferences_adminView.length; index++) {
      if (
        this.georesourceReferences_adminView[index].georesourceMetadata.georesourceId ===
        georesourceReference.georesourceMetadata.georesourceId
      ) {
        // remove object
        this.georesourceReferences_adminView.splice(index, 1);
        break;
      }
    }
  }

  // Build post body for API request
  buildPostBody_indicators() {
    // Convert references to API format
    this.convertReferencesToApiFormat();

    const postBody: any = {
      datasetName: this.datasetName,
      abbreviation: this.indicatorAbbreviation,
      indicatorType: this.indicatorType?.apiName,
      isHeadlineIndicator: this.isHeadlineIndicator,
      unit: this.indicatorUnit,
      processDescription: this.indicatorProcessDescription,
      interpretation: this.indicatorInterpretation,
      creationType: this.indicatorCreationType?.apiName,
      lowestSpatialUnitForComputation:
        this.indicatorLowestSpatialUnitMetadataObjectForComputation?.spatialUnitLevel,
      referenceDateNote: this.indicatorReferenceDateNote,
      displayOrder: this.displayOrder,
      metadata: {
        note: this.metadata.note,
        literature: this.metadata.literature,
        updateInterval: this.metadata.updateInterval?.apiName,
        sridEPSG: this.metadata.sridEPSG,
        datasource: this.metadata.datasource,
        contact: this.metadata.contact,
        lastUpdate: this.metadata.lastUpdate,
        description: this.metadata.description,
        databasis: this.metadata.databasis,
      },
      allowedRoles: [] as string[],
      refrencesToOtherIndicators: this.indicatorReferences_apiRequest,
      refrencesToGeoresources: this.georesourceReferences_apiRequest,
      defaultClassificationMapping: {
        colorBrewerSchemeName: this.classification.selectedColorBrewerPaletteEntry()?.paletteName,
        numClasses: this.classification.numClassesPerSpatialUnit(),
        classificationMethod: this.classification.classificationMethod(),
        items: this.classification.spatialUnitClassification().map((classification) => ({
          spatialUnit: classification.spatialUnitId,
          breaks: classification.breaks.filter((breakVal) => breakVal !== null),
        })),
      },
    };

    // Add topic reference if selected
    const deepestTopicId = topicHierarchyToApi(this.addForm.controls.topics);
    if (deepestTopicId) {
      postBody.topicReference = deepestTopicId;
    }

    // Add tags if provided
    if (this.indicatorTagsString_withCommas) {
      postBody.tags = this.indicatorTagsString_withCommas
        .split(',')
        .map((tag: string) => tag.trim());
    }

    // Add precision if custom value is enabled
    if (this.showCustomCommaValue && this.indicatorPrecision !== null) {
      postBody.precision = this.indicatorPrecision;
    }

    // Add role permissions
    postBody.allowedRoles.push(...this.getSelectedRoleIds());

    return postBody;
  }

  /**
   * Builds the POST body strictly following the KomMonitor Data Management API v3
   * schema `IndicatorPOSTInputType` (verified against the OpenAPI docs). Unlike
   * {@link buildPostBody_indicators} this method:
   *  - sends every required field unconditionally (`tags`, `topicReference`,
   *    `characteristicValue`, `ownerId`, `isPublic`, `permissions`),
   *  - uses the correct field names (`permissions` not `allowedRoles`,
   *    classification item key `spatialUnitId` not `spatialUnit`),
   *  - uppercases `classificationMethod` to match the API enum,
   *  - emits references in the `{ indicatorId | georesourceId, referenceDescription }`
   *    shape, built directly from the admin-view lists (no shared state).
   * Kept alongside the legacy builder so both can be compared against the live API.
   */
  buildPostBody_indicators_v3() {
    // Resolve the selected topic id from the deepest selected hierarchy level.
    const topicReference = topicHierarchyToApi(this.addForm.controls.topics);

    // Tags: always an array (required field), empty when none entered.
    const tags = this.indicatorTagsString_withCommas
      ? this.indicatorTagsString_withCommas.split(',').map((tag: string) => tag.trim())
      : [];

    // Permissions: role ids selected in the role-management grid (required array).
    const permissions: string[] = [...this.getSelectedRoleIds()];

    const postBody: any = {
      // required
      datasetName: this.datasetName,
      characteristicValue: '', // no dedicated UI field yet; API requires the property
      creationType: this.indicatorCreationType?.apiName,
      isHeadlineIndicator: this.isHeadlineIndicator,
      interpretation: this.indicatorInterpretation,
      processDescription: this.indicatorProcessDescription,
      unit: this.indicatorUnit,
      topicReference,
      tags,
      permissions,
      // ownerOrganization holds the full org object from the picker; the API
      // expects only its identifier. Fall back to the raw value if a bare id is set.
      ownerId: this.ownerOrganization?.organizationalUnitId ?? this.ownerOrganization,
      isPublic: this.isPublic ? true : false,
      metadata: {
        // required metadata fields
        contact: this.metadata.contact,
        datasource: this.metadata.datasource,
        description: this.metadata.description,
        updateInterval: this.metadata.updateInterval?.apiName,
        // optional / nullable metadata fields
        note: this.metadata.note || null,
        literature: this.metadata.literature || null,
        databasis: this.metadata.databasis || null,
        lastUpdate: this.metadata.lastUpdate || null,
        sridEPSG: this.metadata.sridEPSG || 4326,
      },
      defaultClassificationMapping: this.classification.buildDefaultClassificationMapping(),
      // optional top-level fields
      abbreviation: this.indicatorAbbreviation || null,
      indicatorType: this.indicatorType?.apiName,
      displayOrder: this.displayOrder,
      referenceDateNote: this.indicatorReferenceDateNote || null,
      lowestSpatialUnitForComputation:
        this.indicatorLowestSpatialUnitMetadataObjectForComputation?.spatialUnitLevel ?? null,
      refrencesToOtherIndicators: this.indicatorReferences_adminView.map((ref) => ({
        indicatorId: ref.indicatorMetadata.indicatorId,
        referenceDescription: ref.referenceDescription,
      })),
      refrencesToGeoresources: this.georesourceReferences_adminView.map((ref) => ({
        georesourceId: ref.georesourceMetadata.georesourceId,
        referenceDescription: ref.referenceDescription,
      })),
    };

    // Precision is optional; only send it when a custom value is enabled.
    if (this.showCustomCommaValue && this.indicatorPrecision !== null) {
      postBody.precision = this.indicatorPrecision;
    }

    return postBody;
  }

  /**
   * Returns the required `IndicatorPOSTInputType` fields that are still blank in
   * the API-v3 body, as `{ label }` entries for a user-facing validation dialog.
   * (Booleans, `tags`/`permissions` empty-arrays and `characteristicValue` — which
   * has no UI field yet — are intentionally not treated as missing.)
   */
  getV3MissingRequiredFields(): { label: string }[] {
    const body = this.buildPostBody_indicators_v3();
    const missing: { label: string }[] = [];
    const isBlank = (value: any) =>
      value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    const check = (blank: boolean, label: string) => {
      if (blank) missing.push({ label });
    };

    // Ordered by wizard step so the resulting list is already sorted by step.

    // Step 1 — basic metadata
    check(isBlank(body.datasetName), 'Indikatorname (Schritt 1)');
    check(isBlank(body.unit), 'Einheit (Schritt 1)');
    check(isBlank(body.interpretation), 'Interpretation (Schritt 1)');
    check(isBlank(body.creationType), 'Fortführungstyp (Schritt 1)');

    // Step 2 — general metadata
    check(isBlank(body.metadata?.description), 'Beschreibung (Schritt 2)');
    check(isBlank(body.metadata?.datasource), 'Datenquelle (Schritt 2)');
    check(isBlank(body.metadata?.contact), 'Datenhalter und Kontakt (Schritt 2)');
    check(isBlank(body.metadata?.updateInterval), 'Aktualisierungszyklus (Schritt 2)');

    // Step 3 — topic hierarchy
    check(isBlank(body.topicReference), 'Heuptthema (Schritt 3)');

    // Step 5 — classification mapping. The required fields differ per classification
    // type: categorical needs at least two fully-defined categories; numeric needs a
    // method + class count, and the regional method additionally needs complete breaks.
    const mapping = body.defaultClassificationMapping;
    check(isBlank(mapping?.colorBrewerSchemeName), 'Klassifizierung: Farbschema (Schritt 5)');
    if (mapping?.classificationType === 'QUALITATIVE') {
      const categories: any[] = Array.isArray(mapping?.categoricalData)
        ? mapping.categoricalData
        : [];
      check(categories.length < 2, 'Klassifizierung: mindestens 2 Kategorien (Schritt 5)');
      check(
        categories.some(
          (category) => isBlank(category?.categoricalValue) || isBlank(category?.label)
        ),
        'Klassifizierung: Wert und Label für jede Kategorie (Schritt 5)'
      );
    } else {
      check(isBlank(mapping?.classificationMethod), 'Klassifizierung: Methode (Schritt 5)');
      check(
        mapping?.numClasses === undefined || mapping?.numClasses === null,
        'Klassifizierung: Klassenanzahl (Schritt 5)'
      );
      // Break values only exist for the regional default method (computed methods
      // derive them from the data), so only require them there.
      if (mapping?.classificationMethod === 'REGIONAL_DEFAULT') {
        check(
          !Array.isArray(mapping?.items) || mapping.items.length === 0,
          'Klassifizierung: vollständige Klassengrenzen für mind. eine Raumeinheit (Schritt 5)'
        );
      }
    }

    // Step 7 — ownership. Only required when creating a new indicator; the
    // metadata PATCH used in edit mode does not carry ownership (that is managed
    // through separate ownership/permission endpoints).
    if (!this.editMode) {
      check(isBlank(body.ownerId), 'Eigentümer-Organisation (Schritt 7)');
    }

    return missing;
  }

  /**
   * Enters edit mode for an existing indicator: stores the source dataset and
   * pre-fills every wizard field from it. Must be called after
   * {@link loadInitialData} and {@link initializeMultiStepForm} so the option
   * lists, colorbrewer palettes and per-spatial-unit classification tabs already
   * exist to be matched/populated against.
   */
  enterEditMode(dataset: any) {
    this.editMode = true;
    this.editIndicatorDataset = dataset;
    this.editIndicatorId = dataset?.indicatorId ?? null;
    this.populateFromExistingIndicator(dataset);
    // Rebuild the role grid now that editMode/dataset are set: when the access-control
    // data was already cached, prepareOwnerOrganizationList ran before this and built
    // an empty grid; this pass pre-checks the indicator's existing permissions. When
    // the data is still loading, the async prepare pass rebuilds it instead.
    this.rebuildRoleManagementGrid();
  }

  /**
   * Maps a runtime indicator metadata object onto the wizard's form-state fields
   * (the reverse of {@link buildPostBody_indicators_v3}). Resolves option objects
   * by their `apiName`, the topic hierarchy from `topicReference`, references from
   * the stored `referenced*` lists, and the classification breaks per spatial unit.
   */
  private populateFromExistingIndicator(dataset: any) {
    if (!dataset) {
      return;
    }

    // Step 1 — basic metadata
    this.datasetName = dataset.indicatorName ?? '';
    this.indicatorAbbreviation = dataset.abbreviation ?? '';
    this.isHeadlineIndicator = dataset.isHeadlineIndicator ?? false;
    this.indicatorUnit = dataset.unit ?? '';
    this.indicatorProcessDescription = dataset.processDescription ?? '';
    this.indicatorInterpretation = dataset.interpretation ?? '';
    this.indicatorReferenceDateNote = dataset.referenceDateNote ?? '';
    this.displayOrder = dataset.displayOrder ?? 0;
    this.indicatorTagsString_withCommas = Array.isArray(dataset.tags) ? dataset.tags.join(',') : '';

    // Free-text unit toggle: enabled unless the unit matches a configured option.
    this.enableFreeTextUnit = true;
    this.envConfigService.indicatorUnitOptions?.forEach((option: any) => {
      if (option === dataset.unit) {
        this.enableFreeTextUnit = false;
      }
    });

    // Precision
    this.indicatorPrecision = dataset.precision ?? null;
    this.showCustomCommaValue = dataset.defaultPrecision === false;

    // Indicator type (resolve the option object by apiName)
    this.indicatorTypeOptions?.forEach((option: any) => {
      if (option.apiName === dataset.indicatorType) {
        this.indicatorType = option;
      }
    });

    // Creation type
    this.indicatorCreationType = null;
    this.envConfigService.indicatorCreationTypeOptions?.forEach((option: any) => {
      if (option.apiName === dataset.creationType) {
        this.indicatorCreationType = option;
      }
    });
    this.enableLowestSpatialUnitSelect = this.indicatorCreationType?.apiName === 'COMPUTATION';

    // Lowest spatial unit for computation
    this.indicatorLowestSpatialUnitMetadataObjectForComputation = null;
    for (const spatialUnit of this.availableSpatialUnits) {
      if (spatialUnit.spatialUnitLevel === dataset.lowestSpatialUnitForComputation) {
        this.indicatorLowestSpatialUnitMetadataObjectForComputation = spatialUnit;
        break;
      }
    }

    // Step 2 — general metadata
    patchMetadataFormFromApi(this.metadataForm, dataset.metadata, this.updateIntervalOptions ?? []);

    // Step 3 — topic hierarchy
    this.indicatorTopic_mainTopic = null;
    this.indicatorTopic_subTopic = null;
    this.indicatorTopic_subsubTopic = null;
    this.indicatorTopic_subsubsubTopic = null;
    this.selectedTopic = null;
    this.selectedSubTopic = null;
    this.selectedSubSubTopic = null;
    this.selectedSubSubSubTopic = null;
    const topicHierarchy = this.topicHierarchyService.getTopicHierarchyForTopicId(
      this.topicStore.availableTopics,
      dataset.topicReference
    );
    patchTopicHierarchyFromChain(this.addForm.controls.topics, topicHierarchy);

    // Step 4 — references (stored here as { indicatorMetadata | georesourceMetadata,
    // referenceDescription }, matching what the step-4 component and the body
    // builders expect).
    this.indicatorReferences_adminView = [];
    (dataset.referencedIndicators ?? [])
      .filter((entry: any) => entry != null)
      .forEach((ref: any) => {
        const indicatorMetadata = this.indicatorStore.getIndicatorMetadataById(
          ref.referencedIndicatorId
        );
        if (indicatorMetadata) {
          this.indicatorReferences_adminView.push({
            indicatorMetadata,
            referenceDescription: ref.referencedIndicatorDescription,
          });
        }
      });

    this.georesourceReferences_adminView = [];
    (dataset.referencedGeoresources ?? [])
      .filter((entry: any) => entry != null)
      .forEach((ref: any) => {
        const georesourceMetadata = this.georesourceStore.getGeoresourceMetadataById(
          ref.referencedGeoresourceId
        );
        if (georesourceMetadata) {
          this.georesourceReferences_adminView.push({
            georesourceMetadata,
            referenceDescription: ref.referencedGeoresourceDescription,
          });
        }
      });

    // Step 5 — classification mapping (type, palette, breaks, labels, colors, categories)
    this.classification.applyMapping(dataset.defaultClassificationMapping);

    // Step 7 — ownership / access. Pre-filled for display only; the metadata
    // PATCH does not carry ownership or permissions (managed separately).
    this.isPublic = dataset.isPublic ?? false;
    const ownerOrg = (this.accessControlService.accessControl ?? []).find(
      (org: any) => org.organizationalUnitId === dataset.ownerId
    );
    this.ownerOrganization = ownerOrg ?? dataset.ownerId ?? '';
    // The role grid (pre-checking dataset.permissions) is (re)built by enterEditMode /
    // the async access-control load via rebuildRoleManagementGrid.
  }

  /**
   * Builds the metadata PATCH body for editing an existing indicator, following
   * the KomMonitor Data Management API v3 schema `IndicatorMetadataPATCHInputType`.
   * Mirrors {@link buildPostBody_indicators_v3} but omits ownership/permissions
   * (handled via separate endpoints) and preserves the indicator's existing
   * `characteristicValue` and `regionalReferenceValues`, which this wizard does
   * not edit.
   */
  buildPatchBody_indicators_v3() {
    const topicReference =
      this.indicatorTopic_subsubsubTopic?.topicId ??
      this.indicatorTopic_subsubTopic?.topicId ??
      this.indicatorTopic_subTopic?.topicId ??
      this.indicatorTopic_mainTopic?.topicId ??
      '';

    const tags = this.indicatorTagsString_withCommas
      ? this.indicatorTagsString_withCommas.split(',').map((tag: string) => tag.trim())
      : [];

    const patchBody: any = {
      datasetName: this.datasetName,
      // Preserve values the wizard does not edit rather than overwriting them.
      characteristicValue: this.editIndicatorDataset?.characteristicValue ?? null,
      creationType: this.indicatorCreationType?.apiName,
      interpretation: this.indicatorInterpretation || '',
      processDescription: this.indicatorProcessDescription || '',
      unit: this.indicatorUnit,
      topicReference,
      tags,
      abbreviation: this.indicatorAbbreviation || null,
      indicatorType: this.indicatorType?.apiName,
      isHeadlineIndicator: this.isHeadlineIndicator || false,
      displayOrder: this.displayOrder,
      referenceDateNote: this.indicatorReferenceDateNote || null,
      lowestSpatialUnitForComputation:
        this.indicatorLowestSpatialUnitMetadataObjectForComputation?.spatialUnitLevel ?? null,
      metadata: {
        contact: this.metadata.contact,
        datasource: this.metadata.datasource,
        description: this.metadata.description,
        updateInterval: this.metadata.updateInterval?.apiName,
        note: this.metadata.note || null,
        literature: this.metadata.literature || null,
        databasis: this.metadata.databasis || null,
        lastUpdate: this.metadata.lastUpdate || null,
        sridEPSG: this.metadata.sridEPSG || 4326,
      },
      defaultClassificationMapping: this.classification.buildDefaultClassificationMapping(),
      refrencesToOtherIndicators: this.indicatorReferences_adminView.map((ref) => ({
        indicatorId: ref.indicatorMetadata.indicatorId,
        referenceDescription: ref.referenceDescription,
      })),
      refrencesToGeoresources: this.georesourceReferences_adminView.map((ref) => ({
        georesourceId: ref.georesourceMetadata.georesourceId,
        referenceDescription: ref.referenceDescription,
      })),
      // Preserve the existing regional reference values unchanged (not edited here).
      regionalReferenceValues: this.editIndicatorDataset?.regionalReferenceValues ?? [],
    };

    if (this.showCustomCommaValue && this.indicatorPrecision !== null) {
      patchBody.precision = this.indicatorPrecision;
    }

    return patchBody;
  }

  // Import/Export functionality
  async parseMetadataFromFile(file: File) {
    try {
      this.metadataImportSettings = await readJsonFile(file);
      this.applyMetadataImport();
    } catch (error) {
      console.error(error);
      console.error('Uploaded Metadata File cannot be parsed.');
      this.indicatorMetadataImportError = 'Uploaded Metadata File cannot be parsed correctly';
    } finally {
      // The import rewrote plain fields bound by the wizard steps.
      this.bumpStateRevision();
    }
  }

  private applyMetadataImport() {
    if (!this.metadataImportSettings.metadata) {
      console.error('uploaded Metadata File cannot be parsed - wrong structure.');
      this.indicatorMetadataImportError =
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      return;
    }

    // Parse metadata
    patchMetadataFormFromApi(
      this.metadataForm,
      this.metadataImportSettings.metadata,
      this.envConfigService?.updateIntervalOptions ?? []
    );

    // Parse basic fields
    this.datasetName = this.metadataImportSettings.datasetName || '';
    this.indicatorAbbreviation = this.metadataImportSettings.abbreviation || '';
    this.indicatorUnit = this.metadataImportSettings.unit || '';
    this.indicatorProcessDescription = this.metadataImportSettings.processDescription || '';
    this.indicatorInterpretation = this.metadataImportSettings.interpretation || '';
    this.indicatorReferenceDateNote = this.metadataImportSettings.referenceDateNote || '';
    this.displayOrder = this.metadataImportSettings.displayOrder || 0;
    this.isHeadlineIndicator = this.metadataImportSettings.isHeadlineIndicator || false;

    // Parse indicator type
    if (
      this.metadataImportSettings.indicatorType &&
      this.envConfigService &&
      this.envConfigService.indicatorTypeOptions
    ) {
      this.envConfigService.indicatorTypeOptions.forEach((option: any) => {
        if (option.apiName === this.metadataImportSettings.indicatorType) {
          this.indicatorType = option;
        }
      });
    }

    // Parse creation type
    if (this.metadataImportSettings.creationType) {
      // Add creation type options if available
      // this.indicatorCreationType = ...
    }

    // Parse tags
    if (this.metadataImportSettings.tags && Array.isArray(this.metadataImportSettings.tags)) {
      this.indicatorTagsString_withCommas = this.metadataImportSettings.tags.join(', ');
    }

    // Parse references
    if (
      this.metadataImportSettings.refrencesToOtherIndicators &&
      this.indicatorStore.availableIndicators
    ) {
      this.indicatorReferences_apiRequest = this.metadataImportSettings.refrencesToOtherIndicators;
      // Populate admin view
      this.indicatorReferences_adminView = [];
      this.indicatorReferences_apiRequest.forEach((ref: any) => {
        const indicator = this.indicatorStore.availableIndicators.find(
          (ind: any) => ind.indicatorId === ref.indicatorId
        );
        if (indicator) {
          this.indicatorReferences_adminView.push({
            indicatorId: ref.indicatorId,
            referenceDescription: ref.referenceDescription,
            indicatorName: indicator.indicatorName,
          });
        }
      });
    }

    if (
      this.metadataImportSettings.refrencesToGeoresources &&
      this.georesourceStore.availableGeoresources
    ) {
      this.georesourceReferences_apiRequest = this.metadataImportSettings.refrencesToGeoresources;
      // Populate admin view
      this.georesourceReferences_adminView = [];
      this.georesourceReferences_apiRequest.forEach((ref: any) => {
        const georesource = this.georesourceStore.availableGeoresources.find(
          (geo: any) => geo.georesourceId === ref.georesourceId
        );
        if (georesource) {
          this.georesourceReferences_adminView.push({
            georesourceId: ref.georesourceId,
            referenceDescription: ref.referenceDescription,
            georesourceName: georesource.georesourceName,
          });
        }
      });
    }

    // Parse classification mapping (type, palette, breaks, labels, colors, categories)
    if (this.metadataImportSettings.defaultClassificationMapping) {
      this.classification.applyMapping(this.metadataImportSettings.defaultClassificationMapping);
    }

    // Parse role permissions: pre-check the imported allowedRoles in the role grid.
    if (this.metadataImportSettings.allowedRoles) {
      this.storedPermissionIds = [...this.metadataImportSettings.allowedRoles];
      this.attachedRoleGrid?.applyPermissions(this.storedPermissionIds);
    }
  }

  onExportIndicatorAddMetadata() {
    const metadataExport: any = { ...this.indicatorMetadataStructure };

    // Populate with current form data
    metadataExport.datasetName = this.datasetName || '';
    metadataExport.abbreviation = this.indicatorAbbreviation || '';
    metadataExport.unit = this.indicatorUnit || '';
    metadataExport.processDescription = this.indicatorProcessDescription || '';
    metadataExport.interpretation = this.indicatorInterpretation || '';
    metadataExport.referenceDateNote = this.indicatorReferenceDateNote || '';
    metadataExport.displayOrder = this.displayOrder || 0;
    metadataExport.isHeadlineIndicator = this.isHeadlineIndicator || false;

    if (this.indicatorType) {
      metadataExport.indicatorType = this.indicatorType.apiName;
    }

    if (this.indicatorCreationType) {
      metadataExport.creationType = this.indicatorCreationType.apiName;
    }

    if (this.indicatorTagsString_withCommas) {
      metadataExport.tags = this.indicatorTagsString_withCommas
        .split(',')
        .map((tag: string) => tag.trim());
    }

    if (this.showCustomCommaValue && this.indicatorPrecision !== null) {
      metadataExport.precision = this.indicatorPrecision;
    }

    // Add metadata
    metadataExport.metadata.note = this.metadata.note || '';
    metadataExport.metadata.literature = this.metadata.literature || '';
    metadataExport.metadata.sridEPSG = this.metadata.sridEPSG || '';
    metadataExport.metadata.datasource = this.metadata.datasource || '';
    metadataExport.metadata.contact = this.metadata.contact || '';
    metadataExport.metadata.lastUpdate = this.metadata.lastUpdate || '';
    metadataExport.metadata.description = this.metadata.description || '';
    metadataExport.metadata.databasis = this.metadata.databasis || '';

    if (this.metadata.updateInterval) {
      metadataExport.metadata.updateInterval = this.metadata.updateInterval.apiName;
    }

    // Add references
    metadataExport.refrencesToOtherIndicators = this.indicatorReferences_apiRequest;
    metadataExport.refrencesToGeoresources = this.georesourceReferences_apiRequest;

    // Add classification mapping (same shape as the API payload, incl. extended fields)
    metadataExport.defaultClassificationMapping =
      this.classification.buildDefaultClassificationMapping();

    // Add role permissions
    metadataExport.allowedRoles = this.getSelectedRoleIds();

    const name = this.datasetName;
    const metadataJSON = JSON.stringify(metadataExport);
    let fileName = 'Indikator_Metadaten_Export';

    if (name) {
      fileName += '-' + name;
    }

    fileName += '.json';
    downloadJson(fileName, metadataJSON);
  }

  // Metadata structure for export
  get indicatorMetadataStructure() {
    return {
      metadata: {
        note: '',
        literature: '',
        updateInterval: '',
        sridEPSG: '',
        datasource: '',
        contact: '',
        lastUpdate: '',
        description: '',
        databasis: '',
      },
      allowedRoles: [],
      datasetName: '',
      abbreviation: '',
      indicatorType: '',
      isHeadlineIndicator: false,
      unit: '',
      processDescription: '',
      interpretation: '',
      creationType: '',
      lowestSpatialUnitForComputation: '',
      referenceDateNote: '',
      displayOrder: 0,
      refrencesToOtherIndicators: [],
      refrencesToGeoresources: [],
      tags: [],
      precision: null,
      defaultClassificationMapping: {
        colorBrewerSchemeName: '',
        numClasses: 5,
        classificationMethod: 'regional_default',
        items: [],
      },
    };
  }

  get indicatorMetadataStructure_pretty() {
    return JSON.stringify(this.indicatorMetadataStructure, null, 2);
  }

  resetForm() {
    this.stepper.reset();
    this.datasetName = '';
    this.indicatorAbbreviation = '';
    this.indicatorType =
      this.indicatorTypeOptions && this.indicatorTypeOptions.length > 0
        ? this.indicatorTypeOptions[0]
        : null;
    this.isHeadlineIndicator = false;
    this.indicatorUnit = '';
    this.enableFreeTextUnit = false;
    this.indicatorProcessDescription = '';
    this.indicatorTagsString_withCommas = '';
    this.indicatorInterpretation = '';
    this.indicatorCreationType = null;
    this.indicatorLowestSpatialUnitMetadataObjectForComputation =
      this.availableSpatialUnits && this.availableSpatialUnits.length > 0
        ? this.availableSpatialUnits[0]
        : null;
    this.enableLowestSpatialUnitSelect = false;
    this.indicatorPrecision = null;
    this.showCustomCommaValue = false;
    this.indicatorReferenceDateNote = '';
    this.displayOrder = 0;
    this.indicatorTopic_mainTopic = null;
    this.indicatorTopic_subTopic = null;
    this.indicatorTopic_subsubTopic = null;
    this.indicatorTopic_subsubsubTopic = null;

    // Reset Step 3: Topic Hierarchy
    this.selectedTopic = null;
    this.selectedSubTopic = null;
    this.additionalTopic = null;
    this.additionalSubTopic = null;
    this.additionalSubTopics = [];
    this.additionalTopicAssignments = [];
    this.indicatorReferences_adminView = [];
    this.indicatorReferences_apiRequest = [];
    this.georesourceReferences_adminView = [];
    this.georesourceReferences_apiRequest = [];
    this.classification.reset();
    this.ownerOrganization = '';
    this.ownerOrgFilter = '';
    this.isPublic = false;
    this.showRoleForm = false;
    this.storedPermissionIds = null;
    this.seedAttachedRoleGrid();
    this.metadataImportSettings = null;
    this.indicatorMetadataImportError = '';
    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.postBody_indicators = null;
    this.errorMessage = '';
    this.successMessage = '';

    // Reset metadata
    this.metadataForm.reset();

    // Reset temporary variables
    this.indicatorNameFilter = '';
    this.tmpIndicatorReference_selectedIndicatorMetadata = null;
    this.tmpIndicatorReference_referenceDescription = '';
    this.georesourceNameFilter = '';
    this.tmpGeoresourceReference_selectedGeoresourceMetadata = null;
    this.tmpGeoresourceReference_referenceDescription = '';

    // Reset Step 4: Filtered lists
    this.filteredIndicators = this.availableIndicators || [];
    this.filteredGeoresources = this.availableGeoresources || [];

    // Step 5 classification reset handled by this.classification.reset() above.

    // Reset Step 6: Regional Comparison Values
    this.comparisonValueType = null;
    this.comparisonValue = null;
    this.comparisonRegion = null;
    this.comparisonTimeframe = null;
    this.comparisonDescription = '';
    this.evaluationDirection = null;
    this.toleranceRange = null;
    this.additionalComparisonType = null;
    this.additionalComparisonValue = null;
    this.additionalComparisonDescription = '';
    this.additionalComparisonValues = [];
    this.enableBenchmarking = false;
    this.benchmarkingVisualizationType = null;
    this.greenThreshold = null;
    this.yellowThreshold = null;
    this.redThreshold = null;

    // Reset Step 7: Access Control and Ownership
    this.enableTimeRestrictedAccess = false;
    this.enableGeographicRestriction = false;
    this.accessStartDate = '';
    this.accessEndDate = '';
    this.allowedRegions = [];
    this.enableAccessLogging = false;
    this.loadOwnerOrganizations();
  }

  hideSuccessAlert() {
    // The success alert is shown via `successMessagePart`, so clear that field
    // (the legacy `successMessage` alone did not control visibility).
    this.successMessagePart = '';
    this.successMessage = '';
  }

  hideErrorAlert() {
    // The error alert is shown via `errorMessagePart`, so clear that field
    // (the legacy `errorMessage` alone did not control visibility).
    this.errorMessagePart = '';
    this.errorMessage = '';
  }

  hideMetadataErrorAlert() {
    this.indicatorMetadataImportError = '';
  }

  onChangeIndicatorUnit() {
    if (this.indicatorUnit && this.indicatorUnit.includes('Freitext')) {
      this.enableFreeTextUnit = true;
    } else {
      this.enableFreeTextUnit = false;
    }
  }

  onChangeCreationType() {
    if (this.indicatorCreationType && this.indicatorCreationType.apiName === 'COMPUTATION') {
      this.enableLowestSpatialUnitSelect = true;
    } else {
      this.enableLowestSpatialUnitSelect = false;
    }
  }

  /**
   * Selecting an owner reveals the role grid and pre-checks the owner's own
   * viewer/editor permissions. The rebuild hangs off the control's
   * `valueChanges` now; this stays as a programmatic entry point.
   */
  onChangeOwner(ownerOrganization: any) {
    this.ownerOrganization = ownerOrganization;
  }

  onChangeIsPublic(isPublic: boolean) {
    this.isPublic = isPublic;
  }

  // Resolves the currently selected owner organizational-unit id. The dropdown binds
  // the whole org object, edit mode carries only the stored ownerId — handle both.
  private getSelectedOwnerId(): string | undefined {
    if (this.editMode) {
      return this.editIndicatorDataset?.ownerId;
    }
    return this.ownerOrganization?.organizationalUnitId ?? this.ownerOrganization ?? undefined;
  }

  // Permission ids that should be pre-checked in the role grid: the indicator's
  // existing permissions in edit mode, otherwise the selected owner's own
  // viewer/editor permissions (mirrors the legacy `refreshRoles`).
  private getPreCheckedPermissionIds(ownerId: string | undefined): string[] {
    if (this.editMode) {
      return this.editIndicatorDataset?.permissions ?? [];
    }
    if (!ownerId) {
      return [];
    }
    const ownerUnit = this.accessControlService.getAccessControlById(ownerId);
    return (ownerUnit?.permissions ?? [])
      .filter((permission) => ['viewer', 'editor'].includes(permission.permissionLevel))
      .map((permission) => permission.permissionId);
  }

  /**
   * Called by the step-7 access component when its role grid enters the view.
   * Seeds the grid with the harvested selection (or the pre-checked defaults)
   * and the current owner.
   */
  attachRoleGrid(grid: RoleManagementGridComponent) {
    this.attachedRoleGrid = grid;
    this.seedAttachedRoleGrid();
  }

  /**
   * Called by the step-7 access component on destroy: harvests the grid's
   * selection so it survives navigating to another wizard step.
   */
  detachRoleGrid(grid: RoleManagementGridComponent) {
    if (this.attachedRoleGrid === grid) {
      this.storedPermissionIds = grid.getSelectedRoleIds();
      this.attachedRoleGrid = null;
    }
  }

  /** Currently selected role permission ids (live grid if attached, else harvested state). */
  getSelectedRoleIds(): string[] {
    if (this.attachedRoleGrid) {
      return this.attachedRoleGrid.getSelectedRoleIds();
    }
    return this.storedPermissionIds ?? this.getPreCheckedPermissionIds(this.getSelectedOwnerId());
  }

  /**
   * Re-seeds the role selection from the current owner/edit-mode state,
   * discarding manual edits. Toggles `showRoleForm` so the grid is only shown
   * once an owner is selected (or always in edit mode).
   */
  rebuildRoleManagementGrid() {
    const ownerId = this.getSelectedOwnerId();
    this.showRoleForm = !!ownerId;
    this.storedPermissionIds = null;
    this.seedAttachedRoleGrid();
  }

  private seedAttachedRoleGrid() {
    if (!this.attachedRoleGrid) {
      return;
    }
    const ownerId = this.getSelectedOwnerId();
    this.attachedRoleGrid.permissions =
      this.storedPermissionIds ?? this.getPreCheckedPermissionIds(ownerId);
    this.attachedRoleGrid.ownerId = ownerId ?? null;
    this.attachedRoleGrid.reset();
  }

  // Number of currently checked role permissions in the grid (for the summary line).
  get selectedRoleCount(): number {
    return this.getSelectedRoleIds().length;
  }

  // Step 3: Topic Hierarchy Methods.
  // The shared cascade clears the deeper levels and derives the option lists,
  // so these are only template hooks now.
  onTopicChange() {
    // handled by the shared topic cascade
  }

  onSubTopicChange() {
    // handled by the shared topic cascade
  }

  onSubSubTopicChange() {
    // handled by the shared topic cascade
  }

  onSubSubSubTopicChange() {
    // handled by the shared topic cascade
  }

  onAdditionalTopicChange() {
    if (this.additionalTopic) {
      // Load sub-topics for the additional topic
      this.additionalSubTopics = this.additionalTopic.subTopics || [];
      this.additionalSubTopic = null;
    } else {
      this.additionalSubTopics = [];
      this.additionalSubTopic = null;
    }
  }

  addAdditionalTopicAssignment() {
    if (this.additionalTopic && this.additionalSubTopic) {
      // Check if this assignment already exists
      const existingAssignment = this.additionalTopicAssignments.find(
        (assignment) =>
          assignment.topic.topicId === this.additionalTopic.topicId &&
          assignment.subTopic.subTopicId === this.additionalSubTopic.subTopicId
      );

      if (!existingAssignment) {
        // Check if it's the same as the main assignment
        const isMainAssignment =
          this.selectedTopic &&
          this.selectedSubTopic &&
          this.selectedTopic.topicId === this.additionalTopic.topicId &&
          this.selectedSubTopic.subTopicId === this.additionalSubTopic.subTopicId;

        if (!isMainAssignment) {
          this.additionalTopicAssignments.push({
            topic: this.additionalTopic,
            subTopic: this.additionalSubTopic,
          });

          // Reset additional topic selection
          this.additionalTopic = null;
          this.additionalSubTopic = null;
          this.additionalSubTopics = [];
        }
      }
    }
  }

  removeAdditionalTopicAssignment(index: number) {
    if (index >= 0 && index < this.additionalTopicAssignments.length) {
      this.additionalTopicAssignments.splice(index, 1);
    }
  }

  // Step 4: Reference Filtering Methods
  filterIndicators() {
    if (!this.indicatorNameFilter || this.indicatorNameFilter.trim() === '') {
      this.filteredIndicators = this.availableIndicators || [];
    } else {
      const filter = this.indicatorNameFilter.toLowerCase().trim();
      this.filteredIndicators = (this.availableIndicators || []).filter(
        (indicator) => indicator.datasetName && indicator.datasetName.toLowerCase().includes(filter)
      );
    }
  }

  filterGeoresources() {
    if (!this.georesourceNameFilter || this.georesourceNameFilter.trim() === '') {
      this.filteredGeoresources = this.availableGeoresources || [];
    } else {
      const filter = this.georesourceNameFilter.toLowerCase().trim();
      this.filteredGeoresources = (this.availableGeoresources || []).filter(
        (georesource) =>
          georesource.datasetName && georesource.datasetName.toLowerCase().includes(filter)
      );
    }
  }

  // Convert admin view references to API format
  private convertReferencesToApiFormat() {
    // Convert indicator references
    this.indicatorReferences_apiRequest = this.indicatorReferences_adminView.map((ref) => ({
      referencedIndicatorName: ref.indicatorMetadata.datasetName,
      referencedIndicatorId: ref.indicatorMetadata.indicatorId,
      referencedIndicatorAbbreviation: ref.indicatorMetadata.abbreviation,
      referencedIndicatorDescription: ref.referenceDescription,
    }));

    // Convert georesource references
    this.georesourceReferences_apiRequest = this.georesourceReferences_adminView.map((ref) => ({
      referencedGeoresourceName: ref.georesourceMetadata.datasetName,
      referencedGeoresourceId: ref.georesourceMetadata.georesourceId,
      referencedGeoresourceDescription: ref.referenceDescription,
    }));
  }

  // Step 5 classification methods moved to IndicatorClassificationStateService
  // (accessible via `this.classification`).

  // Step 6: Regional Comparison Methods
  onComparisonValueTypeChange() {
    // Reset comparison value when type changes
    if (this.comparisonValueType === null) {
      this.comparisonValue = null;
    }
  }

  addAdditionalComparisonValue() {
    if (this.additionalComparisonType && this.additionalComparisonValue !== null) {
      // Check if this comparison already exists
      const existingComparison = this.additionalComparisonValues.find(
        (comparison) =>
          comparison.type === this.additionalComparisonType &&
          comparison.value === this.additionalComparisonValue
      );

      if (!existingComparison) {
        this.additionalComparisonValues.push({
          type: this.additionalComparisonType,
          value: this.additionalComparisonValue,
          description: this.additionalComparisonDescription || '',
        });

        // Reset additional comparison inputs
        this.additionalComparisonType = null;
        this.additionalComparisonValue = null;
        this.additionalComparisonDescription = '';
      }
    }
  }

  removeAdditionalComparisonValue(index: number) {
    if (index >= 0 && index < this.additionalComparisonValues.length) {
      this.additionalComparisonValues.splice(index, 1);
    }
  }

  getComparisonTypeDisplayName(type: string): string {
    const typeMap: { [key: string]: string } = {
      target: 'Zielwert',
      average: 'Durchschnittswert',
      median: 'Medianwert',
      best_practice: 'Best Practice',
      threshold: 'Schwellenwert',
      custom: 'Benutzerdefiniert',
    };
    return typeMap[type] || type;
  }

  // Step 7: Access Control Methods

  /**
   * Loads the access-control data backing the owner-organization picker. The list
   * is populated straight away when the admin service already holds it, otherwise
   * it is fetched lazily (cache-first) and the picker is built once it arrives.
   */
  loadOwnerOrganizations() {
    if (this.accessControlService.accessControl?.length > 0) {
      this.prepareOwnerOrganizationList();
    } else {
      this.metadataBootstrap
        .fetchAccessControlMetadata(this.accessControlService.currentKeycloakLoginRoles)
        .then(() => this.prepareOwnerOrganizationList())
        .catch(() => {
          this.ownerOrganizations = [];
          this.filteredOrganizations = [];
        });
    }
  }

  /**
   * Builds the list of organizations the current user may assign as the indicator's
   * owner, mirroring the legacy addIndicator modal:
   *  - realm admins may pick any organizational unit (full accessControl list);
   *  - other users may only pick units they hold resource-creator rights for
   *    (`unit-resources-creator` directly, `client-resources-creator` including all
   *    descendant units — see {@link gatherCreatorRightsChildren}).
   * Seeds the base list and refreshes the filtered view shown in the dropdown.
   */
  prepareOwnerOrganizationList() {
    if (this.accessControlService.checkAdminPermission()) {
      this.ownerOrganizations = this.accessControlService.accessControl || [];
    } else {
      this.ownerOrganizations = this.buildResourcesCreatorRights();
    }
    this.filterOrganizations();
    // Access-control data is now present, so (re)build the role-management grid. In
    // edit mode this pre-checks the indicator's existing permissions; in add mode it
    // stays empty until an owner is chosen.
    this.rebuildRoleManagementGrid();
    // May run from the async access-control fetch (OnPush wizard steps).
    this.bumpStateRevision();
  }

  private buildResourcesCreatorRights(): any[] {
    const roleNames = this.accessControlService.currentKomMonitorLoginRoleNames || [];
    if (roleNames.length === 0) {
      return [];
    }

    const creatorRights: string[] = [];
    const creatorRightsChildren: string[] = [];
    roleNames.forEach((role: string) => {
      const orgName = role.split('.')[0];
      const roleSuffix = role.split('.')[1];

      if (roleSuffix === 'unit-resources-creator' && !creatorRights.includes(orgName)) {
        creatorRights.push(orgName);
      }
      // client-resources-creator grants rights on the whole subtree; gather the
      // unit ids first, then resolve all descendant units below.
      if (roleSuffix === 'client-resources-creator' && !creatorRightsChildren.includes(orgName)) {
        creatorRightsChildren.push(orgName);
      }
    });

    this.gatherCreatorRightsChildren(creatorRights, creatorRightsChildren);

    return (this.accessControlService.accessControl || []).filter((unit) =>
      creatorRights.includes(unit.name)
    );
  }

  // Recursively collect the names of all descendant units for the given parent
  // units (client-resources-creator implies rights on every child unit).
  private gatherCreatorRightsChildren(creatorRights: string[], creatorRightsChildren: string[]) {
    if (creatorRightsChildren.length === 0) {
      return;
    }

    const accessControl = this.accessControlService.accessControl || [];
    accessControl
      .filter((unit) => creatorRightsChildren.includes(unit.name))
      .flatMap((unit) => unit.children || [])
      .forEach((childId: string) => {
        accessControl
          .filter((unit) => unit.organizationalUnitId === childId)
          .forEach((childUnit) => {
            if (!creatorRights.includes(childUnit.name)) {
              creatorRights.push(childUnit.name);
            }
            this.gatherCreatorRightsChildren(creatorRights, [childUnit.name]);
          });
      });
  }

  filterOrganizations() {
    const baseList = this.ownerOrganizations || [];
    if (!this.ownerOrgFilter || this.ownerOrgFilter.trim() === '') {
      this.filteredOrganizations = baseList;
    } else {
      const filter = this.ownerOrgFilter.toLowerCase().trim();
      this.filteredOrganizations = baseList.filter(
        (org) => org.name && org.name.toLowerCase().includes(filter)
      );
    }
  }

  clearOwnerFilter() {
    this.ownerOrgFilter = '';
    this.filterOrganizations();
  }

  // Multi-step navigation (delegates kept: the seven step components bind
  // state.nextStep()/state.previousStep() in their templates)
  nextStep() {
    this.stepper.next();
  }

  previousStep() {
    this.stepper.previous();
  }

  goToStep(step: number) {
    // Allow navigation to any step without validation (like old AngularJS counterpart)
    this.stepper.goTo(step);
  }
}
