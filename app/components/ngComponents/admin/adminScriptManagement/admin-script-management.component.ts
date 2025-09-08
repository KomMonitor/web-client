import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { GridApi, GridOptions, ColDef } from 'ag-grid-community';
import { KommonitorScriptManagementDataGridHelperService } from 'services/script-management/kommonitor-script-management-data-grid-helper.service';
import { KommonitorScriptManagementDataExchangeService } from 'services/script-management/kommonitor-script-management-data-exchange.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ScriptAddModalComponent } from './scriptAddModal/script-add-modal.component';
import { ScriptDeleteModalComponent } from './scriptDeleteModal/script-delete-modal.component';

declare const $: any;

@Component({
  selector: 'admin-script-management-new',
  templateUrl: './admin-script-management.component.html',
  styleUrls: ['./admin-script-management.component.css']
})
export class AdminScriptManagementComponent implements OnInit, OnDestroy {

  loadingData: boolean = true;
  availableScriptDatasets: any[] = [];
  private subscriptions: Subscription[] = [];
  scriptsGridOptions: GridOptions = {};
  scriptsColumnDefs: ColDef[] = [];
  scriptsDefaultColDef: ColDef = {};
  gridApi: GridApi | null = null;
  paginationPageSize: number = 10;
  paginationPageSizeSelector: number[] = [10, 25, 50, 100];

  constructor(
    private zone: NgZone,
    private broadcastService: BroadcastService,
    private scriptExchange: KommonitorScriptManagementDataExchangeService,
    private gridHelper: KommonitorScriptManagementDataGridHelperService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    // initialize any adminLTE box widgets
    try { (window as any).$('.box').boxWidget(); } catch {}

    // Make component available for debugging if needed
    (window as any).adminScriptManagementComponent = this;

    // Build column defs
    this.scriptsColumnDefs = this.gridHelper.buildScriptsColumnDefs();

    // Listen for metadata loading events
    const sub = this.broadcastService.currentBroadcastMsg.subscribe(data => {
      if (data.msg === 'initialMetadataLoadingCompleted') {
        this.zone.run(() => {
          setTimeout(() => this.initializeOrRefreshOverviewTable(), 250);
        });
      } else if (data.msg === 'initialMetadataLoadingFailed') {
        this.zone.run(() => { this.loadingData = false; });
      } else if (data.msg === 'refreshScriptOverviewTable') {
        this.zone.run(() => {
          const crudType = (data as any).values?.crudType;
          const scriptId = (data as any).values?.scriptId;
          this.refreshScriptOverviewTable(crudType, scriptId);
        });
      }
    });
    this.subscriptions.push(sub);

    // Proactively fetch and build in case data is already present but broadcast not fired
    console.debug('[AdminScriptManagement] ngOnInit -> initial fetch/build');
    setTimeout(() => this.refreshScriptOverviewTable(), 0);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
    if ((window as any).adminScriptManagementComponent === this) {
      delete (window as any).adminScriptManagementComponent;
    }
  }

  initializeOrRefreshOverviewTable(): void {
    console.debug('[AdminScriptManagement] initializeOrRefreshOverviewTable');
    this.loadingData = true;
    const scripts = this.scriptExchange?.availableProcessScripts || [];
    console.debug('[AdminScriptManagement] availableProcessScripts length:', Array.isArray(scripts) ? scripts.length : 0);
    this.availableScriptDatasets = JSON.parse(JSON.stringify(scripts));

    try {
      this.scriptsGridOptions = this.gridHelper.buildGridOptions(this.scriptsColumnDefs, this.availableScriptDatasets);
      this.scriptsDefaultColDef = (this.scriptsGridOptions as any).defaultColDef || {};
      // Align pagination behavior with spatial units grid: set page size and selector on GridOptions
      this.scriptsGridOptions = {
        ...this.scriptsGridOptions,
        paginationPageSize: this.paginationPageSize,
        paginationPageSizeSelector: this.paginationPageSizeSelector
      } as GridOptions;
    } catch (e) {}
    this.loadingData = false;
  }

