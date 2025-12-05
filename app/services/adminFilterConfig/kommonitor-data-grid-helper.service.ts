import { Injectable, Inject } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import * as agGrid from 'ag-grid-community';
import { GlobalFilterEntry } from 'components/ngComponents/models/globalFilters.models';

declare const $: any;
declare const MathJax: any;

@Injectable({
  providedIn: 'root'
})
export class KommonitorFilterDataGridHelperService {



  constructor(
    private angularJsDataExchangeService: DataExchangeService
  ) {}

  /**
   * Builds data grid for indicators - now returns column definitions and row data for AG Grid Angular
   */
  buildDataGrid_indicators(globalFilterArray: GlobalFilterEntry[]): { columnDefs: ColDef[], rowData: any[] } {
    const columnDefs = this.buildDataGridColumnConfig_indicators(globalFilterArray);
    const rowData = this.buildDataGridRowData_indicators(globalFilterArray);
    
    return { columnDefs, rowData };
  }



  /**
   * Builds column configuration for indicators
   */
  buildDataGridColumnConfig_indicators(globalFilterArray: GlobalFilterEntry[]): any[] {
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
      { headerName: 'Name', field: "name", pinned: 'left', minWidth: 300 },
      { headerName: 'Indikatoren', field: "indicators", minWidth: 200 }
    ];

