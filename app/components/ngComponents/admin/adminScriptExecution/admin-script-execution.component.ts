import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { SmallBoxComponent } from '../adminDashboardManagement/small-box/small-box.component';
import {
  AdminScriptExecutionService,
  IndicatorJob,
  IndicatorJobHealth,
} from './admin-script-execution.service';
import { JobLogsCellRendererComponent } from './job-logs-cell-renderer.component';
import { JobSummaryCellRendererComponent } from './job-summary-cell-renderer.component';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridOptions } from 'ag-grid-community';
import { IndicatorValueService } from '../../../../services/indicator-value-service/indicator-value.service';
import { IndicatorMetadataStoreService } from '../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { KommonitorDataGridHelperService } from '../../../../services/adminSpatialUnit/kommonitor-data-grid-helper.service';
import { LoadingOverlayComponent } from '../../common/loading-overlay/loading-overlay.component';

import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-admin-script-execution',
  templateUrl: './admin-script-execution.component.html',
  styleUrls: ['./admin-script-execution.component.scss'],
  imports: [
    TranslateModule,
    AdminContentViewComponent,
    ExpandableBoxComponent,
    SmallBoxComponent,
    LoadingOverlayComponent,
    AgGridAngular,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminScriptExecutionComponent implements OnInit {
  private scriptExecutionService = inject(AdminScriptExecutionService);
  private indicatorValueService = inject(IndicatorValueService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);
  private translate = inject(TranslateService);

  // Signals: all filled from the forkJoin subscription (OnPush).
  protected defaultIndicatorJobHealth = signal<IndicatorJobHealth | undefined>(undefined);
  protected customizedIndicatorJobHealth = signal<IndicatorJobHealth | undefined>(undefined);
  protected errorOccurred = signal(false);
  protected defaultIndicatorJobs = signal<IndicatorJob[] | undefined>(undefined);
  protected customizedIndicatorJobs = signal<IndicatorJob[] | undefined>(undefined);

  protected loadingData = signal(true);

  // Assigned in ngOnInit rather than here: the headers resolve through
  // translate.instant(). Both job grids bind this same array.
  public columnDefs: ColDef[] = [];

  private buildColumnDefs(): ColDef[] {
    return [
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_JOB_ID'),
        field: 'jobId',
        pinned: 'left',
        maxWidth: 125,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_SCRIPT_ID'),
        field: 'jobData.scriptId',
        pinned: 'left',
        maxWidth: 125,
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_TARGET_INDICATOR'),
        pinned: 'left',
        maxWidth: 250,
        cellRenderer: (params) => {
          if (params.data.jobData && params.data.jobData.targetIndicatorId) {
            const indicatorMetadata = this.indicatorStore.getIndicatorMetadataById(
              params.data.jobData.targetIndicatorId
            );
            if (indicatorMetadata) {
              return indicatorMetadata.indicatorName;
            }
          }
          return '';
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => {
          if (params.data.jobData && params.data.jobData.targetIndicatorId) {
            const indicatorMetadata = this.indicatorStore.getIndicatorMetadataById(
              params.data.jobData.targetIndicatorId
            );
            if (indicatorMetadata) {
              return indicatorMetadata.indicatorName;
            }
          }
          return '';
        },
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_JOB_STATUS'),
        field: 'status',
        maxWidth: 125,
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_JOB_PROGRESS'),
        field: 'progress',
        maxWidth: 125,
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_JOB_DATA'),
        field: 'jobData',
        minWidth: 500,
        cellRenderer: (params) =>
          this.indicatorValueService.syntaxHighlightJSON(params.data.jobData),
        filter: 'agTextColumnFilter',
      },
      {
        field: 'logs',
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_JOB_LOGS'),
        maxWidth: 160,
        cellRenderer: JobLogsCellRendererComponent,
        filter: 'agTextColumnFilter',
      },
      {
        headerName: this.translate.instant('ADMIN_SCRIPTS.GRID.COL_JOB_SUMMARY'),
        minWidth: 1000,
        cellRenderer: JobSummaryCellRendererComponent,
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => JSON.stringify(params.data.spatialUnitIntegrationSummary),
      },
    ];
  }

  public defaultColDef: ColDef = this.kommonitorDataGridHelperService.buildDefaultColDef();
  public gridOptions: GridOptions = {
    suppressRowClickSelection: true,
    rowSelection: 'multiple',
    enableCellTextSelection: true,
    ensureDomOrder: true,
    pagination: true,
    paginationPageSize: 10,
    paginationPageSizeSelector: [10, 25, 50, 100],
    suppressColumnVirtualisation: true,
  };

  public paginationPageSize: number = 10;
  public paginationPageSizeSelector: number[] = [10, 25, 50, 100];

  ngOnInit() {
    this.columnDefs = this.buildColumnDefs();
    this.loadData();
  }

  loadData() {
    this.loadingData.set(true);
    this.errorOccurred.set(false);

    const defaultHealth$ = this.scriptExecutionService.getDefaultIndicatorJobHealth();
    const customizedHealth$ = this.scriptExecutionService.getCustomizedIndicatorJobHealth();
    const defaultJobs$ = this.scriptExecutionService.getDefaultIndicatorJobs();
    const customizedJobs$ = this.scriptExecutionService.getCustomizedIndicatorJobs();

    forkJoin({
      defaultHealth: defaultHealth$,
      customizedHealth: customizedHealth$,
      defaultJobs: defaultJobs$,
      customizedJobs: customizedJobs$,
    })
      .pipe(finalize(() => this.loadingData.set(false)))
      .subscribe({
        next: (result) => {
          this.defaultIndicatorJobHealth.set(result.defaultHealth);
          this.customizedIndicatorJobHealth.set(result.customizedHealth);

          this.defaultIndicatorJobs.set(
            (result.defaultJobs || []).sort(
              (a, b) => Number.parseInt(b.jobId) - Number.parseInt(a.jobId)
            )
          );

          this.customizedIndicatorJobs.set(
            (result.customizedJobs || []).sort(
              (a, b) => Number.parseInt(b.jobId) - Number.parseInt(a.jobId)
            )
          );
        },
        error: (error) => {
          console.error('Error fetching job data:', error);
          this.errorOccurred.set(true);
        },
      });
  }

  refreshJobOverviewTable() {
    this.loadData();
  }
}
