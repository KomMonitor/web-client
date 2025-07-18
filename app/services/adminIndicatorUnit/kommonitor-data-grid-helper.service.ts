import { Injectable, Inject } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { KommonitorIndicatorDataExchangeService } from './kommonitor-data-exchange.service';

declare const $: any;
declare const MathJax: any;

@Injectable({
  providedIn: 'root'
})
export class KommonitorIndicatorDataGridHelperService {



  constructor(
    @Inject('kommonitorDataExchangeService') private angularJsDataExchangeService: any
  ) {}

  /**
   * Builds data grid for indicators - now returns column definitions and row data for AG Grid Angular
   */
  buildDataGrid_indicators(indicatorMetadataArray: any[]): { columnDefs: ColDef[], rowData: any[] } {
    const columnDefs = this.buildDataGridColumnConfig_indicators(indicatorMetadataArray);
    const rowData = this.buildDataGridRowData_indicators(indicatorMetadataArray);
    
    return { columnDefs, rowData };
  }



  /**
   * Builds column configuration for indicators
   */
  buildDataGridColumnConfig_indicators(indicatorMetadataArray: any[]): any[] {
    const columnDefs = [
      { 
        headerName: 'Editierfunktionen', 
        pinned: 'left', 
        maxWidth: 150, 
        checkboxSelection: false, 
        filter: false, 
        sortable: false, 
        cellRenderer: (params: any) => this.displayEditButtons_indicators(params)
      },
      { headerName: 'Id', field: "indicatorId", pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: "indicatorName", pinned: 'left', minWidth: 300 },
      { headerName: 'Einheit', field: "unit", minWidth: 200 },
      { 
        headerName: 'Beschreibung', 
        minWidth: 400, 
        cellRenderer: (params: any) => { 
          return params.data.metadata.description; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + params.data.metadata.description;
        }
      },
      {
        headerName: 'Methodik', 
        minWidth: 400,
        cellRenderer: (params: any) => {
          if(params.data.processDescription && params.data.processDescription.includes("$$")){
            let splitArray = params.data.processDescription.split("$$");
            for (let index = 0; index < splitArray.length; index++) {
              if((index % 2) == 0){
                params.data.processDescription += "<br/>";
              }                  
            }                
          }
          return params.data.processDescription;
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + params.data.processDescription;
        }
      },
      {
        headerName: 'Verfügbare Raumebenen', 
        field: "applicableSpatialUnits", 
        minWidth: 400,
        cellRenderer: (params: any) => {
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
          if (params.data.applicableSpatialUnits && params.data.applicableSpatialUnits.length > 1){
            return "" + JSON.stringify(params.data.applicableSpatialUnits);
          }
          return params.data.applicableSpatialUnits;
        }
      },
      {
        headerName: 'Verfügbare Zeitschnitte', 
        field: "applicableDates", 
        minWidth: 400,
        cellRenderer: (params: any) => {
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
          if (params.data.applicableDates && params.data.applicableDates.length > 1){
            return "" + JSON.stringify(params.data.applicableDates);
          }
          return params.data.applicableDates;
        }
      },
      { headerName: 'Kürzel', field: "abbreviation" },
      { headerName: 'Leitindikator', field: "isHeadlineIndicator" },
      { 
        headerName: 'Indikator-Typ', 
        minWidth: 200, 
        cellRenderer: (params: any) => { 
          return this.angularJsDataExchangeService.getIndicatorStringFromIndicatorType(params.data.indicatorType); 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + this.angularJsDataExchangeService.getIndicatorStringFromIndicatorType(params.data.indicatorType);
        } 
      },
      { headerName: 'Merkmal', field: "characteristicValue", minWidth: 200 },
      { headerName: 'Art der Fortführung', field: "creationType", minWidth: 200 },
      { headerName: 'Tags/Stichworte', field: "tags", minWidth: 250 },
      { 
        headerName: 'Themenhierarchie', 
        minWidth: 400, 
        cellRenderer: (params: any) => { 
          return this.angularJsDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference); 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + this.angularJsDataExchangeService.getTopicHierarchyDisplayString(params.data.topicReference);
        }
      },
      { 
        headerName: 'Datenquelle', 
        minWidth: 400, 
        cellRenderer: (params: any) => { 
          return params.data.metadata.datasource; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + params.data.metadata.datasource;
        }
      },
      { 
        headerName: 'Datenhalter und Kontakt', 
        minWidth: 400, 
        cellRenderer: (params: any) => { 
          return params.data.metadata.contact; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + params.data.metadata.contact;
        }
      },
      { 
        headerName: 'Rollen', 
        minWidth: 400, 
        cellRenderer: (params: any) => { 
          return this.angularJsDataExchangeService.getAllowedRolesString(params.data.permissions); 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + this.angularJsDataExchangeService.getAllowedRolesString(params.data.permissions);
        } 
      },
      { 
        headerName: 'Öffentlich sichtbar', 
        minWidth: 400, 
        cellRenderer: (params: any) => { 
          return params.data.isPublic ? 'ja' : 'nein'; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + (params.data.isPublic ? 'ja' : 'nein');
        } 
      },
      { 
        headerName: 'Eigentümer', 
        minWidth: 400, 
        cellRenderer: (params: any) => { 
          return this.angularJsDataExchangeService.getRoleTitle(params.data.ownerId); 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + this.angularJsDataExchangeService.getRoleTitle(params.data.ownerId);
        } 
      },
      { 
        headerName: 'Nachkommastellen', 
        minWidth: 200, 
        cellRenderer: (params: any) => { 
          return params.data.precision; 
        },
        filter: 'agTextColumnFilter', 
        filterValueGetter: (params: any) => {
          return "" + params.data.precision;
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
  displayEditButtons_indicators = (params: any) => {
    // Safety check for data
    if (!params.data || !params.data.indicatorId) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }
    
    let disabledEditButtons = !(params.data.userPermissions && Array.isArray(params.data.userPermissions) && params.data.userPermissions.includes("editor"));
    let editMetadataButtonId = 'btn_indicator_editMetadata_' + params.data.indicatorId;
    let editFeaturesButtonId = 'btn_indicator_editFeatures_' + params.data.indicatorId;

    let html = '<div class="btn-group btn-group-sm">';
    html += '<button id="' + editMetadataButtonId + '" class="btn btn-warning btn-sm indicatorEditMetadataBtn disabled" type="button" data-toggle="modal" data-target="#modal-edit-indicator-metadata" title="Metadaten editieren" disabled><i class="fas fa-pencil-alt"></i></button>';
    html += '<button id="' + editFeaturesButtonId + '" class="btn btn-warning btn-sm indicatorEditFeaturesBtn disabled" type="button" data-toggle="modal" data-target="#modal-edit-indicator-features" title="Features fortf&uuml;hren" disabled><i class="fas fa-draw-polygon"></i></button>';
    
    if(!disabledEditButtons){
      html = html.replaceAll("disabled", ""); // enabled
    }
    
    if (this.angularJsDataExchangeService.enableKeycloakSecurity) {
      let disabled = !(params.data.userPermissions && Array.isArray(params.data.userPermissions) && params.data.userPermissions.includes("creator"));
      html += '<button id="btn_indicator_editRoleBasedAccess_' + params.data.indicatorId + '"class="btn btn-warning btn-sm indicatorEditRoleBasedAccessBtn ';

      if (disabled) {
        html += 'disabled" disabled';
      }

      html += ' type="button" data-toggle="modal" data-target="#modal-edit-indicator-spatial-unit-roles" title="Zugriffsschutz und Eigentümerschaft editieren"><i class="fas fa-user-lock"></i></button>';
    }
    html += '</div>';

    return html;
  };

  /**
   * Registers click handlers for indicator buttons
   */
  registerClickHandler_indicators(indicatorMetadataArray: any[]): void {
    // First unbind previous click events
    $(".indicatorEditMetadataBtn").off();
    $(".indicatorEditMetadataBtn").on("click", (event: any) => {
      // Ensure that only the target button gets clicked
      // Manually open modal
      event.stopPropagation();
      let modalId = document.getElementById(event.target.id)?.getAttribute("data-target");
      if (modalId) {
        $(modalId).modal('show');
      }
      
      let indicatorId = event.target.id.split("_")[3];
      let indicatorMetadata = this.angularJsDataExchangeService.getIndicatorMetadataById(indicatorId);

      // Broadcast event for Angular component to handle
      this.broadcastEvent('onEditIndicatorMetadata', indicatorMetadata);
    });

    // First unbind previous click events
    $(".indicatorEditFeaturesBtn").off();
    $(".indicatorEditFeaturesBtn").on("click", (event: any) => {
      // Ensure that only the target button gets clicked
      // Manually open modal
      event.stopPropagation();
      let modalId = document.getElementById(event.target.id)?.getAttribute("data-target");
      if (modalId) {
        $(modalId).modal('show');
      }
      
      let indicatorId = event.target.id.split("_")[3];
      let indicatorMetadata = this.angularJsDataExchangeService.getIndicatorMetadataById(indicatorId);

      // Broadcast event for Angular component to handle
      this.broadcastEvent('onEditIndicatorFeatures', indicatorMetadata);
    });

    $(".indicatorEditRoleBasedAccessBtn").off();
    $(".indicatorEditRoleBasedAccessBtn").on("click", (event: any) => {
      // Ensure that only the target button gets clicked
      // Manually open modal
      event.stopPropagation();
      let modalId = document.getElementById(event.target.id)?.getAttribute("data-target");
      if (modalId) {
        $(modalId).modal('show');
      }
      
      let indicatorId = event.target.id.split("_")[3];
      let indicatorMetadata = this.angularJsDataExchangeService.getIndicatorMetadataById(indicatorId);

      // Broadcast event for Angular component to handle
      this.broadcastEvent('onEditIndicatorSpatialUnitRoles', indicatorMetadata);
    });
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
  private headerHeightSetter(gridOptions: any): void {
    const padding = 20;
    const height = this.headerHeightGetter() + padding;
    gridOptions.api.setHeaderHeight(height);
  }

  /**
   * Save grid store (filters, sorting, etc.)
   */
  private saveGridStore(gridOptions: any): void {
    (window as any).colState = gridOptions.columnApi.getColumnState();
    (window as any).filterState = gridOptions.api.getFilterModel();
  }

  /**
   * Restore grid store (filters, sorting, etc.)
   */
  private restoreGridStore(gridOptions: any): void {
    if ((window as any).colState) {
      gridOptions.columnApi.applyColumnState({ 
        state: (window as any).colState, 
        applyOrder: true 
      });
    }

    if ((window as any).filterState) {
      gridOptions.api.setFilterModel((window as any).filterState);
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
   * Gets reference values from regional reference values management grid - delegates to AngularJS service
   */
  getReferenceValues_regionalReferenceValuesManagementGrid(gridOptions: any): any[] {
    return this.angularJsDataExchangeService.getReferenceValues_regionalReferenceValuesManagementGrid(gridOptions);
  }

  /**
   * Builds reference values management grid - delegates to AngularJS service
   */
  buildReferenceValuesManagementGrid(gridOptions: any): any {
    return this.angularJsDataExchangeService.buildReferenceValuesManagementGrid(gridOptions);
  }
} 