  refreshScriptOverviewTable(crudType?: string, targetScriptId?: string): void {
    console.debug('[AdminScriptManagement] refreshScriptOverviewTable', { crudType, targetScriptId });
    this.loadingData = true;
    if (!crudType || !targetScriptId) {
      this.scriptExchange.fetchIndicatorScriptsMetadata(
        this.scriptExchange.currentKeycloakLoginRoles
      ).then(() => {
        console.debug('[AdminScriptManagement] fetchIndicatorScriptsMetadata success');
        this.initializeOrRefreshOverviewTable();
        this.loadingData = false;
      }).catch(() => {
        console.error('[AdminScriptManagement] fetchIndicatorScriptsMetadata failed');
        this.loadingData = false;
      });
      return;
    }

    if (crudType === 'add') {
      this.scriptExchange
        .addSingleProcessScriptMetadata(
          this.scriptExchange.getProcessScriptMetadataById(targetScriptId)
        );
      this.initializeOrRefreshOverviewTable();
      this.loadingData = false;
    } else if (crudType === 'edit') {
      // Replace with latest fetched metadata
      this.scriptExchange.replaceSingleProcessScriptMetadata(
        this.scriptExchange.getProcessScriptMetadataById(targetScriptId)
      );
      this.initializeOrRefreshOverviewTable();
      this.loadingData = false;
    } else if (crudType === 'delete') {
      if (Array.isArray(targetScriptId)) {
        for (const id of targetScriptId) {
          this.scriptExchange.deleteSingleProcessScriptMetadata(id);
        }
      } else {
        this.scriptExchange.deleteSingleProcessScriptMetadata(targetScriptId);
      }
      this.initializeOrRefreshOverviewTable();
      this.loadingData = false;
    } else {
      this.loadingData = false;
    }
  }

  onClickDeleteDatasets(): void {
    this.loadingData = true;
    let markedEntriesForDeletion: any[] = [];
    try { markedEntriesForDeletion = this.gridHelper.getSelectedScriptsFromApi(this.gridApi); } catch {}

    const modalRef = this.modalService.open(ScriptDeleteModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'script-delete-modal',
      windowClass: 'script-delete-modal-window'
    });
    if ((modalRef as any).componentInstance && typeof (modalRef as any).componentInstance.onDeleteScripts === 'function') {
      setTimeout(() => {
        (modalRef as any).componentInstance.onDeleteScripts(markedEntriesForDeletion);
      }, 0);
    }
    modalRef.result.then(() => {
      this.initializeOrRefreshOverviewTable();
    }).catch(() => {});
    this.loadingData = false;
  }

  onGridReady(event: any): void {
    try { this.gridApi = event?.api || null; } catch { this.gridApi = null; }
    console.debug('[AdminScriptManagement] onGridReady set gridApi:', !!this.gridApi);
    if (this.gridApi) {
      try { this.gridApi.paginationSetPageSize(this.paginationPageSize); } catch {}
    }
  }

  onPaginationPageSizeChanged(newPageSize: number): void {
    this.paginationPageSize = Number(newPageSize);
    // Keep GridOptions in sync for built-in pagination panel controls
    if (this.scriptsGridOptions) {
      (this.scriptsGridOptions as any).paginationPageSize = this.paginationPageSize;
      (this.scriptsGridOptions as any).paginationPageSizeSelector = this.paginationPageSizeSelector;
    }
    if (this.gridApi) {
      this.gridApi.paginationSetPageSize(this.paginationPageSize);
    }
  }

  goToPrevPage(): void { if (this.gridApi) { this.gridApi.paginationGoToPreviousPage(); } }
  goToNextPage(): void { if (this.gridApi) { this.gridApi.paginationGoToNextPage(); } }

  get currentPage(): number { try { return (this.gridApi?.paginationGetCurrentPage?.() || 0) + 1; } catch { return 0; } }
  get totalPages(): number { try { return this.gridApi?.paginationGetTotalPages?.() || 0; } catch { return 0; } }

  checkCreatePermission(): boolean {
    try { return !!this.scriptExchange.checkCreatePermission(); } catch { return false; }
  }

  checkDeletePermission(): boolean {
    try { return !!this.scriptExchange.checkDeletePermission(); } catch { return false; }
  }

  onClickCreateScript(): void {
    const modalRef = this.modalService.open(ScriptAddModalComponent, {
      backdrop: true,
      keyboard: false,
      container: 'body',
      animation: false,
      modalDialogClass: 'script-add-modal modal-xl',
      windowClass: 'script-add-modal-window'
    });
    modalRef.result.then(() => {
      this.initializeOrRefreshOverviewTable();
    }).catch(() => {});
  }
}






