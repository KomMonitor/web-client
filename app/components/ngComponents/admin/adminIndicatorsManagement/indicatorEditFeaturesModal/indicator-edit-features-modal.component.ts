import { Component, OnInit, Inject, ViewChild, ElementRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import { MultiStepHelperServiceService } from 'services/multi-step-helper-service/multi-step-helper-service.service';

declare const $: any;

@Component({
  selector: 'app-indicator-edit-features-modal',
  templateUrl: './indicator-edit-features-modal.component.html',
  styleUrls: ['./indicator-edit-features-modal.component.css']
})
export class IndicatorEditFeaturesModalComponent implements OnInit {
  @ViewChild('modal') modal!: ElementRef;
  
  private modalRef?: NgbModalRef;
  
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
  indicatorMappingConfigImportError: string = '';
  
  // Loading states
  loadingData: boolean = false;
  
  // Imported features
  importedFeatures: any[] = [];
  
  // Multi-step form
  currentStep: number = 1;
  totalSteps: number = 2;
  
  constructor(
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    @Inject('kommonitorDataExchangeService') public angularJsDataExchangeService: any,
    @Inject('kommonitorDataGridHelperService') public angularJsDataGridHelperService: any,
    @Inject('kommonitorImporterHelperService') public angularJsImporterHelperService: any,
    @Inject('kommonitorMultiStepFormHelperService') private angularJsMultiStepFormHelperService: any,
    private dataExchangeService: DataExchangeService,
    private dataGridHelperService: KommonitorIndicatorDataGridHelperService,
    private multiStepHelperService: MultiStepHelperServiceService
  ) {}

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
          this.currentIndicatorDataset = this.angularJsDataExchangeService.getIndicatorMetadataById(this.currentIndicatorDataset.indicatorId);
        }
      } else if (data.msg === 'showLoadingIcon_indicator') {
        this.loadingData = true;
      } else if (data.msg === 'hideLoadingIcon_indicator') {
        this.loadingData = false;
      } else if (data.msg === 'onDeleteFeatureEntry_indicator') {
        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { action: 'edit', indicatorId: this.currentIndicatorDataset.indicatorId });
        this.refreshIndicatorEditFeaturesOverviewTable();
      }
    });
  }

  private initializeForm(): void {
    this.resetIndicatorEditFeaturesForm();
  }

  openModal(indicatorDataset: any): void {
    if (this.currentIndicatorDataset && this.currentIndicatorDataset.indicatorId === indicatorDataset.indicatorId) {
      return;
    }

    this.currentIndicatorDataset = indicatorDataset;
    this.resetIndicatorEditFeaturesForm();
    this.angularJsDataGridHelperService.buildDataGrid_featureTable_indicatorResource("indicatorFeatureTable", [], []);

    // Register multi-step form handlers
    this.angularJsMultiStepFormHelperService.registerClickHandler("indicatorEditFeaturesForm");
  }

  closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  resetIndicatorEditFeaturesForm(): void {
    this.isPublic = false;
    this.enableDeleteFeatures = false;
    
    // Reset edit banners
    this.angularJsDataGridHelperService.featureTable_indicator_lastUpdate_timestamp_success = undefined;
    this.angularJsDataGridHelperService.featureTable_indicator_lastUpdate_timestamp_failure = undefined;

    this.indicatorFeaturesJSON = undefined;
    this.remainingFeatureHeaders = [];
    this.overviewTableTargetSpatialUnitMetadata = undefined;
    
    // Set default spatial unit
    for (const spatialUnitMetadataEntry of this.angularJsDataExchangeService.availableSpatialUnits) {
      if (this.currentIndicatorDataset?.applicableSpatialUnits?.some((o: any) => o.spatialUnitName === spatialUnitMetadataEntry.spatialUnitLevel)) {
        this.overviewTableTargetSpatialUnitMetadata = spatialUnitMetadataEntry;
        break;
      }
    }

    this.roleManagementTableOptions = this.angularJsDataGridHelperService.buildRoleManagementGrid(
      'indicatorEditFeaturesRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.angularJsDataExchangeService.accessControl, 
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
    this.indicatorMappingConfigImportError = '';

    this.broadcastService.broadcast('resetTimeseriesMapping');

    this.hideSuccessAlert();
    this.hideErrorAlert();
    this.hideMappingConfigErrorAlert();
  }

  refreshIndicatorEditFeaturesOverviewTable(): void {
    if (!this.overviewTableTargetSpatialUnitMetadata) {
      return;
    }

    this.loadingData = true;
    
    const url = this.angularJsDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + 
                "/indicators/" + this.currentIndicatorDataset.indicatorId + "/" + 
                this.overviewTableTargetSpatialUnitMetadata.spatialUnitId + "/without-geometry";

    this.angularJsDataExchangeService.$http({
      url: url,
      method: "GET"
    }).then((response: any) => {
      this.indicatorFeaturesJSON = response.data;
      
      const tmpRemainingHeaders: string[] = [];
      
      for (const property in this.indicatorFeaturesJSON[0]) {
        // Only show indicator date columns as editable fields
        if (property.includes(window.__env.indicatorDatePrefix)) {
          tmpRemainingHeaders.push(property);
        }
      }

      // Sort date headers
      tmpRemainingHeaders.sort((a, b) => a.localeCompare(b));
      
      this.remainingFeatureHeaders = tmpRemainingHeaders;
      
      this.angularJsDataGridHelperService.buildDataGrid_featureTable_indicatorResource(
        "indicatorFeatureTable", 
        tmpRemainingHeaders, 
        this.indicatorFeaturesJSON, 
        this.currentIndicatorDataset.indicatorId, 
        this.angularJsDataGridHelperService.resourceType_indicator, 
        this.enableDeleteFeatures, 
        this.overviewTableTargetSpatialUnitMetadata.spatialUnitId
      );

      this.loadingData = false;
    }).catch((error: any) => {
      if (error.data) {
        this.errorMessagePart = this.angularJsDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.angularJsDataExchangeService.syntaxHighlightJSON(error);
      }
      this.showErrorAlert();
      this.loadingData = false;
    });
  }

  clearAllIndicatorFeatures(): void {
    if (!this.overviewTableTargetSpatialUnitMetadata) {
      return;
    }

    this.loadingData = true;
    
    const url = this.angularJsDataExchangeService.baseUrlToKomMonitorDataAPI + 
                "/indicators/" + this.currentIndicatorDataset.indicatorId + "/" + 
                this.overviewTableTargetSpatialUnitMetadata.spatialUnitId;

    this.angularJsDataExchangeService.$http({
      url: url,
      method: "DELETE"
    }).then((response: any) => {
      this.indicatorFeaturesJSON = undefined;
      this.remainingFeatureHeaders = [];

      this.broadcastService.broadcast('refreshIndicatorOverviewTable', { action: 'edit', indicatorId: this.currentIndicatorDataset.indicatorId });
      
      // Force empty feature overview table on successful deletion of entries
      this.angularJsDataGridHelperService.buildDataGrid_featureTable_indicatorResource("indicatorFeatureTable", [], []);

      this.successMessagePart = this.currentIndicatorDataset.indicatorName;
      this.showSuccessAlert();
      this.loadingData = false;
    }).catch((error: any) => {
      if (error.data) {
        this.errorMessagePart = this.angularJsDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.angularJsDataExchangeService.syntaxHighlightJSON(error);
      }
      this.showErrorAlert();
      this.loadingData = false;
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
    let permissions = this.targetApplicableSpatialUnit ? this.targetApplicableSpatialUnit.permissions : [];
    
    if (this.currentIndicatorDataset) {
      const permissionIds_ownerUnit = this.angularJsDataExchangeService.getAccessControlById(this.currentIndicatorDataset.ownerId)
        .permissions
        .filter((permission: any) => permission.permissionLevel == "viewer" || permission.permissionLevel == "editor")
        .map((permission: any) => permission.permissionId);
      
      permissions = permissions.concat(permissionIds_ownerUnit);
    }

    // Set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.angularJsDataExchangeService.accessControl.forEach((item: any) => {
      if (this.currentIndicatorDataset) {
        if (item.organizationalUnitId == this.currentIndicatorDataset.ownerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    this.roleManagementTableOptions = this.angularJsDataGridHelperService.buildRoleManagementGrid(
      'indicatorEditFeaturesRoleManagementTable', 
      this.roleManagementTableOptions, 
      this.angularJsDataExchangeService.accessControl, 
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
      $(".indicatorDeleteFeatureRecordBtn").attr("disabled", false);
    } else {
      $(".indicatorDeleteFeatureRecordBtn").attr("disabled", true);
    }
  }

  filterOverviewTargetSpatialUnits(): any {
    return (spatialUnitMetadata: any) => {
      if (this.currentIndicatorDataset) {
        const isIncluded = this.currentIndicatorDataset.applicableSpatialUnits.some((o: any) => o.spatialUnitName === spatialUnitMetadata.spatialUnitLevel);
        return isIncluded;
      }
      return false;
    };
  }

  filterByKomMonitorProperties(): any {
    return (item: any) => {
      try {
        if (item === window.__env.FEATURE_ID_PROPERTY_NAME || 
            item === window.__env.FEATURE_NAME_PROPERTY_NAME || 
            item === "validStartDate" || 
            item === "validEndDate") {
          return false;
        }
        return true;
      } catch (error) {
        return false;
      }
    };
  }

  async buildImporterObjects(): Promise<boolean> {
    this.converterDefinition = this.buildConverterDefinition();
    this.datasourceTypeDefinition = await this.buildDatasourceTypeDefinition();
    this.propertyMappingDefinition = this.buildPropertyMappingDefinition();

    const roleIds = this.angularJsDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);

    const scopeProperties = {
      "targetSpatialUnitMetadata": {
        "spatialUnitLevel": this.targetSpatialUnitMetadata.spatialUnitLevel,
      },
      "currentIndicatorDataset": {
        "defaultClassificationMapping": this.currentIndicatorDataset.defaultClassificationMapping
      },
      "permissions": roleIds,
      "ownerId": this.currentIndicatorDataset.ownerId,
      "isPublic": this.isPublic
    };
    
    this.putBody_indicators = this.angularJsImporterHelperService.buildPutBody_indicators(scopeProperties);

    if (!this.converterDefinition || !this.datasourceTypeDefinition || !this.propertyMappingDefinition || !this.putBody_indicators) {
      return false;
    }

    return true;
  }

  buildConverterDefinition(): any {
    return this.angularJsImporterHelperService.buildConverterDefinition(
      this.converter, 
      "converterParameter_indicatorEditFeatures_", 
      this.schema, 
      this.mimeType
    );
  }

  async buildDatasourceTypeDefinition(): Promise<any> {
    try {
      return await this.angularJsImporterHelperService.buildDatasourceTypeDefinition(
        this.datasourceType, 
        'datasourceTypeParameter_indicatorEditFeatures_', 
        'indicatorDataSourceInput_editFeatures'
      );
    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.angularJsDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.angularJsDataExchangeService.syntaxHighlightJSON(error);
      }
      this.showErrorAlert();
      this.loadingData = false;
      return null;
    }
  }

  buildPropertyMappingDefinition(): any {
    let timeseriesMappingForImporter = this.timeseriesMappingReference || [];
    return this.angularJsImporterHelperService.buildPropertyMapping_indicatorResource(
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
      $("#indicatorEditFeaturesForm").validator("update");
      $("#indicatorEditFeaturesForm").validator("validate");
      this.loadingData = false;
      return;
    }

    try {
      // Dry run first
      const updateIndicatorResponse_dryRun = await this.angularJsImporterHelperService.updateIndicator(
        this.converterDefinition, 
        this.datasourceTypeDefinition, 
        this.propertyMappingDefinition, 
        this.currentIndicatorDataset.indicatorId, 
        this.putBody_indicators, 
        true
      );

      if (!this.angularJsImporterHelperService.importerResponseContainsErrors(updateIndicatorResponse_dryRun)) {
        // All good, really execute the request to import data against data management API
        const updateIndicatorResponse = await this.angularJsImporterHelperService.updateIndicator(
          this.converterDefinition, 
          this.datasourceTypeDefinition, 
          this.propertyMappingDefinition, 
          this.currentIndicatorDataset.indicatorId, 
          this.putBody_indicators, 
          false
        );

        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { action: 'edit', indicatorId: this.currentIndicatorDataset.indicatorId });

        this.successMessagePart = this.currentIndicatorDataset.indicatorName;
        this.importedFeatures = this.angularJsImporterHelperService.getImportedFeaturesFromImporterResponse(updateIndicatorResponse);

        this.showSuccessAlert();
        this.loadingData = false;
      } else {
        // Errors occurred
        this.errorMessagePart = "Einige der zu importierenden Zeitreihen des Datensatzes weisen kritische Fehler auf";
        this.importerErrors = this.angularJsImporterHelperService.getErrorsFromImporterResponse(updateIndicatorResponse_dryRun);

        this.showErrorAlert();
        this.loadingData = false;
      }
    } catch (error: any) {
      if (error.data) {
        this.errorMessagePart = this.angularJsDataExchangeService.syntaxHighlightJSON(error.data);
      } else {
        this.errorMessagePart = this.angularJsDataExchangeService.syntaxHighlightJSON(error);
      }
      
      this.showErrorAlert();
      this.loadingData = false;
    }
  }

  onImportIndicatorEditFeaturesMappingConfig(): void {
    this.indicatorMappingConfigImportError = "";
    $("#indicatorMappingConfigEditFeaturesImportFile").files = [];
    $("#indicatorMappingConfigEditFeaturesImportFile").click();
  }

  onExportIndicatorEditFeaturesMappingConfig(): void {
    this.buildImporterObjects().then(() => {
      const mappingConfigExport: any = {
        "converter": this.converterDefinition,
        "dataSource": this.datasourceTypeDefinition,
        "propertyMapping": this.propertyMappingDefinition,
        "targetSpatialUnitName": this.targetSpatialUnitMetadata.spatialUnitLevel,
        "permissions": []
      };

      const roleIds = this.angularJsDataGridHelperService.getSelectedRoleIds_roleManagementGrid(this.roleManagementTableOptions);
      mappingConfigExport.permissions = roleIds;

      mappingConfigExport.isPublic = this.isPublic;
      mappingConfigExport.ownerId = this.currentIndicatorDataset.ownerId;

      const metadataJSON = JSON.stringify(mappingConfigExport);
      const fileName = "KomMonitor-Import-Mapping-Konfiguration_Export.json";

      const blob = new Blob([metadataJSON], { type: "application/json" });
      const data = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.download = fileName;
      a.href = data;
      a.textContent = "JSON";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
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
    $("#indicatorEditFeaturesSuccessAlert").show();
  }

  hideSuccessAlert(): void {
    $("#indicatorEditFeaturesSuccessAlert").hide();
  }

  showErrorAlert(): void {
    $("#indicatorEditFeaturesErrorAlert").show();
  }

  hideErrorAlert(): void {
    $("#indicatorEditFeaturesErrorAlert").hide();
  }

  hideMappingConfigErrorAlert(): void {
    $("#indicatorEditFeaturesMappingConfigImportErrorAlert").hide();
  }
} 