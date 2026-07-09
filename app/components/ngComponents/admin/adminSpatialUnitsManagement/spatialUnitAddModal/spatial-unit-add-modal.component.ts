import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
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
  validatePeriodOfValidity,
} from 'services/adminSpatialUnit/spatial-unit-metadata.util';
import { RoleManagementGridComponent } from '../../adminShared/roleManagementPanel/role-management-grid.component';
import { OwnerOrganizationSelectComponent } from '../../adminShared/roleManagementPanel/owner-organization-select.component';

import { KmColorPickerComponent } from '../../../customElements/color-picker/km-color-picker.component';
import {
  KmLinePatternPickerComponent,
  LinePatternOption,
} from '../../../customElements/line-pattern-picker/km-line-pattern-picker.component';
import { FormsModule } from '@angular/forms';
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
  toIsoDateString,
} from '../spatial-unit-import.util';
import type {
  AttributeMappingRow,
  DatasourceType,
  ImporterObjectsConfig,
  MappingConfigImport,
} from 'services/resource-import-service/resource-import.model';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { ResourceMetadataFormComponent } from '../../adminShared/resourceMetadataForm/resource-metadata-form.component';
import {
  buildResourceMetadataForm,
  metadataFormToApi,
  patchMetadataFormFromApi,
  ResourceMetadataFormValue,
} from '../../adminShared/resourceMetadataForm/resource-metadata-form.model';

// Removed in favor of standalone km-date-picker component providers

