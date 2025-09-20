import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { KommonitorGeoresourceDataExchangeService } from './kommonitor-data-exchange.service';

@Injectable({
  providedIn: 'root'
})
export class KommonitorBatchUpdateHelperService {

  constructor(
    private http: HttpClient,
    private kommonitorDataExchangeService: KommonitorGeoresourceDataExchangeService
  ) {}

  // Date picker options
  datePickerOptions = {
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayHighlight: true,
    clearBtn: true
  };

  /**
   * Add new row to batch list
   */
  addNewRowToBatchList(resourceType: string, batchList: any[]): void {
    const newRow = {
      isSelected: true,
      name: null,
      mappingTableName: '',
      mappingObj: {
        converter: null,
        dataSource: null
      },
      selectedConverter: null,
      selectedDatasourceType: null
    };
    
    batchList.push(newRow);
  }

  /**
   * Delete selected rows from batch list
   */
  deleteSelectedRowsFromBatchList(batchList: any[], allRowsSelected: boolean): void {
    if (allRowsSelected) {
      batchList.length = 0;
    } else {
      for (let i = batchList.length - 1; i >= 0; i--) {
        if (batchList[i].isSelected) {
          batchList.splice(i, 1);
        }
      }
    }
  }

  /**
   * Handle select all rows change
   */
  onChangeSelectAllRows(allRowsSelected: boolean, batchList: any[]): void {
    batchList.forEach(row => {
      row.isSelected = allRowsSelected;
    });
  }

  /**
   * Initialize georesource datepicker fields
   */
  initializeGeoresourceDatepickerFields(batchList: any[]): void {
    setTimeout(() => {
      batchList.forEach((row, index) => {
        // Initialize start date picker
        const startDatePicker = document.getElementById(`georesourceRow${index}StartDatePicker`);
        if (startDatePicker && (window as any).$) {
          (window as any).$(`#georesourceRow${index}StartDatePicker`).datepicker(this.datePickerOptions);
        }
        
        // Initialize end date picker
        const endDatePicker = document.getElementById(`georesourceRow${index}EndDatePicker`);
        if (endDatePicker && (window as any).$) {
          (window as any).$(`#georesourceRow${index}EndDatePicker`).datepicker(this.datePickerOptions);
        }
      });
    }, 100);
  }

  /**
   * Resize name column dropdowns
   */
  resizeNameColumnDropdowns(georesource: any): void {
    // Implementation for resizing dropdowns
    setTimeout(() => {
      const dropdowns = document.querySelectorAll('.georesource-name-dropdown');
      dropdowns.forEach((dropdown: any) => {
        if (dropdown.style) {
          dropdown.style.width = 'auto';
          dropdown.style.minWidth = '200px';
        }
      });
    }, 100);
  }

  /**
   * Handle mapping table selection
   */
  onMappingTableSelected(resourceType: string, event: any, index: number, file: File, batchList: any[]): void {
    try {
      const fileContent = event.target.result;
      const mappingTable = this.parseMappingTable(fileContent, file.name);
      
      if (mappingTable) {
        batchList[index].mappingTableName = file.name;
        batchList[index].mappingObj = mappingTable;
        
        // Set selected converter and datasource type
        if (mappingTable.converter) {
          batchList[index].selectedConverter = this.getConverterObjectByName(mappingTable.converter.name);
        }
        if (mappingTable.dataSource) {
          batchList[index].selectedDatasourceType = this.getDatasourceTypeObjectByType(mappingTable.dataSource.type);
        }
      }
    } catch (error) {
      console.error('Error processing mapping table:', error);
    }
  }

  /**
   * Handle data source file selection
   */
  onDataSourceFileSelected(file: File, index: number, batchList: any[]): void {
    try {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const fileContent = event.target.result;
        
        // Update the mapping object with file information
        if (!batchList[index].mappingObj) {
          batchList[index].mappingObj = {};
        }
        
        batchList[index].mappingObj.dataSource = {
          type: 'file',
          file: file,
          content: fileContent
        };
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error processing data source file:', error);
    }
  }

