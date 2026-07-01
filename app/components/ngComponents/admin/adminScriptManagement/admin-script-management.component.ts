import { Component, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { Subscription, skip } from 'rxjs';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { KommonitorDataGridHelperService } from '../../../../services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { ScriptGeoresourcesCellRendererComponent } from './script-georesources-cell-renderer.component';
import { ScriptIndicatorsCellRendererComponent } from './script-indicators-cell-renderer.component';
import { ScriptProcessParametersCellRendererComponent } from './script-process-parameters-cell-renderer.component';
import { ScriptRefreshRequest } from './script-refresh.model';
import { ScriptAddModalComponent } from './scriptAddModal/script-add-modal.component';
import { ScriptDeleteModalComponent } from './scriptDeleteModal/script-delete-modal.component';

@Component({
  selector: 'app-admin-script-management',
  templateUrl: './admin-script-management.component.html',
  styleUrls: ['./admin-script-management.component.scss'],
  imports: [AgGridAngular, FormsModule, AdminContentViewComponent],
  standalone: true,
})
export class AdminScriptManagementComponent implements OnInit, OnDestroy {
  private zone = inject(NgZone);
  private modalService = inject(NgbModal);
  metadataBootstrap = inject(MetadataBootstrapService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  public loadingData: boolean = true;
  public initializationCompleted: boolean = false;

  public defaultColDef: ColDef = this.kommonitorDataGridHelperService.buildDefaultColDef();
  public columnDefs: ColDef[] = [];
  public rowData: any[] = [];
  public gridOptions: GridOptions = this.kommonitorDataGridHelperService.buildGridOptions();
  public selectedRows: any[] = [];

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.buildColumnDefs();
    this.setupEventListeners();

    // Render immediately when scripts are already cached; otherwise trigger a
    // fetch. The metadataLoading$ subscription additionally covers the case
    // where the initial app-wide metadata load completes while this view is
    // already open.
    if (this.processScriptStore.availableProcessScripts?.length) {
      this.initializeOrRefreshOverviewTable();
    } else {
      this.ensureDataLoaded();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private async ensureDataLoaded(): Promise<void> {
    if (this.processScriptStore.availableProcessScripts?.length) {
      return;
    }
    try {
      await this.metadataBootstrap.fetchIndicatorScriptsMetadata();
      this.initializeOrRefreshOverviewTable();
    } catch (error) {
      console.error('Error fetching process scripts:', error);
    } finally {
      // A component-triggered fetch does not drive metadataLoading$, so the
      // loading state is cleared here regardless of the result — including the
      // empty case, which would otherwise leave the spinner running.
      this.loadingData = false;
      this.initializationCompleted = true;
    }
  }

  private buildColumnDefs(): void {
    this.columnDefs = [
      {
        headerName: 'Id',
        field: 'scriptId',
        pinned: 'left',
        maxWidth: 125,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
      },
      { headerName: 'Name', field: 'name', pinned: 'left', maxWidth: 300 },
      {
        headerName: 'Ziel-Indikatoren-Id',
        field: 'indicatorId',
        maxWidth: 125,
      },
      {
        headerName: 'Ziel-Indikatoren-Name',
        minWidth: 200,
        valueGetter: (params: any) =>
          (this.indicatorStore.getIndicatorMetadataById(params.data?.indicatorId) as any)
            ?.indicatorName ?? '',
        filter: 'agTextColumnFilter',
      },
      { headerName: 'Beschreibung', field: 'description', minWidth: 300 },
      {
        headerName: 'notwendige Basis-Indikatoren',
        minWidth: 300,
        cellRenderer: ScriptIndicatorsCellRendererComponent,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) =>
          params.data?.requiredIndicatorIds?.join(', ') ?? 'keine',
      },
      {
        headerName: 'notwendige Basis-Georessourcen',
        minWidth: 300,
        cellRenderer: ScriptGeoresourcesCellRendererComponent,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) =>
          params.data?.requiredGeoresourceIds?.join(', ') ?? 'keine',
      },
      {
        headerName: 'Prozessparameter',
        minWidth: 600,
        cellRenderer: ScriptProcessParametersCellRendererComponent,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) =>
          params.data?.variableProcessParameters
            ? JSON.stringify(params.data.variableProcessParameters)
            : 'keine',
      },
    ];
  }

  private setupEventListeners(): void {
    // React to metadata loading state transitions. skip(1) drops the
    // BehaviorSubject's replayed current value so this keeps the original
    // one-shot semantics of the former broadcast events.
    const loadingSub = this.metadataBootstrap.metadataLoading$.pipe(skip(1)).subscribe((state) => {
      if (state === MetadataLoadingState.COMPLETE) {
        this.zone.run(() => {
          this.initializeOrRefreshOverviewTable();
        });
      } else if (state === MetadataLoadingState.ERROR) {
        this.zone.run(() => {
          this.loadingData = false;
        });
      }
    });
    this.subscriptions.push(loadingSub);
  }

  // Handles a modal's refreshRequested output; replaces the former
  // RefreshScriptOverviewTable broadcast round-trip.
  private handleRefreshRequest(request: ScriptRefreshRequest): void {
    this.loadingData = true;
    this.refreshScriptOverviewTable(request.crudType, request.scriptId);
  }

  public initializeOrRefreshOverviewTable(): void {
    const scripts = this.processScriptStore.availableProcessScripts;
    if (scripts && scripts.length >= 0) {
      this.loadingData = false;
      this.initializationCompleted = true;
      this.rowData = scripts;
    } else {
      this.loadingData = true;
      this.initializationCompleted = false;
    }
  }

  public refreshScriptOverviewTable(crudType?: string, scriptId?: string | string[]): void {
    if (!crudType || !scriptId) {
      this.metadataBootstrap
        .fetchIndicatorScriptsMetadata()
        .then(() => {
          this.initializeOrRefreshOverviewTable();
          this.loadingData = false;
        })
        .catch(() => {
          this.loadingData = false;
        });
    } else if (crudType === 'delete') {
      const idsToDelete = Array.isArray(scriptId) ? scriptId : [scriptId];
      for (const id of idsToDelete) {
        this.processScriptStore.deleteSingleProcessScriptMetadata(id);
      }
      this.initializeOrRefreshOverviewTable();
      this.loadingData = false;
    } else {
      // For add/edit: re-fetch all scripts
      this.metadataBootstrap
        .fetchIndicatorScriptsMetadata()
        .then(() => {
          this.initializeOrRefreshOverviewTable();
          this.loadingData = false;
        })
        .catch(() => {
          this.loadingData = false;
        });
    }
  }

  public onSelectionChanged(): void {
    if (this.agGrid?.api) {
      this.selectedRows = this.agGrid.api.getSelectedRows();
    }
  }

  public onClickAddScript(): void {
    // if (!this.metadataBootstrap.checkCreatePermission()) return;
    const modalRef = this.modalService.open(ScriptAddModalComponent, {
      // modalDialogClass: "modal-medium",
      size: 'xl',
      backdrop: 'static',
    });
    (modalRef.componentInstance as ScriptAddModalComponent).refreshRequested.subscribe(
      (request: ScriptRefreshRequest) => this.handleRefreshRequest(request)
    );
  }

  public onClickDeleteScripts(): void {
    const selectedScripts = this.agGrid?.api?.getSelectedRows() || [];
    if (selectedScripts.length === 0) return;

    const modalRef = this.modalService.open(ScriptDeleteModalComponent, {
      size: 'lg',
      backdrop: 'static',
    });
    const modalComponent = modalRef.componentInstance as ScriptDeleteModalComponent;
    modalComponent.datasetsToDelete = JSON.parse(JSON.stringify(selectedScripts));
    modalComponent.refreshRequested.subscribe((request: ScriptRefreshRequest) =>
      this.handleRefreshRequest(request)
    );
  }
}
