import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'georesource-batch-update-modal',
  templateUrl: './georesource-batch-update-modal.component.html',
  styleUrls: ['./georesource-batch-update-modal.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true,
})
export class GeoresourceBatchUpdateModalComponent implements OnInit, OnDestroy {
  @ViewChild('batchListFile', { static: false }) batchListFile!: ElementRef;

  // Component state
  loadingData = false;
  isFirstStart = true;
  lastUpdateResponseObj: any = undefined;
  keepMissingValues = true;

  // Batch list
  batchList: any[] = [];
  allRowsSelected = false;

  // Default value function
  colDefaultFunctionSelectedColumn: string = '';
  colDefaultFunctionNewValue: any = undefined;
  colDefaultFunctionAllRowsChb = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    @Inject('kommonitorImporterHelperService') public kommonitorImporterHelperService: any,
    @Inject('kommonitorBatchUpdateHelperService') public kommonitorBatchUpdateHelperService: any,
    private broadcastService: BroadcastService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initialize();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initialize(): void {
    if (this.isFirstStart) {
      this.kommonitorBatchUpdateHelperService.addNewRowToBatchList('georesource', this.batchList);
      this.isFirstStart = false;
    }

    // Initialize date pickers
    setTimeout(() => {
      this.initializeDatePickers();
    });
  }

  private initializeDatePickers(): void {
    try {
      // Initialize default column date pickers
      const startDatePicker = document.getElementById('georesourceDefaultColumnDatePickerStart');
      const endDatePicker = document.getElementById('georesourceDefaultColumnDatePickerEnd');
      
      if (startDatePicker && (window as any).$) {
        (window as any).$('#georesourceDefaultColumnDatePickerStart').datepicker(this.kommonitorDataExchangeService.datePickerOptions);
      }
      if (endDatePicker && (window as any).$) {
        (window as any).$('#georesourceDefaultColumnDatePickerEnd').datepicker(this.kommonitorDataExchangeService.datePickerOptions);
      }

      // Initialize row date pickers
      this.kommonitorBatchUpdateHelperService.initializeGeoresourceDatepickerFields(this.batchList);
    } catch (error) {
      console.warn('Date picker initialization failed:', error);
    }
  }

