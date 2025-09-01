import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// TypeScript interfaces for better type safety
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
export class KommonitorImporterHelperService {
  private targetUrlToImporterService: string;
  public availableConverters: Converter[] = [];
  public availableDatasourceTypes: DatasourceType[] = [];

  // Static data structures
  public readonly attributeMapping_attributeTypes: AttributeMappingType[] = [
    {
      displayName: "Text/String",
      apiName: "string"
    },
    {
      displayName: "Ganzzahl",
      apiName: "integer"
    },
    {
      displayName: "Gleitkommazahl",
      apiName: "float"
    },
    {
      displayName: "Datum",
      apiName: "date"
    }
  ];

  public readonly mappingConfigStructure: MappingConfigStructure = {
    "converter": {
      "encoding": "string",
      "mimeType": "string",
      "name": "string",
      "parameters": [
        {
          "name": "string",
          "value": "string"
        }
      ],
      "schema": "string"
    },
    "dataSource": {
      "parameters": [
        {
          "name": "string",
          "value": "string"
        }
      ],
      "type": "FILE"
    },
    "propertyMapping": {
      "arisenFromProperty": "string",
      "attributes": [
        {
          "mappingName": "string",
          "name": "string",
          "type": "string"
        }
      ],
      "identifierProperty": "string",
      "keepAttributes": true,
      "nameProperty": "string",
      "validEndDateProperty": "string",
      "validStartDateProperty": "string"
    },
    "periodOfValidity": {
      "startDate": "yyyy-mm-dd",
      "endDate": "yyyy-mm-dd"
    }
  };

  public readonly mappingConfigStructure_indicator = {
    "converter": {
      "encoding": "string",
      "mimeType": "string",
      "name": "string",
      "parameters": [
        {
          "name": "string",
          "value": "string"
        }
      ],
      "schema": "string"
    },
    "dataSource": {
      "parameters": [
        {
          "name": "string",
          "value": "string"
        }
      ],
      "type": "FILE"
    },
    "propertyMapping": {
      "attributeMappings": [
        {
          "mappingName": "string",
          "name": "string",
          "type": "string"
        }
      ],
      "spatialReferenceKeyProperty": "string",
      "timeseriesMappings": [
        {
          "indicatorValueProperty": "string",
          "timestamp": "string",
          "timestampProperty": "string"
        }
      ]
    },
    "targetSpatialUnitName": "string"
  };

  public readonly converterDefinition_singleFeatureImport: ConverterDefinition = {
    "encoding": "UTF-8",
    "mimeType": "application/geo+json",
    "name": "GeoJSON",
    "parameters": [
      {
        "name": "CRS",
        "value": "EPSG:4326"
      }
    ]
  };

  public readonly datasourceDefinition_singleFeatureImport: DatasourceTypeDefinition = {
    "parameters": [
      {
        "name": "payload",
        "value": "geojsonValue"
      }
    ],
    "type": "INLINE"
  };

  public readonly propertyMappingDefinition_singleFeatureImport: PropertyMappingDefinition = {
    "identifierProperty": "ID",
    "nameProperty": "NAME",
    "keepAttributes": true,
    "keepMissingOrNullValueAttributes": true,
    "attributes": []
  };

  constructor(private http: HttpClient) {
    // Get the target URL from environment or configuration
    this.targetUrlToImporterService = (window as any).__env?.targetUrlToImporterService || '/api/importer/';
    
    // Initialize resources
    this.fetchResourcesFromImporter();
  }

  /**
   * Fetch all resources from importer service
   */
  async fetchResourcesFromImporter(): Promise<void> {
    try {
      console.log("Trying to fetch converters and datasourceTypes from importer service");
      
      this.availableConverters = await this.fetchConverters();
      this.availableDatasourceTypes = await this.fetchDatasourceTypes();

      if (!this.availableConverters || !this.availableDatasourceTypes) {
        throw new Error("Notwendige Anbindung an Importer-Service ist fehlerhaft. Bitte wenden Sie sich an Ihren Administrator.");
      }

      // Fetch details for each converter
      for (let index = 0; index < this.availableConverters.length; index++) {
        const converter = this.availableConverters[index];
        this.availableConverters[index] = await this.fetchConverterDetails(converter);
      }

      // Fetch details for each datasource type
      for (let k = 0; k < this.availableDatasourceTypes.length; k++) {
        this.availableDatasourceTypes[k] = await this.fetchDatasourceTypeDetails(this.availableDatasourceTypes[k]);
      }
    } catch (error) {
      console.error("Error fetching resources from importer:", error);
      throw error;
    }
  }

