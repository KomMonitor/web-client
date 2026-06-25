import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { GridOptions } from 'ag-grid-community';

import { FilterPipe } from '../../../../../pipes/filter.pipe';
import { KommonitorImporterHelperService } from '../../../../../services/adminSpatialUnit/kommonitor-importer-helper.service';
import { BroadcastService } from '../../../../../services/broadcast-service/broadcast.service';
import { DataExchangeService } from '../../../../../services/data-exchange-service/data-exchange.service';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { AccessControlService } from '../../../../../services/access-control-service/access-control.service';
import { IndicatorValueService } from '../../../../../services/indicator-value-service/indicator-value.service';
import { SpatialUnitMetadataStoreService } from '../../../../../services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { IndicatorMetadataStoreService } from '../../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { EnvConfigService } from '../../../../../services/env-config-service/env-config.service';
import { FeatureTableDataGridHelperService } from '../../../../../services/feature-table-data-grid-helper-service/feature-table-data-grid-helper.service';
import { MultiStepHelperServiceService } from '../../../../../services/multi-step-helper-service/multi-step-helper-service.service';
import { RoleManagementDataGridHelperService } from '../../../../../services/role-management-data-grid-helper-service/role-management-data-grid-helper.service';
import { NotificationService } from '../../../common/notification/notification.service';

declare const $: any;

