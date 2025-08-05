import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { KommonitorIndicatorDataGridHelperService } from 'services/adminIndicatorUnit/kommonitor-data-grid-helper.service';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';
import { KommonitorIndicatorImporterHelperService } from 'services/adminIndicatorUnit/kommonitor-importer-helper.service';
import { MultiStepHelperServiceService } from 'services/multi-step-helper-service/multi-step-helper-service.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi, ColumnApi, GridReadyEvent, FirstDataRenderedEvent, ColumnResizedEvent } from 'ag-grid-community';

declare const $: any;

@Component({
  selector: 'app-indicator-edit-features-modal',
  templateUrl: './indicator-edit-features-modal.component.html',
  styleUrls: ['./indicator-edit-features-modal.component.css']
})
export class IndicatorEditFeaturesModalComponent implements OnInit, OnDestroy {
  @ViewChild('indicatorFeatureTable', { static: true }) indicatorFeatureTable!: AgGridAngular;
  
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
  public roleManagementColumnDefs: ColDef[] = [];
  public roleManagementRowData: any[] = [];
  public roleManagementGridOptions: GridOptions = {};
  
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
  
  // Mapping config import settings
  mappingConfigImportSettings: any;
  indicatorMappingConfigStructure_pretty: string = '';
  
  // Grid options for feature table
  featureTableGridOptions: GridOptions = {};
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public gridApi!: GridApi;
  private columnApi!: ColumnApi;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  constructor(
    public activeModal: NgbActiveModal,
    private broadcastService: BroadcastService,
    public kommonitorIndicatorDataExchangeService: KommonitorIndicatorDataExchangeService,
    public kommonitorIndicatorDataGridHelperService: KommonitorIndicatorDataGridHelperService,
    public kommonitorIndicatorImporterHelperService: KommonitorIndicatorImporterHelperService,
    private multiStepHelperService: MultiStepHelperServiceService,
    private dataExchangeService: DataExchangeService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    
    this.setupEventListeners();
    this.initializeForm();
    this.buildFeatureTable();
    
    // Initialize mapping config structure
    this.indicatorMappingConfigStructure_pretty = this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(
      this.kommonitorIndicatorImporterHelperService.mappingConfigStructure_indicator
    );
    
    // Fetch spatial units data and access control data
    this.loadSpatialUnitsData();
    this.loadAccessControlData();
    
    // If currentIndicatorDataset is already set (from parent component), initialize form
    if (this.currentIndicatorDataset) {
      this.onEditIndicatorFeatures(this.currentIndicatorDataset);
    }
    
    // Ensure spatial unit is set after data is loaded
    setTimeout(() => {
      this.ensureSpatialUnitIsSet();
      // Initialize role management table
      this.refreshRoles();
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // Listen for edit indicator features event
    const broadcastSubscription = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'onEditIndicatorFeatures') {
        this.onEditIndicatorFeatures(data.values);
      } else if (data.msg === 'timeseriesMappingChanged') {
        this.timeseriesMappingReference = data.mapping;
      } else if (data.msg === 'refreshIndicatorOverviewTableCompleted') {
        if (this.currentIndicatorDataset) {
          this.currentIndicatorDataset = this.kommonitorIndicatorDataExchangeService.getIndicatorMetadataById(this.currentIndicatorDataset.indicatorId);
        }
      } else if (data.msg === 'showLoadingIcon_indicator') {
        this.loadingData = true;
      } else if (data.msg === 'hideLoadingIcon_indicator') {
        this.loadingData = false;
      } else if (data.msg === 'onDeleteFeatureEntry_indicator') {
        // Handle individual feature deletion
        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { 
          action: 'edit', 
          indicatorId: this.currentIndicatorDataset.indicatorId 
        });
        this.refreshIndicatorEditFeaturesOverviewTable();
      }
    });

    this.subscriptions.push(broadcastSubscription);

    // Setup file input change listener
    setTimeout(() => {
      $(document).on("change", "#indicatorMappingConfigEditFeaturesImportFile", (event: any) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          this.parseMappingConfigFromFile(file);
        }
      });
    }, 100);
  }

  private initializeForm(): void {
    // Initialize form components
  }

  private buildFeatureTable(): void {
    
    // Build grid options using the helper service
    this.featureTableGridOptions = this.kommonitorIndicatorDataGridHelperService.buildDataGrid_featureTable_indicatorResource(
      "indicatorFeatureTable", 
      this.remainingFeatureHeaders || [], 
      this.indicatorFeaturesJSON || [],
      this.currentIndicatorDataset?.indicatorId,
      this.kommonitorIndicatorDataGridHelperService.resourceType_indicator,
      this.enableDeleteFeatures
    );
    
    
    
    // Extract column definitions and row data for separate binding
    this.columnDefs = this.featureTableGridOptions.columnDefs || [];
    this.rowData = this.featureTableGridOptions.rowData || [];
    
    
    
    // Ensure grid options are properly structured for AG Grid Angular
    if (this.featureTableGridOptions) {
      // Ensure required properties are present
      if (!this.featureTableGridOptions.defaultColDef) {
        this.featureTableGridOptions.defaultColDef = {
          editable: true,
          sortable: true,
          flex: 1,
          minWidth: 200,
          filter: true,
          floatingFilter: true,
          resizable: true,
          wrapText: true,
          autoHeight: true
        };
      }
      
      // Ensure pagination is enabled
      if (this.featureTableGridOptions.pagination === undefined) {
        this.featureTableGridOptions.pagination = true;
      }
      
      if (this.featureTableGridOptions.paginationPageSize === undefined) {
        this.featureTableGridOptions.paginationPageSize = 10;
      }
      

    }
  }

  onEditIndicatorFeatures(indicatorDataset: any): void {
    
          if (this.currentIndicatorDataset && 
          this.currentIndicatorDataset.indicatorId === indicatorDataset.indicatorId) {
        return;
      }

    this.currentIndicatorDataset = indicatorDataset;
    
    
    // Ensure access control data is loaded before resetting form
    this.loadAccessControlData().then(() => {
      this.resetIndicatorEditFeaturesForm();
      this.buildFeatureTable();
      
      // Ensure spatial unit is set
      this.ensureSpatialUnitIsSet();
      
      // Fetch data for the indicator features after form reset
      if (this.overviewTableTargetSpatialUnitMetadata) {
        this.refreshIndicatorEditFeaturesOverviewTable();
      }
      
      // Force grid to refresh after a short delay to ensure it's ready
      setTimeout(() => {
        if (this.gridApi && this.indicatorFeaturesJSON) {
          this.updateGridData();
        }
      }, 100);
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

  resetIndicatorEditFeaturesForm(): void {
    this.isPublic = false;
    this.enableDeleteFeatures = false;
    
    // Reset edit banners
    this.kommonitorIndicatorDataGridHelperService.featureTable_indicator_lastUpdate_timestamp_success = undefined;
    this.kommonitorIndicatorDataGridHelperService.featureTable_indicator_lastUpdate_timestamp_failure = undefined;

    this.indicatorFeaturesJSON = [];
    this.remainingFeatureHeaders = [];
    this.overviewTableTargetSpatialUnitMetadata = undefined;
    
    // Set default spatial unit (like in AngularJS version)
    this.overviewTableTargetSpatialUnitMetadata = undefined;
    for (const spatialUnitMetadataEntry of this.kommonitorIndicatorDataExchangeService.availableSpatialUnits) {
      if (this.currentIndicatorDataset.applicableSpatialUnits.some((applicableUnit: any) => 
        applicableUnit.spatialUnitName === spatialUnitMetadataEntry.spatialUnitLevel)) {
        this.overviewTableTargetSpatialUnitMetadata = spatialUnitMetadataEntry;
        break;
      }
    }

    // Set targetApplicableSpatialUnit from currentIndicatorDataset.applicableSpatialUnits
    this.targetApplicableSpatialUnit = undefined;
    if (this.currentIndicatorDataset && this.currentIndicatorDataset.applicableSpatialUnits) {
      // Set to the first applicable spatial unit by default
      this.targetApplicableSpatialUnit = this.currentIndicatorDataset.applicableSpatialUnits[0];

    }

    // Initialize role management grid using the new Angular approach
    this.refreshRoles();

    this.spatialUnitRefKeyProperty = '';
    this.targetSpatialUnitMetadata = undefined;

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
    
    // Rebuild the feature table with empty data
    this.buildFeatureTable();
    
    // If we have a target spatial unit selected, fetch the data
    if (this.overviewTableTargetSpatialUnitMetadata) {
      this.refreshIndicatorEditFeaturesOverviewTable();
    }
  }

  refreshIndicatorEditFeaturesOverviewTable(): void {
    if (!this.currentIndicatorDataset || !this.currentIndicatorDataset.indicatorId) {
      return;
    }

    // Use the first applicable spatial unit from the indicator dataset
    if (!this.overviewTableTargetSpatialUnitMetadata && this.currentIndicatorDataset.applicableSpatialUnits?.length > 0) {
      this.overviewTableTargetSpatialUnitMetadata = this.currentIndicatorDataset.applicableSpatialUnits[0];
    }

    if (!this.overviewTableTargetSpatialUnitMetadata) {
      return;
    }

    this.loadingData = true;
    this.hideSuccessAlert();
    this.hideErrorAlert();
    
    const url = this.kommonitorIndicatorDataExchangeService.getBaseUrlToKomMonitorDataAPI_spatialResource() + 
                "/indicators/" + this.currentIndicatorDataset.indicatorId + "/" + 
                this.overviewTableTargetSpatialUnitMetadata.spatialUnitId + "/without-geometry";

    this.http.get(url).subscribe({
      next: (response: any) => {
        // Handle both response.data and direct array response
        let responseData = response;
        if (response && response.data) {
          responseData = response.data;
        }
        
        // Check if we have data
        if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
          this.indicatorFeaturesJSON = [];
          this.remainingFeatureHeaders = [];
          
          // Rebuild the grid with empty data
          this.buildFeatureTable();
          
          setTimeout(() => {
            this.loadingData = false;
          }, 500);
          return;
        }

        this.indicatorFeaturesJSON = responseData;
        
        const tmpRemainingHeaders: string[] = [];
        
        // Extract headers from the first indicator feature
        if (this.indicatorFeaturesJSON[0]) {
          // Get indicator date prefix from environment or use default
          const indicatorDatePrefix = (window.__env && window.__env.indicatorDatePrefix) || 'DATE_';
          
          for (const property in this.indicatorFeaturesJSON[0]) {
            // Only show indicator date columns as editable fields
            if (property.includes(indicatorDatePrefix)) {
              tmpRemainingHeaders.push(property);
            }
          }
        }

        // Sort date headers
        tmpRemainingHeaders.sort((a, b) => a.localeCompare(b));
        
        this.remainingFeatureHeaders = tmpRemainingHeaders;
        
        // Rebuild the grid options with new data
        this.buildFeatureTable();
        
        // Force grid to refresh after a short delay to ensure it's ready
        setTimeout(() => {
          if (this.gridApi && this.indicatorFeaturesJSON) {
            this.updateGridData();
          }
        }, 100);
        
        setTimeout(() => {
          this.loadingData = false;
        }, 500);
      },
      error: (error: any) => {
        this.handleError(error);
        
        // Set empty data on error
        this.indicatorFeaturesJSON = [];
        this.remainingFeatureHeaders = [];
        
        setTimeout(() => {
          this.loadingData = false;
        }, 500);
      }
    });
  }

  /**
   * Update grid data with proper transformation
   */
  private updateGridData(): void {
    if (!this.gridApi || !this.indicatorFeaturesJSON) {
      return;
    }
    
    // Transform the data to match the expected format
    const transformedData = this.indicatorFeaturesJSON.map((feature: any, index: number) => {
      // Ensure each feature has the required properties
      if (feature && typeof feature === 'object') {
        // Add any missing required properties
        if (!feature.hasOwnProperty('kommonitorRecordId')) {
          feature.kommonitorRecordId = feature.fid || feature.ID || feature.id;
        }
        // Add required fields for delete functionality
        feature.datasetId = this.currentIndicatorDataset?.indicatorId;
        feature.spatialUnitId = this.overviewTableTargetSpatialUnitMetadata?.spatialUnitId;
        feature.ID = feature.ID || feature.id || feature.fid;
        feature.fid = feature.fid || feature.ID || feature.id;
        
        return feature;
      }
      return feature;
    });
    
    // Update the rowData property
    this.rowData = transformedData;
    
    // Update the grid with new data
    this.gridApi.setRowData(transformedData);
    
    // Force refresh of the grid
    this.gridApi.refreshCells({ force: true });
    this.gridApi.redrawRows();
    
    // Register click handlers after grid update
    setTimeout(() => {
      this.kommonitorIndicatorDataGridHelperService.registerFeatureTableClickHandlers(
        this.currentIndicatorDataset?.indicatorId,
        this.kommonitorIndicatorDataGridHelperService.resourceType_indicator,
        this.enableDeleteFeatures
      );
    }, 200);
  }

  clearAllIndicatorFeatures(): void {
    if (!this.overviewTableTargetSpatialUnitMetadata) {
      return;
    }

    this.loadingData = true;
    this.hideSuccessAlert();
    this.hideErrorAlert();
    
    const url = this.kommonitorIndicatorDataExchangeService.baseUrlToKomMonitorDataAPI + 
                "/indicators/" + this.currentIndicatorDataset.indicatorId + "/" + 
                this.overviewTableTargetSpatialUnitMetadata.spatialUnitId;

    this.http.delete(url).subscribe({
      next: (response: any) => {
        this.indicatorFeaturesJSON = [];
        this.remainingFeatureHeaders = [];

        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { action: 'edit', indicatorId: this.currentIndicatorDataset.indicatorId });
        
        // Force empty feature overview table on successful deletion of entries
        this.featureTableGridOptions = this.kommonitorIndicatorDataGridHelperService.buildDataGrid_featureTable_indicatorResource(
          "indicatorFeatureTable", 
          [], 
          [], 
          this.currentIndicatorDataset.indicatorId, 
          this.kommonitorIndicatorDataGridHelperService.resourceType_indicator, 
          this.enableDeleteFeatures
        );

        this.successMessagePart = this.currentIndicatorDataset.indicatorName;
        this.showSuccessAlert();
        
        setTimeout(() => {
          this.loadingData = false;
        }, 500);
      },
      error: (error: any) => {
        this.handleError(error);
        setTimeout(() => {
          this.loadingData = false;
        }, 500);
      }
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
    // Ensure access control data is loaded before proceeding
    if (!this.kommonitorIndicatorDataExchangeService.accessControl || this.kommonitorIndicatorDataExchangeService.accessControl.length === 0) {
      this.loadAccessControlData().then(() => {
        this.refreshRoles();
      });
      return;
    }
    
    // Use current user's login role IDs as initial permissions (like in original AngularJS)
    let permissions = this.kommonitorIndicatorDataExchangeService.getCurrentKomMonitorLoginRoleIds();
    
    // If we have a target applicable spatial unit, use its allowedRoles instead
    if (this.targetApplicableSpatialUnit && this.targetApplicableSpatialUnit.allowedRoles) {
      permissions = this.targetApplicableSpatialUnit.allowedRoles;
    }
    
    if (this.currentIndicatorDataset) {
      const accessControl = this.kommonitorIndicatorDataExchangeService.getAccessControlById(this.currentIndicatorDataset.ownerId);
      
      if (accessControl && accessControl.permissions) {
        const permissionIds_ownerUnit = accessControl.permissions
          .filter((permission: any) => permission.permissionLevel == "viewer" || permission.permissionLevel == "editor")
          .map((permission: any) => permission.permissionId);
        
        permissions = permissions.concat(permissionIds_ownerUnit);
      }
    }

    // Set datasetOwner to disable checkboxes for owned datasets in permissions-table
    this.kommonitorIndicatorDataExchangeService.accessControl.forEach((item: any) => {
      if (this.currentIndicatorDataset) {
        if (item.organizationalUnitId == this.currentIndicatorDataset.ownerId) {
          item.datasetOwner = true;
        } else {
          item.datasetOwner = false;
        }
      }
    });

    // Build role management grid using AG Grid Angular
    this.buildRoleManagementGrid(permissions);
  }

  /**
   * Build role management grid using AG Grid Angular
   */
  private buildRoleManagementGrid(permissions: string[]): void {
    // Build grid options
    this.roleManagementGridOptions = {
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true
      },
      pagination: true,
      paginationPageSize: 10
    };

    // Build column definitions
    this.roleManagementColumnDefs = this.buildRoleManagementColumnDefs();

    // Build row data
    this.roleManagementRowData = this.buildRoleManagementRowData(permissions);
  }

  /**
   * Build role management column definitions
   */
  private buildRoleManagementColumnDefs(): ColDef[] {
    const columnDefs: ColDef[] = [
      { 
        headerName: 'Organisationseinheit', 
        field: "organizationalUnitName", 
        pinned: 'left', 
        minWidth: 200 
      }
    ];

    // Add permission columns - using the correct German headers from AngularJS
    columnDefs.push(
      { 
        headerName: 'lesen', 
        field: 'viewer', 
        maxWidth: 100,
        cellRenderer: this.kommonitorIndicatorDataGridHelperService.CheckboxRenderer_viewer
      },
      { 
        headerName: 'editieren', 
        field: 'editor', 
        maxWidth: 100,
        cellRenderer: this.kommonitorIndicatorDataGridHelperService.CheckboxRenderer_editor
      }
    );

    return columnDefs;
  }

  /**
   * Build role management row data
   */
  private buildRoleManagementRowData(permissions: string[]): any[] {
    if (!this.kommonitorIndicatorDataExchangeService.accessControl || this.kommonitorIndicatorDataExchangeService.accessControl.length === 0) {
      return [];
    }

    return this.kommonitorIndicatorDataExchangeService.accessControl.map(item => {
      // Extract permission IDs from the permissions array
      const viewerPermission = item.permissions?.find((p: any) => p.permissionLevel === 'viewer');
      const editorPermission = item.permissions?.find((p: any) => p.permissionLevel === 'editor');
      const creatorPermission = item.permissions?.find((p: any) => p.permissionLevel === 'creator');
      
      const viewerPermissionId = viewerPermission?.permissionId || '';
      const editorPermissionId = editorPermission?.permissionId || '';
      const creatorPermissionId = creatorPermission?.permissionId || '';
      
      const result = {
        organizationalUnitId: item.organizationalUnitId,
        organizationalUnitName: item.name,
        viewer: permissions.includes(viewerPermissionId),
        editor: permissions.includes(editorPermissionId),
        creator: permissions.includes(creatorPermissionId),
        datasetOwner: item.datasetOwner || false,
        // Store the permission IDs for later use
        viewerPermissionId: viewerPermissionId,
        editorPermissionId: editorPermissionId,
        creatorPermissionId: creatorPermissionId
      };
      
      return result;
    });
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
    // Rebuild the grid with updated delete settings
    this.buildFeatureTable();

    // Update grid column definitions and data if API is available
    if (this.gridApi && this.columnDefs) {
      // Update column definitions
      this.gridApi.setColumnDefs(this.columnDefs);
      
      // Update data if we have features
      if (this.indicatorFeaturesJSON && this.indicatorFeaturesJSON.length > 0) {
        this.updateGridData();
      }
      
      // Force refresh of the grid to show/hide delete buttons
      this.gridApi.refreshCells({ force: true });
      
      // Register click handlers after grid update
      setTimeout(() => {
        this.kommonitorIndicatorDataGridHelperService.registerFeatureTableClickHandlers(
          this.currentIndicatorDataset?.indicatorId,
          this.kommonitorIndicatorDataGridHelperService.resourceType_indicator,
          this.enableDeleteFeatures
        );
      }, 100);
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

    const roleIds = this.getSelectedRoleIds();

    // Create the put body manually since there's no buildPutBody_indicators method
    this.putBody_indicators = {
      "targetSpatialUnitMetadata": {
        "spatialUnitLevel": this.targetSpatialUnitMetadata?.spatialUnitLevel,
      },
      "currentIndicatorDataset": {
        "defaultClassificationMapping": this.currentIndicatorDataset?.defaultClassificationMapping
      },
      "permissions": roleIds || [],
      "ownerId": this.currentIndicatorDataset?.ownerId,
      "isPublic": this.isPublic
    };

    if (!this.converterDefinition || !this.datasourceTypeDefinition || !this.propertyMappingDefinition || !this.putBody_indicators) {
      return false;
    }

    return true;
  }

  buildConverterDefinition(): any {
    return this.kommonitorIndicatorImporterHelperService.buildConverterDefinition(
      this.converter, 
      "converterParameter_indicatorEditFeatures_", 
      this.schema, 
      this.mimeType
    );
  }

  async buildDatasourceTypeDefinition(): Promise<any> {
    try {
      return await this.kommonitorIndicatorImporterHelperService.buildDatasourceTypeDefinition(
        this.datasourceType, 
        'datasourceTypeParameter_indicatorEditFeatures_', 
        'indicatorDataSourceInput_editFeatures'
      );
    } catch (error: any) {
      this.handleError(error);
      return null;
    }
  }

  buildPropertyMappingDefinition(): any {
    let timeseriesMappingForImporter = this.timeseriesMappingReference || [];
    return this.kommonitorIndicatorImporterHelperService.buildPropertyMapping_indicatorResource(
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
      const updateIndicatorResponse_dryRun = await this.kommonitorIndicatorImporterHelperService.updateIndicator(
        this.converterDefinition, 
        this.datasourceTypeDefinition, 
        this.propertyMappingDefinition, 
        this.currentIndicatorDataset.indicatorId, 
        this.putBody_indicators, 
        true
      );

      if (!this.kommonitorIndicatorImporterHelperService.importerResponseContainsErrors(updateIndicatorResponse_dryRun)) {
        // All good, really execute the request to import data against data management API
        const updateIndicatorResponse = await this.kommonitorIndicatorImporterHelperService.updateIndicator(
          this.converterDefinition, 
          this.datasourceTypeDefinition, 
          this.propertyMappingDefinition, 
          this.currentIndicatorDataset.indicatorId, 
          this.putBody_indicators, 
          false
        );

        this.broadcastService.broadcast('refreshIndicatorOverviewTable', { action: 'edit', indicatorId: this.currentIndicatorDataset.indicatorId });

        this.successMessagePart = this.currentIndicatorDataset.indicatorName;
        this.importedFeatures = this.kommonitorIndicatorImporterHelperService.getImportedFeaturesFromImporterResponse(updateIndicatorResponse) || [];

        this.showSuccessAlert();
        this.loadingData = false;
      } else {
        // Errors occurred
        this.errorMessagePart = "Einige der zu importierenden Zeitreihen des Datensatzes weisen kritische Fehler auf";
        this.importerErrors = this.kommonitorIndicatorImporterHelperService.getErrorsFromImporterResponse(updateIndicatorResponse_dryRun) || [];

        this.showErrorAlert();
        this.loadingData = false;
      }
    } catch (error: any) {
      this.handleError(error);
      this.loadingData = false;
    }
  }

  onImportIndicatorEditFeaturesMappingConfig(): void {
    this.indicatorMappingConfigImportError = "";
    $("#indicatorMappingConfigEditFeaturesImportFile").files = [];
    $("#indicatorMappingConfigEditFeaturesImportFile").click();
  }

  parseMappingConfigFromFile(file: File): void {
    const fileReader = new FileReader();

    fileReader.onload = (event: any) => {
      try {
        this.parseFromMappingConfigFile(event);
      } catch (error) {
        this.indicatorMappingConfigImportError = "Uploaded MappingConfig File cannot be parsed correctly";
        const element = document.getElementById("indicatorsEditFeaturesMappingConfigPre");
        if (element) {
          element.innerHTML = this.indicatorMappingConfigStructure_pretty;
        }
        this.showMappingConfigErrorAlert();
      }
    };

    // Read in the file as text
    fileReader.readAsText(file);
  }

  parseFromMappingConfigFile(event: any): void {
    this.mappingConfigImportSettings = JSON.parse(event.target.result);

    if (!this.mappingConfigImportSettings.converter || 
        !this.mappingConfigImportSettings.dataSource || 
        !this.mappingConfigImportSettings.propertyMapping) {
      this.indicatorMappingConfigImportError = "Struktur der Datei stimmt nicht mit erwartetem Muster überein.";
      const element = document.getElementById("indicatorsEditFeaturesMappingConfigPre");
      if (element) {
        element.innerHTML = this.indicatorMappingConfigStructure_pretty;
      }
      this.showMappingConfigErrorAlert();
      return;
    }
    
    this.converter = undefined;
    for (const converter of this.kommonitorIndicatorImporterHelperService.availableConverters) {
      if (converter.name === this.mappingConfigImportSettings.converter.name) {
        this.converter = converter;
        break;
      }
    }
    
    this.schema = undefined;
    if (this.converter && this.converter.schemas && this.mappingConfigImportSettings.converter.schema) {
      for (const schema of this.converter.schemas) {
        if (schema === this.mappingConfigImportSettings.converter.schema) {
          this.schema = schema;
        }
      }
    }
    
    this.mimeType = undefined;
    if (this.converter && this.converter.mimeTypes && this.mappingConfigImportSettings.converter.mimeType) {
      for (const mimeType of this.converter.mimeTypes) {
        if (mimeType === this.mappingConfigImportSettings.converter.mimeType) {
          this.mimeType = mimeType;
        }
      }
    }
    
    this.datasourceType = undefined;
    for (const datasourceType of this.kommonitorIndicatorImporterHelperService.availableDatasourceTypes) {
      if (datasourceType.type === this.mappingConfigImportSettings.dataSource.type) {
        this.datasourceType = datasourceType;
        break;
      }
    }

    // Converter parameters
    if (this.converter) {
      for (const convParameter of this.mappingConfigImportSettings.converter.parameters) {
        const element = document.getElementById("converterParameter_indicatorEditFeatures_" + convParameter.name) as HTMLInputElement;
        if (element) {
          element.value = convParameter.value;
        }
      }
    }

    // DatasourceTypes parameters
    if (this.datasourceType) {
      for (const dsParameter of this.mappingConfigImportSettings.dataSource.parameters) {
        const element = document.getElementById("datasourceTypeParameter_indicatorEditFeatures_" + dsParameter.name) as HTMLInputElement;
        if (element) {
          element.value = dsParameter.value;
        }
      }
    }
    
    // Property Mapping
    this.spatialUnitRefKeyProperty = this.mappingConfigImportSettings.propertyMapping.spatialReferenceKeyProperty;
    
    this.broadcastService.broadcast('loadTimeseriesMapping', { mapping: this.mappingConfigImportSettings.propertyMapping.timeseriesMappings });

    if (this.mappingConfigImportSettings.targetSpatialUnitName) {
      for (const spatialUnitMetadata of this.kommonitorIndicatorDataExchangeService.availableSpatialUnits) {
        if (spatialUnitMetadata.spatialUnitLevel === this.mappingConfigImportSettings.targetSpatialUnitName) {
          this.targetSpatialUnitMetadata = spatialUnitMetadata;
        }
      }
    }

    // Build role management grid with imported permissions
    this.buildRoleManagementGrid(this.mappingConfigImportSettings.allowedRoles || []);

    this.keepMissingValues = this.mappingConfigImportSettings.propertyMapping.keepMissingOrNullValueIndicator;
  }

  onExportIndicatorEditFeaturesMappingConfig(): void {
    this.buildImporterObjects().then(() => {
      const mappingConfigExport: any = {
        "converter": this.converterDefinition,
        "dataSource": this.datasourceTypeDefinition,
        "propertyMapping": this.propertyMappingDefinition,
        "targetSpatialUnitName": this.targetSpatialUnitMetadata.spatialUnitLevel,
        "allowedRoles": []
      };

      const roleIds = this.getSelectedRoleIds();
      mappingConfigExport.allowedRoles = roleIds;

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

  // AG Grid event handlers
  onGridReady(event: GridReadyEvent): void {
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
    
    // If we have data, set it to the grid
    if (this.indicatorFeaturesJSON && this.indicatorFeaturesJSON.length > 0) {
      this.updateGridData();
    }
    
    // Also set the column definitions if available
    if (this.columnDefs && this.columnDefs.length > 0) {
      this.gridApi.setColumnDefs(this.columnDefs);
    }
    
    // Register click handlers for delete functionality
    setTimeout(() => {
      this.kommonitorIndicatorDataGridHelperService.registerFeatureTableClickHandlers(
        this.currentIndicatorDataset?.indicatorId,
        this.kommonitorIndicatorDataGridHelperService.resourceType_indicator,
        this.enableDeleteFeatures
      );
    }, 100);
  }

  onFirstDataRendered(event: FirstDataRenderedEvent): void {
    // Handle first data rendered event
  }

  onColumnResized(event: ColumnResizedEvent): void {
    // Handle column resize event
  }

  onCellValueChanged(event: any): void {
    // Handle cell value changes - this will be called by the grid
    // The actual API call and visual feedback is handled in the data grid helper service
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

  showMappingConfigErrorAlert(): void {
    $("#indicatorEditFeaturesMappingConfigImportErrorAlert").show();
  }

  hideMappingConfigErrorAlert(): void {
    $("#indicatorEditFeaturesMappingConfigImportErrorAlert").hide();
  }

  private handleError(error: any): void {
    if (error.data) {
      this.errorMessagePart = this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error.data);
    } else {
      this.errorMessagePart = this.kommonitorIndicatorDataExchangeService.syntaxHighlightJSON(error);
    }
    this.showErrorAlert();
  }

  /**
   * Check if refresh button should be enabled
   */
  isRefreshButtonEnabled(): boolean {
    // Enable button if we have a current indicator dataset with applicable spatial units
    return !!this.currentIndicatorDataset && 
           this.currentIndicatorDataset.applicableSpatialUnits && 
           this.currentIndicatorDataset.applicableSpatialUnits.length > 0;
  }

  /**
   * Check if clear button should be enabled
   */
  isClearButtonEnabled(): boolean {
    return this.enableDeleteFeatures && !!this.overviewTableTargetSpatialUnitMetadata;
  }

  /**
   * Get filtered converters for indicator resource type
   */
  getFilteredConvertersForIndicator(): any[] {
    const converters = this.kommonitorIndicatorImporterHelperService.availableConverters;
    const filterFn = this.kommonitorIndicatorImporterHelperService.filterConverters('indicator');
    return converters.filter(filterFn);
  }

  /**
   * Get available converters for indicators
   */
  getAvailableConvertersForIndicator(): any[] {
    return this.kommonitorIndicatorImporterHelperService.availableConverters;
  }

  /**
   * Get available datasource types
   */
  getAvailableDatasourceTypes(): any[] {
    return this.kommonitorIndicatorImporterHelperService.availableDatasourceTypes;
  }

  /**
   * Get available spatial units filtered for current indicator
   */
  getAvailableSpatialUnits(): any[] {
    if (!this.currentIndicatorDataset || !this.currentIndicatorDataset.applicableSpatialUnits) {
      return [];
    }
    
    // Filter spatial units to only show those applicable to the current indicator
    return this.kommonitorIndicatorDataExchangeService.availableSpatialUnits.filter((spatialUnit: any) => {
      return this.currentIndicatorDataset.applicableSpatialUnits.some((applicableUnit: any) => 
        applicableUnit.spatialUnitId === spatialUnit.spatialUnitId ||
        applicableUnit.spatialUnitName === spatialUnit.spatialUnitLevel ||
        applicableUnit.spatialUnitName === spatialUnit.spatialUnitName
      );
    });
  }

  /**
   * Check if keycloak security is enabled
   */
  isKeycloakSecurityEnabled(): boolean {
    return this.kommonitorIndicatorDataExchangeService.enableKeycloakSecurity;
  }

  /**
   * Check if user has admin permissions
   */
  hasAdminPermissions(): boolean {
    return this.kommonitorIndicatorDataExchangeService.checkAdminPermission();
  }

  /**
   * Check if user has create permissions
   */
  hasCreatePermissions(): boolean {
    return this.kommonitorIndicatorDataExchangeService.checkCreatePermission();
  }

  /**
   * Check if role management section should be visible
   */
  shouldShowRoleManagement(): boolean {
    // Only show if Keycloak security is enabled
    if (!this.isKeycloakSecurityEnabled()) {
      return false;
    }
    
    // Only show if user has admin or create permissions
    if (!this.hasAdminPermissions() && !this.hasCreatePermissions()) {
      return false;
    }
    
    // Only show if we have a current indicator dataset
    if (!this.currentIndicatorDataset) {
      return false;
    }
    
    // Only show if we have access control data
    if (!this.kommonitorIndicatorDataExchangeService.accessControl || 
        this.kommonitorIndicatorDataExchangeService.accessControl.length === 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if current user is the owner of the indicator dataset
   */
  isCurrentUserOwner(): boolean {
    if (!this.currentIndicatorDataset || !this.currentIndicatorDataset.ownerId) {
      return false;
    }
    
    // Get current user's organizational unit ID
    const currentUserOrgUnitId = this.kommonitorIndicatorDataExchangeService.currentKeycloakLoginRoles?.[0];
    
    return currentUserOrgUnitId === this.currentIndicatorDataset.ownerId;
  }

  /**
   * Get feature table success timestamp
   */
  getFeatureTableSuccessTimestamp(): string | undefined {
    return this.kommonitorIndicatorDataGridHelperService.featureTable_indicator_lastUpdate_timestamp_success;
  }

  /**
   * Get feature table failure timestamp
   */
  getFeatureTableFailureTimestamp(): string | undefined {
    return this.kommonitorIndicatorDataGridHelperService.featureTable_indicator_lastUpdate_timestamp_failure;
  }

  /**
   * Check if grid has data
   */
  hasGridData(): boolean {
    return this.indicatorFeaturesJSON && this.indicatorFeaturesJSON.length > 0;
  }

  /**
   * Get grid data count
   */
  getGridDataCount(): number {
    return this.indicatorFeaturesJSON ? this.indicatorFeaturesJSON.length : 0;
  }

  /**
   * Force grid refresh
   */
  forceGridRefresh(): void {
    if (this.gridApi) {
      this.updateGridData();
    }
  }

  /**
   * Check if grid API is available
   */
  isGridApiAvailable(): boolean {
    return !!this.gridApi;
  }

  /**
   * Check if role management grid has data
   */
  hasRoleManagementGridData(): boolean {
    return this.roleManagementRowData && this.roleManagementRowData.length > 0;
  }

  /**
   * Get role management grid data count
   */
  getRoleManagementGridDataCount(): number {
    return this.roleManagementRowData ? this.roleManagementRowData.length : 0;
  }

  /**
   * Role management grid ready event handler
   */
  onRoleManagementGridReady(event: GridReadyEvent): void {
    // Grid is ready
  }

  /**
   * Load spatial units data
   */
  private async loadSpatialUnitsData(): Promise<void> {
    try {
      const currentRoles = this.kommonitorIndicatorDataExchangeService.currentKeycloakLoginRoles;
      await this.kommonitorIndicatorDataExchangeService.fetchSpatialUnitsMetadata(currentRoles);
    } catch (error) {
      console.error('Error loading spatial units data:', error);
    }
  }

  /**
   * Load access control data
   */
  private async loadAccessControlData(): Promise<void> {
    try {
      await this.kommonitorIndicatorDataExchangeService.fetchAccessControlMetadata();
      
      // If no access control data is loaded, create some test data for development
      if (!this.kommonitorIndicatorDataExchangeService.accessControl || this.kommonitorIndicatorDataExchangeService.accessControl.length === 0) {
        this.createTestAccessControlData();
      }
    } catch (error) {
      // Create test data as fallback
      this.createTestAccessControlData();
    }
  }

  /**
   * Create test access control data for development
   */
  private createTestAccessControlData(): void {
    const testData = [
      {
        organizationalUnitId: 'test-org-1',
        name: 'Test Organization 1',
        permissions: [
          {
            permissionId: 'viewer-perm-1',
            permissionLevel: 'viewer',
            isChecked: false
          },
          {
            permissionId: 'editor-perm-1',
            permissionLevel: 'editor',
            isChecked: false
          },
          {
            permissionId: 'creator-perm-1',
            permissionLevel: 'creator',
            isChecked: false
          }
        ],
        datasetOwner: false
      },
      {
        organizationalUnitId: 'test-org-2',
        name: 'Test Organization 2',
        permissions: [
          {
            permissionId: 'viewer-perm-2',
            permissionLevel: 'viewer',
            isChecked: false
          },
          {
            permissionId: 'editor-perm-2',
            permissionLevel: 'editor',
            isChecked: false
          },
          {
            permissionId: 'creator-perm-2',
            permissionLevel: 'creator',
            isChecked: false
          }
        ],
        datasetOwner: false
      }
    ];
    
          this.kommonitorIndicatorDataExchangeService.accessControl = testData;
  }

  /**
   * Ensure spatial unit is set for the button to be enabled
   */
  private ensureSpatialUnitIsSet(): void {
    // Use the first applicable spatial unit from the indicator dataset
    if (!this.overviewTableTargetSpatialUnitMetadata && 
        this.currentIndicatorDataset?.applicableSpatialUnits?.length > 0) {
      this.overviewTableTargetSpatialUnitMetadata = this.currentIndicatorDataset.applicableSpatialUnits[0];
    }
  }

  /**
   * Get selected role IDs from the role management grid
   */
  getSelectedRoleIds(): string[] {
    const selectedRoleIds: string[] = [];
    
    if (this.roleManagementRowData) {
      this.roleManagementRowData.forEach(row => {
        if (row.viewer && row.viewerPermissionId) {
          selectedRoleIds.push(row.viewerPermissionId);
        }
        if (row.editor && row.editorPermissionId) {
          selectedRoleIds.push(row.editorPermissionId);
        }
        if (row.creator && row.creatorPermissionId) {
          selectedRoleIds.push(row.creatorPermissionId);
        }
      });
    }
    
    return selectedRoleIds;
  }
} 