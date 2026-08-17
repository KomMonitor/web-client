import { HttpClient } from '@angular/common/http';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { Injectable, inject, signal } from '@angular/core';
import { CellClickedEvent, ColDef, GridApi, GridOptions } from 'ag-grid-community';
import { TranslateService } from '@ngx-translate/core';

/** Resource kinds that own an editable feature table. */
export type FeatureTableResourceType = 'spatialUnit' | 'georesource' | 'indicator';

/** Identifies the feature record a delete request removed. */
export interface DeletedFeatureRef {
  datasetId: string;
  /** Only set for indicator timeseries records. */
  spatialUnitId?: string;
  featureId: string;
  recordId: string;
}

/**
 * Hooks the owning modal passes in when it builds its grid. They replace the
 * former service-wide event Subject: each grid reports back to the component
 * that created it, so two feature tables open at the same time cannot steer
 * each other.
 */
export interface FeatureTableCallbacks {
  /** A delete request was fired (the modal shows its spinner). */
  onDeleteStart?: () => void;
  /** A feature record was deleted; the modal refreshes its table. */
  onDeleteSuccess?: (deleted: DeletedFeatureRef) => void;
  /** A delete request failed (the modal hides its spinner again). */
  onDeleteError?: (error: unknown) => void;
  /** An inline cell edit was persisted (`true`) or rejected (`false`). */
  onCellEditResult?: (success: boolean) => void;
}

/** Shared parts of both feature-table flavours. */
interface FeatureTableConfigBase {
  /** Dynamic (non-fixed) column headers. */
  headers: string[];
  resourceId?: string;
  enableDelete?: boolean;
  /**
   * Accessor for the grid's host element. The header measurement is scoped to
   * it so a second open feature table cannot be measured instead.
   */
  gridRoot?: () => Element | null | undefined;
}

export interface SpatialFeatureTableConfig extends FeatureTableConfigBase {
  resourceType: Extract<FeatureTableResourceType, 'spatialUnit' | 'georesource'>;
  /** GeoJSON features. */
  features: any[];
}

export interface IndicatorFeatureTableConfig extends FeatureTableConfigBase {
  /** Flat indicator timeseries records. */
  features: any[];
  /** Spatial unit the indicator timeseries belongs to. */
  spatialUnitId?: string;
}

/**
 * Success/failure timestamps of the last inline edit or delete in one feature
 * table. Lives on the owning modal (not on the service) so both timestamps and
 * the grid they describe share a lifetime; signal-backed for OnPush templates.
 */
export class FeatureTableEditStatus {
  readonly lastSuccess = signal<Date | undefined>(undefined);
  readonly lastFailure = signal<Date | undefined>(undefined);

  /** Record the outcome of an edit/delete round trip. */
  record(success: boolean): void {
    if (success) {
      this.lastSuccess.set(new Date());
    } else {
      this.lastFailure.set(new Date());
    }
  }

  /** Clear both banners (called from the modals' resetForm). */
  reset(): void {
    this.lastSuccess.set(undefined);
    this.lastFailure.set(undefined);
  }
}

/** Marker class on the delete buttons; dispatched via AG Grid's onCellClicked. */
const DELETE_BUTTON_CLASS = 'featureTableDeleteRecordBtn';

/**
 * Builds the editable feature table used in the spatial-unit / georesource /
 * indicator edit-features modals, and performs its inline edit (HTTP PUT) and
 * record delete (HTTP DELETE) requests.
 *
 * The service is stateless: it holds neither the grid API, the current resource
 * id nor the update timestamps. Every build call returns self-contained
 * `GridOptions` that close over the caller's config and callbacks — the owning
 * modal keeps the grid API, its `FeatureTableEditStatus` and its loading flag.
 * That is what makes two simultaneously open edit-features modals safe; the
 * former root-provided instance fields let the last opened grid win.
 */
