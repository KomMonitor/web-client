import { HttpClient } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewChild,
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

import { FormsModule } from '@angular/forms';
import { getErrorMessage } from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.util';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import {
  StepperComponent,
  StepperStep,
} from 'components/ngComponents/common/stepper/stepper.component';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorValueService } from 'services/indicator-value-service/indicator-value.service';
import {
  LOI_DASH_ARRAY_OBJECTS,
  POI_MARKER_COLORS,
} from 'services/poi-presentation-service/poi-presentation.service';
import { RoleManagementDataGridHelperService } from 'services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { SpatialUnitImportService } from 'services/spatial-unit-import-service/spatial-unit-import.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { ResourceMetadataFormComponent } from '../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import {
  buildResourceMetadataForm,
  metadataFormToApi,
  patchMetadataFormFromApi,
  ResourceMetadataFormValue,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';
import { AdminTopicsManagementComponent } from '../../adminTopicsManagement/admin-topics-management.component';

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
    ResourceMetadataFormComponent,
  ],
  standalone: true,
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
  private resourceImportService = inject(SpatialUnitImportService);
  private notificationService = inject(NotificationService);
  roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private topicHierarchyService = inject(TopicHierarchyService);
  protected envConfigService = inject(EnvConfigService);
  private broadcastService = inject(BroadcastService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('georesourceDataSourceInput', { static: false })
  georesourceDataSourceInput!: ElementRef;

  // Multi-step form
  currentStep = 1;
  totalSteps = 4; // Will be adjusted based on security settings

  // Stepper labels — the security step is only present when Keycloak is enabled,
  // mirroring the conditional fieldsets below. References are stable so the
  // stepper only re-evaluates when the security flag actually changes.
  private readonly stepsWithSecurity: StepperStep[] = [
    { label: 'Metadaten der Georessource' },
    { label: 'Allgemeine Metadaten' },
    { label: 'Themenhierarchie' },
    { label: 'Zugriffsschutz und Eigentümerschaft' },
    { label: 'Räumlicher Datensatz' },
  ];
  private readonly stepsWithoutSecurity: StepperStep[] = [
    { label: 'Metadaten der Georessource' },
    { label: 'Allgemeine Metadaten' },
    { label: 'Themenhierarchie' },
    { label: 'Räumlicher Datensatz' },
  ];
  get steps(): StepperStep[] {
    return this.envConfigService.enableKeycloakSecurity
      ? this.stepsWithSecurity
      : this.stepsWithoutSecurity;
  }

  // Form data
  isSubmitting = false;
  loadingData = false;

  // Basic form data
  datasetName = '';
  datasetNameInvalid = false;
  georesourceType = 'poi';
  isPOI = true;
  isLOI = false;
  isAOI = false;

  // Metadata
  metadataForm = buildResourceMetadataForm();
  /** Read-only view of the metadata form value for post-body/export building. */
  get metadata(): ResourceMetadataFormValue {
    return this.metadataForm.getRawValue();
  }

  // Topic hierarchy
  georesourceTopic_mainTopic: any = null;
  georesourceTopic_subTopic: any = null;
  georesourceTopic_subsubTopic: any = null;
  georesourceTopic_subsubsubTopic: any = null;

  // Visual styling
  selectedPoiMarkerColor: any = null;
  selectedPoiSymbolColor: any = null;
  selectedLoiDashArrayObject: LinePatternOption | null = null;
  loiColor = '#bf3d2c';
  loiWidth = 3;
  aoiColor = '#bf3d2c';
  selectedPoiIconName = 'home';
  selectedPoiMarkerStyle = 'symbol';
  poiMarkerText = '';
  poiMarkerTextInvalid = false;

  // Period of validity
  periodOfValidity: { startDate: string; endDate: string } = {
    startDate: '',
    endDate: '',
  };
  periodOfValidityInvalid = false;

  // Available options
  availableTopics: any[] = [];
  updateIntervalOptions: any[] = [];
  availablePoiMarkerColors: any[] = [];
  availableLoiDashArrayObjects: LinePatternOption[] = [];
  availableDatasourceTypes: any[] = [];

  // Importer functionality
  converter: any = null;
  schema: string = '';
  mimeType: string = '';
  datasourceType: any = null;
  georesourceDataSourceIdProperty = '';
  georesourceDataSourceIdPropertyInvalid = false;
  georesourceDataSourceNameProperty = '';
  georesourceDataSourceNamePropertyInvalid = false;

  // Bbox parameters for OGCAPI_FEATURES
  bboxType: string = '';
  bboxRefSpatialUnit: any = null;
  bbox_minx: any = null;
  bbox_miny: any = null;
  bbox_maxx: any = null;
  bbox_maxy: any = null;

  // ngModel-bound converter / data-source parameter values, keyed by parameter
  // name. Passed to the import service as formValues so the importer helper
  // never has to scrape the parameter inputs from the DOM.
  converterParameterValues: { [key: string]: string } = {};
  datasourceTypeParameterValues: { [key: string]: string } = {};

  // Attribute mapping
  attributeMapping_sourceAttributeName = '';
  attributeMapping_destinationAttributeName = '';
  attributeMapping_data: any = null;
  attributeMapping_attributeType: any = null;
  attributeMappings_adminView: any[] = [];
  keepAttributes = true;
  keepMissingValues = true;

  // Validity dates per feature
  validityStartDate_perFeature = '';
  validityEndDate_perFeature = '';

  // Role management
  roleManagementTableOptions: any = null;
  ownerOrganization = '';
  ownerOrgFilter = '';
  isPublic = false;
  resourcesCreatorRights: any[] = [];

  // GeoJSON data
  geoJsonString: any = null;
  georesource_asGeoJson: any = null;

  // Import/Export functionality
  metadataImportSettings: any = null;
  mappingConfigImportSettings: any = null;
  georesourceMetadataImportError = '';
  georesourceMappingConfigImportError = '';

  // Per-feature importer error report (shown inline; summaries are toasted)
  importerErrors: any[] = [];
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

  // Validation flags
  idPropertyNotFound = false;
  namePropertyNotFound = false;
  georesourceDataSourceInputInvalid = false;
  georesourceDataSourceInputInvalidReason = '';

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

    // Adjust total steps based on security settings
    this.totalSteps = this.envConfigService.enableKeycloakSecurity ? 5 : 4;
  }

  private setupEventListeners(): void {
    // React to metadata loading completion. skip(1) drops the BehaviorSubject's
    // replayed current value so this keeps the original one-shot semantics of
    // the former broadcast event.
    this.metadataBootstrap.metadataLoading$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state === MetadataLoadingState.COMPLETE) {
          this.refreshRoles();
        }
      });

    // Listen for broadcast messages
    this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === BroadcastMessage.AvailableRolesUpdate) {
        this.refreshRoles();
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

  private refreshRoles(): void {
    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable',
      this.roleManagementTableOptions,
      this.accessControlService.accessControl,
      []
    );
  }

  // Multi-step form navigation
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Form validation methods
  checkDatasetName(): void {
    this.datasetNameInvalid = false;
    this.georesourceStore.availableGeoresources.forEach((georesource: any) => {
      if (georesource.datasetName === this.datasetName) {
        this.datasetNameInvalid = true;
        return;
      }
    });
  }

  checkPeriodOfValidity(): void {
    this.periodOfValidityInvalid = false;
    if (this.periodOfValidity.startDate && this.periodOfValidity.endDate) {
      const startDate = new Date(this.periodOfValidity.startDate);
      const endDate = new Date(this.periodOfValidity.endDate);

      if (startDate === endDate || startDate > endDate) {
        this.periodOfValidityInvalid = true;
      }
    }
  }

  onChangeGeoresourceType(): void {
    switch (this.georesourceType) {
      case 'poi':
        this.isPOI = true;
        this.isLOI = false;
        this.isAOI = false;
        break;
      case 'loi':
        this.isPOI = false;
        this.isLOI = true;
        this.isAOI = false;
        break;
      case 'aoi':
        this.isPOI = false;
        this.isLOI = false;
        this.isAOI = true;
        break;
      default:
        this.isPOI = true;
        this.isLOI = false;
        this.isAOI = false;
        break;
    }
  }

  onChangeOwner(orgUnitId: string): void {
    this.ownerOrganization = orgUnitId;
    this.refreshRoles();
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }

  // Importer methods
  onChangeConverter(): void {
    this.schema = this.converter?.schemas ? this.converter.schemas[0] : undefined;
    this.mimeType = this.converter?.mimeTypes ? this.converter.mimeTypes[0] : undefined;
  }

  onChangeMimeType(mimeType: string): void {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any): void {
    this.datasourceType = datasourceType;
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

  checkPoiMarkerText(): void {
    this.poiMarkerTextInvalid = false;
    if (this.poiMarkerText && this.poiMarkerText.length > 3) {
      this.poiMarkerTextInvalid = true;
    }
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
    this.georesourceMetadataImportError = '';
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

    metadataExport.allowedRoles = [];

    if (this.roleManagementTableOptions) {
      const roleIds = this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions
      );
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          metadataExport.allowedRoles.push(roleId);
        }
      }
    }

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
    this.georesourceMappingConfigImportError = '';
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
        this.georesourceMetadataImportError = 'Uploaded Metadata File cannot be parsed correctly';
        this.showMetadataErrorAlert();
      }
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
        this.georesourceMappingConfigImportError =
          'Uploaded MappingConfig File cannot be parsed correctly';
        this.showMappingConfigErrorAlert();
      }
    };

    fileReader.readAsText(file);
  }

  private parseFromMetadataFile(event: any): void {
    this.metadataImportSettings = JSON.parse(event.target.result);

    if (!this.metadataImportSettings.metadata) {
      console.error('uploaded Metadata File cannot be parsed - wrong structure.');
      this.georesourceMetadataImportError =
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
      this.showMetadataErrorAlert();
      return;
    }

    patchMetadataFormFromApi(
      this.metadataForm,
      this.metadataImportSettings.metadata,
      this.updateIntervalOptions
    );

    this.datasetName = this.metadataImportSettings.datasetName;

    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable',
      this.roleManagementTableOptions,
      this.accessControlService.accessControl,
      this.metadataImportSettings.allowedRoles
    );

    // georesource specific properties
    this.isPOI = this.metadataImportSettings.isPOI;
    this.isLOI = this.metadataImportSettings.isLOI;
    this.isAOI = this.metadataImportSettings.isAOI;

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

    if (topicHierarchy && topicHierarchy[0]) {
      this.georesourceTopic_mainTopic = topicHierarchy[0];
    }
    if (topicHierarchy && topicHierarchy[1]) {
      this.georesourceTopic_subTopic = topicHierarchy[1];
    }
    if (topicHierarchy && topicHierarchy[2]) {
      this.georesourceTopic_subsubTopic = topicHierarchy[2];
    }
    if (topicHierarchy && topicHierarchy[3]) {
      this.georesourceTopic_subsubsubTopic = topicHierarchy[3];
    }
  }

  private parseFromMappingConfigFile(event: any): void {
    this.mappingConfigImportSettings = JSON.parse(event.target.result);

    if (
      !this.mappingConfigImportSettings.converter ||
      !this.mappingConfigImportSettings.dataSource ||
      !this.mappingConfigImportSettings.propertyMapping
    ) {
      console.error('uploaded MappingConfig File cannot be parsed - wrong structure.');
      this.georesourceMappingConfigImportError =
        'Struktur der Datei stimmt nicht mit erwartetem Muster überein.';
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

    // converter parameters
    this.converterParameterValues = {};
    if (this.converter) {
      for (const convParameter of this.mappingConfigImportSettings.converter.parameters ?? []) {
        this.converterParameterValues[convParameter.name] = convParameter.value ?? '';
      }
    }

    // datasourceTypes parameters (bbox settings are applied to their dedicated fields)
    this.datasourceTypeParameterValues = {};
    if (this.datasourceType) {
      const dsParameters = this.mappingConfigImportSettings.dataSource.parameters ?? [];
      for (const dsParameter of dsParameters) {
        if (dsParameter.name !== 'bbox' && dsParameter.name !== 'bboxType') {
          this.datasourceTypeParameterValues[dsParameter.name] = dsParameter.value ?? '';
        }
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
      this.periodOfValidityInvalid = false;
    }
  }

  /** Applies imported bbox data-source parameters onto the dedicated bbox form fields. */
  private applyBbox(dsParams: { name: string; value: string }[]): void {
    const bboxTypeParam = dsParams.find((p) => p.name === 'bboxType');
    if (bboxTypeParam) {
      this.bboxType = bboxTypeParam.value || '';
    }
    const bboxParam = dsParams.find((p) => p.name === 'bbox');
    if (bboxParam && typeof bboxParam.value === 'string') {
      if (this.bboxType === 'ref') {
        this.bboxRefSpatialUnit = bboxParam.value;
      } else {
        const parts = bboxParam.value.split(',');
        if (parts.length === 4) {
          this.bbox_minx = parts[0];
          this.bbox_miny = parts[1];
          this.bbox_maxx = parts[2];
          this.bbox_maxy = parts[3];
        }
      }
    }
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
    this.georesourceMetadataImportError = '';
  }

  hideMappingConfigErrorAlert(): void {
    this.georesourceMappingConfigImportError = '';
  }

  private showMetadataErrorAlert(): void {
    // Implementation for showing metadata error alert
  }

  private showMappingConfigErrorAlert(): void {
    // Implementation for showing mapping config error alert
  }

  // Form reset
  resetGeoresourceAddForm(): void {
    this.importerErrors = [];

    this.datasetName = '';
    this.datasetNameInvalid = false;

    this.metadataForm.reset();

    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'georesourceAddRoleManagementTable',
      null,
      this.accessControlService.accessControl,
      []
    );

    this.georesourceTopic_mainTopic = null;
    this.georesourceTopic_subTopic = null;
    this.georesourceTopic_subsubTopic = null;
    this.georesourceTopic_subsubsubTopic = null;

    this.georesourceType = 'poi';
    this.isPOI = true;
    this.isLOI = false;
    this.isAOI = false;
    this.selectedPoiMarkerColor = this.availablePoiMarkerColors[0] || null;
    this.selectedPoiSymbolColor = this.availablePoiMarkerColors[1] || null;
    this.selectedLoiDashArrayObject = this.availableLoiDashArrayObjects[0] || null;
    this.loiColor = '#bf3d2c';
    this.loiWidth = 3;
    this.aoiColor = '#bf3d2c';
    this.selectedPoiIconName = 'home';
    this.selectedPoiMarkerStyle = 'symbol';
    this.poiMarkerText = '';
    this.poiMarkerTextInvalid = false;

    this.periodOfValidity = {
      startDate: '',
      endDate: '',
    };
    this.periodOfValidityInvalid = false;

    this.geoJsonString = null;
    this.georesource_asGeoJson = null;

    this.georesourceDataSourceInputInvalidReason = '';
    this.georesourceDataSourceInputInvalid = false;

    this.georesourceDataSourceIdProperty = '';
    this.georesourceDataSourceNameProperty = '';

    this.converter = null;
    this.schema = '';
    this.mimeType = '';
    this.datasourceType = null;

    this.converterParameterValues = {};
    this.datasourceTypeParameterValues = {};
    this.bboxType = '';
    this.bboxRefSpatialUnit = null;
    this.bbox_minx = null;
    this.bbox_miny = null;
    this.bbox_maxx = null;
    this.bbox_maxy = null;

    this.converterDefinition = null;
    this.datasourceTypeDefinition = null;
    this.propertyMappingDefinition = null;
    this.postBody_georesources = null;

    this.validityEndDate_perFeature = '';
    this.validityStartDate_perFeature = '';

    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMapping_data = null;
    this.attributeMapping_attributeType =
      this.kommonitorImporterHelperService.attributeMapping_attributeTypes[0];
    this.attributeMappings_adminView = [];
    this.keepAttributes = true;
    this.keepMissingValues = true;

    this.ownerOrganization = '';
    this.ownerOrgFilter = '';
    this.isPublic = false;

    this.metadataImportSettings = null;
    this.mappingConfigImportSettings = null;
    this.georesourceMetadataImportError = '';
    this.georesourceMappingConfigImportError = '';
  }

  // Build post body for API request
  buildPostBody_georesources(): any {
    const postBody: any = {
      geoJsonString: '', // will be set by importer
      allowedRoles: [],
      metadata: metadataFormToApi(this.metadataForm),
      jsonSchema: null,
      datasetName: this.datasetName,
      periodOfValidity: {
        endDate: this.periodOfValidity.endDate,
        startDate: this.periodOfValidity.startDate,
      },
      isAOI: this.isAOI,
      isLOI: this.isLOI,
      isPOI: this.isPOI,
      topicReference: null,
      ownerId: this.ownerOrganization,
      isPublic: this.isPublic,
    };

    if (this.roleManagementTableOptions) {
      const roleIds = this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions
      );
      if (roleIds && Array.isArray(roleIds)) {
        for (const roleId of roleIds) {
          postBody.allowedRoles.push(roleId);
        }
      }
    }

    if (this.isPOI) {
      postBody['poiSymbolBootstrap3Name'] = this.selectedPoiIconName;
      postBody['poiSymbolColor'] = (this.selectedPoiSymbolColor as any)?.colorName || '';
      postBody['poiMarkerColor'] = (this.selectedPoiMarkerColor as any)?.colorName || '';
      postBody['poiMarkerStyle'] = this.selectedPoiMarkerStyle;
      postBody['poiMarkerText'] = this.poiMarkerText;

      postBody['loiDashArrayString'] = null;
      postBody['loiColor'] = null;
      postBody['loiWidth'] = 3;

      postBody['aoiColor'] = null;
    } else if (this.isLOI) {
      postBody['poiSymbolBootstrap3Name'] = null;
      postBody['poiSymbolColor'] = null;
      postBody['poiMarkerColor'] = null;
      postBody['poiMarkerStyle'] = null;
      postBody['poiMarkerText'] = null;

      postBody['loiDashArrayString'] =
        (this.selectedLoiDashArrayObject as any)?.dashArrayValue || '';
      postBody['loiColor'] = this.loiColor;
      postBody['loiWidth'] = this.loiWidth;

      postBody['aoiColor'] = null;
    } else if (this.isAOI) {
      postBody['poiSymbolBootstrap3Name'] = null;
      postBody['poiSymbolColor'] = null;
      postBody['poiMarkerColor'] = null;
      postBody['poiMarkerStyle'] = null;
      postBody['poiMarkerText'] = null;

      postBody['loiDashArrayString'] = null;
      postBody['loiColor'] = null;
      postBody['loiWidth'] = 3;

      postBody['aoiColor'] = this.aoiColor;
    }

    // TOPIC REFERENCE
    if (this.georesourceTopic_subsubsubTopic) {
      postBody.topicReference = this.georesourceTopic_subsubsubTopic.topicId;
    } else if (this.georesourceTopic_subsubTopic) {
      postBody.topicReference = this.georesourceTopic_subsubTopic.topicId;
    } else if (this.georesourceTopic_subTopic) {
      postBody.topicReference = this.georesourceTopic_subTopic.topicId;
    } else if (this.georesourceTopic_mainTopic) {
      postBody.topicReference = this.georesourceTopic_mainTopic.topicId;
    } else {
      postBody.topicReference = '';
    }

    return postBody;
  }

  // Main add method
  async addGeoresource(): Promise<void> {
    this.loadingData = true;
    this.importerErrors = [];

    try {
      // Build importer objects
      const allDataSpecified = await this.buildImporterObjects();

      if (!allDataSpecified) {
        // Validation failed
        this.loadingData = false;
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
          `Eine neue Georessource mit Namen "${this.postBody_georesources.datasetName}" wurde registriert` +
            (featureCount > 0 ? ` (${featureCount} Features importiert).` : '.')
        );
        this.activeModal.close(true);
      } else {
        // Dry-run reported import errors: keep the modal open and list the
        // affected feature IDs inline; summarise via a toast.
        this.importerErrors =
          this.kommonitorImporterHelperService.getErrorsFromImporterResponse(
            newGeoresourceResponse_dryRun
          ) || [];
        this.notificationService.showError(
          'Einige der zu importierenden Features des Datensatzes weisen kritische Fehler auf.'
        );
      }
    } catch (error: any) {
      this.notificationService.showError(
        'Fehler bei der Registrierung der Georessource: ' + getErrorMessage(error)
      );
      console.error('Error adding georesource:', error);
    } finally {
      this.loadingData = false;
    }
  }

  private async buildImporterObjects(): Promise<boolean> {
    try {
      const definitions = await this.resourceImportService.buildImporterObjects({
        converter: this.converter,
        schema: this.schema,
        mimeType: this.mimeType,
        converterParameterPrefix: 'converterParameter_georesourceAdd_',
        converterParameterValues: this.converterParameterValues,
        datasourceType: this.datasourceType,
        datasourceTypeParameterPrefix: 'datasourceTypeParameter_georesourceAdd_',
        datasourceFileInputId: 'georesourceDataSourceInput_add',
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
        'Fehler beim Aufbau der Datenquellen-Definition: ' + getErrorMessage(error)
      );
      this.loadingData = false;
      return false;
    }
  }

  /** Data-source form values for the import service; bbox fields are always included. */
  private assembleDatasourceFormValues(): { [key: string]: string } {
    return {
      ...this.datasourceTypeParameterValues,
      bboxType: this.bboxType,
      bboxRef: this.bboxRefSpatialUnit,
      bbox_minx: this.bbox_minx,
      bbox_miny: this.bbox_miny,
      bbox_maxx: this.bbox_maxx,
      bbox_maxy: this.bbox_maxy,
    } as { [key: string]: string };
  }

  // Modal control methods
  cancel(): void {
    this.activeModal.dismiss();
  }
}
