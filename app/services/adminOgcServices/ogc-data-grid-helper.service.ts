import { Injectable } from '@angular/core';
import { BroadcastService } from '../broadcast-service/broadcast.service';
import { AgGridAngular } from 'ag-grid-angular';
import { 
  GridOptions, 
  ColDef, 
  GridApi, 
  ColumnApi,
  ICellRendererParams,
  ICellRendererComp,
  GridReadyEvent,
  RowSelectedEvent,
  CellClickedEvent
} from 'ag-grid-community';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { Topic } from 'components/ngComponents/admin/adminTopicsManagement/admin-topics-management.component';
import { OgcService } from 'services/ogcServices/ogc.service';

@Injectable({
  providedIn: 'root'
})
export class OgcDataGridHelperService {

  // Store the data grid options
  private dataGridOptions_wms: GridOptions | null = null;
  private gridApi_wms: GridApi | null = null;

  // Grid references
  private wmsGrid: AgGridAngular | null = null;

  // Component reference for callbacks
  private componentRef: any = null;

  constructor(
    private dataExchangeService: DataExchangeService,
    private ogcService: OgcService
  ) { }

  /**
   * Initialize the grid references
   */
  initializeGrids(wmsGrid: AgGridAngular): void {
    this.wmsGrid = wmsGrid;
  }

  /**
   * Set component reference for callbacks
   */
  setComponentRef(componentRef: any): void {
    this.componentRef = componentRef;
    
    // Update column definitions with the component reference for all grids
    this.updateColumnDefinitions();
  }

  /**
   * Update column definitions with the current component reference
   */
  private updateColumnDefinitions(): void {

    if (this.wmsGrid && this.wmsGrid.api) {
      const wmsColumnDefs = this.getWmsColumnDefinitions();
      this.wmsGrid.api.setColumnDefs(wmsColumnDefs);
    }
  }

  buildDataGrid_wms(georesourcesArray: any[]): void {
    if (!georesourcesArray || georesourcesArray.length === 0) {
      console.warn('No georesources data provided to buildDataGrid_wms');
      return;
    }

    if (!this.wmsGrid) {
      console.warn('Grid references not initialized');
      return;
    }

    this.buildWmsGrid(georesourcesArray);
  }

  /**
   * Build WMS grid
   */
  private buildWmsGrid(georesourcesArray: WmsDataset[]): void {
    if (!this.wmsGrid) {
      return;
    }
    
    const columnDefs = this.getWmsColumnDefinitions();
    
    try {
      this.wmsGrid.api?.setRowData(georesourcesArray);
      this.wmsGrid.api?.setColumnDefs(columnDefs);
      
    } catch (error) {
      console.error('Error updating POI grid:', error);
    }
  }

