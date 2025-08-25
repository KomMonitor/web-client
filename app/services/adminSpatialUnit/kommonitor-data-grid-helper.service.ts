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
import { HttpClient } from '@angular/common/http';

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
    private kommonitorDataExchangeService: KommonitorDataExchangeService,
    private http: HttpClient
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
   * Returns base configuration that component can extend
   */
  buildDataGridOptions_spatialUnits(spatialUnitMetadataArray: any[]): GridOptions {
    const columnDefs = this.buildDataGridColumnConfig_spatialUnits(spatialUnitMetadataArray);
    const rowData = this.buildDataGridRowData_spatialUnits(spatialUnitMetadataArray);

    const gridOptions: GridOptions = {
      columnDefs: columnDefs,
      rowData: rowData,
      defaultColDef: this.buildDefaultColDef(),
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true
    };

    return gridOptions;
  }

  /**
   * Build default column definition
   */
  buildDefaultColDef(): ColDef {
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

  /**
   * Build column configuration for spatial units with proper cell renderers
   */
  buildDataGridColumnConfig_spatialUnits(spatialUnitMetadataArray: any[]): ColDef[] {
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
  buildDataGridRowData_spatialUnits(spatialUnitMetadataArray: any[]): any[] {
    return spatialUnitMetadataArray;
  }

  /**
   * Build grid options for spatial units
   */
  buildGridOptions(): GridOptions {
    return {
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true
    };
  }

  /**
   * Build default column definition for role management grids
   */
  buildRoleManagementDefaultColDef(): any {
    return {
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
    };
  }

  /**
   * Build grid options for role management grids (public method for components)
   */
  buildRoleManagementGridOptionsPublic(components?: any): GridOptions {
    return {
      components: components || {},
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      headerHeight: 40,
      rowHeight: 35
    };
  }



  /**
   * Cell renderer for edit buttons
   */
  displayEditButtons_spatialUnits(params: any): string {
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
      // update underlying options so callers get the latest data
      currentTableOptionsObject.rowData = newRowData;
      this.gridApi_spatialUnits.setRowData(newRowData);
      // ensure cells re-render to apply disabled state and checks
      setTimeout(() => {
        try {
          this.gridApi_spatialUnits?.refreshCells({ force: true });
          this.gridApi_spatialUnits?.redrawRows();
        } catch (e) {}
      }, 0);
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
    // Flatten permissions into boolean fields for ag-Grid built-in checkbox renderer
    const data = JSON.parse(JSON.stringify(accessControlMetadata));
    for (const elem of data) {
      if (elem.name === 'public') {
        elem.name = 'Öffentlicher Zugriff';
      }
      // Flatten permissions
      elem.viewer = false;
      elem.editor = false;
      elem.creator = false;
      if (elem.permissions && Array.isArray(elem.permissions)) {
        for (const permission of elem.permissions) {
          const isChecked = !!(permissionIds && permissionIds.includes(permission.permissionId));
          // keep permissions[] state in sync (as in AngularJS)
          permission.isChecked = isChecked;

          if (permission.permissionLevel === 'viewer') {
            elem.viewer = isChecked;
          }
          if (permission.permissionLevel === 'editor') {
            elem.editor = isChecked;
          }
          if (permission.permissionLevel === 'creator') {
            elem.creator = isChecked;
          }
        }
      }
    }
    // Keep the original sorting logic
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

  private buildRoleManagementGridColumnConfig(reducedRoleManagement: boolean = false): any[] {
    const columnDefs = [
      { 
        headerName: 'Organisationseinheit', 
        field: 'name', 
        minWidth: 200,
        cellClass: 'user-roles-normal'
      },
      { 
        headerName: 'Lesen', 
        field: 'viewer', 
        filter: false, 
        sortable: false, 
        width: 100, 
        cellRenderer: 'CheckboxRenderer_viewer',
        editable: true
      },
      { 
        headerName: 'Editieren', 
        field: 'editor', 
        filter: false, 
        sortable: false, 
        width: 100, 
        cellRenderer: 'CheckboxRenderer_editor',
        editable: true
      }
    ];
    if (!reducedRoleManagement) {
      columnDefs.push({ 
        headerName: 'Löschen', 
        field: 'creator', 
        filter: false, 
        sortable: false, 
        width: 100, 
        cellRenderer: 'CheckboxRenderer_creator',
        editable: true
      });
    }
    return columnDefs;
  }

  private buildRoleManagementGridOptions(accessControlMetadata: any[], selectedPermissionIds: string[], reducedRoleManagement: boolean = false): any {
    const columnDefs = this.buildRoleManagementGridColumnConfig(reducedRoleManagement);
    const rowData = this.buildRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds);
    const gridOptions = {
      components: {
        CheckboxRenderer_viewer: this.CheckboxRenderer_viewer,
        CheckboxRenderer_editor: this.CheckboxRenderer_editor,
        CheckboxRenderer_creator: this.CheckboxRenderer_creator
      },
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
  private CheckboxRenderer_viewer = class {
    private params: any;
    private eGui: HTMLInputElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;
      
      let isChecked = false;
      let exists = false;
      let className;
      if (params && params.data) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel == "viewer"){
            exists = true;
            isChecked = permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }  
      }
      
      if(exists){
        this.eGui = document.createElement('input') as HTMLInputElement;
        this.eGui.className = className;
        this.eGui.type = 'checkbox';
        this.eGui.checked = isChecked;
        
        if(this.params.data.datasetOwner===true)
          this.eGui.disabled = true;
        else
          this.eGui.disabled = false;

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        this.eGui.addEventListener('click', this.boundCheckedHandler);
      }
    }

    checkedHandler(e: any) {
      let checked = e.target.checked;

      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel == "viewer"){            
          permission.isChecked = checked;
          break;
        }
      }  
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if(this.eGui && this.boundCheckedHandler){
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }        
    }
  };

  /**
   * Checkbox renderer for editor permissions
   */
  private CheckboxRenderer_editor = class {
    private params: any;
    private eGui: HTMLInputElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className;
      if (params && params.data) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel == "editor"){
            exists = true;
            isChecked = permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }  
      }

      if(exists){
        this.eGui = document.createElement('input') as HTMLInputElement;
        this.eGui.className = className;
        this.eGui.type = 'checkbox';
        this.eGui.checked = isChecked;

        if(this.params.data.datasetOwner===true)
          this.eGui.disabled = true;
        else
          this.eGui.disabled = false;

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        this.eGui.addEventListener('click', this.boundCheckedHandler);
      }
    }

    checkedHandler(e: any) {
      let checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel == "viewer"){    
          if (checked){
            permission.isChecked = true;
            // Note: jQuery selectors removed as they may not be available in Angular context
          }                    
          else{
            // Note: jQuery selectors removed as they may not be available in Angular context
          }
        }
        else if (permission.permissionLevel == "editor"){            
          permission.isChecked = checked;
        }
      }  
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if(this.eGui && this.boundCheckedHandler){
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }  
    }
  };

  /**
   * Checkbox renderer for creator permissions
   */
  private CheckboxRenderer_creator = class {
    private params: any;
    private eGui: HTMLInputElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className;
      for (const permission of params.data.permissions) {
        if (permission.permissionLevel == "creator"){
          exists = true;
          isChecked = permission.isChecked;
          className = permission.permissionId;
          break;
        }
      }  

      if(exists){
        this.eGui = document.createElement('input') as HTMLInputElement;
        this.eGui.className = className;
        this.eGui.type = 'checkbox';
        this.eGui.checked = isChecked;

        if(this.params.data.datasetOwner===true)
          this.eGui.disabled = true;
        else
          this.eGui.disabled = false;

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        this.eGui.addEventListener('click', this.boundCheckedHandler);
      }
    }

    checkedHandler(e: any) {
      let checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel == "publisher"){            
          if(!checked)
            permission.isChecked = false;
        }
        else if (permission.permissionLevel == "editor"){            
          if (checked){
            permission.isChecked = true;
            // Note: jQuery selectors removed as they may not be available in Angular context
          }                    
          else{
            // Note: jQuery selectors removed as they may not be available in Angular context
          }
        }
        else if (permission.permissionLevel == "viewer"){            
          if (checked){
            permission.isChecked = true;
            // Note: jQuery selectors removed as they may not be available in Angular context
          }                    
          else{
            // Note: jQuery selectors removed as they may not be available in Angular context
          }
        }
        else if (permission.permissionLevel == "creator" || permission.permissionLevel == "editor" || permission.permissionLevel == "viewer"){            
          permission.isChecked = checked;
        }
      }  
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if(this.eGui && this.boundCheckedHandler){
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }  
    }
  };

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
        editable: true,
        sortable: true,
        flex: 1,
        minWidth: 150,
        filter: true,
        floatingFilter: true,
        resizable: true,
        wrapText: true,
        autoHeight: true,
        cellEditor: 'agLargeTextCellEditor',
        cellStyle: { 
          'font-size': '12px', 
          'white-space': 'normal !important', 
          'line-height': '20px !important', 
          'word-break': 'break-word !important', 
          'padding-top': '17px', 
          'padding-bottom': '17px' 
        },
        onCellValueChanged: (newValueParams: any) => {
          // Handle cell value changes for date validation and API updates
          this.handleCellValueChanged(newValueParams, resourceId, resourceType);
        }
      },
      components: {
        deleteButtonRenderer: this.deleteButtonRenderer.bind(this)
      },
      columnDefs: columnDefs,
      rowData: rowData,
      // enables undo / redo
      undoRedoCellEditing: true,
      // restricts the number of undo / redo steps to 10
      undoRedoCellEditingLimit: 10,
      // enables flashing to help see cell changes
      enableCellChangeFlash: true,
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      // Pagination settings
      pagination: true,
      paginationPageSize: 20,
      paginationPageSizeSelector: [10, 20, 50, 100],
      // Filtering is controlled via defaultColDef.filter and per-column filters
      // Grid features
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
      },
      onRowDataChanged: () => {
        this.registerFeatureTableClickHandlers(resourceId, resourceType, enableDelete);
      },
      onModelUpdated: () => {
        this.registerFeatureTableClickHandlers(resourceId, resourceType, enableDelete);
      },
      onViewportChanged: () => {
        this.registerFeatureTableClickHandlers(resourceId, resourceType, enableDelete);
      }
    };

    return gridOptions;
  }

  /**
   * Build column configuration for feature table
   */
  private buildFeatureTableColumnConfig(headers: string[], enableDelete: boolean, resourceType?: string): any[] {
    const columnDefs: any[] = [];

    // Add DB-Record-Id column with delete button (always first, combines both functionalities)
    columnDefs.push({
      headerName: 'DB-Record-Id',
      field: 'kommonitorRecordId',
      pinned: 'left',
      editable: false,
      maxWidth: 125,
      cellClass: 'grid-non-editable',
      cellRenderer: (params: any) => {
        let html = '';
        
        // Add delete button if enabled
        if (enableDelete) {
          const datasetId = this.currentResourceId || '';
          const featureId = params.data['ID'] || params.data['featureId'] || '';
          const recordId = params.data.kommonitorRecordId || params.data.id || '';
          
          if (resourceType === this.resourceType_spatialUnit) {
            html += `<button id="btn__spatialUnit__deleteFeatureEntry__${datasetId}__${featureId}__${recordId}" ` +
                   `class="btn btn-danger btn-sm spatialUnitDeleteFeatureRecordBtn" type="button" ` +
                   `title="Datenobjekt unwiderruflich entfernen" ${enableDelete ? '' : 'disabled'}>` +
                   `<i class="fas fa-trash"></i></button>`;
          } else {
            html += `<button id="btn__georesource__deleteFeatureEntry__${datasetId}__${featureId}__${recordId}" ` +
                   `class="btn btn-danger btn-sm georesourceDeleteFeatureRecordBtn" type="button" ` +
                   `title="Datenobjekt unwiderruflich entfernen" ${enableDelete ? '' : 'disabled'}>` +
                   `<i class="fas fa-trash"></i></button>`;
          }
          html += '<br/>';
        }
        
        // Add the record ID
        html += params.data.kommonitorRecordId || params.data.id || '';
        
        return html;
      }
    });

    // Add Feature-Id column
    columnDefs.push({
      headerName: 'Feature-Id',
      field: 'ID',
      pinned: 'left',
      editable: false,
      cellClass: 'grid-non-editable',
      maxWidth: 125
    });

    // Add Name column
    columnDefs.push({
      headerName: 'Name',
      field: 'NAME',
      pinned: 'left',
      minWidth: 150
    });

    // Add validity date columns
    columnDefs.push({
      headerName: 'Lebenszeitbeginn',
      field: 'validStartDate',
      minWidth: 150
    });

    columnDefs.push({
      headerName: 'Lebenszeitende',
      field: 'validEndDate',
      minWidth: 150
    });

    // Add dynamic headers
    for (const header of headers) {
      columnDefs.push({
        headerName: header,
        field: header,
        minWidth: 125
      });
    }

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
      // If the feature has properties (GeoJSON format), add geometry and record ID to properties
      if (feature.properties) {
        // Add geometry and database record ID to properties to be available within data grid object
        feature.properties.kommonitorGeometry = feature.geometry;
        feature.properties.kommonitorRecordId = feature.id;
        return feature.properties;
      }
      
      // If it's already a flat object, ensure it has the required fields
      if (feature.id && !feature.kommonitorRecordId) {
        feature.kommonitorRecordId = feature.id;
      }
      
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
   * Register click handlers for feature table delete buttons
   */
  registerFeatureTableClickHandlers(resourceId?: string, resourceType?: string, enableDelete?: boolean): void {
    if (!enableDelete) return;

    setTimeout(() => {
      // Remove existing handlers to prevent duplicates
      const deleteButtons = document.querySelectorAll('.spatialUnitDeleteFeatureRecordBtn, .georesourceDeleteFeatureRecordBtn');
      deleteButtons.forEach(button => {
        button.removeEventListener('click', this.handleFeatureDeleteClick);
      });

      // Add new handlers
      deleteButtons.forEach(button => {
        button.addEventListener('click', this.handleFeatureDeleteClick);
      });
    }, 100);
  }

  /**
   * Handle delete button click for feature table
   */
  private handleFeatureDeleteClick = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const button = event.target as HTMLElement;
    const buttonElement = button.closest('button') || button;
    const buttonId = buttonElement.id;

    // Parse button ID: btn__spatialUnit__deleteFeatureEntry__{datasetId}__{featureId}__{recordId}
    const idParts = buttonId.split('__');
    if (idParts.length < 6) {
      console.error('Invalid button ID format:', buttonId);
      return;
    }

    const resourceType = idParts[1]; // spatialUnit or georesource
    const datasetId = idParts[3];
    const featureId = idParts[4];
    const recordId = idParts[5];

    // Broadcast loading event
    this.broadcastService.broadcast(`showLoadingIcon_${resourceType}`, {});

    // Determine URL based on resource type
    let url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}`;
    if (resourceType === 'spatialUnit') {
      url += `/spatial-units/${datasetId}/singleFeature/${featureId}/singleFeatureRecord/${recordId}`;
    } else if (resourceType === 'georesource') {
      url += `/georesources/${datasetId}/singleFeature/${featureId}/singleFeatureRecord/${recordId}`;
    } else {
      console.error('Unknown resource type:', resourceType);
      return;
    }

    // Make DELETE request
    this.http.delete(url).subscribe({
      next: (response: any) => {
        console.log('Successfully deleted database record');
        
        // Update timestamps
        if (resourceType === 'georesource') {
          this.featureTable_georesource_lastUpdate_timestamp_success = this.getCurrentTimestamp();
        } else {
          this.featureTable_spatialUnit_lastUpdate_timestamp_success = this.getCurrentTimestamp();
        }
        
        // Broadcast delete event
        this.broadcastService.broadcast(`onDeleteFeatureEntry_${resourceType}`, {
          datasetId,
          featureId,
          recordId
        });
      },
      error: (error) => {
        console.error('Error while deleting database record:', error);
        
        // Broadcast hide loading event
        this.broadcastService.broadcast(`hideLoadingIcon_${resourceType}`, {});
        
        // Update failure timestamps
        if (resourceType === 'georesource') {
          this.featureTable_georesource_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
        } else {
          this.featureTable_spatialUnit_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
        }
      }
    });
  };

  /**
   * Get current timestamp
   */
  private getCurrentTimestamp(): Date {
    return new Date();
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

  /**
   * Set the grid API for role management operations
   */
  setGridApi(gridApi: GridApi): void {
    this.gridApi_spatialUnits = gridApi;
  }

  /**
   * Handle cell value changes for feature table
   */
  private handleCellValueChanged(newValueParams: any, resourceId?: string, resourceType?: string): void {
    // Validate date properties
    if (!newValueParams.data.validStartDate) {
      newValueParams.data.validStartDate = newValueParams.oldValue;
    }
    
    const isDate = (date: any) => {
      const dateObj = new Date(date);
      return dateObj.toString() !== "Invalid Date" && !isNaN(dateObj.getTime());
    };
    
    if (!isDate(newValueParams.data.validStartDate)) {
      newValueParams.data.validStartDate = newValueParams.oldValue;
    }
    
    if (newValueParams.data.validEndDate === "") {
      newValueParams.data.validEndDate = undefined;
    }
    
    if (newValueParams.data.validEndDate) {
      if (!isDate(newValueParams.data.validEndDate)) {
        newValueParams.data.validEndDate = newValueParams.oldValue;
      }
    }

    // Build GeoJSON for API request
    const geoJSON: any = {
      "type": "Feature",
      geometry: null,
      properties: null,
      id: null
    };

    // Clone properties and extract geometry/ID
    geoJSON.geometry = JSON.parse(JSON.stringify(newValueParams.data.kommonitorGeometry));
    geoJSON.id = JSON.parse(JSON.stringify(newValueParams.data.kommonitorRecordId));
    geoJSON.properties = JSON.parse(JSON.stringify(newValueParams.data));

    // Remove internal properties
    delete geoJSON.properties.kommonitorGeometry;
    delete geoJSON.properties.kommonitorRecordId;

    // Build URL
    let url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}`;
    if (resourceType === this.resourceType_georesource) {
      url += "/georesources/";
    } else {
      url += "/spatial-units/";
    }
    
    url += `${resourceId}/singleFeature/${newValueParams.data.ID}/singleFeatureRecord/${newValueParams.data.kommonitorRecordId}`;

    // Make HTTP PUT request
    this.http.put(url, geoJSON, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        console.log("Successfully updated database record");

        // On success: mark grid cell with green background
        newValueParams.colDef.cellStyle = (p: any) =>
          p.rowIndex.toString() === newValueParams.node.id ? {'background-color': '#9DC89F'} : "";

        newValueParams.api.refreshCells({
          force: true,
          columns: [newValueParams.column.getId()],
          rowNodes: [newValueParams.node]
        });
        
        // Update success timestamp
        if (resourceType === this.resourceType_georesource) {
          this.featureTable_georesource_lastUpdate_timestamp_success = this.getCurrentTimestamp();
        } else {
          this.featureTable_spatialUnit_lastUpdate_timestamp_success = this.getCurrentTimestamp();
        }
      },
      error: (error) => {
        console.error("Error while updating database record:", error);

        // Reset cell value as an error occurred
        newValueParams.data[newValueParams.column.colId] = newValueParams.oldValue;

        // On failure: mark grid cell with red background
        newValueParams.colDef.cellStyle = (p: any) =>
          p.rowIndex.toString() === newValueParams.node.id ? {'background-color': '#E79595'} : "";

        newValueParams.api.refreshCells({
          force: true,
          columns: [newValueParams.column.getId()],
          rowNodes: [newValueParams.node]
        });
        
        // Update failure timestamp
        if (resourceType === this.resourceType_georesource) {
          this.featureTable_georesource_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
        } else {
          this.featureTable_spatialUnit_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
        }
      }
    });
  }
} 