    return columnDefs;
  }

  /**
   * Builds row data for indicators
   */
  buildDataGridRowData_indicators(globalFilterArray: GlobalFilterEntry[]): any[] {
    return globalFilterArray;
  }

  /**
   * Display edit buttons component for indicators
   */
  displayEditButtons_indicators = (params: any) => {
    // Safety check for data
    if (!params) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }
    
    const editMetadataButtonId = 'btn_georesource_editMetadata_' + params.data.georesourceId;
    const deleteButtonId = 'btn_georesource_deleteGeoresource_' + params.data.georesourceId;

    let html = '<div class="btn-group btn-group-sm">';
    html += '<button id="' + editMetadataButtonId + '" class="btn btn-warning btn-sm georesourceEditMetadataBtn" type="button" title="Metadaten editieren"><i class="fas fa-pencil-alt"></i></button>';

    html += '<button id="' + deleteButtonId + '" class="btn btn-danger btn-sm georesourceDeleteBtn" type="button" title="Georessource entfernen"><i class="fas fa-trash"></i></button>';
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
  getReferenceValues_regionalReferenceValuesManagementGrid(regionalReferenceValuesManagementTableOptions){
    let regionalReferenceValuesList:any[] = [];
    if (regionalReferenceValuesManagementTableOptions && regionalReferenceValuesManagementTableOptions.api){

      /*
          regionalReferenceValuesList: 
          [
            {
                "referenceDate": "2021-12-31",
                "regionalSum": 3000,
                "regionalAverage": 144
                "spatiallyUnassignable": 0
            },
            {
                "referenceDate": "2022-12-31",
                "regionalSum": 3500,
                "regionalAverage": 148,
                "spatiallyUnassignable": 0
            }
          ]
          
      */
      regionalReferenceValuesManagementTableOptions.api.forEachNode((node, index) => {            
        regionalReferenceValuesList.push(node.data);           
      })               
    }
    return regionalReferenceValuesList;
  }

  /**
   * Builds reference values management grid - delegates to AngularJS service
   */
  buildReferenceValuesManagementGrid(domElementId, applicableDates, regionalReferenceValuesList) {

    let dataGridOptions_regionalReferenceValues;

    dataGridOptions_regionalReferenceValues = this.buildDataGridOptions_regionalReferenceValues(applicableDates, regionalReferenceValuesList);
    
    let gridDiv:any = document.querySelector('#' + domElementId);
    if(gridDiv) {
      while (gridDiv.firstChild) {
        gridDiv.removeChild(gridDiv!.firstChild);
      }
      new agGrid.Grid(gridDiv, dataGridOptions_regionalReferenceValues);
    }

    return dataGridOptions_regionalReferenceValues;
  }

  buildDataGridOptions_regionalReferenceValues(applicableDates, regionalReferenceValuesList){
    let columnDefs = this.buildDataGridColumnConfig_regionalReferenceValues(applicableDates, regionalReferenceValuesList);
    let rowData = this.buildDataGridRowData_regionalReferenceValues(applicableDates, regionalReferenceValuesList);

    let gridOptions = {
      defaultColDef: {
        editable: true,            
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          precision: 2,
          step: 0.25,
          showStepperButtons: true
        },              
        sortable: true,
        flex: 1,
        minWidth: 200,
        filter: true,
        floatingFilter: false,
        // filterParams: {
        //   newRowsAction: 'keep'
        // },
        resizable: true,
        wrapText: true,
        autoHeight: true,
        cellStyle: { 'font-size': '12px;', 'white-space': 'normal !important', "line-height": "20px !important", "word-break": "break-word !important", "padding-top": "17px", "padding-bottom": "17px" },
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
      // enables undo / redo
      undoRedoCellEditing: true,
      // restricts the number of undo / redo steps to 10
      undoRedoCellEditingLimit: 10,
      // enables flashing to help see cell changes
      enableCellChangeFlash: true,
      suppressRowClickSelection: true,
      // rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,          
      // onFirstDataRendered: function () {
      //   headerHeightSetter(this);
      // },
      // onColumnResized: function () {
      //   headerHeightSetter(this);
      // }
      onRowDataChanged: function () {
      },  
      onModelUpdated: function () {
        
      }, 
      onViewportChanged: function () {                  
      },

    };

    return gridOptions;        
  }

  buildDataGridColumnConfig_regionalReferenceValues(applicableDates, regionalReferenceValuesList){
    const columnDefs = [
      { headerName: 'Zeitpunkt', field: "referenceDate", pinned: 'left', cellDataType: 'text', editable: false, cellClass: "grid-non-editable", maxWidth: 150
      },
      { headerName: 'regionale Gesamtsumme', field: "regionalSum", cellDataType: 'number', 
        cellEditor: 'agNumberCellEditor', cellEditorParams: {
          precision: 2,
          step: 0.01,
          showStepperButtons: true
        }, 
        tooltipValueGetter: (p) =>
          "mit Enter bestätigen", maxWidth: 175 },
      { headerName: 'regionaler Mittelwert', field: "regionalAverage", cellDataType: 'number', cellEditor: 'agNumberCellEditor', cellEditorParams: {
        precision: 2,
        step: 0.01,
        showStepperButtons: true
      }, tooltipValueGetter: (p) =>
        "mit Enter bestätigen",
      maxWidth: 175 },
      { headerName: 'räumlich nicht zuordenbar', field: "spatiallyUnassignable", cellDataType: 'number', cellEditor: 'agNumberCellEditor', cellEditorParams: {
        precision: 2,
        step: 0.01,
        showStepperButtons: true
      }, tooltipValueGetter: (p) =>
        "mit Enter bestätigen", maxWidth: 175 }, 
      
    ];

    return columnDefs;
  }

  buildDataGridRowData_regionalReferenceValues(applicableDates, regionalReferenceValuesList){
    
    /*
      regionalReferenceValuesList: 
        [
          {
              "referenceDate": "2021-12-31",
              "regionalSum": 3000,
              "regionalAverage": 144,
              "spatiallyUnassignable": 0
          },
          {
              "referenceDate": "2022-12-31",
              "regionalSum": 3500,
              "regionalAverage": 148,
              "spatiallyUnassignable", 0
          }
        ]
    */

      let dataArray:any[] = [];

    if(applicableDates && applicableDates.length > 0){

      for (const availableDate of applicableDates) {
        let item = {
          "referenceDate": availableDate,
          "regionalSum": undefined,
          "regionalAverage": undefined,
          "spatiallyUnassignable": undefined
        };

        if(regionalReferenceValuesList && regionalReferenceValuesList.length > 0){
          for (const regionalReferenceValuesListEntry of regionalReferenceValuesList) {
            if(regionalReferenceValuesListEntry.referenceDate == availableDate){
              item = regionalReferenceValuesListEntry;
              break;
            }
          }
        }
        

        dataArray.push(item);
      }
      
    }
    
    return dataArray;
  }
} 