@Component({
  selector: 'app-indicator-edit-features-modal',
  templateUrl: './indicator-edit-features-modal.component.html',
  styleUrls: ['./indicator-edit-features-modal.component.scss'],
  imports: [FormsModule, FilterPipe, AgGridAngular],
  standalone: true,
})
export class IndicatorEditFeaturesModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  dataExchangeService = inject(DataExchangeService);
  private cacheHelperService = inject(CacheHelperServiceService);
  private accessControlService = inject(AccessControlService);
  private indicatorValueService = inject(IndicatorValueService);
  spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  indicatorStore = inject(IndicatorMetadataStoreService);
  importerHelperService = inject(KommonitorImporterHelperService);
  featureTableHelper = inject(FeatureTableDataGridHelperService);
  private roleManagementHelper = inject(RoleManagementDataGridHelperService);
  private multiStepHelperService = inject(MultiStepHelperServiceService);
  protected envConfigService = inject(EnvConfigService);
  private notificationService = inject(NotificationService);

  featureTableGridOptions: GridOptions = {};

  @ViewChild('modal') modal!: ElementRef;

  // Form data
  currentIndicatorDataset: any;
  targetApplicableSpatialUnit: any;
  overviewTableTargetSpatialUnitMetadata: any;
  indicatorFeaturesJSON: any;
  remainingFeatureHeaders: any[] = [];

  // Converter settings
  converter: any;
  schema: any;
  mimeType: any;
  datasourceType: any;
  spatialUnitRefKeyProperty: string = '';
  targetSpatialUnitMetadata: any;

  // Importer objects
  converterDefinition: any;
  datasourceTypeDefinition: any;
  propertyMappingDefinition: any;
  putBody_indicators: any;

  // Settings
  keepMissingValues: boolean = true;
  isPublic: boolean = false;
  enableDeleteFeatures: boolean = false;

  // Timeseries mapping
  timeseriesMappingReference: any[] = [];

  // Role management
  roleManagementTableOptions: any;

  // Messages
  successMessagePart: string = '';
  errorMessagePart: string = '';
  importerErrors: any[] = [];

  // Loading states
  loadingData: boolean = false;

  // Imported features
  importedFeatures: any[] = [];

  // Multi-step form
  currentStep: number = 1;
  totalSteps: number = 2;

  ngOnInit(): void {
    this.setupEventListeners();
    this.initializeForm();
  }

  private setupEventListeners(): void {
    // Listen for edit indicator features event
    this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'onEditIndicatorFeatures') {
        this.openModal(data.values);
      } else if (data.msg === 'timeseriesMappingChanged') {
        this.timeseriesMappingReference = data.mapping;
      } else if (data.msg === 'refreshIndicatorOverviewTableCompleted') {
        if (this.currentIndicatorDataset) {
          this.currentIndicatorDataset = this.indicatorStore.getIndicatorMetadataById(
            this.currentIndicatorDataset.indicatorId
          );
        }
      } else if (data.msg === 'showLoadingIcon_indicator') {
        this.loadingData = true;
      } else if (data.msg === 'hideLoadingIcon_indicator') {
        this.loadingData = false;
      } else if (data.msg === 'onDeleteFeatureEntry_indicator') {
        this.broadcastService.broadcast('refreshIndicatorOverviewTable', {
          action: 'edit',
          indicatorId: this.currentIndicatorDataset.indicatorId,
        });
        this.refreshIndicatorEditFeaturesOverviewTable();
      }
    });
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
    this.featureTableGridOptions =
      this.featureTableHelper.buildDataGrid_featureTable_indicatorResource(
        'indicatorFeatureTable',
        [],
        []
      );

    // Register multi-step form handlers
    this.multiStepHelperService.registerClickHandler('indicatorEditFeaturesForm');
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  resetIndicatorEditFeaturesForm(): void {
    this.isPublic = false;
    this.enableDeleteFeatures = false;

    // Reset edit banners
    this.featureTableHelper.featureTable_indicator_lastUpdate_timestamp_success = undefined;
    this.featureTableHelper.featureTable_indicator_lastUpdate_timestamp_failure = undefined;

    this.indicatorFeaturesJSON = undefined;
    this.remainingFeatureHeaders = [];
    this.overviewTableTargetSpatialUnitMetadata = undefined;

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

    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'indicatorEditFeaturesRoleManagementTable',
      this.roleManagementTableOptions,
      this.accessControlService.accessControl,
      [],
      true
    );

    this.spatialUnitRefKeyProperty = '';
    this.targetSpatialUnitMetadata = undefined;
    this.targetApplicableSpatialUnit = undefined;

    this.converter = undefined;
    this.schema = undefined;
    this.mimeType = undefined;
    this.datasourceType = undefined;

    this.converterDefinition = undefined;
    this.datasourceTypeDefinition = undefined;
    this.propertyMappingDefinition = undefined;
    this.putBody_indicators = undefined;

    this.keepMissingValues = true;

    this.successMessagePart = '';
    this.errorMessagePart = '';
    this.importerErrors = [];

    this.broadcastService.broadcast('resetTimeseriesMapping');
  }

  refreshIndicatorEditFeaturesOverviewTable(): void {
    if (!this.overviewTableTargetSpatialUnitMetadata) {
      return;
    }

    this.loadingData = true;

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

        this.featureTableGridOptions =
          this.featureTableHelper.buildDataGrid_featureTable_indicatorResource(
            'indicatorFeatureTable',
            tmpRemainingHeaders,
            this.indicatorFeaturesJSON,
            this.currentIndicatorDataset.indicatorId,
            this.featureTableHelper.resourceType_indicator,
            this.enableDeleteFeatures,
            this.overviewTableTargetSpatialUnitMetadata.spatialUnitId
          );

        this.loadingData = false;
      },
      error: (error: any) => {
        if (error.error) {
          this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error.error);
        } else {
          this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error);
        }
        this.showErrorAlert();
        this.loadingData = false;
      },
    });
  }

  clearAllIndicatorFeatures(): void {
    if (!this.overviewTableTargetSpatialUnitMetadata) {
      return;
    }

    this.loadingData = true;

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

        this.broadcastService.broadcast('refreshIndicatorOverviewTable', {
          action: 'edit',
          indicatorId: this.currentIndicatorDataset.indicatorId,
        });

        // Force empty feature overview table on successful deletion of entries
        this.featureTableGridOptions =
          this.featureTableHelper.buildDataGrid_featureTable_indicatorResource(
            'indicatorFeatureTable',
            [],
            []
          );

        this.successMessagePart = this.currentIndicatorDataset.indicatorName;
        this.showSuccessAlert();
        this.loadingData = false;
      },
      error: (error: any) => {
        if (error.error) {
          this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error.error);
        } else {
          this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error);
        }
        this.showErrorAlert();
        this.loadingData = false;
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

    this.refreshRoles();
  }

  refreshRoles(): void {
    let permissions = this.targetApplicableSpatialUnit
      ? this.targetApplicableSpatialUnit.permissions
      : [];

    if (this.currentIndicatorDataset) {
      const ownerAccessControl = this.accessControlService.getAccessControlById(
        this.currentIndicatorDataset.ownerId
      );
      const permissionIds_ownerUnit = (ownerAccessControl?.permissions || [])
        .filter(
          (permission: any) =>
            permission.permissionLevel == 'viewer' || permission.permissionLevel == 'editor'
        )
        .map((permission: any) => permission.permissionId);

      permissions = permissions.concat(permissionIds_ownerUnit);
    }

    // Set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.accessControlService.accessControl.forEach((item: any) => {
      if (this.currentIndicatorDataset) {
        if (item.organizationalUnitId == this.currentIndicatorDataset.ownerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    this.roleManagementTableOptions = this.roleManagementHelper.buildRoleManagementGrid(
      'indicatorEditFeaturesRoleManagementTable',
      this.roleManagementTableOptions,
      this.accessControlService.accessControl,
      permissions,
      true
    );
  }

  onChangeConverter(): void {
    this.schema = this.converter.schemas ? this.converter.schemas[0] : undefined;
    this.mimeType = this.converter.mimeTypes[0];
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

    const roleIds = this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
      this.roleManagementTableOptions
    );

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
    return this.importerHelperService.buildConverterDefinition(
      this.converter,
      'converterParameter_indicatorEditFeatures_',
      this.schema,
      this.mimeType
    );
  }

  async buildDatasourceTypeDefinition(): Promise<any> {
    try {
      return await this.importerHelperService.buildDatasourceTypeDefinition(
        this.datasourceType,
        'datasourceTypeParameter_indicatorEditFeatures_',
        'indicatorDataSourceInput_editFeatures'
      );
    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error);
      }
      this.showErrorAlert();
      this.loadingData = false;
      return null;
    }
  }

  buildPropertyMappingDefinition(): any {
    const timeseriesMappingForImporter = this.timeseriesMappingReference || [];
    return this.importerHelperService.buildPropertyMapping_indicatorResource(
      this.spatialUnitRefKeyProperty,
      timeseriesMappingForImporter,
      this.keepMissingValues
    );
  }

  async editIndicatorFeatures(): Promise<void> {
    this.loadingData = true;
    this.importerErrors = [];
    this.successMessagePart = '';
    this.errorMessagePart = '';

    // Collect data and build request for importer
    const allDataSpecified = await this.buildImporterObjects();

    if (!allDataSpecified) {
      $('#indicatorEditFeaturesForm').validator('update');
      $('#indicatorEditFeaturesForm').validator('validate');
      this.loadingData = false;
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

        this.broadcastService.broadcast('refreshIndicatorOverviewTable', {
          action: 'edit',
          indicatorId: this.currentIndicatorDataset.indicatorId,
        });

        this.successMessagePart = this.currentIndicatorDataset.indicatorName;
        this.importedFeatures =
          this.importerHelperService.getImportedFeaturesFromImporterResponse(
            updateIndicatorResponse
          ) || [];

        this.showSuccessAlert();
        this.loadingData = false;
      } else {
        // Errors occurred
        this.errorMessagePart =
          'Einige der zu importierenden Zeitreihen des Datensatzes weisen kritische Fehler auf';
        this.importerErrors =
          this.importerHelperService.getErrorsFromImporterResponse(
            updateIndicatorResponse_dryRun
          ) || [];

        this.showErrorAlert();
        this.loadingData = false;
      }
    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.indicatorValueService.syntaxHighlightJSON(error);
      }

      this.showErrorAlert();
      this.loadingData = false;
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

      const roleIds = this.roleManagementHelper.getSelectedRoleIds_roleManagementGrid(
        this.roleManagementTableOptions
      );
      mappingConfigExport.permissions = roleIds;

      mappingConfigExport.isPublic = this.isPublic;
      mappingConfigExport.ownerId = this.currentIndicatorDataset.ownerId;

      const metadataJSON = JSON.stringify(mappingConfigExport);
      const fileName = 'KomMonitor-Import-Mapping-Konfiguration_Export.json';

      const blob = new Blob([metadataJSON], { type: 'application/json' });
      const data = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.download = fileName;
      a.href = data;
      a.textContent = 'JSON';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();

      a.remove();
    });
  }

  // Multi-step form navigation
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

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
    }
  }

  // Alert management
  showSuccessAlert(): void {
    let message = `Fortführen der Zeitreihen des Indikators mit Namen ${this.successMessagePart} war erfolgreich.`;
    if (this.importedFeatures && this.importedFeatures.length > 0) {
      message += ` ${this.importedFeatures.length} Zeitreihen wurden dabei importiert.`;
    }
    this.notificationService.showSuccess(message);
  }

  showErrorAlert(): void {
    // errorMessagePart may contain HTML (syntax-highlighted JSON); reduce it to plain text for the toast
    const tmp = document.createElement('div');
    tmp.innerHTML = this.errorMessagePart || '';
    const detail = (tmp.textContent || '').trim();
    let message = 'Zeitreihen fortführen gescheitert.';
    if (detail) {
      message += ' ' + detail;
    }
    if (this.importerErrors && this.importerErrors.length > 0) {
      message += ` (${this.importerErrors.length} Zeitreihen mit Importfehlern)`;
    }
    this.notificationService.showError(message, { autohide: false });
  }
}
