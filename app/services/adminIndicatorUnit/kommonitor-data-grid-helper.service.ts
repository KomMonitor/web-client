import { Injectable, inject } from '@angular/core';
import { IndicatorsDataset } from 'components/ngComponents/models/indicators.models';
import { RegionalReferenceValueType } from 'models/data-management-api';
import { ColDef, createGrid } from 'ag-grid-community';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { TopicHierarchyService } from '../topic-hierarchy-service/topic-hierarchy.service';
import { EnvConfigService } from '../env-config-service/env-config.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class KommonitorIndicatorDataGridHelperService {
  private accessControlService = inject(AccessControlService);
  private metadataExportService = inject(MetadataExportService);
  private topicStore = inject(TopicMetadataStoreService);
  private topicHierarchyService = inject(TopicHierarchyService);
  private envConfigService = inject(EnvConfigService);
  private translate = inject(TranslateService);

  /**
   * Builds data grid for indicators - now returns column definitions and row data for AG Grid Angular
   */
  buildDataGrid_indicators(indicatorMetadataArray: IndicatorsDataset[]): {
    columnDefs: ColDef[];
    rowData: IndicatorsDataset[];
  } {
    const columnDefs = this.buildDataGridColumnConfig_indicators(indicatorMetadataArray);
    const rowData = this.buildDataGridRowData_indicators(indicatorMetadataArray);

    return { columnDefs, rowData };
  }

  /**
   * Builds column configuration for indicators
   */
  buildDataGridColumnConfig_indicators(_indicatorMetadataArray: IndicatorsDataset[]): any[] {
    const columnDefs = [
      {
        headerName: this.translate.instant('ADMIN_SHARED.EDIT_FUNCTIONS'),
        pinned: 'left',
        maxWidth: 200,
        checkboxSelection: false,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => this.displayEditButtons_indicators(params),
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.ID'),
        field: 'indicatorId',
        pinned: 'left',
        maxWidth: 125,
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.NAME'),
        field: 'indicatorName',
        pinned: 'left',
        minWidth: 300,
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_UNIT'),
        field: 'unit',
        minWidth: 200,
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.DESCRIPTION'),
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata.description;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          return '' + params.data.metadata.description;
        },
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_METHODOLOGY'),
        minWidth: 400,
        cellRenderer: (params: any) => {
          if (params.data.processDescription && params.data.processDescription.includes('$$')) {
            const splitArray = params.data.processDescription.split('$$');
            for (let index = 0; index < splitArray.length; index++) {
              if (index % 2 == 0) {
                params.data.processDescription += '<br/>';
              }
            }
          }
          return params.data.processDescription;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          return '' + params.data.processDescription;
        },
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_AVAILABLE_SPATIAL_UNITS'),
        field: 'applicableSpatialUnits',
        minWidth: 400,
        cellRenderer: (params: any) => {
          let html =
            '<ul style="columns: 2; -webkit-columns: 2; -moz-columns: 2; word-break: break-word !important;">';
          for (const applicableSpatialUnit of params.data.applicableSpatialUnits) {
            html += '<li style="margin-right: 15px;">';
            html += applicableSpatialUnit.spatialUnitName;
            html += '</li>';
          }
          html += '</ul>';
          return html;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          if (params.data.applicableSpatialUnits && params.data.applicableSpatialUnits.length > 1) {
            return '' + JSON.stringify(params.data.applicableSpatialUnits);
          }
          return params.data.applicableSpatialUnits;
        },
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_AVAILABLE_TIMESTAMPS'),
        field: 'applicableDates',
        minWidth: 400,
        cellRenderer: (params: any) => {
          let html =
            '<ul style="columns: 5; -webkit-columns: 5; -moz-columns: 5; word-break: break-word !important;">';
          for (const timestamp of params.data.applicableDates) {
            html += '<li style="margin-right: 15px;">';
            html += timestamp;
            html += '</li>';
          }
          html += '</ul>';
          return html;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          if (params.data.applicableDates && params.data.applicableDates.length > 1) {
            return '' + JSON.stringify(params.data.applicableDates);
          }
          return params.data.applicableDates;
        },
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_ABBREVIATION'),
        field: 'abbreviation',
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_HEADLINE_INDICATOR'),
        field: 'isHeadlineIndicator',
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_INDICATOR_TYPE'),
        minWidth: 200,
        cellRenderer: (params: any) => {
          return this.metadataExportService.getIndicatorStringFromIndicatorType(
            params.data.indicatorType
          );
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          return (
            '' +
            this.metadataExportService.getIndicatorStringFromIndicatorType(
              params.data.indicatorType
            )
          );
        },
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_CHARACTERISTIC'),
        field: 'characteristicValue',
        minWidth: 200,
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_UPDATE_INTERVAL'),
        field: 'creationType',
        minWidth: 200,
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_TAGS'),
        field: 'tags',
        minWidth: 250,
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED_UI.TOPICS.TITLE'),
        minWidth: 400,
        cellRenderer: (params: any) =>
          this.topicHierarchyService.getTopicHierarchyDisplayString(
            this.topicStore.availableTopics,
            params.data.topicReference
          ),
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) =>
          '' +
          this.topicHierarchyService.getTopicHierarchyDisplayString(
            this.topicStore.availableTopics,
            params.data.topicReference
          ),
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.DATASOURCE'),
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata.datasource;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          return '' + params.data.metadata.datasource;
        },
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.DATA_HOLDER_CONTACT'),
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata.contact;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          return '' + params.data.metadata.contact;
        },
      },
      {
        headerName: this.translate.instant('COMMON.ROLES'),
        minWidth: 400,
        cellRenderer: (params: any) => {
          return this.accessControlService.getAllowedRolesString(params.data.permissions);
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          return '' + this.accessControlService.getAllowedRolesString(params.data.permissions);
        },
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.PUBLIC_VISIBLE'),
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.isPublic ? 'ja' : 'nein';
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          return '' + (params.data.isPublic ? 'ja' : 'nein');
        },
      },
      {
        headerName: this.translate.instant('ADMIN_SHARED.OWNER'),
        minWidth: 400,
        cellRenderer: (params: any) => {
          return this.accessControlService.getRoleTitle(params.data.ownerId);
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          return '' + this.accessControlService.getRoleTitle(params.data.ownerId);
        },
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_DECIMALS'),
        minWidth: 200,
        cellRenderer: (params: any) => {
          return params.data.precision;
        },
        filter: 'agTextColumnFilter',
        filterValueGetter: (params: any) => {
          return '' + params.data.precision;
        },
      },
    ];

    return columnDefs;
  }

  /**
   * Builds row data for indicators
   */
  buildDataGridRowData_indicators(
    indicatorMetadataArray: IndicatorsDataset[]
  ): IndicatorsDataset[] {
    return indicatorMetadataArray;
  }

  /**
   * Display edit buttons component for indicators
   */
  displayEditButtons_indicators = (params: any) => {
    // Safety check for data
    if (!params.data || !params.data.indicatorId) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }

    const disabledEditButtons = !(
      params.data.userPermissions &&
      Array.isArray(params.data.userPermissions) &&
      params.data.userPermissions.includes('editor')
    );
    const editMetadataButtonId = 'btn_indicator_editMetadata_' + params.data.indicatorId;
    const editFeaturesButtonId = 'btn_indicator_editFeatures_' + params.data.indicatorId;

    let html = '<div class="btn-group btn-group-sm">';
    html +=
      '<button id="' +
      editMetadataButtonId +
      '" class="btn btn-warning btn-sm indicatorEditMetadataBtn disabled" type="button" title="' +
      this.translate.instant('ADMIN_SHARED_UI.GRID.EDIT_METADATA_TITLE') +
      '" disabled><i class="fas fa-pencil-alt"></i></button>';
    html +=
      '<button id="' +
      editFeaturesButtonId +
      '" class="btn btn-warning btn-sm indicatorEditFeaturesBtn disabled" type="button" title="' +
      this.translate.instant('ADMIN_SHARED.EDIT_FEATURES') +
      '" disabled><i class="fas fa-draw-polygon"></i></button>';

    if (!disabledEditButtons) {
      html = html.replaceAll('disabled', ''); // enabled
    }

    if (this.envConfigService.enableKeycloakSecurity) {
      const disabled = !(
        params.data.userPermissions &&
        Array.isArray(params.data.userPermissions) &&
        params.data.userPermissions.includes('creator')
      );
      html +=
        '<button id="btn_indicator_editRoleBasedAccess_' +
        params.data.indicatorId +
        '"class="btn btn-warning btn-sm indicatorEditRoleBasedAccessBtn ';

      if (disabled) {
        html += 'disabled" disabled';
      }

      html +=
        ' type="button" title="' +
        this.translate.instant('ADMIN_SHARED_UI.GRID.EDIT_ACCESS_TITLE') +
        '"><i class="fas fa-user-lock"></i></button>';
    }

    // Delete Button — gated on the global delete permission and, like spatial
    // units, on the per-dataset 'creator' permission.
    const disableDelete =
      !this.accessControlService.checkDeletePermission() ||
      !(
        params.data.userPermissions &&
        Array.isArray(params.data.userPermissions) &&
        params.data.userPermissions.includes('creator')
      );
    html +=
      '<button id="btn_indicator_deleteIndicator_' +
      params.data.indicatorId +
      '" class="btn btn-danger btn-sm indicatorDeleteBtn" type="button" title="' +
      this.translate.instant('ADMIN_INDICATORS.GRID.DELETE_TITLE') +
      '" ' +
      (disableDelete ? 'disabled' : '') +
      '><i class="fas fa-trash"></i></button>';

    html += '</div>';

    return html;
  };

  /**
   * Gets reference values from regional reference values management grid - delegates to AngularJS service
   */
  getReferenceValues_regionalReferenceValuesManagementGrid(
    regionalReferenceValuesManagementTableOptions
  ) {
    const regionalReferenceValuesList: RegionalReferenceValueType[] = [];
    if (
      regionalReferenceValuesManagementTableOptions &&
      regionalReferenceValuesManagementTableOptions.api
    ) {
      /*
          regionalReferenceValuesList: 
          [
            {
                "referenceDate": "2021-12-31",
                "regionalSum": 3000,
                "regionalAverage": 144
                "spatiallyUnassignable": 0
            },
            {
                "referenceDate": "2022-12-31",
                "regionalSum": 3500,
                "regionalAverage": 148,
                "spatiallyUnassignable": 0
            }
          ]
          
      */
      regionalReferenceValuesManagementTableOptions.api.forEachNode((node, _index) => {
        regionalReferenceValuesList.push(node.data);
      });
    }
    return regionalReferenceValuesList;
  }

  /**
   * Builds reference values management grid - delegates to AngularJS service
   */
  buildReferenceValuesManagementGrid(domElementId, applicableDates, regionalReferenceValuesList) {
    // typed as `any` to match the original implicit-any local; the inferred grid-options
    // shape is not directly assignable to ag-grid's GridOptions (loose ColDef literals).
    const dataGridOptions_regionalReferenceValues: any =
      this.buildDataGridOptions_regionalReferenceValues(
        applicableDates,
        regionalReferenceValuesList
      );

    const gridDiv: any = document.querySelector('#' + domElementId);
    if (gridDiv) {
      while (gridDiv.firstChild) {
        gridDiv.removeChild(gridDiv!.firstChild);
      }
      // createGrid() replaces the v31-deprecated `new agGrid.Grid()`. It returns
      // the GridApi (no longer attached to gridOptions), so keep it on `.api` for
      // getReferenceValues_regionalReferenceValuesManagementGrid to read back.
      dataGridOptions_regionalReferenceValues.api = createGrid(
        gridDiv,
        dataGridOptions_regionalReferenceValues
      );
    }

    return dataGridOptions_regionalReferenceValues;
  }

  buildDataGridOptions_regionalReferenceValues(
    applicableDates: string[],
    regionalReferenceValuesList: RegionalReferenceValueType[]
  ) {
    const columnDefs = this.buildDataGridColumnConfig_regionalReferenceValues(
      applicableDates,
      regionalReferenceValuesList
    );
    const rowData = this.buildDataGridRowData_regionalReferenceValues(
      applicableDates,
      regionalReferenceValuesList
    );

    const gridOptions = {
      defaultColDef: {
        editable: true,
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          precision: 2,
          step: 0.25,
          showStepperButtons: true,
        },
        sortable: true,
        flex: 1,
        minWidth: 200,
        filter: true,
        floatingFilter: false,
        // filterParams: {
        //   newRowsAction: 'keep'
        // },
        resizable: true,
        wrapText: true,
        autoHeight: true,
        cellStyle: {
          'font-size': '12px;',
          'white-space': 'normal !important',
          'line-height': '20px !important',
          'word-break': 'break-word !important',
          'padding-top': '17px',
          'padding-bottom': '17px',
        },
        headerComponentParams: {
          template:
            '<div class="ag-cell-label-container" role="presentation">' +
            '  <span ref="eMenu" class="ag-header-icon ag-header-cell-menu-button"></span>' +
            '  <div ref="eLabel" class="ag-header-cell-label" role="presentation">' +
            '    <span ref="eSortOrder" class="ag-header-icon ag-sort-order"></span>' +
            '    <span ref="eSortAsc" class="ag-header-icon ag-sort-ascending-icon"></span>' +
            '    <span ref="eSortDesc" class="ag-header-icon ag-sort-descending-icon"></span>' +
            '    <span ref="eSortNone" class="ag-header-icon ag-sort-none-icon"></span>' +
            '    <span ref="eText" class="ag-header-cell-text" role="columnheader" style="white-space: normal;"></span>' +
            '    <span ref="eFilter" class="ag-header-icon ag-filter-icon"></span>' +
            '  </div>' +
            '</div>',
        },
      },
      columnDefs: columnDefs,
      rowData: rowData,
      // enables undo / redo
      undoRedoCellEditing: true,
      // restricts the number of undo / redo steps to 10
      undoRedoCellEditingLimit: 10,
      // enables flashing to help see cell changes
      enableCellChangeFlash: true,
      suppressRowClickSelection: true,
      // rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      paginationPageSizeSelector: [10, 25, 50, 100],
      suppressColumnVirtualisation: true,
      onRowDataChanged: function () {
        /* intentionally empty */
      },
      onModelUpdated: function () {
        /* intentionally empty */
      },
      onViewportChanged: function () {
        /* intentionally empty */
      },
    };

    return gridOptions;
  }

  buildDataGridColumnConfig_regionalReferenceValues(
    _applicableDates,
    _regionalReferenceValuesList
  ) {
    const columnDefs = [
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_DATE'),
        field: 'referenceDate',
        pinned: 'left',
        cellDataType: 'text',
        editable: false,
        cellClass: 'grid-non-editable',
        maxWidth: 150,
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_REGIONAL_SUM'),
        field: 'regionalSum',
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          precision: 2,
          step: 0.01,
          showStepperButtons: true,
        },
        tooltipValueGetter: (_p) =>
          this.translate.instant('ADMIN_SHARED_UI.GRID.CONFIRM_WITH_ENTER'),
        maxWidth: 175,
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_REGIONAL_AVERAGE'),
        field: 'regionalAverage',
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          precision: 2,
          step: 0.01,
          showStepperButtons: true,
        },
        tooltipValueGetter: (_p) =>
          this.translate.instant('ADMIN_SHARED_UI.GRID.CONFIRM_WITH_ENTER'),
        maxWidth: 175,
      },
      {
        headerName: this.translate.instant('ADMIN_INDICATORS.GRID.COL_SPATIALLY_UNASSIGNABLE'),
        field: 'spatiallyUnassignable',
        cellDataType: 'number',
        cellEditor: 'agNumberCellEditor',
        cellEditorParams: {
          precision: 2,
          step: 0.01,
          showStepperButtons: true,
        },
        tooltipValueGetter: (_p) =>
          this.translate.instant('ADMIN_SHARED_UI.GRID.CONFIRM_WITH_ENTER'),
        maxWidth: 175,
      },
    ];

    return columnDefs;
  }

  buildDataGridRowData_regionalReferenceValues(
    applicableDates: string[],
    regionalReferenceValuesList: RegionalReferenceValueType[]
  ) {
    /*
      regionalReferenceValuesList: 
        [
          {
              "referenceDate": "2021-12-31",
              "regionalSum": 3000,
              "regionalAverage": 144,
              "spatiallyUnassignable": 0
          },
          {
              "referenceDate": "2022-12-31",
              "regionalSum": 3500,
              "regionalAverage": 148,
              "spatiallyUnassignable", 0
          }
        ]
    */

    const dataArray: RegionalReferenceValueType[] = [];

    if (applicableDates && applicableDates.length > 0) {
      for (const availableDate of applicableDates) {
        let item: RegionalReferenceValueType = {
          referenceDate: availableDate,
          regionalSum: undefined,
          regionalAverage: undefined,
          spatiallyUnassignable: undefined,
        };

        if (regionalReferenceValuesList && regionalReferenceValuesList.length > 0) {
          for (const regionalReferenceValuesListEntry of regionalReferenceValuesList) {
            if (regionalReferenceValuesListEntry.referenceDate == availableDate) {
              item = regionalReferenceValuesListEntry;
              break;
            }
          }
        }

        dataArray.push(item);
      }
    }

    return dataArray;
  }
}
