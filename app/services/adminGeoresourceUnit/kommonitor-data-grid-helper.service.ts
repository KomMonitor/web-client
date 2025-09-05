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

// Interfaces for better typing
export interface GeoresourceMetadata {
  georesourceId: string;
  datasetName: string;
  isPOI?: boolean;
  isLOI?: boolean;
  isAOI?: boolean;
  poiSymbolColor?: string;
  poiSymbolBootstrap3Name?: string;
  poiMarkerColor?: string;
  loiColor?: string;
  loiWidth?: number;
  loiDashArrayString?: string;
  aoiColor?: string;
  metadata?: {
    description?: string;
    datasource?: string;
    contact?: string;
  };
  availablePeriodsOfValidity?: Array<{
    startDate: string;
    endDate?: string;
  }>;
  topicReference?: any;
  permissions?: any;
  isPublic?: boolean;
  ownerId?: string;
  userPermissions?: string[];
}

export interface GridState {
  columnDefs: any[];
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class KommonitorGeoresourceDataGridHelperService {

  // Grid references
  private poiGrid: AgGridAngular | null = null;
  private loiGrid: AgGridAngular | null = null;
  private aoiGrid: AgGridAngular | null = null;

  // Component reference for callbacks
  private componentRef: any = null;

  // Grid state storage
  private gridStates = new Map<string, GridState>();

  // Current georesources data for lookup
  private currentGeoresources: GeoresourceMetadata[] = [];

  // Timestamp properties for feature table updates (like original AngularJS service)
  featureTable_spatialUnit_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_spatialUnit_lastUpdate_timestamp_failure: Date | undefined = undefined;
  featureTable_georesource_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_georesource_lastUpdate_timestamp_failure: Date | undefined = undefined;
  featureTable_indicator_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_indicator_lastUpdate_timestamp_failure: Date | undefined = undefined;

  // Resource type constants (like original AngularJS service)
  readonly resourceType_georesource = "georesource";
  readonly resourceType_spatialUnit = "spatialUnit";
  readonly resourceType_indicator = "indicator";

  constructor(
    private broadcastService: BroadcastService
  ) {}

  /**
   * Simple function-based cell renderer for edit buttons (like original)
   */
  private displayEditButtons_georesources = (params: any) => {
    if (!params.data || !params.data.georesourceId) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }

    const editMetadataButtonId = 'btn_georesource_editMetadata_' + params.data.georesourceId;
    const editFeaturesButtonId = 'btn_georesource_editFeatures_' + params.data.georesourceId;
    const editUserRolesButtonId = 'btn_georesource_editUserRoles_' + params.data.georesourceId;
    const deleteButtonId = 'btn_georesource_deleteGeoresource_' + params.data.georesourceId;

    // Check user permissions (handle both array and potential undefined)
    const userPermissions = params.data.userPermissions || [];
    const hasEditorPermission = Array.isArray(userPermissions) ? 
      (userPermissions.includes("editor") || userPermissions.includes("creator")) : false;
    const hasCreatorPermission = Array.isArray(userPermissions) ? 
      userPermissions.includes("creator") : false;

    let html = '<div class="btn-group btn-group-sm">';
    html += '<button id="' + editMetadataButtonId + '" class="btn btn-warning btn-sm georesourceEditMetadataBtn" type="button" title="Metadaten editieren" ' + 
            (hasEditorPermission ? '' : 'disabled') + '><i class="fas fa-pencil-alt"></i></button>';
    html += '<button id="' + editFeaturesButtonId + '" class="btn btn-warning btn-sm georesourceEditFeaturesBtn" type="button" title="Features fortführen" ' + 
            (hasEditorPermission ? '' : 'disabled') + '><i class="fas fa-draw-polygon"></i></button>';
    html += '<button id="' + editUserRolesButtonId + '" class="btn btn-warning btn-sm georesourceEditUserRolesBtn" type="button" title="Zugriffsschutz und Eigentümerschaft editieren" ' + 
            (hasCreatorPermission ? '' : 'disabled') + '><i class="fas fa-user-lock"></i></button>';
    html += '<button id="' + deleteButtonId + '" class="btn btn-danger btn-sm georesourceDeleteBtn" type="button" title="Georessource entfernen" ' + 
            (hasCreatorPermission ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';
    html += '</div>';

    return html;
  }

  /**
   * Initialize the grid references
   */
  initializeGrids(poiGrid: AgGridAngular, loiGrid: AgGridAngular, aoiGrid: AgGridAngular): void {
    this.poiGrid = poiGrid;
    this.loiGrid = loiGrid;
    this.aoiGrid = aoiGrid;
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
    if (this.poiGrid && this.poiGrid.api) {
      const poiColumnDefs = this.getPoiColumnDefinitions();
      this.poiGrid.api.setColumnDefs(poiColumnDefs);
    }
    
    if (this.loiGrid && this.loiGrid.api) {
      const loiColumnDefs = this.getLoiColumnDefinitions();
      this.loiGrid.api.setColumnDefs(loiColumnDefs);
    }
    
    if (this.aoiGrid && this.aoiGrid.api) {
      const aoiColumnDefs = this.getAoiColumnDefinitions();
      this.aoiGrid.api.setColumnDefs(aoiColumnDefs);
    }
  }

  /**
   * Build data grid for georesources
   */
  buildDataGrid_georesources(georesourcesArray: GeoresourceMetadata[]): void {
    if (!georesourcesArray || georesourcesArray.length === 0) {
      console.warn('No georesources data provided to buildDataGrid_georesources');
      return;
    }

    if (!this.poiGrid || !this.loiGrid || !this.aoiGrid) {
      console.warn('Grid references not initialized');
      return;
    }

    // Store current georesources for lookup
    this.currentGeoresources = [...georesourcesArray];

    // Update timestamps like original AngularJS service
    this.featureTable_georesource_lastUpdate_timestamp_success = new Date();

    this.buildPoiGrid(georesourcesArray);
    this.buildLoiGrid(georesourcesArray);
    this.buildAoiGrid(georesourcesArray);
  }

  /**
   * Build POI grid
   */
  private buildPoiGrid(georesourcesArray: GeoresourceMetadata[]): void {
    if (!this.poiGrid) {
      return;
    }
    
    const poiData = georesourcesArray.filter(item => item.isPOI);
    const columnDefs = this.getPoiColumnDefinitions();
    
    try {
      this.poiGrid.api?.setRowData(poiData);
      this.poiGrid.api?.setColumnDefs(columnDefs);
      
      // Register click handlers after a short delay
      setTimeout(() => {
        this.registerClickHandler_georesources(georesourcesArray);
      }, 500);
    } catch (error) {
      console.error('Error updating POI grid:', error);
      this.featureTable_georesource_lastUpdate_timestamp_failure = new Date();
    }
  }

  /**
   * Build LOI grid
   */
  private buildLoiGrid(georesourcesArray: GeoresourceMetadata[]): void {
    if (!this.loiGrid) {
      return;
    }
    
    const loiData = georesourcesArray.filter(item => item.isLOI);
    const columnDefs = this.getLoiColumnDefinitions();
    
    try {
      this.loiGrid.api?.setRowData(loiData);
      this.loiGrid.api?.setColumnDefs(columnDefs);
      
      // Register click handlers after a short delay
      setTimeout(() => {
        this.registerClickHandler_georesources(georesourcesArray);
      }, 500);
    } catch (error) {
      console.error('Error updating LOI grid:', error);
      this.featureTable_georesource_lastUpdate_timestamp_failure = new Date();
    }
  }

  /**
   * Build AOI grid
   */
  private buildAoiGrid(georesourcesArray: GeoresourceMetadata[]): void {
    if (!this.aoiGrid) {
      return;
    }
    
    const aoiData = georesourcesArray.filter(item => item.isAOI);
    const columnDefs = this.getAoiColumnDefinitions();
    
    try {
      this.aoiGrid.api?.setRowData(aoiData);
      this.aoiGrid.api?.setColumnDefs(columnDefs);
      
      // Register click handlers after a short delay
      setTimeout(() => {
        this.registerClickHandler_georesources(georesourcesArray);
      }, 500);
    } catch (error) {
      console.error('Error updating AOI grid:', error);
      this.featureTable_georesource_lastUpdate_timestamp_failure = new Date();
    }
  }

  /**
   * Register click handlers for georesource buttons
   */
  private registerClickHandler_georesources(georesourceMetadataArray: GeoresourceMetadata[]): void {
    
    
    // Edit Metadata Button
    const editMetadataButtons = document.querySelectorAll('.georesourceEditMetadataBtn');
    editMetadataButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleEditMetadataClick);
      button.addEventListener('click', this.handleEditMetadataClick);
    });

    // Edit Features Button
    const editFeaturesButtons = document.querySelectorAll('.georesourceEditFeaturesBtn');
    editFeaturesButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleEditFeaturesClick);
      button.addEventListener('click', this.handleEditFeaturesClick);
    });

    // Edit User Roles Button
    const editUserRolesButtons = document.querySelectorAll('.georesourceEditUserRolesBtn');
    editUserRolesButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleEditUserRolesClick);
      button.addEventListener('click', this.handleEditUserRolesClick);
    });

    // Delete Button
    const deleteButtons = document.querySelectorAll('.georesourceDeleteBtn');
    deleteButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleDeleteClick);
      button.addEventListener('click', this.handleDeleteClick);
    });

    // Also try to find buttons by their specific IDs
    if (georesourceMetadataArray && georesourceMetadataArray.length > 0) {
      georesourceMetadataArray.forEach(geo => {
        const editMetadataBtn = document.getElementById(`btn_georesource_editMetadata_${geo.georesourceId}`);
        const editFeaturesBtn = document.getElementById(`btn_georesource_editFeatures_${geo.georesourceId}`);
        const editUserRolesBtn = document.getElementById(`btn_georesource_editUserRoles_${geo.georesourceId}`);
        const deleteBtn = document.getElementById(`btn_georesource_deleteGeoresource_${geo.georesourceId}`);

        if (editMetadataBtn) {
          editMetadataBtn.removeEventListener('click', this.handleEditMetadataClick);
          editMetadataBtn.addEventListener('click', this.handleEditMetadataClick);
        }
        if (editFeaturesBtn) {
          editFeaturesBtn.removeEventListener('click', this.handleEditFeaturesClick);
          editFeaturesBtn.addEventListener('click', this.handleEditFeaturesClick);
        }
        if (editUserRolesBtn) {
          editUserRolesBtn.removeEventListener('click', this.handleEditUserRolesClick);
          editUserRolesBtn.addEventListener('click', this.handleEditUserRolesClick);
        }
        if (deleteBtn) {
          deleteBtn.removeEventListener('click', this.handleDeleteClick);
          deleteBtn.addEventListener('click', this.handleDeleteClick);
        }
      });
    }
  }

  /**
   * Handle edit metadata button click
   */
  private handleEditMetadataClick = (event: any): void => {
    event.stopPropagation();
    
    const georesourceId = event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata = this.findGeoresourceMetadataById(georesourceId);
    
    if (this.componentRef && georesourceMetadata) {
      this.componentRef.onClickEditMetadata(georesourceMetadata);
    }
  }

  /**
   * Handle edit features button click
   */
  private handleEditFeaturesClick = (event: any): void => {
    event.stopPropagation();
    
    const georesourceId = event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata = this.findGeoresourceMetadataById(georesourceId);
    
    if (this.componentRef && georesourceMetadata) {
      this.componentRef.onClickEditFeatures(georesourceMetadata);
    }
  }

  /**
   * Handle edit user roles button click
   */
  private handleEditUserRolesClick = (event: any): void => {
    event.stopPropagation();
    
    const georesourceId = event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata = this.findGeoresourceMetadataById(georesourceId);
    
    if (this.componentRef && georesourceMetadata) {
      this.componentRef.onClickEditUserRoles(georesourceMetadata);
    }
  }

  /**
   * Handle delete button click
   */
  private handleDeleteClick = (event: any): void => {
    event.stopPropagation();
    
    const georesourceId = event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata = this.findGeoresourceMetadataById(georesourceId);
    
    if (this.componentRef && georesourceMetadata) {
      this.componentRef.onClickDeleteGeoresource(georesourceMetadata);
    }
  }

  /**
   * Find georesource metadata by ID from current data
   */
  private findGeoresourceMetadataById(georesourceId: string): GeoresourceMetadata | null {
    return this.currentGeoresources.find(geo => geo.georesourceId === georesourceId) || null;
  }

  /**
   * Get POI column definitions
   */
  private getPoiColumnDefinitions(): ColDef[] {
    return [
      { 
        headerName: 'Editierfunktionen', 
        pinned: 'left', 
        maxWidth: 200, 
        minWidth: 180,
        checkboxSelection: false, 
        headerCheckboxSelection: false, 
        headerCheckboxSelectionFilteredOnly: true, 
        filter: false, 
        sortable: false, 
        cellRenderer: 'displayEditButtons_georesources' 
      },
      { headerName: 'Id', field: "georesourceId", pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: "datasetName", pinned: 'left', minWidth: 300 },
      { 
        headerName: 'Symbolfarbe', 
        field: "poiSymbolColor", 
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          const color = params.data.poiSymbolColor || '#000000';
          return `<div>${color}</div><br/><div style='width: 20px; height: 20px; background-color: ${color};'></div>`;
        }
      },
      { 
        headerName: 'Symbolname', 
        field: "poiSymbolBootstrap3Name", 
        maxWidth: 125,
        cellRenderer: (params: any) => {
          const symbolName = params.data.poiSymbolBootstrap3Name || 'home';
          return `${symbolName}<br/><br/><span class='glyphicon glyphicon-${symbolName}'></span>`;
        }
      },
      { 
        headerName: 'Markerfarbe', 
        field: "poiMarkerColor", 
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          const color = params.data.poiMarkerColor || '#000000';
          return `<div>${color}</div><br/><div style='width: 20px; height: 20px; background-color: ${color};'></div>`;
        }
      },
      { 
        headerName: 'Beschreibung', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.metadata?.description || '';
        }
      },
      {
        headerName: 'Gültigkeitszeitraum', 
        minWidth: 400,
        cellRenderer: (params: any) => {
          let html = '<ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; word-break: break-word !important;">';
          for (const periodOfValidity of params.data.availablePeriodsOfValidity || []) {
            html += '<li style="margin-right: 15px;">';
            if(periodOfValidity.endDate){
              html += "<p>" + periodOfValidity.startDate + " &dash; " + periodOfValidity.endDate + "</p>";
            } else {
              html += "<p>" + periodOfValidity.startDate + " &dash; heute</p>";
            }                
            html += '</li>';
          }
          html += '</ul>';
          return html;
        }
      },
      { 
        headerName: 'Themenhierarchie', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return this.getTopicHierarchyDisplayString(params.data.topicReference);
        }
      },
      { 
        headerName: 'Datenquelle', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.metadata?.datasource || '';
        }
      },
      { 
        headerName: 'Datenhalter und Kontakt', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.metadata?.contact || '';
        }
      },
      { 
        headerName: 'Rollen', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return this.getAllowedRolesString(params.data.permissions);
        }
      },
      { 
        headerName: 'Öffentlich sichtbar', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.isPublic ? 'ja' : 'nein';
        }
      },
      { 
        headerName: 'Eigentümer', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return this.getRoleTitle(params.data.ownerId);
        }
      }
    ];
  }

  /**
   * Get LOI column definitions
   */
  private getLoiColumnDefinitions(): ColDef[] {
    return [
      { 
        headerName: 'Editierfunktionen', 
        pinned: 'left', 
        maxWidth: 200, 
        minWidth: 180,
        checkboxSelection: false, 
        headerCheckboxSelection: false, 
        headerCheckboxSelectionFilteredOnly: true, 
        filter: false, 
        sortable: false, 
        cellRenderer: 'displayEditButtons_georesources' 
      },
      { headerName: 'Id', field: "georesourceId", pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: "datasetName", pinned: 'left', minWidth: 300 },
      { 
        headerName: 'Linienfarbe', 
        field: "loiColor", 
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          const color = params.data.loiColor || '#000000';
          return `<div>${color}</div><br/><div style='width: 20px; height: 20px; background-color: ${color};'></div>`;
        }
      },
      { headerName: 'Linienbreite', field: "loiWidth", maxWidth: 125 },
      { 
        headerName: 'Linienmuster', 
        field: "loiDashArrayString", 
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          return this.getLoiDashSvgFromStringValue(params.data.loiDashArrayString);
        }
      },
      { 
        headerName: 'Beschreibung', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.metadata?.description || '';
        }
      },
      {
        headerName: 'Gültigkeitszeitraum', 
        minWidth: 400,
        cellRenderer: (params: any) => {
          let html = '<ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; word-break: break-word !important;">';
          for (const periodOfValidity of params.data.availablePeriodsOfValidity || []) {
            html += '<li style="margin-right: 15px;">';
            if(periodOfValidity.endDate){
              html += "<p>" + periodOfValidity.startDate + " &dash; " + periodOfValidity.endDate + "</p>";
            } else {
              html += "<p>" + periodOfValidity.startDate + " &dash; heute</p>";
            }                
            html += '</li>';
          }
          html += '</ul>';
          return html;
        }
      },
      { 
        headerName: 'Themenhierarchie', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return this.getTopicHierarchyDisplayString(params.data.topicReference);
        }
      },
      { 
        headerName: 'Datenquelle', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.metadata?.datasource || '';
        }
      },
      { 
        headerName: 'Datenhalter und Kontakt', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.metadata?.contact || '';
        }
      },
      { 
        headerName: 'Rollen', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return this.getAllowedRolesString(params.data.permissions);
        }
      },
      { 
        headerName: 'Öffentlich sichtbar', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.isPublic ? 'ja' : 'nein';
        }
      },
      { 
        headerName: 'Eigentümer', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return this.getRoleTitle(params.data.ownerId);
        }
      }
    ];
  }

  /**
   * Get AOI column definitions
   */
  private getAoiColumnDefinitions(): ColDef[] {
    return [
      { 
        headerName: 'Editierfunktionen', 
        pinned: 'left', 
        maxWidth: 200, 
        minWidth: 180,
        checkboxSelection: false, 
        headerCheckboxSelection: false, 
        headerCheckboxSelectionFilteredOnly: true, 
        filter: false, 
        sortable: false, 
        cellRenderer: 'displayEditButtons_georesources' 
      },
      { headerName: 'Id', field: "georesourceId", pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: "datasetName", pinned: 'left', minWidth: 300 },
      { 
        headerName: 'Polygonfarbe', 
        field: "aoiColor", 
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          const color = params.data.aoiColor || '#000000';
          return `<div>${color}</div><br/><div style='width: 20px; height: 20px; background-color: ${color};'></div>`;
        }
      },
      { 
        headerName: 'Beschreibung', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.metadata?.description || '';
        }
      },
      {
        headerName: 'Gültigkeitszeitraum', 
        minWidth: 400,
        cellRenderer: (params: any) => {
          let html = '<ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; word-break: break-word !important;">';
          for (const periodOfValidity of params.data.availablePeriodsOfValidity || []) {
            html += '<li style="margin-right: 15px;">';
            if(periodOfValidity.endDate){
              html += "<p>" + periodOfValidity.startDate + " &dash; " + periodOfValidity.endDate + "</p>";
            } else {
              html += "<p>" + periodOfValidity.startDate + " &dash; heute</p>";
            }                
            html += '</li>';
          }
          html += '</ul>';
          return html;
        }
      },
      { 
        headerName: 'Themenhierarchie', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return this.getTopicHierarchyDisplayString(params.data.topicReference);
        }
      },
      { 
        headerName: 'Datenquelle', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.metadata?.datasource || '';
        }
      },
      { 
        headerName: 'Datenhalter und Kontakt', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.metadata?.contact || '';
        }
      },
      { 
        headerName: 'Rollen', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return this.getAllowedRolesString(params.data.permissions);
        }
      },
      { 
        headerName: 'Öffentlich sichtbar', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return params.data.isPublic ? 'ja' : 'nein';
        }
      },
      { 
        headerName: 'Eigentümer', 
        minWidth: 400, 
        cellRenderer: (params: any) => {
          return this.getRoleTitle(params.data.ownerId);
        }
      }
    ];
  }

  /**
   * Get selected georesources metadata from all grids
   */
  getSelectedGeoresourcesMetadata(): GeoresourceMetadata[] {
    const selectedRows: GeoresourceMetadata[] = [];
    
    if (this.poiGrid?.api) {
      selectedRows.push(...this.poiGrid.api.getSelectedRows());
    }
    if (this.loiGrid?.api) {
      selectedRows.push(...this.loiGrid.api.getSelectedRows());
    }
    if (this.aoiGrid?.api) {
      selectedRows.push(...this.aoiGrid.api.getSelectedRows());
    }
    
    return selectedRows;
  }

  /**
   * Get current timestamp string
   */
  getCurrentTimestampString(): string {
    const date = new Date();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Clear all grid selections
   */
  clearAllSelections(): void {
    this.poiGrid?.api?.deselectAll();
    this.loiGrid?.api?.deselectAll();
    this.aoiGrid?.api?.deselectAll();
  }

  /**
   * Refresh all grids
   */
  refreshAllGrids(): void {
    this.poiGrid?.api?.refreshCells();
    this.loiGrid?.api?.refreshCells();
    this.aoiGrid?.api?.refreshCells();
  }

  /**
   * Export grid data to CSV
   */
  exportToCsv(gridType: 'poi' | 'loi' | 'aoi'): void {
    let gridApi: GridApi | undefined = undefined;
    
    switch (gridType) {
      case 'poi':
        gridApi = this.poiGrid?.api;
        break;
      case 'loi':
        gridApi = this.loiGrid?.api;
        break;
      case 'aoi':
        gridApi = this.aoiGrid?.api;
        break;
    }
    
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `georesources_${gridType}_${this.getCurrentTimestampString()}.csv`
      });
    }
  }

  /**
   * Save grid state for a specific grid
   */
  saveGridState(gridType: 'poi' | 'loi' | 'aoi'): void {
    let gridApi: GridApi | undefined = undefined;
    
    switch (gridType) {
      case 'poi':
        gridApi = this.poiGrid?.api;
        break;
      case 'loi':
        gridApi = this.loiGrid?.api;
        break;
      case 'aoi':
        gridApi = this.aoiGrid?.api;
        break;
    }
    
    if (gridApi) {
      const state: GridState = {
        columnDefs: gridApi.getColumnDefs() || [],
        timestamp: new Date()
      };
      
      this.gridStates.set(gridType, state);
    }
  }

  /**
   * Restore grid state for a specific grid
   */
  restoreGridState(gridType: 'poi' | 'loi' | 'aoi'): void {
    const state = this.gridStates.get(gridType);
    if (!state) return;
    
    let gridApi: GridApi | undefined = undefined;
    
    switch (gridType) {
      case 'poi':
        gridApi = this.poiGrid?.api;
        break;
      case 'loi':
        gridApi = this.loiGrid?.api;
        break;
      case 'aoi':
        gridApi = this.aoiGrid?.api;
        break;
    }
    
    if (gridApi) {
      // Restore column definitions
      gridApi.setColumnDefs(state.columnDefs);
    }
  }

  /**
   * Get grid options for POI grid (for ag-grid-angular)
   */
  getPoiGridOptions(): any {
    return {
      components: {
        displayEditButtons_georesources: this.displayEditButtons_georesources
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
      suppressColumnVirtualisation: true,
      onModelUpdated: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      },
      onRowDataChanged: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      }
    };
  }

  /**
   * Get grid options for LOI grid (for ag-grid-angular)
   */
  getLoiGridOptions(): any {
    return {
      components: {
        displayEditButtons_georesources: this.displayEditButtons_georesources
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
      suppressColumnVirtualisation: true,
      onModelUpdated: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      },
      onRowDataChanged: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      }
    };
  }

  /**
   * Get grid options for AOI grid (for ag-grid-angular)
   */
  getAoiGridOptions(): any {
    return {
      components: {
        displayEditButtons_georesources: this.displayEditButtons_georesources
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
      suppressColumnVirtualisation: true,
      onModelUpdated: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      },
      onRowDataChanged: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      }
    };
  }

  // Utility methods that were in the original AngularJS service

  /**
   * Get topic hierarchy display string
   */
  private getTopicHierarchyDisplayString(topicReference: any): string {
    if (!topicReference) return '';
    
    // Simple implementation - can be enhanced based on actual topic structure
    if (Array.isArray(topicReference)) {
      return topicReference.map((topic: any) => topic.name || topic.title || topic.id).join(' > ');
    }
    
    if (typeof topicReference === 'object') {
      return topicReference.name || topicReference.title || topicReference.id || '';
    }
    
    return String(topicReference);
  }

  /**
   * Get allowed roles string
   */
  private getAllowedRolesString(permissions: any): string {
    if (!permissions) return '';
    
    if (Array.isArray(permissions)) {
      return permissions.join(', ');
    }
    
    if (typeof permissions === 'object') {
      return Object.keys(permissions).join(', ');
    }
    
    return String(permissions);
  }

  /**
   * Get role title
   */
  private getRoleTitle(ownerId: any): string {
    if (!ownerId) return '';
    
    // Simple implementation - can be enhanced based on actual role structure
    if (typeof ownerId === 'object') {
      return ownerId.name || ownerId.title || ownerId.id || '';
    }
    
    return String(ownerId);
  }

  /**
   * Get LOI dash SVG from string value
   */
  private getLoiDashSvgFromStringValue(dashArrayString: string): string {
    if (!dashArrayString) return '';
    
    // Simple implementation - can be enhanced to generate actual SVG
    return `<div style="border-top: 2px dashed #000; width: 20px;"></div>`;
  }

  /**
   * Manually re-register click handlers for all grids
   */
  reRegisterClickHandlers(): void {
    if (this.currentGeoresources && this.currentGeoresources.length > 0) {
      this.registerClickHandler_georesources(this.currentGeoresources);
    }
  }

  /**
   * Build role management grid
   */
  buildRoleManagementGrid(
    gridId: string,
    existingOptions: any,
    accessControl: any[],
    selectedRoleIds: string[]
  ): any {
    if (!accessControl || accessControl.length === 0) {
      return null;
    }

    // Build row data from access control (like spatial unit service)
    const rowData = this.buildRoleManagementGridRowData(accessControl, selectedRoleIds);

    return {
      gridId: gridId,
      rowData: rowData,
      columnDefs: this.buildRoleManagementGridColumnConfig(true), // Use reducedRoleManagement = true
      components: this.getRoleManagementComponents(),
      defaultColDef: {
        editable: false,
        sortable: true,
        filter: true,
        resizable: true,
        wrapText: true,
        autoHeight: true,
        cellStyle: {
          'font-size': '12px',
          'white-space': 'normal',
          'line-height': '20px',
          'word-break': 'break-word',
          'padding-top': '12px',
          'padding-bottom': '12px'
        }
      },
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      headerHeight: 40,
      rowHeight: 35,
      onFirstDataRendered: (params: any) => {
        try { params.api.resetRowHeights(); } catch {}
      },
      onColumnResized: (params: any) => {
        try { params.api.resetRowHeights(); } catch {}
      },
      onRowDataChanged: (params: any) => {
        try { params.api.resetRowHeights(); } catch {}
      }
    };
  }

  /**
   * Build role management grid row data (like spatial unit service)
   */
  private buildRoleManagementGridRowData(accessControl: any[], permissionIds: string[]): any[] {
    if (!accessControl || accessControl.length === 0) {
      return [];
    }

    // Clone and annotate permissions with isChecked flags based on provided permissionIds
    const data = JSON.parse(JSON.stringify(accessControl));
    
    for (const elem of data) {
      if (elem.name === 'public') {
        elem.name = 'Öffentlicher Zugriff';
      }
      // Ensure helper flags exist for disable cascading
      elem._viewerDisabledBecauseOfEditor = false;
      elem._viewerDisabledBecauseOfCreator = false;
      elem._editorDisabledBecauseOfCreator = false;
      if (elem.permissions && Array.isArray(elem.permissions)) {
        for (const permission of elem.permissions) {
          permission.isChecked = permissionIds && permissionIds.includes(permission.permissionId);
        }
      }
    }
    
    // Sort data properly - put 'public' and first organization first, then sort the rest
    const sortedData: any[] = [];
    const publicItem = data.find(item => item.name === 'Öffentlicher Zugriff');
    const firstOrg = data.find(item => item.name !== 'Öffentlicher Zugriff');
    
    if (publicItem) {
      sortedData.push(publicItem);
    }
    if (firstOrg) {
      sortedData.push(firstOrg);
    }
    
    // Add remaining items sorted alphabetically
    const remainingItems = data.filter(item => 
      item.name !== 'Öffentlicher Zugriff' && item !== firstOrg
    ).sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    
    return sortedData.concat(remainingItems);
  }

  /**
   * Build role management grid column configuration (like spatial unit service)
   */
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

  /**
   * Get selected role IDs from role management grid
   */
  getSelectedRoleIds_roleManagementGrid(gridOptions: any): string[] {
    if (!gridOptions || !gridOptions.rowData) {
      return [];
    }

    const selectedIds = new Set<string>();
    const collectFromRow = (row: any) => {
      if (!row || !row.permissions) return;
      for (const permission of row.permissions) {
        if (permission && permission.isChecked && permission.permissionId) {
          selectedIds.add(permission.permissionId);
        }
      }
    };

    for (const row of gridOptions.rowData) {
      collectFromRow(row);
    }

    return Array.from(selectedIds);
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
   * Checkbox renderer for viewer permissions (georesource)
   */
  private CheckboxRenderer_viewer = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className: string | undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'viewer') {
            exists = true;
            isChecked = !!permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className || '';
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable viewer if dataset owner or enforced by editor/creator
        if (this.params.data.datasetOwner === true || this.params.data._viewerDisabledBecauseOfEditor === true || this.params.data._viewerDisabledBecauseOfCreator === true) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      if (this.params && this.params.data && Array.isArray(this.params.data.permissions)) {
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel === 'viewer') {
            permission.isChecked = checked;
            break;
          }
        }
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  /**
   * Checkbox renderer for editor permissions (georesource)
   */
  private CheckboxRenderer_editor = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className: string | undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'editor') {
            exists = true;
            isChecked = !!permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className || '';
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable editor for dataset owner or creator enforced
        if (this.params.data.datasetOwner === true || this.params.data._editorDisabledBecauseOfCreator === true) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      if (this.params && this.params.data && Array.isArray(this.params.data.permissions)) {
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel === 'viewer') {
            permission.isChecked = !!checked || !!permission.isChecked;
          } else if (permission.permissionLevel === 'editor') {
            permission.isChecked = checked;
          }
        }
      }
      // Enforce viewer checked+disabled when editor is checked
      if (checked) {
        this.params.data._viewerDisabledBecauseOfEditor = true;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel === 'viewer') {
            permission.isChecked = true;
          }
        }
      } else {
        this.params.data._viewerDisabledBecauseOfEditor = false;
      }
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  /**
   * Checkbox renderer for creator permissions (georesource)
   */
  private CheckboxRenderer_creator = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className: string | undefined;
      if (params && params.data && Array.isArray(params.data.permissions)) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel === 'creator') {
            exists = true;
            isChecked = !!permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className || '';
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable creator for dataset owner
        if (this.params.data.datasetOwner === true) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      if (this.params && this.params.data && Array.isArray(this.params.data.permissions)) {
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel === 'creator' || permission.permissionLevel === 'editor' || permission.permissionLevel === 'viewer') {
            permission.isChecked = checked;
          }
        }
      }
      // Enforce cascading disable flags
      if (checked) {
        this.params.data._editorDisabledBecauseOfCreator = true;
        this.params.data._viewerDisabledBecauseOfCreator = true;
      } else {
        this.params.data._editorDisabledBecauseOfCreator = false;
        this.params.data._viewerDisabledBecauseOfCreator = false;
      }
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() { return this.eGui; }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  /**
   * Build data grid for feature table of spatial resource (like spatial unit service)
   */
  buildDataGrid_featureTable_spatialResource(
    tableId: string, 
    headers: string[], 
    features: any[] = [], 
    resourceId?: string, 
    resourceType?: string, 
    enableDelete: boolean = false
  ): any {
    console.log(`Building feature table grid for ${tableId} with ${features.length} features`);
    
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
        }
      },
      columnDefs: columnDefs,
      rowData: rowData,
      pagination: true,
      paginationPageSize: 25,
      domLayout: 'autoHeight',
      suppressRowClickSelection: true,
      enableCellTextSelection: true,
      suppressCellFocus: true
    };
    
    return gridOptions;
  }

  /**
   * Build column configuration for feature table
   */
  private buildFeatureTableColumnConfig(headers: string[], enableDelete: boolean, resourceType?: string): any[] {
    const columnDefs: any[] = [];
    
    // Add standard columns
    columnDefs.push(
      { 
        headerName: 'ID', 
        field: 'ID', 
        minWidth: 100,
        editable: false,
        cellStyle: { 'font-weight': 'bold' }
      },
      { 
        headerName: 'Name', 
        field: 'NAME', 
        minWidth: 200,
        editable: true
      },
      { 
        headerName: 'Valid Start Date', 
        field: 'validStartDate', 
        minWidth: 150,
        editable: true,
        cellEditor: 'agDateCellEditor'
      },
      { 
        headerName: 'Valid End Date', 
        field: 'validEndDate', 
        minWidth: 150,
        editable: true,
        cellEditor: 'agDateCellEditor'
      }
    );
    
    // Add dynamic headers
    headers.forEach(header => {
      columnDefs.push({
        headerName: header,
        field: header,
        minWidth: 150,
        editable: true
      });
    });
    
    // Add delete button column if enabled
    if (enableDelete) {
      columnDefs.push({
        headerName: 'Actions',
        field: 'actions',
        minWidth: 100,
        editable: false,
        cellRenderer: 'deleteButtonRenderer',
        cellRendererParams: {
          resourceType: resourceType || 'georesource'
        }
      });
    }
    
    return columnDefs;
  }

  /**
   * Build row data for feature table
   */
  private buildFeatureTableRowData(features: any[]): any[] {
    if (!features || features.length === 0) {
      return [];
    }
    
    return features.map(feature => {
      if (feature.properties) {
        return {
          ...feature.properties,
          kommonitorGeometry: feature.geometry,
          kommonitorRecordId: feature.id
        };
      }
      return feature;
    });
  }

  /**
   * Register click handlers for feature table
   */
  registerFeatureTableClickHandlers(resourceId: string, resourceType: string, enableDelete: boolean): void {
    if (!enableDelete) return;
    
    // This would typically register delete button click handlers
    
  }

  /**
   * Delete button renderer for feature table
   */
  deleteButtonRenderer(params: any): string {
    const resourceType = params.colDef?.cellRendererParams?.resourceType || 'georesource';
    const recordId = params.data?.kommonitorRecordId || params.data?.ID;
    
    if (!recordId) {
      return '<div class="btn-group btn-group-sm">No ID</div>';
    }

    const deleteButtonId = `btn_${resourceType}_deleteFeature_${recordId}`;
    
    return `
      <div class="btn-group btn-group-sm">
        <button type="button" 
                class="btn btn-danger btn-sm ${resourceType}DeleteFeatureRecordBtn" 
                id="${deleteButtonId}"
                title="Delete Feature">
          <i class="fa fa-trash"></i>
        </button>
      </div>
    `;
  }
} 