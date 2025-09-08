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
    const s = forkJoin({
      defaultHealth: this.scriptExchange.fetchDefaultIndicatorJobHealth(),
      customizedHealth: this.scriptExchange.fetchCustomizedIndicatorJobHealth(),
      defaultJobs: this.scriptExchange.fetchDefaultIndicatorJobs(),
      customizedJobs: this.scriptExchange.fetchCustomizedIndicatorJobs()
    }).subscribe({
      next: res => {
        this.defaultComputationJobHealth = res.defaultHealth || {};
        this.customizedComputationJobHealth = res.customizedHealth || {};
        this.defaultJobs = this.sortJobs(res.defaultJobs || []);
        this.customizedJobs = this.sortJobs(res.customizedJobs || []);
        this.defaultJobsGridOptions = this.gridHelper.buildGridOptions(this.defaultJobsColumnDefs, this.defaultJobs);
        this.customizedJobsGridOptions = this.gridHelper.buildGridOptions(this.customizedJobsColumnDefs, this.customizedJobs);
        this.loadingData = false;
      },
      error: _ => {
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

  private buildLogsRenderer(prefix: string) {
    return (params: any) => {
      try {
        const logs = params?.data?.logs;
        if (!logs) { return 'Dieser Job umfasst keine Logs'; }
        const logJSON = JSON.stringify(logs);
        const blob = new Blob([logJSON], { type: 'application/json' });
        const dataUrl = URL.createObjectURL(blob);
        const fileName = `${prefix}${params.data.jobId}-Logs.json`;
        return `<a href="${dataUrl}" download="${fileName}" target="_blank" rel="noopener noreferrer"><button class="btn btn-warning btn-sm">Download Logs</button></a>`;
      } catch { return 'Dieser Job umfasst keine Logs'; }
    };
  }

  private renderDefaultJobSummary(params: any): string {
    try {
      const summary = params?.data?.spatialUnitIntegrationSummary;
      if (!summary || summary.length === 0) {
        return 'Dieser Job umfasst keine Informationen zur erfolgreichen/gescheiterten Datenintegration';
      }
      let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Raumebenen-Id</th><th>Raumebenen-Name</th><th>Anzahl integrierter Indikatoren-Features</th><th>Anzahl integrierter Zeitstempel</th><th>integrierte Zeitstempel</th><th>Fehlermeldung</th></tr></thead><tbody>';
      for (const item of summary) {
        html += '<tr>';
        html += `<td>${item.spatialUnitId}</td>`;
        html += `<td>${item.spatialUnitName}</td>`;
        html += `<td>${item.numberOfIntegratedIndicatorFeatures}</td>`;
        html += `<td>${item.numberOfIntegratedTargetDates}</td>`;
        html += `<td>${item.integratedTargetDates}</td>`;
        if (item.errorsOccurred && item.errorsOccurred.length > 0) {
          html += `<td>${this.dataExchange.syntaxHighlightJSON(item.errorsOccurred)}</td>`;
        } else {
          html += '<td>keine Fehlermeldungen vorhanden</td>';
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      return html;
    } catch { return ''; }
  }

  
}


