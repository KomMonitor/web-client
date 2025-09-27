import { Component, Inject, OnDestroy, OnInit, NgZone, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { GridOptions, ColDef, GridApi, ColumnApi, FirstDataRenderedEvent, ColumnResizedEvent, RowClickedEvent, GridReadyEvent } from 'ag-grid-community';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorDataGridHelperService } from 'services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { RoleDeleteModalComponent } from './roleDeleteModal/role-delete-modal.component';
import { RoleEditMetadataModalComponent } from './roleEditMetadataModal/role-edit-metadata-modal.component';
import { KommonitorRolePermissionService } from 'services/adminRoleUnit/kommonitor-role-permission.service';
import { RoleAddModalComponent } from './roleAddModal/role-add-modal.component';
import { RoleEditGroupRightsModalComponent } from './roleEditGroupRightsModal/role-edit-group-rights-modal.component';

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
  private lastClickedRowData: any | null = null;

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
    // Removed jQuery usage; AdminLTE boxWidget init skipped
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
      suppressRowClickSelection: false,
      rowSelection: 'multiple',
      rowMultiSelectWithClick: true,
      paginationPageSize: this.paginationPageSize,
      onGridReady: (params) => {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
      },
      onColumnResized: () => {
        this.headerHeightSetter();
      },
      onCellClicked: (event: any) => {
        try {
          try { console.log('[RoleMgmt] onCellClicked fired', event); } catch {}
          const nativeEvent = event && event.event ? event.event : null;
          const targetEl = nativeEvent && nativeEvent.target ? (nativeEvent.target as HTMLElement) : null;
          if (!targetEl) { try { console.log('[RoleMgmt] onCellClicked: no targetEl'); } catch {}; return; }
          const buttonEl = (targetEl as any).closest ? (targetEl as any).closest('button') : null;
          if (!buttonEl || !buttonEl.id) { try { console.log('[RoleMgmt] onCellClicked: no button id'); } catch {}; return; }
          const id: string = buttonEl.id as string;
          try { console.log('[RoleMgmt] onCellClicked: button id', id, 'disabled=', (buttonEl as any).disabled); } catch {}
          if ((buttonEl as any).disabled) { return; }
          if (id.startsWith('btn_role_editMetadata_')) {
            const roleId = id.split('_')[3];
            try { console.log('[RoleMgmt] Opening RoleEditMetadataModalComponent for', roleId); } catch {}
            const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
            this.zone.run(() => this.onClickEditMetadata(roleMetadata));
            return;
          }
          if (id.startsWith('btn_role_editGroupRight_')) {
            const roleId = id.split('_')[3];
            try { console.log('[RoleMgmt] Opening RoleEditGroupRightsModalComponent for', roleId); } catch {}
            const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
            this.zone.run(() => this.onClickEditGroupRights(roleMetadata));
            return;
          }
        } catch {}
      }
    } as GridOptions;
    // Remove invalid/legacy gridOptions properties that cause warnings
    try {
      if ((this.gridOptions as any).floatingFilter !== undefined) {
        delete (this.gridOptions as any).floatingFilter;
        console.log('[RoleMgmt] Removed invalid gridOptions.floatingFilter');
      }
    } catch {}
  }
  public onGridReady(event: GridReadyEvent): void {
    try { console.log('[RoleMgmt] onGridReady (template)'); } catch {}
    this.gridApi = event.api;
    this.columnApi = event.columnApi;
  }

  private buildAccessControlColumnDefs(): ColDef[] {
    const columnDefs: ColDef[] = [];
    // Dedicated selection checkbox column
    columnDefs.push({
      headerName: '',
      pinned: 'left',
      maxWidth: 50,
      width: 50,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      filter: false,
      sortable: false,
      suppressMenu: true,
      resizable: false
    });
    // Edit buttons column (only enabled if user has creator role for orga)
    columnDefs.push({ 
      headerName: 'Editierfunktionen', 
      pinned: 'left', 
      maxWidth: 150, 
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

    // Remove existing handlers first
    if ($) {
      $('#accessControlOverviewTable').off('click', '.roleEditMetadataBtn');
      $('#accessControlOverviewTable').off('click', '.roleEditGroupRightsBtn');
      $(document).off('click', '#accessControlOverviewTable .roleEditMetadataBtn');
      $(document).off('click', '#accessControlOverviewTable .roleEditGroupRightsBtn');
      try { console.log('[RoleMgmt] Binding delegated handlers on #accessControlOverviewTable (jQuery)'); } catch {}
    } else {
      try { console.log('[RoleMgmt] jQuery not found; binding native delegated handlers on #accessControlOverviewTable'); } catch {}
    }

    if ($) $('#accessControlOverviewTable').on('click', '.roleEditMetadataBtn', (event: any) => {
      try { console.log('[RoleMgmt] Click: .roleEditMetadataBtn (grid container)'); } catch {}
      event.stopPropagation();
      event.preventDefault();
      const button = $(event.target).closest('.roleEditMetadataBtn')[0];
      if (!button || (button as any).disabled) { try { console.log('[RoleMgmt] Edit metadata button disabled or missing'); } catch {}; return; }
      const id: string = button.id || '';
      const roleId = id.startsWith('btn_role_editMetadata_') ? id.slice('btn_role_editMetadata_'.length) : (id.split('_').pop() || '');
      try { console.log('[RoleMgmt] Resolved roleId from button:', roleId); } catch {}
      const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
      try { console.log('[RoleMgmt] Resolved roleMetadata:', !!roleMetadata, roleMetadata?.name); } catch {}
      this.zone.run(() => this.onClickEditMetadata(roleMetadata));
    });

    if ($) $('#accessControlOverviewTable').on('click', '.roleEditGroupRightsBtn', (event: any) => {
      try { console.log('[RoleMgmt] Click: .roleEditGroupRightsBtn (grid container)'); } catch {}
      event.stopPropagation();
      event.preventDefault();
      const button = $(event.target).closest('.roleEditGroupRightsBtn')[0];
      if (!button || (button as any).disabled) { try { console.log('[RoleMgmt] Edit group rights button disabled or missing'); } catch {}; return; }
      const id: string = button.id || '';
      const roleId = id.startsWith('btn_role_editGroupRight_') ? id.slice('btn_role_editGroupRight_'.length) : (id.split('_').pop() || '');
      try { console.log('[RoleMgmt] Resolved roleId from button:', roleId); } catch {}
      const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
      try { console.log('[RoleMgmt] Resolved roleMetadata for group rights:', !!roleMetadata, roleMetadata?.name); } catch {}
      this.zone.run(() => this.onClickEditGroupRights(roleMetadata));
    });

    // Document-level fallback delegation in case events don't bubble to the ag-grid host element
    if ($) $(document).on('click', '#accessControlOverviewTable .roleEditMetadataBtn', (event: any) => {
      try { console.log('[RoleMgmt] Click: .roleEditMetadataBtn (document fallback)'); } catch {}
      event.stopPropagation();
      event.preventDefault();
      const button = $(event.target).closest('.roleEditMetadataBtn')[0];
      if (!button || (button as any).disabled) { return; }
      const id: string = button.id || '';
      const roleId = id.startsWith('btn_role_editMetadata_') ? id.slice('btn_role_editMetadata_'.length) : (id.split('_').pop() || '');
      const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
      this.zone.run(() => this.onClickEditMetadata(roleMetadata));
    });

    if ($) $(document).on('click', '#accessControlOverviewTable .roleEditGroupRightsBtn', (event: any) => {
      try { console.log('[RoleMgmt] Click: .roleEditGroupRightsBtn (document fallback)'); } catch {}
      event.stopPropagation();
      event.preventDefault();
      const button = $(event.target).closest('.roleEditGroupRightsBtn')[0];
      if (!button || (button as any).disabled) { return; }
      const id: string = button.id || '';
      const roleId = id.startsWith('btn_role_editGroupRight_') ? id.slice('btn_role_editGroupRight_'.length) : (id.split('_').pop() || '');
      const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
      this.zone.run(() => this.onClickEditGroupRights(roleMetadata));
    });

    // Native delegated handler fallback (works without jQuery)
    const hostEl = document.getElementById('accessControlOverviewTable');
    if (hostEl) {
      hostEl.addEventListener('click', (evt: Event) => {
        const target = evt.target as HTMLElement;
        if (!target) { return; }
        const metaBtn = target.closest('.roleEditMetadataBtn') as HTMLElement | null;
        if (metaBtn) {
          try { console.log('[RoleMgmt] (native) Click: .roleEditMetadataBtn'); } catch {}
          evt.stopPropagation();
          evt.preventDefault();
          if ((metaBtn as any).disabled) { return; }
          const id: string = metaBtn.id || '';
          const roleId = id.startsWith('btn_role_editMetadata_') ? id.slice('btn_role_editMetadata_'.length) : (id.split('_').pop() || '');
          try { console.log('[RoleMgmt] (native) Resolved roleId:', roleId); } catch {}
          const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
          try { console.log('[RoleMgmt] (native) Resolved roleMetadata:', !!roleMetadata, roleMetadata?.name); } catch {}
          this.zone.run(() => this.onClickEditMetadata(roleMetadata));
          return;
        }
        const rightsBtn = target.closest('.roleEditGroupRightsBtn') as HTMLElement | null;
        if (rightsBtn) {
          try { console.log('[RoleMgmt] (native) Click: .roleEditGroupRightsBtn'); } catch {}
          evt.stopPropagation();
          evt.preventDefault();
          if ((rightsBtn as any).disabled) { return; }
          const id: string = rightsBtn.id || '';
          const roleId = id.startsWith('btn_role_editGroupRight_') ? id.slice('btn_role_editGroupRight_'.length) : (id.split('_').pop() || '');
          try { console.log('[RoleMgmt] (native) Resolved roleId:', roleId); } catch {}
          const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
          try { console.log('[RoleMgmt] (native) Resolved roleMetadata:', !!roleMetadata, roleMetadata?.name); } catch {}
          this.zone.run(() => this.onClickEditGroupRights(roleMetadata));
        }
      });
    }

    // Add a global native delegated handler as a final fallback (no jQuery required)
    const globalFlag = '__roleMgmtDocClickHandlersBound';
    const w = window as any;
    if (!w[globalFlag]) {
      try { console.log('[RoleMgmt] Binding global document-level native delegated handlers'); } catch {}
      document.addEventListener('click', (evt: Event) => {
        const target = evt.target as HTMLElement | null;
        if (!target) { return; }
        const metaBtn = target.closest('.roleEditMetadataBtn') as HTMLElement | null;
        if (metaBtn) {
          evt.stopPropagation();
          evt.preventDefault();
          if ((metaBtn as any).disabled) { return; }
          const id: string = metaBtn.id || '';
          const roleId = id.startsWith('btn_role_editMetadata_') ? id.slice('btn_role_editMetadata_'.length) : (id.split('_').pop() || '');
          const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
          this.zone.run(() => this.onClickEditMetadata(roleMetadata));
          return;
        }
        const rightsBtn = target.closest('.roleEditGroupRightsBtn') as HTMLElement | null;
        if (rightsBtn) {
          evt.stopPropagation();
          evt.preventDefault();
          if ((rightsBtn as any).disabled) { return; }
          const id: string = rightsBtn.id || '';
          const roleId = id.startsWith('btn_role_editGroupRight_') ? id.slice('btn_role_editGroupRight_'.length) : (id.split('_').pop() || '');
          const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
          this.zone.run(() => this.onClickEditGroupRights(roleMetadata));
        }
      });
      w[globalFlag] = true;
    }

    // Capture-phase native delegated handler as a safeguard if bubbling is prevented by AG Grid internals
    const captureFlag = '__roleMgmtDocClickHandlersCaptureBound';
    if (!w[captureFlag]) {
      try { console.log('[RoleMgmt] Binding global document-level native delegated handlers (capture phase)'); } catch {}
      document.addEventListener('click', (evt: Event) => {
        const target = evt.target as HTMLElement | null;
        if (!target) { return; }
        const metaBtn = target.closest('.roleEditMetadataBtn') as HTMLElement | null;
        if (metaBtn) {
          evt.stopPropagation();
          evt.preventDefault();
          if ((metaBtn as any).disabled) { return; }
          const id: string = metaBtn.id || '';
          const roleId = id.startsWith('btn_role_editMetadata_') ? id.slice('btn_role_editMetadata_'.length) : (id.split('_').pop() || '');
          const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
          this.zone.run(() => this.onClickEditMetadata(roleMetadata));
          return;
        }
        const rightsBtn = target.closest('.roleEditGroupRightsBtn') as HTMLElement | null;
        if (rightsBtn) {
          evt.stopPropagation();
          evt.preventDefault();
          if ((rightsBtn as any).disabled) { return; }
          const id: string = rightsBtn.id || '';
          const roleId = id.startsWith('btn_role_editGroupRight_') ? id.slice('btn_role_editGroupRight_'.length) : (id.split('_').pop() || '');
          const roleMetadata = this.kommonitorDataExchangeService.getAccessControlById(roleId);
          this.zone.run(() => this.onClickEditGroupRights(roleMetadata));
        }
      }, { capture: true });
      w[captureFlag] = true;
    }
  }

  public onClickDeleteDatasets(): void {
    try { console.log('[RoleMgmt] Delete clicked'); } catch {}
    let selectedDatasets: any[] = [];
    try {
      if (this.gridApi) {
        const byRows = (this.gridApi as any).getSelectedRows ? (this.gridApi as any).getSelectedRows() : [];
        if (byRows && byRows.length > 0) {
          selectedDatasets = byRows;
          try { console.log('[RoleMgmt] Selected rows', byRows.length); } catch {}
        } else {
          const selectedNodes = this.gridApi.getSelectedNodes ? this.gridApi.getSelectedNodes() : [];
          try { console.log('[RoleMgmt] Selected nodes', selectedNodes.length); } catch {}
          selectedDatasets = (selectedNodes || []).map((node: any) => node.data).filter(Boolean);
        }
        // If nothing is selected, try to use the focused row
        if ((!selectedDatasets || selectedDatasets.length === 0)) {
          const focused = this.gridApi.getFocusedCell && this.gridApi.getFocusedCell();
          try { console.log('[RoleMgmt] Focused cell', focused); } catch {}
          if (focused && typeof focused.rowIndex === 'number') {
            const rowNode = this.gridApi.getDisplayedRowAtIndex && this.gridApi.getDisplayedRowAtIndex(focused.rowIndex);
            if (rowNode && rowNode.data) {
              selectedDatasets = [rowNode.data];
            }
          }
        }
        // As another fallback, scan nodes for isSelected
        if ((!selectedDatasets || selectedDatasets.length === 0) && (this.gridApi as any).forEachNode) {
          const tmp: any[] = [];
          (this.gridApi as any).forEachNode((node: any) => { if (node && node.isSelected && node.isSelected()) { tmp.push(node.data); } });
          if (tmp.length > 0) { selectedDatasets = tmp; }
        }
        // Final fallback: read from DOM selected rows and map back by displayed index
        if ((!selectedDatasets || selectedDatasets.length === 0)) {
          try {
            const host = document.getElementById('accessControlOverviewTable');
            if (host) {
              const selectedRowEls = host.querySelectorAll('.ag-row.ag-row-selected, .ag-row[aria-selected="true"]');
              const domSelected: any[] = [];
              selectedRowEls.forEach((el: Element) => {
                const asAny = el as any;
                const rowIndexAttr = (asAny.getAttribute && (asAny.getAttribute('row-index') || asAny.getAttribute('row-id') || asAny.getAttribute('data-row-index'))) || null;
                const idx = rowIndexAttr !== null ? parseInt(rowIndexAttr, 10) : NaN;
                if (!Number.isNaN(idx) && (this.gridApi as any).getDisplayedRowAtIndex) {
                  const rowNode = (this.gridApi as any).getDisplayedRowAtIndex(idx);
                  if (rowNode && rowNode.data) {
                    domSelected.push(rowNode.data);
                  }
                }
              });
              if (domSelected.length > 0) {
                selectedDatasets = domSelected;
                try { console.log('[RoleMgmt] DOM-based selected rows', domSelected.length); } catch {}
              }
            }
          } catch {}
        }
      }
    } catch {}
    // Fallback: if no selection was registered, but a row was clicked, use it
    if ((!selectedDatasets || selectedDatasets.length === 0) && this.lastClickedRowData) {
      try { console.log('[RoleMgmt] Using last clicked row fallback'); } catch {}
      selectedDatasets = [this.lastClickedRowData];
    }
    // Normalize to full access control records
    if (selectedDatasets && selectedDatasets.length > 0) {
      try {
        selectedDatasets = (selectedDatasets || [])
          .map((d: any) => d && d.organizationalUnitId ? (this.kommonitorDataExchangeService.getAccessControlById(d.organizationalUnitId) || d) : d)
          .filter(Boolean);
        console.log('[RoleMgmt] Normalized datasets to access control records', selectedDatasets.length);
      } catch {}
    }

    // Always open modal, even with zero selection (legacy behavior shows empty message in modal)
    try {
      console.log('[RoleMgmt] Datasets to delete', (selectedDatasets || []).map(d => `${d?.name} (${d?.organizationalUnitId})`));
    } catch {}
    const modalRef = this.modalService.open(RoleDeleteModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'role-add-modal',
      windowClass: 'role-add-modal-window'
    });
    try { console.log('[RoleMgmt] Opened RoleDeleteModalComponent'); } catch {}
    // Pass datasets via input and also call the initializer for compatibility
    if ((modalRef as any).componentInstance) {
      (modalRef as any).componentInstance.initialDatasets = selectedDatasets || [];
      if (typeof (modalRef as any).componentInstance.onDeleteOrganizationalUnit === 'function') {
        setTimeout(() => {
          try { console.log('[RoleMgmt] Passing datasets to modal', selectedDatasets?.length || 0); } catch {}
          (modalRef as any).componentInstance.onDeleteOrganizationalUnit(selectedDatasets || []);
        }, 0);
      }
    }
    modalRef.result.then(() => {
      this.initializeOrRefreshOverviewTable();
    }).catch(() => {});
    try { console.log('[RoleMgmt] Modal opened and datasets passed, leaving loadingData unchanged'); } catch {}
  }

  public onClickCreateRole(): void {
    this.modalService.open(RoleAddModalComponent, {
      // omit size to avoid Bootstrap max-width caps
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'role-add-modal',
      windowClass: 'role-add-modal-window'
    }).result.then(() => {
      this.initializeOrRefreshOverviewTable();
    }).catch(() => {});
  }

  // Aliases and shared modal openers to mirror spatial units flow
  public openAddRoleModal(): void {
    this.onClickCreateRole();
  }

  public onClickEditMetadata(organizationalUnit: any): void {
    try { console.log('[RoleMgmt] onClickEditMetadata invoked for', organizationalUnit?.organizationalUnitId, organizationalUnit?.name); } catch {}
    const modalRef = this.modalService.open(RoleEditMetadataModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'role-add-modal',
      windowClass: 'role-add-modal-window'
    });
    try { console.log('[RoleMgmt] RoleEditMetadataModalComponent opened'); } catch {}
    const parentUnit = organizationalUnit && organizationalUnit.parentId ? this.kommonitorDataExchangeService.getAccessControlById(organizationalUnit.parentId) : null;
    (modalRef as any).componentInstance.current = { ...(organizationalUnit || {}) };
    (modalRef as any).componentInstance.old = { name: organizationalUnit && organizationalUnit.name };
    (modalRef as any).componentInstance.parentOrganizationalUnit = parentUnit || null;
    setTimeout(() => {
      if (typeof (modalRef as any).componentInstance.resetRoleEditMetadataForm === 'function') {
        try { console.log('[RoleMgmt] Calling resetRoleEditMetadataForm on modal'); } catch {}
        (modalRef as any).componentInstance.resetRoleEditMetadataForm();
      }
    }, 0);
    modalRef.result.then(() => {
      try { console.log('[RoleMgmt] RoleEditMetadataModal closed with success; refreshing table'); } catch {}
      this.initializeOrRefreshOverviewTable();
    }).catch(() => {});
  }

  public onClickEditGroupRights(organizationalUnit: any): void {
    try { console.log('[RoleMgmt] onClickEditGroupRights invoked for', organizationalUnit?.organizationalUnitId, organizationalUnit?.name); } catch {}
    const modalRef = this.modalService.open(RoleEditGroupRightsModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'role-add-modal',
      windowClass: 'role-add-modal-window'
    });
    try { console.log('[RoleMgmt] RoleEditGroupRightsModal opened'); } catch {}
    // Pass data via component instance (no broadcast)
    (modalRef as any).componentInstance.current = { ...(organizationalUnit || {}) };
    modalRef.result.then(() => {
      try { console.log('[RoleMgmt] RoleEditGroupRightsModal closed with success; refreshing table'); } catch {}
      this.initializeOrRefreshOverviewTable();
    }).catch(() => {});
  }

  // Grid event handlers for template usage if needed
  public onFirstDataRendered(event: FirstDataRenderedEvent): void {
    this.headerHeightSetter();
    // Ensure delegated click handlers are bound after grid render (mirrors spatial units component)
    this.registerClickHandler_accessControl();
  }

  public onColumnResized(event: ColumnResizedEvent): void {
    this.headerHeightSetter();
  }

  public headerHeightSetter(): void {
    if (this.gridApi) {
      const headerHeight = this.headerHeightGetter();
      try {
        if ((this.gridApi as any).setGridOption) {
          (this.gridApi as any).setGridOption('headerHeight', headerHeight);
        } else if ((this.gridApi as any).updateGridOptions) {
          (this.gridApi as any).updateGridOptions({ headerHeight });
        } else if ((this.gridApi as any).setHeaderHeight) {
          // Fallback for older versions
          (this.gridApi as any).setHeaderHeight(headerHeight);
        }
      } catch {}
    }
  }

  public onRowClicked(event: RowClickedEvent): void {
    this.lastClickedRowData = event?.data || null;
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