@Injectable({
  providedIn: 'root',
})
export class FeatureTableDataGridHelperService {
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);
  private translate = inject(TranslateService);

  /**
   * Grid options for the spatial-unit / georesource feature table (GeoJSON
   * features, editable attribute columns, optional per-record delete button).
   */
  buildSpatialResourceFeatureTable(
    config: SpatialFeatureTableConfig,
    callbacks: FeatureTableCallbacks = {}
  ): GridOptions {
    return {
      ...this.buildSharedGridOptions(config),
      defaultColDef: {
        ...this.buildSharedDefaultColDef(),
        onCellValueChanged: (newValueParams: any) =>
          this.persistSpatialResourceCellEdit(newValueParams, config, callbacks),
      },
      columnDefs: this.buildSpatialResourceColumnDefs(config, callbacks),
      rowData: this.buildSpatialResourceRowData(config.features),
      rowSelection: 'multiple',
    };
  }

  /**
   * Grid options for the indicator feature table. Only the date-keyed value
   * columns are editable; the identifying and validity columns are read-only.
   */
  buildIndicatorFeatureTable(
    config: IndicatorFeatureTableConfig,
    callbacks: FeatureTableCallbacks = {}
  ): GridOptions {
    return {
      ...this.buildSharedGridOptions(config),
      defaultColDef: {
        ...this.buildSharedDefaultColDef(),
        onCellValueChanged: (newValueParams: any) =>
          this.persistIndicatorCellEdit(newValueParams, config, callbacks),
      },
      columnDefs: this.buildIndicatorColumnDefs(config, callbacks),
      rowData: this.buildIndicatorRowData(config.features),
    };
  }

  /**
   * Measure the tallest rendered header text so multi-line column titles are
   * not clipped, and apply it to the given grid. Scoped to `gridRoot` — a
   * document-wide query would pick up another open grid's headers.
   */
  applyHeaderHeight(api: GridApi | null | undefined, gridRoot?: Element | null): void {
    if (!api) return;
    api.setGridOption('headerHeight', this.measureHeaderHeight(gridRoot));
  }

  /** Tallest header-cell text within `gridRoot`, plus padding (minimum 50px). */
  measureHeaderHeight(gridRoot?: Element | null): number {
    if (!gridRoot) return 50;

    let maxHeight = 0;
    gridRoot.querySelectorAll('.ag-header-cell-text').forEach((element) => {
      const height = Math.max((element as HTMLElement).offsetHeight, element.scrollHeight);
      if (height > maxHeight) {
        maxHeight = height;
      }
    });

    return Math.max(maxHeight + 20, 50);
  }

  // ---------------------------------------------------------------------------
  // Shared grid configuration
  // ---------------------------------------------------------------------------

  private buildSharedGridOptions(config: FeatureTableConfigBase): GridOptions {
    return {
      // enables undo / redo, restricted to 10 steps
      undoRedoCellEditing: true,
      undoRedoCellEditingLimit: 10,
      // enables flashing to help see cell changes
      enableCellChangeFlash: true,
      suppressRowClickSelection: true,
      enableCellTextSelection: true,
      ensureDomOrder: true,
      pagination: true,
      paginationPageSize: 20,
      paginationPageSizeSelector: [10, 20, 50, 100],
      suppressColumnVirtualisation: true,
      onFirstDataRendered: (event) => this.applyHeaderHeight(event.api, config.gridRoot?.()),
      onColumnResized: (event) => this.applyHeaderHeight(event.api, config.gridRoot?.()),
    };
  }

  private buildSharedDefaultColDef(): ColDef {
    return {
      editable: true,
      sortable: true,
      flex: 1,
      minWidth: 150,
      filter: true,
      floatingFilter: true,
      resizable: true,
      wrapText: true,
      autoHeight: true,
      cellEditor: 'agLargeTextCellEditor',
      cellStyle: {
        'font-size': '12px',
        'white-space': 'normal !important',
        'line-height': '20px !important',
        'word-break': 'break-word !important',
        'padding-top': '17px',
        'padding-bottom': '17px',
      },
    };
  }

  /**
   * Renders the per-record delete button. The row data carries the ids, so the
   * button needs no encoded element id — the click is dispatched by CSS class
   * through this column's `onCellClicked`.
   */
  private renderDeleteButton(recordLabel: string): string {
    const title = this.translate.instant('ADMIN_SHARED_UI.GRID.DELETE_RECORD_TITLE');
    return (
      `<button class="btn btn-danger btn-sm ${DELETE_BUTTON_CLASS}" type="button" ` +
      `title="${title}">` +
      `<i class="fas fa-trash"></i></button>` +
      recordLabel
    );
  }

  /**
   * Header texts of the fixed columns, shared by both feature tables.
   *
   * NOTE: only the labels are shared. The `field` names deliberately are not:
   * the spatial-resource table hardcodes 'ID'/'NAME'/'validStartDate'/
   * 'validEndDate' while the indicator table reads the configurable
   * `EnvConfigService.*_PROPERTY_NAME` values. They agree in the default config
   * but would diverge in a deployment that overrides them — unifying that is a
   * behaviour change, not a rename.
   */
  private fixedColumnHeaders(): Record<'recordId' | 'featureId' | 'name' | 'from' | 'to', string> {
    return {
      recordId: this.translate.instant('ADMIN_SHARED_UI.GRID.COL_DB_RECORD_ID'),
      featureId: this.translate.instant('ADMIN_SHARED_UI.GRID.COL_FEATURE_ID'),
      name: this.translate.instant('ADMIN_SHARED.NAME'),
      from: this.translate.instant('ADMIN_SHARED_UI.GRID.COL_VALID_START'),
      to: this.translate.instant('ADMIN_SHARED_UI.GRID.COL_VALID_END'),
    };
  }

  /**
   * Dispatch a click inside the record-id cell to `handler`, but only when the
   * delete button itself was hit. Replaces the former global
   * `document.querySelectorAll(...).addEventListener` registration (which
   * attached to every open grid's buttons and needed setTimeout re-runs).
   */
  private onDeleteButtonClicked(handler: (event: CellClickedEvent) => void) {
    return (event: CellClickedEvent): void => {
      const target = event.event?.target as HTMLElement | null;
      if (!target?.closest('.' + DELETE_BUTTON_CLASS)) return;
      handler(event);
    };
  }

  // ---------------------------------------------------------------------------
  // Spatial unit / georesource feature table
  // ---------------------------------------------------------------------------

  private buildSpatialResourceColumnDefs(
    config: SpatialFeatureTableConfig,
    callbacks: FeatureTableCallbacks
  ): ColDef[] {
    const enableDelete = config.enableDelete ?? false;
    const headers = this.fixedColumnHeaders();

    const columnDefs: ColDef[] = [
      {
        // The record-id column doubles as the delete-button column
        headerName: headers.recordId,
        field: 'kommonitorRecordId',
        pinned: 'left',
        editable: false,
        maxWidth: 125,
        cellClass: 'grid-non-editable',
        cellRenderer: (params: any) => {
          const recordLabel = params.data.kommonitorRecordId || params.data.id || '';
          if (!enableDelete) return recordLabel;
          return this.renderDeleteButton('<br/>' + recordLabel);
        },
        onCellClicked: this.onDeleteButtonClicked((event) =>
          this.deleteSpatialResourceFeature(event.data, config, callbacks)
        ),
      },
      {
        headerName: headers.featureId,
        field: 'ID',
        pinned: 'left',
        editable: false,
        cellClass: 'grid-non-editable',
        maxWidth: 125,
      },
      {
        headerName: headers.name,
        field: 'NAME',
        pinned: 'left',
        minWidth: 150,
      },
      {
        headerName: headers.from,
        field: 'validStartDate',
        minWidth: 150,
      },
      {
        headerName: headers.to,
        field: 'validEndDate',
        minWidth: 150,
      },
    ];

    for (const header of config.headers) {
      columnDefs.push({ headerName: header, field: header, minWidth: 125 });
    }

    return columnDefs;
  }

  /**
   * Flatten GeoJSON features for the grid: geometry and database record id are
   * copied into the properties so the edit handler can rebuild the feature.
   */
  private buildSpatialResourceRowData(features: any[]): any[] {
    if (!features || !Array.isArray(features)) {
      return [];
    }

    return features.map((feature) => {
      if (feature.properties) {
        feature.properties.kommonitorGeometry = feature.geometry;
        feature.properties.kommonitorRecordId = feature.id;
        return feature.properties;
      }

      // Already a flat object — make sure the record id is present
      if (feature.id && !feature.kommonitorRecordId) {
        feature.kommonitorRecordId = feature.id;
      }

      return feature;
    });
  }

  private deleteSpatialResourceFeature(
    rowData: any,
    config: SpatialFeatureTableConfig,
    callbacks: FeatureTableCallbacks
  ): void {
    const datasetId = config.resourceId;
    const featureId = rowData?.['ID'] || rowData?.['featureId'] || '';
    const recordId = rowData?.kommonitorRecordId || rowData?.id || '';
    if (!datasetId || !featureId || !recordId) return;

    const collection = config.resourceType === 'georesource' ? 'georesources' : 'spatial-units';
    const url =
      `${this.envConfigService.baseUrlToKomMonitorDataAPI}/${collection}/${datasetId}` +
      `/singleFeature/${featureId}/singleFeatureRecord/${recordId}`;

    callbacks.onDeleteStart?.();
    this.http.delete(url).subscribe({
      next: () => {
        callbacks.onCellEditResult?.(true);
        callbacks.onDeleteSuccess?.({ datasetId, featureId, recordId });
      },
      error: (error) => {
        callbacks.onCellEditResult?.(false);
        callbacks.onDeleteError?.(error);
      },
    });
  }

  private persistSpatialResourceCellEdit(
    newValueParams: any,
    config: SpatialFeatureTableConfig,
    callbacks: FeatureTableCallbacks
  ): void {
    this.normalizeValidityDates(newValueParams);

    // Rebuild the GeoJSON feature from the edited row
    const geoJSON: any = {
      type: 'Feature',
      geometry: JSON.parse(JSON.stringify(newValueParams.data.kommonitorGeometry)),
      id: JSON.parse(JSON.stringify(newValueParams.data.kommonitorRecordId)),
      properties: JSON.parse(JSON.stringify(newValueParams.data)),
    };
    delete geoJSON.properties.kommonitorGeometry;
    delete geoJSON.properties.kommonitorRecordId;

    const collection = config.resourceType === 'georesource' ? 'georesources' : 'spatial-units';
    const url =
      `${this.envConfigService.baseUrlToKomMonitorDataAPI}/${collection}/${config.resourceId}` +
      `/singleFeature/${newValueParams.data.ID}/singleFeatureRecord/${newValueParams.data.kommonitorRecordId}`;

    this.putCellEdit(url, geoJSON, newValueParams, callbacks);
  }

  /** Keep the validity dates parseable; fall back to the previous value. */
  private normalizeValidityDates(newValueParams: any): void {
    const isDate = (date: any) => {
      const dateObj = new Date(date);
      return dateObj.toString() !== 'Invalid Date' && !isNaN(dateObj.getTime());
    };

    if (!newValueParams.data.validStartDate || !isDate(newValueParams.data.validStartDate)) {
      newValueParams.data.validStartDate = newValueParams.oldValue;
    }

    if (newValueParams.data.validEndDate === '') {
      newValueParams.data.validEndDate = undefined;
    }

    if (newValueParams.data.validEndDate && !isDate(newValueParams.data.validEndDate)) {
      newValueParams.data.validEndDate = newValueParams.oldValue;
    }
  }

  // ---------------------------------------------------------------------------
  // Indicator feature table
  // ---------------------------------------------------------------------------

  private buildIndicatorColumnDefs(
    config: IndicatorFeatureTableConfig,
    callbacks: FeatureTableCallbacks
  ): ColDef[] {
    const enableDelete = config.enableDelete ?? false;
    const headers = this.fixedColumnHeaders();

    const columnDefs: ColDef[] = [
      {
        headerName: headers.recordId,
        field: 'fid',
        pinned: 'left',
        editable: false,
        cellClass: 'grid-non-editable',
        maxWidth: 125,
        cellRenderer: (params: any) => {
          const recordLabel = params.data.fid ?? '';
          if (!enableDelete) return recordLabel;
          return this.renderDeleteButton('&nbsp;&nbsp;' + recordLabel);
        },
        onCellClicked: this.onDeleteButtonClicked((event) =>
          this.deleteIndicatorFeature(event.data, config, callbacks)
        ),
      },
      {
        headerName: headers.featureId,
        field: this.envConfigService.FEATURE_ID_PROPERTY_NAME,
        pinned: 'left',
        editable: false,
        cellClass: 'grid-non-editable',
        maxWidth: 125,
      },
      {
        headerName: headers.name,
        field: this.envConfigService.FEATURE_NAME_PROPERTY_NAME,
        pinned: 'left',
        minWidth: 200,
        editable: false,
        cellClass: 'grid-non-editable',
      },
      {
        headerName: headers.from,
        field: this.envConfigService.VALID_START_DATE_PROPERTY_NAME,
        minWidth: 125,
        editable: false,
        cellClass: 'grid-non-editable',
      },
      {
        headerName: headers.to,
        field: this.envConfigService.VALID_END_DATE_PROPERTY_NAME,
        minWidth: 125,
        editable: false,
        cellClass: 'grid-non-editable',
      },
    ];

    // Date-keyed value columns are the only editable ones
    for (const header of config.headers) {
      columnDefs.push({ headerName: '' + header, field: '' + header, minWidth: 125 });
    }

    return columnDefs;
  }

  private buildIndicatorRowData(features: any[]): any[] {
    if (!features || !Array.isArray(features)) {
      return [];
    }
    return features.map((dataItem) => {
      // arisenFrom is currently never used
      delete dataItem.arisenFrom;
      return dataItem;
    });
  }

  private deleteIndicatorFeature(
    rowData: any,
    config: IndicatorFeatureTableConfig,
    callbacks: FeatureTableCallbacks
  ): void {
    const datasetId = config.resourceId;
    const spatialUnitId = config.spatialUnitId;
    const featureId = rowData?.[this.envConfigService.FEATURE_ID_PROPERTY_NAME] || '';
    const recordId = rowData?.fid ?? '';
    if (!datasetId || !spatialUnitId || !featureId || recordId === '') return;

    const url =
      `${this.envConfigService.baseUrlToKomMonitorDataAPI}` +
      `/indicators/${datasetId}/${spatialUnitId}/singleFeature/${featureId}/singleFeatureRecord/${recordId}`;

    callbacks.onDeleteStart?.();
    this.http.delete(url).subscribe({
      next: () => {
        callbacks.onCellEditResult?.(true);
        callbacks.onDeleteSuccess?.({ datasetId, spatialUnitId, featureId, recordId });
      },
      error: (error) => {
        callbacks.onCellEditResult?.(false);
        callbacks.onDeleteError?.(error);
      },
    });
  }

  private persistIndicatorCellEdit(
    newValueParams: any,
    config: IndicatorFeatureTableConfig,
    callbacks: FeatureTableCallbacks
  ): void {
    // Only the indicator's feature id, the DB record id (fid) and the
    // date-prefixed value columns are sent on update.
    const json: any = JSON.parse(JSON.stringify(newValueParams.data));
    const allowedProperties = [this.envConfigService.FEATURE_ID_PROPERTY_NAME, 'fid'];

    for (const key of Object.keys(json)) {
      if (
        !key.includes(this.envConfigService.indicatorDatePrefix) &&
        !allowedProperties.includes(key)
      ) {
        delete json[key];
      }
    }
    delete json[this.envConfigService.VALID_START_DATE_PROPERTY_NAME];
    delete json[this.envConfigService.VALID_END_DATE_PROPERTY_NAME];
    delete json[this.envConfigService.FEATURE_NAME_PROPERTY_NAME];

    // Empty value cells are transmitted as null
    for (const key of Object.keys(json)) {
      if (key.includes(this.envConfigService.indicatorDatePrefix) && json[key] === '') {
        json[key] = null;
      }
    }

    const url =
      `${this.envConfigService.baseUrlToKomMonitorDataAPI}` +
      `/indicators/${config.resourceId}/${config.spatialUnitId}/singleFeature/` +
      `${newValueParams.data[this.envConfigService.FEATURE_ID_PROPERTY_NAME]}/singleFeatureRecord/${newValueParams.data.fid}`;

    this.putCellEdit(url, json, newValueParams, callbacks);
  }

  // ---------------------------------------------------------------------------
  // Shared inline-edit round trip
  // ---------------------------------------------------------------------------

  /**
   * PUT one edited record and colour the cell by the outcome (green on success,
   * red plus value rollback on failure).
   */
  private putCellEdit(
    url: string,
    body: any,
    newValueParams: any,
    callbacks: FeatureTableCallbacks
  ): void {
    this.http.put(url, body, { headers: { 'Content-Type': 'application/json' } }).subscribe({
      next: () => {
        this.markEditedCell(newValueParams, '#9DC89F');
        callbacks.onCellEditResult?.(true);
      },
      error: () => {
        // Reset cell value as an error occurred
        newValueParams.data[newValueParams.column.colId] = newValueParams.oldValue;
        this.markEditedCell(newValueParams, '#E79595');
        callbacks.onCellEditResult?.(false);
      },
    });
  }

  private markEditedCell(newValueParams: any, backgroundColor: string): void {
    newValueParams.colDef.cellStyle = (p: any) =>
      p.rowIndex.toString() === newValueParams.node.id
        ? { 'background-color': backgroundColor }
        : '';

    newValueParams.api.refreshCells({
      force: true,
      columns: [newValueParams.column.getId()],
      rowNodes: [newValueParams.node],
    });
  }
}