  /**
   * Get grid options for WMS grid (for ag-grid-angular)
   */
  getWmsGridOptions(): any {
    return {
      components: {
        displayEditButtons_WMSgeoresources: this.displayEditButtons_WMSgeoresources
      },
      defaultColDef: {
        editable: false,
        sortable: true,
        filter: true,
        floatingFilter: true,
        resizable: true,
        wrapText: true,
        autoHeight: true
      },
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
   * Simple function-based cell renderer for edit buttons (like original)
   */
  private displayEditButtons_WMSgeoresources = (params: any) => {
     if (!params.data || !params.data.id) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }

    // Check user permissions (handle both array and potential undefined)
    const userPermissions = params.data.userPermissions || [];
    const hasEditorPermission = Array.isArray(userPermissions) ? 
      (userPermissions.includes("editor") || userPermissions.includes("creator")) : false;
    const hasCreatorPermission = Array.isArray(userPermissions) ? 
      userPermissions.includes("creator") : false;

    const buttonWrapper = document.createElement('div');

    buttonWrapper.appendChild(this.buildEditButton(params, hasEditorPermission));
    buttonWrapper.appendChild(this.buildEditUserRolesButton(params, hasCreatorPermission));
    buttonWrapper.appendChild(this.buildDeleteButton(params, hasCreatorPermission));

    return buttonWrapper;
  }

  buildEditButton(params:any, hasEditorPermission:boolean){
    const button = document.createElement('button');
    button.title = 'Zugriffsschutz und Eigentümerschaft editieren';
    button.className = 'btn btn-warning btn-sm';

    if (!hasEditorPermission) {
      button.disabled = true;
    }

    // Icon <i class="fas fa-pencil-alt"></i>
    const icon = document.createElement('i');
    icon.className = 'fas fa-pencil-alt';

    button.appendChild(icon);

    // Click-Event
    button.addEventListener('click', (event) => {
      event.stopPropagation(); // verhindert Row-Click

      if (!hasEditorPermission) {
        return;
      }

      this.componentRef.onClickEditMetadata(params.data);
    });

    return button;
  }

  buildEditUserRolesButton(params:any, hasCreatorPermission:boolean){
    const button = document.createElement('button');
    button.title = 'Metadaten editieren';
    button.className = 'btn btn-warning btn-sm';

    if (!hasCreatorPermission) {
      button.disabled = true;
    }

    const icon = document.createElement('i');
    icon.className = 'fas fa-user-lock';

    button.appendChild(icon);

    // Click-Event
    button.addEventListener('click', (event) => {
      event.stopPropagation(); // verhindert Row-Click

      if (!hasCreatorPermission) {
        return;
      }

      this.componentRef.onClickEditUserRoles(params.data);
    });

    return button;
  }

  buildDeleteButton(params:any, hasCreatorPermission:boolean){
    const button = document.createElement('button');
    button.title = 'WMS entfernen';
    button.className = 'btn btn-danger btn-sm';

    if (!hasCreatorPermission) {
      button.disabled = true;
    }

    // Icon <i class="fas fa-pencil-alt"></i>
    const icon = document.createElement('i');
    icon.className = 'fas fa-trash';

    button.appendChild(icon);

    // Click-Event
    button.addEventListener('click', (event) => {
      event.stopPropagation(); // verhindert Row-Click

      if (!hasCreatorPermission) {
        return;
      }

      this.componentRef.onClickDelete(params.data);
    });

    return button;
  }

  /**
   * Get WMS column definitions
  */
  private getWmsColumnDefinitions(): ColDef[] {
    return [
      { 
        headerName: 'Editierfunktionen', 
        maxWidth: 200, 
        minWidth: 180,
        checkboxSelection: false, 
        headerCheckboxSelection: false, 
        headerCheckboxSelectionFilteredOnly: true, 
        filter: false, 
        sortable: false, 
        cellRenderer: 'displayEditButtons_WMSgeoresources',
        flex: 1
      },
      { 
        headerName: 'Id', 
        field: "id", 
        maxWidth: 125,
        flex: 1 },
      { 
        headerName: 'Name', 
        field: "title", 
        minWidth: 300,
        flex: 1 },
      { 
        headerName: 'Legende', 
        minWidth: 400,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          return `<img src="${this.ogcService.buildLegendUrl(params.data.connectionDetails.baseUrl, params.data.connectionDetails.layerName)}">`;
        },
        flex: 1
      },
      { 
        headerName: 'Beschreibung', 
        cellRenderer: (params: any) => {
          return params.data.description || '';
        },
        flex: 1
      },
      { 
        headerName: 'Themenhierarchie', 
        cellRenderer: this.translateTopicsReferences,
        flex: 1
      }
    ];
  }

  private translateTopicsReferences = (params: any) => {
    if (!params.data || !params.data.topicReference) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }
    
    const topic:Topic = this.dataExchangeService.availableTopics.find((e:Topic) => e.topicId==params.data.topicReference);

    if(!topic)
      return 'Topic not found';

