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
  featureTable_spatialUnit_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_spatialUnit_lastUpdate_timestamp_failure: Date | undefined = undefined;
  featureTable_georesource_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_georesource_lastUpdate_timestamp_failure: Date | undefined = undefined;
  featureTable_indicator_lastUpdate_timestamp_success: Date | undefined = undefined;
  featureTable_indicator_lastUpdate_timestamp_failure: Date | undefined = undefined;

  constructor(
    private kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private broadcastService: BroadcastService,
    private http: HttpClient
  ) {}

  /**
   * Builds data grid for indicators - returns column definitions and row data for AG Grid Angular
   */
  buildDataGrid_indicators(indicatorMetadataArray: any[]): { columnDefs: ColDef[], rowData: any[] } {
    const columnDefs = this.buildDataGridColumnConfig_indicators(indicatorMetadataArray);
    const rowData = this.buildDataGridRowData_indicators(indicatorMetadataArray);
    
    return { columnDefs, rowData };
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
   * Registers click handlers for indicator buttons using Angular events
   */
  registerClickHandler_indicators(indicatorMetadataArray: any[]): void {
    // Use Angular event listeners instead of jQuery
    setTimeout(() => {
      // Register click handlers for edit metadata buttons
      const editMetadataButtons = document.querySelectorAll('.indicatorEditMetadataBtn');
      editMetadataButtons.forEach((button: Element) => {
        button.addEventListener('click', (event: Event) => {
          event.stopPropagation();
          const target = event.target as HTMLElement;
          const indicatorId = target.id.split("_")[3];
          const indicatorMetadata = this.getIndicatorMetadataById(indicatorId);
          
          // Broadcast event for Angular component to handle
          this.broadcastEvent('onEditIndicatorMetadata', indicatorMetadata);
        });
      });

      // Register click handlers for edit features buttons
      const editFeaturesButtons = document.querySelectorAll('.indicatorEditFeaturesBtn');
      editFeaturesButtons.forEach((button: Element) => {
        button.addEventListener('click', (event: Event) => {
          event.stopPropagation();
          const target = event.target as HTMLElement;
          const indicatorId = target.id.split("_")[3];
          const indicatorMetadata = this.getIndicatorMetadataById(indicatorId);
          
          // Broadcast event for Angular component to handle
          this.broadcastEvent('onEditIndicatorFeatures', indicatorMetadata);
        });
      });

      // Register click handlers for edit role-based access buttons
      const editRoleButtons = document.querySelectorAll('.indicatorEditRoleBasedAccessBtn');
      editRoleButtons.forEach((button: Element) => {
        button.addEventListener('click', (event: Event) => {
          event.stopPropagation();
          const target = event.target as HTMLElement;
          const indicatorId = target.id.split("_")[3];
          const indicatorMetadata = this.getIndicatorMetadataById(indicatorId);
          
          // Broadcast event for Angular component to handle
          this.broadcastEvent('onEditIndicatorSpatialUnitRoles', indicatorMetadata);
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
  private broadcastEvent(eventName: string, data: any): void {
    // Create a custom event that the Angular component can listen to
    const event = new CustomEvent(eventName, { 
      detail: { values: data } 
    });
    document.dispatchEvent(event);
  }

  /**
   * Get current timestamp string utility
   */
  private getCurrentTimestampString(): string {
    const now = new Date();
    return now.toISOString();
  }

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