@Component({
  selector: 'app-spatial-unit-add-modal',
  templateUrl: './spatial-unit-add-modal.component.html',
  styleUrls: ['./spatial-unit-add-modal.component.scss'],
  imports: [
    FormsModule,
    KmColorPickerComponent,
    KmLinePatternPickerComponent,
    KmDatePickerComponent,
    StepperComponent,
    ResourceMetadataFormComponent,
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

  /** Emitted after a spatial unit was added so the parent refreshes its table. */
  @Output() refreshRequested = new EventEmitter<SpatialUnitRefreshRequest>();

  @ViewChild('metadataImportFile', { static: false }) metadataImportFile!: ElementRef;
  @ViewChild('mappingConfigImportFile', { static: false }) mappingConfigImportFile!: ElementRef;
  @ViewChild('spatialUnitDataSourceInput', { static: false })
  spatialUnitDataSourceInput!: ElementRef;
  @ViewChild(RoleManagementGridComponent) roleGrid?: RoleManagementGridComponent;
  // datepickers handled by km-date-picker
  @ViewChild('lastUpdateDatepicker', { static: false }) lastUpdateDatepicker!: NgbDatepicker;

  // Multi-step form; the security step is only present when Keycloak is
  // enabled, mirroring the conditional fieldset in the template.
  readonly stepper = new WizardStepper([
    { key: 'metadata', label: 'ADMIN_SHARED_UI.STEP_LABELS.SPATIAL_UNIT_METADATA' },
    { key: 'general', label: 'ADMIN_SHARED_UI.STEP_LABELS.GENERAL_METADATA' },
    {
      key: 'security',
      label: 'ADMIN_SHARED_UI.SECURITY.ACCESS_OWNERSHIP_TITLE',
      when: () => this.envConfigService.enableKeycloakSecurity,
    },
    { key: 'data', label: 'ADMIN_SHARED_UI.STEP_LABELS.SPATIAL_DATASET' },
  ]);

  // Form data — signal: toggled across await boundaries (OnPush).
  loadingData = signal(false);

  // Basic form data
  spatialUnitLevel = '';
  spatialUnitLevelInvalid = false;
  metadataForm = buildResourceMetadataForm();
  /** Read-only view of the metadata form value for post-body/export building. */
  get metadata(): ResourceMetadataFormValue {
    return this.metadataForm.getRawValue();
  }

  // Hierarchy
  nextLowerHierarchySpatialUnit: any = null;
  nextUpperHierarchySpatialUnit: any = null;
  hierarchyInvalid = false;

  // Outline layer settings
  isOutlineLayer = false;
  outlineWidth = 3;

  // Period of validity
  periodOfValidity: { startDate: any; endDate: any } = {
    startDate: '',
    endDate: '',
  };
  periodOfValidityInvalid = false;

  // Available options
  availableSpatialUnits: any[] = [];
  updateIntervalOptions: any[] = [];
  availableDatasourceTypes: DatasourceType[] = [];
  availableLoiDashArrayObjects: any[] = [];

  // Importer functionality
  converter: any = null;
  schema: string = '';
  mimeType: string = '';
  datasourceType: any = null;
  selectedDataSourceFile: File | null = null;
  spatialUnitDataSourceIdProperty = '';
  spatialUnitDataSourceNameProperty = '';

  // Bbox parameters for OGCAPI_FEATURES
  bboxType: string = '';
  bboxRefSpatialUnit: any = null;
  bbox_minx: any = null;
  bbox_miny: any = null;
  bbox_maxx: any = null;
  bbox_maxy: any = null;

  // Attribute mapping
  attributeMapping_sourceAttributeName = '';
  attributeMapping_destinationAttributeName = '';
  attributeMapping_attributeType: any = null;
  attributeMappings_adminView: AttributeMappingRow[] = [];
  keepAttributes = true;
  keepMissingValues = true;

  // Persisted parameter values for converter and datasource type
  converterParameterValues: { [key: string]: string } = {};
  datasourceTypeParameterValues: { [key: string]: string } = {};

  // Validity dates per feature
  validityStartDate_perFeature = '';
  validityEndDate_perFeature = '';

  // Role management (grid handled by <app-role-management-grid>)
  ownerOrganization = '';
  isPublic = false;

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
  outlineColor = '#000000';
  selectedOutlineDashArrayObject: LinePatternOption | null = null;
  spatialUnitMetadataStructure_pretty: string = '';
  spatialUnitMappingConfigStructure: any = {};

  // Role form visibility
  showRoleForm = false;

  // Color picker handled by km-color-picker
  // Line pattern picker handled by km-line-pattern-picker

  get availableLinePatternOptions(): LinePatternOption[] {
    return (LABELED_LOI_DASH_ARRAY_OBJECTS || []).map((option) => ({
      label: option.label,
      dashArrayValue: option.dashArrayValue,
      svgString: option.svgString,
    }));
  }

  ngOnInit() {
    this.loadInitialData();
    this.initializeOutlineLayerSettings();
    this.initializeMetadataStructures();
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
    const availableOptions = LABELED_LOI_DASH_ARRAY_OBJECTS || [];
    if (availableOptions.length > 0) {
      this.selectedOutlineDashArrayObject = {
        label: availableOptions[0].label,
        dashArrayValue: availableOptions[0].dashArrayValue,
        svgString: availableOptions[0].svgString,
      };
    } else {
      this.selectedOutlineDashArrayObject = null;
    }
    this.availableLoiDashArrayObjects = availableOptions;
  }

  private initializeMetadataStructures() {
    this.spatialUnitMetadataStructure_pretty = this.indicatorValueService.syntaxHighlightJSON(
      SPATIAL_UNIT_METADATA_STRUCTURE
    );
    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;
  }

  checkSpatialUnitName() {
    this.spatialUnitLevelInvalid = false;
    const level = this.spatialUnitLevel;

    if (level) {
      this.availableSpatialUnits.forEach((spatialUnit) => {
        if (spatialUnit.spatialUnitLevel === level) {
          this.spatialUnitLevelInvalid = true;
          return;
        }
      });
    }
  }

  checkSpatialUnitHierarchy() {
    this.hierarchyInvalid = false;

    // smaller indices represent higher spatial units
    // i.e. city districts will have a smaller index than building blocks
    if (this.nextLowerHierarchySpatialUnit && this.nextUpperHierarchySpatialUnit) {
      let indexOfLowerHierarchyUnit: number;
      let indexOfUpperHierarchyUnit: number;

      for (let i = 0; i < this.spatialUnitStore.availableSpatialUnits.length; i++) {
        const spatialUnit = this.spatialUnitStore.availableSpatialUnits[i];
        if (spatialUnit.spatialUnitLevel === this.nextLowerHierarchySpatialUnit.spatialUnitLevel) {
          indexOfLowerHierarchyUnit = i;
        }
        if (spatialUnit.spatialUnitLevel === this.nextUpperHierarchySpatialUnit.spatialUnitLevel) {
          indexOfUpperHierarchyUnit = i;
        }
      }

      if (indexOfLowerHierarchyUnit! <= indexOfUpperHierarchyUnit!) {
        // failure
        this.hierarchyInvalid = true;
      }
    }
  }

  checkPeriodOfValidity() {
    // Normalize to ISO strings first (handles NgbDateStruct or string)
    const startIso = toIsoDateString(this.periodOfValidity.startDate);
    const endIso = toIsoDateString(this.periodOfValidity.endDate);

    // Use service validation (guards optional end)
    const validation = validatePeriodOfValidity(startIso as any, endIso as any);

    this.periodOfValidityInvalid = !validation.isValid;

    if (!validation.isValid && validation.error) {
      // no action required here
    }
  }

  // Attribute mapping methods
  onAddOrUpdateAttributeMapping() {
    this.attributeMappings_adminView = addOrUpdateAttributeMapping(
      this.attributeMappings_adminView,
      {
        sourceName: this.attributeMapping_sourceAttributeName,
        destinationName: this.attributeMapping_destinationAttributeName,
        dataType: this.attributeMapping_attributeType,
      }
    );

    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    this.attributeMapping_attributeType = attributeMappingTypes[0];
  }

  onClickEditAttributeMapping(attributeMappingEntry: any) {
    this.attributeMapping_sourceAttributeName = attributeMappingEntry.sourceName;
    this.attributeMapping_destinationAttributeName = attributeMappingEntry.destinationName;
    this.attributeMapping_attributeType = attributeMappingEntry.dataType;
  }

  onClickDeleteAttributeMapping(attributeMappingEntry: any) {
    this.attributeMappings_adminView = removeAttributeMapping(
      this.attributeMappings_adminView,
      attributeMappingEntry.sourceName
    );
  }

  onChangeConverter(_schema?: any) {
    this.schema = this.converter.schemas ? this.converter.schemas[0] : undefined;
    this.mimeType = this.converter.mimeTypes ? this.converter.mimeTypes[0] : undefined;
    this.converterParameterValues = {};
  }

  onChangeMimeType(mimeType: any) {
    this.mimeType = mimeType;
  }

  onChangeDatasourceType(datasourceType: any) {
    // Handle datasource type change
    this.datasourceType = datasourceType;
    // Reset related fields when datasource type changes
    this.selectedDataSourceFile = null;
    this.spatialUnitDataSourceIdProperty = '';
    this.spatialUnitDataSourceNameProperty = '';
    this.bboxType = '';
    this.bboxRefSpatialUnit = null;
    this.bbox_minx = null;
    this.bbox_miny = null;
    this.bbox_maxx = null;
    this.bbox_maxy = null;
    this.datasourceTypeParameterValues = {};
  }

  onSpatialUnitFileSelected(event: any) {
    const file = event?.target?.files?.[0] as File | undefined;
    this.selectedDataSourceFile = file ?? null;
  }

  onChangeOutlineDashArray(outlineDashArrayObject: LinePatternOption | null) {
    // Handle outline dash array change
    this.selectedOutlineDashArrayObject = outlineDashArrayObject;

    // No need to update dropdown display or close dropdown - handled by km-line-pattern-picker
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

  buildPostBody_spatialUnits() {
    const postBody: any = {
      geoJsonString: '', // will be set by importer
      metadata: metadataFormToApi(this.metadataForm),
      jsonSchema: undefined,
      permissions: [] as string[], // Changed from allowedRoles to match original
      nextLowerHierarchyLevel: this.nextLowerHierarchySpatialUnit
        ? this.nextLowerHierarchySpatialUnit.spatialUnitLevel
        : null,
      spatialUnitLevel: this.spatialUnitLevel,
      periodOfValidity: {
        endDate: toIsoDateString(
          this.periodOfValidity && this.periodOfValidity.endDate
            ? this.periodOfValidity.endDate
            : null
        ),
        startDate: toIsoDateString(
          this.periodOfValidity && this.periodOfValidity.startDate
            ? this.periodOfValidity.startDate
            : null
        ),
      },
      nextUpperHierarchyLevel: this.nextUpperHierarchySpatialUnit
        ? this.nextUpperHierarchySpatialUnit.spatialUnitLevel
        : null,
      // Add missing outline layer properties
      isOutlineLayer: this.isOutlineLayer,
      outlineColor: this.outlineColor,
      outlineWidth: this.outlineWidth,
      outlineDashArrayString: this.selectedOutlineDashArrayObject?.dashArrayValue,
      ownerId: this.ownerOrganization,
      isPublic: this.isPublic,
    };

    postBody.permissions.push(...(this.roleGrid?.getSelectedRoleIds() ?? []));

    return postBody;
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
    this.converter = parsed.converter;
    this.schema = parsed.schema;
    this.mimeType = parsed.mimeType;
    this.converterParameterValues = parsed.converterParameters;
    this.datasourceType = parsed.datasourceType;
    this.datasourceTypeParameterValues = parsed.datasourceTypeParameters;

    this.applyBbox(parsed.dataSourceParameters);

    this.spatialUnitDataSourceNameProperty = parsed.nameProperty;
    this.spatialUnitDataSourceIdProperty = parsed.idProperty;
    this.validityStartDate_perFeature = parsed.validStartDate;
    this.validityEndDate_perFeature = parsed.validEndDate;
    this.keepAttributes = parsed.keepAttributes;
    this.keepMissingValues = parsed.keepMissingValues;
    this.attributeMappings_adminView = parsed.attributeMappings;

    if (parsed.periodOfValidity) {
      this.periodOfValidity = parsed.periodOfValidity;
      this.periodOfValidityInvalid = false;
    }

    this.spatialUnitMappingConfigStructure =
      this.kommonitorImporterHelperService.mappingConfigStructure;
  }

  /** Add-modal bbox interpretation: reads a dedicated bboxType parameter. */
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
    this.spatialUnitLevel = '';
    this.spatialUnitLevelInvalid = false;
    this.metadataForm.reset();
    this.nextLowerHierarchySpatialUnit = null;
    this.nextUpperHierarchySpatialUnit = null;
    this.hierarchyInvalid = false;
    this.periodOfValidity = { startDate: '', endDate: '' };
    this.periodOfValidityInvalid = false;

    // Reset outline layer settings
    this.isOutlineLayer = false;
    this.outlineColor = '#000000';
    this.outlineWidth = 3;
    const availableOptions = LABELED_LOI_DASH_ARRAY_OBJECTS || [];
    if (availableOptions.length > 0) {
      this.selectedOutlineDashArrayObject = {
        label: availableOptions[0].label,
        dashArrayValue: availableOptions[0].dashArrayValue,
        svgString: availableOptions[0].svgString,
      };
    } else {
      this.selectedOutlineDashArrayObject = null;
    }
    this.spatialUnitMappingConfigStructure = {};

    // Line pattern picker will handle the display automatically

    this.converter = null;
    this.schema = '';
    this.mimeType = '';
    this.datasourceType = null;
    this.selectedDataSourceFile = null;
    this.spatialUnitDataSourceIdProperty = '';
    this.spatialUnitDataSourceNameProperty = '';
    this.validityStartDate_perFeature = '';
    this.validityEndDate_perFeature = '';
    this.converterParameterValues = {};
    this.datasourceTypeParameterValues = {};
    this.bboxType = '';
    this.bboxRefSpatialUnit = null;
    this.bbox_minx = null;
    this.bbox_miny = null;
    this.bbox_maxx = null;
    this.bbox_maxy = null;
    this.attributeMapping_sourceAttributeName = '';
    this.attributeMapping_destinationAttributeName = '';
    this.attributeMappings_adminView = [];
    this.keepAttributes = true;
    this.keepMissingValues = true;
    this.importerErrors.set([]);
    this.importedFeatures.set([]);
    this.converterDefinition = null;
    this.datasourceTypeDefinition = null;
    this.propertyMappingDefinition = null;
    this.postBody_spatialUnits = null;

    // Reset role management
    this.ownerOrganization = '';
    this.isPublic = false;
    this.showRoleForm = false;
    this.roleGrid?.reset();

    this.metadataImportSettings = null;
    this.spatialUnitMetadataImportError.set('');
    this.spatialUnitMappingConfigImportError.set('');
    this.spatialUnitMappingConfigStructure = {};
    this.spatialUnitMetadataStructure_pretty = '';
    const attributeMappingTypes = this.kommonitorImporterHelperService.getAttributeMappingTypes();
    this.attributeMapping_attributeType = attributeMappingTypes[0];
  }

  hideMetadataErrorAlert() {
    this.spatialUnitMetadataImportError.set('');
  }

  hideMappingConfigErrorAlert() {
    this.spatialUnitMappingConfigImportError.set('');
  }

  onChangeOwner(ownerOrganization: string) {
    this.ownerOrganization = ownerOrganization;

    // Seed the grid with the owner unit's default viewer/editor permissions
    this.roleGrid?.applyOwner(ownerOrganization);

    // Show/hide the role form based on whether an organization is selected
    this.showRoleForm = !!ownerOrganization;
  }

  onChangeIsPublic(isPublic: boolean) {
    // Handle public access change
    this.isPublic = isPublic;
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }
}
