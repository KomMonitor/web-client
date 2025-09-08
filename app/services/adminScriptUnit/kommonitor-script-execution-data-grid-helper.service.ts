import { Injectable } from '@angular/core';
import { GridOptions, ColDef } from 'ag-grid-community';
import { KommonitorDataExchangeService } from 'services/adminSpatialUnit/kommonitor-data-exchange.service';

@Injectable({ providedIn: 'root' })
export class KommonitorScriptExecutionDataGridHelperService {
  constructor(private dataExchange: KommonitorDataExchangeService) {}

  buildDefaultJobsColumnDefs(): ColDef[] {
    return [
      { headerName: 'Job-Id', field: 'jobId', pinned: 'left', maxWidth: 125, checkboxSelection: true, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true },
      { headerName: 'Script-Id', field: 'jobData.scriptId', pinned: 'left', maxWidth: 125 },
      { headerName: 'Ziel-Indikator', pinned: 'left', maxWidth: 250, valueGetter: (params) => {
          try {
            const id = params.data?.jobData?.targetIndicatorId;
            if (!id) { return ''; }
            const md = (this.dataExchange as any).getIndicatorMetadataById ? (this.dataExchange as any).getIndicatorMetadataById(id) : null;
            return md ? md.indicatorName : '';
          } catch { return ''; }
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params) => {
          try {
            const id = params.data?.jobData?.targetIndicatorId;
            const md = (this.dataExchange as any).getIndicatorMetadataById ? (this.dataExchange as any).getIndicatorMetadataById(id) : null;
            return md ? md.indicatorName : '';
          } catch { return ''; }
        }
      },
      { headerName: 'Job-Status', field: 'status', maxWidth: 125 },
      { headerName: 'Job-Fortschritt', field: 'progress', maxWidth: 125 },
      { headerName: 'Job-Data', minWidth: 500, cellRenderer: (params: any) => this.dataExchange.syntaxHighlightJSON(params.data?.jobData),
        filter: 'agTextColumnFilter', filterValueGetter: (p: any) => p.data?.jobData },
      { headerName: 'Job-Logs', maxWidth: 150, cellRenderer: this.buildLogsRenderer('KomMonitor-Indikatorberechnung-Job-') ,
        filter: 'agTextColumnFilter', filterValueGetter: (p: any) => p.data?.logs },
      { headerName: 'Job-Summary', minWidth: 1000, cellRenderer: (params: any) => this.renderDefaultJobSummary(params),
        filter: 'agTextColumnFilter', filterValueGetter: (p: any) => JSON.stringify(p.data?.spatialUnitIntegrationSummary) }
    ];
  }

  buildCustomizedJobsColumnDefs(): ColDef[] {
    return [
      { headerName: 'Job-Id', field: 'jobId', pinned: 'left', maxWidth: 125, checkboxSelection: true, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true },
      { headerName: 'Job-Status', field: 'status', maxWidth: 125 },
      { headerName: 'Job-Fortschritt', field: 'progress', maxWidth: 125 },
      { headerName: 'Job-Data', minWidth: 500, cellRenderer: (params: any) => this.dataExchange.syntaxHighlightJSON(params.data?.jobData),
        filter: 'agTextColumnFilter', filterValueGetter: (p: any) => p.data?.jobData },
      { headerName: 'Job-Logs', maxWidth: 150, cellRenderer: this.buildLogsRenderer('KomMonitor-Indikatorberechnung-individuell-Job-'),
        filter: 'agTextColumnFilter', filterValueGetter: (p: any) => p.data?.logs }
    ];
  }

  buildGridOptions(columnDefs: ColDef[], rowData: any[]): GridOptions {
    return {
      columnDefs,
      rowData,
      defaultColDef: {
        editable: false,
        sortable: true,
        flex: 1,
        minWidth: 200,
        filter: true,
        floatingFilter: true,
        resizable: true,
        wrapText: true,
        autoHeight: true,
        cellStyle: { 'font-size': '12px', 'white-space': 'normal !important', 'line-height': '20px !important', 'word-break': 'break-word !important', 'padding-top': '17px', 'padding-bottom': '17px' }
      },
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true
    } as GridOptions;
  }

  private buildLogsRenderer(prefix: string) {
    return (params: any) => {
      try {
        const logs = params?.data?.logs;
        if (!logs) { return 'Dieser Job umfasst keine Logs'; }
        const logJSON = JSON.stringify(logs);
        const blob = new Blob([logJSON], { type: 'application/json' });
        const dataUrl = URL.createObjectURL(blob);
        const fileName = `${prefix}${params.data.jobId}-Logs.json`;
        return `<a href="${dataUrl}" download="${fileName}" target="_blank" rel="noopener noreferrer"><button class=\"btn btn-warning btn-sm\">Download Logs</button></a>`;
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


