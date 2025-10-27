import { Injectable, Inject } from '@angular/core';
import { ColDef, GridOptions, ICellRendererParams, GridApi, ColumnApi, GridReadyEvent } from 'ag-grid-community';
import { KommonitorIndicatorDataExchangeService } from './kommonitor-data-exchange.service';
import { BroadcastService } from '../broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

declare const MathJax: any;

@Injectable({
  providedIn: 'root'
})
export class KommonitorIndicatorDataGridHelperService {

  // Grid references
  private gridApi: GridApi | null = null;
  private columnApi: ColumnApi | null = null;

  // Observable for grid events
  private gridReadySubject = new Subject<GridReadyEvent>();
  public gridReady$ = this.gridReadySubject.asObservable();

  // Resource type constants
  readonly resourceType_georesource = "georesource";
  readonly resourceType_spatialUnit = "spatialUnit";
  readonly resourceType_indicator = "indicator";

  // Timestamp properties for feature table updates
  featureTable_spatialUnit_lastUpdate_timestamp_success: string | undefined = undefined;
  featureTable_spatialUnit_lastUpdate_timestamp_failure: string | undefined = undefined;
  featureTable_georesource_lastUpdate_timestamp_success: string | undefined = undefined;
  featureTable_georesource_lastUpdate_timestamp_failure: string | undefined = undefined;
  featureTable_indicator_lastUpdate_timestamp_success: string | undefined = undefined;
  featureTable_indicator_lastUpdate_timestamp_failure: string | undefined = undefined;

  constructor(
    private kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private broadcastService: BroadcastService,
    private http: HttpClient
  ) {}

  /**
   * Builds data grid for indicators - returns column definitions and row data for AG Grid Angular
   */
  buildDataGrid_indicators(indicatorMetadataArray: any[]): GridOptions {
    return this.buildDataGridOptions_indicators(indicatorMetadataArray);
  }

