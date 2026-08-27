import { Injectable, inject } from '@angular/core';
import { ColDef } from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { PoiPresentationService } from 'services/poi-presentation-service/poi-presentation.service';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';

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
  private accessControlService = inject(AccessControlService);
  private poiPresentationService = inject(PoiPresentationService);
  private topicHierarchyService = inject(TopicHierarchyService);
  private topicStore = inject(TopicMetadataStoreService);
  private translate = inject(TranslateService);

  /**
   * Data columns for one grid type: Id/Name, the type-specific styling
   * columns, then the metadata columns shared by all three grids. The
   * edit-buttons column is prepended by the overview component, which owns
   * the click dispatch.
   */
  buildGeoresourceColumnDefs(type: GeoresourceGridType): ColDef[] {
    return [
      {
        headerName: this.translate.instant('ADMIN_SHARED.ID'),
        field: 'georesourceId',
        pinned: 'left',
        maxWidth: 125,
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.NAME'),
        field: 'datasetName',
        pinned: 'left',
        minWidth: 300,
      },
      ...this.stylingColumns(type),
      ...this.sharedMetadataColumns(),
    ];
  }

  private stylingColumns(type: GeoresourceGridType): ColDef[] {
    switch (type) {
      case 'poi':
        return [
          this.colorColumn(
            this.translate.instant('ADMIN_GEORESOURCES.GRID.COL_SYMBOL_COLOR'),
            'poiSymbolColor'
          ),
          {
            headerName: this.translate.instant('ADMIN_GEORESOURCES.GRID.COL_SYMBOL_NAME'),
            field: 'poiSymbolBootstrap3Name',
            maxWidth: 125,
            cellRenderer: (params: any) => {
              const symbolName = params.data.poiSymbolBootstrap3Name || 'home';
              return `${symbolName}<br/><br/><span class='glyphicon glyphicon-${symbolName}'></span>`;
            },
          },
          this.colorColumn(
            this.translate.instant('ADMIN_GEORESOURCES.GRID.COL_MARKER_COLOR'),
            'poiMarkerColor'
          ),
        ];
      case 'loi':
        return [
          this.colorColumn(
            this.translate.instant('ADMIN_GEORESOURCES.GRID.COL_LINE_COLOR'),
            'loiColor'
          ),
          {
            headerName: this.translate.instant('ADMIN_GEORESOURCES.GRID.COL_LINE_WIDTH'),
            field: 'loiWidth',
            maxWidth: 125,
          },
          {
            headerName: this.translate.instant('ADMIN_GEORESOURCES.GRID.COL_LINE_PATTERN'),
            field: 'loiDashArrayString',
            maxWidth: 125,
            filter: false,
            sortable: false,
            cellRenderer: (params: any) =>
              this.poiPresentationService.getLoiDashSvgFromStringValue(
                params.data.loiDashArrayString
              ),
          },
        ];
      case 'aoi':
        return [
          this.colorColumn(
            this.translate.instant('ADMIN_GEORESOURCES.GRID.COL_POLYGON_COLOR'),
            'aoiColor'
          ),
        ];
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
        headerName: this.translate.instant('ADMIN_SHARED.DESCRIPTION'),
        minWidth: 400,
        cellRenderer: (params: any) => params.data.metadata?.description || '',
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.PERIOD_OF_VALIDITY'),
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
        headerName: this.translate.instant('ADMIN_SHARED_UI.TOPICS.TITLE'),
        minWidth: 400,
        cellRenderer: (params: any) =>
          this.topicHierarchyService.getTopicHierarchyDisplayString(
            this.topicStore.availableTopics,
            params.data.topicReference
          ),
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.DATASOURCE'),
        minWidth: 400,
        cellRenderer: (params: any) => params.data.metadata?.datasource || '',
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.DATA_HOLDER_CONTACT'),
        minWidth: 400,
        cellRenderer: (params: any) => params.data.metadata?.contact || '',
      },
      {
        headerName: this.translate.instant('COMMON.ROLES'),
        minWidth: 400,
        cellRenderer: (params: any) =>
          this.accessControlService.getAllowedRolesString(params.data.permissions),
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.PUBLIC_VISIBLE'),
        minWidth: 400,
        cellRenderer: (params: any) => (params.data.isPublic ? 'ja' : 'nein'),
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.OWNER'),
        minWidth: 400,
        cellRenderer: (params: any) => this.accessControlService.getRoleTitle(params.data.ownerId),
      },
    ];
  }
}
