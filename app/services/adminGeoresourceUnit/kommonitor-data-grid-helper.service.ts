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
    console.log('Registering click handlers for georesources...');
    
    // Edit Metadata Button
    const editMetadataButtons = document.querySelectorAll('.georesourceEditMetadataBtn');
    console.log('Found edit metadata buttons:', editMetadataButtons.length);
    editMetadataButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleEditMetadataClick);
      button.addEventListener('click', this.handleEditMetadataClick);
      console.log('Registered click handler for edit metadata button:', button.id);
    });

    // Edit Features Button
    const editFeaturesButtons = document.querySelectorAll('.georesourceEditFeaturesBtn');
    console.log('Found edit features buttons:', editFeaturesButtons.length);
    editFeaturesButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleEditFeaturesClick);
      button.addEventListener('click', this.handleEditFeaturesClick);
      console.log('Registered click handler for edit features button:', button.id);
    });

    // Edit User Roles Button
    const editUserRolesButtons = document.querySelectorAll('.georesourceEditUserRolesBtn');
    console.log('Found edit user roles buttons:', editFeaturesButtons.length);
    editUserRolesButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleEditUserRolesClick);
      button.addEventListener('click', this.handleEditUserRolesClick);
      console.log('Registered click handler for edit user roles button:', button.id);
    });

    // Delete Button
    const deleteButtons = document.querySelectorAll('.georesourceDeleteBtn');
    console.log('Found delete buttons:', deleteButtons.length);
    deleteButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleDeleteClick);
      button.addEventListener('click', this.handleDeleteClick);
      console.log('Registered click handler for delete button:', button.id);
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
          console.log('Registered click handler for specific edit metadata button:', editMetadataBtn.id);
        }
        if (editFeaturesBtn) {
          editFeaturesBtn.removeEventListener('click', this.handleEditFeaturesClick);
          editFeaturesBtn.addEventListener('click', this.handleEditFeaturesClick);
          console.log('Registered click handler for specific edit features button:', editFeaturesBtn.id);
        }
        if (editUserRolesBtn) {
          editUserRolesBtn.removeEventListener('click', this.handleEditUserRolesClick);
          editUserRolesBtn.addEventListener('click', this.handleEditUserRolesClick);
          console.log('Registered click handler for specific edit user roles button:', editUserRolesBtn.id);
        }
        if (deleteBtn) {
          deleteBtn.removeEventListener('click', this.handleDeleteClick);
          deleteBtn.addEventListener('click', this.handleDeleteClick);
          console.log('Registered click handler for specific delete button:', deleteBtn.id);
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
      console.log('Manually re-registering click handlers...');
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
      defaultColDef: {
        editable: false,
        sortable: true,
        filter: true,
        resizable: true
      },
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      pagination: true,
      paginationPageSize: 10
    };
  }

  /**
   * Build role management grid row data (like spatial unit service)
   */
  private buildRoleManagementGridRowData(accessControl: any[], permissionIds: string[]): any[] {
    // Flatten permissions into boolean fields for ag-Grid built-in checkbox renderer
    const data = JSON.parse(JSON.stringify(accessControl));
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
          if (permission.permissionLevel === 'viewer') {
            elem.viewer = permissionIds && permissionIds.includes(permission.permissionId);
          }
          if (permission.permissionLevel === 'editor') {
            elem.editor = permissionIds && permissionIds.includes(permission.permissionId);
          }
          if (permission.permissionLevel === 'creator') {
            elem.creator = permissionIds && permissionIds.includes(permission.permissionId);
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
        cellRenderer: 'agCheckboxCellRenderer',
        editable: true
      },
      { 
        headerName: 'Editieren', 
        field: 'editor', 
        filter: false, 
        sortable: false, 
        width: 100, 
        cellRenderer: 'agCheckboxCellRenderer',
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
        cellRenderer: 'agCheckboxCellRenderer',
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

    const selectedPermissionIds: string[] = [];
    
    for (const row of gridOptions.rowData) {
      if (row.viewer && row.viewerPermissionId) {
        selectedPermissionIds.push(row.viewerPermissionId);
      }
      if (row.editor && row.editorPermissionId) {
        selectedPermissionIds.push(row.editorPermissionId);
      }
      if (row.creator && row.creatorPermissionId) {
        selectedPermissionIds.push(row.creatorPermissionId);
      }
    }

    return selectedPermissionIds;
  }
} 