import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { GridOptions } from 'ag-grid-community';

import { FilterPipe } from '../../../../../pipes/filter.pipe';
import { KommonitorImporterHelperService } from '../../../../../services/adminSpatialUnit/kommonitor-importer-helper.service';
import { BroadcastService } from '../../../../../services/broadcast-service/broadcast.service';
import { BroadcastMessage } from '../../../../../services/broadcast-service/broadcast-message';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { AccessControlService } from '../../../../../services/access-control-service/access-control.service';
import { IndicatorValueService } from '../../../../../services/indicator-value-service/indicator-value.service';
import { SpatialUnitMetadataStoreService } from '../../../../../services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { IndicatorMetadataStoreService } from '../../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';
import {
  FeatureTableCallbacks,
  FeatureTableDataGridHelperService,
  FeatureTableEditStatus,
} from 'services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import { ownerDefaultPermissionIds } from '../../adminShared/roleManagementPanel/role-management-panel.model';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import { NotificationService } from '../../../common/notification/notification.service';
import { StepperComponent } from 'components/ngComponents/common/stepper/stepper.component';
import { WizardStepper } from 'components/ngComponents/common/stepper/wizard-stepper';
import { IndicatorRefreshRequest } from '../indicator-refresh.model';
import { downloadJson } from 'util/json-file.util';
import { syncParameterControls } from '../../adminShared/importerForm/importer-form.model';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { FormControlAriaDirective } from '../../adminShared/formError/form-control-aria.directive';
import { controlInvalidSignal } from '../../adminShared/forms/control-state';
import { TimeseriesMappingFormComponent } from '../../adminShared/timeseriesMappingForm/timeseries-mapping-form.component';
import type {
  ImporterParameter,
  TimeseriesMapping,
} from 'services/resource-import-service/resource-import.model';
import { buildIndicatorEditFeaturesForm } from './indicator-edit-features-form.model';

declare const $: any;

