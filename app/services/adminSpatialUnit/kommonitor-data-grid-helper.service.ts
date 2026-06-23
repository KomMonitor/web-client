import { Injectable } from '@angular/core';
import { GridOptions, ColDef } from 'ag-grid-community';

@Injectable({
  providedIn: 'root',
})
export class KommonitorDataGridHelperService {
  // Store the data grid options
  private dataGridOptions_spatialUnits: GridOptions | null = null;

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
        'padding-bottom': '17px',
      },
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
      suppressColumnVirtualisation: true,
    };
  }

  /**
   * Get current spatial units grid options
   */
  getSpatialUnitsGridOptions(): GridOptions | null {
    return this.dataGridOptions_spatialUnits;
  }
}
