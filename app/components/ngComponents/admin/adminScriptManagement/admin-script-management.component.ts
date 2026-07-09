import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';

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
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { KommonitorDataGridHelperService } from '../../../../services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { ScriptIdNameTableCellRendererComponent } from './script-id-name-table-cell-renderer.component';
import { ScriptProcessParametersCellRendererComponent } from './script-process-parameters-cell-renderer.component';
import { ScriptRefreshRequest } from './script-refresh.model';
import { ScriptAddModalComponent } from './scriptAddModal/script-add-modal.component';
import { ScriptDeleteModalComponent } from './scriptDeleteModal/script-delete-modal.component';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-admin-script-management',
  templateUrl: './admin-script-management.component.html',
  styleUrls: ['./admin-script-management.component.scss'],
  imports: [TranslateModule, AgGridAngular, FormsModule, AdminContentViewComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminScriptManagementComponent implements OnInit, OnDestroy {
  private zone = inject(NgZone);
  private modalService = inject(NgbModal);
  metadataBootstrap = inject(MetadataBootstrapService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);

  @ViewChild(AgGridAngular) agGrid!: AgGridAngular;

  // Signal-backed: written from async paths (metadata fetches, store
  // subscription, modal refresh requests) that would not trigger a re-render
  // of this OnPush component otherwise.
  public loadingData = signal(true);
  public initializationCompleted: boolean = false;

  public defaultColDef: ColDef = this.kommonitorDataGridHelperService.buildDefaultColDef();
  public columnDefs: ColDef[] = [];
  // Signal-backed: rebuilt after async metadata fetches.
  public rowData = signal<any[]>([]);
  public gridOptions: GridOptions = this.kommonitorDataGridHelperService.buildGridOptions();
  // Signal-backed: updated from AG Grid's selectionChanged callback, which
  // does not mark this OnPush component dirty by itself.
  public selectedRows = signal<any[]>([]);

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
      this.loadingData.set(false);
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
        cellRenderer: ScriptIdNameTableCellRendererComponent,
        cellRendererParams: {
          idsField: 'requiredIndicatorIds',
          resolveName: (id: string) =>
            (this.indicatorStore.getIndicatorMetadataById(id) as any)?.indicatorName ?? '',
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) =>
          params.data?.requiredIndicatorIds?.join(', ') ?? 'keine',
      },
      {
        headerName: 'notwendige Basis-Georessourcen',
        minWidth: 300,
        cellRenderer: ScriptIdNameTableCellRendererComponent,
        cellRendererParams: {
          idsField: 'requiredGeoresourceIds',
          resolveName: (id: string) =>
            (this.georesourceStore.getGeoresourceMetadataById(id) as any)?.datasetName ?? '',
        },
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
          this.loadingData.set(false);
        });
      }
    });
    this.subscriptions.push(loadingSub);
  }

  // Handles a modal's refreshRequested output; replaces the former
  // RefreshScriptOverviewTable broadcast round-trip.
  private handleRefreshRequest(request: ScriptRefreshRequest): void {
    this.loadingData.set(true);
    this.refreshScriptOverviewTable(request.crudType, request.scriptId);
  }

  public initializeOrRefreshOverviewTable(): void {
    // The store always exposes a (possibly empty) array, so the table can render
    // immediately; there is no "not ready" state to guard against here.
    this.rowData.set(this.processScriptStore.availableProcessScripts);
    this.loadingData.set(false);
    this.initializationCompleted = true;
  }

  public refreshScriptOverviewTable(crudType?: string, scriptId?: string | string[]): void {
    // Delete can be applied to the store locally without a round-trip.
    if (crudType === 'delete' && scriptId) {
      const idsToDelete = Array.isArray(scriptId) ? scriptId : [scriptId];
      for (const id of idsToDelete) {
        this.processScriptStore.deleteSingleProcessScriptMetadata(id);
      }
      this.initializeOrRefreshOverviewTable();
      this.loadingData.set(false);
      return;
    }

    // Add and full refreshes re-fetch all scripts.
    this.metadataBootstrap
      .fetchIndicatorScriptsMetadata()
      .then(() => {
        this.initializeOrRefreshOverviewTable();
        this.loadingData.set(false);
      })
      .catch(() => {
        this.loadingData.set(false);
      });
  }

  public onSelectionChanged(): void {
    if (this.agGrid?.api) {
      this.selectedRows.set(this.agGrid.api.getSelectedRows());
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
    modalComponent.datasetsToDelete = structuredClone(selectedScripts);
    modalComponent.refreshRequested.subscribe((request: ScriptRefreshRequest) =>
      this.handleRefreshRequest(request)
    );
  }
}
