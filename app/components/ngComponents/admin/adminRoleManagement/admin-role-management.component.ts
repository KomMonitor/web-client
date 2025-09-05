import { Component, Inject, OnDestroy, OnInit, NgZone, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { GridOptions, ColDef, GridApi, ColumnApi, FirstDataRenderedEvent, ColumnResizedEvent } from 'ag-grid-community';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { RoleDeleteModalComponent } from './roleDeleteModal/role-delete-modal.component';
import { KommonitorRolePermissionService } from 'services/adminRoleUnit/kommonitor-role-permission.service';
import { RoleAddModalComponent } from './roleAddModal/role-add-modal.component';

declare const $: any;

@Component({
  selector: 'admin-role-management-new',
  templateUrl: './admin-role-management.component.html',
  styleUrls: ['./admin-role-management.component.css']
})
export class AdminRoleManagementComponent implements OnInit, OnDestroy {
  @ViewChild('accessControlOverviewTable', { static: true }) accessControlOverviewTable!: AgGridAngular;

  public loadingData: boolean = true;
  public initializationCompleted: boolean = false;
  public tableViewSwitcher: boolean = false;

  // AG Grid properties
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public defaultColDef: ColDef = {};
  public gridOptions: GridOptions = {};
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;

  // Pagination properties
  public paginationPageSize: number = 10;
  public paginationPageSizeSelector: number[] = [10, 25, 50, 100];

  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private zone: NgZone,
    private modalService: NgbModal,
    private broadcastService: BroadcastService,
    public kommonitorDataExchangeService: KommonitorDataExchangeService,
    public kommonitorRolePermissionService: KommonitorRolePermissionService,
    private kommonitorDataGridHelperService: KommonitorDataGridHelperService
  ) {}

  ngOnInit(): void {
    if (typeof $ !== 'undefined' && $ && $.fn && $.fn.boxWidget) {
      $('.box').boxWidget();
    }

    // Subscribe to loading state
    const loadingSub = this.kommonitorDataExchangeService.loading$.subscribe(loading => {
      this.loadingData = loading;
    });
    this.subscriptions.push(loadingSub);

    // Subscribe to access control data
    const acSub = this.kommonitorDataExchangeService.accessControl$.subscribe(accessControl => {
      if (accessControl && accessControl.length > 0) {
        this.loadingData = false;
        this.initializationCompleted = true;
        this.buildDataGrid_accessControl(accessControl);
      }
    });
    this.subscriptions.push(acSub);

    // Listen for refresh requests
    const bcSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'initialMetadataLoadingCompleted') {
        this.zone.run(() => this.initializeOrRefreshOverviewTable());
      } else if (data.msg === 'refreshAccessControlTable') {
        const values: any = data?.values || {};
        this.zone.run(() => this.refreshAccessControlTable(values.crudType, values.targetId));
      } else if (data.msg === 'onDeleteOrganizationalUnit') {
        this.modalService.open(RoleDeleteModalComponent, {
          size: 'xl',
          backdrop: 'static',
          keyboard: false,
          container: 'body',
          animation: false
        });
      }
    });
    this.subscriptions.push(bcSub);

    // Initial fetch
    this.fetchAccessControlData();
    setTimeout(() => {
      if (this.loadingData) {
        this.fetchAccessControlData();
        if (!this.kommonitorDataExchangeService.accessControl || this.kommonitorDataExchangeService.accessControl.length === 0) {
          this.loadingData = false;
          this.initializationCompleted = true;
        }
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  public initializeOrRefreshOverviewTable(): void {
    this.loadingData = true;
    this.fetchAccessControlData();
  }

  private fetchAccessControlData(): void {
    this.kommonitorDataExchangeService.fetchAccessControlMetadata().subscribe({
      next: () => {
        // handled by accessControl$ subscription
      },
      error: () => {
        this.loadingData = false;
        this.initializationCompleted = true;
      }
    });
  }

  public refreshAccessControlTable(crudType?: string, targetId?: string | string[]): void {
    this.loadingData = true;
    if (!crudType || !targetId) {
      this.kommonitorDataExchangeService.fetchAccessControlMetadata().subscribe({
        next: () => {
          this.initializeOrRefreshOverviewTable();
          this.loadingData = false;
        },
        error: () => {
          this.loadingData = false;
        }
      });
    } else if (crudType && targetId) {
      if (crudType === 'delete') {
        this.initializeOrRefreshOverviewTable();
        this.loadingData = false;
      } else {
        this.kommonitorDataExchangeService.fetchAccessControlMetadata().subscribe({
          next: () => {
            this.initializeOrRefreshOverviewTable();
            this.loadingData = false;
          },
          error: () => {
            this.loadingData = false;
          }
        });
      }
    }
  }

  private buildDataGrid_accessControl(accessControlMetadataArray: any[]): void {
    // Build column defs and row data to mirror legacy AngularJS grid
    this.columnDefs = this.buildAccessControlColumnDefs();
    const toDisplay = this.getFilteredAccessControl(accessControlMetadataArray);
    this.rowData = this.buildAccessControlRowData(toDisplay);
    this.defaultColDef = this.kommonitorDataGridHelperService.buildRoleManagementDefaultColDef();

    this.gridOptions = {
      ...this.kommonitorDataGridHelperService.buildRoleManagementGridOptionsPublic(),
      columnDefs: this.columnDefs,
      rowData: this.rowData,
      paginationPageSize: this.paginationPageSize,
      onGridReady: (params) => {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
      },
      onFirstDataRendered: () => {
        this.headerHeightSetter();
        this.registerClickHandler_accessControl();
      },
      onColumnResized: () => {
        this.headerHeightSetter();
      }
    } as GridOptions;
  }

  private buildAccessControlColumnDefs(): ColDef[] {
    const columnDefs: ColDef[] = [];
    // Edit buttons column (only enabled if user has creator role for orga)
    columnDefs.push({ 
      headerName: 'Editierfunktionen', 
      pinned: 'left', 
      maxWidth: 150, 
      checkboxSelection: (params: any) => {
        const roles: string[] = params?.data?.userAdminRoles || [];
        return roles.includes('client-users-creator') || roles.includes('unit-users-creator');
      },
      filter: false, 
      sortable: false, 
      cellRenderer: this.displayEditButtons_accessControl.bind(this)
    });

    columnDefs.push(
      { 
        headerName: 'Organisationseinheit', 
        field: 'name', 
        pinned: 'left', 
        minWidth: 250,
        cellClass: 'user-roles-normal'
      },
      { headerName: 'Hierarchie - übergeordnete Organisationseinheit', field: 'parentName', maxWidth: 250 },
      { 
        headerName: 'Hierarchie - direkt untergeordnete Organisationseinheiten', 
        maxWidth: 250,
        filter: false,
        cellRenderer: (param: any) => {
          const count = param?.data?.ownChildGroupsCount || 0;
          const names = (param?.data?.ownChildGroupNames || []).join(', ');
          return `${count} direkte Untergruppe(n)<br/><br/>${names}`;
        }
      },
      { headerName: 'Beschreibung', field: 'description', maxWidth: 300 },
      { headerName: 'Kontakt', field: 'contact', maxWidth: 300 },
      { headerName: 'Mandant', field: 'mandant', maxWidth: 125 }
    );

    return columnDefs;
  }

  // Toggle handler from template
  public onTableViewSwitch(): void {
    this.initializeOrRefreshOverviewTable();
  }

  // Filter to only show editable (creator) organizational units when toggled
  private getFilteredAccessControl(accessControlMetadataArray: any[]): any[] {
    if (!this.tableViewSwitcher) {
      return accessControlMetadataArray || [];
    }
    try {
      return (accessControlMetadataArray || []).filter((e: any) => {
        const roles: string[] = e?.userAdminRoles || [];
        return Array.isArray(roles) && (roles.includes('unit-users-creator') || roles.includes('client-users-creator'));
      });
    } catch {
      return accessControlMetadataArray || [];
    }
  }

  private buildAccessControlRowData(dataArray: any[]): any[] {
    return (dataArray || []).map((dataItem: any) => {
      const parentId = dataItem.parentId;
      let parentName = '';
      const parentObject = (dataArray || []).find((item: any) => item.organizationalUnitId === parentId);
      if (parentObject && parentObject.name) {
        parentName = parentObject.name;
      }
      dataItem.parentName = parentName;

      dataItem.ownChildGroupsCount = (dataItem.children || []).length;
      const organizationalUnitChildrenUnits = (dataItem.children || [])
        .map((id: string) => this.kommonitorDataExchangeService.getAccessControlById(id))
        .filter((o: any) => !!o)
        .map((o: any) => o.name);
      dataItem.ownChildGroupNames = organizationalUnitChildrenUnits;
      return dataItem;
    });
  }

  private displayEditButtons_accessControl(params: any): string {
    const data = params.data;
    let html = '<div class="btn-group btn-group-sm">';
    const hasCreator = (data?.userAdminRoles || []).includes('client-users-creator') || (data?.userAdminRoles || []).includes('unit-users-creator');
    html += '<button id="btn_role_editMetadata_' + data.organizationalUnitId + '" class="btn btn-warning btn-sm roleEditMetadataBtn" type="button" title="Metadaten editieren" ' +  (hasCreator ? '' : 'disabled') + '><i class="fas fa-pencil-alt"></i></button>';
    html += '<button id="btn_role_editGroupRight_' + data.organizationalUnitId + '" class="btn btn-warning btn-sm roleEditGroupRightsBtn" type="button" title="Gruppenspezifische Rechte editieren" ' +  (hasCreator ? '' : 'disabled') + '><i class="fas fa-user-lock"></i></button>';
    html += '</div>';
    return html;
  }

  private registerClickHandler_accessControl(): void {
    const $: any = (window as any).$ || (window as any).jQuery || undefined;
    if (!$) { return; }

    // Remove existing handlers first
    $('#accessControlOverviewTable').off('click', '.roleEditMetadataBtn');
    $('#accessControlOverviewTable').off('click', '.roleEditGroupRightsBtn');

    $('#accessControlOverviewTable').on('click', '.roleEditMetadataBtn', (event: any) => {
      event.stopPropagation();
      event.preventDefault();
      const button = $(event.target).closest('.roleEditMetadataBtn')[0];
      const roleId = button.id.split('_')[3];
      const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
      this.zone.run(() => {
        this.broadcastService.broadcast('onEditOrganizationalUnitMetadata', roleMetadata);
      });
    });

    $('#accessControlOverviewTable').on('click', '.roleEditGroupRightsBtn', (event: any) => {
      event.stopPropagation();
      event.preventDefault();
      const button = $(event.target).closest('.roleEditGroupRightsBtn')[0];
      const roleId = button.id.split('_')[3];
      const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
      this.zone.run(() => {
        this.broadcastService.broadcast('onEditOrganizationalUnitGroupRights', roleMetadata);
      });
    });
  }

  public onClickDeleteDatasets(): void {
    this.loadingData = true;
    const selectedNodes = this.gridApi ? this.gridApi.getSelectedNodes() : [];
    const selectedDatasets = selectedNodes.map(node => node.data);
    this.broadcastService.broadcast('onDeleteOrganizationalUnit', selectedDatasets);
    this.loadingData = false;
  }

  public onClickCreateRole(): void {
    this.modalService.open(RoleAddModalComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false
    }).result.then(() => {
      this.initializeOrRefreshOverviewTable();
    }).catch(() => {});
  }

  // Grid event handlers for template usage if needed
  public onFirstDataRendered(event: FirstDataRenderedEvent): void {
    this.headerHeightSetter();
  }

  public onColumnResized(event: ColumnResizedEvent): void {
    this.headerHeightSetter();
  }

  public headerHeightSetter(): void {
    if (this.gridApi) {
      const headerHeight = this.headerHeightGetter();
      this.gridApi.setHeaderHeight(headerHeight);
    }
  }

  private headerHeightGetter(): number {
    const headerElement = document.querySelector('.ag-header');
    if (headerElement) {
      const headerTextElements = headerElement.querySelectorAll('.ag-header-cell-text');
      let maxHeight = 0;
      headerTextElements.forEach(element => {
        const height = (element as HTMLElement).scrollHeight;
        if (height > maxHeight) {
          maxHeight = height;
        }
      });
      return Math.max(maxHeight + 20, 50);
    }
    return 50;
  }
}


