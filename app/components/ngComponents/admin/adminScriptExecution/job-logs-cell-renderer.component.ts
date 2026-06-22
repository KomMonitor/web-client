import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-job-logs-cell-renderer',
  standalone: true,
  imports: [],
  template: `
    @if (downloadUrl) {
      <a [href]="downloadUrl" [download]="filename" target="_blank" rel="noopener noreferrer">
        <button class="btn btn-warning btn-sm">Download Logs</button>
      </a>
    } @else {
      Dieser Job umfasst keine Logs
    }
  `,
})
export class JobLogsCellRendererComponent implements ICellRendererAngularComp {
  downloadUrl: string | null = null;
  filename: string = '';

  agInit(params: ICellRendererParams): void {
    this.setParams(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.setParams(params);
    return true;
  }

  private setParams(params: ICellRendererParams): void {
    if (params.data.logs) {
      const logJSON = JSON.stringify(params.data.logs);
      const blob = new Blob([logJSON], { type: 'application/json' });
      this.downloadUrl = URL.createObjectURL(blob);
      this.filename = `KomMonitor-Indikatorberechnung-Job-${params.data.jobId}-Logs.json`;
    } else {
      this.downloadUrl = null;
    }
  }
}
