import { Injectable } from '@angular/core';
import { ColDef, GridOptions } from 'ag-grid-community';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';

@Injectable({ providedIn: 'root' })
export class KommonitorScriptManagementDataGridHelperService {

  constructor(private indicatorExchange: KommonitorIndicatorDataExchangeService) {}

  buildScriptsColumnDefs(): ColDef[] {
    return [
      { headerName: 'Id', field: 'scriptId', pinned: 'left', maxWidth: 125, checkboxSelection: true, headerCheckboxSelection: true, headerCheckboxSelectionFilteredOnly: true },
      { headerName: 'Name', field: 'name', pinned: 'left', maxWidth: 300 },
      { headerName: 'Ziel-Indikatoren-Id', field: 'indicatorId', maxWidth: 125 },
      { headerName: 'Ziel-Indikatoren-Name', minWidth: 200, cellRenderer: (params: any) => this.getIndicatorName(params?.data?.indicatorId),
        filter: 'agTextColumnFilter', filterValueGetter: (p: any) => this.getIndicatorName(p?.data?.indicatorId) },
      { headerName: 'Beschreibung', field: 'description', minWidth: 300 },
      { headerName: 'notwendige Basis-Indikatoren', minWidth: 300, cellRenderer: (params: any) => this.renderRequiredIndicators(params),
        filter: 'agTextColumnFilter', filterValueGetter: (p: any) => this.requiredIndicatorsFilterValue(p) },
      { headerName: 'notwendige Basis-Georessourcen', minWidth: 300, cellRenderer: (params: any) => this.renderRequiredGeoresources(params),
        filter: 'agTextColumnFilter', filterValueGetter: (p: any) => this.requiredGeoresourcesFilterValue(p) },
      { headerName: 'Prozessparameter', minWidth: 1000, cellRenderer: (params: any) => this.renderProcessParameters(params),
        filter: 'agTextColumnFilter', filterValueGetter: (p: any) => JSON.stringify(p?.data?.variableProcessParameters || []) }
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

  getSelectedScriptsFromApi(gridApi: any): any[] {
    try {
      const selectedNodes = gridApi?.getSelectedNodes?.() || [];
      return selectedNodes.map((n: any) => n.data);
    } catch { return []; }
  }

  private getIndicatorName(indicatorId: string): string {
    try {
      const md = this.indicatorExchange.getIndicatorMetadataById(indicatorId);
      return md ? (md.indicatorName || md.indicatorLabel || '') : '';
    } catch { return ''; }
  }

  private renderRequiredIndicators(params: any): string {
    const ids: string[] = params?.data?.requiredIndicatorIds || [];
    if (!ids.length) { return 'keine'; }
    let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Id</th><th>Name</th></tr></thead><tbody>';
    for (const id of ids) {
      html += '<tr>';
      html += `<td>${id}</td>`;
      html += `<td>${this.getIndicatorName(id)}</td>`;
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  private requiredIndicatorsFilterValue(p: any): string {
    const ids: string[] = p?.data?.requiredIndicatorIds || [];
    if (!ids.length) { return 'keine'; }
    let value = JSON.stringify(ids);
    for (const id of ids) { value += this.getIndicatorName(id); }
    return value;
  }

  private renderRequiredGeoresources(params: any): string {
    const ids: string[] = params?.data?.requiredGeoresourceIds || [];
    if (!ids.length) { return 'keine'; }
    let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Id</th><th>Name</th></tr></thead><tbody>';
    for (const id of ids) {
      html += '<tr>';
      html += `<td>${id}</td>`;
      html += `<td>${this.getGeoresourceName(id)}</td>`;
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  private requiredGeoresourcesFilterValue(p: any): string {
    const ids: string[] = p?.data?.requiredGeoresourceIds || [];
    if (!ids.length) { return 'keine'; }
    let value = JSON.stringify(ids);
    for (const id of ids) { value += this.getGeoresourceName(id); }
    return value;
  }

  private getGeoresourceName(georesourceId: string): string {
    try {
      const md = this.indicatorExchange.getGeoresourceMetadataById(georesourceId);
      return md ? (md.datasetName || md.name || '') : '';
    } catch { return ''; }
  }

  private renderProcessParameters(params: any): string {
    const list = params?.data?.variableProcessParameters || [];
    if (!list.length) { return 'keine'; }
    let html = '<table class="table table-condensed table-bordered table-striped"><thead><tr><th>Name</th><th>Beschreibung</th><th>Datentyp</th><th>Standard-Wert</th><th>erlaubter Wertebereich</th></tr></thead><tbody>';
    for (const p of list) {
      html += '<tr>';
      html += `<td>${p?.name ?? ''}</td>`;
      html += `<td>${p?.description ?? ''}</td>`;
      html += `<td>${p?.dataType ?? ''}</td>`;
      html += `<td>${p?.defaultValue ?? ''}</td>`;
      html += '<td>';
      if (p?.dataType === 'integer' || p?.dataType === 'double') {
        html += '<b>erlaubter Wertebereich</b><br/><br/>';
        html += `${p?.minParameterValueForNumericInputs ?? ''} – ${p?.maxParameterValueForNumericInputs ?? ''}`;
      }
      html += '</td>';
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }
}


