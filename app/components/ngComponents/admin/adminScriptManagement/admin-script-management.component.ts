import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions, SelectionChangedEvent } from 'ag-grid-community';
import { ProcessSchedule } from 'components/ngComponents/models/schedules.models';
import { Subscription, skip } from 'rxjs';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { JobOverviewService } from 'services/job-overview-service/job-overview.service';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { ProcessCatalogStoreService } from 'services/process-catalog-store-service/process-catalog-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { ScheduleExecutionService } from 'services/schedule-execution-service/schedule-execution.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { KommonitorDataGridHelperService } from '../../../../services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { ExpandableBoxComponent } from '../../common/expandable-box/expandable-box.component';
import { LoadingOverlayComponent } from '../../common/loading-overlay/loading-overlay.component';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { JobOverviewModalComponent } from '../adminScriptExecution/jobOverviewModal/job-overview-modal.component';
import { AdminModalService } from '../adminShared/modal/admin-modal.service';
import { ScheduleIntervalCellRendererComponent } from './schedule-interval-cell-renderer.component';
import { ScheduleLastJobCellRendererComponent } from './schedule-last-job-cell-renderer.component';
import { ScheduleMethodologyCellRendererComponent } from './schedule-methodology-cell-renderer.component';
import { ScheduleSpatialUnitsCellRendererComponent } from './schedule-spatial-units-cell-renderer.component';
import { ScheduleTargetIndicatorCellRendererComponent } from './schedule-target-indicator-cell-renderer.component';
import { ScheduleTargetTimesCellRendererComponent } from './schedule-target-times-cell-renderer.component';
import { ScriptRefreshRequest } from './script-refresh.model';
import { ScriptAddModalComponent } from './scriptAddModal/script-add-modal.component';
import { ScriptDeleteModalComponent } from './scriptDeleteModal/script-delete-modal.component';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MODAL_CONFIRM, MODAL_WIDE } from 'util/modal-presets';
@Component({
  selector: 'app-admin-script-management',
  templateUrl: './admin-script-management.component.html',
  imports: [
    TranslateModule,
    AgGridAngular,
    FormsModule,
    AdminContentViewComponent,
    ExpandableBoxComponent,
    LoadingOverlayComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminScriptManagementComponent implements OnInit, OnDestroy {
  private zone = inject(NgZone);
  private modals = inject(AdminModalService);
  metadataBootstrap = inject(MetadataBootstrapService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private processCatalogStore = inject(ProcessCatalogStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private jobOverviewService = inject(JobOverviewService);
  private executionService = inject(ScheduleExecutionService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);
  private translate = inject(TranslateService);

  // Signal-backed: written from async paths (metadata fetches, store
  // subscription, modal refresh requests) that would not trigger a re-render
  // of this OnPush component otherwise.
  public loadingData = signal(true);
  public initializationCompleted: boolean = false;

  /**
   * The two toggles above the table. Ids are off by default because they are
   * only useful when talking to support; the methodology text is on.
   */
  public showScriptIds = signal(false);
  public showProcessDescription = signal(true);

  public defaultColDef: ColDef = {
    ...this.kommonitorDataGridHelperService.buildDefaultColDef(),
    // Same correction the group overview applies: several headers here are
    // longer than the column they sit in ("Ziel-Indik…"), and wrapping adapts
    // to the label length instead of requiring a width guess per translation.
    wrapHeaderText: true,
    autoHeaderHeight: true,
  };
  // Signal-backed: rebuilt when a toggle flips.
  public columnDefs = signal<ColDef[]>([]);
  // Signal-backed: rebuilt after async metadata fetches.
  public rowData = signal<ProcessSchedule[]>([]);
  public gridOptions: GridOptions = this.kommonitorDataGridHelperService.buildGridOptions();
  // Signal-backed: updated from AG Grid's selectionChanged callback, which
  // does not mark this OnPush component dirty by itself.
  public selectedRows = signal<ProcessSchedule[]>([]);

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.rebuildColumnDefs();
    this.setupEventListeners();

    // Render immediately when schedules are already cached; otherwise trigger a
    // fetch. The metadataLoading$ subscription additionally covers the case
    // where the initial app-wide metadata load completes while this view is
    // already open.
    if (this.processScriptStore.availableProcessScripts?.length) {
      this.initializeOrRefreshOverviewTable();
      void this.loadJobs();
    } else {
      this.ensureDataLoaded();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public onToggleScriptIds(): void {
    this.showScriptIds.update((value) => !value);
    this.rebuildColumnDefs();
  }

  public onToggleProcessDescription(): void {
    this.showProcessDescription.update((value) => !value);
    this.rebuildColumnDefs();
  }

  private async ensureDataLoaded(): Promise<void> {
    if (this.processScriptStore.availableProcessScripts?.length) {
      return;
    }
    try {
      await this.metadataBootstrap.fetchIndicatorScriptsMetadata();
      this.initializeOrRefreshOverviewTable();
      await this.loadJobs();
    } catch (error) {
      console.error('Error fetching process schedules:', error);
    } finally {
      // A component-triggered fetch does not drive metadataLoading$, so the
      // loading state is cleared here regardless of the result — including the
      // empty case, which would otherwise leave the spinner running.
      this.loadingData.set(false);
      this.initializationCompleted = true;
    }
  }

  /**
   * Jobs for the "last execution" column. Loaded once for the whole table
   * instead of per row, and after the table is already visible — the column
   * fills in when the answer arrives.
   */
  private async loadJobs(): Promise<void> {
    await this.jobOverviewService.loadRows();
    // The renderers read the service, so the rows have to be handed to the grid
    // again for the column to pick the jobs up.
    this.rowData.set([...this.rowData()]);
  }

  private rebuildColumnDefs(): void {
    this.columnDefs.set(this.buildColumnDefs());
  }

  private buildColumnDefs(): ColDef[] {
    const columns: ColDef[] = [
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_TARGET_INDICATOR_NAME'),
        pinned: 'left',
        minWidth: 250,
        maxWidth: 320,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        cellRenderer: ScheduleTargetIndicatorCellRendererComponent,
        cellRendererParams: {
          onExecute: (schedule: ProcessSchedule) => this.onClickExecuteSchedule(schedule),
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => this.targetIndicatorName(params.data as ProcessSchedule),
      },
    ];

    if (this.showScriptIds()) {
      columns.push(
        {
          headerName: this.translate.instant('ADMIN_SHARED.ID'),
          field: 'scheduleID',
          pinned: 'left',
          maxWidth: 125,
        },
        {
          headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_TARGET_INDICATOR_ID'),
          maxWidth: 125,
          valueGetter: (params) =>
            (params.data as ProcessSchedule)?.inputs?.target_indicator_id ?? '',
        }
      );
    }

    columns.push({
      headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_COMPUTATION_TYPE'),
      maxWidth: 200,
      valueGetter: (params) =>
        this.processCatalogStore.getProcessTitleByApiName(
          (params.data as ProcessSchedule)?.processID
        ),
      filter: 'agTextColumnFilter',
    });

    if (this.showProcessDescription()) {
      columns.push({
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_METHODOLOGY'),
        minWidth: 300,
        cellRenderer: ScheduleMethodologyCellRendererComponent,
        filter: 'agTextColumnFilter',
        // Filters on the plain text, so a search for a word does not have to
        // compete with the markup around it.
        filterValueGetter: (params) => this.processDescription(params.data as ProcessSchedule),
      });
    }

    columns.push(
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_LAST_JOB'),
        maxWidth: 200,
        cellRenderer: ScheduleLastJobCellRendererComponent,
        cellRendererParams: {
          onShowJobs: (schedule: ProcessSchedule) => this.onClickShowJobs(schedule),
        },
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_EXECUTION_INTERVAL'),
        maxWidth: 220,
        cellRenderer: ScheduleIntervalCellRendererComponent,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => (params.data as ProcessSchedule)?.scheduleCron ?? '',
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_TARGET_TIMES'),
        maxWidth: 200,
        cellRenderer: ScheduleTargetTimesCellRendererComponent,
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_TARGET_SPATIAL_UNITS'),
        minWidth: 180,
        cellRenderer: ScheduleSpatialUnitsCellRendererComponent,
        cellRendererParams: {
          showIds: () => this.showScriptIds(),
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => this.spatialUnitLevels(params.data as ProcessSchedule),
      }
    );

    return columns;
  }

  private targetIndicatorName(schedule: ProcessSchedule | undefined): string {
    const indicatorId = schedule?.inputs?.target_indicator_id as string | undefined;
    return indicatorId
      ? (this.indicatorStore.getIndicatorMetadataById(indicatorId)?.indicatorName ?? '')
      : '';
  }

  private processDescription(schedule: ProcessSchedule | undefined): string {
    const indicatorId = schedule?.inputs?.target_indicator_id as string | undefined;
    const metadata = indicatorId
      ? this.indicatorStore.getIndicatorMetadataById(indicatorId)
      : undefined;
    // Tags stripped: this feeds the column filter, not the display.
    const description = metadata?.processDescription;
    return description
      ? description
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : this.translate.instant('ADMIN_SCRIPTS.GRID.METHODOLOGY_UNAVAILABLE');
  }

  private spatialUnitLevels(schedule: ProcessSchedule | undefined): string {
    const ids = (schedule?.inputs?.target_spatial_units ?? []) as string[];
    return ids
      .map((id) => this.spatialUnitStore.getSpatialUnitMetadataById(id)?.spatialUnitLevel ?? id)
      .join(', ');
  }

  private setupEventListeners(): void {
    // React to metadata loading state transitions. skip(1) drops the
    // BehaviorSubject's replayed current value so this keeps the original
    // one-shot semantics of the former broadcast events.
    const loadingSub = this.metadataBootstrap.metadataLoading$.pipe(skip(1)).subscribe((state) => {
      if (state === MetadataLoadingState.COMPLETE) {
        this.zone.run(() => {
          this.initializeOrRefreshOverviewTable();
          void this.loadJobs();
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
    this.rowData.set(this.displayableSchedules());
    this.loadingData.set(false);
    this.initializationCompleted = true;
  }

  /**
   * Hides schedules the current user cannot fully see: either the target
   * indicator or one of the target spatial units is outside their permissions.
   * Showing them would produce rows full of unresolvable ids.
   */
  private displayableSchedules(): ProcessSchedule[] {
    return this.processScriptStore.availableProcessScripts.filter((schedule) => {
      const indicatorId = schedule.inputs?.target_indicator_id as string | undefined;
      if (!indicatorId || !this.indicatorStore.getIndicatorMetadataById(indicatorId)) {
        return false;
      }
      const spatialUnitIds = (schedule.inputs?.target_spatial_units ?? []) as string[];
      return spatialUnitIds.every((id) => !!this.spatialUnitStore.getSpatialUnitMetadataById(id));
    });
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

    // Add and full refreshes re-fetch all schedules.
    this.metadataBootstrap
      .fetchIndicatorScriptsMetadata()
      .then(() => {
        this.initializeOrRefreshOverviewTable();
        this.loadingData.set(false);
        return this.loadJobs();
      })
      .catch(() => {
        this.loadingData.set(false);
      });
  }

  // Reads the selection off the event rather than a view query: the grid
  // lives in a projected ng-template. Same shape as the group overview.
  public onSelectionChanged(event: SelectionChangedEvent): void {
    this.selectedRows.set(event.api.getSelectedRows());
  }

  /** Starts a run outside the cron plan; the service reports how it went. */
  public async onClickExecuteSchedule(schedule: ProcessSchedule): Promise<void> {
    try {
      await this.executionService.triggerExecution(schedule);
    } catch {
      // The service already notified the user; nothing to add here.
    }
  }

  /** Opens the shared job overview, filtered to this schedule's jobs. */
  public onClickShowJobs(schedule: ProcessSchedule): void {
    void this.modals.open(JobOverviewModalComponent, MODAL_WIDE, {
      rows: this.jobOverviewService.getRowsForSchedule(schedule),
      titleText: this.translate.instant('ADMIN_SCRIPTS.EXECUTION.MODAL_TITLE_SCHEDULE', {
        indicatorName: this.targetIndicatorName(schedule),
      }),
      accent: 'primary',
    });
  }

  public onClickAddScript(): void {
    // if (!this.metadataBootstrap.checkCreatePermission()) return;
    this.modals.open(ScriptAddModalComponent, MODAL_WIDE, (modal) =>
      modal.refreshRequested.subscribe((request) => this.handleRefreshRequest(request))
    );
  }

  public onClickDeleteScripts(): void {
    const selectedScripts = this.selectedRows();
    if (selectedScripts.length === 0) return;

    this.modals.open(ScriptDeleteModalComponent, MODAL_CONFIRM, (modal) => {
      modal.datasetsToDelete = structuredClone(selectedScripts);
      modal.refreshRequested.subscribe((request) => this.handleRefreshRequest(request));
    });
  }
}
