import { Component, OnInit, inject } from '@angular/core';
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

@Component({
  selector: 'app-admin-script-execution',
  templateUrl: './admin-script-execution.component.html',
  styleUrls: ['./admin-script-execution.component.scss'],
  imports: [
    AdminContentViewComponent,
    ExpandableBoxComponent,
    SmallBoxComponent,
    LoadingOverlayComponent,
    AgGridAngular,
  ],
  standalone: true,
})
export class AdminScriptExecutionComponent implements OnInit {
  private scriptExecutionService = inject(AdminScriptExecutionService);
  private indicatorValueService = inject(IndicatorValueService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private kommonitorDataGridHelperService = inject(KommonitorDataGridHelperService);

  protected defaultIndicatorJobHealth: IndicatorJobHealth | undefined;
  protected customizedIndicatorJobHealth: IndicatorJobHealth | undefined;
  protected errorOccurred = false;
  protected defaultIndicatorJobs: IndicatorJob[] | undefined;
  protected customizedIndicatorJobs: IndicatorJob[] | undefined;

  protected loadingData = true;

  public columnDefs: ColDef[] = [
    {
      headerName: 'Job-Id',
      field: 'jobId',
      pinned: 'left',
      maxWidth: 125,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
    },
    {
      headerName: 'Script-Id',
      field: 'jobData.scriptId',
      pinned: 'left',
      maxWidth: 125,
    },
    {
      headerName: 'Ziel-Indikator',
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
    { headerName: 'Job-Status', field: 'status', maxWidth: 125 },
    { headerName: 'Job-Fortschritt', field: 'progress', maxWidth: 125 },
    {
      headerName: 'Job-Data',
      field: 'jobData',
      minWidth: 500,
      cellRenderer: (params) => this.indicatorValueService.syntaxHighlightJSON(params.data.jobData),
      filter: 'agTextColumnFilter',
    },
    {
      field: 'logs',
      headerName: 'Job-Logs',
      maxWidth: 160,
      cellRenderer: JobLogsCellRendererComponent,
      filter: 'agTextColumnFilter',
    },
    {
      headerName: 'Job-Summary',
      minWidth: 1000,
      cellRenderer: JobSummaryCellRendererComponent,
      filter: 'agTextColumnFilter',
      filterValueGetter: (params) => JSON.stringify(params.data.spatialUnitIntegrationSummary),
    },
  ];
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
    this.loadData();
  }

  loadData() {
    this.loadingData = true;
    this.errorOccurred = false;

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
      .pipe(finalize(() => (this.loadingData = false)))
      .subscribe({
        next: (result) => {
          this.defaultIndicatorJobHealth = result.defaultHealth;
          this.customizedIndicatorJobHealth = result.customizedHealth;

          this.defaultIndicatorJobs = (result.defaultJobs || []).sort(
            (a, b) => Number.parseInt(b.jobId) - Number.parseInt(a.jobId)
          );

          this.customizedIndicatorJobs = (result.customizedJobs || []).sort(
            (a, b) => Number.parseInt(b.jobId) - Number.parseInt(a.jobId)
          );
        },
        error: (error) => {
          console.error('Error fetching job data:', error);
          this.errorOccurred = true;
        },
      });
  }

  refreshJobOverviewTable() {
    this.loadData();
  }
}
