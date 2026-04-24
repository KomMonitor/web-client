import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Input,
} from "@angular/core";
import { NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Subscription } from "rxjs";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { DataExchangeService } from "../../../../../services/data-exchange-service/data-exchange.service";

declare const $: any;
declare const __env: any;

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

@Component({
  selector: "indicator-batch-update-modal",
  templateUrl: "./indicator-batch-update-modal.component.html",
  styleUrls: ["./indicator-batch-update-modal.component.css"],
  imports: [FormsModule, CommonModule],
  standalone: true,
})
export class IndicatorBatchUpdateModalComponent implements OnInit, OnDestroy {

  @ViewChild('batchListFileInput') batchListFileInput!: ElementRef;
  @Input() modalRef?: NgbModalRef;

  public isFirstStart: boolean = true;
  public lastUpdateResponseObj: any;
  public timeseriesMappingReference: any;
  public selected: any = { value: null };
  public keepMissingValues: boolean = true;
  public batchList: BatchListItem[] = [];
  public timeseriesMappingModalOpenForIndex: number | undefined;
  public defaultTimeseriesMappingSave: any[] = [];
  public allRowsSelected: boolean = false;
  public loadingData: boolean = false;

  private subscriptions: Subscription[] = [];
  private keyDownHandler: (event: KeyboardEvent) => void;

  constructor(
    private broadcastService: BroadcastService,
    protected dataExchangeService: DataExchangeService,
  ) {
    this.keyDownHandler = this.handleKeyDown.bind(this);
  }

  ngOnInit(): void {
    this.setupEventListeners();
    this.initialize();
    
    // Add keyboard event listener for Escape key
    document.addEventListener('keydown', this.keyDownHandler);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Remove keyboard event listener
    document.removeEventListener('keydown', this.keyDownHandler);
  }

  private setupEventListeners(): void {
    // Listen for batch update completion
    const sub1 = this.broadcastService.currentBroadcastMsg.subscribe(data => {
      if (data.msg === 'batchUpdateCompleted' && (data as any).resourceType === 'indicator') {
        this.lastUpdateResponseObj = data;
      }
      else if (data.msg === 'refreshIndicatorOverviewTableCompleted') {
        this.refreshNameColumn();
      }
      else if (data.msg === 'timeseriesMappingChanged') {
        this.timeseriesMappingReference = (data as any).mapping;
      }
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
    if (this.dataExchangeService.availableIndicators && 
        this.dataExchangeService.availableIndicators.length > 0) {
      this.selected.value = this.dataExchangeService.availableIndicators[0];
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
          schemaLocation: ''
        },
        dataSource: {
          parameters: [],
          type: 'FILE',
          url: '',
          payload: ''
        },
        propertyMapping: {
          timeseriesMappings: [],
          spatialReferenceKeyProperty: '',
          keepMissingOrNullValueIndicator: true
        },
        targetSpatialUnitName: ''
      },
      selectedConverter: null,
      selectedDatasourceType: null,
      selectedTargetSpatialUnit: null
    };

    this.batchList.push(newRow);
  }

  public deleteSelectedRowsFromBatchList(): void {
    this.batchList = this.batchList.filter(row => !row.isSelected);
  }

  public onChangeSelectAllRows(): void {
    this.batchList.forEach(row => {
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

  private parseBatchListFromFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const newBatchList = JSON.parse(e.target.result);
        this.processParsedBatchList(newBatchList);
      } catch (error) {
        console.error('Error parsing batch list file:', error);
      }
    };
    reader.readAsText(file);
  }

