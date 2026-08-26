import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { KmColorPickerComponent } from 'components/ngComponents/customElements/color-picker/km-color-picker.component';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from 'components/ngComponents/customElements/line-pattern-picker/km-line-pattern-picker.component';
import { skip } from 'rxjs';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { GeoresourceRefreshRequest } from '../georesource-refresh.model';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { getErrorMessage } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import {
  LOI_DASH_ARRAY_OBJECTS,
  POI_MARKER_COLORS,
} from 'services/poi-presentation-service/poi-presentation.service';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { KmDatePickerComponent } from '../../../customElements/date-picker/km-date-picker.component';
import { ResourceMetadataFormComponent } from '../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import { TopicHierarchyFormComponent } from '../../adminShared/topicHierarchyForm/topic-hierarchy-form.component';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { FormControlAriaDirective } from '../../adminShared/formError/form-control-aria.directive';
import {
  patchMetadataFormFromApi,
  ResourceMetadataFormGroup,
  ResourceMetadataFormValue,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import {
  DEFAULT_AOI_COLOR,
  DEFAULT_LOI_COLOR,
  DEFAULT_LOI_WIDTH,
  DEFAULT_POI_ICON_NAME,
  DEFAULT_POI_MARKER_STYLE,
  GeoresourceAddPostBody,
  GeoresourceType,
  buildGeoresourceAddForm,
  georesourceAddFormToApi,
} from './georesource-add-form.model';
import {
  BboxType,
  ImporterFormGroup,
  importerFormToConfig,
  importerFormToMissingFieldsInput,
  patchBboxFromDataSourceParameters,
  patchImporterFormFromMappingConfig,
  syncConverterParameterControls,
  syncDatasourceParameterControls,
} from '../../adminShared/importerForm/importer-form.model';
import {
  attributeMappingDraftToRow,
  buildAttributeMappingDraftForm,
  patchAttributeMappingDraft,
  resetAttributeMappingDraft,
} from '../../adminShared/attributeMappingDraftForm/attribute-mapping-draft-form.model';
import { patchPeriodOfValidityForm } from '../../adminShared/periodOfValidityForm/period-of-validity-form.model';
import { patchTopicHierarchyFromChain } from '../../adminShared/topicHierarchyForm/topic-hierarchy-form.model';
import { controlInvalidSignal } from '../../adminShared/forms/control-state';
import { AdminTopicsManagementComponent } from '../../adminTopicsManagement/admin-topics-management.component';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from '../../adminShared/roleManagementPanel/owner-organization-select.component';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-georesource-add-modal',
  templateUrl: './georesource-add-modal.component.html',
  styleUrls: ['./georesource-add-modal.component.scss'],
  imports: [
    FormsModule,
    AdminTopicsManagementComponent,
    StepperComponent,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
    KmDatePickerComponent,
    ResourceMetadataFormComponent,
    TopicHierarchyFormComponent,
    FormErrorComponent,
    FormControlAriaDirective,
    ReactiveFormsModule,
    RoleManagementGridComponent,
    OwnerOrganizationSelectComponent,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoresourceAddModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);

  /** Emitted after a successful registration so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<GeoresourceRefreshRequest>();
  protected accessControlService = inject(AccessControlService);
  private indicatorValueService = inject(IndicatorValueService);
  georesourceStore = inject(GeoresourceMetadataStoreService);
  spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  kommonitorImporterHelperService = inject(KommonitorImporterHelperService);
  private resourceImportService = inject(ResourceImportService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);
  private topicHierarchyService = inject(TopicHierarchyService);
  protected envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('georesourceDataSourceInput', { static: false })
  georesourceDataSourceInput!: ElementRef;
  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;

  // Form data
  // Signal: toggled across await boundaries during registration (OnPush).
  loadingData = signal(false);

  /**
   * Typed model of the whole wizard, one child group per stepper step. The
   * accessors below keep the historic property names working for the export
   * builders and the specs.
   */
  readonly addForm = buildGeoresourceAddForm({
    withSecurity: this.envConfigService.enableKeycloakSecurity,
    existingDatasetNames: () =>
      (this.georesourceStore.availableGeoresources ?? []).map((g: any) => g.datasetName),
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
  private readonly topicsStepInvalid = controlInvalidSignal(this.addForm.controls.topics, {
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
      label: 'ADMIN_SHARED_UI.STEP_LABELS.GEORESOURCE_METADATA',
      invalid: this.metadataStepInvalid,
    },
    {
      key: 'general',
      label: 'ADMIN_SHARED_UI.STEP_LABELS.GENERAL_METADATA',
      invalid: this.generalStepInvalid,
    },
    { key: 'topics', label: 'ADMIN_SHARED_UI.TOPICS.TITLE', invalid: this.topicsStepInvalid },
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

  private get styleGroup() {
    return this.addForm.controls.metadata.controls.style;
  }

  // Basic form data
  get datasetName(): string {
    return this.addForm.controls.metadata.controls.datasetName.value;
  }
  set datasetName(value: string) {
    this.addForm.controls.metadata.controls.datasetName.setValue(value ?? '');
  }
  get datasetNameInvalid(): boolean {
    return this.addForm.controls.metadata.controls.datasetName.hasError('uniqueName');
  }
  get georesourceType(): GeoresourceType {
    return this.addForm.controls.metadata.controls.georesourceType.value;
  }
  set georesourceType(value: string) {
    const type: GeoresourceType = value === 'loi' || value === 'aoi' ? value : 'poi';
    this.addForm.controls.metadata.controls.georesourceType.setValue(type);
  }
  get isPOI(): boolean {
    return this.georesourceType === 'poi';
  }
  get isLOI(): boolean {
    return this.georesourceType === 'loi';
  }
  get isAOI(): boolean {
    return this.georesourceType === 'aoi';
  }

  // Metadata
  /**
   * The shared "Allgemeine Metadaten" block. Returns the same instance on every
   * call — never rebuild it here.
   */
  get metadataForm(): ResourceMetadataFormGroup {
    return this.addForm.controls.general;
  }
  /** Read-only view of the metadata form value for post-body/export building. */
  get metadata(): ResourceMetadataFormValue {
    return this.metadataForm.getRawValue();
  }

  // Topic hierarchy
  get georesourceTopic_mainTopic(): any {
    return this.addForm.controls.topics.controls.mainTopic.value;
  }
  set georesourceTopic_mainTopic(value: any) {
    this.addForm.controls.topics.controls.mainTopic.setValue(value ?? null);
  }
  get georesourceTopic_subTopic(): any {
    return this.addForm.controls.topics.controls.subTopic.value;
  }
  set georesourceTopic_subTopic(value: any) {
    this.addForm.controls.topics.controls.subTopic.setValue(value ?? null);
  }
  get georesourceTopic_subsubTopic(): any {
    return this.addForm.controls.topics.controls.subsubTopic.value;
  }
  set georesourceTopic_subsubTopic(value: any) {
    this.addForm.controls.topics.controls.subsubTopic.setValue(value ?? null);
  }
  get georesourceTopic_subsubsubTopic(): any {
    return this.addForm.controls.topics.controls.subsubsubTopic.value;
  }
  set georesourceTopic_subsubsubTopic(value: any) {
    this.addForm.controls.topics.controls.subsubsubTopic.setValue(value ?? null);
  }

  // Visual styling
  get selectedPoiMarkerColor(): any {
    return this.styleGroup.controls.poiMarkerColor.value;
  }
  set selectedPoiMarkerColor(value: any) {
    this.styleGroup.controls.poiMarkerColor.setValue(value ?? null);
  }
  get selectedPoiSymbolColor(): any {
    return this.styleGroup.controls.poiSymbolColor.value;
  }
  set selectedPoiSymbolColor(value: any) {
    this.styleGroup.controls.poiSymbolColor.setValue(value ?? null);
  }
  get selectedLoiDashArrayObject(): LinePatternOption | null {
    return this.styleGroup.controls.loiDashArray.value;
  }
  set selectedLoiDashArrayObject(value: LinePatternOption | null) {
    this.styleGroup.controls.loiDashArray.setValue(value ?? null);
  }
  get loiColor(): string {
    return this.styleGroup.controls.loiColor.value;
  }
  set loiColor(value: string) {
    this.styleGroup.controls.loiColor.setValue(value || DEFAULT_LOI_COLOR);
  }
  get loiWidth(): number {
    return this.styleGroup.controls.loiWidth.value;
  }
  set loiWidth(value: number) {
    this.styleGroup.controls.loiWidth.setValue(value ?? DEFAULT_LOI_WIDTH);
  }
  get aoiColor(): string {
    return this.styleGroup.controls.aoiColor.value;
  }
  set aoiColor(value: string) {
    this.styleGroup.controls.aoiColor.setValue(value || DEFAULT_AOI_COLOR);
  }
  get selectedPoiIconName(): string {
    return this.styleGroup.controls.poiIconName.value;
  }
  set selectedPoiIconName(value: string) {
    this.styleGroup.controls.poiIconName.setValue(value || DEFAULT_POI_ICON_NAME);
  }
  get selectedPoiMarkerStyle(): string {
    return this.styleGroup.controls.poiMarkerStyle.value;
  }
  set selectedPoiMarkerStyle(value: string) {
    this.styleGroup.controls.poiMarkerStyle.setValue(value || DEFAULT_POI_MARKER_STYLE);
  }
  get poiMarkerText(): string {
    return this.styleGroup.controls.poiMarkerText.value;
  }
  set poiMarkerText(value: string) {
    this.styleGroup.controls.poiMarkerText.setValue(value ?? '');
  }
  get poiMarkerTextInvalid(): boolean {
    return this.styleGroup.controls.poiMarkerText.hasError('maxlength');
  }

  // Period of validity
  get periodOfValidity(): { startDate: string; endDate: string } {
    return this.addForm.controls.data.controls.periodOfValidity.getRawValue();
  }
  set periodOfValidity(value: { startDate: any; endDate: any } | null | undefined) {
    patchPeriodOfValidityForm(this.addForm.controls.data.controls.periodOfValidity, value);
  }
  get periodOfValidityInvalid(): boolean {
    return this.addForm.controls.data.controls.periodOfValidity.hasError('periodOfValidity');
  }

  // Available options
  availableTopics: any[] = [];
  updateIntervalOptions: any[] = [];
  availablePoiMarkerColors: any[] = [];
  availableLoiDashArrayObjects: LinePatternOption[] = [];
  availableDatasourceTypes: any[] = [];

  // Importer functionality — the shared typed sub-form.
  get importerForm(): ImporterFormGroup {
    return this.addForm.controls.data.controls.importer;
  }
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
  get georesourceDataSourceIdProperty(): string {
    return this.importerForm.controls.idProperty.value;
  }
  set georesourceDataSourceIdProperty(value: string) {
    this.importerForm.controls.idProperty.setValue(value ?? '');
  }
  get georesourceDataSourceNameProperty(): string {
    return this.importerForm.controls.nameProperty.value;
  }
  set georesourceDataSourceNameProperty(value: string) {
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

  // Converter / data-source parameter values, keyed by parameter name.
  get converterParameterValues(): { [key: string]: string } {
    return this.importerForm.controls.converterParameters.getRawValue();
  }
  get datasourceTypeParameterValues(): { [key: string]: string } {
    return this.importerForm.controls.datasourceTypeParameters.getRawValue();
  }

  /**
   * Staging row above the mapping table. Deliberately not part of `addForm`:
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
  attributeMappings_adminView: any[] = [];
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

  // Role management (grid handled by <app-role-management-grid>)
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
  mappingConfigImportSettings: any = null;
  // Signals: written from async file-import callbacks (OnPush).
  georesourceMetadataImportError = signal('');
  georesourceMappingConfigImportError = signal('');

  // Per-feature importer error report (shown inline; summaries are toasted)
  // Signal: written after importer responses (OnPush).
  importerErrors = signal<any[]>([]);
  importedFeatures: any[] = [];

  // Metadata structure for import/export
  georesourceMetadataStructure: any = {
    metadata: {
      note: 'an optional note',
      literature: 'optional text about literature',
      updateInterval: 'YEARLY|HALF_YEARLY|QUARTERLY|MONTHLY|ARBITRARY',
      sridEPSG: 4326,
      datasource: 'text about data source',
      contact: 'text about contact details',
      lastUpdate: 'YYYY-MM-DD',
      description: 'description about spatial unit dataset',
      databasis: 'text about data basis',
    },
    allowedRoles: ['roleId'],
    datasetName: 'Name of georesource dataset',
    isPOI:
      'boolean parameter for point of interest dataset - only one of isPOI, isLOI, isAOI can be true',
    isLOI:
      'boolean parameter for lines of interest dataset - only one of isPOI, isLOI, isAOI can be true',
    isAOI:
      'boolean parameter for area of interest dataset - only one of isPOI, isLOI, isAOI can be true',
    poiSymbolBootstrap3Name: 'glyphicon name of bootstrap 3 symbol to use for a POI resource',
    poiSymbolColor: "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
    loiDashArrayString: 'dash array string value - e.g. 20 20',
    poiMarkerColor: "'white'|'red'|'orange'|'beige'|'green'|'blue'|'purple'|'pink'|'gray'|'black'",
    loiColor: 'color for lines of interest dataset',
    loiWidth: 'width for lines of interest dataset',
    aoiColor: 'color for area of interest dataset',
  };

  georesourceMetadataStructure_pretty = '';
  georesourceMappingConfigStructure_pretty = '';

  // Importer objects
  converterDefinition: any = null;
  datasourceTypeDefinition: any = null;
  propertyMappingDefinition: any = null;
  postBody_georesources: any = null;

  // Icon picker options
  iconPickerOptions: any = {
    align: 'center',
    arrowClass: 'btn-default',
    arrowPrevIconClass: 'fas fa-angle-left',
    arrowNextIconClass: 'fas fa-angle-right',
    cols: 10,
    footer: true,
    header: true,
    icon: 'glyphicon-home',
    iconset: 'glyphicon',
    labelHeader: '{0} von {1} Seiten',
    labelFooter: '{0} - {1} von {2} Icons',
    placement: 'bottom',
    rows: 6,
    search: true,
    searchText: 'Stichwortsuche (Bootstrap Glyphicons)',
    selectedClass: 'btn-success',
    unselectedClass: '',
  };

  ngOnInit(): void {
    this.initializeForm();
    this.setupEventListeners();
  }

  private initializeForm(): void {
    // Initialize form with default values
    this.resetGeoresourceAddForm();

    // Load available options
    this.loadAvailableOptions();
  }

  private setupEventListeners(): void {
    // The importer selects and the owner select no longer carry (change)
    // handlers; their side effects hang off the form instead.
    this.importerForm.controls.converter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onChangeConverter());
    this.importerForm.controls.datasourceType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((datasourceType) => this.applyDatasourceTypeChange(datasourceType));
    this.addForm.controls.security.controls.ownerOrganization.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ownerOrganization) => {
        this.roleGrid?.applyOwner(ownerOrganization);
        this.cdr.markForCheck();
      });

    // React to metadata loading completion. skip(1) drops the BehaviorSubject's
    // replayed current value so this keeps the original one-shot semantics of
    // the former broadcast event.
    this.metadataBootstrap.metadataLoading$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state === MetadataLoadingState.COMPLETE) {
          this.roleGrid?.reset();
        }
      });

    // Listen for broadcast messages
    this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === BroadcastMessage.AvailableRolesUpdate) {
        this.roleGrid?.reset();
      }
    });
  }

  private loadAvailableOptions(): void {
    // Load available options from services
    this.updateIntervalOptions = this.envConfigService.updateIntervalOptions || [];
    this.availablePoiMarkerColors = POI_MARKER_COLORS || [];
    this.availableLoiDashArrayObjects = LOI_DASH_ARRAY_OBJECTS.map((option) => ({
      label: option.dashArrayValue || 'durchgezogen',
      dashArrayValue: option.dashArrayValue,
      svgString: option.svgString,
    }));
    this.availableTopics = this.topicStore.availableTopics || [];
    this.availableDatasourceTypes =
      this.kommonitorImporterHelperService.availableDatasourceTypes || [];

    // Initialize metadata structure pretty print
    this.georesourceMetadataStructure_pretty = this.indicatorValueService.syntaxHighlightJSON(
      this.georesourceMetadataStructure
    );
    this.georesourceMappingConfigStructure_pretty = this.indicatorValueService.syntaxHighlightJSON(
      this.kommonitorImporterHelperService.mappingConfigStructure
    );
  }

  // Form validation methods
  /** The rule is `uniqueNameValidator` on the control now. */
  checkDatasetName(): void {
    this.addForm.controls.metadata.controls.datasetName.updateValueAndValidity();
  }

  /** The rule is `periodOfValidityValidator` on the group now. */
  checkPeriodOfValidity(): void {
    this.addForm.controls.data.controls.periodOfValidity.updateValueAndValidity();
  }

  /**
   * `isPOI`/`isLOI`/`isAOI` are derived from the single `georesourceType`
   * control now; the setter already normalises an unknown value to 'poi'.
   * Kept as a template hook.
   */
  onChangeGeoresourceType(): void {
    this.georesourceType = this.georesourceType;
  }

  onChangeOwner(orgUnitId: string): void {
    this.ownerOrganization = orgUnitId;
    // Seed the grid with the owner unit's default viewer/editor permissions
    this.roleGrid?.applyOwner(orgUnitId);
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }

  // Importer methods
  /** Seeds schema/mime type and rebuilds the parameter controls for a converter. */
  onChangeConverter(): void {
    const converter = this.converter;
    this.schema = converter?.schemas ? converter.schemas[0] : '';
    this.mimeType = converter?.mimeTypes ? converter.mimeTypes[0] : '';
    syncConverterParameterControls(this.importerForm, converter);
  }

  onChangeMimeType(mimeType: string): void {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any): void {
    this.datasourceType = datasourceType;
  }

  /**
   * Rebuilds the data-source parameter controls. Called from the control's
   * `valueChanges`, so it must not write the control back.
   */
  private applyDatasourceTypeChange(datasourceType: any): void {
    syncDatasourceParameterControls(this.importerForm, datasourceType);
  }

  // Color and styling methods
  onChangeMarkerColor(markerColor: any): void {
    this.selectedPoiMarkerColor = markerColor;
  }

  onChangeSymbolColor(symbolColor: any): void {
    this.selectedPoiSymbolColor = symbolColor;
  }

  onChangeLoiDashArray(loiDashArrayObject: LinePatternOption | null): void {
    this.selectedLoiDashArrayObject = loiDashArrayObject;
  }

  onChangeMarkerStyle(markerStyle: string): void {
    this.selectedPoiMarkerStyle = markerStyle;
  }

  /** The rule is `Validators.maxLength(3)` on the control now. */
  checkPoiMarkerText(): void {
    this.addForm.controls.metadata.controls.style.controls.poiMarkerText.updateValueAndValidity();
  }

  // Attribute mapping methods
  onAddOrUpdateAttributeMapping(): void {
    const tmpAttributeMapping_adminView = {
      sourceName: this.attributeMapping_sourceAttributeName,
      destinationName: this.attributeMapping_destinationAttributeName,
      dataType: this.attributeMapping_attributeType,
    };

    let processed = false;

    for (let index = 0; index < this.attributeMappings_adminView.length; index++) {
      const attributeMappingEntry_adminView = this.attributeMappings_adminView[index];

      if (attributeMappingEntry_adminView.sourceName === tmpAttributeMapping_adminView.sourceName) {
        // replace object
        this.attributeMappings_adminView[index] = tmpAttributeMapping_adminView;
        processed = true;
        break;
      }
    }

    if (!processed) {
      // new entry
      this.attributeMappings_adminView.push(tmpAttributeMapping_adminView);
    }

    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMapping_attributeType =
      this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
  }

  onClickEditAttributeMapping(attributeMappingEntry: any): void {
    this.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
    this.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
    this.attributeMapping_attributeType = attributeMappingEntry.dataType;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any): void {
    for (let index = 0; index < this.attributeMappings_adminView.length; index++) {
      if (this.attributeMappings_adminView[index].sourceName === attributeMappingEntry.sourceName) {
        // remove object
        this.attributeMappings_adminView.splice(index, 1);
        break;
      }
    }
  }

  // Import/Export methods
  onImportGeoresourceAddMetadata(): void {
    this.georesourceMetadataImportError.set('');
    this.metadataImportFile.nativeElement.click();
  }

  onExportGeoresourceAddMetadataTemplate(): void {
    const metadataJSON = JSON.stringify(this.georesourceMetadataStructure);
    const fileName = 'Georessource_Metadaten_Vorlage_Export.json';
    this.downloadFile(metadataJSON, fileName);
  }

  onExportGeoresourceAddMetadata(): void {
    const metadataExport = JSON.parse(JSON.stringify(this.georesourceMetadataStructure));

    metadataExport.metadata.note = this.metadata.note || '';
    metadataExport.metadata.literature = this.metadata.literature || '';
    metadataExport.metadata.sridEPSG = this.metadata.sridEPSG || '';
    metadataExport.metadata.datasource = this.metadata.datasource || '';
    metadataExport.metadata.contact = this.metadata.contact || '';
    metadataExport.metadata.lastUpdate = this.metadata.lastUpdate || '';
    metadataExport.metadata.description = this.metadata.description || '';
    metadataExport.metadata.databasis = this.metadata.databasis || '';
    metadataExport.datasetName = this.datasetName || '';

    metadataExport.allowedRoles = this.roleGrid?.getSelectedRoleIds() ?? [];

    if (this.metadata.updateInterval) {
      metadataExport.metadata.updateInterval = this.metadata.updateInterval.apiName;
    }

    const name = this.datasetName;

    // georesource specific properties
    metadataExport.isPOI = this.isPOI;
    metadataExport.isLOI = this.isLOI;
    metadataExport.isAOI = this.isAOI;

    if (this.isPOI) {
      metadataExport['poiSymbolBootstrap3Name'] = this.selectedPoiIconName;
      metadataExport['poiSymbolColor'] = (this.selectedPoiSymbolColor as any)?.colorName || '';
      metadataExport['poiMarkerColor'] = (this.selectedPoiMarkerColor as any)?.colorName || '';

      metadataExport['loiDashArrayString'] = '';
      metadataExport['loiColor'] = '';
      metadataExport['loiWidth'] = '';

      metadataExport['aoiColor'] = '';
    } else if (this.isLOI) {
      metadataExport['poiSymbolBootstrap3Name'] = '';
      metadataExport['poiSymbolColor'] = '';
      metadataExport['poiMarkerColor'] = '';

      metadataExport['loiDashArrayString'] = this.selectedLoiDashArrayObject?.dashArrayValue ?? '';
      metadataExport['loiColor'] = this.loiColor;
      metadataExport['loiWidth'] = this.loiWidth;

      metadataExport['aoiColor'] = '';
    } else if (this.isAOI) {
      metadataExport['poiSymbolBootstrap3Name'] = '';
      metadataExport['poiSymbolColor'] = '';
      metadataExport['poiMarkerColor'] = '';

      metadataExport['loiDashArrayString'] = '';
      metadataExport['loiColor'] = '';
      metadataExport['loiWidth'] = '';

      metadataExport['aoiColor'] = this.aoiColor;
    }

    // Topic reference
    if (this.georesourceTopic_subsubsubTopic) {
      metadataExport.topicReference = this.georesourceTopic_subsubsubTopic.topicId;
    } else if (this.georesourceTopic_subsubTopic) {
      metadataExport.topicReference = this.georesourceTopic_subsubTopic.topicId;
    } else if (this.georesourceTopic_subTopic) {
      metadataExport.topicReference = this.georesourceTopic_subTopic.topicId;
    } else if (this.georesourceTopic_mainTopic) {
      metadataExport.topicReference = this.georesourceTopic_mainTopic.topicId;
    } else {
      metadataExport.topicReference = '';
    }

    const metadataJSON = JSON.stringify(metadataExport);
    let fileName = 'Georessource_Metadaten_Export';

    if (name) {
      fileName += '-' + name;
    }

    fileName += '.json';
    this.downloadFile(metadataJSON, fileName);
  }

  onImportGeoresourceAddMappingConfig(): void {
    this.georesourceMappingConfigImportError.set('');
    this.mappingConfigImportFile.nativeElement.click();
  }

  onExportGeoresourceAddMappingConfig(): void {
    this.buildImporterObjects().then(() => {
      const mappingConfigExport: any = {
        converter: this.converterDefinition,
        dataSource: this.datasourceTypeDefinition,
        propertyMapping: this.propertyMappingDefinition,
      };

      mappingConfigExport.periodOfValidity = this.periodOfValidity;

      const name = this.datasetName;
      const metadataJSON = JSON.stringify(mappingConfigExport);
      let fileName = 'KomMonitor-Import-Mapping-Konfiguration_Export';

      if (name) {
        fileName += '-' + name;
      }

      fileName += '.json';
      this.downloadFile(metadataJSON, fileName);
    });
  }

  // File handling methods
  onMetadataFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.parseMetadataFromFile(file);
    }
  }

  onMappingConfigFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.parseMappingConfigFromFile(file);
    }
  }

  private parseMetadataFromFile(file: File): void {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMetadataFile(event);
      } catch (error) {
        console.error(error);
        console.error('Uploaded Metadata File cannot be parsed.');
        this.georesourceMetadataImportError.set(
          'Uploaded Metadata File cannot be parsed correctly'
        );
        this.showMetadataErrorAlert();
      }
      // The import rewrites many ngModel-bound fields in an async callback —
      // mark the OnPush view once instead of converting each field to a signal.
      this.cdr.markForCheck();
    };

    fileReader.readAsText(file);
  }

  private parseMappingConfigFromFile(file: File): void {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMappingConfigFile(event);
      } catch (error) {
        console.error(error);
        console.error('Uploaded MappingConfig File cannot be parsed.');
        this.georesourceMappingConfigImportError.set(
          'Uploaded MappingConfig File cannot be parsed correctly'
        );
        this.showMappingConfigErrorAlert();
      }
      // Same bulk-rewrite situation as the metadata import above.
      this.cdr.markForCheck();
    };

    fileReader.readAsText(file);
  }

  private parseFromMetadataFile(event: any): void {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      console.error('uploaded Metadata File cannot be parsed - wrong structure.');
      this.georesourceMetadataImportError.set(
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.'
      );
      this.showMetadataErrorAlert();
      return;
    }

    patchMetadataFormFromApi(
      this.metadataForm,
      this.metadataImportSettings.metadata,
      this.updateIntervalOptions
    );

    this.datasetName = this.metadataImportSettings.datasetName;

    this.roleGrid?.applyPermissions(this.metadataImportSettings.allowedRoles || []);

    // georesource specific properties; the three API flags collapse into the
    // single georesourceType control (isPOI/isLOI/isAOI are derived from it).
    if (this.metadataImportSettings.isPOI) {
      this.georesourceType = 'poi';
    } else if (this.metadataImportSettings.isLOI) {
      this.georesourceType = 'loi';
    } else {
      this.georesourceType = 'aoi';
    }

    this.availablePoiMarkerColors.forEach((option: any) => {
      if (option.colorName === this.metadataImportSettings.poiMarkerColor) {
        this.selectedPoiMarkerColor = option;
      }
      if (option.colorName === this.metadataImportSettings.poiSymbolColor) {
        this.selectedPoiSymbolColor = option;
      }
    });

    this.availableLoiDashArrayObjects.forEach((option: any) => {
      if (option.dashArrayValue === this.metadataImportSettings.loiDashArrayString) {
        this.selectedLoiDashArrayObject = option;
        this.onChangeLoiDashArray(this.selectedLoiDashArrayObject);
      }
    });

    this.loiColor = this.metadataImportSettings.loiColor;
    this.loiWidth = this.metadataImportSettings.loiWidth;
    this.aoiColor = this.metadataImportSettings.aoiColor;
    this.selectedPoiIconName = this.metadataImportSettings.poiSymbolBootstrap3Name;

    const topicHierarchy = this.topicHierarchyService.getTopicHierarchyForTopicId(
      this.topicStore.availableTopics,
      this.metadataImportSettings.topicReference
    );

    patchTopicHierarchyFromChain(this.addForm.controls.topics, topicHierarchy);
  }

  private parseFromMappingConfigFile(event: any): void {
    this.mappingConfigImportSettings = JSON.parse(event.target.result);

    if (
      !this.mappingConfigImportSettings.converter ||
      !this.mappingConfigImportSettings.dataSource ||
      !this.mappingConfigImportSettings.propertyMapping
    ) {
      console.error('uploaded MappingConfig File cannot be parsed - wrong structure.');
      this.georesourceMappingConfigImportError.set(
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.'
      );
      this.showMappingConfigErrorAlert();
      return;
    }

    this.converter = undefined;
    for (const converter of this.kommonitorImporterHelperService.availableConverters) {
      if (converter.name === this.mappingConfigImportSettings.converter.name) {
        this.converter = converter;
        break;
      }
    }

    this.schema = '';
    if (
      this.converter &&
      this.converter.schemas &&
      this.mappingConfigImportSettings.converter.schema
    ) {
      for (const schema of this.converter.schemas) {
        if (schema === this.mappingConfigImportSettings.converter.schema) {
          this.schema = schema;
        }
      }
    }

    this.mimeType = '';
    if (
      this.converter &&
      this.converter.mimeTypes &&
      this.mappingConfigImportSettings.converter.mimeType
    ) {
      for (const mimeType of this.converter.mimeTypes) {
        if (mimeType === this.mappingConfigImportSettings.converter.mimeType) {
          this.mimeType = mimeType;
        }
      }
    }

    this.datasourceType = undefined;
    for (const datasourceType of this.kommonitorImporterHelperService.availableDatasourceTypes) {
      if (datasourceType.type === this.mappingConfigImportSettings.dataSource.type) {
        this.datasourceType = datasourceType;
        break;
      }
    }

    // Rebuild both parameter records for the selected converter / data source
    // and apply the imported values; bbox settings go to their dedicated fields.
    syncConverterParameterControls(this.importerForm, this.converter);
    syncDatasourceParameterControls(this.importerForm, this.datasourceType);
    for (const convParameter of this.mappingConfigImportSettings.converter.parameters ?? []) {
      this.importerForm.controls.converterParameters.controls[convParameter.name]?.setValue(
        convParameter.value ?? ''
      );
    }
    if (this.datasourceType) {
      const dsParameters = this.mappingConfigImportSettings.dataSource.parameters ?? [];
      for (const dsParameter of dsParameters) {
        this.importerForm.controls.datasourceTypeParameters.controls[dsParameter.name]?.setValue(
          dsParameter.value ?? ''
        );
      }
      this.applyBbox(dsParameters);
    }

    // property Mapping
    this.georesourceDataSourceNameProperty =
      this.mappingConfigImportSettings.propertyMapping.nameProperty;
    this.georesourceDataSourceIdProperty =
      this.mappingConfigImportSettings.propertyMapping.identifierProperty;
    this.validityStartDate_perFeature =
      this.mappingConfigImportSettings.propertyMapping.validStartDateProperty;
    this.validityEndDate_perFeature =
      this.mappingConfigImportSettings.propertyMapping.validEndDateProperty;
    this.keepAttributes = this.mappingConfigImportSettings.propertyMapping.keepAttributes;
    this.keepMissingValues =
      this.mappingConfigImportSettings.propertyMapping.keepMissingOrNullValueAttributes;
    this.attributeMappings_adminView = [];

    for (const attributeMapping of this.mappingConfigImportSettings.propertyMapping.attributes) {
      const tmpEntry: any = {
        sourceName: attributeMapping.name,
        destinationName: attributeMapping.mappingName,
      };

      for (const dataType of this.kommonitorImporterHelperService.attributeMapping_attributeTypes) {
        if (dataType.apiName === attributeMapping.type) {
          tmpEntry.dataType = dataType;
        }
      }

      this.attributeMappings_adminView.push(tmpEntry);
    }

    if (this.mappingConfigImportSettings.periodOfValidity) {
      this.periodOfValidity = {
        startDate: this.mappingConfigImportSettings.periodOfValidity.startDate,
        endDate: this.mappingConfigImportSettings.periodOfValidity.endDate,
      };
    }
  }

  /** Applies imported bbox data-source parameters onto the dedicated bbox form fields. */
  private applyBbox(dsParams: { name: string; value: string }[]): void {
    patchBboxFromDataSourceParameters(this.importerForm, dsParams);
  }

  private downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'application/json' });
    const data = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.download = fileName;
    a.href = data;
    a.textContent = 'JSON';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();

    a.remove();
  }

  // Alert methods
  hideMetadataErrorAlert(): void {
    this.georesourceMetadataImportError.set('');
  }

  hideMappingConfigErrorAlert(): void {
    this.georesourceMappingConfigImportError.set('');
  }

  private showMetadataErrorAlert(): void {
    // Implementation for showing metadata error alert
  }

  private showMappingConfigErrorAlert(): void {
    // Implementation for showing mapping config error alert
  }

  // Form reset
  resetGeoresourceAddForm(): void {
    this.importerErrors.set([]);

    // One reset for the whole wizard: every scalar control is nonNullable with
    // its real default, so this restores '#bf3d2c', width 3, 'home', 'symbol',
    // the keep flags and SRID 4326 rather than nulling them.
    this.addForm.reset();
    syncConverterParameterControls(this.importerForm, null);
    syncDatasourceParameterControls(this.importerForm, null);
    resetAttributeMappingDraft(this.attributeMappingDraft, this.defaultAttributeMappingType());

    // Runtime defaults: these option lists are loaded asynchronously.
    this.selectedPoiMarkerColor = this.availablePoiMarkerColors[0] || null;
    this.selectedPoiSymbolColor = this.availablePoiMarkerColors[1] || null;
    this.selectedLoiDashArrayObject = this.availableLoiDashArrayObjects[0] || null;

    this.roleGrid?.reset();

    this.converterDefinition = null;
    this.datasourceTypeDefinition = null;
    this.propertyMappingDefinition = null;
    this.postBody_georesources = null;

    this.attributeMappings_adminView = [];

    this.metadataImportSettings = null;
    this.mappingConfigImportSettings = null;
    this.georesourceMetadataImportError.set('');
    this.georesourceMappingConfigImportError.set('');
  }

  /** First attribute-mapping type offered by the importer, if it has loaded. */
  private defaultAttributeMappingType(): any {
    return this.kommonitorImporterHelperService.attributeMapping_attributeTypes?.[0] ?? null;
  }

  /** POST body for the importer; the role grid stays imperative. */
  buildPostBody_georesources(): GeoresourceAddPostBody {
    return georesourceAddFormToApi(this.addForm, this.roleGrid?.getSelectedRoleIds() ?? []);
  }

  // Main add method
  async addGeoresource(): Promise<void> {
    this.loadingData.set(true);
    this.importerErrors.set([]);

    // Name the missing required importer fields instead of aborting silently
    // (the historical behavior left the user without any feedback).
    const missing = this.resourceImportService.collectMissingImporterFields(
      importerFormToMissingFieldsInput(this.importerForm, {
        hasFile: !!this.georesourceDataSourceInput?.nativeElement?.files?.[0],
        startDate: this.periodOfValidity.startDate,
        periodOfValidityInvalid: this.periodOfValidityInvalid,
      })
    );

    if (missing.length > 0) {
      this.loadingData.set(false);
      this.notificationService.showError(
        this.translate.instant('ADMIN_GEORESOURCES.ADD_MODAL.MSG.REQUIRED_FIELDS_MISSING', {
          missing: missing.join(', '),
        })
      );
      return;
    }

    try {
      // Build importer objects
      const allDataSpecified = await this.buildImporterObjects();

      if (!allDataSpecified) {
        this.loadingData.set(false);
        this.notificationService.showError(
          this.translate.instant('ADMIN_GEORESOURCES.ADD_MODAL.MSG.REQUIRED_FIELDS')
        );
        return;
      }

      // Perform dry run
      const newGeoresourceResponse_dryRun =
        await this.kommonitorImporterHelperService.registerNewGeoresource(
          this.converterDefinition,
          this.datasourceTypeDefinition,
          this.propertyMappingDefinition,
          this.postBody_georesources,
          true
        );

      if (
        !this.kommonitorImporterHelperService.importerResponseContainsErrors(
          newGeoresourceResponse_dryRun
        )
      ) {
        // all good, really execute the request to import data against data management API
        const newGeoresourceResponse =
          await this.kommonitorImporterHelperService.registerNewGeoresource(
            this.converterDefinition,
            this.datasourceTypeDefinition,
            this.propertyMappingDefinition,
            this.postBody_georesources,
            false
          );

        // Ask the management component to refresh its table. The former broadcast
        // sent mismatched payload keys (action/id), which always forced the
        // full-refetch fallback; the emit uses the proper request shape.
        this.refreshRequested.emit({
          crudType: 'add',
          targetGeoresourceId:
            this.kommonitorImporterHelperService.getIdFromImporterResponse(newGeoresourceResponse),
        });

        this.importedFeatures =
          this.kommonitorImporterHelperService.getImportedFeaturesFromImporterResponse(
            newGeoresourceResponse
          ) || [];

        const featureCount = this.importedFeatures.length;
        this.notificationService.showSuccess(
          featureCount > 0
            ? this.translate.instant('ADMIN_GEORESOURCES.ADD_MODAL.MSG.REGISTERED_WITH_FEATURES', {
                name: this.postBody_georesources.datasetName,
                count: featureCount,
              })
            : this.translate.instant('ADMIN_GEORESOURCES.ADD_MODAL.MSG.REGISTERED', {
                name: this.postBody_georesources.datasetName,
              })
        );
        this.activeModal.close(true);
      } else {
        // Dry-run reported import errors: keep the modal open and list the
        // affected feature IDs inline; summarise via a toast.
        this.importerErrors.set(
          this.kommonitorImporterHelperService.getErrorsFromImporterResponse(
            newGeoresourceResponse_dryRun
          ) || []
        );
        this.notificationService.showError(
          this.translate.instant('ADMIN_GEORESOURCES.ADD_MODAL.MSG.CRITICAL_FEATURE_ERRORS')
        );
      }
    } catch (error: any) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_GEORESOURCES.ADD_MODAL.MSG.REGISTRATION_FAILED', {
          error: getErrorMessage(error),
        })
      );
      console.error('Error adding georesource:', error);
    } finally {
      this.loadingData.set(false);
    }
  }

  private async buildImporterObjects(): Promise<boolean> {
    try {
      const definitions = await this.resourceImportService.buildImporterObjects({
        converter: this.converter,
        schema: this.schema,
        mimeType: this.mimeType,
        converterParameterValues: this.converterParameterValues,
        datasourceType: this.datasourceType,
        datasourceTypeFormValues: this.assembleDatasourceFormValues(),
        selectedFile: null,
        fileInputElement: this.georesourceDataSourceInput?.nativeElement,
        idProperty: this.georesourceDataSourceIdProperty,
        nameProperty: this.georesourceDataSourceNameProperty,
        validStartDate: this.validityStartDate_perFeature,
        validEndDate: this.validityEndDate_perFeature,
        keepAttributes: this.keepAttributes,
        keepMissingValues: this.keepMissingValues,
        attributeMappings: this.attributeMappings_adminView,
      });

      this.converterDefinition = definitions.converterDefinition;
      this.datasourceTypeDefinition = definitions.datasourceTypeDefinition;
      this.propertyMappingDefinition = definitions.propertyMappingDefinition;
      this.postBody_georesources = this.buildPostBody_georesources();

      return !!(
        this.converterDefinition &&
        this.datasourceTypeDefinition &&
        this.propertyMappingDefinition &&
        this.postBody_georesources
      );
    } catch (error: any) {
      this.notificationService.showError(
        this.translate.instant('ADMIN_GEORESOURCES.ADD_MODAL.MSG.DATASOURCE_BUILD_FAILED', {
          error: getErrorMessage(error),
        })
      );
      this.loadingData.set(false);
      return false;
    }
  }

  /** Data-source form values for the import service; bbox fields are always included. */
  private assembleDatasourceFormValues(): { [key: string]: string } {
    return importerFormToConfig(this.importerForm).datasourceTypeFormValues;
  }

  // Modal control methods
  cancel(): void {
    this.activeModal.dismiss();
  }
}
