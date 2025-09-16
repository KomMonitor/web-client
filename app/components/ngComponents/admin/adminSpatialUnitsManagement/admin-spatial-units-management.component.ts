import { Component, Inject, OnInit, NgZone, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SpatialUnitAddModalComponent } from './spatialUnitAddModal/spatial-unit-add-modal.component';
import { SpatialUnitEditMetadataModalComponent } from './spatialUnitEditMetadataModal/spatial-unit-edit-metadata-modal.component';
import { SpatialUnitEditFeaturesModalComponent } from './spatialUnitEditFeaturesModal/spatial-unit-edit-features-modal.component';
import { SpatialUnitEditUserRolesModalComponent } from './spatialUnitEditUserRolesModal/spatial-unit-edit-user-roles-modal.component';
import { SpatialUnitDeleteModalComponent } from './spatialUnitDeleteModal/spatial-unit-delete-modal.component';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorCacheHelperService } from 'services/adminSpatialUnit/kommonitor-cache-helper.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, GridApi, ColumnApi, FirstDataRenderedEvent, ColumnResizedEvent } from 'ag-grid-community';
declare const $: any;
declare const __env: any;

@Component({
  selector: 'admin-spatial-units-management-new',
  templateUrl: './admin-spatial-units-management.component.html',
  styleUrls: ['./admin-spatial-units-management.component.css']
})
export class AdminSpatialUnitsManagementComponent implements OnInit, OnDestroy {
  @ViewChild('spatialUnitOverviewTable', { static: true }) spatialUnitOverviewTable!: AgGridAngular;

  public loadingData: boolean = true;
  public initializationCompleted: boolean = false;
  public tableViewSwitcher: boolean = false;
  private subscriptions: Subscription[] = [];

  // AG Grid properties
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public defaultColDef: ColDef = {};
  public gridOptions: GridOptions = {};
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;

