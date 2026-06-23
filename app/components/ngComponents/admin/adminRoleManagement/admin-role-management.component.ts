import { Component, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import {
  KommonitorDataExchangeService,
  AccessControlMetadata,
} from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { KeycloakHelperService } from 'services/keycloak-helper-service/keycloak-helper.service';
import { RoleAddModalComponent } from './roleAddModal/role-add-modal.component';
import { RoleDeleteModalComponent } from './roleDeleteModal/role-delete-modal.component';
import { RoleEditMetadataModalComponent } from './roleEditMetadataModal/role-edit-metadata-modal.component';
import { RoleActionsCellRendererComponent } from './role-actions-cell-renderer.component';
import { RoleEditGroupRightsModalComponent } from './roleEditGroupRightsModal/role-edit-group-rights-modal.component';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { NotificationService } from '../../common/notification/notification.service';

interface AccessControlTableEntry extends AccessControlMetadata {
  parentName?: string;
  ownChildGroupNames?: string[];
}

@Component({
  selector: 'app-admin-role-management',
  templateUrl: './admin-role-management.component.html',
  styleUrls: ['./admin-role-management.component.scss'],
  imports: [
    FormsModule,
    AgGridAngular,
    AdminContentViewComponent,
    ExpandableBoxComponent,
    LoadingOverlayComponent,
  ],
  standalone: true,
})
export class AdminRoleManagementComponent implements OnInit {
  private modalService = inject(NgbModal);
  protected kommonitorDataExchangeService = inject(KommonitorDataExchangeService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);
  private notificationService = inject(NotificationService);
  protected keycloakHelperService = inject(KeycloakHelperService);

  public loadingData: boolean = true;
  public tableViewSwitcher: boolean = false;

  public rowData: AccessControlTableEntry[] = [];
  public defaultColDef: ColDef = this.kommonitorDataGridHelperService.buildDefaultColDef();
  public gridOptions: GridOptions = {
    suppressRowClickSelection: true,
    rowSelection: 'multiple',
    enableCellTextSelection: true,
    ensureDomOrder: true,
    suppressColumnVirtualisation: true,
  };
  public paginationPageSize: number = 10;
  public paginationPageSizeSelector: number[] = [10, 25, 50, 100];

  public columnDefs: ColDef<AccessControlTableEntry>[] = [
    {
      headerName: 'Editierfunktionen',
      pinned: 'left',
      maxWidth: 150,
      checkboxSelection: true,
      filter: false,
      sortable: false,
      cellRenderer: RoleActionsCellRendererComponent,
      cellRendererParams: {
        onEditMetadata: (dataset: AccessControlTableEntry) => this.openEditMetadataModal(dataset),
        onDelete: (dataset: AccessControlTableEntry) => this.openEditGroupRightsModal(dataset),
      },
    },
    {
      headerName: 'Organisationseinheit',
      field: 'name',
      pinned: 'left',
      minWidth: 250,
    },
    {
      headerName: 'Hierarchie - übergeordnete Organisationseinheit',
      field: 'parentName',
    },
    {
      headerName: 'Hierarchie - direkt untergeordnete Organisationseinheiten',
      cellRenderer: (param) =>
        param.data.ownChildGroupNames.length +
        ' direkte Untergruppe(n)<br/><br/>' +
        param.data.ownChildGroupNames,
    },
    {
      headerName: 'Beschreibung',
      field: 'description',
      minWidth: 350,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Kontakt',
      field: 'contact',
      minWidth: 250,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Mandant',
      field: 'mandant',
      minWidth: 120,
      cellDataType: 'boolean',
      filter: false,
    },
  ];

  private allAccessControl: AccessControlTableEntry[] = [];
  protected selectedRows: AccessControlTableEntry[] = [];

  ngOnInit(): void {
    this.fetchAccessControlData(false);
  }

  private fetchAccessControlData(useCache): void {
    this.loadingData = true;
    this.kommonitorDataExchangeService.fetchAccessControlMetadata(useCache).subscribe({
      next: (accessControl) => this.setData(accessControl),
      error: (error) => this.handleError(error),
    });
  }

  private handleError(error: any) {
    this.notificationService.showError(
      'Die Daten konnten nicht geladen werden! Bitte versuchen Sie es später erneut.'
    );
    console.error(error);
    this.loadingData = false;
  }

  private setData(accessControl: AccessControlMetadata[]) {
    if (accessControl && accessControl.length > 0) {
      this.allAccessControl = accessControl.map((dataItem: AccessControlTableEntry) => {
        const parentId = dataItem.parentId;
        let parentName = '';
        const parentObject = accessControl.filter(
          (item) => item.organizationalUnitId == parentId
        )[0];
        if (parentObject && parentObject.name) {
          parentName = parentObject.name;
        }
        dataItem.parentName = parentName;

        const childrenIds = dataItem.children ?? [];

        const organizationalUnitChildrenUnits = childrenIds
          .map((id) => this.kommonitorDataExchangeService.getAccessControlById(id))
          .filter((unit): unit is AccessControlMetadata => unit !== undefined)
          .map((id) => id.name);
        dataItem.ownChildGroupNames = organizationalUnitChildrenUnits;
        return dataItem as AccessControlTableEntry;
      });
      this.applyTableFilter();
      this.loadingData = false;
    }
  }

  onTableViewSwitch(): void {
    this.applyTableFilter();
  }

  private applyTableFilter(): void {
    if (this.tableViewSwitcher) {
      this.rowData = this.allAccessControl.filter((entry) => entry.datasetOwner === true);
    } else {
      this.rowData = [...this.allAccessControl];
    }
  }

  openAddModal(): void {
    const modalRef = this.modalService.open(RoleAddModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      windowClass: 'modal-medium-window',
    });

    modalRef.result
      .then((reloadData) => reloadData && this.fetchAccessControlData(false))
      .catch(() => {});
  }

  openEditMetadataModal(dataset: AccessControlMetadata): void {
    const modalRef = this.modalService.open(RoleEditMetadataModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'modal-medium',
      windowClass: 'modal-medium',
    });

    modalRef.componentInstance.currentDataset = JSON.parse(JSON.stringify(dataset));

    modalRef.result
      .then((reloadData) => reloadData && this.fetchAccessControlData(false))
      .catch(() => {});
  }

  openDeleteModal(): void {
    const modalRef = this.modalService.open(RoleDeleteModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      size: 'lg',
    });

    modalRef.componentInstance.datasetsToDelete = this.selectedRows;

    modalRef.result
      .then((reloadData) => reloadData && this.fetchAccessControlData(false))
      .catch(() => {});
  }

  openEditGroupRightsModal(dataset: AccessControlTableEntry) {
    const modalRef = this.modalService.open(RoleEditGroupRightsModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      size: 'xl',
    });

    modalRef.componentInstance.currentDataset = JSON.parse(JSON.stringify(dataset));

    modalRef.result
      .then((reloadData) => reloadData && this.fetchAccessControlData(false))
      .catch(() => {});
  }

  selectionChanged($event: SelectionChangedEvent<AccessControlTableEntry, any>) {
    this.selectedRows = $event.api.getSelectedRows();
  }
}