  /**
   * Filter converters based on resource type
   */
  filterConverters(resourceType: string): (converter: Converter) => boolean {
    return (converter: Converter) => {
      if (resourceType === "georesource" && converter.name.includes("Indikator")) {
        return false;
      }
      if (resourceType === "spatialUnit" && (converter.name.includes("Indikator") || converter.name.includes("Tabelle"))) {
        return false;
      }
      if (resourceType === "indicator" && (converter.name.includes("Geokodierung") || converter.name.includes("Koordinate"))) {
        return false;
      }
      return true;
    };
  }

  /**
   * Fetch converters from importer service
   */
  async fetchConverters(): Promise<Converter[]> {
    return this.http.get<Converter[]>(`${this.targetUrlToImporterService}converters`).toPromise()
      .then(result => result || [])
      .catch(error => {
        console.error("Error while fetching converters from importer.", error);
        throw error;
      });
  }

  /**
   * Fetch converter details from importer service
   */
  async fetchConverterDetails(converter: Converter): Promise<Converter> {
    return this.http.get<Converter>(`${this.targetUrlToImporterService}converters/${converter.name}`).toPromise()
      .then(result => {
        if (!result) {
          throw new Error(`Converter ${converter.name} not found`);
        }
        return result;
      })
      .catch(error => {
        console.error(`Error while fetching converter for name '${converter.name}' from importer.`, error);
        throw error;
      });
  }

  /**
   * Fetch datasource types from importer service
   */
  async fetchDatasourceTypes(): Promise<DatasourceType[]> {
    return this.http.get<DatasourceType[]>(`${this.targetUrlToImporterService}datasourceTypes`).toPromise()
      .then(result => result || [])
      .catch(error => {
        console.error("Error while fetching datasourceTypes from importer.", error);
        throw error;
      });
  }

  /**
   * Fetch datasource type details from importer service
   */
  async fetchDatasourceTypeDetails(datasourceType: DatasourceType): Promise<DatasourceType> {
    return this.http.get<DatasourceType>(`${this.targetUrlToImporterService}datasourceTypes/${datasourceType.type}`).toPromise()
      .then(result => {
        if (!result) {
          throw new Error(`DatasourceType ${datasourceType.type} not found`);
        }
        return result;
      })
      .catch(error => {
        console.error(`Error while fetching datasourceType for type '${datasourceType.type}' from importer.`, error);
        throw error;
      });
  }

  /**
   * Upload a new file to importer service
   */
  async uploadNewFile(fileData: File, fileName: string): Promise<string> {
    console.log("Trying to POST to importer service to upload a new file.");
    
    const formdata = new FormData();
    formdata.append("filename", fileName);
    formdata.append("file", fileData);

    return this.http.post(`${this.targetUrlToImporterService}upload`, formdata, {
      responseType: 'text'
    }).toPromise()
      .then(result => result || '')
      .catch(error => {
        console.error("Error while posting to importer service.", error);
        throw error;
      });
  }

  /**
   * Build converter definition from form values
   */
  buildConverterDefinition(
    selectedConverter: Converter, 
    converterParameterPrefix: string, 
    schema: string, 
    mimeType: string,
    formValues?: { [key: string]: string }
  ): ConverterDefinition | null {
    const converterDefinition: ConverterDefinition = {
      "encoding": selectedConverter.encodings[0],
      "mimeType": selectedConverter.mimeTypes.filter(element => element === mimeType)[0],
      "name": selectedConverter.name,
      "parameters": [],
      "schema": undefined
    };

    if (selectedConverter.schemas) {
      if (schema === undefined || schema === null) {
        return null;
      } else {
        converterDefinition.schema = schema;
      }
    }

    // Track whether CRS was provided explicitly
    let hasExplicitCRS = false;

    if (selectedConverter.parameters && selectedConverter.parameters.length > 0) {
      for (const parameter of selectedConverter.parameters) {
        const parameterName = parameter.name;
        const parameterValue = formValues ? formValues[parameterName] : 
          (document.getElementById(converterParameterPrefix + parameterName) as HTMLInputElement)?.value;

        if (parameter.mandatory && (parameterValue === undefined || parameterValue === null || parameterValue === "")) {
          return null;
        } else {
          if (parameterValue && !(parameterValue === "")) {
            converterDefinition.parameters.push({
              "name": parameterName,
              "value": parameterValue
            });
            if (parameterName === 'CRS') {
              hasExplicitCRS = true;
            }
          }
        }
      }
    }

    // If converter is OGC API - Features and CRS not provided, set sensible default
    if (selectedConverter.name === "OGC API - Features" && !hasExplicitCRS) {
      converterDefinition.parameters.push({
        name: 'CRS',
        value: 'EPSG:4326'
      });
    }

    return converterDefinition;
  }

