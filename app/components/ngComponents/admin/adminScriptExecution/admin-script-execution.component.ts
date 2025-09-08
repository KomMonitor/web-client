import { Component, OnDestroy, OnInit } from '@angular/core';
import { GridOptions, ColDef } from 'ag-grid-community';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';
import { KommonitorScriptExecutionDataExchangeService } from 'services/adminScriptUnit/kommonitor-script-execution-data-exchange.service';
import { KommonitorScriptExecutionDataGridHelperService } from 'services/adminScriptUnit/kommonitor-script-execution-data-grid-helper.service';

interface JobHealth {
  queueStatus?: string;
  newestJobId?: number;
  succeededJobs?: number;
  failedJobs?: number;
  activeJobs?: number;
  waitingJobs?: number;
  delayedJobs?: number;
}

@Component({
  selector: 'admin-script-execution-new',
  templateUrl: './admin-script-execution.component.html',
  styleUrls: ['./admin-script-execution.component.css']
})
export class AdminScriptExecutionComponent implements OnInit, OnDestroy {
  loadingData: boolean = true;

  defaultComputationJobHealth: JobHealth = {};
  customizedComputationJobHealth: JobHealth = {};

  defaultJobs: any[] = [];
  customizedJobs: any[] = [];

  defaultJobsGridOptions: GridOptions = {};
  customizedJobsGridOptions: GridOptions = {};

  defaultJobsColumnDefs: ColDef[] = [];
  customizedJobsColumnDefs: ColDef[] = [];

  private subs: Subscription[] = [];

  constructor(
    private dataExchange: KommonitorDataExchangeService,
    private scriptExchange: KommonitorScriptExecutionDataExchangeService,
    private gridHelper: KommonitorScriptExecutionDataGridHelperService
  ) {}

  ngOnInit(): void {
    this.setupColumns();
    // initialize base grid options; rowData/columnDefs bound in template
    this.defaultJobsGridOptions = this.gridHelper.buildGridOptions(this.defaultJobsColumnDefs, []);
    this.customizedJobsGridOptions = this.gridHelper.buildGridOptions(this.customizedJobsColumnDefs, []);
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  refresh(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loadingData = true;
    console.debug('[AdminScriptExecution] Loading all data...');
    const s = forkJoin({
      defaultHealth: this.scriptExchange.fetchDefaultIndicatorJobHealth(),
      customizedHealth: this.scriptExchange.fetchCustomizedIndicatorJobHealth(),
      defaultJobs: this.scriptExchange.fetchDefaultIndicatorJobs(),
      customizedJobs: this.scriptExchange.fetchCustomizedIndicatorJobs()
    }).subscribe({
      next: res => {
        console.debug('[AdminScriptExecution] API responses received', {
          defaultHealth: res?.defaultHealth,
          customizedHealth: res?.customizedHealth,
          defaultJobsCount: Array.isArray(res?.defaultJobs) ? res.defaultJobs.length : 'n/a',
          customizedJobsCount: Array.isArray(res?.customizedJobs) ? res.customizedJobs.length : 'n/a'
        });
        this.defaultComputationJobHealth = res.defaultHealth || {};
        this.customizedComputationJobHealth = res.customizedHealth || {};
        this.defaultJobs = this.sortJobs(res.defaultJobs || []);
        this.customizedJobs = this.sortJobs(res.customizedJobs || []);
        console.debug('[AdminScriptExecution] Sorted jobs', {
          defaultJobsCount: this.defaultJobs.length,
          customizedJobsCount: this.customizedJobs.length
        });
        // rowData is bound in template; assigning to arrays triggers grid update
        console.debug('[AdminScriptExecution] Grid rowData set', {
          defaultRows: this.defaultJobs.length,
          customizedRows: this.customizedJobs.length
        });
        this.loadingData = false;
      },
      error: _ => {
        console.error('[AdminScriptExecution] Error while loading data');
        this.loadingData = false;
      }
    });
    this.subs.push(s);
  }

  private setupColumns(): void {
    this.defaultJobsColumnDefs = this.gridHelper.buildDefaultJobsColumnDefs();
    this.customizedJobsColumnDefs = this.gridHelper.buildCustomizedJobsColumnDefs();
  }


  private sortJobs(arr: any[]): any[] { return (arr || []).sort((a: any, b: any) => (b?.jobId || 0) - (a?.jobId || 0)); }

}


