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

@Injectable({
  providedIn: 'root'
})
export class OgcDataGridHelperService {

  // Grid references
  private wmsGrid: AgGridAngular | null = null;

  // Component reference for callbacks
  private componentRef: any = null;

  constructor(
    private dataExchangeService: DataExchangeService
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
      
      // Register click handlers after a short delay
      setTimeout(() => {
        this.registerClickHandler_georesources(georesourcesArray);
      }, 200);
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
   * Register click handlers for georesource buttons
   */
  private registerClickHandler_georesources(georesourceMetadataArray: any[]): void {
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
  }

  /**
   * Simple function-based cell renderer for edit buttons (like original)
   */
  private displayEditButtons_WMSgeoresources = (params: any) => {
    if (!params.data || !params.data.id) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }

    const editMetadataButtonId = 'btn_georesource_editMetadata_' + params.data.id;
    const editUserRolesButtonId = 'btn_georesource_editUserRoles_' + params.data.id;
    const deleteButtonId = 'btn_georesource_deleteGeoresource_' + params.data.id;

    // Check user permissions (handle both array and potential undefined)
    const userPermissions = params.data.userPermissions || [];
    const hasEditorPermission = Array.isArray(userPermissions) ? 
      (userPermissions.includes("editor") || userPermissions.includes("creator")) : false;
    const hasCreatorPermission = Array.isArray(userPermissions) ? 
      userPermissions.includes("creator") : false;

    let html = '<div class="btn-group btn-group-sm">';
    html += '<button id="' + editMetadataButtonId + '" class="btn btn-warning btn-sm georesourceEditMetadataBtn" type="button" title="Metadaten editieren" ' + 
            (hasEditorPermission ? '' : 'disabled') + '><i class="fas fa-pencil-alt"></i></button>';
    html += '<button id="' + editUserRolesButtonId + '" class="btn btn-warning btn-sm georesourceEditUserRolesBtn" type="button" title="Zugriffsschutz und Eigentümerschaft editieren" ' + 
            (hasCreatorPermission ? '' : 'disabled') + '><i class="fas fa-user-lock"></i></button>';
    html += '<button id="' + deleteButtonId + '" class="btn btn-danger btn-sm georesourceDeleteBtn" type="button" title="Georessource entfernen" ' + 
            (hasCreatorPermission ? '' : 'disabled') + '><i class="fas fa-trash"></i></button>';
    html += '</div>';

    return html;
  }

  /**
   * Handle edit metadata button click
   */
  private handleEditMetadataClick = (event: any): void => {
    event.stopPropagation();
    
    const georesourceId = event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata = this.dataExchangeService.getGeoresourceMetadataById(georesourceId);
    
    if (this.componentRef) {
      this.componentRef.onClickEditMetadata(georesourceMetadata);
    }
  }

  /**
   * Handle edit features button click
   */
  private handleEditFeaturesClick = (event: any): void => {
    event.stopPropagation();
    
    const georesourceId = event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata = this.dataExchangeService.getGeoresourceMetadataById(georesourceId);
    
    if (this.componentRef) {
      this.componentRef.onClickEditFeatures(georesourceMetadata);
    }
  }

  /**
   * Handle edit user roles button click
   */
  private handleEditUserRolesClick = (event: any): void => {
    event.stopPropagation();
    
    const georesourceId = event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata = this.dataExchangeService.getGeoresourceMetadataById(georesourceId);
    
    if (this.componentRef) {
      this.componentRef.onClickEditUserRoles(georesourceMetadata);
    }
  }

  /**
   * Handle delete button click
   */
  private handleDeleteClick = (event: any): void => {
    event.stopPropagation();
    
    const georesourceId = event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata = this.dataExchangeService.getGeoresourceMetadataById(georesourceId);
    
    if (this.componentRef) {
      this.componentRef.onClickDeleteGeoresource(georesourceMetadata);
    }
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
          return `<img src="${params.data.url}service=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${params.data.layerName}">`;
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
}