  /**
   * Build datasource type definition from form values
   */
  async buildDatasourceTypeDefinition(
    selectedDatasourceType: DatasourceType, 
    datasourceTypeParameterPrefix: string, 
    datasourceFileInputId: string,
    formValues?: { [key: string]: string }
  ): Promise<DatasourceTypeDefinition | null> {
    const datasourceTypeDefinition: DatasourceTypeDefinition = {
      "parameters": [],
      "type": selectedDatasourceType.type
    };

    if (selectedDatasourceType.type === "FILE") {
      const fileInput = document.getElementById(datasourceFileInputId) as HTMLInputElement;
      const file = fileInput?.files?.[0];

      if (file === null || file === undefined) {
        return null;
      }

      let fileUploadName: string;
      try {
        fileUploadName = await this.uploadNewFile(file, file.name);
      } catch (error) {
        console.error("Error while uploading file to importer.", error);
        throw error;
      }

      datasourceTypeDefinition.parameters.push({
        "name": "NAME",
        "value": fileUploadName
      });
    } else {
      if (selectedDatasourceType.parameters.length > 0) {
        for (const parameter of selectedDatasourceType.parameters) {
          const parameterName = parameter.name;
          if (parameterName === "bbox") {
            const bboxType = formValues ? formValues['bboxType'] :
              (document.getElementById(datasourceTypeParameterPrefix + "bboxType") as HTMLInputElement)?.value;
            
            datasourceTypeDefinition.parameters.push({
              "name": "bboxType",
              "value": bboxType
            });

            let value: string | undefined;
            if (bboxType === 'ref') {
              value = formValues ? formValues['bboxRef'] :
                (document.getElementById(datasourceTypeParameterPrefix + "bboxRef") as HTMLInputElement)?.value;
            } else {
              const minx = formValues ? formValues['bbox_minx'] :
                (document.getElementById(datasourceTypeParameterPrefix + "bbox_minx") as HTMLInputElement)?.value;
              const miny = formValues ? formValues['bbox_miny'] :
                (document.getElementById(datasourceTypeParameterPrefix + "bbox_miny") as HTMLInputElement)?.value;
              const maxx = formValues ? formValues['bbox_maxx'] :
                (document.getElementById(datasourceTypeParameterPrefix + "bbox_maxx") as HTMLInputElement)?.value;
              const maxy = formValues ? formValues['bbox_maxy'] :
                (document.getElementById(datasourceTypeParameterPrefix + "bbox_maxy") as HTMLInputElement)?.value;
              value = minx + "," + miny + "," + maxx + "," + maxy;
            }

            datasourceTypeDefinition.parameters.push({
              "name": "bbox",
              "value": value
            });
          } else {
            const parameterValue = formValues ? formValues[parameterName] :
              (document.getElementById(datasourceTypeParameterPrefix + parameterName) as HTMLInputElement)?.value;

            if (parameterValue === undefined || parameterValue === null) {
              return datasourceTypeDefinition;
            } else {
              datasourceTypeDefinition.parameters.push({
                "name": parameterName,
                "value": parameterValue
              });
            }
          }
        }
      }
    }

    return datasourceTypeDefinition;
  }

  /**
   * Build property mapping for spatial resources
   */
  buildPropertyMapping_spatialResource(
    nameProperty: string, 
    idProperty: string, 
    validStartDateProperty: string, 
    validEndDateProperty: string, 
    arisenFromProperty: string, 
    keepAttributes: boolean, 
    keepMissingValues: boolean, 
    attributeMappings_adminView: any[]
  ): PropertyMappingDefinition {
    const finalValidStartDateProperty = validStartDateProperty === "" ? undefined : validStartDateProperty;
    const finalValidEndDateProperty = validEndDateProperty === "" ? undefined : validEndDateProperty;
    const finalArisenFromProperty = arisenFromProperty === "" ? undefined : arisenFromProperty;

    const propertyMapping: PropertyMappingDefinition = {
      "arisenFromProperty": finalArisenFromProperty,
      "identifierProperty": idProperty,
      "nameProperty": nameProperty,
      "validEndDateProperty": finalValidEndDateProperty,
      "validStartDateProperty": finalValidStartDateProperty,
      "keepAttributes": keepAttributes,
      "keepMissingOrNullValueAttributes": keepMissingValues,
      "attributes": []
    };

    if (!keepAttributes) {
      // add attribute mappings
      attributeMappings_adminView.forEach(attributeMapping_adminView => {
        propertyMapping.attributes.push({
          name: attributeMapping_adminView.sourceName,
          mappingName: attributeMapping_adminView.destinationName,
          type: attributeMapping_adminView.dataType.apiName
        });
      });
    }

    return propertyMapping;
  }