@Component({
  selector: 'app-indicator-edit-features-modal',
  templateUrl: './indicator-edit-features-modal.component.html',
  styleUrls: ['./indicator-edit-features-modal.component.scss'],
  imports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    FormErrorComponent,
    FormControlAriaDirective,
    FilterPipe,
    AgGridAngular,
    StepperComponent,
    TimeseriesMappingFormComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorEditFeaturesModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private broadcastService = inject(BroadcastService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  private cacheHelperService = inject(CacheHelperServiceService);
  private accessControlService = inject(AccessControlService);
  private indicatorValueService = inject(IndicatorValueService);
  spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  indicatorStore = inject(IndicatorMetadataStoreService);
  importerHelperService = inject(KommonitorImporterHelperService);
  private resourceImportService = inject(ResourceImportService);
  featureTableHelper = inject(FeatureTableDataGridHelperService);
  protected envConfigService = inject(EnvConfigService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  featureTableGridOptions: GridOptions = {};

  /** Last edit/delete outcome of this modal's feature table (own instance). */
  readonly featureTableStatus = new FeatureTableEditStatus();

  @ViewChild('modal') modal!: ElementRef;
  /** Grid host node: scopes the header measurement to this modal's grid. */
  @ViewChild('indicatorFeatureTable', { read: ElementRef })
  indicatorFeatureTableEl?: ElementRef<HTMLElement>;

  @Output() refreshRequested = new EventEmitter<IndicatorRefreshRequest>();

  // Form data
  currentIndicatorDataset: any;
  targetApplicableSpatialUnit: any;
  overviewTableTargetSpatialUnitMetadata: any;
  indicatorFeaturesJSON: any;
  remainingFeatureHeaders: any[] = [];

  /**
   * Typed model of the data step. The overview step is the AG-Grid feature
   * table and stays imperative. The accessors below keep the historic property
   * names working for the importer-definition builders and the spec.
   */
  readonly editForm = buildIndicatorEditFeaturesForm();

  private readonly dataStepInvalid = controlInvalidSignal(this.editForm, { whenTouched: true });

  // Converter settings
  get converter(): any {
    return this.editForm.controls.converter.value;
  }
  set converter(value: any) {
    this.editForm.controls.converter.setValue(value ?? null);
  }
  get schema(): any {
    return this.editForm.controls.schema.value;
  }
  set schema(value: any) {
    this.editForm.controls.schema.setValue(value ?? '');
  }
  get mimeType(): any {
    return this.editForm.controls.mimeType.value;
  }
  set mimeType(value: any) {
    this.editForm.controls.mimeType.setValue(value ?? '');
  }

  // Converter / data-source parameter values, keyed by parameter name.
  get converterParameterValues(): { [key: string]: string } {
    return this.editForm.controls.converterParameters.getRawValue();
  }
  get datasourceTypeParameterValues(): { [key: string]: string } {
    return this.editForm.controls.datasourceTypeParameters.getRawValue();
  }

  @ViewChild('indicatorDataSourceInput', { static: false })
  indicatorDataSourceInput?: ElementRef;
  get datasourceType(): any {
    return this.editForm.controls.datasourceType.value;
  }
  set datasourceType(value: any) {
    this.editForm.controls.datasourceType.setValue(value ?? null);
  }
  get spatialUnitRefKeyProperty(): string {
    return this.editForm.controls.spatialUnitRefKeyProperty.value;
  }
  set spatialUnitRefKeyProperty(value: string) {
    this.editForm.controls.spatialUnitRefKeyProperty.setValue(value ?? '');
  }
  get targetSpatialUnitMetadata(): any {
    return this.editForm.controls.targetSpatialUnitMetadata.value;
  }
  set targetSpatialUnitMetadata(value: any) {
    this.editForm.controls.targetSpatialUnitMetadata.setValue(value ?? null);
  }

  // Importer objects
  converterDefinition: any;
  datasourceTypeDefinition: any;
  propertyMappingDefinition: any;
  putBody_indicators: any;

  // Settings
  get keepMissingValues(): boolean {
    return this.editForm.controls.keepMissingValues.value;
  }
  set keepMissingValues(value: boolean) {
    this.editForm.controls.keepMissingValues.setValue(!!value);
  }
  get isPublic(): boolean {
    return this.editForm.controls.isPublic.value;
  }
  set isPublic(value: boolean) {
    this.editForm.controls.isPublic.setValue(!!value);
  }
  enableDeleteFeatures: boolean = false;

  // Timeseries mapping — edited by <app-timeseries-mapping-form> through the form.
  get timeseriesMappingReference(): TimeseriesMapping[] {
    return this.editForm.controls.timeseriesMappings.value;
  }
  set timeseriesMappingReference(value: TimeseriesMapping[]) {
    this.editForm.controls.timeseriesMappings.setValue(value ?? []);
  }

  // Messages
  successMessagePart: string = '';
  errorMessagePart: string = '';
  importerErrors: any[] = [];

  // Loading states
  // Signal: toggled from subscriptions, awaits and grid-helper events (OnPush).
  loadingData = signal(false);

  // Imported features
  importedFeatures: any[] = [];

  // Multi-step form
  readonly stepper = new WizardStepper([
    { key: 'overview', label: 'ADMIN_SHARED_UI.STEP_LABELS.TIMESERIES_OVERVIEW' },
    {
      key: 'data',
      label: 'ADMIN_SHARED_UI.STEP_LABELS.SPATIAL_DATASET',
      invalid: this.dataStepInvalid,
    },
  ]);

  ngOnInit(): void {
    this.setupEventListeners();
    this.initializeForm();

    // The importer selects carry no (change) handlers; the runtime-keyed
    // parameter controls are rebuilt from the form instead. Without this the
    // template renders `formControlName`s that have no control.
    this.editForm.controls.converter.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onChangeConverter());
    this.editForm.controls.datasourceType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onChangeDatasourceType());
  }

  private setupEventListeners(): void {
    // Bus listener kept for cross-area indicator triggers.
    this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === BroadcastMessage.RefreshIndicatorOverviewTableCompleted) {
        if (this.currentIndicatorDataset) {
          this.currentIndicatorDataset = this.indicatorStore.getIndicatorMetadataById(
            this.currentIndicatorDataset.indicatorId
          );
        }
      }
      // Bus callbacks swap template-bound fields on this OnPush view.
      this.cdr.markForCheck();
    });
  }

  /** Callbacks this modal's feature table reports its edits and deletes through. */
  private featureTableCallbacks(): FeatureTableCallbacks {
    return {
      onDeleteStart: () => this.loadingData.set(true),
      onDeleteSuccess: () => {
        this.refreshRequested.emit({
          crudType: 'edit',
          targetIndicatorId: this.currentIndicatorDataset.indicatorId,
        });
        this.refreshIndicatorEditFeaturesOverviewTable();
      },
      onDeleteError: () => this.loadingData.set(false),
      onCellEditResult: (success) => this.featureTableStatus.record(success),
    };
  }

  /** (Re)build this modal's indicator feature table. */
  private buildFeatureTable(headers: string[] = [], features: any[] = []): void {
    this.featureTableGridOptions = this.featureTableHelper.buildIndicatorFeatureTable(
      {
        headers,
        features,
        resourceId: this.currentIndicatorDataset?.indicatorId,
        spatialUnitId: this.overviewTableTargetSpatialUnitMetadata?.spatialUnitId,
        enableDelete: this.enableDeleteFeatures,
        gridRoot: () => this.indicatorFeatureTableEl?.nativeElement,
      },
      this.featureTableCallbacks()
    );
  }

  private initializeForm(): void {
    this.resetIndicatorEditFeaturesForm();
  }

  openModal(indicatorDataset: any): void {
    if (
      this.currentIndicatorDataset &&
      this.currentIndicatorDataset.indicatorId === indicatorDataset.indicatorId
    ) {
      return;
    }

    this.currentIndicatorDataset = indicatorDataset;
    this.resetIndicatorEditFeaturesForm();
    this.buildFeatureTable();
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  resetIndicatorEditFeaturesForm(): void {
    this.isPublic = false;
    this.enableDeleteFeatures = false;

    // Reset edit banners
    this.featureTableStatus.reset();

    this.indicatorFeaturesJSON = undefined;
    this.remainingFeatureHeaders = [];
    // null (not undefined) so the [ngValue]="null" placeholder option is selected
    this.overviewTableTargetSpatialUnitMetadata = null;

    // Set default spatial unit
    for (const spatialUnitMetadataEntry of this.spatialUnitStore.availableSpatialUnits) {
      if (
        this.currentIndicatorDataset?.applicableSpatialUnits?.some(
          (o: any) => o.spatialUnitName === spatialUnitMetadataEntry.spatialUnitLevel
        )
      ) {
        this.overviewTableTargetSpatialUnitMetadata = spatialUnitMetadataEntry;
        break;
      }
    }

    this.spatialUnitRefKeyProperty = '';
    // null (not undefined) so the [ngValue]="null" placeholder options are selected
    this.targetSpatialUnitMetadata = null;
    this.targetApplicableSpatialUnit = undefined;

    this.converter = null;
    this.schema = undefined;
    this.mimeType = undefined;
    this.datasourceType = null;
    syncParameterControls(this.editForm.controls.converterParameters, []);
    syncParameterControls(this.editForm.controls.datasourceTypeParameters, []);

    this.converterDefinition = undefined;
    this.datasourceTypeDefinition = undefined;
    this.propertyMappingDefinition = undefined;
    this.putBody_indicators = undefined;

    this.keepMissingValues = true;

    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.importerErrors = [];

    this.timeseriesMappingReference = [];
  }

  refreshIndicatorEditFeaturesOverviewTable(): void {
    if (!this.overviewTableTargetSpatialUnitMetadata) {
      return;
    }

    this.loadingData.set(true);

    const url =
      this.cacheHelperService.getBaseUrlToKomMonitorDataAPI_spatialResource() +
      '/indicators/' +
      this.currentIndicatorDataset.indicatorId +
      '/' +
      this.overviewTableTargetSpatialUnitMetadata.spatialUnitId +
      '/without-geometry';

    this.http.get(url).subscribe({
      next: (response: any) => {
        this.indicatorFeaturesJSON = response;

        const tmpRemainingHeaders: string[] = [];

        for (const property in this.indicatorFeaturesJSON[0]) {
          // Only show indicator date columns as editable fields
          if (property.includes(this.envConfigService.indicatorDatePrefix)) {
            tmpRemainingHeaders.push(property);
          }
        }

        // Sort date headers
        tmpRemainingHeaders.sort((a, b) => a.localeCompare(b));

        this.remainingFeatureHeaders = tmpRemainingHeaders;

        this.buildFeatureTable(tmpRemainingHeaders, this.indicatorFeaturesJSON);

        this.loadingData.set(false);
        // The grid options above were rebuilt in this async callback.
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.errorMessagePart = this.indicatorValueService.formatError(error);
        this.showErrorAlert();
        this.loadingData.set(false);
      },
    });
  }

  clearAllIndicatorFeatures(): void {
    if (!this.overviewTableTargetSpatialUnitMetadata) {
      return;
    }

    this.loadingData.set(true);

    const url =
      this.envConfigService.baseUrlToKomMonitorDataAPI +
      '/indicators/' +
      this.currentIndicatorDataset.indicatorId +
      '/' +
      this.overviewTableTargetSpatialUnitMetadata.spatialUnitId;

    this.http.delete(url).subscribe({
      next: () => {
        this.indicatorFeaturesJSON = undefined;
        this.remainingFeatureHeaders = [];

        this.refreshRequested.emit({
          crudType: 'edit',
          targetIndicatorId: this.currentIndicatorDataset.indicatorId,
        });

        // Force empty feature overview table on successful deletion of entries
        this.buildFeatureTable();

        this.successMessagePart = this.currentIndicatorDataset.indicatorName;
        this.showSuccessAlert();
        this.loadingData.set(false);
        // The grid options above were reset in this async callback.
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.errorMessagePart = this.indicatorValueService.formatError(error);
        this.showErrorAlert();
        this.loadingData.set(false);
      },
    });
  }

  onChangeSelectedSpatialUnit(targetSpatialUnitMetadata: any): void {
    const applicableSpatialUnits = this.currentIndicatorDataset.applicableSpatialUnits;

    for (const applicableSpatialUnit of applicableSpatialUnits) {
      if (applicableSpatialUnit.spatialUnitId === targetSpatialUnitMetadata.spatialUnitId) {
        this.targetApplicableSpatialUnit = applicableSpatialUnit;
        break;
      }
    }
  }

  /**
   * Roles pass-through for the importer PUT body and the mapping-config export:
   * this modal does not manage permissions (that is the roles modal's job) — it
   * echoes the target spatial unit's timeseries permissions plus the owner
   * unit's default viewer/editor permissions. Historically this went through an
   * invisible role grid that was never rendered.
   */
  private currentRolePermissionIds(): string[] {
    const unitPermissions: string[] = this.targetApplicableSpatialUnit?.permissions ?? [];
    const ownerDefaults = this.currentIndicatorDataset
      ? ownerDefaultPermissionIds(
          this.accessControlService.accessControl ?? [],
          this.currentIndicatorDataset.ownerId
        )
      : [];
    return Array.from(new Set([...unitPermissions, ...ownerDefaults]));
  }

  onChangeConverter(): void {
    this.schema = this.converter?.schemas ? this.converter.schemas[0] : undefined;
    this.mimeType = this.converter?.mimeTypes?.[0];
    // Fresh parameter controls for the newly selected converter. NOTE: CRS
    // parameters are deliberately not seeded — the template hides them, so
    // they were never sent historically either. Skipping them here keeps the
    // record in step with the template and stops a hidden mandatory CRS field
    // from blocking the submit gate.
    syncParameterControls(
      this.editForm.controls.converterParameters,
      this.visibleConverterParameters()
    );
  }

  /** The converter parameters the template actually renders. */
  private visibleConverterParameters(): ImporterParameter[] {
    return (this.converter?.parameters ?? []).filter(
      (parameter: ImporterParameter) => !parameter.name.includes('CRS')
    );
  }

  /**
   * Rebuilds the data-source parameter controls. FILE data sources render no
   * parameter fields at all, so they get an empty record.
   */
  onChangeDatasourceType(): void {
    const parameters =
      this.datasourceType?.type === 'FILE' ? [] : (this.datasourceType?.parameters ?? []);
    syncParameterControls(this.editForm.controls.datasourceTypeParameters, parameters);
  }

  onChangeMimeType(mimeType: string): void {
    this.mimeType = mimeType;
  }

  onChangeIsPublic(isPublic: boolean): void {
    this.isPublic = isPublic;
  }

  onChangeEnableDeleteFeatures(): void {
    if (this.enableDeleteFeatures) {
      $('.indicatorDeleteFeatureRecordBtn').attr('disabled', false);
    } else {
      $('.indicatorDeleteFeatureRecordBtn').attr('disabled', true);
    }
  }

  filterOverviewTargetSpatialUnits(): any {
    return (spatialUnitMetadata: any) => {
      if (this.currentIndicatorDataset) {
        const isIncluded = this.currentIndicatorDataset.applicableSpatialUnits.some(
          (o: any) => o.spatialUnitName === spatialUnitMetadata.spatialUnitLevel
        );
        return isIncluded;
      }
      return false;
    };
  }

  filterByKomMonitorProperties(): any {
    return (item: any) => {
      try {
        if (
          item === this.envConfigService.FEATURE_ID_PROPERTY_NAME ||
          item === this.envConfigService.FEATURE_NAME_PROPERTY_NAME ||
          item === 'validStartDate' ||
          item === 'validEndDate'
        ) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    };
  }

  get filteredConverters(): any[] {
    return (this.importerHelperService.availableConverters || []).filter(
      this.importerHelperService.filterConverters('indicator')
    );
  }

  async buildImporterObjects(): Promise<boolean> {
    this.converterDefinition = this.buildConverterDefinition();
    this.datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    this.propertyMappingDefinition = this.buildPropertyMappingDefinition();

    const roleIds = this.currentRolePermissionIds();

    const scopeProperties = {
      targetSpatialUnitMetadata: {
        spatialUnitLevel: this.targetSpatialUnitMetadata.spatialUnitLevel,
      },
      currentIndicatorDataset: {
        defaultClassificationMapping: this.currentIndicatorDataset.defaultClassificationMapping,
      },
      permissions: roleIds,
      ownerId: this.currentIndicatorDataset.ownerId,
      isPublic: this.isPublic,
    };

    this.putBody_indicators = this.importerHelperService.buildPutBody_indicators(scopeProperties);

    if (
      !this.converterDefinition ||
      !this.datasourceTypeDefinition ||
      !this.propertyMappingDefinition ||
      !this.putBody_indicators
    ) {
      return false;
    }

    return true;
  }

  buildConverterDefinition(): any {
    return this.resourceImportService.buildConverterDefinition({
      converter: this.converter,
      schema: this.schema,
      mimeType: this.mimeType,
      converterParameterValues: this.converterParameterValues,
    });
  }

  async buildDatasourceTypeDefinition(): Promise<any> {
    try {
      return await this.resourceImportService.buildDatasourceTypeDefinition({
        datasourceType: this.datasourceType,
        datasourceTypeFormValues: this.datasourceTypeParameterValues,
        selectedFile: null,
        fileInputElement: this.indicatorDataSourceInput?.nativeElement,
      });
    } catch (error: any) {
      this.errorMessagePart = this.indicatorValueService.formatError(error);
      this.showErrorAlert();
      this.loadingData.set(false);
      return null;
    }
  }

  buildPropertyMappingDefinition(): any {
    const timeseriesMappingForImporter = this.timeseriesMappingReference;
    return this.importerHelperService.buildPropertyMapping_indicatorResource(
      this.spatialUnitRefKeyProperty,
      timeseriesMappingForImporter,
      this.keepMissingValues
    );
  }

  async editIndicatorFeatures(): Promise<void> {
    this.loadingData.set(true);
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';

    // Collect data and build request for importer
    const allDataSpecified = await this.buildImporterObjects();

    if (!allDataSpecified) {
      // Formerly triggered the bootstrap-validator jQuery plugin, which is not
      // loaded since the migration and threw a TypeError here.
      this.notificationService.showError(
        this.translate.instant('ADMIN_INDICATORS.EDIT_FEATURES.MSG.REQUIRED_FIELDS')
      );
      this.loadingData.set(false);
      return;
    }

    try {
      // Dry run first
      const updateIndicatorResponse_dryRun = await this.importerHelperService.updateIndicator(
        this.converterDefinition,
        this.datasourceTypeDefinition,
        this.propertyMappingDefinition,
        this.currentIndicatorDataset.indicatorId,
        this.putBody_indicators,
        true
      );

      if (
        !this.importerHelperService.importerResponseContainsErrors(updateIndicatorResponse_dryRun)
      ) {
        // All good, really execute the request to import data against data management API
        const updateIndicatorResponse = await this.importerHelperService.updateIndicator(
          this.converterDefinition,
          this.datasourceTypeDefinition,
          this.propertyMappingDefinition,
          this.currentIndicatorDataset.indicatorId,
          this.putBody_indicators,
          false
        );

        this.refreshRequested.emit({
          crudType: 'edit',
          targetIndicatorId: this.currentIndicatorDataset.indicatorId,
        });

        this.successMessagePart = this.currentIndicatorDataset.indicatorName;
        this.importedFeatures =
          this.importerHelperService.getImportedFeaturesFromImporterResponse(
            updateIndicatorResponse
          ) || [];

        this.showSuccessAlert();
        this.loadingData.set(false);
      } else {
        // Errors occurred
        this.errorMessagePart =
          'Einige der zu importierenden Zeitreihen des Datensatzes weisen kritische Fehler auf';
        this.importerErrors =
          this.importerHelperService.getErrorsFromImporterResponse(
            updateIndicatorResponse_dryRun
          ) || [];

        this.showErrorAlert();
        this.loadingData.set(false);
      }
    } catch (error: any) {
      this.errorMessagePart = this.indicatorValueService.formatError(error);

      this.showErrorAlert();
      this.loadingData.set(false);
    }
  }

  onImportIndicatorEditFeaturesMappingConfig(): void {
    $('#indicatorMappingConfigEditFeaturesImportFile').files = [];
    $('#indicatorMappingConfigEditFeaturesImportFile').click();
  }

  onExportIndicatorEditFeaturesMappingConfig(): void {
    this.buildImporterObjects().then(() => {
      const mappingConfigExport: any = {
        converter: this.converterDefinition,
        dataSource: this.datasourceTypeDefinition,
        propertyMapping: this.propertyMappingDefinition,
        targetSpatialUnitName: this.targetSpatialUnitMetadata.spatialUnitLevel,
        permissions: [],
      };

      mappingConfigExport.permissions = this.currentRolePermissionIds();

      mappingConfigExport.isPublic = this.isPublic;
      mappingConfigExport.ownerId = this.currentIndicatorDataset.ownerId;

      downloadJson('KomMonitor-Import-Mapping-Konfiguration_Export.json', mappingConfigExport);
    });
  }

  // Alert management
  showSuccessAlert(): void {
    let message = this.translate.instant('ADMIN_INDICATORS.EDIT_FEATURES.MSG.CONTINUE_SUCCESS', {
      name: this.successMessagePart,
    });
    if (this.importedFeatures && this.importedFeatures.length > 0) {
      message +=
        ' ' +
        this.translate.instant('ADMIN_INDICATORS.EDIT_FEATURES.MSG.IMPORTED_TIMESERIES', {
          count: this.importedFeatures.length,
        });
    }
    this.notificationService.showSuccess(message);
  }

  showErrorAlert(): void {
    // errorMessagePart may contain HTML (syntax-highlighted JSON); reduce it to plain text for the toast
    const tmp = document.createElement('div');
    tmp.innerHTML = this.errorMessagePart || '';
    const detail = (tmp.textContent || '').trim();
    let message = this.translate.instant('ADMIN_INDICATORS.EDIT_FEATURES.MSG.CONTINUE_FAILED');
    if (detail) {
      message += ' ' + detail;
    }
    if (this.importerErrors && this.importerErrors.length > 0) {
      message +=
        ' ' +
        this.translate.instant('ADMIN_INDICATORS.EDIT_FEATURES.MSG.IMPORT_ERRORS', {
          count: this.importerErrors.length,
        });
    }
    this.notificationService.showError(message, { autohide: false });
  }
}