  private processParsedBatchList(newBatchList: any[]): void {
    // Remove all existing rows
    this.batchList.forEach(row => row.isSelected = true);
    this.deleteSelectedRowsFromBatchList();

    // Add new rows from file
    newBatchList.forEach((item: any) => {
      this.addNewRowToBatchList();
      const row = this.batchList[this.batchList.length - 1];

      row.isSelected = item.isSelected;
      
      // Set indicator by ID
      const indicatorId = item.name;
      const indicatorObj = this.dataExchangeService.getIndicatorMetadataById(indicatorId);
      row.name = indicatorObj;

      row.mappingTableName = item.mappingTableName;
      row.mappingObj = item.mappingObj;

      // Convert parameters to properties
      if (row.mappingObj.converter) {
        row.mappingObj.converter = this.converterParametersArrayToProperties(row.mappingObj.converter);
      }
      if (row.mappingObj.dataSource) {
        row.mappingObj.dataSource = this.dataSourceParametersArrayToProperty(row.mappingObj.dataSource);
      }

      // Set selected objects
      if (item.mappingObj.converter?.name) {
        row.selectedConverter = this.getConverterObjectByName(item.mappingObj.converter.name);
      }
      if (item.mappingObj.dataSource?.type) {
        row.selectedDatasourceType = this.getDatasourceTypeObjectByType(item.mappingObj.dataSource.type);
      }
      if (item.mappingObj.targetSpatialUnitName) {
        row.selectedTargetSpatialUnit = this.getSpatialUnitObjectByName(item.mappingObj.targetSpatialUnitName);
      }
    });
  }

