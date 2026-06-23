import { Injectable, inject } from '@angular/core';
import { BroadcastService } from '../broadcast-service/broadcast.service';
import { KommonitorGeoresourceDataExchangeService } from './kommonitor-data-exchange.service';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi } from 'ag-grid-community';

@Injectable({
  providedIn: 'root',
})
export class KommonitorGeoresourceDataGridHelperService {
  private broadcastService = inject(BroadcastService);
  private kommonitorDataExchangeService = inject(KommonitorGeoresourceDataExchangeService);

  // Grid references
  private poiGrid: AgGridAngular | null = null;
  private loiGrid: AgGridAngular | null = null;
  private aoiGrid: AgGridAngular | null = null;

  // Component reference for callbacks
  private componentRef: any = null;

  private displayEditButtons_georesources = (params: any) => {
    if (!params.data || !params.data.georesourceId) {
      return '<div class="btn-group btn-group-sm">No data</div>';
    }

    const editMetadataButtonId = 'btn_georesource_editMetadata_' + params.data.georesourceId;
    const editFeaturesButtonId = 'btn_georesource_editFeatures_' + params.data.georesourceId;
    const editUserRolesButtonId = 'btn_georesource_editUserRoles_' + params.data.georesourceId;
    const deleteButtonId = 'btn_georesource_deleteGeoresource_' + params.data.georesourceId;

    // Check user permissions (handle both array and potential undefined)
    const userPermissions = params.data.userPermissions || [];
    const hasEditorPermission = Array.isArray(userPermissions)
      ? userPermissions.includes('editor') || userPermissions.includes('creator')
      : false;
    const hasCreatorPermission = Array.isArray(userPermissions)
      ? userPermissions.includes('creator')
      : false;

    let html = '<div class="btn-group btn-group-sm">';
    html +=
      '<button id="' +
      editMetadataButtonId +
      '" class="btn btn-warning btn-sm georesourceEditMetadataBtn" type="button" title="Metadaten editieren" ' +
      (hasEditorPermission ? '' : 'disabled') +
      '><i class="fas fa-pencil-alt"></i></button>';
    html +=
      '<button id="' +
      editFeaturesButtonId +
      '" class="btn btn-warning btn-sm georesourceEditFeaturesBtn" type="button" title="Features fortführen" ' +
      (hasEditorPermission ? '' : 'disabled') +
      '><i class="fas fa-draw-polygon"></i></button>';
    html +=
      '<button id="' +
      editUserRolesButtonId +
      '" class="btn btn-warning btn-sm georesourceEditUserRolesBtn" type="button" title="Zugriffsschutz und Eigentümerschaft editieren" ' +
      (hasCreatorPermission ? '' : 'disabled') +
      '><i class="fas fa-user-lock"></i></button>';
    html +=
      '<button id="' +
      deleteButtonId +
      '" class="btn btn-danger btn-sm georesourceDeleteBtn" type="button" title="Georessource entfernen" ' +
      (hasCreatorPermission ? '' : 'disabled') +
      '><i class="fas fa-trash"></i></button>';
    html += '</div>';

    return html;
  };

  /**
   * Initialize the grid references
   */
  initializeGrids(poiGrid: AgGridAngular, loiGrid: AgGridAngular, aoiGrid: AgGridAngular): void {
    this.poiGrid = poiGrid;
    this.loiGrid = loiGrid;
    this.aoiGrid = aoiGrid;
  }

  /**
   * Set component reference for callbacks
   */
  setComponentRef(componentRef: any): void {
    this.componentRef = componentRef;

    // Update column definitions with the component reference for all grids
    this.updateColumnDefinitions();
  }

  /**
   * Update column definitions with the current component reference
   */
  private updateColumnDefinitions(): void {
    if (this.poiGrid && this.poiGrid.api) {
      const poiColumnDefs = this.getPoiColumnDefinitions();
      this.poiGrid.api.setColumnDefs(poiColumnDefs);
    }

    if (this.loiGrid && this.loiGrid.api) {
      const loiColumnDefs = this.getLoiColumnDefinitions();
      this.loiGrid.api.setColumnDefs(loiColumnDefs);
    }

    if (this.aoiGrid && this.aoiGrid.api) {
      const aoiColumnDefs = this.getAoiColumnDefinitions();
      this.aoiGrid.api.setColumnDefs(aoiColumnDefs);
    }
  }

  /**
   * Build data grid for georesources
   */
  buildDataGrid_georesources(georesourcesArray: any[]): void {
    if (!georesourcesArray || georesourcesArray.length === 0) {
      console.warn('No georesources data provided to buildDataGrid_georesources');
      return;
    }

    if (!this.poiGrid || !this.loiGrid || !this.aoiGrid) {
      console.warn('Grid references not initialized');
      return;
    }

    this.buildPoiGrid(georesourcesArray);
    this.buildLoiGrid(georesourcesArray);
    this.buildAoiGrid(georesourcesArray);
  }