  /**
   * Build property mapping for indicator resources
   */
  buildPropertyMapping_indicatorResource(
    spatialReferenceKeyProperty: string, 
    timeseriesMappings: any[], 
    keepMissingOrNullValueIndicator: boolean
  ): any {
    console.log(spatialReferenceKeyProperty);
    console.log(timeseriesMappings);
    console.log(keepMissingOrNullValueIndicator);
    
    return {
      "spatialReferenceKeyProperty": spatialReferenceKeyProperty,
      "timeseriesMappings": timeseriesMappings,
      "keepMissingOrNullValueIndicator": keepMissingOrNullValueIndicator,
      "attributeMappings": undefined
    };
  }

  /**
   * Register new spatial unit
   */
  async registerNewSpatialUnit(
    converterDefinition: ConverterDefinition, 
    datasourceTypeDefinition: DatasourceTypeDefinition, 
    propertyMappingDefinition: PropertyMappingDefinition, 
    spatialUnitPostBody_managementAPI: any, 
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log("Trying to POST to importer service to register new spatial unit.");

    const postBody = {
      "converter": converterDefinition,
      "dataSource": datasourceTypeDefinition,
      "propertyMapping": propertyMappingDefinition,
      "spatialUnitPostBody": spatialUnitPostBody_managementAPI,
      "dryRun": isDryRun
    };

    return this.http.post<ImporterResponse>(`${this.targetUrlToImporterService}spatial-units`, postBody, {
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
   * Update spatial unit
   */
  async updateSpatialUnit(
    converterDefinition: ConverterDefinition, 
    datasourceTypeDefinition: DatasourceTypeDefinition, 
    propertyMappingDefinition: PropertyMappingDefinition, 
    spatialUnitId: string, 
    spatialUnitPutBody_managementAPI: any, 
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log(`Trying to POST to importer service to update spatial unit with id '${spatialUnitId}'`);

    const postBody = {
      "converter": converterDefinition,
      "dataSource": datasourceTypeDefinition,
      "propertyMapping": propertyMappingDefinition,
      "spatialUnitId": spatialUnitId,
      "spatialUnitPutBody": spatialUnitPutBody_managementAPI,
      "dryRun": isDryRun
    };

    return this.http.post<ImporterResponse>(`${this.targetUrlToImporterService}spatial-units/update`, postBody, {
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
   * Register new georesource
   */
  async registerNewGeoresource(
    converterDefinition: ConverterDefinition, 
    datasourceTypeDefinition: DatasourceTypeDefinition, 
    propertyMappingDefinition: PropertyMappingDefinition, 
    georesourcePostBody_managementAPI: any, 
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log("Trying to POST to importer service to register new georesource.");

    const postBody = {
      "converter": converterDefinition,
      "dataSource": datasourceTypeDefinition,
      "propertyMapping": propertyMappingDefinition,
      "georesourcePostBody": georesourcePostBody_managementAPI,
      "dryRun": isDryRun
    };

    return this.http.post<ImporterResponse>(`${this.targetUrlToImporterService}georesources`, postBody, {
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
   * Update georesource
   */
  async updateGeoresource(
    converterDefinition: ConverterDefinition, 
    datasourceTypeDefinition: DatasourceTypeDefinition, 
    propertyMappingDefinition: PropertyMappingDefinition, 
    georesourceId: string, 
    georesourcePutBody_managementAPI: any, 
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log(`Trying to POST to importer service to update georesource with id '${georesourceId}'`);

    const postBody = {
      "converter": converterDefinition,
      "dataSource": datasourceTypeDefinition,
      "propertyMapping": propertyMappingDefinition,
      "georesourceId": georesourceId,
      "georesourcePutBody": georesourcePutBody_managementAPI,
      "dryRun": isDryRun
    };

    return this.http.post<ImporterResponse>(`${this.targetUrlToImporterService}georesources/update`, postBody, {
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
   * Register new indicator
   */
  async registerNewIndicator(
    converterDefinition: ConverterDefinition, 
    datasourceTypeDefinition: DatasourceTypeDefinition, 
    propertyMappingDefinition: PropertyMappingDefinition, 
    indicatorPostBody_managementAPI: any, 
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log("Trying to POST to importer service to register new indicator.");

    const postBody = {
      "converter": converterDefinition,
      "dataSource": datasourceTypeDefinition,
      "propertyMapping": propertyMappingDefinition,
      "indicatorPostBody": indicatorPostBody_managementAPI,
      "dryRun": isDryRun
    };

    return this.http.post<ImporterResponse>(`${this.targetUrlToImporterService}indicators`, postBody, {
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