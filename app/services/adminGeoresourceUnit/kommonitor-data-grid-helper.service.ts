import { Injectable, inject } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { KommonitorGeoresourceDataExchangeService } from './kommonitor-data-exchange.service';

export type GeoresourceGridType = 'poi' | 'loi' | 'aoi';

/**
 * Stateless column-definition builder for the three georesource overview
 * grids (POI/LOI/AOI). The grids themselves are owned by the overview
 * component, which binds row data declaratively and dispatches the edit
 * buttons via AG Grid's cell-click event — this service holds no grid
 * references, DOM handlers, or component callbacks (all of which the former
 * implementation needed, together with setTimeout-based re-registration).
 */
@Injectable({
  providedIn: 'root',
})
export class KommonitorGeoresourceDataGridHelperService {
  private kommonitorDataExchangeService = inject(KommonitorGeoresourceDataExchangeService);

  /**
   * Data columns for one grid type: Id/Name, the type-specific styling
   * columns, then the metadata columns shared by all three grids. The
   * edit-buttons column is prepended by the overview component, which owns
   * the click dispatch.
   */
  buildGeoresourceColumnDefs(type: GeoresourceGridType): ColDef[] {
    return [
      { headerName: 'Id', field: 'georesourceId', pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: 'datasetName', pinned: 'left', minWidth: 300 },
      ...this.stylingColumns(type),
      ...this.sharedMetadataColumns(),
    ];
  }

  private stylingColumns(type: GeoresourceGridType): ColDef[] {
    switch (type) {
      case 'poi':
        return [
          this.colorColumn('Symbolfarbe', 'poiSymbolColor'),
          {
            headerName: 'Symbolname',
            field: 'poiSymbolBootstrap3Name',
            maxWidth: 125,
            cellRenderer: (params: any) => {
              const symbolName = params.data.poiSymbolBootstrap3Name || 'home';
              return `${symbolName}<br/><br/><span class='glyphicon glyphicon-${symbolName}'></span>`;
            },
          },
          this.colorColumn('Markerfarbe', 'poiMarkerColor'),
        ];
      case 'loi':
        return [
          this.colorColumn('Linienfarbe', 'loiColor'),
          { headerName: 'Linienbreite', field: 'loiWidth', maxWidth: 125 },
          {
            headerName: 'Linienmuster',
            field: 'loiDashArrayString',
            maxWidth: 125,
            filter: false,
            sortable: false,
            cellRenderer: (params: any) =>
              this.kommonitorDataExchangeService.getLoiDashSvgFromStringValue(
                params.data.loiDashArrayString
              ),
          },
        ];
      case 'aoi':
        return [this.colorColumn('Polygonfarbe', 'aoiColor')];
    }
  }

  private colorColumn(headerName: string, field: string): ColDef {
    return {
      headerName,
      field,
      maxWidth: 125,
      filter: false,
      sortable: false,
      cellRenderer: (params: any) => {
        const color = params.data[field] || '#000000';
        return `<div>${color}</div><br/><div style='width: 20px; height: 20px; background-color: ${color};'></div>`;
      },
    };
  }

  private sharedMetadataColumns(): ColDef[] {
    return [
      {
        headerName: 'Beschreibung',
        minWidth: 400,
        cellRenderer: (params: any) => params.data.metadata?.description || '',
      },
      {
        headerName: 'Gültigkeitszeitraum',
        minWidth: 400,
        cellRenderer: (params: any) => {
          let html =
            '<ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; word-break: break-word !important;">';
          for (const periodOfValidity of params.data.availablePeriodsOfValidity || []) {
            html += '<li style="margin-right: 15px;">';
            if (periodOfValidity.endDate) {
              html +=
                '<p>' + periodOfValidity.startDate + ' &dash; ' + periodOfValidity.endDate + '</p>';
            } else {
              html += '<p>' + periodOfValidity.startDate + ' &dash; heute</p>';
            }
            html += '</li>';
          }
          html += '</ul>';
          return html;
        },
      },
      {
        headerName: 'Themenhierarchie',
        minWidth: 400,
        cellRenderer: (params: any) =>
          this.kommonitorDataExchangeService.getTopicHierarchyDisplayString(
            params.data.topicReference
          ),
      },
      {
        headerName: 'Datenquelle',
        minWidth: 400,
        cellRenderer: (params: any) => params.data.metadata?.datasource || '',
      },
      {
        headerName: 'Datenhalter und Kontakt',
        minWidth: 400,
        cellRenderer: (params: any) => params.data.metadata?.contact || '',
      },
      {
        headerName: 'Rollen',
        minWidth: 400,
        cellRenderer: (params: any) =>
          this.kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions),
      },
      {
        headerName: 'Öffentlich sichtbar',
        minWidth: 400,
        cellRenderer: (params: any) => (params.data.isPublic ? 'ja' : 'nein'),
      },
      {
        headerName: 'Eigentümer',
        minWidth: 400,
        cellRenderer: (params: any) =>
          this.kommonitorDataExchangeService.getRoleTitle(params.data.ownerId),
      },
    ];
  }
}