  /**
   * Build POI grid
   */
  private buildPoiGrid(georesourcesArray: any[]): void {
    if (!this.poiGrid) {
      return;
    }
    const poiData = georesourcesArray.filter((item) => item.isPOI);
    const columnDefs = this.getPoiColumnDefinitions();

    try {
      this.poiGrid.api?.setRowData(poiData);
      this.poiGrid.api?.setColumnDefs(columnDefs);

      // Register click handlers after a short delay
      setTimeout(() => {
        this.registerClickHandler_georesources(georesourcesArray);
      }, 200);
    } catch (error) {
      console.error('Error updating POI grid:', error);
    }
  }

  /**
   * Build LOI grid
   */
  private buildLoiGrid(georesourcesArray: any[]): void {
    if (!this.loiGrid) {
      return;
    }

    const loiData = georesourcesArray.filter((item) => item.isLOI);
    const columnDefs = this.getLoiColumnDefinitions();

    try {
      this.loiGrid.api?.setRowData(loiData);
      this.loiGrid.api?.setColumnDefs(columnDefs);

      // Register click handlers after a short delay
      setTimeout(() => {
        this.registerClickHandler_georesources(georesourcesArray);
      }, 200);
    } catch (error) {
      console.error('Error updating LOI grid:', error);
    }
  }

  /**
   * Build AOI grid
   */
  private buildAoiGrid(georesourcesArray: any[]): void {
    if (!this.aoiGrid) {
      return;
    }

    const aoiData = georesourcesArray.filter((item) => item.isAOI);
    const columnDefs = this.getAoiColumnDefinitions();

    try {
      this.aoiGrid.api?.setRowData(aoiData);
      this.aoiGrid.api?.setColumnDefs(columnDefs);

      // Register click handlers after a short delay
      setTimeout(() => {
        this.registerClickHandler_georesources(georesourcesArray);
      }, 200);
    } catch (error) {
      console.error('Error updating AOI grid:', error);
    }
  }

