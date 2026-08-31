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
import {
  addOrUpdateAttributeMapping,
  getErrorMessage,
} from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
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
  ImporterFormGroup,
  importerFormToConfig,
  importerFormToMissingFieldsInput,
  patchBboxFromDataSourceParameters,
  SYNTHETIC_DATASOURCE_PARAMETERS,
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
import {
  patchTopicHierarchyFromChain,
  topicHierarchyToApi,
} from '../../adminShared/topicHierarchyForm/topic-hierarchy-form.model';
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

  /** Name, type and the nine style fields; read by the template. */
  protected get metadataStepGroup() {
    return this.addForm.controls.metadata;
  }
  protected get styleGroup() {
    return this.addForm.controls.metadata.controls.style;
  }

  get datasetNameInvalid(): boolean {
    return this.addForm.controls.metadata.controls.datasetName.hasError('uniqueName');
  }

  /** Normalises an unknown value to 'poi', as the former setter did. */
  private setGeoresourceType(value: string): void {
    const type: GeoresourceType = value === 'loi' || value === 'aoi' ? value : 'poi';
    this.addForm.controls.metadata.controls.georesourceType.setValue(type);
  }

  // Derived views on the single `georesourceType` control.
  get isPOI(): boolean {
    return this.addForm.controls.metadata.controls.georesourceType.value === 'poi';
  }
  get isLOI(): boolean {
    return this.addForm.controls.metadata.controls.georesourceType.value === 'loi';
  }
  get isAOI(): boolean {
    return this.addForm.controls.metadata.controls.georesourceType.value === 'aoi';
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

  get poiMarkerTextInvalid(): boolean {
    return this.styleGroup.controls.poiMarkerText.hasError('maxlength');
  }

  protected get periodOfValidityGroup() {
    return this.addForm.controls.data.controls.periodOfValidity;
  }
  get periodOfValidityInvalid(): boolean {
    return this.addForm.controls.data.controls.periodOfValidity.hasError('periodOfValidity');
  }

  // Available options
  availableTopics: any[] = [];
  updateIntervalOptions: any[] = [];
  availablePoiMarkerColors: any[] = [];
  availableLoiDashArrayObjects: LinePatternOption[] = [];
  /**
   * Read live from the helper service instead of copying the array once: the
   * helper *replaces* availableDatasourceTypes when its importer fetch resolves,
   * so a copy taken during ngOnInit stays empty forever and the data source
   * select renders no options at all.
   */
  get availableDatasourceTypes(): any[] {
    return this.kommonitorImporterHelperService.availableDatasourceTypes ?? [];
  }

  // Importer functionality — the shared typed sub-form.
  get importerForm(): ImporterFormGroup {
    return this.addForm.controls.data.controls.importer;
  }

  /**
   * Parameter names the template must skip: they have no control in
   * `datasourceTypeParameters` because the bbox block renders them.
   */
  readonly syntheticDatasourceParameters = SYNTHETIC_DATASOURCE_PARAMETERS;
  /**
   * Staging row above the mapping table. Deliberately not part of `addForm`:
   * it is not submitted, and its required rules must not gate the wizard.
   */
  readonly attributeMappingDraft = buildAttributeMappingDraftForm();
  attributeMappings_adminView: any[] = [];

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
    permissions: ['roleId'],
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
    this.setGeoresourceType(this.addForm.controls.metadata.controls.georesourceType.value);
  }

  onChangeOwner(orgUnitId: string): void {
    this.addForm.controls.security.controls.ownerOrganization.setValue(orgUnitId ?? '');
    // Seed the grid with the owner unit's default viewer/editor permissions
    this.roleGrid?.applyOwner(orgUnitId);
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.addForm.controls.security.controls.isPublic.setValue(!!isPublic);
  }

  // Importer methods
  /** Seeds schema/mime type and rebuilds the parameter controls for a converter. */
  onChangeConverter(): void {
    const converter = this.importerForm.controls.converter.value;
    this.importerForm.controls.schema.setValue(converter?.schemas ? converter.schemas[0] : '');
    this.importerForm.controls.mimeType.setValue(
      converter?.mimeTypes ? converter.mimeTypes[0] : ''
    );
    syncConverterParameterControls(this.importerForm, converter);
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
    this.styleGroup.controls.poiMarkerColor.setValue(markerColor ?? null);
  }

  onChangeSymbolColor(symbolColor: any): void {
    this.styleGroup.controls.poiSymbolColor.setValue(symbolColor ?? null);
  }

  onChangeLoiDashArray(loiDashArrayObject: LinePatternOption | null): void {
    this.styleGroup.controls.loiDashArray.setValue(loiDashArrayObject ?? null);
  }

  onChangeMarkerStyle(markerStyle: string): void {
    this.styleGroup.controls.poiMarkerStyle.setValue(markerStyle || DEFAULT_POI_MARKER_STYLE);
  }

  /** The rule is `Validators.maxLength(3)` on the control now. */
  checkPoiMarkerText(): void {
    this.addForm.controls.metadata.controls.style.controls.poiMarkerText.updateValueAndValidity();
  }

  // Attribute mapping methods
  onAddOrUpdateAttributeMapping(): void {
    this.attributeMappings_adminView = addOrUpdateAttributeMapping(
      this.attributeMappings_adminView,
      attributeMappingDraftToRow(this.attributeMappingDraft)
    );

    resetAttributeMappingDraft(
      this.attributeMappingDraft,
      this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0]
    );
  }

  onClickEditAttributeMapping(attributeMappingEntry: any): void {
    patchAttributeMappingDraft(this.attributeMappingDraft, attributeMappingEntry);
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
    const metadata = this.addForm.controls.metadata.getRawValue();
    const style = metadata.style;
    const metadataExport = JSON.parse(JSON.stringify(this.georesourceMetadataStructure));

    metadataExport.metadata.note = this.metadata.note || '';
    metadataExport.metadata.literature = this.metadata.literature || '';
    metadataExport.metadata.sridEPSG = this.metadata.sridEPSG || '';
    metadataExport.metadata.datasource = this.metadata.datasource || '';
    metadataExport.metadata.contact = this.metadata.contact || '';
    metadataExport.metadata.lastUpdate = this.metadata.lastUpdate || '';
    metadataExport.metadata.description = this.metadata.description || '';
    metadataExport.metadata.databasis = this.metadata.databasis || '';
    metadataExport.datasetName = metadata.datasetName || '';

    metadataExport.permissions = this.roleGrid?.getSelectedRoleIds() ?? [];

    if (this.metadata.updateInterval) {
      metadataExport.metadata.updateInterval = this.metadata.updateInterval.apiName;
    }

    const name = metadata.datasetName;

    // georesource specific properties
    metadataExport.isPOI = this.isPOI;
    metadataExport.isLOI = this.isLOI;
    metadataExport.isAOI = this.isAOI;

    if (this.isPOI) {
      metadataExport['poiSymbolBootstrap3Name'] = style.poiIconName;
      metadataExport['poiSymbolColor'] = (style.poiSymbolColor as any)?.colorName || '';
      metadataExport['poiMarkerColor'] = (style.poiMarkerColor as any)?.colorName || '';

      metadataExport['loiDashArrayString'] = '';
      metadataExport['loiColor'] = '';
      metadataExport['loiWidth'] = '';

      metadataExport['aoiColor'] = '';
    } else if (this.isLOI) {
      metadataExport['poiSymbolBootstrap3Name'] = '';
      metadataExport['poiSymbolColor'] = '';
      metadataExport['poiMarkerColor'] = '';

      metadataExport['loiDashArrayString'] = style.loiDashArray?.dashArrayValue ?? '';
      metadataExport['loiColor'] = style.loiColor;
      metadataExport['loiWidth'] = style.loiWidth;

      metadataExport['aoiColor'] = '';
    } else if (this.isAOI) {
      metadataExport['poiSymbolBootstrap3Name'] = '';
      metadataExport['poiSymbolColor'] = '';
      metadataExport['poiMarkerColor'] = '';

      metadataExport['loiDashArrayString'] = '';
      metadataExport['loiColor'] = '';
      metadataExport['loiWidth'] = '';

      metadataExport['aoiColor'] = style.aoiColor;
    }

    // Topic reference: deepest selected hierarchy level, '' when none is set.
    metadataExport.topicReference = topicHierarchyToApi(this.addForm.controls.topics) || '';

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

      mappingConfigExport.periodOfValidity = this.periodOfValidityGroup.getRawValue();

      const name = this.addForm.controls.metadata.controls.datasetName.value;
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

    this.addForm.controls.metadata.controls.datasetName.setValue(
      this.metadataImportSettings.datasetName ?? ''
    );

    this.roleGrid?.applyPermissions(this.metadataImportSettings.permissions || []);

    // georesource specific properties; the three API flags collapse into the
    // single georesourceType control (isPOI/isLOI/isAOI are derived from it).
    if (this.metadataImportSettings.isPOI) {
      this.setGeoresourceType('poi');
    } else if (this.metadataImportSettings.isLOI) {
      this.setGeoresourceType('loi');
    } else {
      this.setGeoresourceType('aoi');
    }

    this.availablePoiMarkerColors.forEach((option: any) => {
      if (option.colorName === this.metadataImportSettings.poiMarkerColor) {
        this.styleGroup.controls.poiMarkerColor.setValue(option);
      }
      if (option.colorName === this.metadataImportSettings.poiSymbolColor) {
        this.styleGroup.controls.poiSymbolColor.setValue(option);
      }
    });

    this.availableLoiDashArrayObjects.forEach((option: any) => {
      if (option.dashArrayValue === this.metadataImportSettings.loiDashArrayString) {
        this.onChangeLoiDashArray(option);
      }
    });

    this.styleGroup.patchValue({
      loiColor: this.metadataImportSettings.loiColor || DEFAULT_LOI_COLOR,
      loiWidth: this.metadataImportSettings.loiWidth ?? DEFAULT_LOI_WIDTH,
      aoiColor: this.metadataImportSettings.aoiColor || DEFAULT_AOI_COLOR,
      poiIconName: this.metadataImportSettings.poiSymbolBootstrap3Name || DEFAULT_POI_ICON_NAME,
    });

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

    const importedConverter =
      this.kommonitorImporterHelperService.availableConverters.find(
        (converter: any) => converter.name === this.mappingConfigImportSettings.converter.name
      ) ?? null;
    this.importerForm.controls.converter.setValue(importedConverter);

    let importedSchema = '';
    if (importedConverter?.schemas && this.mappingConfigImportSettings.converter.schema) {
      for (const schema of importedConverter.schemas) {
        if (schema === this.mappingConfigImportSettings.converter.schema) {
          importedSchema = schema;
        }
      }
    }
    this.importerForm.controls.schema.setValue(importedSchema);

    let importedMimeType = '';
    if (importedConverter?.mimeTypes && this.mappingConfigImportSettings.converter.mimeType) {
      for (const mimeType of importedConverter.mimeTypes) {
        if (mimeType === this.mappingConfigImportSettings.converter.mimeType) {
          importedMimeType = mimeType;
        }
      }
    }
    this.importerForm.controls.mimeType.setValue(importedMimeType);

    const importedDatasourceType =
      this.kommonitorImporterHelperService.availableDatasourceTypes.find(
        (datasourceType: any) =>
          datasourceType.type === this.mappingConfigImportSettings.dataSource.type
      ) ?? null;
    this.importerForm.controls.datasourceType.setValue(importedDatasourceType);

    // Rebuild both parameter records for the selected converter / data source
    // and apply the imported values; bbox settings go to their dedicated fields.
    syncConverterParameterControls(this.importerForm, importedConverter);
    syncDatasourceParameterControls(this.importerForm, importedDatasourceType);
    for (const convParameter of this.mappingConfigImportSettings.converter.parameters ?? []) {
      this.importerForm.controls.converterParameters.controls[convParameter.name]?.setValue(
        convParameter.value ?? ''
      );
    }
    if (importedDatasourceType) {
      const dsParameters = this.mappingConfigImportSettings.dataSource.parameters ?? [];
      for (const dsParameter of dsParameters) {
        this.importerForm.controls.datasourceTypeParameters.controls[dsParameter.name]?.setValue(
          dsParameter.value ?? ''
        );
      }
      this.applyBbox(dsParameters);
    }

    // property Mapping
    const propertyMapping = this.mappingConfigImportSettings.propertyMapping;
    this.importerForm.patchValue({
      nameProperty: propertyMapping.nameProperty ?? '',
      idProperty: propertyMapping.identifierProperty ?? '',
      validStartDateProperty: propertyMapping.validStartDateProperty ?? '',
      validEndDateProperty: propertyMapping.validEndDateProperty ?? '',
      keepAttributes: !!propertyMapping.keepAttributes,
      keepMissingValues: !!propertyMapping.keepMissingOrNullValueAttributes,
    });
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
      patchPeriodOfValidityForm(this.periodOfValidityGroup, {
        startDate: this.mappingConfigImportSettings.periodOfValidity.startDate,
        endDate: this.mappingConfigImportSettings.periodOfValidity.endDate,
      });
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
    this.styleGroup.patchValue({
      poiMarkerColor: this.availablePoiMarkerColors[0] || null,
      poiSymbolColor: this.availablePoiMarkerColors[1] || null,
      loiDashArray: this.availableLoiDashArrayObjects[0] || null,
    });

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
        startDate: this.periodOfValidityGroup.getRawValue().startDate,
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
      // importerFormToConfig() covers converter, schema, mime type, both
      // parameter records, the data source type incl. the always-present bbox
      // fields, the property names and the two keep flags.
      const importer = this.importerForm.getRawValue();
      const definitions = await this.resourceImportService.buildImporterObjects({
        ...importerFormToConfig(this.importerForm),
        selectedFile: null,
        fileInputElement: this.georesourceDataSourceInput?.nativeElement,
        validStartDate: importer.validStartDateProperty,
        validEndDate: importer.validEndDateProperty,
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

  // Modal control methods
  cancel(): void {
    this.activeModal.dismiss();
  }
}