  public onMappingTableSelected(event: Event, index: number): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Implementation for mapping table selection
      console.log('Mapping table selected for index:', index, file);
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          // Handle mapping table file content
          console.log('Mapping table file content loaded for index:', index);
        } catch (error) {
          console.error('Error reading mapping table file:', error);
        }
      };
      reader.readAsText(file);
    }
  }

  public onDataSourceFileSelected(event: Event, index: number): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Implementation for data source file selection
      console.log('Data source file selected for index:', index, file);
      
      const reader = new FileReader();
      reader.onload = () => {
        try {
          // Handle data source file content
          console.log('Data source file content loaded for index:', index);
        } catch (error) {
          console.error('Error reading data source file:', error);
        }
      };
      reader.readAsText(file);
    }
  }

  public onTimeseriesMappingBtnClicked(event: any, index: number): void {
    this.timeseriesMappingModalOpenForIndex = index;
    // Open timeseries mapping modal
    console.log('Opening timeseries mapping modal for index:', index);
  }

  public onDefaultTimeseriesMappingBtnClicked(event: any): void {
    // Open default timeseries mapping modal
    console.log('Opening default timeseries mapping modal');
  }

  public saveMappingObjectToFile(event: any, index: number): void {
    const row = this.batchList[index];
    const mappingData = {
      name: row.name?.indicatorId || '',
      mappingTableName: row.mappingTableName,
      mappingObj: row.mappingObj,
      isSelected: row.isSelected
    };

    const blob = new Blob([JSON.stringify(mappingData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicator-mapping-${row.name?.indicatorName || 'unknown'}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  public startBatchUpdate(): void {
    this.loadingData = true;
    
    // Implementation for batch update
    console.log('Starting batch update for indicators:', this.batchList);
    
    // Simulate batch update process
    setTimeout(() => {
      this.loadingData = false;
      this.broadcastService.broadcast('batchUpdateCompleted', {
        resourceType: 'indicator',
        status: 'success',
        message: 'Batch update completed successfully'
      });
    }, 2000);
  }

  public reopenResultModal(): void {
    if (this.lastUpdateResponseObj) {
      this.broadcastService.broadcast('reopenBatchUpdateResultModal', this.lastUpdateResponseObj);
    }
  }

  private refreshNameColumn(): void {
    // Refresh name column dropdowns
    console.log('Refreshing name column');
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
      'CRS': 'crs',
      'Hausnummer_Spaltenname': 'hnrColumnName',
      'Strasse_Spaltenname': 'streetColumnName',
      'Adresse_Spaltenname': 'addressColumnName',
      'Strasse_Hausnummer_Spaltenname': 'streetHnrColumnName',
      'X_Koordinatenspalte_Rechtswert': 'xCoordColumnName',
      'Y_Koordinatenspalte_Hochwert': 'yCoordColumnName',
      'Postleitzahl_Spaltenname': 'plzColumnName',
      'Stadt_Spaltenname': 'cityColumnName',
      'NAMESPACE': 'schemaNamespace',
      'SCHEMA_LOCATION': 'schemaLocation',
      'Trennzeichen': 'separator'
    };
    return mapping[paramName] || null;
  }

  private getDataSourceParameterPropertyName(paramName: string): string | null {
    const mapping: { [key: string]: string } = {
      'NAME': 'name',
      'URL': 'url',
      'payload': 'payload'
    };
    return mapping[paramName] || null;
  }

  private getConverterObjectByName(name: string): any {
    // Implementation to get converter object by name
    // Access through AngularJS service for now
    // const angularJsService = (this.kommonitorDataExchangeService as any).angularJsDataExchangeService;
    // if (angularJsService && angularJsService.availableConverters) {
    //   return angularJsService.availableConverters.find((c: any) => c.name === name);
    // }
    return null;
  }

  private getDatasourceTypeObjectByType(type: string): any {
    // Implementation to get datasource type object by type
    // Access through AngularJS service for now
    // const angularJsService = (this.kommonitorDataExchangeService as any).angularJsDataExchangeService;
    // if (angularJsService && angularJsService.availableDatasourceTypes) {
    //   return angularJsService.availableDatasourceTypes.find((d: any) => d.type === type);
    // }
    return null;
  }

  private getSpatialUnitObjectByName(name: string): any {
    // Implementation to get spatial unit object by name
    if (this.dataExchangeService.availableSpatialUnits) {
      return this.dataExchangeService.availableSpatialUnits.find(s => s.spatialUnitLevel === name);
    }
    return null;
  }

  // Column visibility methods
  public checkColumnsToShowSelectedConverter(): string[] {
    const converters = this.batchList
      .map(row => row.selectedConverter?.name)
      .filter(name => name);
    
    const columns: string[] = [];
    if (converters.some(name => name && name.includes('Tabelle_Zeitreihe_zu_Indikator'))) {
      columns.push('Tabelle_Zeitreihe_zu_Indikator');
    }
    if (converters.some(name => name && name.includes('WFS_v1'))) {
      columns.push('WFS_v1');
    }
    return columns;
  }

  public checkIfSelectedDatasourceTypeIsFile(): boolean {
    return this.batchList.some(row => row.selectedDatasourceType?.type === 'FILE');
  }

  public checkIfSelectedDatasourceTypeIsHttp(): boolean {
    return this.batchList.some(row => row.selectedDatasourceType?.type === 'HTTP');
  }

  public checkIfSelectedDatasourceTypeIsInline(): boolean {
    return this.batchList.some(row => row.selectedDatasourceType?.type === 'INLINE');
  }

  public checkIfSelectedConverterIsCsvOnlyIndicator(): boolean {
    return this.batchList.some(row => row.selectedConverter?.name?.includes('csv_onlyIndicator'));
  }

  // Helper methods to get available options
  public getAvailableConverters(): any[] {
    // const angularJsService = (this.kommonitorDataExchangeService as any).angularJsDataExchangeService;
    // return angularJsService?.availableConverters || [];
    return [];
  }

  public getAvailableDatasourceTypes(): any[] {
    // const angularJsService = (this.kommonitorDataExchangeService as any).angularJsDataExchangeService;
    // return angularJsService?.availableDatasourceTypes || [];
    return [];
  }

  // Default value function properties
  public colDefaultFunctionSelectedColumn: string | null = null;
  public colDefaultFunctionNewValue: any = undefined;
  public colDefaultFunctionAllRowsChb: boolean = false;

  public onClickSaveColDefaultValue(): void {
    // Implementation for saving default column value
    console.log('Saving default column value:', this.colDefaultFunctionSelectedColumn, this.colDefaultFunctionNewValue);
  }

  public saveBatchListToFile(): void {
    const batchData = this.batchList.map(item => ({
      name: item.name?.indicatorId || '',
      mappingTableName: item.mappingTableName,
      mappingObj: item.mappingObj,
      isSelected: item.isSelected
    }));

    const blob = new Blob([JSON.stringify(batchData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'indicator-batch-list.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  public checkIfNameAndFilesChosenInEachRow(): boolean {
    // Check if each row has required fields filled
    return this.batchList.length > 0 && this.batchList.every(row => 
      row.name && 
      row.selectedConverter && 
      row.selectedDatasourceType &&
      row.mappingObj.propertyMapping.spatialReferenceKeyProperty &&
      row.selectedTargetSpatialUnit
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