  // Pagination properties
  public paginationPageSize: number = 10;
  public paginationPageSizeSelector: number[] = [10, 25, 50, 100];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private zone: NgZone,
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    private kommonitorCacheHelperService: KommonitorCacheHelperService,
    private kommonitorDataGridHelperService: KommonitorDataGridHelperService
  ) {}

  ngOnInit(): void {
    
    
    // Subscribe to spatial units data
    const spatialUnitsSub = this.kommonitorDataExchangeService.spatialUnits$.subscribe(spatialUnits => {
      if (spatialUnits && spatialUnits.length > 0) {
        this.loadingData = false;
        this.initializationCompleted = true;
        this.buildDataGrid_spatialUnits(spatialUnits);
      } else {
      }
    });
    this.subscriptions.push(spatialUnitsSub);

    // Subscribe to loading state
    const loadingSub = this.kommonitorDataExchangeService.loading$.subscribe(loading => {
      this.loadingData = loading;
    });
    this.subscriptions.push(loadingSub);

    // Subscribe to error state
    const errorSub = this.kommonitorDataExchangeService.error$.subscribe(error => {
      if (error) {
        // You can add error handling UI here
      }
    });
    this.subscriptions.push(errorSub);

    this.setupEventListeners();
    
    // Fetch spatial units data
    this.fetchSpatialUnitsData();
    
    // Add a fallback timeout to prevent infinite loading
    setTimeout(() => {
      if (this.loadingData) {
        this.fetchSpatialUnitsData();
        
        // If still no data after fallback, stop loading anyway
        if (!this.kommonitorDataExchangeService.availableSpatialUnits || this.kommonitorDataExchangeService.availableSpatialUnits.length === 0) {
          this.loadingData = false;
          this.initializationCompleted = true;
        }
      }
    }, 3000); // 3 second timeout
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupEventListeners(): void {
    // Listen for the global metadata loading completion event
    const sub = this.broadcastService.currentBroadcastMsg.subscribe(data => {
      if (data.msg === 'initialMetadataLoadingCompleted') {
        this.zone.run(() => {
          this.fetchSpatialUnitsData();
        });
      }
      else if (data.msg === 'refreshSpatialUnitOverviewTable') {
        this.zone.run(() => {
          this.loadingData = true;
          // Extract crudType and targetSpatialUnitId from the broadcast data values
          const crudType = (data.values as any)?.crudType;
          const targetSpatialUnitId = (data.values as any)?.targetSpatialUnitId;
          this.refreshSpatialUnitOverviewTable(crudType, targetSpatialUnitId);
        });
      }
      // Handle grid button click events
      else if (data.msg === 'onEditSpatialUnitMetadata') {
        this.zone.run(() => {
          this.onClickEditMetadata(data.values);
        });
      }
      else if (data.msg === 'onEditSpatialUnitFeatures') {
        this.zone.run(() => {
          this.onClickEditFeatures(data.values);
        });
      }
      else if (data.msg === 'onEditSpatialUnitUserRoles') {
        this.zone.run(() => {
          this.onClickEditUserRoles(data.values);
        });
      }
      else if (data.msg === 'onDeleteSpatialUnits') {
        this.zone.run(() => {
          // Ensure data.values is an array for delete operation
          const datasetsToDelete = Array.isArray(data.values) ? data.values : [data.values];
          this.onClickDeleteSpatialUnits(datasetsToDelete);
        });
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Fetch spatial units data from the service
   */
  private fetchSpatialUnitsData(): void {
    
    // Get current roles or use empty array as fallback
    const currentRoles = this.kommonitorDataExchangeService.currentKeycloakLoginRoles || [];
    
    this.kommonitorDataExchangeService.fetchSpatialUnitsMetadata(currentRoles).subscribe({
      next: (spatialUnits) => {
        // The data will be handled by the subscription in ngOnInit
      },
      error: (error) => {
        this.loadingData = false;
        this.initializationCompleted = true;
      }
    });
  }

  public initializeOrRefreshOverviewTable(): void {
    this.fetchSpatialUnitsData();
  }

  // Debug method to force stop loading
  stopLoading(): void {
    this.loadingData = false;
    this.initializationCompleted = true;
  }

  // Table view switcher method
  onTableViewSwitch(): void {
    // Filter the data based on the tableViewSwitcher state
    // For now, just refresh the table
    this.initializeOrRefreshOverviewTable();
  }

  // Alias for the add spatial unit modal (matching HTML template)
  openAddSpatialUnitModal(): void {
    this.onClickAddSpatialUnit();
  }

  // Modal event handlers
  onClickAddSpatialUnit(): void {
    const modalRef = this.modalService.open(SpatialUnitAddModalComponent, {
      // omit size to avoid Bootstrap max-width caps like modal-lg
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'spatial-unit-add-modal',
      windowClass: 'spatial-unit-add-modal-window'
    });
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickEditMetadata(spatialUnitMetadata: any): void {
    const modalRef = this.modalService.open(SpatialUnitEditMetadataModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'spatial-unit-add-modal',
      windowClass: 'spatial-unit-add-modal-window'
    });
    
    modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickEditFeatures(spatialUnitMetadata: any): void {
    const modalRef = this.modalService.open(SpatialUnitEditFeaturesModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'spatial-unit-add-modal',
      windowClass: 'spatial-unit-add-modal-window'
    });
    
    modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickEditUserRoles(spatialUnitMetadata: any): void {
    const modalRef = this.modalService.open(SpatialUnitEditUserRolesModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'spatial-unit-add-modal',
      windowClass: 'spatial-unit-add-modal-window'
    });
    
    modalRef.componentInstance.currentSpatialUnitDataset = spatialUnitMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  onClickDeleteSpatialUnits(spatialUnitsMetadata: any[]): void {
    const modalRef = this.modalService.open(SpatialUnitDeleteModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'spatial-unit-add-modal',
      windowClass: 'spatial-unit-add-modal-window'
    });
    
    modalRef.componentInstance.datasetsToDelete = spatialUnitsMetadata;
    
    modalRef.result.then((result) => {
      if (result) {
        this.initializeOrRefreshOverviewTable();
      }
    }).catch(() => {
      // Modal dismissed
    });
  }

  // Utility methods
  checkCreatePermission(): boolean {
    return this.kommonitorDataExchangeService.checkCreatePermission();
  }

  refreshSpatialUnitOverviewTable(crudType?: string, targetSpatialUnitId?: string | string[]): void {
    if (!crudType || !targetSpatialUnitId) {
      // Refetch all metadata from spatial units to update table
      this.kommonitorDataExchangeService.fetchSpatialUnitsMetadata(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles
      ).subscribe({
        next: (response) => {
          this.initializeOrRefreshOverviewTable();
          this.loadingData = false;
        },
        error: (response) => {
          this.loadingData = false;
        }
      });
    }
    else if (crudType && targetSpatialUnitId) {
      if (crudType === 'edit') {
        // Fetch single spatial unit metadata and update the table
        this.kommonitorCacheHelperService.fetchSingleSpatialUnitMetadata(
          targetSpatialUnitId as string, 
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles
        ).subscribe({
          next: (data) => {
            this.kommonitorDataExchangeService.replaceSingleSpatialUnitMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.loadingData = false;
          },
          error: (response) => {
            this.loadingData = false;
          }
        });
      }
      else if (crudType === 'add') {
        // Fetch single spatial unit metadata and add to table
        this.kommonitorCacheHelperService.fetchSingleSpatialUnitMetadata(
          targetSpatialUnitId as string, 
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles
        ).subscribe({
          next: (data) => {
            this.kommonitorDataExchangeService.addSingleSpatialUnitMetadata(data);
            this.initializeOrRefreshOverviewTable();
            this.loadingData = false;
          },
          error: (response) => {
            this.loadingData = false;
          }
        });
      }
      else if (crudType === 'delete') {
        // Handle delete operation
        if (typeof targetSpatialUnitId === 'string') {
          this.kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(targetSpatialUnitId);
        } else if (Array.isArray(targetSpatialUnitId)) {
          for (const id of targetSpatialUnitId) {
            this.kommonitorDataExchangeService.deleteSingleSpatialUnitMetadata(id);
          }
        }
        this.initializeOrRefreshOverviewTable();
        this.loadingData = false;
      }
    }
  }

  // AG Grid methods - using hybrid approach
  private buildDataGrid_spatialUnits(spatialUnitMetadataArray: any[]): void {
    // Get base configuration from service
    const baseGridOptions = this.kommonitorDataGridHelperService.buildDataGridOptions_spatialUnits(spatialUnitMetadataArray);
    
    // Extract service configuration
    this.columnDefs = baseGridOptions.columnDefs || [];
    this.rowData = baseGridOptions.rowData || [];
    this.defaultColDef = baseGridOptions.defaultColDef || {};
    
    // Add component-specific columns that are not in the service
    this.addComponentSpecificColumns();
    
    // Override with component-specific settings
    this.gridOptions = {
      ...baseGridOptions,
      columnDefs: this.columnDefs, // Use updated columnDefs
      paginationPageSize: this.paginationPageSize,
      paginationPageSizeSelector: this.paginationPageSizeSelector,
      onGridReady: (params) => {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
      },
      onFirstDataRendered: (event) => {
        this.headerHeightSetter();
        // Click handler registration is now handled by the service
      },
      onColumnResized: (event) => {
        this.headerHeightSetter();
      }
    };
  }

  // Add component-specific columns that are not in the service
  private addComponentSpecificColumns(): void {
    // Add the missing Umringslayer columns after the existing columns
    this.columnDefs.push(
      { 
        headerName: 'Linienfarbe (Umringslayer)', 
        minWidth: 200, 
        cellRenderer: (params: any) => params.data.outlineColor || '-',
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + (params.data.outlineColor || '-')
      },
      { 
        headerName: 'Linienbreite (Umringslayer)', 
        minWidth: 200, 
        cellRenderer: (params: any) => params.data.outlineWidth || '-',
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + (params.data.outlineWidth || '-')
      },
      { 
        headerName: 'Linienmuster (Umringslayer)', 
        minWidth: 200, 
        cellRenderer: (params: any) => params.data.outlineDashArrayString || '-',
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + (params.data.outlineDashArrayString || '-')
      }
    );
  }

  private buildDefaultColDef(): ColDef {
    return {
      editable: false,
      sortable: true,
      flex: 1,
      minWidth: 200,
      filter: true,
      floatingFilter: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      cellStyle: { 
        'font-size': '12px', 
        'white-space': 'normal !important', 
        'line-height': '20px !important', 
        'word-break': 'break-word !important', 
        'padding-top': '17px', 
        'padding-bottom': '17px' 
      }
    };
  }

  private buildGridOptions(spatialUnitMetadataArray: any[]): GridOptions {
    return {
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: this.paginationPageSize,
      paginationPageSizeSelector: this.paginationPageSizeSelector,
      suppressColumnVirtualisation: true,
      onGridReady: (params) => {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
      },
      onFirstDataRendered: (event) => {
        this.headerHeightSetter();
        // Click handler registration is now handled by the service
      },
      onColumnResized: (event) => {
        this.headerHeightSetter();
      }
    };
  }

  /**
   * Handle pagination page size change
   */
  onPaginationPageSizeChanged(newPageSize: number): void {
    this.paginationPageSize = newPageSize;
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(newPageSize);
    }
  }

  /**
   * Get current pagination info
   */
  getPaginationInfo(): any {
    if (this.gridApi) {
      return {
        currentPage: this.gridApi.paginationGetCurrentPage(),
        totalPages: this.gridApi.paginationGetTotalPages(),
        totalRows: this.gridApi.paginationGetRowCount(),
        pageSize: this.gridApi.paginationGetPageSize()
      };
    }
    return null;
  }

  private buildDataGridColumnConfig_spatialUnits(spatialUnitMetadataArray: any[]): ColDef[] {
    return [
      { 
        headerName: 'Editierfunktionen', 
        pinned: 'left', 
        maxWidth: 170, 
        checkboxSelection: false, 
        headerCheckboxSelection: false, 
        headerCheckboxSelectionFilteredOnly: true, 
        filter: false, 
        sortable: false, 
        cellRenderer: this.displayEditButtons_spatialUnits.bind(this)
      },
      { headerName: 'Id', field: 'spatialUnitId', pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: 'spatialUnitLevel', pinned: 'left', minWidth: 300 },
      { 
        headerName: 'Beschreibung', 
        minWidth: 400, 
        cellRenderer: (params: any) => params.data.metadata.description,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + params.data.metadata.description
      },
      { headerName: 'Nächst niedrigere Raumebene', field: 'nextLowerHierarchyLevel', minWidth: 250 },
      { headerName: 'Nächst höhere Raumebene', field: 'nextUpperHierarchyLevel', minWidth: 250 },
      {
        headerName: 'Gültigkeitszeitraum', 
        minWidth: 400,
        cellRenderer: (params: any) => {
          let html = '<ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; word-break: break-word !important;">';
          for (const periodOfValidity of params.data.availablePeriodsOfValidity) {
            html += '<li style="margin-right: 15px;">';
            if (periodOfValidity.endDate) {
              html += '<p>' + periodOfValidity.startDate + ' &dash; ' + periodOfValidity.endDate + '</p>';
            } else {
              html += '<p>' + periodOfValidity.startDate + ' &dash; heute</p>';
            }
            html += '</li>';
          }
          html += '</ul>';
          return html;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          if (params.data.availablePeriodsOfValidity && params.data.availablePeriodsOfValidity.length > 1) {
            return '' + JSON.stringify(params.data.availablePeriodsOfValidity);
          }
          return params.data.availablePeriodsOfValidity;
        }
      },
      { 
        headerName: 'Datenquelle', 
        minWidth: 400, 
        cellRenderer: (params: any) => params.data.metadata.datasource,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + params.data.metadata.datasource
      },
      { 
        headerName: 'Datenhalter und Kontakt', 
        minWidth: 400, 
        cellRenderer: (params: any) => params.data.metadata.contact,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + params.data.metadata.contact
      },
      { 
        headerName: 'Rollen', 
        minWidth: 400, 
        cellRenderer: (params: any) => this.kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions),
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + this.kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions)
      },
      { 
        headerName: 'Öffentlich sichtbar', 
        minWidth: 400, 
        cellRenderer: (params: any) => params.data.isPublic ? 'ja' : 'nein',
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + (params.data.isPublic ? 'ja' : 'nein')
      },
      { 
        headerName: 'Eigentümer', 
        minWidth: 400, 
        cellRenderer: (params: any) => this.kommonitorDataExchangeService.getRoleTitle(params.data.ownerId),
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + this.kommonitorDataExchangeService.getRoleTitle(params.data.ownerId)
      }
    ];
  }

  private buildDataGridRowData_spatialUnits(spatialUnitMetadataArray: any[]): any[] {
    return spatialUnitMetadataArray.map(metadata => ({
      ...metadata,
      spatialUnitId: metadata.spatialUnitId,
      spatialUnitLevel: metadata.spatialUnitLevel
    }));
  }

  private displayEditButtons_spatialUnits(params: any): string {
    const data = params.data;
    let html = '<div class="btn-group btn-group-sm">';
    
    // Edit Metadata Button
    html += '<button id="btn_spatialUnit_editMetadata_' + data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditMetadataBtn" type="button" title="Metadaten editieren" ' + 
            (data.userPermissions && data.userPermissions.includes('editor') ? '' : 'disabled') + '><i class="fas fa-pencil-alt"></i></button>';
    
    // Edit Features Button
    html += '<button id="btn_spatialUnit_editFeatures_' + data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditFeaturesBtn" type="button" title="Features fortführen" ' + 
            (data.userPermissions && data.userPermissions.includes('editor') ? '' : 'disabled') + '><i class="fas fa-draw-polygon"></i></button>';
    
    // Edit User Roles Button
    html += '<button id="btn_spatialUnit_editUserRoles_' + data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditUserRolesBtn" type="button" title="Zugriffsschutz und Eigentümerschaft editieren" ' + 
            (data.userPermissions && data.userPermissions.includes('creator') ? '' : 'disabled') + '><i class="fas fa-user-lock"></i></button>';
    
    // Delete Button
    html += '<button id="btn_spatialUnit_deleteSpatialUnit_' + data.spatialUnitId + '" class="btn btn-danger btn-sm spatialUnitDeleteBtn" type="button" title="Raumebene entfernen" ' + 
            (data.userPermissions && data.userPermissions.includes('creator') ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';
    
    html += '</div>';
    return html;
  }

  // Grid event handlers
  onFirstDataRendered(event: FirstDataRenderedEvent): void {
    this.headerHeightSetter();
    this.registerClickHandler_spatialUnits();
  }

  onColumnResized(event: ColumnResizedEvent): void {
    this.headerHeightSetter();
  }

  onRowDataChanged(): void {
    // Click handler registration is now handled by the service
  }

  onModelUpdated(): void {
    // Click handler registration is now handled by the service
  }

  onViewportChanged(): void {
    // Click handler registration is now handled by the service
  }

  private registerClickHandler_spatialUnits(): void {
    // Use event delegation on the grid container instead of individual buttons
    // This ensures handlers work even for dynamically rendered buttons
    const $ = (window as any).$;
    
    // Remove any existing handlers first to avoid duplicates
    $('#spatialUnitOverviewTable').off('click', '.spatialUnitEditMetadataBtn');
    $('#spatialUnitOverviewTable').off('click', '.spatialUnitEditFeaturesBtn');
    $('#spatialUnitOverviewTable').off('click', '.spatialUnitEditUserRolesBtn');
    $('#spatialUnitOverviewTable').off('click', '.spatialUnitDeleteBtn');

    // Edit Metadata Button - use event delegation
    $('#spatialUnitOverviewTable').on('click', '.spatialUnitEditMetadataBtn', (event: any) => {
      event.stopPropagation();
      event.preventDefault();
      
      // Get the button element (could be the icon inside)
      const button = $(event.target).closest('.spatialUnitEditMetadataBtn')[0];
      const spatialUnitId = button.id.split('_')[3];
      const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
      
      if (spatialUnitMetadata) {
        this.zone.run(() => {
          this.onClickEditMetadata(spatialUnitMetadata);
        });
      }
    });

    // Edit Features Button - use event delegation
    $('#spatialUnitOverviewTable').on('click', '.spatialUnitEditFeaturesBtn', (event: any) => {
      event.stopPropagation();
      event.preventDefault();
      
      // Get the button element (could be the icon inside)
      const button = $(event.target).closest('.spatialUnitEditFeaturesBtn')[0];
      const spatialUnitId = button.id.split('_')[3];
      const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
      
      if (spatialUnitMetadata) {
        this.zone.run(() => {
          this.onClickEditFeatures(spatialUnitMetadata);
        });
      }
    });

    // Edit User Roles Button - use event delegation
    $('#spatialUnitOverviewTable').on('click', '.spatialUnitEditUserRolesBtn', (event: any) => {
      event.stopPropagation();
      event.preventDefault();
      
      // Get the button element (could be the icon inside)
      const button = $(event.target).closest('.spatialUnitEditUserRolesBtn')[0];
      const spatialUnitId = button.id.split('_')[3];
      const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

      if (spatialUnitMetadata) {
        this.zone.run(() => {
          this.onClickEditUserRoles(spatialUnitMetadata);
        });
      }
    });

    // Delete Button - use event delegation
    $('#spatialUnitOverviewTable').on('click', '.spatialUnitDeleteBtn', (event: any) => {
      event.stopPropagation();
      event.preventDefault();
      
      // Get the button element (could be the icon inside)
      const button = $(event.target).closest('.spatialUnitDeleteBtn')[0];
      const spatialUnitId = button.id.split('_')[3];
      const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
      
      if (spatialUnitMetadata) {
        this.zone.run(() => {
          this.onClickDeleteSpatialUnits([spatialUnitMetadata]);
        });
      }
    });
  }

  private headerHeightSetter(): void {
    if (this.gridApi) {
      const headerHeight = this.headerHeightGetter();
      this.gridApi.setHeaderHeight(headerHeight);
    }
  }

  private headerHeightGetter(): number {
    const headerElement = document.querySelector('.ag-header');
    if (headerElement) {
      const headerTextElements = headerElement.querySelectorAll('.ag-header-cell-text');
      let maxHeight = 0;
      headerTextElements.forEach(element => {
        const height = element.scrollHeight;
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      return Math.max(maxHeight + 20, 50); // Add padding and minimum height
    }
    return 50;
  }

  getSelectedSpatialUnitsMetadata(): any[] {
    if (this.gridApi) {
      const selectedNodes = this.gridApi.getSelectedNodes();
      return selectedNodes.map(node => node.data);
    }
    return [];
  }
} 