import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';

// Declare environment variables
declare const __env: any;

/** Kinds of feature-table events the grid helper emits to its owning modal. */
export type FeatureTableEventType = 'loadingStart' | 'loadingEnd' | 'featureDeleted';

/**
 * Event emitted by the shared feature-table grid helper towards the
 * edit-features modal that owns the grid. `resourceType` discriminates which
 * modal (spatialUnit / georesource / indicator) the event belongs to; the id
 * fields are only populated for `featureDeleted`.
 */
export interface FeatureTableEvent {
  resourceType: string;
  type: FeatureTableEventType;
  datasetId?: string;
  spatialUnitId?: string;
  featureId?: string;
  recordId?: string;
}

/**
 * Feature-table grid logic extracted from KommonitorDataGridHelperService
 * (Prio 7 / A2 — see documentation/PRIO7_GOD_SERVICE_SPLIT.md). Owns the editable
 * feature table used in the spatial-unit / georesource / indicator edit-features modals,
 * including its grid construction, click/delete handlers (HTTP DELETE), inline cell
 * editing (HTTP PUT) and the per-resource update timestamps.
 */
@Injectable({
  providedIn: 'root',
})
export class FeatureTableDataGridHelperService {
  // Store the data grid options
  private dataGridOptions_featureTable: GridOptions | null = null;
  private gridApi_featureTable: GridApi | null = null;

  // Store current resource ID for delete handlers
  private currentResourceId: string | undefined;

  // Store current spatial unit ID for indicator delete/edit handlers
  private currentSpatialUnitId: string | undefined;

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

  private kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  private http = inject(HttpClient);

