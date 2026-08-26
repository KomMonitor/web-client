import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IndicatorMetadataStoreService } from '../../../../../services/indicator-metadata-store-service/indicator-metadata-store.service';
import { SpatialUnitMetadataStoreService } from '../../../../../services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';
import { downloadJson, readJsonFile } from 'util/json-file.util';

interface BatchListItem {
  isSelected: boolean;
  name: any;
  mappingTableName: string;
  mappingObj: {
    converter: any;
    dataSource: any;
    propertyMapping: {
      timeseriesMappings: any[];
      spatialReferenceKeyProperty: string;
      keepMissingOrNullValueIndicator: boolean;
    };
    targetSpatialUnitName: string;
  };
  selectedConverter: any;
  selectedDatasourceType: any;
  selectedTargetSpatialUnit: any;
}

/**
 * WORK IN PROGRESS — deliberately unfinished.
 *
 * The indicator batch-update feature is a non-functional scaffold: the form and
 * file import/export work, but there is no real batch-update backend call yet
 * (`startBatchUpdate` is a no-op), the converter/datasource dropdowns have no
 * data source (`getAvailableConverters`/`getAvailableDatasourceTypes` return
 * empty), and several row actions are unimplemented. The methods below are kept
 * as bound stubs so the template renders; each carries a `TODO(batch-update)`
 * marking what still needs to be built. Do not treat a successful click as a
 * completed update.
 */
