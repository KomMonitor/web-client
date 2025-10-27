import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { KommonitorIndicatorDataExchangeService } from 'services/adminIndicatorUnit/kommonitor-data-exchange.service';
import { KommonitorIndicatorCacheHelperService } from 'services/adminIndicatorUnit/kommonitor-cache-helper.service';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';

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
  selector: 'indicator-batch-update-modal',
  templateUrl: './indicator-batch-update-modal.component.html',
  styleUrls: ['./indicator-batch-update-modal.component.css']
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
    private modalService: NgbModal,
    private http: HttpClient,
    private broadcastService: BroadcastService,
    public kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private kommonitorCacheHelperService: KommonitorIndicatorCacheHelperService,
    private kommonitorImporterHelperService: KommonitorImporterHelperService
  ) {
    this.keyDownHandler = this.handleKeyDown.bind(this);
  }

  ngOnInit(): void {
    this.setupEventListeners();
    this.initialize();
    
    // Add keyboard event listener for Escape key
    document.addEventListener('keydown', this.keyDownHandler);
    
    // Initialize Bootstrap AdminLTE box widgets
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn && $.fn.boxWidget) {
        $('.box').boxWidget();
      }
    }, 300);
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
    
    // Initialize Bootstrap AdminLTE box widgets after modal is opened
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn && $.fn.boxWidget) {
        $('.box').boxWidget();
      }
    }, 200);
  }

  private async initialize(): Promise<void> {
    if (this.isFirstStart) {
      this.addNewRowToBatchList();
      this.isFirstStart = false;
    }

    // Ensure importer helper service data is loaded
    if (!this.kommonitorImporterHelperService.availableConverters?.length || 
        !this.kommonitorImporterHelperService.availableDatasourceTypes?.length) {
      try {
        await this.kommonitorImporterHelperService.fetchResourcesFromImporter();
      } catch (error) {
        console.error('Error loading importer resources:', error);
      }
    }

    // Set initial selected value if available
    if (this.kommonitorDataExchangeService.availableIndicators && 
        this.kommonitorDataExchangeService.availableIndicators.length > 0) {
      this.selected.value = this.kommonitorDataExchangeService.availableIndicators[0];
    }

    // Initialize Bootstrap AdminLTE box widgets
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn && $.fn.boxWidget) {
        $('.box').boxWidget();
        console.log('Box widgets initialized');
      } else {
        console.log('jQuery or boxWidget not available');
      }
    }, 100);
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
      const indicatorObj = this.kommonitorDataExchangeService.getIndicatorMetadataById(indicatorId);
      row.name = indicatorObj || null;

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

  public getConverterObjectByName(name: string): any {
    // Implementation to get converter object by name
    if (this.kommonitorImporterHelperService.availableConverters) {
      return this.kommonitorImporterHelperService.availableConverters.find((c: any) => c.name === name);
    }
    return null;
  }

  private getDatasourceTypeObjectByType(type: string): any {
    // Implementation to get datasource type object by type
    if (this.kommonitorImporterHelperService.availableDatasourceTypes) {
      return this.kommonitorImporterHelperService.availableDatasourceTypes.find((d: any) => d.type === type);
    }
    return null;
  }

  private getSpatialUnitObjectByName(name: string): any {
    // Implementation to get spatial unit object by name
    if (this.kommonitorDataExchangeService.availableSpatialUnits) {
      return this.kommonitorDataExchangeService.availableSpatialUnits.find(s => s.spatialUnitLevel === name);
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
    if (!this.kommonitorImporterHelperService.availableConverters) {
      return [];
    }
    // Filter converters for indicators (exclude georesource converters)
    return this.kommonitorImporterHelperService.availableConverters.filter((converter: any) => {
      // Remove converters that are not for indicators
      if (converter.name.includes('Geokodierung') || converter.name.includes('Koordinate')) {
        return false;
      }
      return true;
    });
  }

  public getAvailableDatasourceTypes(): any[] {
    return this.kommonitorImporterHelperService.availableDatasourceTypes || [];
  }

  // Default value function properties
  public colDefaultFunctionSelectedColumn: string | null = null;
  public colDefaultFunctionNewValue: any = undefined;
  public colDefaultFunctionAllRowsChb: boolean = false;

  public toggleAccordion(event: Event): void {
    // Fallback method if Bootstrap AdminLTE JavaScript is not working
    const button = event.target as HTMLElement;
    const box = button.closest('.box');
    const boxBody = box?.querySelector('.box-body') as HTMLElement;
    const icon = button.querySelector('i');
    
    if (box && boxBody && icon) {
      const isCollapsed = box.classList.contains('collapsed-box');
      
      if (isCollapsed) {
        box.classList.remove('collapsed-box');
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
        boxBody.style.display = 'block';
      } else {
        box.classList.add('collapsed-box');
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
        boxBody.style.display = 'none';
      }
    }
  }

  public onClickSaveColDefaultValue(): void {
    if (!this.colDefaultFunctionSelectedColumn || this.colDefaultFunctionNewValue === undefined) {
      return;
    }

    // Apply the default value to all rows
    this.batchList.forEach(row => {
      if (!row.isSelected) return;

      // Only update empty values unless colDefaultFunctionAllRowsChb is true
      if (!this.colDefaultFunctionAllRowsChb) {
        const currentValue = this.getNestedValue(row, this.colDefaultFunctionSelectedColumn);
        if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
          return; // Skip if value already exists
        }
      }

      // Set the new value
      this.setNestedValue(row, this.colDefaultFunctionSelectedColumn, this.colDefaultFunctionNewValue);
    });

    // Reset the form
    this.colDefaultFunctionSelectedColumn = null;
    this.colDefaultFunctionNewValue = undefined;
  }

  private getNestedValue(obj: any, path: string | null): any {
    if (!path) return undefined;
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string | null, value: any): void {
    if (!path) return;
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
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