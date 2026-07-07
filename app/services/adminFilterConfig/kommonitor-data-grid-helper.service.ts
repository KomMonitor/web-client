import { Injectable, inject } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { GlobalFilterEntry } from 'components/ngComponents/models/globalFilters.models';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminFilterEditModalComponent } from 'components/ngComponents/admin/adminConfig/adminFilterConfig/adminFilterEditModal/admin-filter-edit-modal.component';

@Injectable({
  providedIn: 'root',
})
export class KommonitorFilterDataGridHelperService {
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
}
