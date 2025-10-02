import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Interfaces for type safety
export interface ConverterDefinition {
  encoding: string;
  mimeType: string;
  name: string;
  parameters: Array<{
    name: string;
    value: string;
  }>;
  schema?: string;
}

export interface DatasourceTypeDefinition {
  parameters: Array<{
    name: string;
    value: string;
  }>;
  type: string;
}

export interface PropertyMappingDefinition {
  identifierProperty: string;
  nameProperty: string;
  validStartDateProperty?: string;
  validEndDateProperty?: string;
  arisenFromProperty?: string;
  keepAttributes: boolean;
  keepMissingOrNullValueAttributes: boolean;
  attributes: Array<{
    name: string;
    mappingName: string;
    type: string;
  }>;
}

export interface AttributeMappingType {
  displayName: string;
  apiName: string;
}

export interface Converter {
  name: string;
  type: string;
  mimeTypes: string[];
  encodings: string[];
  schemas?: string[];
  parameters?: Array<{
    name: string;
    mandatory: boolean;
  }>;
}

export interface DatasourceType {
  type: string;
  parameters: Array<{
    name: string;
    mandatory: boolean;
  }>;
}

export interface MappingConfigStructure {
  converter: {
    encoding: string;
    mimeType: string;
    name: string;
    parameters: Array<{
      name: string;
      value: string;
    }>;
    schema: string;
  };
  dataSource: {
    parameters: Array<{
      name: string;
      value: string;
    }>;
    type: string;
  };
  propertyMapping: {
    arisenFromProperty: string;
    attributes: Array<{
      mappingName: string;
      name: string;
      type: string;
    }>;
    identifierProperty: string;
    keepAttributes: boolean;
    nameProperty: string;
    validEndDateProperty: string;
    validStartDateProperty: string;
  };
  periodOfValidity: {
    startDate: string;
    endDate: string;
  };
}