@Component({
  selector: 'app-indicator-batch-update-modal',
  templateUrl: './indicator-batch-update-modal.component.html',
  styleUrls: ['./indicator-batch-update-modal.component.scss'],
  imports: [TranslateModule, FormsModule, CommonModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicatorBatchUpdateModalComponent implements OnInit, OnDestroy {
  private broadcastService = inject(BroadcastService);
  private cdr = inject(ChangeDetectorRef);
  protected indicatorStore = inject(IndicatorMetadataStoreService);
  protected spatialUnitStore = inject(SpatialUnitMetadataStoreService);

  @ViewChild('batchListFileInput') batchListFileInput!: ElementRef;
  @Input() modalRef?: NgbModalRef;

  public isFirstStart: boolean = true;
  public lastUpdateResponseObj: any;
  public selected: any = { value: null };
  public keepMissingValues: boolean = true;
  public batchList: BatchListItem[] = [];
  public allRowsSelected: boolean = false;
  // Signal: kept for future async batch flows (OnPush).
  public loadingData = signal(false);

  private subscriptions: Subscription[] = [];
  private keyDownHandler: (event: KeyboardEvent) => void;

  constructor() {
    this.keyDownHandler = this.handleKeyDown.bind(this);
  }

  ngOnInit(): void {
    this.setupEventListeners();
    this.initialize();

    // Add keyboard event listener for Escape key
    document.addEventListener('keydown', this.keyDownHandler);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Remove keyboard event listener
    document.removeEventListener('keydown', this.keyDownHandler);
  }

  private setupEventListeners(): void {
    // Listen for batch update completion
    const sub1 = this.broadcastService.currentBroadcastMsg.subscribe((data) => {
      if (
        data.msg === BroadcastMessage.BatchUpdateCompleted &&
        (data as any).resourceType === 'indicator'
      ) {
        this.lastUpdateResponseObj = data;
      } else if (data.msg === BroadcastMessage.RefreshIndicatorOverviewTableCompleted) {
        this.refreshNameColumn();
      }
      // Bus callbacks mutate template-bound fields on this OnPush view.
      this.cdr.markForCheck();
    });
    this.subscriptions.push(sub1);
  }

  public openModal(): void {
    // This method will be called from the parent component
    this.initialize();
  }

  private initialize(): void {
    if (this.isFirstStart) {
      this.addNewRowToBatchList();
      this.isFirstStart = false;
    }

    // Set initial selected value if available
    if (
      this.indicatorStore.availableIndicators &&
      this.indicatorStore.availableIndicators.length > 0
    ) {
      this.selected.value = this.indicatorStore.availableIndicators[0];
    }
  }

  public addNewRowToBatchList(): void {
    const newRow: BatchListItem = {
      isSelected: true,
      name: null,
      mappingTableName: '',
      mappingObj: {
        converter: {
          encoding: '',
          mimeType: '',
          name: '',
          parameters: [],
          schema: '',
          crs: 'EPSG:4326',
          separator: ',',
          schemaNamespace: '',
          schemaLocation: '',
        },
        dataSource: {
          parameters: [],
          type: 'FILE',
          url: '',
          payload: '',
        },
        propertyMapping: {
          timeseriesMappings: [],
          spatialReferenceKeyProperty: '',
          keepMissingOrNullValueIndicator: true,
        },
        targetSpatialUnitName: '',
      },
      selectedConverter: null,
      selectedDatasourceType: null,
      selectedTargetSpatialUnit: null,
    };

    this.batchList.push(newRow);
  }

  public deleteSelectedRowsFromBatchList(): void {
    this.batchList = this.batchList.filter((row) => !row.isSelected);
  }

  public onChangeSelectAllRows(): void {
    this.batchList.forEach((row) => {
      row.isSelected = this.allRowsSelected;
    });
  }

  public loadIndicatorsBatchList(): void {
    if (this.batchListFileInput) {
      this.batchListFileInput.nativeElement.click();
    }
  }

  public onBatchListFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.parseBatchListFromFile(file);
    }
  }

  private async parseBatchListFromFile(file: File): Promise<void> {
    try {
      const newBatchList = await readJsonFile(file);
      this.processParsedBatchList(newBatchList);
    } catch (error) {
      console.error('Error parsing batch list file:', error);
    }
    // The import rewrote the template-bound batch list after an await (OnPush).
    this.cdr.markForCheck();
  }

  private processParsedBatchList(newBatchList: any[]): void {
    // Remove all existing rows
    this.batchList.forEach((row) => (row.isSelected = true));
    this.deleteSelectedRowsFromBatchList();

    // Add new rows from file
    newBatchList.forEach((item: any) => {
      this.addNewRowToBatchList();
      const row = this.batchList[this.batchList.length - 1];

      row.isSelected = item.isSelected;

      // Set indicator by ID
      const indicatorId = item.name;
      const indicatorObj = this.indicatorStore.getIndicatorMetadataById(indicatorId);
      row.name = indicatorObj;

      row.mappingTableName = item.mappingTableName;
      row.mappingObj = item.mappingObj;

      // Convert parameters to properties
      if (row.mappingObj.converter) {
        row.mappingObj.converter = this.converterParametersArrayToProperties(
          row.mappingObj.converter
        );
      }
      if (row.mappingObj.dataSource) {
        row.mappingObj.dataSource = this.dataSourceParametersArrayToProperty(
          row.mappingObj.dataSource
        );
      }

      // Set selected objects
      if (item.mappingObj.converter?.name) {
        row.selectedConverter = this.getConverterObjectByName(item.mappingObj.converter.name);
      }
      if (item.mappingObj.dataSource?.type) {
        row.selectedDatasourceType = this.getDatasourceTypeObjectByType(
          item.mappingObj.dataSource.type
        );
      }
      if (item.mappingObj.targetSpatialUnitName) {
        row.selectedTargetSpatialUnit = this.getSpatialUnitObjectByName(
          item.mappingObj.targetSpatialUnitName
        );
      }
    });
  }

  public onMappingTableSelected(_event: Event, _index: number): void {
    // TODO(batch-update): parse the selected mapping-table file and apply it to
    // the row at the given index. Not implemented yet.
  }

  public onDataSourceFileSelected(_event: Event, _index: number): void {
    // TODO(batch-update): parse the selected data-source file and apply it to
    // the row at the given index. Not implemented yet.
  }

  public onTimeseriesMappingBtnClicked(_event: any, _index: number): void {
    // TODO(batch-update): open the timeseries-mapping modal for the given row.
    // Not implemented yet.
  }

  public onDefaultTimeseriesMappingBtnClicked(_event: any): void {
    // TODO(batch-update): open the default timeseries-mapping modal.
    // Not implemented yet.
  }

  public saveMappingObjectToFile(event: any, index: number): void {
    const row = this.batchList[index];
    const mappingData = {
      name: row.name?.indicatorId || '',
      mappingTableName: row.mappingTableName,
      mappingObj: row.mappingObj,
      isSelected: row.isSelected,
    };

    downloadJson(
      `indicator-mapping-${row.name?.indicatorName || 'unknown'}.json`,
      JSON.stringify(mappingData, null, 2)
    );
  }

  public startBatchUpdate(): void {
    // TODO(batch-update): call the real batch-update backend for the assembled
    // batchList and broadcast BatchUpdateCompleted with the actual response.
    // No-op for now — the update is not implemented, so nothing is persisted.
    // The previous implementation faked a success result, which was misleading.
  }

  public reopenResultModal(): void {
    if (this.lastUpdateResponseObj) {
      this.broadcastService.broadcast(
        BroadcastMessage.ReopenBatchUpdateResultModal,
        this.lastUpdateResponseObj
      );
    }
  }

  private refreshNameColumn(): void {
    // TODO(batch-update): refresh the indicator name-column dropdowns after the
    // overview table reloaded. Not implemented yet.
  }

  // Helper methods for parameter conversion
  private converterParametersArrayToProperties(converter: any): any {
    const properties: any = {};
    if (converter.parameters) {
      converter.parameters.forEach((param: any) => {
        const propertyName = this.getConverterParameterPropertyName(param.name);
        if (propertyName) {
          properties[propertyName] = param.value;
        }
      });
    }
    return { ...converter, ...properties };
  }

  private dataSourceParametersArrayToProperty(dataSource: any): any {
    const properties: any = {};
    if (dataSource.parameters) {
      dataSource.parameters.forEach((param: any) => {
        const propertyName = this.getDataSourceParameterPropertyName(param.name);
        if (propertyName) {
          properties[propertyName] = param.value;
        }
      });
    }
    return { ...dataSource, ...properties };
  }

  private getConverterParameterPropertyName(paramName: string): string | null {
    const mapping: { [key: string]: string } = {
      CRS: 'crs',
      Hausnummer_Spaltenname: 'hnrColumnName',
      Strasse_Spaltenname: 'streetColumnName',
      Adresse_Spaltenname: 'addressColumnName',
      Strasse_Hausnummer_Spaltenname: 'streetHnrColumnName',
      X_Koordinatenspalte_Rechtswert: 'xCoordColumnName',
      Y_Koordinatenspalte_Hochwert: 'yCoordColumnName',
      Postleitzahl_Spaltenname: 'plzColumnName',
      Stadt_Spaltenname: 'cityColumnName',
      NAMESPACE: 'schemaNamespace',
      SCHEMA_LOCATION: 'schemaLocation',
      Trennzeichen: 'separator',
    };
    return mapping[paramName] || null;
  }

  private getDataSourceParameterPropertyName(paramName: string): string | null {
    const mapping: { [key: string]: string } = {
      NAME: 'name',
      URL: 'url',
      payload: 'payload',
    };
    return mapping[paramName] || null;
  }

  private getConverterObjectByName(_name: string): any {
    // TODO(batch-update): resolve the converter object by name once a typed
    // converter source is available. Returns null for now, so imported batch
    // files do not populate selectedConverter.
    return null;
  }

  private getDatasourceTypeObjectByType(_type: string): any {
    // TODO(batch-update): resolve the datasource-type object by type once a
    // typed source is available. Returns null for now, so imported batch files
    // do not populate selectedDatasourceType.
    return null;
  }

  private getSpatialUnitObjectByName(name: string): any {
    // Implementation to get spatial unit object by name
    if (this.spatialUnitStore.availableSpatialUnits) {
      return this.spatialUnitStore.availableSpatialUnits.find((s) => s.spatialUnitLevel === name);
    }
    return null;
  }

  // Column visibility methods
  public checkColumnsToShowSelectedConverter(): string[] {
    const converters = this.batchList
      .map((row) => row.selectedConverter?.name)
      .filter((name) => name);

    const columns: string[] = [];
    if (converters.some((name) => name && name.includes('Tabelle_Zeitreihe_zu_Indikator'))) {
      columns.push('Tabelle_Zeitreihe_zu_Indikator');
    }
    if (converters.some((name) => name && name.includes('WFS_v1'))) {
      columns.push('WFS_v1');
    }
    return columns;
  }

  public checkIfSelectedDatasourceTypeIsFile(): boolean {
    return this.batchList.some((row) => row.selectedDatasourceType?.type === 'FILE');
  }

  public checkIfSelectedDatasourceTypeIsHttp(): boolean {
    return this.batchList.some((row) => row.selectedDatasourceType?.type === 'HTTP');
  }

  public checkIfSelectedDatasourceTypeIsInline(): boolean {
    return this.batchList.some((row) => row.selectedDatasourceType?.type === 'INLINE');
  }

  public checkIfSelectedConverterIsCsvOnlyIndicator(): boolean {
    return this.batchList.some((row) => row.selectedConverter?.name?.includes('csv_onlyIndicator'));
  }

  // Helper methods to get available options
  public getAvailableConverters(): any[] {
    // TODO(batch-update): supply the available importer converters. Empty for
    // now, so the converter dropdowns render no options.
    return [];
  }

  public getAvailableDatasourceTypes(): any[] {
    // TODO(batch-update): supply the available importer datasource types. Empty
    // for now, so the datasource dropdowns render no options.
    return [];
  }

  // Default value function properties
  public colDefaultFunctionSelectedColumn: string | null = null;
  public colDefaultFunctionNewValue: any = undefined;
  public colDefaultFunctionAllRowsChb: boolean = false;

  public onClickSaveColDefaultValue(): void {
    // TODO(batch-update): apply colDefaultFunctionNewValue to the selected
    // column across the chosen rows. Not implemented yet.
  }

  public saveBatchListToFile(): void {
    const batchData = this.batchList.map((item) => ({
      name: item.name?.indicatorId || '',
      mappingTableName: item.mappingTableName,
      mappingObj: item.mappingObj,
      isSelected: item.isSelected,
    }));

    downloadJson('indicator-batch-list.json', JSON.stringify(batchData, null, 2));
  }

  public checkIfNameAndFilesChosenInEachRow(): boolean {
    // Check if each row has required fields filled
    return (
      this.batchList.length > 0 &&
      this.batchList.every(
        (row) =>
          row.name &&
          row.selectedConverter &&
          row.selectedDatasourceType &&
          row.mappingObj.propertyMapping.spatialReferenceKeyProperty &&
          row.selectedTargetSpatialUnit
      )
    );
  }

  public resetBatchUpdateForm(): void {
    this.batchList = [];
    this.addNewRowToBatchList();
    this.colDefaultFunctionSelectedColumn = null;
    this.colDefaultFunctionNewValue = undefined;
    this.colDefaultFunctionAllRowsChb = false;
  }

  public closeModal(): void {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }
}