  /**
   * Parse batch list from file
   */
  parseBatchListFromFile(resourceType: string, file: File, batchList: any[]): void {
    const reader = new FileReader();
    reader.onload = (event: any) => {
      try {
        const fileContent = event.target.result as string;
        const fileExtension = this.getFileExtension(file.name);
        
        let parsedData: any[] = [];
        
        if (fileExtension === 'json') {
          parsedData = JSON.parse(fileContent);
        } else if (fileExtension === 'csv') {
          parsedData = this.parseCsvFile(fileContent);
        }
        
        // Broadcast the parsed data
        // This would typically go through a broadcast service
        console.log('Batch list parsed:', parsedData);
        
      } catch (error) {
        console.error('Error parsing batch list file:', error);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Save column default value
   */
  onClickSaveColDefaultValue(
    resourceType: string, 
    selectedColumn: string, 
    newValue: any, 
    allRowsChb: boolean, 
    batchList: any[]
  ): void {
    if (allRowsChb) {
      batchList.forEach(row => {
        if (row.mappingObj) {
          row.mappingObj[selectedColumn] = newValue;
        }
      });
    } else {
      // Apply to selected rows only
      batchList.forEach(row => {
        if (row.isSelected && row.mappingObj) {
          row.mappingObj[selectedColumn] = newValue;
        }
      });
    }
  }

  /**
   * Save batch list to file
   */
  saveBatchListToFile(resourceType: string, batchList: any[], keepMissingValues: boolean, includeMetadata: boolean = true): void {
    try {
      const exportData = batchList.map(row => {
        const exportRow: any = {
          isSelected: row.isSelected,
          name: row.name?.georesourceId || row.name,
          mappingTableName: row.mappingTableName,
          mappingObj: { ...row.mappingObj }
        };
        
        if (includeMetadata && row.name) {
          exportRow.metadata = {
            datasetName: row.name.datasetName,
            description: row.name.metadata?.description,
            datasource: row.name.metadata?.datasource,
            contact: row.name.metadata?.contact
          };
        }
        
        return exportRow;
      });
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resourceType}_batch_list_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error saving batch list to file:', error);
    }
  }

  /**
   * Save mapping object to file
   */
  saveMappingObjectToFile(resourceType: string, event: any, batchList: any[]): void {
    try {
      const selectedRows = batchList.filter(row => row.isSelected);
      
      if (selectedRows.length === 0) {
        console.warn('No rows selected for export');
        return;
      }
      
      const exportData = selectedRows.map(row => ({
        georesourceId: row.name?.georesourceId || row.name,
        mappingTableName: row.mappingTableName,
        mappingObj: row.mappingObj
      }));
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resourceType}_mapping_objects_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error saving mapping objects to file:', error);
    }
  }

  /**
   * Execute batch update
   */
  batchUpdate(resourceType: string, batchList: any[]): void {
    try {
      const selectedRows = batchList.filter(row => row.isSelected);
      
      if (selectedRows.length === 0) {
        console.warn('No rows selected for batch update');
        return;
      }
      
      // Validate all selected rows
      const validationResults = selectedRows.map(row => this.validateBatchUpdateRow(row));
      const invalidRows = validationResults.filter(result => !result.isValid);
      
      if (invalidRows.length > 0) {
        console.error('Validation failed for some rows:', invalidRows);
        return;
      }
      
      // Execute batch update
      console.log(`Executing batch update for ${selectedRows.length} ${resourceType}s`);
      
      // This would typically make HTTP calls to update the backend
      // For now, just log the operation
      selectedRows.forEach((row, index) => {
        console.log(`Updating ${resourceType} ${index + 1}:`, row);
      });
      
      // Broadcast completion
      // this.broadcastService.broadcast('batchUpdateCompleted', { resourceType, count: selectedRows.length });
      
    } catch (error) {
      console.error('Error executing batch update:', error);
    }
  }

  /**
   * Check if name and files are chosen in each row
   */
  checkIfNameAndFilesChosenInEachRow(resourceType: string, batchList: any[]): boolean {
    const selectedRows = batchList.filter(row => row.isSelected);
    
    if (selectedRows.length === 0) {
      return false;
    }
    
    return selectedRows.every(row => {
      return row.name && 
             row.mappingTableName && 
             row.mappingObj && 
             row.mappingObj.converter && 
             row.mappingObj.dataSource;
    });
  }

  /**
   * Reset batch update form
   */
  resetBatchUpdateForm(resourceType: string, batchList: any[]): void {
    batchList.length = 0;
    this.addNewRowToBatchList(resourceType, batchList);
  }

  /**
   * Refresh name column after updates
   */
  refreshNameColumn(resourceType: string, batchList: any[]): void {
    batchList.forEach(row => {
      if (row.name && typeof row.name === 'string') {
        // If name is just an ID, try to get the full object
        const georesourceObj = this.kommonitorDataExchangeService.getGeoresourceMetadataById(row.name);
        if (georesourceObj) {
          row.name = georesourceObj;
        }
      }
    });
  }

  /**
   * Check columns to show for selected converter
   */
  checkColumnsToShow_selectedConverter(batchList: any[]): string[] {
    const selectedRows = batchList.filter(row => row.isSelected);
    const converters = selectedRows.map(row => row.selectedConverter).filter(Boolean);
    
    if (converters.length === 0) return [];
    
    // Return common columns from all selected converters
    const allColumns = new Set<string>();
    converters.forEach(converter => {
      if (converter.columns) {
        converter.columns.forEach((col: string) => allColumns.add(col));
      }
    });
    
    return Array.from(allColumns);
  }

  /**
   * Check if selected datasource type is file
   */
  checkIfSelectedDatasourceTypeIsFile(batchList: any[]): boolean {
    const selectedRows = batchList.filter(row => row.isSelected);
    return selectedRows.some(row => row.selectedDatasourceType?.type === 'file');
  }

  /**
   * Check if selected datasource type is HTTP
   */
  checkIfSelectedDatasourceTypeIsHttp(batchList: any[]): boolean {
    const selectedRows = batchList.filter(row => row.isSelected);
    return selectedRows.some(row => row.selectedDatasourceType?.type === 'http');
  }

  /**
   * Check if selected datasource type is inline
   */
  checkIfSelectedDatasourceTypeIsInline(batchList: any[]): boolean {
    const selectedRows = batchList.filter(row => row.isSelected);
    return selectedRows.some(row => row.selectedDatasourceType?.type === 'inline');
  }

  /**
   * Get converter object by name
   */
  getConverterObjectByName(name: string): any {
    // This would typically come from a service or configuration
    const converters = [
      { name: 'csv-converter', columns: ['id', 'name', 'description'] },
      { name: 'json-converter', columns: ['id', 'name', 'description', 'metadata'] },
      { name: 'xml-converter', columns: ['id', 'name', 'description', 'attributes'] }
    ];
    
    return converters.find(converter => converter.name === name) || null;
  }

  /**
   * Get datasource type object by type
   */
  getDatasourceTypeObjectByType(type: string): any {
    // This would typically come from a service or configuration
    const datasourceTypes = [
      { type: 'file', name: 'File Upload', description: 'Upload a file from your computer' },
      { type: 'http', name: 'HTTP URL', description: 'Download from a web URL' },
      { type: 'inline', name: 'Inline Data', description: 'Paste data directly' }
    ];
    
    return datasourceTypes.find(dsType => dsType.type === type) || null;
  }

  /**
   * Convert converter parameters array to properties
   */
  converterParametersArrayToProperties(converterParams: any[]): any {
    if (!Array.isArray(converterParams)) return converterParams;
    
    const properties: any = {};
    converterParams.forEach(param => {
      if (param.name && param.value !== undefined) {
        properties[param.name] = param.value;
      }
    });
    
    return properties;
  }

  /**
   * Convert datasource parameters array to properties
   */
  dataSourceParametersArrayToProperty(dataSourceParams: any[]): any {
    if (!Array.isArray(dataSourceParams)) return dataSourceParams;
    
    const properties: any = {};
    dataSourceParams.forEach(param => {
      if (param.name && param.value !== undefined) {
        properties[param.name] = param.value;
      }
    });
    
    return properties;
  }

  /**
   * Parse mapping table from file content
   */
  private parseMappingTable(fileContent: string, fileName: string): any {
    try {
      const fileExtension = this.getFileExtension(fileName);
      
      if (fileExtension === 'json') {
        return JSON.parse(fileContent);
      } else if (fileExtension === 'csv') {
        return this.parseCsvFile(fileContent);
      } else {
        console.warn('Unsupported file format:', fileExtension);
        return null;
      }
    } catch (error) {
      console.error('Error parsing mapping table:', error);
      return null;
    }
  }

  /**
   * Parse CSV file content
   */
  private parseCsvFile(fileContent: string): any[] {
    try {
      const lines = fileContent.split('\n');
      const headers = lines[0].split(',').map((header: string) => header.trim());
      const data: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map((value: string) => value.trim());
          const row: any = {};
          
          headers.forEach((header: string, index: number) => {
            row[header] = values[index] || '';
          });
          
          data.push(row);
        }
      }

      return data;
    } catch (error) {
      console.error('Error parsing CSV file:', error);
      return [];
    }
  }

  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Validate batch update row
   */
  private validateBatchUpdateRow(row: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!row.name) {
      errors.push('Missing georesource name');
    }
    
    if (!row.mappingTableName) {
      errors.push('Missing mapping table name');
    }
    
    if (!row.mappingObj) {
      errors.push('Missing mapping object');
    } else {
      if (!row.mappingObj.converter) {
        errors.push('Missing converter configuration');
      }
      if (!row.mappingObj.dataSource) {
        errors.push('Missing data source configuration');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