export interface ImporterResponse {
  uri?: string;
  errors?: any[];
  importedFeatures?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class KommonitorIndicatorImporterHelperService {
  private targetUrlToImporterService: string;
  public availableConverters: Converter[] = [];
  public availableDatasourceTypes: DatasourceType[] = [];

  public readonly attributeMapping_attributeTypes: AttributeMappingType[] = [
    { displayName: "String", apiName: "string" },
    { displayName: "Integer", apiName: "integer" },
    { displayName: "Double", apiName: "double" },
    { displayName: "Boolean", apiName: "boolean" },
    { displayName: "Date", apiName: "date" },
    { displayName: "DateTime", apiName: "datetime" }
  ];

  public readonly mappingConfigStructure: MappingConfigStructure = {
    converter: {
      encoding: "UTF-8",
      mimeType: "application/vnd.geo+json",
      name: "GeoJSON",
      parameters: [
        { name: "CRS", value: "EPSG:4326" }
      ],
      schema: "http://schemas.opengis.net/gml/3.2.1/feature.xsd"
    },
    dataSource: {
      parameters: [
        { name: "url", value: "https://example.com/data.geojson" }
      ],
      type: "URL"
    },
    propertyMapping: {
      arisenFromProperty: "arisenFrom",
      attributes: [
        { mappingName: "name", name: "NAME", type: "string" },
        { mappingName: "id", name: "ID", type: "string" }
      ],
      identifierProperty: "ID",
      keepAttributes: true,
      nameProperty: "NAME",
      validEndDateProperty: "validEndDate",
      validStartDateProperty: "validStartDate"
    },
    periodOfValidity: {
      startDate: "2023-01-01",
      endDate: "2023-12-31"
    }
  };

  public readonly mappingConfigStructure_indicator = {
    converter: {
      encoding: "UTF-8",
      mimeType: "application/vnd.geo+json",
      name: "GeoJSON",
      parameters: [
        { name: "CRS", value: "EPSG:4326" }
      ],
      schema: "http://schemas.opengis.net/gml/3.2.1/feature.xsd"
    },
    dataSource: {
      parameters: [
        { name: "url", value: "https://example.com/indicator-data.geojson" }
      ],
      type: "URL"
    },
    propertyMapping: {
      spatialReferenceKeyProperty: "SPATIAL_UNIT_ID",
      timeseriesMappings: [
        { sourceProperty: "VALUE_2023", targetProperty: "indicator_value_2023", dataType: "double" }
      ],
      keepMissingOrNullValueIndicator: true
    }
  };

  constructor(private http: HttpClient) {
    this.targetUrlToImporterService = window.__env.targetUrlToImporterService || 'http://localhost:8080/importer/';
  }

  /**
   * Fetch resources from importer service
   */
  async fetchResourcesFromImporter(): Promise<void> {
    try {
      await Promise.all([
        this.fetchConverters(),
        this.fetchDatasourceTypes()
      ]);
    } catch (error) {
      console.error('Error fetching resources from importer service:', error);
    }
  }

  /**
   * Filter converters by resource type
   */
  filterConverters(resourceType: string): (converter: Converter) => boolean {
    return (converter: Converter) => {
      if (resourceType === 'indicator') {
        return converter.type === 'indicator' || converter.type === 'general';
      }
      return converter.type === resourceType || converter.type === 'general';
    };
  }

  /**
   * Fetch converters from importer service
   */
  async fetchConverters(): Promise<Converter[]> {
    try {
      const response = await this.http.get<Converter[]>(`${this.targetUrlToImporterService}converters`).toPromise();
      this.availableConverters = response || [];
      return this.availableConverters;
    } catch (error) {
      console.error('Error fetching converters:', error);
      return [];
    }
  }

  /**
   * Fetch converter details
   */
  async fetchConverterDetails(converter: Converter): Promise<Converter> {
    try {
      const response = await this.http.get<Converter>(`${this.targetUrlToImporterService}converters/${converter.name}`).toPromise();
      return response || converter;
    } catch (error) {
      console.error('Error fetching converter details:', error);
      return converter;
    }
  }

  /**
   * Fetch datasource types from importer service
   */
  async fetchDatasourceTypes(): Promise<DatasourceType[]> {
    try {
      const response = await this.http.get<DatasourceType[]>(`${this.targetUrlToImporterService}datasource-types`).toPromise();
      this.availableDatasourceTypes = response || [];
      return this.availableDatasourceTypes;
    } catch (error) {
      console.error('Error fetching datasource types:', error);
      return [];
    }
  }

  /**
   * Fetch datasource type details
   */
  async fetchDatasourceTypeDetails(datasourceType: DatasourceType): Promise<DatasourceType> {
    try {
      const response = await this.http.get<DatasourceType>(`${this.targetUrlToImporterService}datasource-types/${datasourceType.type}`).toPromise();
      return response || datasourceType;
    } catch (error) {
      console.error('Error fetching datasource type details:', error);
      return datasourceType;
    }
  }

  /**
   * Upload new file to importer service
   */
  async uploadNewFile(fileData: File, fileName: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', fileData, fileName);

      const response = await this.http.post<{ fileId: string }>(`${this.targetUrlToImporterService}files/upload`, formData).toPromise();
      return response?.fileId || '';
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Build converter definition
   */
  buildConverterDefinition(
    selectedConverter: Converter, 
    converterParameterPrefix: string, 
    schema: string, 
    mimeType: string,
    formValues?: { [key: string]: string }
  ): ConverterDefinition | null {
    if (!selectedConverter) return null;

    const parameters: Array<{ name: string; value: string }> = [];
    
    if (selectedConverter.parameters) {
      for (const parameter of selectedConverter.parameters) {
        const elementId = converterParameterPrefix + parameter.name;
        const element = document.getElementById(elementId) as HTMLInputElement;
        
        if (element) {
          parameters.push({
            name: parameter.name,
            value: formValues?.[parameter.name] || element.value || ''
          });
        }
      }
    }

    return {
      encoding: "UTF-8",
      mimeType: mimeType,
      name: selectedConverter.name,
      parameters: parameters,
      schema: schema
    };
  }

  /**
   * Build datasource type definition
   */
  async buildDatasourceTypeDefinition(
    selectedDatasourceType: DatasourceType, 
    datasourceTypeParameterPrefix: string, 
    datasourceFileInputId: string,
    formValues?: { [key: string]: string }
  ): Promise<DatasourceTypeDefinition | null> {
    if (!selectedDatasourceType) return null;

    const parameters: Array<{ name: string; value: string }> = [];
    
    if (selectedDatasourceType.parameters) {
      for (const parameter of selectedDatasourceType.parameters) {
        const elementId = datasourceTypeParameterPrefix + parameter.name;
        const element = document.getElementById(elementId) as HTMLInputElement;
        
        if (element) {
          parameters.push({
            name: parameter.name,
            value: formValues?.[parameter.name] || element.value || ''
          });
        }
      }
    }

    // Handle file upload for FILE type
    if (selectedDatasourceType.type === 'FILE') {
      const fileInput = document.getElementById(datasourceFileInputId) as HTMLInputElement;
      if (fileInput && fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileId = await this.uploadNewFile(file, file.name);
        parameters.push({
          name: 'fileId',
          value: fileId
        });
      }
    }

    return {
      parameters: parameters,
      type: selectedDatasourceType.type
    };
  }

  /**
   * Build property mapping for indicator resource
   */
  buildPropertyMapping_indicatorResource(
    spatialReferenceKeyProperty: string, 
    timeseriesMappings: any[], 
    keepMissingOrNullValueIndicator: boolean
  ): any {
    return {
      spatialReferenceKeyProperty: spatialReferenceKeyProperty,
      timeseriesMappings: timeseriesMappings,
      keepMissingOrNullValueIndicator: keepMissingOrNullValueIndicator
    };
  }

  /**
   * Update indicator
   */
  async updateIndicator(
    converterDefinition: ConverterDefinition, 
    datasourceTypeDefinition: DatasourceTypeDefinition, 
    propertyMappingDefinition: PropertyMappingDefinition, 
    indicatorId: string, 
    indicatorPutBody_managementAPI: any, 
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log(`Trying to POST to importer service to update indicator with id '${indicatorId}'`);

    const postBody = {
      "converter": converterDefinition,
      "dataSource": datasourceTypeDefinition,
      "propertyMapping": propertyMappingDefinition,
      "indicatorId": indicatorId,
      "indicatorPutBody": indicatorPutBody_managementAPI,
      "dryRun": isDryRun
    };

    return this.http.post<ImporterResponse>(`${this.targetUrlToImporterService}indicators/update`, postBody, {
      headers: {
        'Content-Type': "application/json"
      }
    }).toPromise()
      .then(result => {
        if (!result) {
          throw new Error("No response from importer service");
        }
        return result;
      })
      .catch(error => {
        console.error("Error while posting to importer service.", error);
        throw error;
      });
  }

  /**
   * Check if importer response contains errors
   */
  importerResponseContainsErrors(importerResponse: ImporterResponse): boolean {
    if (importerResponse.errors && importerResponse.errors.length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Get ID from importer response
   */
  getIdFromImporterResponse(importerResponse: ImporterResponse): string | undefined {
    if (importerResponse.uri) {
      return importerResponse.uri;
    }
    return undefined;
  }

  /**
   * Get errors from importer response
   */
  getErrorsFromImporterResponse(importerResponse: ImporterResponse): any[] | undefined {
    if (importerResponse.errors) {
      return importerResponse.errors;
    }
    return undefined;
  }

  /**
   * Get imported features from importer response
   */
  getImportedFeaturesFromImporterResponse(importerResponse: ImporterResponse): any[] | undefined {
    if (importerResponse.importedFeatures) {
      return importerResponse.importedFeatures;
    }
    return undefined;
  }

  /**
   * Get available converters
   */
  getAvailableConverters(): Converter[] {
    return this.availableConverters;
  }

  /**
   * Get available datasource types
   */
  getAvailableDatasourceTypes(): DatasourceType[] {
    return this.availableDatasourceTypes;
  }

  /**
   * Get attribute mapping types
   */
  getAttributeMappingTypes(): AttributeMappingType[] {
    return this.attributeMapping_attributeTypes;
  }
} 