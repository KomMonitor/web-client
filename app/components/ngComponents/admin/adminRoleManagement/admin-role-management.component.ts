import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, ICellRendererParams, SelectionChangedEvent } from 'ag-grid-community';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { AccessControlMetadata } from 'components/ngComponents/models/permissions.models';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRoleManagementComponent implements OnInit {
  private modalService = inject(NgbModal);
  protected accessControlService = inject(AccessControlService);
  protected envConfigService = inject(EnvConfigService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);
  private notificationService = inject(NotificationService);
  protected keycloakHelperService = inject(KeycloakHelperService);

  // Signal-backed: written from the async access-control fetch callbacks,
  // which would not trigger a re-render of this OnPush component otherwise.
  public loadingData = signal(true);
  public tableViewSwitcher: boolean = false;

  public rowData = signal<AccessControlTableEntry[]>([]);
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
        onEditGroupRights: (dataset: AccessControlTableEntry) =>
          this.openEditGroupRightsModal(dataset),
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
      cellRenderer: (param: ICellRendererParams<AccessControlTableEntry>) => {
        const childGroupNames = param.data?.ownChildGroupNames ?? [];
        return `${childGroupNames.length} direkte Untergruppe(n)<br/><br/>${childGroupNames}`;
      },
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
  // Signal-backed: updated from the AG Grid selection-changed callback.
  protected selectedRows = signal<AccessControlTableEntry[]>([]);

  ngOnInit(): void {
    this.fetchAccessControlData(false);
  }

  private fetchAccessControlData(_useCache): void {
    this.loadingData.set(true);
    this.metadataBootstrap
      .fetchAccessControlMetadata(this.accessControlService.currentKeycloakLoginRoles)
      .then(() => this.setData(this.accessControlService.accessControl))
      .catch((error) => this.handleError(error));
  }

  private handleError(error: any) {
    this.notificationService.showError(
      'Die Daten konnten nicht geladen werden! Bitte versuchen Sie es später erneut.'
    );
    console.error(error);
    this.loadingData.set(false);
  }

  private setData(accessControl: AccessControlMetadata[]) {
    this.allAccessControl = (accessControl ?? []).map((dataItem: AccessControlTableEntry) => {
      const parentId = dataItem.parentId;
      let parentName = '';
      const parentObject = accessControl.filter((item) => item.organizationalUnitId == parentId)[0];
      if (parentObject && parentObject.name) {
        parentName = parentObject.name;
      }
      dataItem.parentName = parentName;

      const childrenIds = dataItem.children ?? [];

      const organizationalUnitChildrenUnits = childrenIds
        .map((id) => this.accessControlService.getAccessControlById(id))
        .filter((unit): unit is AccessControlMetadata => unit !== undefined)
        .map((id) => id.name);
      dataItem.ownChildGroupNames = organizationalUnitChildrenUnits;
      return dataItem as AccessControlTableEntry;
    });
    this.applyTableFilter();
    this.loadingData.set(false);
  }

  onTableViewSwitch(): void {
    this.applyTableFilter();
  }

  private applyTableFilter(): void {
    if (this.tableViewSwitcher) {
      this.rowData.set(this.allAccessControl.filter((entry) => entry.datasetOwner === true));
    } else {
      this.rowData.set([...this.allAccessControl]);
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
      .catch(() => {
        /* modal dismissed */
      });
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
      .catch(() => {
        /* modal dismissed */
      });
  }

  openDeleteModal(): void {
    const modalRef = this.modalService.open(RoleDeleteModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      size: 'lg',
    });

    modalRef.componentInstance.datasetsToDelete = this.selectedRows();

    modalRef.result
      .then((reloadData) => reloadData && this.fetchAccessControlData(false))
      .catch(() => {
        /* modal dismissed */
      });
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
      .catch(() => {
        /* modal dismissed */
      });
  }

  selectionChanged($event: SelectionChangedEvent<AccessControlTableEntry, any>) {
    this.selectedRows.set($event.api.getSelectedRows());
  }
}
