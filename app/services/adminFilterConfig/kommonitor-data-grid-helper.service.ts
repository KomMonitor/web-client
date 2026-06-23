import { Injectable, inject } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import * as agGrid from 'ag-grid-community';
import { GlobalFilterEntry } from 'components/ngComponents/models/globalFilters.models';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminFilterEditModalComponent } from 'components/ngComponents/admin/adminConfig/adminFilterConfig/adminFilterEditModal/admin-filter-edit-modal.component';

@Injectable({
  providedIn: 'root',
})
export class KommonitorFilterDataGridHelperService {
  private angularJsDataExchangeService = inject(DataExchangeService);
  private modalService = inject(NgbModal);

  /**
   * Builds data grid for indicators - now returns column definitions and row data for AG Grid Angular
   */
  buildDataGrid_filters(globalFilterArray: GlobalFilterEntry[]): {
    columnDefs: ColDef[];
    rowData: any[];
  } {
    const columnDefs = this.buildDataGridColumnConfig_filters(globalFilterArray);
    const rowData = this.buildDataGridRowData_filters(globalFilterArray);

    return { columnDefs, rowData };
  }

  /**
   * Builds column configuration for indicators
   */
  buildDataGridColumnConfig_filters(_globalFilterArray: GlobalFilterEntry[]): any[] {
    const columnDefs = [
      {
        headerName: 'Editierfunktionen',
        pinned: 'left',
        maxWidth: 150,
        checkboxSelection: false,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => this.displayEditButtons_filters(params),
      },
      { headerName: 'Name', field: 'name', pinned: 'left', minWidth: 300 },
      { headerName: 'Indikatoren', field: 'indicators', minWidth: 200 },
    ];

    return columnDefs;
  }

  /**
   * Builds row data for indicators
   */
  buildDataGridRowData_filters(globalFilterArray: GlobalFilterEntry[]): any[] {
    return globalFilterArray;
  }

  /**
   * Display edit buttons component for indicators
   */
  displayEditButtons_filters = (params: any) => {
    // Safety check for data
    if (!params) return '<div class="btn-group btn-group-sm">No data</div>';

    const container = document.createElement('div');

    const editButton = document.createElement('button');
    editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    editButton.className = 'btn btn-warning btn-sm';
    editButton.title = 'Filter editieren';

    editButton.addEventListener('click', () => {
      const modalRef = this.modalService.open(AdminFilterEditModalComponent, {
        windowClass: 'modal-holder',
        centered: true,
      });
      modalRef.componentInstance.filterName = params.data.name;
    });

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.title = 'Filter entfernen';

    deleteButton.addEventListener('click', () => {
      //myClickHandler(params.data);
    });

    container.appendChild(editButton);
    container.appendChild(deleteButton);

    return container;
  };

  /**
   * Header height getter utility function
   */
  private headerHeightGetter(): number {
    const columnHeaderTexts = Array.from(document.querySelectorAll('.ag-header-cell-text'));
    const clientHeights = columnHeaderTexts.map((headerText: any) => headerText.clientHeight);
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
        applyOrder: true,
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
      detail: { values: data },
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
  getReferenceValues_regionalReferenceValuesManagementGrid(
    regionalReferenceValuesManagementTableOptions
  ) {
    const regionalReferenceValuesList: any[] = [];
    if (
      regionalReferenceValuesManagementTableOptions &&
      regionalReferenceValuesManagementTableOptions.api
    ) {
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
      regionalReferenceValuesManagementTableOptions.api.forEachNode((node, _index) => {
        regionalReferenceValuesList.push(node.data);
      });
    }
    return regionalReferenceValuesList;
  }

  /**
   * Builds reference values management grid - delegates to AngularJS service
   */
  buildReferenceValuesManagementGrid(domElementId, applicableDates, regionalReferenceValuesList) {
    // typed as `any` to match the original implicit-any local; the inferred grid-options
    // shape is not directly assignable to ag-grid's GridOptions (loose ColDef literals).
    const dataGridOptions_regionalReferenceValues: any =
      this.buildDataGridOptions_regionalReferenceValues(
        applicableDates,
        regionalReferenceValuesList
      );

    const gridDiv: any = document.querySelector('#' + domElementId);
    if (gridDiv) {
      while (gridDiv.firstChild) {
        gridDiv.removeChild(gridDiv!.firstChild);
      }
      new agGrid.Grid(gridDiv, dataGridOptions_regionalReferenceValues);
    }

    return dataGridOptions_regionalReferenceValues;
  }

  buildDataGridOptions_regionalReferenceValues(applicableDates, regionalReferenceValuesList) {
    const columnDefs = this.buildDataGridColumnConfig_regionalReferenceValues(
      applicableDates,
      regionalReferenceValuesList
    );
    const rowData = this.buildDataGridRowData_regionalReferenceValues(
      applicableDates,
      regionalReferenceValuesList
    );

    const gridOptions = {
      defaultColDef: {
        editable: true,
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          precision: 2,
          step: 0.25,
          showStepperButtons: true,
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
        cellStyle: {
          'font-size': '12px;',
          'white-space': 'normal !important',
          'line-height': '20px !important',
          'word-break': 'break-word !important',
          'padding-top': '17px',
          'padding-bottom': '17px',
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
        /* intentionally empty */
      },
      onModelUpdated: function () {
        /* intentionally empty */
      },
      onViewportChanged: function () {
        /* intentionally empty */
      },
    };

    return gridOptions;
  }

  buildDataGridColumnConfig_regionalReferenceValues(_applicableDates, _regionalReferenceValuesList) {
    const columnDefs = [
      {
        headerName: 'Zeitpunkt',
        field: 'referenceDate',
        pinned: 'left',
        cellDataType: 'text',
        editable: false,
        cellClass: 'grid-non-editable',
        maxWidth: 150,
      },
      {
        headerName: 'regionale Gesamtsumme',
        field: 'regionalSum',
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          precision: 2,
          step: 0.01,
          showStepperButtons: true,
        },
        tooltipValueGetter: (_p) => 'mit Enter bestätigen',
        maxWidth: 175,
      },
      {
        headerName: 'regionaler Mittelwert',
        field: 'regionalAverage',
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          precision: 2,
          step: 0.01,
          showStepperButtons: true,
        },
        tooltipValueGetter: (_p) => 'mit Enter bestätigen',
        maxWidth: 175,
      },
      {
        headerName: 'räumlich nicht zuordenbar',
        field: 'spatiallyUnassignable',
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          precision: 2,
          step: 0.01,
          showStepperButtons: true,
        },
        tooltipValueGetter: (_p) => 'mit Enter bestätigen',
        maxWidth: 175,
      },
    ];