    return topic.topicName;
  }

  /**
   * Set the grid API for role management operations
   */
  setGridApi(gridApi: GridApi): void {
    this.gridApi_wms = gridApi;
  }

  
  /**
   * Build role management grid for spatial units
   */
  buildRoleManagementGrid(currentTableOptionsObject: any, accessControlMetadata: any[], selectedPermissionIds: string[], reducedRoleManagement: boolean = false): any {
    if (currentTableOptionsObject && this.gridApi_wms) {
      // Grid already exists, just update the data
      const newRowData = this.buildRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds);
      // update underlying options so callers get the latest data
      currentTableOptionsObject.rowData = newRowData;
      this.gridApi_wms.setRowData(newRowData);
      // ensure cells re-render to apply disabled state and checks
      setTimeout(() => {
        try {
          this.gridApi_wms?.refreshCells({ force: true });
          this.gridApi_wms?.redrawRows();
        } catch (e) {}
      }, 0);
    } else {
      // Create new grid options
      currentTableOptionsObject = this.buildRoleManagementGridOptions(accessControlMetadata, selectedPermissionIds, reducedRoleManagement);
      
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
        this.gridApi_wms = params.api;
      }
    };
    return gridOptions;
  }

  /**
   * Set header height for proper display
   */
  private headerHeightSetter(): void {
    if (this.gridApi_wms) {
      const headerHeight = this.headerHeightGetter();
      this.gridApi_wms.setHeaderHeight(headerHeight);
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
   * Expose role management checkbox renderer components for early binding in templates
   */
  public getRoleManagementComponents(): any {
    return {
      CheckboxRenderer_viewer: this.CheckboxRenderer_viewer,
      CheckboxRenderer_editor: this.CheckboxRenderer_editor,
      CheckboxRenderer_creator: this.CheckboxRenderer_creator
    };
  }

  /**
   * Get selected role IDs from role management grid
   */
  getSelectedRoleIds_roleManagementGrid(roleManagementTableOptions: any): string[] {
    const selectedIds = new Set<string>();

    const collectFromRow = (row: any) => {
      if (!row || !row.permissions) return;
      for (const permission of row.permissions) {
        if (permission && permission.isChecked && permission.permissionId) {
          selectedIds.add(permission.permissionId);
        }
      }
    };

    // Prefer live grid data when API is available
    if (this.gridApi_wms && !(this.gridApi_wms as any).isDestroyed?.()) {
      this.gridApi_wms.forEachNode((node: any) => collectFromRow(node.data));
    } else if (roleManagementTableOptions && Array.isArray(roleManagementTableOptions.rowData)) {
      // Fallback to current table options rowData
      for (const row of roleManagementTableOptions.rowData) {
        collectFromRow(row);
      }
    }

    return Array.from(selectedIds);
  }

  /**
   * Checkbox renderer for viewer permissions
   */
  private CheckboxRenderer_viewer = class {
    private params: any;
    private eGui: HTMLElement | null = null;
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
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className;
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable viewer if dataset owner or if editor/creator selection implies viewer
        if (this.params.data.datasetOwner === true || this.params.data._viewerDisabledBecauseOfEditor === true || this.params.data._viewerDisabledBecauseOfCreator === true) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        // If permission does not exist for this row, render empty content to avoid displaying boolean values like "false"
        this.eGui = document.createElement('span');
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

    getGui() { return this.eGui; }

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
    private eGui: HTMLElement | null = null;
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
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className;
        input.type = 'checkbox';
        input.checked = isChecked;
        
        // Disable editor if dataset owner or if creator selection implies editor
        if (this.params.data.datasetOwner === true || this.params.data._editorDisabledBecauseOfCreator === true) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        // If permission does not exist for this row, render empty content to avoid displaying boolean values like "false"
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      let checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel == "viewer"){    
          if (checked){
            permission.isChecked = true;
          } else {
            permission.isChecked = false;
          }
        }
        else if (permission.permissionLevel == "editor"){            
          permission.isChecked = checked;
        }
      }  
      // If editor is checked, enforce viewer checked+disabled
      if (checked) {
        this.params.data._viewerDisabledBecauseOfEditor = true;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "viewer"){
            permission.isChecked = true;
          }
        }
      } else {
        this.params.data._viewerDisabledBecauseOfEditor = false;
      }
      // Ask grid to refresh this row to update disabled state of viewer column
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() { return this.eGui; }

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
    private eGui: HTMLElement | null = null;
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
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className;
        input.type = 'checkbox';
        input.checked = isChecked;
        
        // Disable creator if dataset owner is true
        if (this.params.data.datasetOwner === true) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        // If permission does not exist for this row, render empty content to avoid displaying boolean values like "false"
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      let checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel == "creator" || permission.permissionLevel == "editor" || permission.permissionLevel == "viewer"){            
          permission.isChecked = checked;
        }
      }  
      // If creator is checked, enforce editor and viewer checked+disabled
      if (checked) {
        this.params.data._editorDisabledBecauseOfCreator = true;
        this.params.data._viewerDisabledBecauseOfCreator = true;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == "editor" || permission.permissionLevel == "viewer"){
            permission.isChecked = true;
          }
        }
      } else {
        this.params.data._editorDisabledBecauseOfCreator = false;
        this.params.data._viewerDisabledBecauseOfCreator = false;
      }
      // Ask grid to refresh this row to update disabled state of editor/viewer columns
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if(this.eGui && this.boundCheckedHandler){
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }  
    }
  };

  /**
   * Build default column definition for role management grids
   */
  buildRoleManagementDefaultColDef(): any {
    return {
      editable: false,
      sortable: true,
      flex: 1,
      minWidth: 100,
      filter: false,
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
          '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
          '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
          '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
          '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
          '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
          '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
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
}
