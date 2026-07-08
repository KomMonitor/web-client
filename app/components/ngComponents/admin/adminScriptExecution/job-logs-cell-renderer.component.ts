import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-job-logs-cell-renderer',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (downloadUrl(); as url) {
      <a [href]="url" [download]="filename()" target="_blank" rel="noopener noreferrer">
        <button class="btn btn-warning btn-sm">Download Logs</button>
      </a>
    } @else {
      Dieser Job umfasst keine Logs
    }
  `,
})
export class JobLogsCellRendererComponent implements ICellRendererAngularComp {
  // Signals: refresh() is invoked by AG Grid outside Angular CD (OnPush).
  downloadUrl = signal<string | null>(null);
  filename = signal('');

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
      this.downloadUrl.set(URL.createObjectURL(blob));
      this.filename.set(`KomMonitor-Indikatorberechnung-Job-${params.data.jobId}-Logs.json`);
    } else {
      this.downloadUrl.set(null);
    }
  }
}