    return columnDefs;
  }

  buildDataGridRowData_regionalReferenceValues(applicableDates, regionalReferenceValuesList) {
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

    const dataArray: any[] = [];

    if (applicableDates && applicableDates.length > 0) {
      for (const availableDate of applicableDates) {
        let item = {
          referenceDate: availableDate,
          regionalSum: undefined,
          regionalAverage: undefined,
          spatiallyUnassignable: undefined,
        };

        if (regionalReferenceValuesList && regionalReferenceValuesList.length > 0) {
          for (const regionalReferenceValuesListEntry of regionalReferenceValuesList) {
            if (regionalReferenceValuesListEntry.referenceDate == availableDate) {
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

  /**
   * Build role management grid row data
   */
  private buildRoleManagementGridRowData(
    accessControlMetadata: any[],
    permissionIds: string[]
  ): any[] {
    // Flatten permissions into boolean fields for ag-Grid built-in checkbox renderer
    const data = JSON.parse(JSON.stringify(accessControlMetadata));
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
          const isChecked = !!(permissionIds && permissionIds.includes(permission.permissionId));
          // keep permissions[] state in sync (as in AngularJS)
          permission.isChecked = isChecked;

          if (permission.permissionLevel === 'viewer') {
            elem.viewer = isChecked;
          }
          if (permission.permissionLevel === 'editor') {
            elem.editor = isChecked;
          }
          if (permission.permissionLevel === 'creator') {
            elem.creator = isChecked;
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

  private buildRoleManagementGridColumnConfig(reducedRoleManagement: boolean = false): any[] {
    const columnDefs = [
      {
        headerName: 'Organisationseinheit',
        field: 'name',
        minWidth: 200,
        cellClass: 'user-roles-normal',
      },
      {
        headerName: 'Lesen',
        field: 'viewer',
        filter: false,
        sortable: false,
        width: 100,
        cellRenderer: 'CheckboxRenderer_viewer',
        editable: true,
      },
      {
        headerName: 'Editieren',
        field: 'editor',
        filter: false,
        sortable: false,
        width: 100,
        cellRenderer: 'CheckboxRenderer_editor',
        editable: true,
      },
    ];
    if (!reducedRoleManagement) {
      columnDefs.push({
        headerName: 'Löschen',
        field: 'creator',
        filter: false,
        sortable: false,
        width: 100,
        cellRenderer: 'CheckboxRenderer_creator',
        editable: true,
      });
    }
    return columnDefs;
  }

  private buildRoleManagementGridOptions(
    accessControlMetadata: any[],
    selectedPermissionIds: string[],
    reducedRoleManagement: boolean = false
  ): any {
    const columnDefs = this.buildRoleManagementGridColumnConfig(reducedRoleManagement);
    const rowData = this.buildRoleManagementGridRowData(
      accessControlMetadata,
      selectedPermissionIds
    );
    const gridOptions = {
      components: {
        CheckboxRenderer_viewer: this.CheckboxRenderer_viewer,
        CheckboxRenderer_editor: this.CheckboxRenderer_editor,
        CheckboxRenderer_creator: this.CheckboxRenderer_creator,
      },
      defaultColDef: {
        editable: false,
        sortable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
        floatingFilter: false,
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
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      /*  onFirstDataRendered: () => {
        this.headerHeightSetter();
      },
      onColumnResized: () => {
        this.headerHeightSetter();
      }, */
      /* onGridReady: (params: agGrid.GridReadyEvent) => {
        this.gridApi_spatialUnits = params.api;
      } */
    };
    return gridOptions;
  }

  /**
   * Checkbox renderer for viewer permissions
   */
  private CheckboxRenderer_viewer = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className;
      if (params && params.data) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel == 'viewer') {
            exists = true;
            isChecked = permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className;
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable viewer if dataset owner or if editor/creator selection implies viewer
        if (
          this.params.data.datasetOwner === true ||
          this.params.data._viewerDisabledBecauseOfEditor === true ||
          this.params.data._viewerDisabledBecauseOfCreator === true
        ) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        // If permission does not exist for this row, render empty content to avoid displaying boolean values like "false"
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;

      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel == 'viewer') {
          permission.isChecked = checked;
          break;
        }
      }
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  /**
   * Checkbox renderer for editor permissions
   */
  private CheckboxRenderer_editor = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className;
      if (params && params.data) {
        for (const permission of params.data.permissions) {
          if (permission.permissionLevel == 'editor') {
            exists = true;
            isChecked = permission.isChecked;
            className = permission.permissionId;
            break;
          }
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className;
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable editor if dataset owner or if creator selection implies editor
        if (
          this.params.data.datasetOwner === true ||
          this.params.data._editorDisabledBecauseOfCreator === true
        ) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        // If permission does not exist for this row, render empty content to avoid displaying boolean values like "false"
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (permission.permissionLevel == 'viewer') {
          if (checked) {
            permission.isChecked = true;
          } else {
            permission.isChecked = false;
          }
        } else if (permission.permissionLevel == 'editor') {
          permission.isChecked = checked;
        }
      }
      // If editor is checked, enforce viewer checked+disabled
      if (checked) {
        this.params.data._viewerDisabledBecauseOfEditor = true;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == 'viewer') {
            permission.isChecked = true;
          }
        }
      } else {
        this.params.data._viewerDisabledBecauseOfEditor = false;
      }
      // Ask grid to refresh this row to update disabled state of viewer column
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };

  /**
   * Checkbox renderer for creator permissions
   */
  private CheckboxRenderer_creator = class {
    private params: any;
    private eGui: HTMLElement | null = null;
    private boundCheckedHandler: any;

    init(params: any) {
      this.params = params;

      let isChecked = false;
      let exists = false;
      let className;
      for (const permission of params.data.permissions) {
        if (permission.permissionLevel == 'creator') {
          exists = true;
          isChecked = permission.isChecked;
          className = permission.permissionId;
          break;
        }
      }

      if (exists) {
        const input = document.createElement('input') as HTMLInputElement;
        this.eGui = input;
        input.className = className;
        input.type = 'checkbox';
        input.checked = isChecked;

        // Disable creator if dataset owner is true
        if (this.params.data.datasetOwner === true) {
          input.disabled = true;
        } else {
          input.disabled = false;
        }

        this.boundCheckedHandler = this.checkedHandler.bind(this);
        input.addEventListener('click', this.boundCheckedHandler);
      } else {
        // If permission does not exist for this row, render empty content to avoid displaying boolean values like "false"
        this.eGui = document.createElement('span');
      }
    }

    checkedHandler(e: any) {
      const checked = e.target.checked;
      for (const permission of this.params.data.permissions) {
        if (
          permission.permissionLevel == 'creator' ||
          permission.permissionLevel == 'editor' ||
          permission.permissionLevel == 'viewer'
        ) {
          permission.isChecked = checked;
        }
      }
      // If creator is checked, enforce editor and viewer checked+disabled
      if (checked) {
        this.params.data._editorDisabledBecauseOfCreator = true;
        this.params.data._viewerDisabledBecauseOfCreator = true;
        for (const permission of this.params.data.permissions) {
          if (permission.permissionLevel == 'editor' || permission.permissionLevel == 'viewer') {
            permission.isChecked = true;
          }
        }
      } else {
        this.params.data._editorDisabledBecauseOfCreator = false;
        this.params.data._viewerDisabledBecauseOfCreator = false;
      }
      // Ask grid to refresh this row to update disabled state of editor/viewer columns
      if (this.params.api && this.params.node) {
        this.params.api.refreshCells({ force: true, rowNodes: [this.params.node] });
      }
    }

    getGui() {
      return this.eGui;
    }

    destroy() {
      if (this.eGui && this.boundCheckedHandler) {
        this.eGui.removeEventListener('click', this.boundCheckedHandler);
      }
    }
  };
}