  /**
   * Register click handlers for georesource buttons
   */
  private registerClickHandler_georesources(_georesourceMetadataArray: any[]): void {
    // Edit Metadata Button
    const editMetadataButtons = document.querySelectorAll('.georesourceEditMetadataBtn');
    editMetadataButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleEditMetadataClick);
      button.addEventListener('click', this.handleEditMetadataClick);
    });

    // Edit Features Button
    const editFeaturesButtons = document.querySelectorAll('.georesourceEditFeaturesBtn');
    editFeaturesButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleEditFeaturesClick);
      button.addEventListener('click', this.handleEditFeaturesClick);
    });

    // Edit User Roles Button
    const editUserRolesButtons = document.querySelectorAll('.georesourceEditUserRolesBtn');
    editUserRolesButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleEditUserRolesClick);
      button.addEventListener('click', this.handleEditUserRolesClick);
    });

    // Delete Button
    const deleteButtons = document.querySelectorAll('.georesourceDeleteBtn');
    deleteButtons.forEach((button: any) => {
      button.removeEventListener('click', this.handleDeleteClick);
      button.addEventListener('click', this.handleDeleteClick);
    });
  }

  /**
   * Handle edit metadata button click
   */
  private handleEditMetadataClick = (event: any): void => {
    event.stopPropagation();

    const georesourceId =
      event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata =
      this.kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

    if (this.componentRef) {
      this.componentRef.onClickEditMetadata(georesourceMetadata);
    }
  };

  /**
   * Handle edit features button click
   */
  private handleEditFeaturesClick = (event: any): void => {
    event.stopPropagation();

    const georesourceId =
      event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata =
      this.kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

    if (this.componentRef) {
      this.componentRef.onClickEditFeatures(georesourceMetadata);
    }
  };

  /**
   * Handle edit user roles button click
   */
  private handleEditUserRolesClick = (event: any): void => {
    event.stopPropagation();

    const georesourceId =
      event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata =
      this.kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

    if (this.componentRef) {
      this.componentRef.onClickEditUserRoles(georesourceMetadata);
    }
  };

  /**
   * Handle delete button click
   */
  private handleDeleteClick = (event: any): void => {
    event.stopPropagation();

    const georesourceId =
      event.target.id.split('_')[3] || event.target.closest('button').id.split('_')[3];
    const georesourceMetadata =
      this.kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);

    if (this.componentRef) {
      this.componentRef.onClickDeleteGeoresource(georesourceMetadata);
    }
  };

  /**
   * Get POI column definitions
   */
  private getPoiColumnDefinitions(): ColDef[] {
    return [
      {
        headerName: 'Editierfunktionen',
        pinned: 'left',
        maxWidth: 200,
        minWidth: 180,
        checkboxSelection: false,
        headerCheckboxSelection: false,
        headerCheckboxSelectionFilteredOnly: true,
        filter: false,
        sortable: false,
        cellRenderer: 'displayEditButtons_georesources',
      },
      { headerName: 'Id', field: 'georesourceId', pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: 'datasetName', pinned: 'left', minWidth: 300 },
      {
        headerName: 'Symbolfarbe',
        field: 'poiSymbolColor',
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          const color = params.data.poiSymbolColor || '#000000';
          return `<div>${color}</div><br/><div style='width: 20px; height: 20px; background-color: ${color};'></div>`;
        },
      },
      {
        headerName: 'Symbolname',
        field: 'poiSymbolBootstrap3Name',
        maxWidth: 125,
        cellRenderer: (params: any) => {
          const symbolName = params.data.poiSymbolBootstrap3Name || 'home';
          return `${symbolName}<br/><br/><span class='glyphicon glyphicon-${symbolName}'></span>`;
        },
      },
      {
        headerName: 'Markerfarbe',
        field: 'poiMarkerColor',
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          const color = params.data.poiMarkerColor || '#000000';
          return `<div>${color}</div><br/><div style='width: 20px; height: 20px; background-color: ${color};'></div>`;
        },
      },
      {
        headerName: 'Beschreibung',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata?.description || '';
        },
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
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getTopicHierarchyDisplayString(
            params.data.topicReference
          );
        },
      },
      {
        headerName: 'Datenquelle',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata?.datasource || '';
        },
      },
      {
        headerName: 'Datenhalter und Kontakt',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata?.contact || '';
        },
      },
      {
        headerName: 'Rollen',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions);
        },
      },
      {
        headerName: 'Öffentlich sichtbar',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.isPublic ? 'ja' : 'nein';
        },
      },
      {
        headerName: 'Eigentümer',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getRoleTitle(params.data.ownerId);
        },
      },
    ];
  }

  /**
   * Get LOI column definitions
   */
  private getLoiColumnDefinitions(): ColDef[] {
    return [
      {
        headerName: 'Editierfunktionen',
        pinned: 'left',
        maxWidth: 200,
        minWidth: 180,
        checkboxSelection: false,
        headerCheckboxSelection: false,
        headerCheckboxSelectionFilteredOnly: true,
        filter: false,
        sortable: false,
        cellRenderer: 'displayEditButtons_georesources',
      },
      { headerName: 'Id', field: 'georesourceId', pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: 'datasetName', pinned: 'left', minWidth: 300 },
      {
        headerName: 'Linienfarbe',
        field: 'loiColor',
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          const color = params.data.loiColor || '#000000';
          return `<div>${color}</div><br/><div style='width: 20px; height: 20px; background-color: ${color};'></div>`;
        },
      },
      { headerName: 'Linienbreite', field: 'loiWidth', maxWidth: 125 },
      {
        headerName: 'Linienmuster',
        field: 'loiDashArrayString',
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getLoiDashSvgFromStringValue(
            params.data.loiDashArrayString
          );
        },
      },
      {
        headerName: 'Beschreibung',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata?.description || '';
        },
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
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getTopicHierarchyDisplayString(
            params.data.topicReference
          );
        },
      },
      {
        headerName: 'Datenquelle',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata?.datasource || '';
        },
      },
      {
        headerName: 'Datenhalter und Kontakt',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata?.contact || '';
        },
      },
      {
        headerName: 'Rollen',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions);
        },
      },
      {
        headerName: 'Öffentlich sichtbar',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.isPublic ? 'ja' : 'nein';
        },
      },
      {
        headerName: 'Eigentümer',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getRoleTitle(params.data.ownerId);
        },
      },
    ];
  }

  /**
   * Get AOI column definitions
   */
  private getAoiColumnDefinitions(): ColDef[] {
    return [
      {
        headerName: 'Editierfunktionen',
        pinned: 'left',
        maxWidth: 200,
        minWidth: 180,
        checkboxSelection: false,
        headerCheckboxSelection: false,
        headerCheckboxSelectionFilteredOnly: true,
        filter: false,
        sortable: false,
        cellRenderer: 'displayEditButtons_georesources',
      },
      { headerName: 'Id', field: 'georesourceId', pinned: 'left', maxWidth: 125 },
      { headerName: 'Name', field: 'datasetName', pinned: 'left', minWidth: 300 },
      {
        headerName: 'Polygonfarbe',
        field: 'aoiColor',
        maxWidth: 125,
        filter: false,
        sortable: false,
        cellRenderer: (params: any) => {
          const color = params.data.aoiColor || '#000000';
          return `<div>${color}</div><br/><div style='width: 20px; height: 20px; background-color: ${color};'></div>`;
        },
      },
      {
        headerName: 'Beschreibung',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata?.description || '';
        },
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
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getTopicHierarchyDisplayString(
            params.data.topicReference
          );
        },
      },
      {
        headerName: 'Datenquelle',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata?.datasource || '';
        },
      },
      {
        headerName: 'Datenhalter und Kontakt',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.metadata?.contact || '';
        },
      },
      {
        headerName: 'Rollen',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getAllowedRolesString(params.data.permissions);
        },
      },
      {
        headerName: 'Öffentlich sichtbar',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return params.data.isPublic ? 'ja' : 'nein';
        },
      },
      {
        headerName: 'Eigentümer',
        minWidth: 400,
        cellRenderer: (params: any) => {
          return this.kommonitorDataExchangeService.getRoleTitle(params.data.ownerId);
        },
      },
    ];
  }

  /**
   * Get selected georesources metadata from all grids
   */
  getSelectedGeoresourcesMetadata(): any[] {
    const selectedRows: any[] = [];

    if (this.poiGrid?.api) {
      selectedRows.push(...this.poiGrid.api.getSelectedRows());
    }
    if (this.loiGrid?.api) {
      selectedRows.push(...this.loiGrid.api.getSelectedRows());
    }
    if (this.aoiGrid?.api) {
      selectedRows.push(...this.aoiGrid.api.getSelectedRows());
    }

    return selectedRows;
  }

  /**
   * Get current timestamp string
   */
  getCurrentTimestampString(): string {
    return new Date().toISOString();
  }

  /**
   * Clear all grid selections
   */
  clearAllSelections(): void {
    this.poiGrid?.api?.deselectAll();
    this.loiGrid?.api?.deselectAll();
    this.aoiGrid?.api?.deselectAll();
  }

  /**
   * Refresh all grids
   */
  refreshAllGrids(): void {
    this.poiGrid?.api?.refreshCells();
    this.loiGrid?.api?.refreshCells();
    this.aoiGrid?.api?.refreshCells();
  }

  /**
   * Export grid data to CSV
   */
  exportToCsv(gridType: 'poi' | 'loi' | 'aoi'): void {
    let gridApi: GridApi | undefined = undefined;

    switch (gridType) {
      case 'poi':
        gridApi = this.poiGrid?.api;
        break;
      case 'loi':
        gridApi = this.loiGrid?.api;
        break;
      case 'aoi':
        gridApi = this.aoiGrid?.api;
        break;
    }

    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `georesources_${gridType}_${this.getCurrentTimestampString()}.csv`,
      });
    }
  }

  /**
   * Get grid options for POI grid (for ag-grid-angular)
   */
  getPoiGridOptions(): any {
    return {
      components: {
        displayEditButtons_georesources: this.displayEditButtons_georesources,
      },
      defaultColDef: {
        editable: false,
        sortable: true,
        filter: true,
        floatingFilter: true,
        resizable: true,
        wrapText: true,
        autoHeight: true,
      },
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      onModelUpdated: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      },
      onRowDataChanged: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      },
    };
  }

  /**
   * Get grid options for LOI grid (for ag-grid-angular)
   */
  getLoiGridOptions(): any {
    return {
      components: {
        displayEditButtons_georesources: this.displayEditButtons_georesources,
      },
      defaultColDef: {
        editable: false,
        sortable: true,
        filter: true,
        floatingFilter: true,
        resizable: true,
        wrapText: true,
        autoHeight: true,
      },
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      onModelUpdated: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      },
      onRowDataChanged: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      },
    };
  }

  /**
   * Get grid options for AOI grid (for ag-grid-angular)
   */
  getAoiGridOptions(): any {
    return {
      components: {
        displayEditButtons_georesources: this.displayEditButtons_georesources,
      },
      defaultColDef: {
        editable: false,
        sortable: true,
        filter: true,
        floatingFilter: true,
        resizable: true,
        wrapText: true,
        autoHeight: true,
      },
      suppressRowClickSelection: true,
      rowSelection: 'multiple',
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 10,
      suppressColumnVirtualisation: true,
      onModelUpdated: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      },
      onRowDataChanged: () => {
        setTimeout(() => {
          this.registerClickHandler_georesources([]);
        }, 100);
      },
    };
  }
}
