import { Injectable } from '@angular/core';
import { BroadcastService } from '../broadcast-service/broadcast.service';
import { KommonitorDataExchangeService } from './kommonitor-data-exchange.service';
import { 
  GridOptions, 
  ColDef, 
  GridApi, 
  GridReadyEvent
} from 'ag-grid-community';
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
    private broadcastService: BroadcastService,
    private kommonitorDataExchangeService: KommonitorDataExchangeService,
    private http: HttpClient
  ) {}

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
        this.registerFeatureTableClickHandlers(resourceId, resourceType, enableDelete);
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
      
      return;
    }

    // Make DELETE request
    this.http.delete(url).subscribe({
      next: (response: any) => {
        
        
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