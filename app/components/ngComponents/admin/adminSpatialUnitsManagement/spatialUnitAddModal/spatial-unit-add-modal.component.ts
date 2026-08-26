import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SpatialUnitRefreshRequest } from '../spatial-unit-refresh.model';
import { NgbActiveModal, NgbDatepicker } from '@ng-bootstrap/ng-bootstrap';
import { KommonitorImporterHelperService } from '../../../../../services/adminSpatialUnit/kommonitor-importer-helper.service';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import {
  LABELED_LOI_DASH_ARRAY_OBJECTS,
  SPATIAL_UNIT_METADATA_STRUCTURE,
  buildMappingConfigExport,
  buildSpatialUnitMetadataExport,
} from 'services/adminSpatialUnit/spatial-unit-metadata.util';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from '../../adminShared/roleManagementPanel/owner-organization-select.component';

import { KmColorPickerComponent } from '../../../customElements/color-picker/km-color-picker.component';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
import { KmDatePickerComponent } from '../../../customElements/date-picker/km-date-picker.component';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import {
  addOrUpdateAttributeMapping,
  getErrorMessage,
  removeAttributeMapping,
} from '../spatial-unit-import.util';
import type {
  AttributeMappingRow,
  DatasourceType,
  ImporterObjectsConfig,
  MappingConfigImport,
} from 'services/resource-import-service/resource-import.model';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { ResourceMetadataFormComponent } from '../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { FormControlAriaDirective } from '../../adminShared/formError/form-control-aria.directive';
import {
  patchMetadataFormFromApi,
  ResourceMetadataFormGroup,
  ResourceMetadataFormValue,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import { controlInvalidSignal } from '../../adminShared/forms/control-state';
import { patchPeriodOfValidityForm } from '../../adminShared/periodOfValidityForm/period-of-validity-form.model';
import {
  attributeMappingDraftToRow,
  buildAttributeMappingDraftForm,
  patchAttributeMappingDraft,
  resetAttributeMappingDraft,
} from '../../adminShared/attributeMappingDraftForm/attribute-mapping-draft-form.model';
import {
  BboxType,
  ImporterFormGroup,
  importerFormToConfig,
  patchBboxFromDataSourceParameters,
  patchImporterFormFromMappingConfig,
  syncConverterParameterControls,
  syncDatasourceParameterControls,
} from '../../adminShared/importerForm/importer-form.model';
import {
  DEFAULT_OUTLINE_COLOR,
  DEFAULT_OUTLINE_WIDTH,
  SpatialUnitAddPostBody,
  buildSpatialUnitAddForm,
  spatialUnitAddFormToApi,
} from './spatial-unit-add-form.model';

// Removed in favor of standalone km-date-picker component providers

@Component({
  selector: 'app-spatial-unit-add-modal',
  templateUrl: './spatial-unit-add-modal.component.html',
  styleUrls: ['./spatial-unit-add-modal.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
    KmDatePickerComponent,
    StepperComponent,
    ResourceMetadataFormComponent,
    FormErrorComponent,
    FormControlAriaDirective,
    RoleManagementGridComponent,
    OwnerOrganizationSelectComponent,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialUnitAddModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  protected envConfigService = inject(EnvConfigService);
  private accessControlService = inject(AccessControlService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private indicatorValueService = inject(IndicatorValueService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  kommonitorImporterHelperService = inject(KommonitorImporterHelperService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private resourceImportService = inject(ResourceImportService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  /** Emitted after a spatial unit was added so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('spatialUnitDataSourceInput', { static: false })
  spatialUnitDataSourceInput!: ElementRef;
  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;
  // datepickers handled by km-date-picker
  @ViewChild('lastUpdateDatepicker', { static: false }) lastUpdateDatepicker!: NgbDatepicker;

  // Form data — signal: toggled across await boundaries (OnPush).
  loadingData = signal(false);

  /**
   * Typed model of the whole wizard, one child group per stepper step. The
   * fields below are being migrated onto it step by step; until that is
   * finished they stay as plain properties.
   */
  readonly addForm = buildSpatialUnitAddForm({
    withSecurity: this.envConfigService.enableKeycloakSecurity,
    existingLevelNames: () =>
      (this.availableSpatialUnits ?? []).map((unit: any) => unit.spatialUnitLevel),
    orderedSpatialUnits: () => this.spatialUnitStore.availableSpatialUnits ?? [],
  });

  // Per-step validity for the stepper marking. Reading these signals from the
  // template re-renders this OnPush host, which in turn hands <app-stepper> a
  // new steps array.
  private readonly metadataStepInvalid = controlInvalidSignal(this.addForm.controls.metadata, {
    whenTouched: true,
  });
  private readonly generalStepInvalid = controlInvalidSignal(this.addForm.controls.general, {
    whenTouched: true,
  });
  private readonly securityStepInvalid = controlInvalidSignal(this.addForm.controls.security, {
    whenTouched: true,
  });
  private readonly dataStepInvalid = controlInvalidSignal(this.addForm.controls.data, {
    whenTouched: true,
  });

  // Multi-step form; the security step is only present when Keycloak is
  // enabled, mirroring the conditional fieldset in the template.
  readonly stepper = new WizardStepper([
    {
      key: 'metadata',
      label: 'ADMIN_SHARED_UI.STEP_LABELS.SPATIAL_UNIT_METADATA',
      invalid: this.metadataStepInvalid,
    },
    {
      key: 'general',
      label: 'ADMIN_SHARED_UI.STEP_LABELS.GENERAL_METADATA',
      invalid: this.generalStepInvalid,
    },
    {
      key: 'security',
      label: 'ADMIN_SHARED_UI.SECURITY.ACCESS_OWNERSHIP_TITLE',
      when: () => this.envConfigService.enableKeycloakSecurity,
      invalid: this.securityStepInvalid,
    },
    {
      key: 'data',
      label: 'ADMIN_SHARED_UI.STEP_LABELS.SPATIAL_DATASET',
      invalid: this.dataStepInvalid,
    },
  ]);

  // Basic form data — transitional accessors onto addForm.controls.metadata.
  get spatialUnitLevel(): string {
    return this.addForm.controls.metadata.controls.spatialUnitLevel.value;
  }
  set spatialUnitLevel(value: string) {
    this.addForm.controls.metadata.controls.spatialUnitLevel.setValue(value ?? '');
  }
  get spatialUnitLevelInvalid(): boolean {
    return this.addForm.controls.metadata.controls.spatialUnitLevel.hasError('uniqueName');
  }

  /**
   * The shared "Allgemeine Metadaten" block. Returns the same instance on every
   * call — never rebuild it here, or `<app-resource-metadata-form>` would
   * rebind a fresh group on each change-detection pass.
   */
  get metadataForm(): ResourceMetadataFormGroup {
    return this.addForm.controls.general;
  }

  /** Read-only view of the metadata form value for post-body/export building. */
  get metadata(): ResourceMetadataFormValue {
    return this.metadataForm.getRawValue();
  }

  // Hierarchy
  get nextLowerHierarchySpatialUnit(): any {
    return this.addForm.controls.metadata.controls.nextLowerHierarchySpatialUnit.value;
  }
  set nextLowerHierarchySpatialUnit(value: any) {
    this.addForm.controls.metadata.controls.nextLowerHierarchySpatialUnit.setValue(value ?? null);
  }
  get nextUpperHierarchySpatialUnit(): any {
    return this.addForm.controls.metadata.controls.nextUpperHierarchySpatialUnit.value;
  }
  set nextUpperHierarchySpatialUnit(value: any) {
    this.addForm.controls.metadata.controls.nextUpperHierarchySpatialUnit.setValue(value ?? null);
  }
  get hierarchyInvalid(): boolean {
    return this.addForm.controls.metadata.hasError('spatialUnitHierarchy');
  }

  // Outline layer settings
  get isOutlineLayer(): boolean {
    return this.addForm.controls.metadata.controls.isOutlineLayer.value;
  }
  set isOutlineLayer(value: boolean) {
    this.addForm.controls.metadata.controls.isOutlineLayer.setValue(!!value);
  }
  get outlineWidth(): number {
    return this.addForm.controls.metadata.controls.outlineWidth.value;
  }
  set outlineWidth(value: number) {
    this.addForm.controls.metadata.controls.outlineWidth.setValue(value ?? DEFAULT_OUTLINE_WIDTH);
  }

  // Period of validity — transitional accessors onto
  // addForm.controls.data.controls.periodOfValidity.
  get periodOfValidity(): { startDate: any; endDate: any } {
    return this.addForm.controls.data.controls.periodOfValidity.getRawValue();
  }
  set periodOfValidity(value: { startDate: any; endDate: any } | null | undefined) {
    patchPeriodOfValidityForm(this.addForm.controls.data.controls.periodOfValidity, value);
  }
  get periodOfValidityInvalid(): boolean {
    return this.addForm.controls.data.controls.periodOfValidity.hasError('periodOfValidity');
  }

  // Available options
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  availableDatasourceTypes: DatasourceType[] = [];
  availableLoiDashArrayObjects: any[] = [];

  // Importer functionality — the shared typed sub-form.
  get importerForm(): ImporterFormGroup {
    return this.addForm.controls.data.controls.importer;
  }

  // Transitional accessors onto the importer form.
  get converter(): any {
    return this.importerForm.controls.converter.value;
  }
  set converter(value: any) {
    this.importerForm.controls.converter.setValue(value ?? null);
  }
  get schema(): string {
    return this.importerForm.controls.schema.value;
  }
  set schema(value: string) {
    this.importerForm.controls.schema.setValue(value ?? '');
  }
  get mimeType(): string {
    return this.importerForm.controls.mimeType.value;
  }
  set mimeType(value: string) {
    this.importerForm.controls.mimeType.setValue(value ?? '');
  }
  get datasourceType(): any {
    return this.importerForm.controls.datasourceType.value;
  }
  set datasourceType(value: any) {
    this.importerForm.controls.datasourceType.setValue(value ?? null);
  }
  selectedDataSourceFile: File | null = null;
  get spatialUnitDataSourceIdProperty(): string {
    return this.importerForm.controls.idProperty.value;
  }
  set spatialUnitDataSourceIdProperty(value: string) {
    this.importerForm.controls.idProperty.setValue(value ?? '');
  }
  get spatialUnitDataSourceNameProperty(): string {
    return this.importerForm.controls.nameProperty.value;
  }
  set spatialUnitDataSourceNameProperty(value: string) {
    this.importerForm.controls.nameProperty.setValue(value ?? '');
  }

  // Bbox parameters for OGCAPI_FEATURES
  get bboxType(): string {
    return this.importerForm.controls.bboxType.value;
  }
  set bboxType(value: string) {
    this.importerForm.controls.bboxType.setValue((value ?? '') as BboxType);
  }
  get bboxRefSpatialUnit(): any {
    return this.importerForm.controls.bboxRefSpatialUnitId.value;
  }
  set bboxRefSpatialUnit(value: any) {
    this.importerForm.controls.bboxRefSpatialUnitId.setValue(value ?? '');
  }

  // Attribute mapping
  /**
   * Staging row above the mapping table. Deliberately *not* part of `addForm`:
   * it is not submitted, and its required rules must not gate the wizard.
   */
  readonly attributeMappingDraft = buildAttributeMappingDraftForm();
  get attributeMapping_sourceAttributeName(): string {
    return this.attributeMappingDraft.controls.sourceName.value;
  }
  set attributeMapping_sourceAttributeName(value: string) {
    this.attributeMappingDraft.controls.sourceName.setValue(value ?? '');
  }
  get attributeMapping_destinationAttributeName(): string {
    return this.attributeMappingDraft.controls.destinationName.value;
  }
  set attributeMapping_destinationAttributeName(value: string) {
    this.attributeMappingDraft.controls.destinationName.setValue(value ?? '');
  }
  get attributeMapping_attributeType(): any {
    return this.attributeMappingDraft.controls.dataType.value;
  }
  set attributeMapping_attributeType(value: any) {
    this.attributeMappingDraft.controls.dataType.setValue(value ?? null);
  }
  attributeMappings_adminView: AttributeMappingRow[] = [];
  get keepAttributes(): boolean {
    return this.importerForm.controls.keepAttributes.value;
  }
  set keepAttributes(value: boolean) {
    this.importerForm.controls.keepAttributes.setValue(!!value);
  }
  get keepMissingValues(): boolean {
    return this.importerForm.controls.keepMissingValues.value;
  }
  set keepMissingValues(value: boolean) {
    this.importerForm.controls.keepMissingValues.setValue(!!value);
  }

  // Persisted parameter values for converter and datasource type
  get converterParameterValues(): { [key: string]: string } {
    return this.importerForm.controls.converterParameters.getRawValue();
  }
  get datasourceTypeParameterValues(): { [key: string]: string } {
    return this.importerForm.controls.datasourceTypeParameters.getRawValue();
  }

  // Validity dates per feature
  get validityStartDate_perFeature(): string {
    return this.importerForm.controls.validStartDateProperty.value;
  }
  set validityStartDate_perFeature(value: string) {
    this.importerForm.controls.validStartDateProperty.setValue(value ?? '');
  }
  get validityEndDate_perFeature(): string {
    return this.importerForm.controls.validEndDateProperty.value;
  }
  set validityEndDate_perFeature(value: string) {
    this.importerForm.controls.validEndDateProperty.setValue(value ?? '');
  }

  // Role management (grid handled by <app-role-management-grid>).
  // Transitional accessors onto addForm.controls.security — they keep the
  // existing call sites and the component spec working while the template is
  // migrated, and are removed in the final clean-up step.
  get ownerOrganization(): string {
    return this.addForm.controls.security.controls.ownerOrganization.value;
  }
  set ownerOrganization(value: string) {
    this.addForm.controls.security.controls.ownerOrganization.setValue(value ?? '');
  }
  get isPublic(): boolean {
    return this.addForm.controls.security.controls.isPublic.value;
  }
  set isPublic(value: boolean) {
    this.addForm.controls.security.controls.isPublic.setValue(!!value);
  }

  // Import/Export functionality
  metadataImportSettings: any = null;
  // Signals: written from async import callbacks (OnPush).
  spatialUnitMetadataImportError = signal('');
  spatialUnitMappingConfigImportError = signal('');

  // Import result data — signals: written after importer responses (OnPush).
  importerErrors = signal<any[]>([]);
  importedFeatures = signal<any[]>([]);

  // Importer objects
  converterDefinition: any = null;
  datasourceTypeDefinition: any = null;
  propertyMappingDefinition: any = null;
  postBody_spatialUnits: any = null;

  // Missing properties from original component
  get outlineColor(): string {
    return this.addForm.controls.metadata.controls.outlineColor.value;
  }
  set outlineColor(value: string) {
    this.addForm.controls.metadata.controls.outlineColor.setValue(value || DEFAULT_OUTLINE_COLOR);
  }
  get selectedOutlineDashArrayObject(): LinePatternOption | null {
    return this.addForm.controls.metadata.controls.outlineDashArray.value;
  }
  set selectedOutlineDashArrayObject(value: LinePatternOption | null) {
    this.addForm.controls.metadata.controls.outlineDashArray.setValue(value ?? null);
  }
  spatialUnitMetadataStructure_pretty: string = '';
  spatialUnitMappingConfigStructure: any = {};

  // Role form visibility
  showRoleForm = false;

  // Color picker handled by km-color-picker
  // Line pattern picker handled by km-line-pattern-picker

  // Built once: a getter would hand out fresh objects on every change-detection
  // pass, which breaks reference identity with the selected option (and makes
  // the picker's ngOnChanges fire forever).
  readonly availableLinePatternOptions: LinePatternOption[] = (
    LABELED_LOI_DASH_ARRAY_OBJECTS || []
  ).map((option) => ({
    label: option.label,
    dashArrayValue: option.dashArrayValue,
    svgString: option.svgString,
  }));

  ngOnInit() {
    this.loadInitialData();
    this.initializeOutlineLayerSettings();
    this.initializeMetadataStructures();

    // Side effects of picking an owning organization; the value itself lives in
    // the form now.
    this.addForm.controls.security.controls.ownerOrganization.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ownerOrganization) => this.applyOwnerOrganization(ownerOrganization));

    // The importer selects no longer carry (change) handlers; their dependent
    // fields and parameter controls are rebuilt from the form instead.
    this.importerForm.controls.converter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onChangeConverter());
    this.importerForm.controls.datasourceType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((datasourceType) => this.applyDatasourceTypeChange(datasourceType));
  }

  /** Seeds the role grid and reveals the permission block for a chosen owner. */
  private applyOwnerOrganization(ownerOrganization: string): void {
    this.roleGrid?.applyOwner(ownerOrganization);
    this.showRoleForm = !!ownerOrganization;
    this.cdr.markForCheck();
  }

  private async loadInitialData() {
    this.loadingData.set(true);

    // Load available spatial units
    if (this.spatialUnitStore.availableSpatialUnits) {
      this.availableSpatialUnits = this.spatialUnitStore.availableSpatialUnits;
    }

    // Load update interval options
    if (this.envConfigService.updateIntervalOptions) {
      this.updateIntervalOptions = this.envConfigService.updateIntervalOptions;
    } else {
      // no branch action required
    }

    // Initialize attribute mapping types
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    if (attributeMappingTypes && attributeMappingTypes.length > 0) {
      this.attributeMapping_attributeType = attributeMappingTypes[0];
    }

    // Ensure importer resources are fetched before reading converters/datasource types
    try {
      await this.kommonitorImporterHelperService.fetchResourcesFromImporter();
    } catch {
      // best-effort: ignore resource fetch errors
    }

    // Load datasource types from importer helper after fetch
    this.loadDatasourceTypes();

    // Load access control data and prepare creator list
    this.loadAccessControlData();

    // Initialize metadata structures
    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;

    // Several select options above are assigned after awaiting the importer
    // resources — mark the OnPush view once instead of signalling each field.
    this.cdr.markForCheck();
  }

  private loadAccessControlData() {
    // The role grid / owner select load their own access-control data; this
    // only keeps the modal's loading overlay in sync.
    if (
      this.accessControlService.accessControl &&
      this.accessControlService.accessControl.length > 0
    ) {
      this.loadingData.set(false);
    } else {
      this.metadataBootstrap
        .fetchAccessControlMetadata(this.accessControlService.currentKeycloakLoginRoles)
        .finally(() => {
          this.loadingData.set(false);
        });
    }
  }

  private loadDatasourceTypes(): void {
    const datasourceTypes = this.kommonitorImporterHelperService.getAvailableDatasourceTypes();
    this.availableDatasourceTypes = datasourceTypes || [];
  }

  private initializeOutlineLayerSettings() {
    this.selectedOutlineDashArrayObject = this.defaultOutlineDashArray();
    this.availableLoiDashArrayObjects = LABELED_LOI_DASH_ARRAY_OBJECTS || [];
  }

  private initializeMetadataStructures() {
    this.spatialUnitMetadataStructure_pretty = this.indicatorValueService.syntaxHighlightJSON(
      SPATIAL_UNIT_METADATA_STRUCTURE
    );
    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;
  }

  /**
   * Kept as an entry point for callers that used to trigger the check by hand;
   * the rule itself is `uniqueNameValidator` on the control now.
   */
  checkSpatialUnitName() {
    this.addForm.controls.metadata.controls.spatialUnitLevel.updateValueAndValidity();
  }

  /** See `checkSpatialUnitName` — the rule is `spatialUnitHierarchyValidator`. */
  checkSpatialUnitHierarchy() {
    this.addForm.controls.metadata.updateValueAndValidity();
  }

  /** See `checkSpatialUnitName` — the rule is `periodOfValidityValidator`. */
  checkPeriodOfValidity() {
    this.addForm.controls.data.controls.periodOfValidity.updateValueAndValidity();
  }

  // Attribute mapping methods
  onAddOrUpdateAttributeMapping() {
    this.attributeMappings_adminView = addOrUpdateAttributeMapping(
      this.attributeMappings_adminView,
      attributeMappingDraftToRow(this.attributeMappingDraft)
    );

    resetAttributeMappingDraft(this.attributeMappingDraft, this.defaultAttributeMappingType());
  }

  onClickEditAttributeMapping(attributeMappingEntry: any) {
    patchAttributeMappingDraft(this.attributeMappingDraft, attributeMappingEntry);
  }

  /** First attribute-mapping type offered by the importer, if it has loaded. */
  private defaultAttributeMappingType(): any {
    return this.kommonitorImporterHelperService.getAttributeMappingTypes()?.[0] ?? null;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any) {
    this.attributeMappings_adminView = removeAttributeMapping(
      this.attributeMappings_adminView,
      attributeMappingEntry.sourceName
    );
  }

  /** Seeds schema/mime type and rebuilds the parameter controls for a converter. */
  onChangeConverter(_schema?: any) {
    const converter = this.converter;
    this.schema = converter?.schemas ? converter.schemas[0] : '';
    this.mimeType = converter?.mimeTypes ? converter.mimeTypes[0] : '';
    syncConverterParameterControls(this.importerForm, converter);
  }

  onChangeMimeType(mimeType: any) {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any) {
    this.datasourceType = datasourceType;
  }

  /**
   * Clears everything that depends on the data source type. Called from the
   * control's `valueChanges`, so it must not write the control back.
   */
  private applyDatasourceTypeChange(datasourceType: any): void {
    this.selectedDataSourceFile = null;
    this.spatialUnitDataSourceIdProperty = '';
    this.spatialUnitDataSourceNameProperty = '';
    this.bboxType = '';
    this.bboxRefSpatialUnit = '';
    this.importerForm.controls.bbox.reset();
    syncDatasourceParameterControls(this.importerForm, datasourceType);
  }

  onSpatialUnitFileSelected(event: any) {
    const file = event?.target?.files?.[0] as File | undefined;
    this.selectedDataSourceFile = file ?? null;
  }

  onChangeOutlineDashArray(outlineDashArrayObject: LinePatternOption | null) {
    this.selectedOutlineDashArrayObject = outlineDashArrayObject;
  }

  // Color picker logic removed; handled by km-color-picker

  // Date picker methods
  // Datepicker toggling handled by km-date-picker

  // Ensure valid date or set to today's date on blur
  // Date normalization handled by km-date-picker

  // Importer object building methods
  /** Snapshot of the current form state passed to the shared import service. */
  private importerObjectsConfig(): ImporterObjectsConfig {
    return {
      converter: this.converter,
      schema: this.schema,
      mimeType: this.mimeType,
      converterParameterValues: this.converterParameterValues,
      datasourceType: this.datasourceType,
      datasourceTypeFormValues: this.assembleDatasourceFormValues(),
      selectedFile: this.selectedDataSourceFile,
      fileInputElement: this.spatialUnitDataSourceInput?.nativeElement,
      idProperty: this.spatialUnitDataSourceIdProperty,
      nameProperty: this.spatialUnitDataSourceNameProperty,
      validStartDate: this.validityStartDate_perFeature,
      validEndDate: this.validityEndDate_perFeature,
      keepAttributes: this.keepAttributes,
      keepMissingValues: this.keepMissingValues,
      attributeMappings: this.attributeMappings_adminView,
    };
  }

  /** Add-modal data-source params: bbox fields are always included. */
  private assembleDatasourceFormValues(): { [key: string]: string } {
    return importerFormToConfig(this.importerForm).datasourceTypeFormValues;
  }

  async buildImporterObjects() {
    try {
      const definitions = await this.resourceImportService.buildImporterObjects(
        this.importerObjectsConfig()
      );
      this.converterDefinition = definitions.converterDefinition;
      this.datasourceTypeDefinition = definitions.datasourceTypeDefinition;
      this.propertyMappingDefinition = definitions.propertyMappingDefinition;
      this.postBody_spatialUnits = this.buildPostBody_spatialUnits();

      return !!(
        this.converterDefinition &&
        this.datasourceTypeDefinition &&
        this.propertyMappingDefinition &&
        this.postBody_spatialUnits
      );
    } catch (error: any) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_SPATIAL_UNITS.ADD_MODAL.MSG.DATASOURCE_BUILD_FAILED', {
          error: getErrorMessage(error),
        })
      );
      this.loadingData.set(false);
      return false;
    }
  }

  /** POST body for the importer; the role grid stays imperative. */
  buildPostBody_spatialUnits(): SpatialUnitAddPostBody {
    return spatialUnitAddFormToApi(this.addForm, this.roleGrid?.getSelectedRoleIds() ?? []);
  }

  async addSpatialUnit() {
    this.loadingData.set(true);
    this.importerErrors.set([]);

    const allDataSpecified = await this.buildImporterObjects();

    if (!allDataSpecified) {
      // TODO: Add form validation here
      this.loadingData.set(false);
      return;
    } else {
      let newSpatialUnitResponse_dryRun: any = undefined;
      try {
        newSpatialUnitResponse_dryRun =
          await this.kommonitorImporterHelperService.registerNewSpatialUnit(
            this.converterDefinition,
            this.datasourceTypeDefinition,
            this.propertyMappingDefinition,
            this.postBody_spatialUnits,
            true // isDryRun
          );

        if (
          !this.kommonitorImporterHelperService.importerResponseContainsErrors(
            newSpatialUnitResponse_dryRun
          )
        ) {
          // all good, really execute the request to import data against data management API
          const newSpatialUnitResponse =
            await this.kommonitorImporterHelperService.registerNewSpatialUnit(
              this.converterDefinition,
              this.datasourceTypeDefinition,
              this.propertyMappingDefinition,
              this.postBody_spatialUnits,
              false // isDryRun
            );

          this.refreshRequested.emit({
            crudType: 'add',
            targetSpatialUnitId:
              this.kommonitorImporterHelperService.getIdFromImporterResponse(
                newSpatialUnitResponse
              ),
          });

          const importedFeatures =
            this.kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(
              newSpatialUnitResponse
            );
          this.importedFeatures.set(importedFeatures || []);

          this.loadingData.set(false);
          const featureCount = this.importedFeatures().length;
          this.notificationService.showSuccess(
            featureCount > 0
              ? this.translate.instant(
                  'ADMIN_SPATIAL_UNITS.ADD_MODAL.MSG.REGISTERED_WITH_FEATURES',
                  { name: this.postBody_spatialUnits.spatialUnitLevel, count: featureCount }
                )
              : this.translate.instant('ADMIN_SPATIAL_UNITS.ADD_MODAL.MSG.REGISTERED', {
                  name: this.postBody_spatialUnits.spatialUnitLevel,
                })
          );
          this.activeModal.close({ action: 'added' });
        } else {
          // Dry-run reported import errors: keep the modal open and list the
          // affected feature IDs inline; summarise via a toast.
          const errors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(
            newSpatialUnitResponse_dryRun
          );
          this.importerErrors.set(errors || []);

          this.loadingData.set(false);
          this.notificationService.showError(
            this.translate.instant('ADMIN_SPATIAL_UNITS.ADD_MODAL.MSG.CRITICAL_FEATURE_ERRORS')
          );
        }
      } catch (error: any) {
        if (newSpatialUnitResponse_dryRun) {
          const errors = this.kommonitorImporterHelperService.getErrorsFromImporterResponse(
            newSpatialUnitResponse_dryRun
          );
          this.importerErrors.set(errors || []);
        }

        this.loadingData.set(false);
        this.notificationService.showError(
          this.translate.instant('ADMIN_SPATIAL_UNITS.ADD_MODAL.MSG.REGISTRATION_FAILED', {
            error: getErrorMessage(error),
          })
        );
      }
    }
  }

  onSubmit() {
    if (!this.spatialUnitLevelInvalid && !this.hierarchyInvalid) {
      this.addSpatialUnit();
    } else {
      this.loadingData.set(false);
    }
  }

  // Import/Export functionality
  onImportSpatialUnitAddMetadata() {
    this.spatialUnitMetadataImportError.set('');
    if (this.metadataImportFile) {
      this.metadataImportFile.nativeElement.click();
    }
  }

  onImportSpatialUnitAddMappingConfig() {
    this.spatialUnitMappingConfigImportError.set('');
    if (this.mappingConfigImportFile) {
      this.mappingConfigImportFile.nativeElement.click();
    }
  }

  onMetadataFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.parseMetadataFromFile(file);
    }
  }

  async onMappingConfigFileSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (!file) {
      return;
    }
    this.spatialUnitMappingConfigImportError.set('');
    try {
      const json = await this.resourceImportService.readJsonFile(file);
      this.applyMappingConfig(this.resourceImportService.parseMappingConfig(json));
    } catch (error) {
      this.spatialUnitMappingConfigImportError.set(getErrorMessage(error));
    }
    // The import rewrites many ngModel-bound fields after an await — mark the
    // OnPush view once instead of converting each field to a signal.
    this.cdr.markForCheck();
  }

  parseMetadataFromFile(file: File) {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMetadataFile(event);
      } catch {
        this.spatialUnitMetadataImportError.set(
          'Uploaded Metadata File cannot be parsed correctly'
        );
      }
      // Same bulk-rewrite situation as the mapping-config import above.
      this.cdr.markForCheck();
    };

    fileReader.readAsText(file);
  }

  parseFromMetadataFile(event: any) {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      this.spatialUnitMetadataImportError.set(
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.'
      );
      return;
    }

    // Parse metadata; use the same array instance as the select options to
    // ensure object identity matches
    const intervalOptions =
      this.updateIntervalOptions && this.updateIntervalOptions.length
        ? this.updateIntervalOptions
        : this.envConfigService.updateIntervalOptions;
    patchMetadataFormFromApi(
      this.metadataForm,
      this.metadataImportSettings.metadata,
      intervalOptions
    );

    // Parse role management (changed from allowedRoles to permissions)
    this.roleGrid?.applyPermissions(this.metadataImportSettings.permissions || []);

    // Parse hierarchy
    this.spatialUnitStore.availableSpatialUnits.forEach((spatialUnit: any) => {
      if (spatialUnit.spatialUnitLevel === this.metadataImportSettings.nextLowerHierarchyLevel) {
        this.nextLowerHierarchySpatialUnit = spatialUnit;
      }
      if (spatialUnit.spatialUnitLevel === this.metadataImportSettings.nextUpperHierarchyLevel) {
        this.nextUpperHierarchySpatialUnit = spatialUnit;
      }
    });

    // Parse outline layer settings
    this.isOutlineLayer = this.metadataImportSettings.isOutlineLayer || false;
    this.outlineColor = this.metadataImportSettings.outlineColor || '#000000';
    this.outlineWidth = this.metadataImportSettings.outlineWidth || 3;

    LABELED_LOI_DASH_ARRAY_OBJECTS?.forEach((option: any) => {
      if (option.dashArrayValue === this.metadataImportSettings.outlineDashArrayString) {
        this.selectedOutlineDashArrayObject = {
          label: option.label,
          dashArrayValue: option.dashArrayValue,
          svgString: option.svgString,
        };
        this.onChangeOutlineDashArray(this.selectedOutlineDashArrayObject);
      }
    });

    // Line pattern picker will handle the display automatically

    this.spatialUnitLevel = this.metadataImportSettings.spatialUnitLevel;
    this.ownerOrganization = this.metadataImportSettings.ownerId;
    this.isPublic = this.metadataImportSettings.isPublic;

    // Initialize metadata structures
    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;
  }

  /** Applies a parsed mapping-config onto this modal's form fields. */
  private applyMappingConfig(parsed: MappingConfigImport): void {
    // Covers converter/schema/mime type, both parameter records, the data
    // source, the property names, the keep flags and the bbox.
    patchImporterFormFromMappingConfig(this.importerForm, parsed);

    this.attributeMappings_adminView = parsed.attributeMappings;

    if (parsed.periodOfValidity) {
      this.periodOfValidity = parsed.periodOfValidity;
    }

    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;
  }

  /** Add-modal bbox interpretation: reads a dedicated bboxType parameter. */
  private applyBbox(dsParams: { name: string; value: string }[]): void {
    patchBboxFromDataSourceParameters(this.importerForm, dsParams);
  }

  onExportSpatialUnitAddMetadataTemplate() {
    this.resourceImportService.downloadJson(
      'Raumebene_Metadaten_Vorlage_Export.json',
      SPATIAL_UNIT_METADATA_STRUCTURE
    );
  }

  onExportSpatialUnitAddMetadata() {
    // Use service method to build export structure
    const metadataExport = buildSpatialUnitMetadataExport(
      this.metadata,
      this.spatialUnitLevel,
      this.nextLowerHierarchySpatialUnit?.spatialUnitLevel || null,
      this.nextUpperHierarchySpatialUnit?.spatialUnitLevel || null,
      this.isOutlineLayer,
      this.outlineColor,
      this.outlineWidth,
      this.selectedOutlineDashArrayObject?.dashArrayValue || null
    );

    // Add component-specific properties
    metadataExport.permissions = this.roleGrid?.getSelectedRoleIds() ?? [];

    // Add owner properties
    metadataExport.ownerId = this.ownerOrganization;
    metadataExport.isPublic = this.isPublic;

    const name = this.spatialUnitLevel;
    const fileName = `Raumebene_Metadaten_Export${name ? '-' + name : ''}.json`;
    this.resourceImportService.downloadJson(fileName, metadataExport);
  }

  async onExportSpatialUnitAddMappingConfig() {
    const definitions = await this.resourceImportService.buildImporterObjects(
      this.importerObjectsConfig()
    );

    // Use service method to build export structure
    const mappingConfigExport = buildMappingConfigExport(
      definitions.converterDefinition,
      definitions.datasourceTypeDefinition,
      definitions.propertyMappingDefinition,
      this.periodOfValidity
    );

    const name = this.spatialUnitLevel;
    const fileName = `KomMonitor-Import-Mapping-Konfiguration_Export${name ? '-' + name : ''}.json`;
    this.resourceImportService.downloadJson(fileName, mappingConfigExport);
  }

  // Metadata structure for export
  get spatialUnitMetadataStructure() {
    return SPATIAL_UNIT_METADATA_STRUCTURE;
  }

  get spatialUnitMappingConfigStructure_pretty() {
    return this.indicatorValueService.syntaxHighlightJSON(
      this.kommonitorImporterHelperService.mappingConfigStructure
    );
  }

  resetForm() {
    this.stepper.reset();

    // One reset for the whole wizard: every scalar control is nonNullable with
    // its real default, so this restores '#000000', width 3, the keep flags and
    // SRID 4326 rather than nulling them.
    this.addForm.reset();
    syncConverterParameterControls(this.importerForm, null);
    syncDatasourceParameterControls(this.importerForm, null);
    // Runtime default: the pattern options are not known at construction time.
    this.selectedOutlineDashArrayObject = this.defaultOutlineDashArray();
    resetAttributeMappingDraft(this.attributeMappingDraft, this.defaultAttributeMappingType());

    this.selectedDataSourceFile = null;
    this.attributeMappings_adminView = [];
    this.importerErrors.set([]);
    this.importedFeatures.set([]);
    this.converterDefinition = null;
    this.datasourceTypeDefinition = null;
    this.propertyMappingDefinition = null;
    this.postBody_spatialUnits = null;

    this.showRoleForm = false;
    this.roleGrid?.reset();

    this.metadataImportSettings = null;
    this.spatialUnitMetadataImportError.set('');
    this.spatialUnitMappingConfigImportError.set('');
    this.spatialUnitMappingConfigStructure = {};
    this.spatialUnitMetadataStructure_pretty = '';
  }

  /** First available outline pattern, or null while the options are empty. */
  private defaultOutlineDashArray(): LinePatternOption | null {
    return this.availableLinePatternOptions[0] ?? null;
  }

  hideMetadataErrorAlert() {
    this.spatialUnitMetadataImportError.set('');
  }

  hideMappingConfigErrorAlert() {
    this.spatialUnitMappingConfigImportError.set('');
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }
}
