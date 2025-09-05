import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class KommonitorImporterHelperService {

  constructor(private http: HttpClient) {
    this.targetUrlToImporterService = (window as any).__env?.targetUrlToImporterService || '/api/importer/';
  }

  private targetUrlToImporterService: string = '/api/importer/';

  // Single feature import definitions
  converterDefinition_singleFeatureImport = {
    name: 'single-feature-converter',
    schema: 'geojson',
    mimeType: 'application/geo+json',
    parameters: []
  };

  datasourceDefinition_singleFeatureImport = {
    type: 'inline',
    parameters: [
      { name: 'geoJsonData', value: '' }
    ]
  };

  propertyMappingDefinition_singleFeatureImport = {
    nameProperty: 'NAME',
    identifierProperty: 'ID',
    validStartDateProperty: 'validStartDate',
    validEndDateProperty: 'validEndDate',
    keepAttributes: true,
    keepMissingOrNullValueAttributes: true,
    attributes: []
  };

  // Available converters for the template
  availableConverters = [
    { 
      name: 'csv-converter', 
      displayName: 'CSV Converter', 
      description: 'Convert CSV files to georesource format',
      schemas: ['csv-schema'],
      mimeTypes: ['text/csv'],
      datasources: ['FILE'],
      parameters: []
    },
    { 
      name: 'json-converter', 
      displayName: 'JSON Converter', 
      description: 'Convert JSON files to georesource format',
      schemas: ['json-schema'],
      mimeTypes: ['application/json'],
      datasources: ['FILE', 'HTTP'],
      parameters: []
    },
    { 
      name: 'xml-converter', 
      displayName: 'XML Converter', 
      description: 'Convert XML files to georesource format',
      schemas: ['xml-schema'],
      mimeTypes: ['application/xml', 'text/xml'],
      datasources: ['FILE', 'HTTP'],
      parameters: []
    },
    { 
      name: 'geojson-converter', 
      displayName: 'GeoJSON Converter', 
      description: 'Convert GeoJSON files to georesource format',
      schemas: ['geojson-schema'],
      mimeTypes: ['application/geo+json'],
      datasources: ['FILE', 'HTTP', 'OGCAPI_FEATURES'],
      parameters: []
    }
  ];

  // Available datasource types for the template
  availableDatasourceTypes = [
    { 
      type: 'FILE', 
      name: 'File Upload', 
      description: 'Upload a file from your computer',
      parameters: [
        { name: 'file', type: 'file', required: true }
      ]
    },
    { 
      type: 'HTTP', 
      name: 'HTTP URL', 
      description: 'Download from a web URL',
      parameters: [
        { name: 'url', type: 'string', required: true }
      ]
    },
    { 
      type: 'OGCAPI_FEATURES', 
      name: 'OGC API Features', 
      description: 'Fetch features from OGC API',
      parameters: [
        { name: 'endpoint', type: 'string', required: true },
        { name: 'collection', type: 'string', required: true },
        { name: 'bbox', type: 'string', required: false }
      ]
    },
    { 
      type: 'inline', 
      name: 'Inline Data', 
      description: 'Paste data directly',
      parameters: [
        { name: 'data', type: 'textarea', required: true }
      ]
    }
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

  // Get available converters
  getAvailableConverters(): any[] {
    return this.availableConverters;
  }

  // Get available datasource types
  getAvailableDatasourceTypes(): any[] {
    return this.availableDatasourceTypes;
  }

  // Filter converters by resource type
  filterConverters(resourceType: string): (converter: any) => boolean {
    return (converter: any) => {
      // Add filtering logic based on resource type
      return true; // For now, return all converters
    };
  }

  // Fetch resources from importer
  async fetchResourcesFromImporter(): Promise<void> {
    // This would typically fetch from the importer service
    // For now, we'll use the static data
    console.log('Fetching importer resources...');
  }

  // Update georesource method
  async updateGeoresource(
    converterDefinition: any,
    datasourceTypeDefinition: any,
    propertyMappingDefinition: any,
    georesourceId: string,
    putBody: any,
    isDryRun: boolean = false
  ): Promise<any> {
    try {
      const url = `/api/georesources/${georesourceId}/features`;
      const method = isDryRun ? 'POST' : 'PUT';
      const dryRunParam = isDryRun ? '?dryRun=true' : '';
      
      const requestBody = {
        converterDefinition,
        datasourceTypeDefinition,
        propertyMappingDefinition,
        ...putBody
      };

      // For now, return a mock response
      // In real implementation, this would make an HTTP request
      return {
        success: true,
        georesourceId,
        isDryRun,
        message: isDryRun ? 'Dry run completed successfully' : 'Georesource updated successfully',
        importedFeatures: isDryRun ? [] : [{ id: 'mock-feature-1', name: 'Mock Feature' }]
      };
    } catch (error) {
      console.error('Error updating georesource:', error);
      throw error;
    }
  }

  // Build put body for georesources
  buildPutBody_georesources(scopeProperties: any): any {
    return {
      geoJsonString: "",
      periodOfValidity: scopeProperties.periodOfValidity || {},
      isPartialUpdate: scopeProperties.isPartialUpdate || false
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

  // Methods for georesource registration
  async registerNewGeoresource(
    converterDefinition: any,
    datasourceTypeDefinition: any,
    propertyMappingDefinition: any,
    postBody: any,
    isDryRun: boolean = false
  ): Promise<any> {
    const payload = {
      converter: converterDefinition,
      dataSource: datasourceTypeDefinition,
      propertyMapping: propertyMappingDefinition,
      georesourcePostBody: postBody,
      dryRun: isDryRun
    };
    return this.http.post(`${this.targetUrlToImporterService}georesources`, payload, {
      headers: { 'Content-Type': 'application/json' }
    }).toPromise();
  }
}