  private readonly featureTableEvents = new Subject<FeatureTableEvent>();
  /** Loading/delete events for the feature table, discriminated by resourceType. */
  readonly featureTableEvents$: Observable<FeatureTableEvent> =
    this.featureTableEvents.asObservable();

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
      return this.buildFeatureTableGridOptions(
        headers,
        features,
        resourceId,
        resourceType,
        enableDelete
      );
    }

    if (
      this.dataGridOptions_featureTable &&
      this.gridApi_featureTable &&
      gridContainer.childElementCount > 0
    ) {
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
   * Measure the tallest rendered header text so multi-line column titles are not
   * clipped. Mirrors the role-management grid helper.
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
   * Apply the measured header height to the feature-table grid. Guards on the grid
   * API since this runs from grid callbacks (onFirstDataRendered / onColumnResized).
   */
  private headerHeightSetter(): void {
    if (this.gridApi_featureTable) {
      this.gridApi_featureTable.setHeaderHeight(this.headerHeightGetter());
    }
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
          'padding-bottom': '17px',
        },
        onCellValueChanged: (newValueParams: any) => {
          // Handle cell value changes for date validation and API updates
          this.handleCellValueChanged(newValueParams, resourceId, resourceType);
        },
      },
      components: {
        deleteButtonRenderer: this.deleteButtonRenderer.bind(this),
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
        this.headerHeightSetter();
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
      },
    };

    return gridOptions;
  }

  /**
   * Build column configuration for feature table
   */
  private buildFeatureTableColumnConfig(
    headers: string[],
    enableDelete: boolean,
    resourceType?: string
  ): any[] {
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
            html +=
              `<button id="btn__spatialUnit__deleteFeatureEntry__${datasetId}__${featureId}__${recordId}" ` +
              `class="btn btn-danger btn-sm spatialUnitDeleteFeatureRecordBtn" type="button" ` +
              `title="Datenobjekt unwiderruflich entfernen" ${enableDelete ? '' : 'disabled'}>` +
              `<i class="fas fa-trash"></i></button>`;
          } else {
            html +=
              `<button id="btn__georesource__deleteFeatureEntry__${datasetId}__${featureId}__${recordId}" ` +
              `class="btn btn-danger btn-sm georesourceDeleteFeatureRecordBtn" type="button" ` +
              `title="Datenobjekt unwiderruflich entfernen" ${enableDelete ? '' : 'disabled'}>` +
              `<i class="fas fa-trash"></i></button>`;
          }
          html += '<br/>';
        }

        // Add the record ID
        html += params.data.kommonitorRecordId || params.data.id || '';

        return html;
      },
    });

    // Add Feature-Id column
    columnDefs.push({
      headerName: 'Feature-Id',
      field: 'ID',
      pinned: 'left',
      editable: false,
      cellClass: 'grid-non-editable',
      maxWidth: 125,
    });

    // Add Name column
    columnDefs.push({
      headerName: 'Name',
      field: 'NAME',
      pinned: 'left',
      minWidth: 150,
    });

    // Add validity date columns
    columnDefs.push({
      headerName: 'Lebenszeitbeginn',
      field: 'validStartDate',
      minWidth: 150,
    });

    columnDefs.push({
      headerName: 'Lebenszeitende',
      field: 'validEndDate',
      minWidth: 150,
    });

    // Add dynamic headers
    for (const header of headers) {
      columnDefs.push({
        headerName: header,
        field: header,
        minWidth: 125,
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

    return features.map((feature) => {
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
    const featureId =
      params.data.properties?.[__env?.FEATURE_ID_PROPERTY_NAME] ||
      params.data[__env?.FEATURE_ID_PROPERTY_NAME] ||
      '';
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
  registerFeatureTableClickHandlers(
    resourceId?: string,
    resourceType?: string,
    enableDelete?: boolean
  ): void {
    if (!enableDelete) return;

    setTimeout(() => {
      // Remove existing handlers to prevent duplicates
      const deleteButtons = document.querySelectorAll(
        '.spatialUnitDeleteFeatureRecordBtn, .georesourceDeleteFeatureRecordBtn'
      );
      deleteButtons.forEach((button) => {
        button.removeEventListener('click', this.handleFeatureDeleteClick);
      });

      // Add new handlers
      deleteButtons.forEach((button) => {
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

    // Signal loading start to the owning modal
    this.featureTableEvents.next({ resourceType, type: 'loadingStart' });

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
      next: () => {
        // Update timestamps
        if (resourceType === 'georesource') {
          this.featureTable_georesource_lastUpdate_timestamp_success = this.getCurrentTimestamp();
        } else {
          this.featureTable_spatialUnit_lastUpdate_timestamp_success = this.getCurrentTimestamp();
        }

        // Signal the deletion to the owning modal
        this.featureTableEvents.next({
          resourceType,
          type: 'featureDeleted',
          datasetId,
          featureId,
          recordId,
        });
      },
      error: () => {
        // Signal loading end to the owning modal
        this.featureTableEvents.next({ resourceType, type: 'loadingEnd' });

        // Update failure timestamps
        if (resourceType === 'georesource') {
          this.featureTable_georesource_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
        } else {
          this.featureTable_spatialUnit_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
        }
      },
    });
  };

  /**
   * Get current timestamp
   */
  private getCurrentTimestamp(): Date {
    return new Date();
  }

  /**
   * Save grid state for feature table
   */
  private saveGridStore_featureTable(gridOptions: any): void {
    if (gridOptions && this.gridApi_featureTable) {
      const selectedNodes = this.gridApi_featureTable.getSelectedNodes();
      gridOptions._savedState = {
        selectedIds: selectedNodes.map((node: any) => {
          const featureId =
            node.data.properties?.[__env?.FEATURE_ID_PROPERTY_NAME] ||
            node.data[__env?.FEATURE_ID_PROPERTY_NAME] ||
            '';
          return featureId;
        }),
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
          const featureId =
            node.data.properties?.[__env?.FEATURE_ID_PROPERTY_NAME] ||
            node.data[__env?.FEATURE_ID_PROPERTY_NAME] ||
            '';
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
   * Get current feature table grid options
   */
  getFeatureTableGridOptions(): GridOptions | null {
    return this.dataGridOptions_featureTable;
  }

  /**
   * Handle cell value changes for feature table
   */
  private handleCellValueChanged(
    newValueParams: any,
    resourceId?: string,
    resourceType?: string
  ): void {
    // Validate date properties
    if (!newValueParams.data.validStartDate) {
      newValueParams.data.validStartDate = newValueParams.oldValue;
    }

    const isDate = (date: any) => {
      const dateObj = new Date(date);
      return dateObj.toString() !== 'Invalid Date' && !isNaN(dateObj.getTime());
    };

    if (!isDate(newValueParams.data.validStartDate)) {
      newValueParams.data.validStartDate = newValueParams.oldValue;
    }

    if (newValueParams.data.validEndDate === '') {
      newValueParams.data.validEndDate = undefined;
    }

    if (newValueParams.data.validEndDate) {
      if (!isDate(newValueParams.data.validEndDate)) {
        newValueParams.data.validEndDate = newValueParams.oldValue;
      }
    }

    // Build GeoJSON for API request
    const geoJSON: any = {
      type: 'Feature',
      geometry: null,
      properties: null,
      id: null,
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
      url += '/georesources/';
    } else {
      url += '/spatial-units/';
    }

    url += `${resourceId}/singleFeature/${newValueParams.data.ID}/singleFeatureRecord/${newValueParams.data.kommonitorRecordId}`;

    // Make HTTP PUT request
    this.http
      .put(url, geoJSON, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .subscribe({
        next: () => {
          // On success: mark grid cell with green background
          newValueParams.colDef.cellStyle = (p: any) =>
            p.rowIndex.toString() === newValueParams.node.id
              ? { 'background-color': '#9DC89F' }
              : '';

          newValueParams.api.refreshCells({
            force: true,
            columns: [newValueParams.column.getId()],
            rowNodes: [newValueParams.node],
          });

          // Update success timestamp
          if (resourceType === this.resourceType_georesource) {
            this.featureTable_georesource_lastUpdate_timestamp_success = this.getCurrentTimestamp();
          } else {
            this.featureTable_spatialUnit_lastUpdate_timestamp_success = this.getCurrentTimestamp();
          }
        },
        error: () => {
          // Reset cell value as an error occurred
          newValueParams.data[newValueParams.column.colId] = newValueParams.oldValue;

          // On failure: mark grid cell with red background
          newValueParams.colDef.cellStyle = (p: any) =>
            p.rowIndex.toString() === newValueParams.node.id
              ? { 'background-color': '#E79595' }
              : '';

          newValueParams.api.refreshCells({
            force: true,
            columns: [newValueParams.column.getId()],
            rowNodes: [newValueParams.node],
          });

          // Update failure timestamp
          if (resourceType === this.resourceType_georesource) {
            this.featureTable_georesource_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
          } else {
            this.featureTable_spatialUnit_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
          }
        },
      });
  }

  /**
   * Build feature table data grid for indicator resources.
   * @param spatialUnitId - target spatial unit the indicator timeseries belongs to
   */
  buildDataGrid_featureTable_indicatorResource(
    tableId: string,
    headers: string[],
    features: any[] = [],
    resourceId?: string,
    resourceType?: string,
    enableDelete: boolean = false,
    spatialUnitId?: string
  ): GridOptions {
    this.currentResourceId = resourceId;
    this.currentSpatialUnitId = spatialUnitId;

    const gridContainer = document.querySelector('#' + tableId);
    if (!gridContainer) {
      return this.buildIndicatorFeatureTableGridOptions(
        headers,
        features,
        resourceId,
        resourceType,
        enableDelete,
        spatialUnitId
      );
    }

    if (
      this.dataGridOptions_featureTable &&
      this.gridApi_featureTable &&
      gridContainer.childElementCount > 0
    ) {
      const newRowData = this.buildIndicatorFeatureTableRowData(features);
      this.gridApi_featureTable.setRowData(newRowData);
    } else {
      this.dataGridOptions_featureTable = this.buildIndicatorFeatureTableGridOptions(
        headers,
        features,
        resourceId,
        resourceType,
        enableDelete,
        spatialUnitId
      );
    }

    return this.dataGridOptions_featureTable!;
  }

  private buildIndicatorFeatureTableGridOptions(
    headers: string[],
    features: any[],
    resourceId?: string,
    resourceType?: string,
    enableDelete: boolean = false,
    spatialUnitId?: string
  ): any {
    const columnDefs = this.buildIndicatorFeatureTableColumnConfig(
      headers,
      enableDelete,
      resourceId,
      spatialUnitId
    );
    const rowData = this.buildIndicatorFeatureTableRowData(features);

    return {
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
          'padding-bottom': '17px',
        },
        onCellValueChanged: (newValueParams: any) => {
          this.handleIndicatorCellValueChanged(newValueParams, resourceId, spatialUnitId);
        },
      },
      columnDefs: columnDefs,
      rowData: rowData,
      undoRedoCellEditing: true,
      undoRedoCellEditingLimit: 10,
      enableCellChangeFlash: true,
      suppressRowClickSelection: true,
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 20,
      paginationPageSizeSelector: [10, 20, 50, 100],
      suppressColumnVirtualisation: true,
      onFirstDataRendered: () => {
        this.registerIndicatorFeatureTableClickHandlers(resourceType, enableDelete);
        this.headerHeightSetter();
      },
      onColumnResized: () => {
        this.headerHeightSetter();
      },
      onGridReady: (params: GridReadyEvent) => {
        this.gridApi_featureTable = params.api;
      },
      onRowDataChanged: () => {
        this.registerIndicatorFeatureTableClickHandlers(resourceType, enableDelete);
      },
      onModelUpdated: () => {
        this.registerIndicatorFeatureTableClickHandlers(resourceType, enableDelete);
      },
      onViewportChanged: () => {
        this.registerIndicatorFeatureTableClickHandlers(resourceType, enableDelete);
      },
    };
  }

  private buildIndicatorFeatureTableColumnConfig(
    headers: string[],
    enableDelete: boolean,
    datasetId?: string,
    spatialUnitId?: string
  ): any[] {
    const columnDefs: any[] = [
      {
        headerName: 'DB-Record-Id',
        field: 'fid',
        pinned: 'left',
        editable: false,
        cellClass: 'grid-non-editable',
        maxWidth: 125,
        cellRenderer: (params: any) => {
          const featureId = params.data[__env.FEATURE_ID_PROPERTY_NAME] || '';
          let html =
            `<button id="btn__indicator__deleteFeatureEntry__${datasetId}__${spatialUnitId}__${featureId}__${params.data.fid}" ` +
            `class="btn btn-danger btn-sm indicatorDeleteFeatureRecordBtn" type="button" ` +
            `title="Datenobjekt unwiderruflich entfernen" ${enableDelete ? '' : 'disabled'}>` +
            `<i class="fas fa-trash"></i></button>`;
          html += '&nbsp;&nbsp;';
          html += params.data.fid ?? '';
          return html;
        },
      },
      {
        headerName: 'Feature-Id',
        field: __env.FEATURE_ID_PROPERTY_NAME,
        pinned: 'left',
        editable: false,
        cellClass: 'grid-non-editable',
        maxWidth: 125,
      },
      {
        headerName: 'Name',
        field: __env.FEATURE_NAME_PROPERTY_NAME,
        pinned: 'left',
        minWidth: 200,
        editable: false,
        cellClass: 'grid-non-editable',
      },
      {
        headerName: 'Lebenszeitbeginn',
        field: __env.VALID_START_DATE_PROPERTY_NAME,
        minWidth: 125,
        editable: false,
        cellClass: 'grid-non-editable',
      },
      {
        headerName: 'Lebenszeitende',
        field: __env.VALID_END_DATE_PROPERTY_NAME,
        minWidth: 125,
        editable: false,
        cellClass: 'grid-non-editable',
      },
    ];

    // Date-keyed value columns are the only editable ones
    for (const header of headers) {
      columnDefs.push({ headerName: '' + header, field: '' + header, minWidth: 125 });
    }

    return columnDefs;
  }

  private buildIndicatorFeatureTableRowData(features: any[]): any[] {
    if (!features || !Array.isArray(features)) {
      return [];
    }
    return features.map((dataItem) => {
      // arisenFrom is currently never used
      delete dataItem.arisenFrom;
      return dataItem;
    });
  }

  private registerIndicatorFeatureTableClickHandlers(
    resourceType?: string,
    enableDelete?: boolean
  ): void {
    if (!enableDelete) return;

    setTimeout(() => {
      const deleteButtons = document.querySelectorAll('.indicatorDeleteFeatureRecordBtn');
      deleteButtons.forEach((button) => {
        button.removeEventListener('click', this.handleIndicatorFeatureDeleteClick);
        button.addEventListener('click', this.handleIndicatorFeatureDeleteClick);
      });
    }, 100);
  }

  private handleIndicatorFeatureDeleteClick = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const button = event.target as HTMLElement;
    const buttonElement = button.closest('button') || button;

    // id: btn__indicator__deleteFeatureEntry__{datasetId}__{spatialUnitId}__{featureId}__{recordId}
    const idParts = buttonElement.id.split('__');
    if (idParts.length < 7) {
      return;
    }

    const resourceType = idParts[1]; // 'indicator'
    const datasetId = idParts[3];
    const spatialUnitId = idParts[4];
    const featureId = idParts[5];
    const recordId = idParts[6];

    this.featureTableEvents.next({ resourceType, type: 'loadingStart' });

    const url =
      `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}` +
      `/indicators/${datasetId}/${spatialUnitId}/singleFeature/${featureId}/singleFeatureRecord/${recordId}`;

    this.http.delete(url).subscribe({
      next: () => {
        this.featureTable_indicator_lastUpdate_timestamp_success = this.getCurrentTimestamp();
        this.featureTableEvents.next({
          resourceType,
          type: 'featureDeleted',
          datasetId,
          spatialUnitId,
          featureId,
          recordId,
        });
      },
      error: () => {
        this.featureTableEvents.next({ resourceType, type: 'loadingEnd' });
        this.featureTable_indicator_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
      },
    });
  };

  private handleIndicatorCellValueChanged(
    newValueParams: any,
    datasetId?: string,
    spatialUnitId?: string
  ): void {
    // Only the indicator's feature id, the DB record id (fid) and the date-prefixed
    // value columns are sent on update.
    const json: any = JSON.parse(JSON.stringify(newValueParams.data));
    const allowedProperties = [__env.FEATURE_ID_PROPERTY_NAME, 'fid'];

    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        if (!key.includes(__env.indicatorDatePrefix) && !allowedProperties.includes(key)) {
          delete json[key];
        }
      }
    }
    delete json[__env.VALID_START_DATE_PROPERTY_NAME];
    delete json[__env.VALID_END_DATE_PROPERTY_NAME];
    delete json[__env.FEATURE_NAME_PROPERTY_NAME];

    // Empty value cells are transmitted as null
    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        if (key.includes(__env.indicatorDatePrefix) && json[key] === '') {
          json[key] = null;
        }
      }
    }

    const url =
      `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}` +
      `/indicators/${datasetId}/${spatialUnitId}/singleFeature/` +
      `${newValueParams.data[__env.FEATURE_ID_PROPERTY_NAME]}/singleFeatureRecord/${newValueParams.data.fid}`;

    this.http
      .put(url, json, {
        headers: { 'Content-Type': 'application/json' },
      })
      .subscribe({
        next: () => {
          newValueParams.colDef.cellStyle = (p: any) =>
            p.rowIndex.toString() === newValueParams.node.id
              ? { 'background-color': '#9DC89F' }
              : '';
          newValueParams.api.refreshCells({
            force: true,
            columns: [newValueParams.column.getId()],
            rowNodes: [newValueParams.node],
          });
          this.featureTable_indicator_lastUpdate_timestamp_success = this.getCurrentTimestamp();
        },
        error: () => {
          newValueParams.data[newValueParams.column.colId] = newValueParams.oldValue;
          newValueParams.colDef.cellStyle = (p: any) =>
            p.rowIndex.toString() === newValueParams.node.id
              ? { 'background-color': '#E79595' }
              : '';
          newValueParams.api.refreshCells({
            force: true,
            columns: [newValueParams.column.getId()],
            rowNodes: [newValueParams.node],
          });
          this.featureTable_indicator_lastUpdate_timestamp_failure = this.getCurrentTimestamp();
        },
      });
  }
}