  /**
   * Builds complete grid options for indicators (matches AngularJS implementation)
   */
  buildDataGridOptions_indicators(indicatorMetadataArray: any[]): GridOptions {
    const columnDefs = this.buildDataGridColumnConfig_indicators(indicatorMetadataArray);
    const rowData = this.buildDataGridRowData_indicators(indicatorMetadataArray);

    return {
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
      columnDefs: columnDefs,
      rowData: rowData,
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      onGridReady: () => {
        // Grid ready logic - equivalent to AngularJS onGridReady
      },
      onFirstDataRendered: () => {
        // Header height setter logic - equivalent to AngularJS onFirstDataRendered
        if (this.gridApi) {
          this.headerHeightSetter({ api: this.gridApi } as any);
        }
      },
      onColumnResized: () => {
        // Header height setter logic - equivalent to AngularJS onColumnResized
        if (this.gridApi) {
          this.headerHeightSetter({ api: this.gridApi } as any);
        }
      },
      onModelUpdated: () => {
        // Register click handlers - equivalent to AngularJS onModelUpdated
        this.registerClickHandler_indicators(indicatorMetadataArray);
      },
      onViewportChanged: () => {
        // Register click handlers and MathJax typesetting - equivalent to AngularJS onViewportChanged
        this.registerClickHandler_indicators(indicatorMetadataArray);
        
        // MathJax typesetting (equivalent to AngularJS implementation)
        setTimeout(() => {
          if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise().then(() => {
              // MathJax rendering complete
            });
          }
        }, 250);
      },
    };
  }

  /**
   * Builds column configuration for indicators
   */
  buildDataGridColumnConfig_indicators(indicatorMetadataArray: any[]): ColDef[] {
    const columnDefs: ColDef[] = [
      { 
        headerName: 'Editierfunktionen', 
        pinned: 'left', 
        maxWidth: 150, 
        checkboxSelection: false, 
        filter: false, 
        sortable: false, 
        cellRenderer: (params: ICellRendererParams) => this.displayEditButtons_indicators(params)
      },
      { headerName: 'Id', field: "indicatorId", pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: "indicatorName", pinned: 'left', minWidth: 300 },
      { headerName: 'Einheit', field: "unit", minWidth: 200 },
      { 
        headerName: 'Beschreibung', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => { 
          return params.data?.metadata?.description || ''; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return params.data?.metadata?.description || '';
        }
      },
      {
        headerName: 'Methodik', 
        minWidth: 400,
        cellRenderer: (params: ICellRendererParams) => {
          if(params.data?.processDescription && params.data.processDescription.includes("$$")){
            let splitArray = params.data.processDescription.split("$$");
            for (let index = 0; index < splitArray.length; index++) {
              if((index % 2) == 0){
                params.data.processDescription += "<br/>";
              }                  
            }                
          }
          return params.data?.processDescription || '';
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return params.data?.processDescription || '';
        }
      },
      {
        headerName: 'Verfügbare Raumebenen', 
        field: "applicableSpatialUnits", 
        minWidth: 400,
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.data?.applicableSpatialUnits) return '';
          
          let html = '<ul style="columns: 2; -webkit-columns: 2; -moz-columns: 2; word-break: break-word !important;">';
          for (const applicableSpatialUnit of params.data.applicableSpatialUnits) {
            html += '<li style="margin-right: 15px;">';
            html += applicableSpatialUnit.spatialUnitName;
            html += '</li>';
          }
          html += '</ul>';
          return html;
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          if (params.data?.applicableSpatialUnits && params.data.applicableSpatialUnits.length > 1){
            return JSON.stringify(params.data.applicableSpatialUnits);
          }
          return params.data?.applicableSpatialUnits || '';
        }
      },
      {
        headerName: 'Verfügbare Zeitschnitte', 
        field: "applicableDates", 
        minWidth: 400,
        cellRenderer: (params: ICellRendererParams) => {
          if (!params.data?.applicableDates) return '';
          
          let html = '<ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; word-break: break-word !important;">';
          for (const timestamp of params.data.applicableDates) {
            html += '<li style="margin-right: 15px;">';
            html += timestamp;
            html += '</li>';
          }
          html += '</ul>';
          return html;
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          if (params.data?.applicableDates && params.data.applicableDates.length > 1){
            return JSON.stringify(params.data.applicableDates);
          }
          return params.data?.applicableDates || '';
        }
      },
      { headerName: 'Kürzel', field: "abbreviation" },
      { headerName: 'Leitindikator', field: "isHeadlineIndicator" },
      { 
        headerName: 'Indikator-Typ', 
        minWidth: 200, 
        cellRenderer: (params: ICellRendererParams) => { 
          return this.getIndicatorStringFromIndicatorType(params.data?.indicatorType); 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return this.getIndicatorStringFromIndicatorType(params.data?.indicatorType);
        } 
      },
      { headerName: 'Merkmal', field: "characteristicValue", minWidth: 200 },
      { headerName: 'Art der Fortführung', field: "creationType", minWidth: 200 },
      { headerName: 'Tags/Stichworte', field: "tags", minWidth: 250 },
      { 
        headerName: 'Themenhierarchie', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => { 
          return this.getTopicHierarchyDisplayString(params.data?.topicReference); 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return this.getTopicHierarchyDisplayString(params.data?.topicReference);
        }
      },
      { 
        headerName: 'Datenquelle', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => { 
          return params.data?.metadata?.datasource || ''; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return params.data?.metadata?.datasource || '';
        }
      },
      { 
        headerName: 'Datenhalter und Kontakt', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => { 
          return params.data?.metadata?.contact || ''; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return params.data?.metadata?.contact || '';
        }
      },
      { 
        headerName: 'Rollen', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => { 
          return this.getAllowedRolesString(params.data?.permissions); 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return this.getAllowedRolesString(params.data?.permissions);
        } 
      },
      { 
        headerName: 'Öffentlich sichtbar', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => { 
          return params.data?.isPublic ? 'ja' : 'nein'; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return params.data?.isPublic ? 'ja' : 'nein';
        } 
      },
      { 
        headerName: 'Eigentümer', 
        minWidth: 400, 
        cellRenderer: (params: ICellRendererParams) => { 
          return this.getRoleTitle(params.data?.ownerId); 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return this.getRoleTitle(params.data?.ownerId);
        } 
      },
      { 
        headerName: 'Nachkommastellen', 
        minWidth: 200, 
        cellRenderer: (params: ICellRendererParams) => { 
          return params.data?.precision || ''; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return params.data?.precision || '';
        } 
      }
    ];

    return columnDefs;
  }

  /**
   * Builds row data for indicators
   */
  buildDataGridRowData_indicators(indicatorMetadataArray: any[]): any[] {
    return indicatorMetadataArray;
  }

  /**
   * Display edit buttons component for indicators
   */
  displayEditButtons_indicators = (params: ICellRendererParams): string => {
    // Safety check for data
    if (!params.data || !params.data.indicatorId) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }
    
    let disabledEditButtons = !(params.data.userPermissions && Array.isArray(params.data.userPermissions) && params.data.userPermissions.includes("editor"));
    let editMetadataButtonId = 'btn_indicator_editMetadata_' + params.data.indicatorId;
    let editFeaturesButtonId = 'btn_indicator_editFeatures_' + params.data.indicatorId;

    let html = '<div class="btn-group btn-group-sm">';
    html += '<button id="' + editMetadataButtonId + '" class="btn btn-warning btn-sm indicatorEditMetadataBtn disabled" type="button" title="Metadaten editieren" disabled><i class="fas fa-pencil-alt"></i></button>';
    html += '<button id="' + editFeaturesButtonId + '" class="btn btn-warning btn-sm indicatorEditFeaturesBtn disabled" type="button" title="Features fortf&uuml;hren" disabled><i class="fas fa-draw-polygon"></i></button>';
    
    if(!disabledEditButtons){
      html = html.replaceAll("disabled", ""); // enabled
    }
    
    if (this.kommonitorDataExchangeService.enableKeycloakSecurity) {
      let disabled = !(params.data.userPermissions && Array.isArray(params.data.userPermissions) && params.data.userPermissions.includes("creator"));
      html += '<button id="btn_indicator_editRoleBasedAccess_' + params.data.indicatorId + '"class="btn btn-warning btn-sm indicatorEditRoleBasedAccessBtn ';

      if (disabled) {
        html += 'disabled" disabled';
      }

      html += ' type="button" title="Zugriffsschutz und Eigentümerschaft editieren"><i class="fas fa-user-lock"></i></button>';
    }
    html += '</div>';

    return html;
  };

  /**
   * Registers click handlers for indicator buttons (complete implementation)
   * This method handles all indicator button click events
   */
  registerClickHandler_indicators(indicatorMetadataArray: any[]): void {
    // Register edit metadata button click handlers
    setTimeout(() => {
      const editMetadataButtons = document.querySelectorAll('.indicatorEditMetadataBtn');
      editMetadataButtons.forEach(button => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          const buttonId = (button as HTMLElement).id;
          const indicatorId = buttonId.split('_')[3];
          
          const indicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);
          
          // Broadcast edit metadata event
          this.broadcastService.broadcast('onEditIndicatorMetadata', indicatorMetadata);
        });
      });

      // Register edit features button click handlers
      const editFeaturesButtons = document.querySelectorAll('.indicatorEditFeaturesBtn');
      editFeaturesButtons.forEach(button => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          const buttonId = (button as HTMLElement).id;
          const indicatorId = buttonId.split('_')[3];
          
          const indicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);
          
          // Broadcast edit features event
          this.broadcastService.broadcast('onEditIndicatorFeatures', indicatorMetadata);
        });
      });

      // Register edit role based access button click handlers
      const editRoleButtons = document.querySelectorAll('.indicatorEditRoleBasedAccessBtn');
      editRoleButtons.forEach(button => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          const buttonId = (button as HTMLElement).id;
          const indicatorId = buttonId.split('_')[3];
          
          const indicatorMetadata = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);
          
          // Broadcast edit role based access event
          this.broadcastService.broadcast('onEditIndicatorSpatialUnitRoles', indicatorMetadata);
        });
      });
    }, 100);
  }

  /**
   * Set grid API references
   */
  setGridApi(gridApi: GridApi, columnApi: ColumnApi): void {
    this.gridApi = gridApi;
    this.columnApi = columnApi;
  }

  /**
   * Get grid API
   */
  getGridApi(): GridApi | null {
    return this.gridApi;
  }

  /**
   * Get column API
   */
  getColumnApi(): ColumnApi | null {
    return this.columnApi;
  }

  /**
   * Get current timestamp string (matches AngularJS implementation)
   */
  private getCurrentTimestampString(): string {
    const date = new Date();
    let hours = date.getHours();
    if (hours < 10) {
      hours = 0 + hours;
    }
    let minutes = date.getMinutes();
    if (minutes < 10) {
      minutes = 0 + minutes;
    }
    let seconds = date.getSeconds();
    if (seconds < 10) {
      seconds = 0 + seconds;
    }
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Header height getter utility function
   */
  private headerHeightGetter(): number {
    const columnHeaderTexts = Array.from(document.querySelectorAll('.ag-header-cell-text'));
    const clientHeights = columnHeaderTexts.map(
      (headerText: any) => headerText.clientHeight
    );
    const tallestHeaderTextHeight = Math.max(...clientHeights);

    return tallestHeaderTextHeight;
  }

  /**
   * Header height setter utility function
   */
  private headerHeightSetter(gridOptions: GridOptions): void {
    if (gridOptions.api) {
      const padding = 20;
      const height = this.headerHeightGetter() + padding;
      (gridOptions.api as any).setHeaderHeight(height);
    }
  }

  /**
   * Save grid store (filters, sorting, etc.)
   */
  private saveGridStore(gridOptions: GridOptions): void {
    if (gridOptions.columnApi && gridOptions.api) {
      (window as any).colState = (gridOptions.columnApi as any).getColumnState();
      (window as any).filterState = (gridOptions.api as any).getFilterModel();
    }
  }

  /**
   * Restore grid store (filters, sorting, etc.)
   */
  private restoreGridStore(gridOptions: GridOptions): void {
    if (gridOptions.columnApi && gridOptions.api) {
      if ((window as any).colState) {
        (gridOptions.columnApi as any).applyColumnState({ 
          state: (window as any).colState, 
          applyOrder: true 
        });
      }

      if ((window as any).filterState) {
        (gridOptions.api as any).setFilterModel((window as any).filterState);
      }
    }
  }

  /**
   * Broadcast event for Angular component communication
   */
  // Removed broadcastEvent method as it's no longer needed with direct approach

  /**
   * Get indicator string from indicator type
   */
  private getIndicatorStringFromIndicatorType(indicatorType: any): string {
    if (!indicatorType) return '';
    
    // Map indicator types to display strings
    const typeMap: { [key: string]: string } = {
      'headline': 'Leitindikator',
      'base': 'Basisindikator',
      'computed': 'Berechneter Indikator'
    };
    
    return typeMap[indicatorType] || indicatorType;
  }

  /**
   * Get topic hierarchy display string
   */
  private getTopicHierarchyDisplayString(topicReference: any): string {
    if (!topicReference) return '';
    
    // Build topic hierarchy string
    let hierarchy = '';
    if (topicReference.mainTopic) {
      hierarchy += topicReference.mainTopic;
    }
    if (topicReference.subTopic) {
      hierarchy += ' > ' + topicReference.subTopic;
    }
    if (topicReference.subsubTopic) {
      hierarchy += ' > ' + topicReference.subsubTopic;
    }
    if (topicReference.subsubsubTopic) {
      hierarchy += ' > ' + topicReference.subsubsubTopic;
    }
    
    return hierarchy;
  }

  /**
   * Get allowed roles string
   */
  private getAllowedRolesString(permissions: any): string {
    if (!permissions || !Array.isArray(permissions)) return '';
    
    const roleMap: { [key: string]: string } = {
      'viewer': 'Betrachter',
      'editor': 'Bearbeiter',
      'creator': 'Ersteller'
    };
    
    return permissions.map((permission: string) => roleMap[permission] || permission).join(', ');
  }

  /**
   * Get role title
   */
  private getRoleTitle(roleId: string): string {
    if (!roleId) return '';
    
    // Map role IDs to display titles
    const roleMap: { [key: string]: string } = {
      'admin': 'Administrator',
      'user': 'Benutzer',
      'guest': 'Gast'
    };
    
    return roleMap[roleId] || roleId;
  }

  /**
   * Get indicator metadata by ID
   */
  private getIndicatorMetadataById(indicatorId: string): any {
    const indicators = this.kommonitorDataExchangeService.availableIndicators;
    return indicators.find((indicator: any) => indicator.indicatorId === indicatorId);
  }

  /**
   * Builds data grid for indicator feature table
   */
  buildDataGrid_featureTable_indicatorResource(
    tableId: string, 
    headers: string[], 
    features: any[] = [], 
    resourceId?: string, 
    resourceType?: string, 
    enableDelete: boolean = false
  ): GridOptions {
    return this.buildDataGridOptions_featureTable_indicatorResource(headers, features, resourceId, resourceType, enableDelete);
  }

  /**
   * Builds complete grid options for indicator feature table (matches AngularJS implementation)
   */
  buildDataGridOptions_featureTable_indicatorResource(
    headers: string[], 
    dataArray: any[], 
    datasetId?: string, 
    resourceType?: string, 
    deleteButtonEnabled: boolean = false
  ): GridOptions {
    const columnDefs = this.buildFeatureTableColumnConfig(headers, deleteButtonEnabled, resourceType);
    const rowData = this.buildDataGridRowData_featureTable_indicatorResource(dataArray);

    return {
      defaultColDef: {
        editable: true,
        cellEditor: 'agLargeTextCellEditor',
        onCellValueChanged: (newValueParams: any) => {
          // Handle cell value changes for indicator data
          this.handleIndicatorCellValueChanged(newValueParams, datasetId, resourceType);
        },
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
      columnDefs: columnDefs,
      rowData: rowData,
      undoRedoCellEditing: true,
      undoRedoCellEditingLimit: 10,
      enableCellChangeFlash: true,
      suppressRowClickSelection: true,
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      onViewportChanged: () => {
        this.registerFeatureTableClickHandlers(datasetId, resourceType, deleteButtonEnabled);
      },
    };
  }

  /**
   * Builds row data for indicator feature table
   */
  private buildDataGridRowData_featureTable_indicatorResource(dataArray: any[]): any[] {
    const result = dataArray.map(dataItem => {
      // Remove arisenFrom property as this is currently never used (matches AngularJS)
      delete dataItem.arisenFrom;
      
      // Ensure required fields are present for delete functionality
      if (dataItem && typeof dataItem === 'object') {
        // Add any missing required properties
        if (!dataItem.hasOwnProperty('kommonitorRecordId')) {
          dataItem.kommonitorRecordId = dataItem.fid || dataItem.ID || dataItem.id;
        }
        // Ensure ID and fid fields are present
        dataItem.ID = dataItem.ID || dataItem.id || dataItem.fid;
        dataItem.fid = dataItem.fid || dataItem.ID || dataItem.id;
      }
      
      return dataItem;
    });
    
    return result;
  }

  /**
   * Build feature table column configuration (matches AngularJS implementation)
   */
  private buildFeatureTableColumnConfig(headers: string[], enableDelete: boolean, resourceType?: string): ColDef[] {
    const columnDefs: ColDef[] = [];

    // Get environment variables with fallbacks
    const featureIdProperty = (window as any).__env?.FEATURE_ID_PROPERTY_NAME || 'ID';
    const featureNameProperty = (window as any).__env?.FEATURE_NAME_PROPERTY_NAME || 'NAME';
    const validStartDateProperty = (window as any).__env?.VALID_START_DATE_PROPERTY_NAME || 'VALID_START_DATE';
    const validEndDateProperty = (window as any).__env?.VALID_END_DATE_PROPERTY_NAME || 'VALID_END_DATE';

    console.log('Using environment variables:', {
      featureIdProperty,
      featureNameProperty,
      validStartDateProperty,
      validEndDateProperty
    });

    // Add DB-Record-Id column (matches AngularJS implementation)
    columnDefs.push({
      headerName: 'DB-Record-Id',
      field: 'fid',
      pinned: 'left',
      editable: false,
      maxWidth: 125,
      cellRenderer: (params: any) => {
        let html = '';
        
        if (enableDelete) {
          html += `<button id="btn__indicator__deleteFeatureEntry__${params.data?.datasetId || ''}__${params.data?.spatialUnitId || ''}__${params.data?.ID || ''}__${params.data?.fid || ''}" class="btn btn-danger btn-sm indicatorDeleteFeatureRecordBtn" type="button" title="Datenobjekt unwiderruflich entfernen"><i class="fas fa-trash"></i></button>`;
        }
        
        html += '&nbsp;&nbsp;';
        html += params.data?.fid || '';
        
        return html;
      }
    });

    // Add Feature-Id column (matches AngularJS implementation)
    columnDefs.push({
      headerName: 'Feature-Id',
      field: featureIdProperty,
      pinned: 'left',
      editable: false,
      maxWidth: 125
    });

    // Add Name column (matches AngularJS implementation)
    columnDefs.push({
      headerName: 'Name',
      field: featureNameProperty,
      pinned: 'left',
      minWidth: 200,
      editable: false
    });

    // Add Lebenszeitbeginn column (matches AngularJS implementation)
    columnDefs.push({
      headerName: 'Lebenszeitbeginn',
      field: validStartDateProperty,
      minWidth: 125,
      editable: false
    });

    // Add Lebenszeitende column (matches AngularJS implementation)
    columnDefs.push({
      headerName: 'Lebenszeitende',
      field: validEndDateProperty,
      minWidth: 125,
      editable: false
    });

    // Add dynamic headers for indicator date columns (matches AngularJS implementation)
    headers.forEach(header => {
      columnDefs.push({
        headerName: header,
        field: header,
        minWidth: 125,
        editable: true,
        cellEditor: 'agTextCellEditor'
      });
    });

    return columnDefs;
  }

  /**
   * Register feature table click handlers (matches AngularJS implementation)
   */
  registerFeatureTableClickHandlers(resourceId?: string, resourceType?: string, enableDelete?: boolean): void {
    if (!enableDelete) return;

    // Register delete button click handlers (matches AngularJS implementation)
    setTimeout(() => {
      const deleteButtons = document.querySelectorAll('.indicatorDeleteFeatureRecordBtn');
      deleteButtons.forEach(button => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          
          // Broadcast loading icon event
          this.broadcastService.broadcast(`showLoadingIcon_${resourceType}`, {});
          
          // Get the button ID and parse it
          const buttonId = (button as HTMLElement).id;
          this.handleIndicatorFeatureDelete(buttonId, resourceId, resourceType);
        });
      });
    }, 100);
  }

  /**
   * Handle indicator feature delete (matches AngularJS implementation)
   */
  private handleIndicatorFeatureDelete(featureId: string, resourceId?: string, resourceType?: string): void {
    if (!resourceId || !resourceType) return;

    // Parse the button ID to extract parameters (matches AngularJS implementation)
    const buttonId = featureId; // featureId parameter contains the full button ID
    const idArray = buttonId.split('__');
    
    if (idArray.length < 7) return;
    
    const datasetId = idArray[3];
    const spatialUnitId = idArray[4];
    const actualFeatureId = idArray[5];
    const recordId = idArray[6];

    // Build URL for the DELETE request
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/indicators/${datasetId}/${spatialUnitId}/singleFeature/${actualFeatureId}/singleFeatureRecord/${recordId}`;

    // Send DELETE request
    this.http.delete(url).subscribe({
      next: (response: any) => {
        // Broadcast delete event
        this.broadcastService.broadcast(`onDeleteFeatureEntry_${resourceType}`, {});
        
        // Update timestamp for successful deletion
        this.featureTable_indicator_lastUpdate_timestamp_success = this.getCurrentTimestampString();
      },
      error: (error: any) => {
        // Update timestamp for failure
        this.featureTable_indicator_lastUpdate_timestamp_failure = this.getCurrentTimestampString();
      }
    });
  }

  /**
   * Handle indicator cell value changed (matches AngularJS implementation)
   */
  private handleIndicatorCellValueChanged(newValueParams: any, resourceId?: string, resourceType?: string): void {
    const { data, field, newValue, oldValue, column, node, api } = newValueParams;
    
    if (newValue === oldValue) return;

    // Take the modified data from newValueParams.data
    let json = JSON.parse(JSON.stringify(data));

    // Get environment variables with fallbacks
    const featureIdProperty = (window as any).__env?.FEATURE_ID_PROPERTY_NAME || 'ID';
    const featureNameProperty = (window as any).__env?.FEATURE_NAME_PROPERTY_NAME || 'NAME';
    const validStartDateProperty = (window as any).__env?.VALID_START_DATE_PROPERTY_NAME || 'VALID_START_DATE';
    const validEndDateProperty = (window as any).__env?.VALID_END_DATE_PROPERTY_NAME || 'VALID_END_DATE';

    // Delete information - only ID, fid as datatable recordId and all timestamp attributes starting with prefix 'DATE_' shall remain for indicator record update
    const allowedProperties = [featureIdProperty, 'fid'];
    for (const key in json) {
      if (Object.hasOwnProperty.call(json, key)) {
        if (!key.includes('DATE_') && !allowedProperties.includes(key)) {
          delete json[key];
        }
      }
    }
    
    // Remove specific properties
    delete json[validStartDateProperty];
    delete json[validEndDateProperty];
    delete json[featureNameProperty];

    // For indicators we should check if an empty/null/undefined value has been set by user and transmit it as null value
    for (const key in json) {
      if (Object.hasOwnProperty.call(json, key)) {
        const element = json[key];
        if (key.includes('DATE_')) {
          if (element === '') {
            json[key] = null;
          }
        }
      }
    }

    // Build URL for the PUT request
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/indicators/${resourceId}/${data.spatialUnitId}/singleFeature/${data.ID}/singleFeatureRecord/${data.fid}`;

    // Send PUT request
    this.http.put(url, json, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        // On success mark grid cell with green background
        column.colDef.cellStyle = (p: any) =>
          p.rowIndex.toString() === node.id ? { 'background-color': '#9DC89F' } : '';

        api.refreshCells({
          force: true,
          columns: [column.getId()],
          rowNodes: [node]
        });

        // Update timestamp for successful edit
        this.featureTable_indicator_lastUpdate_timestamp_success = this.getCurrentTimestampString();
      },
      error: (error: any) => {
        // Reset cell value as an error occurred
        data[column.colId] = oldValue;

        // On failure mark grid cell with red background
        column.colDef.cellStyle = (p: any) =>
          p.rowIndex.toString() === node.id ? { 'background-color': '#E79595' } : '';

        api.refreshCells({
          force: true,
          columns: [column.getId()],
          rowNodes: [node]
        });

        // Update timestamp for failure
        this.featureTable_indicator_lastUpdate_timestamp_failure = this.getCurrentTimestampString();
      }
    });
  }

  /**
   * Build role management grid
   */
  buildRoleManagementGrid(tableDOMId: string, currentTableOptionsObject: any, accessControlMetadata: any[], selectedPermissionIds: string[], reducedRoleManagement: boolean = false): any {
    const gridOptions: GridOptions = {
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true
      },
      columnDefs: this.buildRoleManagementGridColumnConfig(reducedRoleManagement),
      rowData: this.buildRoleManagementGridRowData(accessControlMetadata, selectedPermissionIds),
      pagination: true,
      paginationPageSize: 10
    };

    return gridOptions;
  }

  /**
   * Build role management grid column configuration
   */
  private buildRoleManagementGridColumnConfig(reducedRoleManagement: boolean = false): ColDef[] {
    const columnDefs: ColDef[] = [
      { headerName: 'Organisationseinheit', field: 'organizationalUnitName', pinned: 'left', minWidth: 200 }
    ];

    if (!reducedRoleManagement) {
      columnDefs.push(
        { 
          headerName: 'Betrachter', 
          field: 'viewer', 
          maxWidth: 100,
          cellRenderer: this.CheckboxRenderer_viewer
        },
        { 
          headerName: 'Bearbeiter', 
          field: 'editor', 
          maxWidth: 100,
          cellRenderer: this.CheckboxRenderer_editor
        },
        { 
          headerName: 'Ersteller', 
          field: 'creator', 
          maxWidth: 100,
          cellRenderer: this.CheckboxRenderer_creator
        }
      );
    }

    return columnDefs;
  }

  /**
   * Build role management grid row data
   */
  private buildRoleManagementGridRowData(accessControlMetadata: any[], permissionIds: string[]): any[] {
    return accessControlMetadata.map(item => ({
      organizationalUnitId: item.organizationalUnitId,
      organizationalUnitName: item.organizationalUnitName || item.name, // Handle both field names
      viewer: permissionIds.includes(item.viewerPermissionId),
      editor: permissionIds.includes(item.editorPermissionId),
      creator: permissionIds.includes(item.creatorPermissionId),
      datasetOwner: item.datasetOwner || false
    }));
  }

  /**
   * Get selected role IDs from role management grid
   */
  getSelectedRoleIds_roleManagementGrid(roleManagementTableOptions: any): string[] {
    if (!roleManagementTableOptions || !roleManagementTableOptions.rowData) return [];

    const selectedRoleIds: string[] = [];
    
    roleManagementTableOptions.rowData.forEach((row: any) => {
      if (row.viewer) {
        selectedRoleIds.push(row.viewerPermissionId);
      }
      if (row.editor) {
        selectedRoleIds.push(row.editorPermissionId);
      }
      if (row.creator) {
        selectedRoleIds.push(row.creatorPermissionId);
      }
    });

    return selectedRoleIds;
  }

  /**
   * Checkbox renderer for viewer permissions
   */
  public CheckboxRenderer_viewer = class {
    private params: any;
    private eGui: HTMLInputElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;
      this.eGui = document.createElement('input');
      this.eGui.type = 'checkbox';
      this.eGui.checked = params.value;
      this.eGui.disabled = params.data.datasetOwner;
      
      this.boundCheckedHandler = this.checkedHandler.bind(this);
      this.eGui.addEventListener('click', this.boundCheckedHandler);
    }

    checkedHandler(e: any) {
      if (this.params.node) {
        this.params.node.setDataValue('viewer', e.target.checked);
      }
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if (this.eGui) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  /**
   * Checkbox renderer for editor permissions
   */
  public CheckboxRenderer_editor = class {
    private params: any;
    private eGui: HTMLInputElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;
      this.eGui = document.createElement('input');
      this.eGui.type = 'checkbox';
      this.eGui.checked = params.value;
      this.eGui.disabled = params.data.datasetOwner;
      
      this.boundCheckedHandler = this.checkedHandler.bind(this);
      this.eGui.addEventListener('click', this.boundCheckedHandler);
    }

    checkedHandler(e: any) {
      if (this.params.node) {
        this.params.node.setDataValue('editor', e.target.checked);
      }
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if (this.eGui) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  public CheckboxRenderer_creator = class {
    private params: any;
    private eGui: HTMLInputElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;
      this.eGui = document.createElement('input');
      this.eGui.type = 'checkbox';
      this.eGui.checked = params.value;
      this.eGui.disabled = params.data.datasetOwner;
      
      this.boundCheckedHandler = this.checkedHandler.bind(this);
      this.eGui.addEventListener('click', this.boundCheckedHandler);
    }

    checkedHandler(e: any) {
      if (this.params.node) {
        this.params.node.setDataValue('creator', e.target.checked);
      }
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if (this.eGui) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  /**
   * Gets reference values from regional reference values management grid
   */
  getReferenceValues_regionalReferenceValuesManagementGrid(gridOptions: any): any[] {
    // Implementation for reference values management
    return [];
  }

  /**
   * Builds reference values management grid
   */
  buildReferenceValuesManagementGrid(gridOptions: any): any {
    // Implementation for reference values management grid
    return gridOptions;
  }
} 