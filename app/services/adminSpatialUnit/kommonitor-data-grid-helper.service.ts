import { Injectable, Inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from '../broadcast-service/broadcast.service';
import { KommonitorDataExchangeService } from './kommonitor-data-exchange.service';
import { 
  GridOptions, 
  ColDef, 
  GridApi, 
  ColumnApi,
  ICellRendererParams,
  ICellRendererComp,
  GridReadyEvent
} from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';

// Declare environment variables
declare const __env: any;

@Injectable({
  providedIn: 'root'
})
export class KommonitorDataGridHelperService {

  // Store the data grid options
  private dataGridOptions_spatialUnits: GridOptions | null = null;
  private dataGridOptions_featureTable: GridOptions | null = null;
  private gridApi_spatialUnits: GridApi | null = null;
  private gridApi_featureTable: GridApi | null = null;

  // Resource type constants
  readonly resourceType_spatialUnit = 'spatialUnit';
  readonly resourceType_georesource = 'georesource';
  readonly resourceType_indicator = 'indicator';

  // Timestamp properties for feature table updates
  featureTable_spatialUnit_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_spatialUnit_lastUpdate_timestamp_failure: Date | undefined = undefined;
  featureTable_georesource_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_georesource_lastUpdate_timestamp_failure: Date | undefined = undefined;
  featureTable_indicator_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_indicator_lastUpdate_timestamp_failure: Date | undefined = undefined;

  constructor(
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    private kommonitorDataExchangeService: KommonitorDataExchangeService
  ) {}

  /**
   * Main method to build the spatial units data grid
   * Returns GridOptions for use in Angular templates with ag-grid-angular
   */
  buildDataGrid_spatialUnits(spatialUnitMetadataArray: any[]): GridOptions {
    // Store the data for future use
    this.currentSpatialUnitsData = spatialUnitMetadataArray;
    
    // Build and return grid options for use in Angular template
    this.dataGridOptions_spatialUnits = this.buildDataGridOptions_spatialUnits(spatialUnitMetadataArray);
    
    return this.dataGridOptions_spatialUnits;
  }

  // Store current spatial units data
  private currentSpatialUnitsData: any[] = [];

  /**
   * Build the grid options configuration for ag-grid-angular
   */
  private buildDataGridOptions_spatialUnits(spatialUnitMetadataArray: any[]): GridOptions {
    const columnDefs = this.buildDataGridColumnConfig_spatialUnits(spatialUnitMetadataArray);
    const rowData = this.buildDataGridRowData_spatialUnits(spatialUnitMetadataArray);

    const gridOptions: GridOptions = {
      columnDefs: columnDefs,
      rowData: rowData,
      defaultColDef: {
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
      },
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      onGridReady: (params) => {
        this.gridApi_spatialUnits = params.api;
        this.headerHeightSetter();
        this.registerClickHandler_spatialUnits();
      },
      onFirstDataRendered: () => {
        this.headerHeightSetter();
        this.registerClickHandler_spatialUnits();
      },
      onColumnResized: () => {
        this.headerHeightSetter();
      }
    };

    return gridOptions;
  }

  /**
   * Build column configuration for spatial units with proper cell renderers
   */
  private buildDataGridColumnConfig_spatialUnits(spatialUnitMetadataArray: any[]): ColDef[] {
    const columnDefs: ColDef[] = [
      { 
        headerName: 'Editierfunktionen', 
        pinned: 'left', 
        maxWidth: 170, 
        checkboxSelection: false, 
        headerCheckboxSelection: false, 
        headerCheckboxSelectionFilteredOnly: true, 
        filter: false, 
        sortable: false, 
        cellRenderer: (params: any) => this.displayEditButtons_spatialUnits(params)
      },
      { headerName: 'Id', field: 'spatialUnitId', pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: 'spatialUnitLevel', pinned: 'left', minWidth: 300 },
      { 
        headerName: 'Beschreibung', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => params.data.metadata.description,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + params.data.metadata.description
      },
      { headerName: 'Nächst niedrigere Raumebene', field: 'nextLowerHierarchyLevel', minWidth: 250 },
      { headerName: 'Nächst höhere Raumebene', field: 'nextUpperHierarchyLevel', minWidth: 250 },
      {
        headerName: 'Gültigkeitszeitraum', 
        minWidth: 400,
        cellRenderer: (params: ICellRendererParams) => {
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
        cellRenderer: (params: ICellRendererParams) => params.data.metadata.datasource,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + params.data.metadata.datasource
      },
      { 
        headerName: 'Datenhalter und Kontakt', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => params.data.metadata.contact,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + params.data.metadata.contact
      },
      { 
        headerName: 'Rollen', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => this.kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions),
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + this.kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions)
      },
      { 
        headerName: 'Öffentlich sichtbar', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => params.data.isPublic ? 'ja' : 'nein',
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + (params.data.isPublic ? 'ja' : 'nein')
      },
      { 
        headerName: 'Eigentümer', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => this.kommonitorDataExchangeService.getRoleTitle(params.data.ownerId),
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => '' + this.kommonitorDataExchangeService.getRoleTitle(params.data.ownerId)
      }
    ];

    return columnDefs;
  }

  /**
   * Build row data for spatial units (just return the input array)
   */
  private buildDataGridRowData_spatialUnits(spatialUnitMetadataArray: any[]): any[] {
    return spatialUnitMetadataArray;
  }

  /**
   * Cell renderer for edit buttons
   */
  private displayEditButtons_spatialUnits(params: any): string {
    const data = params.data;
    let html = '<div class="btn-group btn-group-sm">';
    
    // Edit Metadata Button
    html += '<button id="btn_spatialUnit_editMetadata_' + data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditMetadataBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-metadata" title="Metadaten editieren" ' + 
            (data.userPermissions.includes('editor') ? '' : 'disabled') + '><i class="fas fa-pencil-alt"></i></button>';
    
    // Edit Features Button
    html += '<button id="btn_spatialUnit_editFeatures_' + data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditFeaturesBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-features" title="Features fortführen" ' + 
            (data.userPermissions.includes('editor') ? '' : 'disabled') + '><i class="fas fa-draw-polygon"></i></button>';
    
    // Edit User Roles Button
    html += '<button id="btn_spatialUnit_editUserRoles_' + data.spatialUnitId + '" class="btn btn-warning btn-sm spatialUnitEditUserRolesBtn" type="button" data-toggle="modal" data-target="#modal-edit-spatial-unit-user-roles" title="Zugriffsschutz und Eigentümerschaft editieren" ' + 
            (data.userPermissions.includes('creator') ? '' : 'disabled') + '><i class="fas fa-user-lock"></i></button>';
    
    // Delete Button
    html += '<button id="btn_spatialUnit_deleteSpatialUnit_' + data.spatialUnitId + '" class="btn btn-danger btn-sm spatialUnitDeleteBtn" type="button" data-toggle="modal" data-target="#modal-delete-spatial-units" title="Raumebene entfernen" ' + 
            (data.userPermissions.includes('creator') ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';
    
    html += '</div>';
    return html;
  }

  /**
   * Register click handlers for buttons
   */
  private registerClickHandler_spatialUnits(): void {
    // Use native DOM methods instead of jQuery
    setTimeout(() => {
      // Edit Metadata Button
      const editMetadataButtons = document.querySelectorAll('.spatialUnitEditMetadataBtn');
      editMetadataButtons.forEach((button: any) => {
        button.removeEventListener('click', this.handleEditMetadataClick);
        button.addEventListener('click', this.handleEditMetadataClick);
      });

      // Edit Features Button
      const editFeaturesButtons = document.querySelectorAll('.spatialUnitEditFeaturesBtn');
      editFeaturesButtons.forEach((button: any) => {
        button.removeEventListener('click', this.handleEditFeaturesClick);
        button.addEventListener('click', this.handleEditFeaturesClick);
      });

      // Edit User Roles Button
      const editUserRolesButtons = document.querySelectorAll('.spatialUnitEditUserRolesBtn');
      editUserRolesButtons.forEach((button: any) => {
        button.removeEventListener('click', this.handleEditUserRolesClick);
        button.addEventListener('click', this.handleEditUserRolesClick);
      });

      // Delete Button
      const deleteButtons = document.querySelectorAll('.spatialUnitDeleteBtn');
      deleteButtons.forEach((button: any) => {
        button.removeEventListener('click', this.handleDeleteClick);
        button.addEventListener('click', this.handleDeleteClick);
      });
    }, 100);
  }

  /**
   * Handle edit metadata button click
   */
  private handleEditMetadataClick = (event: any): void => {
    event.stopPropagation();
    
    const spatialUnitId = event.target.id.split('_')[3];
    const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
    
    this.broadcastService.broadcast('onEditSpatialUnitMetadata', spatialUnitMetadata);
  }

  /**
   * Handle edit features button click
   */
  private handleEditFeaturesClick = (event: any): void => {
    event.stopPropagation();
    
    const spatialUnitId = event.target.id.split('_')[3];
    const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
    
    this.broadcastService.broadcast('onEditSpatialUnitFeatures', spatialUnitMetadata);
  }

  /**
   * Handle edit user roles button click
   */
  private handleEditUserRolesClick = (event: any): void => {
    event.stopPropagation();
    
    const spatialUnitId = event.target.id.split('_')[3];
    const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

    this.broadcastService.broadcast('onEditSpatialUnitUserRoles', spatialUnitMetadata);
  }

  /**
   * Handle delete button click
   */
  private handleDeleteClick = (event: any): void => {
    event.stopPropagation();
    
    const spatialUnitId = event.target.id.split('_')[3];
    const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
    
    this.broadcastService.broadcast('onDeleteSpatialUnits', [spatialUnitMetadata]);
  }

  /**
   * Get selected spatial units metadata
   */
  getSelectedSpatialUnitsMetadata(): any[] {
    const spatialUnitsMetadataArray: any[] = [];

    if (this.dataGridOptions_spatialUnits && this.gridApi_spatialUnits) {
      const selectedNodes = this.gridApi_spatialUnits.getSelectedNodes();
      for (const selectedNode of selectedNodes) {
        spatialUnitsMetadataArray.push(selectedNode.data);
      }
    }

    return spatialUnitsMetadataArray;
  }

  /**
   * Save grid state (for preserving selection/filters when updating data)
   */
  private saveGridStore(gridOptions: any): void {
    if (gridOptions && this.gridApi_spatialUnits) {
      // Store selection state
      const selectedNodes = this.gridApi_spatialUnits.getSelectedNodes();
      gridOptions._savedState = {
        selectedIds: selectedNodes.map((node: any) => node.data.spatialUnitId)
      };
    }
  }

  /**
   * Restore grid state (for preserving selection/filters when updating data)
   */
  private restoreGridStore(gridOptions: any): void {
    if (gridOptions && this.gridApi_spatialUnits && gridOptions._savedState) {
      setTimeout(() => {
        // Restore selection
        this.gridApi_spatialUnits?.forEachNode((node: any) => {
          if (gridOptions._savedState.selectedIds.includes(node.data.spatialUnitId)) {
            node.setSelected(true);
          }
        });
      }, 100);
    }
  }

  /**
   * Set header height for proper display
   */
  private headerHeightSetter(): void {
    if (this.gridApi_spatialUnits) {
      const headerHeight = this.headerHeightGetter();
      this.gridApi_spatialUnits.setHeaderHeight(headerHeight);
    }
  }

  /**
   * Calculate header height based on content
   */
  private headerHeightGetter(): number {
    const columnHeaderTexts = document.querySelectorAll('.ag-header-cell-text');
    let maxHeight = 0;
    
    columnHeaderTexts.forEach((element: any) => {
      const height = element.offsetHeight;
      if (height > maxHeight) {
        maxHeight = height;
      }
    });
    
    return Math.max(maxHeight + 20, 50); // Add padding, minimum 50px
  }

  /**
   * Build role management grid for spatial units
   */
  buildRoleManagementGrid(tableDOMId: string, currentTableOptionsObject: any, accessControlMetadata: any[], selectedPermissionIds: string[], reducedRoleManagement: boolean = false): any {
    if (currentTableOptionsObject && this.gridApi_spatialUnits) {
      // Grid already exists, just update the data
      const newRowData = this.buildRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds);
      this.gridApi_spatialUnits.setRowData(newRowData);
    } else {
      // Create new grid options
      currentTableOptionsObject = this.buildRoleManagementGridOptions(accessControlMetadata, selectedPermissionIds, reducedRoleManagement);
      console.log('Role management grid options created. Use in component template.');
    }
    return currentTableOptionsObject;
  }

  /**
   * Build role management grid row data
   */
  private buildRoleManagementGridRowData(accessControlMetadata: any[], permissionIds: string[]): any[] {
    const data = JSON.parse(JSON.stringify(accessControlMetadata));
    
    for (const elem of data) {
      if (elem.name === 'public') {
        elem.name = 'Öffentlicher Zugriff';
      }

      for (const permission of elem.permissions) {
        permission.isChecked = false;
        if (permissionIds && permissionIds.includes(permission.permissionId)) {
          permission.isChecked = true;
        }
      }
    }

    const array: any[] = [];
    array.push(data[0]);
    array.push(data[1]);

    data.splice(0, 2);
    data.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return array.concat(data);
  }

  /**
   * Build role management grid column configuration
   */
  private buildRoleManagementGridColumnConfig(reducedRoleManagement: boolean = false): any[] {
    const columnDefs = [
      { 
        headerName: 'Organisationseinheit', 
        field: "name", 
        minWidth: 200,
        cellClass: 'user-roles-normal'
      },
      { 
        headerName: 'lesen', 
        field: "permissions", 
        filter: false, 
        sortable: false, 
        maxWidth: 100, 
        cellRenderer: 'checkboxRenderer_viewer'
      },
      { 
        headerName: 'editieren', 
        field: "permissions", 
        filter: false, 
        sortable: false, 
        maxWidth: 100, 
        cellRenderer: 'checkboxRenderer_editor'
      }
    ];

    if (!reducedRoleManagement) {
      columnDefs.push({ 
        headerName: 'löschen', 
        field: "permissions", 
        filter: false, 
        sortable: false, 
        maxWidth: 100, 
        cellRenderer: 'checkboxRenderer_creator'
      });
    }

    return columnDefs;
  }

  /**
   * Build role management grid options
   */
  private buildRoleManagementGridOptions(accessControlMetadata: any[], selectedPermissionIds: string[], reducedRoleManagement: boolean = false): any {
    const columnDefs = this.buildRoleManagementGridColumnConfig(reducedRoleManagement);
    const rowData = this.buildRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds);

    const components: any = {
      checkboxRenderer_viewer: this.CheckboxRenderer_viewer.bind(this),
      checkboxRenderer_editor: this.CheckboxRenderer_editor.bind(this)
    };

    if (!reducedRoleManagement) {
      components.checkboxRenderer_creator = this.CheckboxRenderer_creator.bind(this);
    }

    const gridOptions = {
      defaultColDef: {
        editable: false,
        sortable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
        floatingFilter: false,
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
        },
        headerComponentParams: {
          template:
            '<div class="ag-cell-label-container" role="presentation">' +
            '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
            '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
            '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
            '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
            '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
            '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
            '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
            '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
            '  </div>' +
            '</div>',
        },
      },
      components: components,
      columnDefs: columnDefs,
      rowData: rowData,
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      onFirstDataRendered: () => {
        this.headerHeightSetter();
      },
      onColumnResized: () => {
        this.headerHeightSetter();
      },
      onGridReady: (params: GridReadyEvent) => {
        this.gridApi_spatialUnits = params.api;
      }
    };

    return gridOptions;
  }

  /**
   * Get selected role IDs from role management grid
   */
  getSelectedRoleIds_roleManagementGrid(roleManagementTableOptions: any): string[] {
    const ids: string[] = [];
    const deselectedIds: string[] = [];
    
    if (roleManagementTableOptions && this.gridApi_spatialUnits) {
      this.gridApi_spatialUnits.forEachNode((node: any, index: number) => {
        if (node.data) {
          for (const permission of node.data.permissions) {
            if (permission) {
              if (permission.isChecked) {
                if (!deselectedIds.includes(permission.permissionId)) {
                  ids.push(permission.permissionId);
                }
              } else {
                deselectedIds.push(permission.permissionId);
              }
            }
          }
        }
      });
    }
    
    return ids;
  }

  /**
   * Checkbox renderer for viewer permissions
   */
  private CheckboxRenderer_viewer(params: any): any {
    const viewerPermission = params.data.permissions.find((p: any) => p.permissionLevel === 'viewer');
    if (!viewerPermission) return '';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = viewerPermission.isChecked;
    checkbox.disabled = params.data.datasetOwner || false;
    
    checkbox.addEventListener('change', (event: any) => {
      viewerPermission.isChecked = event.target.checked;
      params.api.refreshCells({ force: true });
    });

    return checkbox;
  }

  /**
   * Checkbox renderer for editor permissions
   */
  private CheckboxRenderer_editor(params: any): any {
    const editorPermission = params.data.permissions.find((p: any) => p.permissionLevel === 'editor');
    if (!editorPermission) return '';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = editorPermission.isChecked;
    checkbox.disabled = params.data.datasetOwner || false;
    
    checkbox.addEventListener('change', (event: any) => {
      editorPermission.isChecked = event.target.checked;
      params.api.refreshCells({ force: true });
    });

    return checkbox;
  }

  /**
   * Checkbox renderer for creator permissions
   */
  private CheckboxRenderer_creator(params: any): any {
    const creatorPermission = params.data.permissions.find((p: any) => p.permissionLevel === 'creator');
    if (!creatorPermission) return '';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = creatorPermission.isChecked;
    checkbox.disabled = params.data.datasetOwner || false;
    
    checkbox.addEventListener('change', (event: any) => {
      creatorPermission.isChecked = event.target.checked;
      params.api.refreshCells({ force: true });
    });

    return checkbox;
  }

  /**
   * Build feature table data grid for spatial resources
   * @param tableId - DOM ID of the table container
   * @param headers - Array of column headers
   * @param features - Array of GeoJSON features
   * @param resourceId - ID of the spatial resource
   * @param resourceType - Type of resource (spatialUnit, georesource, indicator)
   * @param enableDelete - Whether to enable delete functionality
   */
  buildDataGrid_featureTable_spatialResource(
    tableId: string, 
    headers: string[], 
    features: any[] = [], 
    resourceId?: string, 
    resourceType?: string, 
    enableDelete: boolean = false
  ): GridOptions {
    // Store current resource ID for delete handlers
    this.currentResourceId = resourceId;

    const gridContainer = document.querySelector('#' + tableId);
    if (!gridContainer) {
      console.error(`Grid container #${tableId} not found`);
      return this.buildFeatureTableGridOptions(headers, features, resourceId, resourceType, enableDelete);
    }

    if (this.dataGridOptions_featureTable && this.gridApi_featureTable && gridContainer.childElementCount > 0) {
      // Grid already exists, just update the data
      this.saveGridStore_featureTable(this.dataGridOptions_featureTable);
      const newRowData = this.buildFeatureTableRowData(features);
      this.gridApi_featureTable.setRowData(newRowData);
      this.restoreGridStore_featureTable(this.dataGridOptions_featureTable);
    } else {
      // Create new grid options
      this.dataGridOptions_featureTable = this.buildFeatureTableGridOptions(
        headers, 
        features, 
        resourceId, 
        resourceType, 
        enableDelete
      );
      
      // The actual grid creation should be done in the component template
      console.log('Feature table grid options created. Use in component template.');
    }
    
    return this.dataGridOptions_featureTable!;
  }

  /**
   * Build grid options for feature table
   */
  private buildFeatureTableGridOptions(
    headers: string[], 
    features: any[], 
    resourceId?: string, 
    resourceType?: string, 
    enableDelete: boolean = false
  ): any {
    const columnDefs = this.buildFeatureTableColumnConfig(headers, enableDelete, resourceType);
    const rowData = this.buildFeatureTableRowData(features);

    const gridOptions = {
      defaultColDef: {
        editable: false,
        sortable: true,
        flex: 1,
        minWidth: 150,
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
        },
        headerComponentParams: {
          template:
            '<div class="ag-cell-label-container" role="presentation">' +
            '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
            '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
            '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
            '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
            '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
            '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
            '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
            '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
            '  </div>' +
            '</div>',
        },
      },
      components: {
        deleteButtonRenderer: this.deleteButtonRenderer.bind(this)
      },
      columnDefs: columnDefs,
      rowData: rowData,
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 20,
      suppressColumnVirtualisation: true,
      onFirstDataRendered: () => {
        this.headerHeightSetter();
        this.registerFeatureTableClickHandlers(resourceId, resourceType, enableDelete);
      },
      onColumnResized: () => {
        this.headerHeightSetter();
      },
      onGridReady: (params: GridReadyEvent) => {
        this.gridApi_featureTable = params.api;
      }
    };

    return gridOptions;
  }

  /**
   * Build column configuration for feature table
   */
  private buildFeatureTableColumnConfig(headers: string[], enableDelete: boolean, resourceType?: string): any[] {
    const columnDefs: any[] = [];

    // Add delete button column if enabled
    if (enableDelete) {
      columnDefs.push({
        headerName: 'Löschen',
        pinned: 'left',
        maxWidth: 80,
        checkboxSelection: false,
        headerCheckboxSelection: false,
        filter: false,
        sortable: false,
        cellRenderer: 'deleteButtonRenderer',
        cellRendererParams: {
          resourceType: resourceType
        }
      });
    }

    // Add ID column (always present for features)
    columnDefs.push({
      headerName: 'ID',
      field: __env?.FEATURE_ID_PROPERTY_NAME || 'ID',
      pinned: 'left',
      maxWidth: 150,
      cellRenderer: (params: any) => {
        const featureId = params.data.properties?.[__env?.FEATURE_ID_PROPERTY_NAME] || 
                         params.data[__env?.FEATURE_ID_PROPERTY_NAME] || '';
        return featureId;
      }
    });

    // Add Name column (always present for features)
    columnDefs.push({
      headerName: 'Name',
      field: __env?.FEATURE_NAME_PROPERTY_NAME || 'NAME',
      pinned: 'left',
      minWidth: 200,
      cellRenderer: (params: any) => {
        const featureName = params.data.properties?.[__env?.FEATURE_NAME_PROPERTY_NAME] || 
                           params.data[__env?.FEATURE_NAME_PROPERTY_NAME] || '';
        return featureName;
      }
    });

    // Add validity date columns if they exist
    if (__env?.VALID_START_DATE_PROPERTY_NAME) {
      columnDefs.push({
        headerName: 'Gültig von',
        field: __env.VALID_START_DATE_PROPERTY_NAME,
        minWidth: 150,
        cellRenderer: (params: any) => {
          const startDate = params.data.properties?.[__env.VALID_START_DATE_PROPERTY_NAME] || 
                           params.data[__env.VALID_START_DATE_PROPERTY_NAME] || '';
          return startDate;
        }
      });
    }

    if (__env?.VALID_END_DATE_PROPERTY_NAME) {
      columnDefs.push({
        headerName: 'Gültig bis',
        field: __env.VALID_END_DATE_PROPERTY_NAME,
        minWidth: 150,
        cellRenderer: (params: any) => {
          const endDate = params.data.properties?.[__env.VALID_END_DATE_PROPERTY_NAME] || 
                         params.data[__env.VALID_END_DATE_PROPERTY_NAME] || '';
          return endDate;
        }
      });
    }

    // Add dynamic columns based on headers
    headers.forEach(header => {
      // Skip standard columns that are already added
      if (header !== __env?.FEATURE_ID_PROPERTY_NAME && 
          header !== __env?.FEATURE_NAME_PROPERTY_NAME &&
          header !== __env?.VALID_START_DATE_PROPERTY_NAME &&
          header !== __env?.VALID_END_DATE_PROPERTY_NAME) {
        columnDefs.push({
          headerName: header,
          field: header,
          minWidth: 150,
          cellRenderer: (params: any) => {
            const value = params.data.properties?.[header] || params.data[header] || '';
            return value;
          }
        });
      }
    });

    return columnDefs;
  }

  /**
   * Build row data for feature table
   */
  private buildFeatureTableRowData(features: any[]): any[] {
    if (!features || !Array.isArray(features)) {
      return [];
    }

    return features.map(feature => {
      // Return the feature itself - the column renderers will extract properties
      return feature;
    });
  }

  /**
   * Delete button renderer for feature table
   */
  private deleteButtonRenderer(params: any): string {
    const featureId = params.data.properties?.[__env?.FEATURE_ID_PROPERTY_NAME] || 
                     params.data[__env?.FEATURE_ID_PROPERTY_NAME] || '';
    const resourceType = params.resourceType || 'spatialUnit';
    
    return `<button id="btn_deleteFeature_${resourceType}_${featureId}" 
                    class="btn btn-danger btn-sm ${resourceType}DeleteFeatureRecordBtn" 
                    type="button" 
                    title="Feature entfernen" 
                    ${params.disabled ? 'disabled' : ''}>
              <i class="fas fa-trash"></i>
            </button>`;
  }

  /**
   * Register click handlers for feature table buttons
   */
  private registerFeatureTableClickHandlers(resourceId?: string, resourceType?: string, enableDelete: boolean = false): void {
    if (!enableDelete || !resourceType) return;

    setTimeout(() => {
      const buttonClass = `.${resourceType}DeleteFeatureRecordBtn`;
      const buttons = document.querySelectorAll(buttonClass);

      buttons.forEach((button: any) => {
        button.removeEventListener('click', this.handleFeatureDeleteClick);
        button.addEventListener('click', this.handleFeatureDeleteClick);
      });
    }, 100);
  }

  /**
   * Handle feature delete button click
   */
  private handleFeatureDeleteClick = (event: any): void => {
    event.stopPropagation();
    
    const buttonId = event.target.closest('button').id;
    const parts = buttonId.split('_');
    const featureId = parts[parts.length - 1];
    const resourceType = parts[1]; // Extract resource type from button ID
    
    if (featureId && this.currentResourceId) {
      // Broadcast delete event
      this.broadcastService.broadcast(`onDeleteFeatureEntry_${resourceType}`, {
        featureId: featureId,
        resourceId: this.currentResourceId,
        resourceType: resourceType
      });
    }
  }

  // Store current resource ID for delete handlers
  private currentResourceId: string | undefined;

  /**
   * Save grid state for feature table
   */
  private saveGridStore_featureTable(gridOptions: any): void {
    if (gridOptions && this.gridApi_featureTable) {
      const selectedNodes = this.gridApi_featureTable.getSelectedNodes();
      gridOptions._savedState = {
        selectedIds: selectedNodes.map((node: any) => {
          const featureId = node.data.properties?.[__env?.FEATURE_ID_PROPERTY_NAME] || 
                           node.data[__env?.FEATURE_ID_PROPERTY_NAME] || '';
          return featureId;
        })
      };
    }
  }

  /**
   * Restore grid state for feature table
   */
  private restoreGridStore_featureTable(gridOptions: any): void {
    if (gridOptions && this.gridApi_featureTable && gridOptions._savedState) {
      setTimeout(() => {
        this.gridApi_featureTable?.forEachNode((node: any) => {
          const featureId = node.data.properties?.[__env?.FEATURE_ID_PROPERTY_NAME] || 
                           node.data[__env?.FEATURE_ID_PROPERTY_NAME] || '';
          if (gridOptions._savedState.selectedIds.includes(featureId)) {
            node.setSelected(true);
          }
        });
      }, 100);
    }
  }

  /**
   * Get currently selected features from feature table
   */
  getSelectedFeatures(): any[] {
    const selectedFeatures: any[] = [];

    if (this.dataGridOptions_featureTable && this.gridApi_featureTable) {
      const selectedNodes = this.gridApi_featureTable.getSelectedNodes();
      for (const selectedNode of selectedNodes) {
        selectedFeatures.push(selectedNode.data);
      }
    }

    return selectedFeatures;
  }

  /**
   * Clear feature table data
   */
  clearFeatureTable(): void {
    if (this.dataGridOptions_featureTable && this.gridApi_featureTable) {
      this.gridApi_featureTable.setRowData([]);
    }
  }

  /**
   * Refresh feature table with new data
   */
  refreshFeatureTable(features: any[]): void {
    if (this.dataGridOptions_featureTable && this.gridApi_featureTable) {
      const newRowData = this.buildFeatureTableRowData(features);
      this.gridApi_featureTable.setRowData(newRowData);
    }
  }

  /**
   * Refresh spatial units grid with new data
   */
  refreshSpatialUnitsGrid(spatialUnitMetadataArray: any[]): void {
    this.currentSpatialUnitsData = spatialUnitMetadataArray;
    
    if (this.gridApi_spatialUnits) {
      const newRowData = this.buildDataGridRowData_spatialUnits(spatialUnitMetadataArray);
      this.gridApi_spatialUnits.setRowData(newRowData);
      // Re-register click handlers after data update
      setTimeout(() => this.registerClickHandler_spatialUnits(), 100);
    }
  }

  /**
   * Get current spatial units grid options
   */
  getSpatialUnitsGridOptions(): GridOptions | null {
    return this.dataGridOptions_spatialUnits;
  }

  /**
   * Get current feature table grid options
   */
  getFeatureTableGridOptions(): GridOptions | null {
    return this.dataGridOptions_featureTable;
  }
} 