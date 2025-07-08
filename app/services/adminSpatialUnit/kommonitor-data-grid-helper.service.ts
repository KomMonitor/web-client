import { Injectable, Inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from '../broadcast-service/broadcast.service';
import { KommonitorDataExchangeService } from './kommonitor-data-exchange.service';

// Declare ag-Grid types
declare const agGrid: any;
declare const $: any;

@Injectable({
  providedIn: 'root'
})
export class KommonitorDataGridHelperService {

  // Store the data grid options
  private dataGridOptions_spatialUnits: any = null;

  constructor(
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    private kommonitorDataExchangeService: KommonitorDataExchangeService
  ) {}

  /**
   * Main method to build the spatial units data grid
   */
  buildDataGrid_spatialUnits(spatialUnitMetadataArray: any[]): void {
    const gridContainer = document.querySelector('#spatialUnitOverviewTable');
    if (!gridContainer) {
      console.error('Grid container #spatialUnitOverviewTable not found');
      return;
    }

    if (this.dataGridOptions_spatialUnits && this.dataGridOptions_spatialUnits.api && gridContainer.childElementCount > 0) {
      // Grid already exists, just update the data
      this.saveGridStore(this.dataGridOptions_spatialUnits);
      const newRowData = this.buildDataGridRowData_spatialUnits(spatialUnitMetadataArray);
      this.dataGridOptions_spatialUnits.api.setRowData(newRowData);
      this.restoreGridStore(this.dataGridOptions_spatialUnits);
    } else {
      // Create new grid
      this.dataGridOptions_spatialUnits = this.buildDataGridOptions_spatialUnits(spatialUnitMetadataArray);
      new agGrid.Grid(gridContainer, this.dataGridOptions_spatialUnits);
    }
  }

  /**
   * Build the grid options configuration
   */
  private buildDataGridOptions_spatialUnits(spatialUnitMetadataArray: any[]): any {
    const columnDefs = this.buildDataGridColumnConfig_spatialUnits(spatialUnitMetadataArray);
    const rowData = this.buildDataGridRowData_spatialUnits(spatialUnitMetadataArray);

    const gridOptions = {
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
        displayEditButtons_spatialUnits: this.displayEditButtons_spatialUnits.bind(this)
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
        this.headerHeightSetter(this.dataGridOptions_spatialUnits);
      },
      onColumnResized: () => {
        this.headerHeightSetter(this.dataGridOptions_spatialUnits);
      },
      onRowDataChanged: () => {
        this.registerClickHandler_spatialUnits(spatialUnitMetadataArray);
      },
      onModelUpdated: () => {
        this.registerClickHandler_spatialUnits(spatialUnitMetadataArray);
      },
      onViewportChanged: () => {
        this.registerClickHandler_spatialUnits(spatialUnitMetadataArray);
      },
    };

    return gridOptions;
  }

  /**
   * Build column configuration for spatial units
   */
  private buildDataGridColumnConfig_spatialUnits(spatialUnitMetadataArray: any[]): any[] {
    const columnDefs = [
      { 
        headerName: 'Editierfunktionen', 
        pinned: 'left', 
        maxWidth: 170, 
        checkboxSelection: false, 
        headerCheckboxSelection: false, 
        headerCheckboxSelectionFilteredOnly: true, 
        filter: false, 
        sortable: false, 
        cellRenderer: 'displayEditButtons_spatialUnits' 
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
  private registerClickHandler_spatialUnits(spatialUnitMetadataArray: any[]): void {
    // Use jQuery to register click handlers
    const $ = (window as any).$;

    // Edit Metadata Button
    $('.spatialUnitEditMetadataBtn').off();
    $('.spatialUnitEditMetadataBtn').on('click', (event: any) => {
      event.stopPropagation();
      
      const spatialUnitId = event.target.id.split('_')[3];
      const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
      
      // Use Angular BroadcastService instead of AngularJS broadcast
      this.broadcastService.broadcast('onEditSpatialUnitMetadata', spatialUnitMetadata);
    });

    // Edit Features Button
    $('.spatialUnitEditFeaturesBtn').off();
    $('.spatialUnitEditFeaturesBtn').on('click', (event: any) => {
      event.stopPropagation();
      
      const spatialUnitId = event.target.id.split('_')[3];
      const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
      
      // Use Angular BroadcastService instead of AngularJS broadcast
      this.broadcastService.broadcast('onEditSpatialUnitFeatures', spatialUnitMetadata);
    });

    // Edit User Roles Button
    $('.spatialUnitEditUserRolesBtn').off();
    $('.spatialUnitEditUserRolesBtn').on('click', (event: any) => {
      event.stopPropagation();
      
      const spatialUnitId = event.target.id.split('_')[3];
      const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);

      // Use Angular BroadcastService instead of AngularJS broadcast
      this.broadcastService.broadcast('onEditSpatialUnitUserRoles', spatialUnitMetadata);
    });

    // Delete Button
    $('.spatialUnitDeleteBtn').off();
    $('.spatialUnitDeleteBtn').on('click', (event: any) => {
      event.stopPropagation();
      
      const spatialUnitId = event.target.id.split('_')[3];
      const spatialUnitMetadata = this.kommonitorDataExchangeService.getSpatialUnitMetadataById(spatialUnitId);
      
      // Use Angular BroadcastService instead of AngularJS broadcast
      this.broadcastService.broadcast('onDeleteSpatialUnits', [spatialUnitMetadata]);
    });
  }

  /**
   * Get selected spatial units metadata
   */
  getSelectedSpatialUnitsMetadata(): any[] {
    const spatialUnitsMetadataArray: any[] = [];

    if (this.dataGridOptions_spatialUnits && this.dataGridOptions_spatialUnits.api) {
      const selectedNodes = this.dataGridOptions_spatialUnits.api.getSelectedNodes();
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
    if (gridOptions && gridOptions.api) {
      // Store selection state
      const selectedNodes = gridOptions.api.getSelectedNodes();
      gridOptions._savedState = {
        selectedIds: selectedNodes.map((node: any) => node.data.spatialUnitId)
      };
    }
  }

  /**
   * Restore grid state (for preserving selection/filters when updating data)
   */
  private restoreGridStore(gridOptions: any): void {
    if (gridOptions && gridOptions.api && gridOptions._savedState) {
      setTimeout(() => {
        // Restore selection
        gridOptions.api.forEachNode((node: any) => {
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
  private headerHeightSetter(gridOptions: any): void {
    if (gridOptions && gridOptions.api) {
      const headerHeight = this.headerHeightGetter();
      gridOptions.api.setHeaderHeight(headerHeight);
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
    if (currentTableOptionsObject && currentTableOptionsObject.api) {
      // Grid already exists, just update the data
      const newRowData = this.buildRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds);
      currentTableOptionsObject.api.setRowData(newRowData);
    } else {
      // Create new grid
      currentTableOptionsObject = this.buildRoleManagementGridOptions(accessControlMetadata, selectedPermissionIds, reducedRoleManagement);
      const gridDiv = document.querySelector('#' + tableDOMId);
      if (gridDiv) {
        new agGrid.Grid(gridDiv, currentTableOptionsObject);
      }
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
        this.headerHeightSetter(this.dataGridOptions_spatialUnits);
      },
      onColumnResized: () => {
        this.headerHeightSetter(this.dataGridOptions_spatialUnits);
      },
      onRowDataChanged: () => {
        // Register click handlers if needed
      },
      onModelUpdated: () => {
        // Register click handlers if needed
      },
      onViewportChanged: () => {
        // Register click handlers if needed
      },
    };

    return gridOptions;
  }

  /**
   * Get selected role IDs from role management grid
   */
  getSelectedRoleIds_roleManagementGrid(roleManagementTableOptions: any): string[] {
    const ids: string[] = [];
    const deselectedIds: string[] = [];
    
    if (roleManagementTableOptions && roleManagementTableOptions.api) {
      roleManagementTableOptions.api.forEachNode((node: any, index: number) => {
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
} 