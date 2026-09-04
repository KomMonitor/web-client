import { Injectable, inject } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { GlobalFilterEntry } from 'components/ngComponents/models/globalFilters.models';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminFilterEditModalComponent } from 'components/ngComponents/admin/adminConfig/adminFilterConfig/adminFilterEditModal/admin-filter-edit-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { MODAL_WIDE } from 'util/modal-presets';

@Injectable({
  providedIn: 'root',
})
export class KommonitorFilterDataGridHelperService {
  private modalService = inject(NgbModal);
  private translate = inject(TranslateService);
  private broadcastService = inject(BroadcastService);

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
        headerName: this.translate.instant('ADMIN_SHARED.EDIT_FUNCTIONS'),
        pinned: 'left',
        maxWidth: 150,
        checkboxSelection: false,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => this.displayEditButtons_filters(params),
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.NAME'),
        field: 'name',
        pinned: 'left',
        minWidth: 300,
      },
      {
        headerName: this.translate.instant('ADMIN_CONFIG.FILTER.GRID.COL_INDICATORS'),
        field: 'indicators',
        minWidth: 200,
      },
      {
        headerName: this.translate.instant('ADMIN_CONFIG.FILTER.GRID.COL_INDICATOR_TOPICS'),
        field: 'indicatorTopics',
        minWidth: 200,
      },
      {
        headerName: this.translate.instant('ADMIN_CONFIG.FILTER.GRID.COL_GEORESOURCES'),
        field: 'georesources',
        minWidth: 200,
      },
      {
        headerName: this.translate.instant('ADMIN_CONFIG.FILTER.GRID.COL_GEORESOURCE_TOPICS'),
        field: 'georesourceTopics',
        minWidth: 200,
      },
    ];

    return columnDefs;
  }

  /**
   * Builds the grid's rows. The entries are expected to be display-ready (ids
   * already resolved to names by the overview component).
   */
  buildDataGridRowData_filters(globalFilterArray: GlobalFilterEntry[]): any[] {
    // The row's position in the stored configuration is what the edit modal
    // addresses the entry by, so carry it along explicitly instead of relying
    // on the grid's display index (which sorting and filtering change).
    return globalFilterArray.map((entry: any, index: number) => ({ ...entry, filterId: index }));
  }

  /**
   * Display edit buttons component for indicators
   */
  displayEditButtons_filters = (params: any) => {
    // Safety check for data
    if (!params) return '<div class="btn-group btn-group-sm">No data</div>';

    // Same button group the other admin grids render their row actions in.
    const container = document.createElement('div');
    container.className = 'btn-group btn-group-sm';
    container.setAttribute('role', 'group');

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
    editButton.className = 'btn btn-warning btn-sm';
    editButton.title = this.translate.instant('ADMIN_CONFIG.FILTER.GRID.EDIT_TITLE');

    editButton.addEventListener('click', () => {
      const modalRef = this.modalService.open(AdminFilterEditModalComponent, MODAL_WIDE);
      // Without the index the modal would create a new filter instead of
      // editing this one.
      modalRef.componentInstance.selectedItem = params.data.filterId;
      modalRef.componentInstance.filterName = params.data.name;
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.className = 'btn btn-danger btn-sm';
    deleteButton.title = this.translate.instant('ADMIN_CONFIG.FILTER.GRID.DELETE_TITLE');

    // The overview component owns the configuration and the editor below the
    // grid, so it performs the deletion and refreshes both.
    deleteButton.addEventListener('click', () => {
      this.broadcastService.broadcast(BroadcastMessage.OnGlobalFilterDelete, params.data.filterId);
    });

    container.appendChild(editButton);
    container.appendChild(deleteButton);

    return container;
  };
}
