import { Injectable } from '@angular/core';
import { ColDef, GridOptions } from 'ag-grid-community';

@Injectable({
  providedIn: 'root',
})
export class KommonitorDataGridHelperService {
  // Store the data grid options
  private dataGridOptions_spatialUnits: GridOptions | null = null;

  /**
   * Build default column definition
   *
   * Deliberately carries no `cellStyle`: the former one restated the global
   * `.ag-cell` rule in app.scss property for property (font size, wrapping,
   * line height, padding) as an inline style, which then outranked it. Two
   * callers had to spread and re-override it just to correct the font size,
   * and the copies drifted apart. Cell typography lives in app.scss now.
   */
  buildDefaultColDef(): ColDef {
    return {
      editable: false,
      cellDataType: false,
      sortable: true,
      flex: 1,
      minWidth: 200,
      filter: true,
      floatingFilter: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
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
      paginationPageSizeSelector: [10, 25, 50, 100],
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
