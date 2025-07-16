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
    this.initializeOrRefreshOverviewTable();
    this.setupEventListeners();
    
    // Add polling mechanism to check for data availability
    this.startDataPolling();
    
    // Add a fallback timeout to prevent infinite loading
    setTimeout(() => {
      if (this.loadingData) {
        this.initializeOrRefreshOverviewTable();
        
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
          this.initializeOrRefreshOverviewTable();
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

  public initializeOrRefreshOverviewTable(): void {
    const spatialUnits = this.kommonitorDataExchangeService.availableSpatialUnits;
    
    if (spatialUnits && spatialUnits.length > 0) {
      this.loadingData = false;
      this.initializationCompleted = true;
      
      // Use the new Angular service to build the data grid
      this.buildDataGrid_spatialUnits(spatialUnits);
    } else {
      // Data not ready yet, keep loading
      this.loadingData = true;
      this.initializationCompleted = false;
    }
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
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
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
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
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
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
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
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
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
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
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

  refreshSpatialUnitOverviewTable(): void {
    this.initializeOrRefreshOverviewTable();
  }

  private startDataPolling(): void {
    // Poll every 500ms for data availability
    const pollInterval = setInterval(() => {
      if (this.loadingData) {
        this.initializeOrRefreshOverviewTable();
        
        // If data is found, stop polling
        if (!this.loadingData) {
          clearInterval(pollInterval);
        }
      } else {
        // Data loaded, stop polling
        clearInterval(pollInterval);
      }
    }, 500);
    
    // Stop polling after 10 seconds regardless
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 10000);
  }

  // AG Grid methods
  private buildDataGrid_spatialUnits(spatialUnitMetadataArray: any[]): void {
    this.columnDefs = this.buildDataGridColumnConfig_spatialUnits(spatialUnitMetadataArray);
    this.rowData = this.buildDataGridRowData_spatialUnits(spatialUnitMetadataArray);
    this.defaultColDef = this.buildDefaultColDef();
    this.gridOptions = this.buildGridOptions(spatialUnitMetadataArray);
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
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      onGridReady: (params) => {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
      }
    };
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
      { 
        headerName: '', 
        field: 'checkboxSelection', 
        pinned: 'left', 
        maxWidth: 50, 
        checkboxSelection: true, 
        headerCheckboxSelection: true, 
        headerCheckboxSelectionFilteredOnly: true, 
        filter: false, 
        sortable: false 
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
  }

  onColumnResized(event: ColumnResizedEvent): void {
    this.headerHeightSetter();
  }

  onRowDataChanged(): void {
    this.registerClickHandler_spatialUnits();
  }

  onModelUpdated(): void {
    this.registerClickHandler_spatialUnits();
  }

  onViewportChanged(): void {
    this.registerClickHandler_spatialUnits();
  }

  private registerClickHandler_spatialUnits(): void {
    setTimeout(() => {
      // Use jQuery to register click handlers (matching original implementation)
      const $ = (window as any).$;

      // Edit Metadata Button
      $('.spatialUnitEditMetadataBtn').off();
      $('.spatialUnitEditMetadataBtn').on('click', (event: any) => {
        event.stopPropagation();
        
        const spatialUnitId = event.target.id.split('_')[3];
        const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
        
        if (spatialUnitMetadata) {
          this.onClickEditMetadata(spatialUnitMetadata);
        }
      });

      // Edit Features Button
      $('.spatialUnitEditFeaturesBtn').off();
      $('.spatialUnitEditFeaturesBtn').on('click', (event: any) => {
        event.stopPropagation();
        
        const spatialUnitId = event.target.id.split('_')[3];
        const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
        
        if (spatialUnitMetadata) {
          this.onClickEditFeatures(spatialUnitMetadata);
        }
      });

      // Edit User Roles Button
      $('.spatialUnitEditUserRolesBtn').off();
      $('.spatialUnitEditUserRolesBtn').on('click', (event: any) => {
        event.stopPropagation();
        
        const spatialUnitId = event.target.id.split('_')[3];
        const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

        if (spatialUnitMetadata) {
          this.onClickEditUserRoles(spatialUnitMetadata);
        }
      });

      // Delete Button
      $('.spatialUnitDeleteBtn').off();
      $('.spatialUnitDeleteBtn').on('click', (event: any) => {
        event.stopPropagation();
        
        const spatialUnitId = event.target.id.split('_')[3];
        const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
        
        if (spatialUnitMetadata) {
          this.onClickDeleteSpatialUnits([spatialUnitMetadata]);
        }
      });
    }, 100);
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