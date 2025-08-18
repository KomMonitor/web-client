import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class KommonitorImporterHelperService {

  constructor(private http: HttpClient) {}

  /**
   * Parse CSV file content
   */
  parseCsvFile(fileContent: string): any[] {
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
   * Parse JSON file content
   */
  parseJsonFile(fileContent: string): any {
    try {
      return JSON.parse(fileContent);
    } catch (error) {
      console.error('Error parsing JSON file:', error);
      return null;
    }
  }

  /**
   * Validate file format
   */
  validateFileFormat(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type) || 
           allowedTypes.some(type => file.name.endsWith(type));
  }

  /**
   * Get file extension
   */
  getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:application/...;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Download file from URL
   */
  async downloadFileFromUrl(url: string): Promise<Blob> {
    try {
      const response = await this.http.get(url, { responseType: 'blob' }).toPromise();
      return response as Blob;
    } catch (error) {
      console.error('Error downloading file from URL:', error);
      throw error;
    }
  }

  /**
   * Validate georesource data structure
   */
  validateGeoresourceData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data.georesourceId) {
      errors.push('Missing georesourceId');
    }
    
    if (!data.datasetName) {
      errors.push('Missing datasetName');
    }
    
    if (!data.metadata) {
      errors.push('Missing metadata');
    } else {
      if (!data.metadata.description) {
        errors.push('Missing metadata.description');
      }
      if (!data.metadata.datasource) {
        errors.push('Missing metadata.datasource');
      }
      if (!data.metadata.contact) {
        errors.push('Missing metadata.contact');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform data to georesource format
   */
  transformToGeoresourceFormat(rawData: any): any {
    return {
      georesourceId: rawData.georesourceId || rawData.id,
      datasetName: rawData.datasetName || rawData.name,
      isPOI: rawData.isPOI || false,
      isLOI: rawData.isLOI || false,
      isAOI: rawData.isAOI || false,
      poiSymbolColor: rawData.poiSymbolColor || '#000000',
      poiSymbolBootstrap3Name: rawData.poiSymbolBootstrap3Name || 'default',
      poiMarkerColor: rawData.poiMarkerColor || '#000000',
      loiColor: rawData.loiColor || '#000000',
      loiWidth: rawData.loiWidth || 2,
      loiDashArrayString: rawData.loiDashArrayString || '5,5',
      aoiColor: rawData.aoiColor || '#000000',
      metadata: {
        description: rawData.description || rawData.metadata?.description || '',
        datasource: rawData.datasource || rawData.metadata?.datasource || '',
        contact: rawData.contact || rawData.metadata?.contact || ''
      },
      availablePeriodsOfValidity: rawData.availablePeriodsOfValidity || [],
      topicReference: rawData.topicReference || null,
      permissions: rawData.permissions || [],
      isPublic: rawData.isPublic || false,
      ownerId: rawData.ownerId || ''
    };
  }

  /**
   * Generate sample georesource template
   */
  generateSampleTemplate(): any {
    return {
      georesourceId: 'sample-id',
      datasetName: 'Sample Dataset',
      isPOI: true,
      isLOI: false,
      isAOI: false,
      poiSymbolColor: '#FF0000',
      poiSymbolBootstrap3Name: 'map-marker',
      poiMarkerColor: '#FF0000',
      metadata: {
        description: 'Sample description',
        datasource: 'Sample datasource',
        contact: 'sample@example.com'
      },
      availablePeriodsOfValidity: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        }
      ],
      topicReference: null,
      permissions: [],
      isPublic: true,
      ownerId: 'sample-owner'
    };
  }

  // Available converters for the template
  availableConverters = [
    { name: 'csv-converter', displayName: 'CSV Converter', description: 'Convert CSV files to georesource format' },
    { name: 'json-converter', displayName: 'JSON Converter', description: 'Convert JSON files to georesource format' },
    { name: 'xml-converter', displayName: 'XML Converter', description: 'Convert XML files to georesource format' }
  ];

  // Available datasource types for the template
  availableDatasourceTypes = [
    { type: 'file', name: 'File Upload', description: 'Upload a file from your computer' },
    { type: 'http', name: 'HTTP URL', description: 'Download from a web URL' },
    { type: 'inline', name: 'Inline Data', description: 'Paste data directly' }
  ];

  // Mapping config structure for export/import
  mappingConfigStructure = {
    converter: {
      name: 'converter-name',
      schema: 'schema-name',
      mimeType: 'mime-type',
      parameters: [
        { name: 'param1', value: 'value1' },
        { name: 'param2', value: 'value2' }
      ]
    },
    dataSource: {
      type: 'file|http|inline',
      parameters: [
        { name: 'param1', value: 'value1' },
        { name: 'param2', value: 'value2' }
      ]
    },
    propertyMapping: {
      nameProperty: 'property-name',
      identifierProperty: 'id-property',
      validStartDateProperty: 'start-date-property',
      validEndDateProperty: 'end-date-property',
      keepAttributes: true,
      keepMissingOrNullValueAttributes: true,
      attributes: [
        { name: 'attr1', mappingName: 'mapped-attr1', type: 'string' },
        { name: 'attr2', mappingName: 'mapped-attr2', type: 'number' }
      ]
    }
  };

  // Attribute mapping types
  attributeMapping_attributeTypes = [
    { apiName: 'string', displayName: 'String', description: 'Text data' },
    { apiName: 'number', displayName: 'Number', description: 'Numeric data' },
    { apiName: 'boolean', displayName: 'Boolean', description: 'True/False data' },
    { apiName: 'date', displayName: 'Date', description: 'Date data' },
    { apiName: 'geometry', displayName: 'Geometry', description: 'Spatial data' }
  ];

  // Methods for georesource registration
  async registerNewGeoresource(
    converterDefinition: any,
    datasourceTypeDefinition: any,
    propertyMappingDefinition: any,
    postBody: any,
    isDryRun: boolean = false
  ): Promise<any> {
    // This would typically make an API call to register the georesource
    // For now, return a mock response
    return {
      success: true,
      georesourceId: 'mock-id-' + Date.now(),
      message: isDryRun ? 'Dry run completed successfully' : 'Georesource registered successfully'
    };
  }

  // Check if importer response contains errors
  importerResponseContainsErrors(response: any): boolean {
    return !response || !response.success || response.errors || response.errors?.length > 0;
  }

  // Get ID from importer response
  getIdFromImporterResponse(response: any): string {
    return response?.georesourceId || 'unknown';
  }

  // Get imported features from importer response
  getImportedFeaturesFromImporterResponse(response: any): any[] {
    return response?.importedFeatures || [];
  }

  // Get errors from importer response
  getErrorsFromImporterResponse(response: any): any[] {
    return response?.errors || [];
  }

  // Build converter definition
  buildConverterDefinition(
    converter: any,
    parameterPrefix: string,
    schema: string,
    mimeType: string
  ): any {
    if (!converter) return null;

    const parameters: any[] = [];
    if (converter.parameters) {
      converter.parameters.forEach((param: any) => {
        const element = document.getElementById(parameterPrefix + param.name) as HTMLInputElement;
        if (element) {
          parameters.push({
            name: param.name,
            value: element.value
          });
        }
      });
    }

    return {
      name: converter.name,
      schema: schema,
      mimeType: mimeType,
      parameters: parameters
    };
  }

  // Build datasource type definition
  async buildDatasourceTypeDefinition(
    datasourceType: any,
    parameterPrefix: string,
    inputElementId: string
  ): Promise<any> {
    if (!datasourceType) return null;

    const parameters: any[] = [];
    if (datasourceType.parameters) {
      datasourceType.parameters.forEach((param: any) => {
        const element = document.getElementById(parameterPrefix + param.name) as HTMLInputElement;
        if (element) {
          parameters.push({
            name: param.name,
            value: element.value
          });
        }
      });
    }

    // Get the actual data from the input element
    const inputElement = document.getElementById(inputElementId) as HTMLInputElement;
    const data = inputElement?.value || '';

    return {
      type: datasourceType.type,
      parameters: parameters,
      data: data
    };
  }

  // Build property mapping for spatial resource
  buildPropertyMapping_spatialResource(
    nameProperty: string,
    identifierProperty: string,
    validStartDateProperty: string,
    validEndDateProperty: string,
    additionalProperties: any,
    keepAttributes: boolean,
    keepMissingValues: boolean,
    attributeMappings: any[]
  ): any {
    return {
      nameProperty: nameProperty,
      identifierProperty: identifierProperty,
      validStartDateProperty: validStartDateProperty,
      validEndDateProperty: validEndDateProperty,
      additionalProperties: additionalProperties,
      keepAttributes: keepAttributes,
      keepMissingOrNullValueAttributes: keepMissingValues,
      attributes: attributeMappings.map(mapping => ({
        name: mapping.sourceName,
        mappingName: mapping.destinationName,
        type: mapping.dataType?.apiName || 'string'
      }))
    };
  }
}