  private setupEventListeners(): void {
    // Listen for georesource overview table refresh
    const refreshSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'refreshGeoresourceOverviewTableCompleted') {
        this.kommonitorBatchUpdateHelperService.refreshNameColumn('georesource', this.batchList);
      }
    });
    this.subscriptions.push(refreshSub);

    // Listen for batch update completion
    const batchUpdateSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'batchUpdateCompleted' && data.resourceType === 'georesource') {
        this.lastUpdateResponseObj = data;
      }
    });
    this.subscriptions.push(batchUpdateSub);

    // Listen for batch list parsing
    const batchListSub = this.broadcastService.currentBroadcastMsg.subscribe((data: any) => {
      if (data.msg === 'georesourceBatchListParsed') {
        this.onBatchListParsed(data.newValue);
      }
    });
    this.subscriptions.push(batchListSub);
  }

  // File handling methods
  onMappingTableFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', (event: any) => {
        this.kommonitorBatchUpdateHelperService.onMappingTableSelected('georesource', event, index, file, this.batchList);
      });
      reader.readAsText(file);
    }
  }

  onDataSourceFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        this.kommonitorBatchUpdateHelperService.onDataSourceFileSelected(file, index, this.batchList);
      });
      reader.readAsText(file);
    }
  }

  onBatchListFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.kommonitorBatchUpdateHelperService.parseBatchListFromFile('georesource', file, this.batchList);
    }
  }

  private onBatchListParsed(newBatchList: any[]): void {
    setTimeout(() => {
      // Remove all rows
      for (let i = 0; i < this.batchList.length; i++) {
        this.batchList[i].isSelected = true;
      }
      this.kommonitorBatchUpdateHelperService.deleteSelectedRowsFromBatchList(this.batchList, this.allRowsSelected);

      // Add new rows
      for (let i = 0; i < newBatchList.length; i++) {
        this.kommonitorBatchUpdateHelperService.addNewRowToBatchList('georesource', this.batchList);
        const row = this.batchList[i];

        // isSelected
        row.isSelected = newBatchList[i].isSelected;

        // name - convert georesourceId to georesource object
        const georesourceId = newBatchList[i].name;
        const georesourceObj = this.kommonitorDataExchangeService.getGeoresourceMetadataById(georesourceId);
        row.name = georesourceObj;

        // mappingTableName
        row.mappingTableName = newBatchList[i].mappingTableName;
        // mappingObj
        row.mappingObj = newBatchList[i].mappingObj;
        
        // converter parameters to properties
        if (row.mappingObj.converter) {
          row.mappingObj.converter = this.kommonitorBatchUpdateHelperService.converterParametersArrayToProperties(row.mappingObj.converter);
        }
        
        // dataSource parameters to properties
        if (row.mappingObj.dataSource) {
          row.mappingObj.dataSource = this.kommonitorBatchUpdateHelperService.dataSourceParametersArrayToProperty(row.mappingObj.dataSource);
        }
        
        // set selectedConverter
        if (newBatchList[i].mappingObj.converter && newBatchList[i].mappingObj.converter.hasOwnProperty('name')) {
          row.selectedConverter = this.kommonitorBatchUpdateHelperService.getConverterObjectByName(newBatchList[i].mappingObj.converter.name);
        }
        
        // set selectedDatasourceType
        if (newBatchList[i].mappingObj.dataSource && newBatchList[i].mappingObj.dataSource.hasOwnProperty('type')) {
          row.selectedDatasourceType = this.kommonitorBatchUpdateHelperService.getDatasourceTypeObjectByType(newBatchList[i].mappingObj.dataSource.type);
        }
      }

      this.kommonitorBatchUpdateHelperService.initializeGeoresourceDatepickerFields(this.batchList);
      this.kommonitorBatchUpdateHelperService.resizeNameColumnDropdowns(null);
    });
  }

  // Batch list operations
  addNewRow(): void {
    this.kommonitorBatchUpdateHelperService.addNewRowToBatchList('georesource', this.batchList);
  }

  deleteSelectedRows(): void {
    this.kommonitorBatchUpdateHelperService.deleteSelectedRowsFromBatchList(this.batchList, this.allRowsSelected);
  }

  onSelectAllRows(): void {
    this.kommonitorBatchUpdateHelperService.onChangeSelectAllRows(this.allRowsSelected, this.batchList);
  }

  onGeoresourceSelected(georesource: any, index: number): void {
    this.kommonitorBatchUpdateHelperService.resizeNameColumnDropdowns(georesource);
  }

  // Default value function
  onChangeDefaultColumn(): void {
    this.colDefaultFunctionNewValue = undefined;
  }

  saveDefaultValue(): void {
    this.kommonitorBatchUpdateHelperService.onClickSaveColDefaultValue(
      'georesource',
      this.colDefaultFunctionSelectedColumn,
      this.colDefaultFunctionNewValue,
      this.colDefaultFunctionAllRowsChb,
      this.batchList
    );
  }

  // Import/Export methods
  loadBatchList(): void {
    this.batchListFile.nativeElement.click();
  }

  exportBatchList(): void {
    this.kommonitorBatchUpdateHelperService.saveBatchListToFile('georesource', this.batchList, true, this.keepMissingValues);
  }

  saveMappingObjectToFile(event: any): void {
    this.kommonitorBatchUpdateHelperService.saveMappingObjectToFile('georesource', event, this.batchList);
  }

  // Batch update execution
  executeBatchUpdate(): void {
    this.kommonitorBatchUpdateHelperService.batchUpdate('georesource', this.batchList);
  }

  canExecuteBatchUpdate(): boolean {
    return this.kommonitorBatchUpdateHelperService.checkIfNameAndFilesChosenInEachRow('georesource', this.batchList);
  }

  reopenResultModal(): void {
    if (this.lastUpdateResponseObj !== undefined) {
      this.broadcastService.broadcast('reopenBatchUpdateResultModal', this.lastUpdateResponseObj);
    }
  }

  resetForm(): void {
    this.kommonitorBatchUpdateHelperService.resetBatchUpdateForm('georesource', this.batchList);
  }

  // Helper methods for template
  checkColumnsToShow_selectedConverter(): string[] {
    return this.kommonitorBatchUpdateHelperService.checkColumnsToShow_selectedConverter(this.batchList);
  }

  checkIfSelectedDatasourceTypeIsFile(): boolean {
    return this.kommonitorBatchUpdateHelperService.checkIfSelectedDatasourceTypeIsFile(this.batchList);
  }

  checkIfSelectedDatasourceTypeIsHttp(): boolean {
    return this.kommonitorBatchUpdateHelperService.checkIfSelectedDatasourceTypeIsHttp(this.batchList);
  }

  checkIfSelectedDatasourceTypeIsInline(): boolean {
    return this.kommonitorBatchUpdateHelperService.checkIfSelectedDatasourceTypeIsInline(this.batchList);
  }

  getConverterObjectByName(name: string): any {
    return this.kommonitorBatchUpdateHelperService.getConverterObjectByName(name);
  }

  // Filter for georesources
  filterGeoresources = (georesource: any, searchTerm: string): boolean => {
    if (!searchTerm) return true;
    return georesource.datasetName.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Modal control
  cancel(): void {
    this.activeModal.dismiss();
  }
} 