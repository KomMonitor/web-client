import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EnvConfigService } from 'services/env-config-service/env-config.service';
import { firstValueFrom } from 'rxjs';
import {
  DefaultClassificationMappingType,
  GeoresourcePOSTInputType,
  GeoresourcePUTInputType,
  IndicatorPOSTInputType,
  IndicatorPUTInputType,
  SpatialUnitPOSTInputType,
  SpatialUnitPUTInputType,
} from 'models/data-management-api';

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

/** One configurable parameter of a converter or data-source type. */
export interface ImporterParameter {
  name: string;
  mandatory: boolean;
  /** Optional hint rendered next to the input in the admin modals. */
  description?: string;
}

export interface Converter {
  name: string;
  type: string;
  mimeTypes: string[];
  encodings: string[];
  schemas?: string[];
  parameters?: ImporterParameter[];
}

export interface DatasourceType {
  type: string;
  parameters: ImporterParameter[];
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
  providedIn: 'root',
})
export class KommonitorImporterHelperService {
  private targetUrlToImporterService: string;
  public availableConverters: Converter[] = [];
  public availableDatasourceTypes: DatasourceType[] = [];

  // Static data structures
  public readonly attributeMapping_attributeTypes: AttributeMappingType[] = [
    {
      displayName: 'Text/String',
      apiName: 'string',
    },
    {
      displayName: 'Ganzzahl',
      apiName: 'integer',
    },
    {
      displayName: 'Gleitkommazahl',
      apiName: 'float',
    },
    {
      displayName: 'Datum',
      apiName: 'date',
    },
  ];

  public readonly mappingConfigStructure: MappingConfigStructure = {
    converter: {
      encoding: 'string',
      mimeType: 'string',
      name: 'string',
      parameters: [
        {
          name: 'string',
          value: 'string',
        },
      ],
      schema: 'string',
    },
    dataSource: {
      parameters: [
        {
          name: 'string',
          value: 'string',
        },
      ],
      type: 'FILE',
    },
    propertyMapping: {
      arisenFromProperty: 'string',
      attributes: [
        {
          mappingName: 'string',
          name: 'string',
          type: 'string',
        },
      ],
      identifierProperty: 'string',
      keepAttributes: true,
      nameProperty: 'string',
      validEndDateProperty: 'string',
      validStartDateProperty: 'string',
    },
    periodOfValidity: {
      startDate: 'yyyy-mm-dd',
      endDate: 'yyyy-mm-dd',
    },
  };

  public readonly mappingConfigStructure_indicator = {
    converter: {
      encoding: 'string',
      mimeType: 'string',
      name: 'string',
      parameters: [
        {
          name: 'string',
          value: 'string',
        },
      ],
      schema: 'string',
    },
    dataSource: {
      parameters: [
        {
          name: 'string',
          value: 'string',
        },
      ],
      type: 'FILE',
    },
    propertyMapping: {
      attributeMappings: [
        {
          mappingName: 'string',
          name: 'string',
          type: 'string',
        },
      ],
      spatialReferenceKeyProperty: 'string',
      timeseriesMappings: [
        {
          indicatorValueProperty: 'string',
          timestamp: 'string',
          timestampProperty: 'string',
        },
      ],
    },
    targetSpatialUnitName: 'string',
  };

  public readonly converterDefinition_singleFeatureImport: ConverterDefinition = {
    encoding: 'UTF-8',
    mimeType: 'application/geo+json',
    name: 'GeoJSON',
    parameters: [
      {
        name: 'CRS',
        value: 'EPSG:4326',
      },
    ],
  };

  public readonly datasourceDefinition_singleFeatureImport: DatasourceTypeDefinition = {
    parameters: [
      {
        name: 'payload',
        value: 'geojsonValue',
      },
    ],
    type: 'INLINE',
  };

  public readonly propertyMappingDefinition_singleFeatureImport: PropertyMappingDefinition = {
    identifierProperty: 'ID',
    nameProperty: 'NAME',
    keepAttributes: true,
    keepMissingOrNullValueAttributes: true,
    attributes: [],
  };

  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);

  constructor() {
    this.targetUrlToImporterService =
      this.envConfigService.targetUrlToImporterService || '/api/importer/';

    // Initialize resources
    this.fetchResourcesFromImporter();
  }

  /**
   * Fetch all resources from importer service
   */
  async fetchResourcesFromImporter(): Promise<void> {
    try {
      console.log('Trying to fetch converters and datasourceTypes from importer service');

      this.availableConverters = await this.fetchConverters();
      this.availableDatasourceTypes = await this.fetchDatasourceTypes();

      if (!this.availableConverters || !this.availableDatasourceTypes) {
        throw new Error(
          'Notwendige Anbindung an Importer-Service ist fehlerhaft. Bitte wenden Sie sich an Ihren Administrator.'
        );
      }

      // Fetch details for each converter
      for (let index = 0; index < this.availableConverters.length; index++) {
        const converter = this.availableConverters[index];
        this.availableConverters[index] = await this.fetchConverterDetails(converter);
      }

      // Fetch details for each datasource type
      for (let k = 0; k < this.availableDatasourceTypes.length; k++) {
        this.availableDatasourceTypes[k] = await this.fetchDatasourceTypeDetails(
          this.availableDatasourceTypes[k]
        );
      }
    } catch (error) {
      console.error('Error fetching resources from importer:', error);
      throw error;
    }
  }

  /**
   * Filter converters based on resource type
   */
  filterConverters(resourceType: string): (converter: Converter) => boolean {
    return (converter: Converter) => {
      if (resourceType === 'georesource' && converter.name.includes('Indikator')) {
        return false;
      }
      if (
        resourceType === 'spatialUnit' &&
        (converter.name.includes('Indikator') || converter.name.includes('Tabelle'))
      ) {
        return false;
      }
      if (
        resourceType === 'indicator' &&
        (converter.name.includes('Geokodierung') || converter.name.includes('Koordinate'))
      ) {
        return false;
      }
      return true;
    };
  }

  /**
   * Fetch converters from importer service
   */
  async fetchConverters(): Promise<Converter[]> {
    return firstValueFrom(
      this.http.get<Converter[]>(`${this.targetUrlToImporterService}converters`)
    )
      .then((result) => result || [])
      .catch((error) => {
        console.error('Error while fetching converters from importer.', error);
        throw error;
      });
  }

  /**
   * Fetch converter details from importer service
   */
  async fetchConverterDetails(converter: Converter): Promise<Converter> {
    return firstValueFrom(
      this.http.get<Converter>(`${this.targetUrlToImporterService}converters/${converter.name}`)
    )
      .then((result) => {
        if (!result) {
          throw new Error(`Converter ${converter.name} not found`);
        }
        return result;
      })
      .catch((error) => {
        console.error(
          `Error while fetching converter for name '${converter.name}' from importer.`,
          error
        );
        throw error;
      });
  }

  /**
   * Fetch datasource types from importer service
   */
  async fetchDatasourceTypes(): Promise<DatasourceType[]> {
    return firstValueFrom(
      this.http.get<DatasourceType[]>(`${this.targetUrlToImporterService}datasourceTypes`)
    )
      .then((result) => result || [])
      .catch((error) => {
        console.error('Error while fetching datasourceTypes from importer.', error);
        throw error;
      });
  }

  /**
   * Fetch datasource type details from importer service
   */
  async fetchDatasourceTypeDetails(datasourceType: DatasourceType): Promise<DatasourceType> {
    return firstValueFrom(
      this.http.get<DatasourceType>(
        `${this.targetUrlToImporterService}datasourceTypes/${datasourceType.type}`
      )
    )
      .then((result) => {
        if (!result) {
          throw new Error(`DatasourceType ${datasourceType.type} not found`);
        }
        return result;
      })
      .catch((error) => {
        console.error(
          `Error while fetching datasourceType for type '${datasourceType.type}' from importer.`,
          error
        );
        throw error;
      });
  }

  /**
   * Upload a new file to importer service
   */
  async uploadNewFile(fileData: File, fileName: string): Promise<string> {
    console.log('Trying to POST to importer service to upload a new file.');

    const formdata = new FormData();
    formdata.append('filename', fileName);
    formdata.append('file', fileData);

    return firstValueFrom(
      this.http.post(`${this.targetUrlToImporterService}upload`, formdata, {
        responseType: 'text',
      })
    )
      .then((result) => result || '')
      .catch((error) => {
        console.error('Error while posting to importer service.', error);
        throw error;
      });
  }

  /**
   * Build converter definition from the modal's ngModel-bound form values
   * (keyed by parameter name). Returns null while required fields are missing.
   */
  buildConverterDefinition(
    selectedConverter: Converter,
    schema: string,
    mimeType: string,
    formValues: { [key: string]: string },
    // Only the batch update offers a per-row encoding choice; the other modals
    // pass nothing and keep the converter's first encoding.
    encoding?: string
  ): ConverterDefinition | null {
    const converterDefinition: ConverterDefinition = {
      encoding: encoding || selectedConverter.encodings[0],
      mimeType: selectedConverter.mimeTypes.filter((element) => element === mimeType)[0],
      name: selectedConverter.name,
      parameters: [],
      schema: undefined,
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
        const parameterValue = formValues[parameterName];

        if (
          parameter.mandatory &&
          (parameterValue === undefined || parameterValue === null || parameterValue === '')
        ) {
          return null;
        } else {
          if (parameterValue && !(parameterValue === '')) {
            converterDefinition.parameters.push({
              name: parameterName,
              value: parameterValue,
            });
            if (parameterName === 'CRS') {
              hasExplicitCRS = true;
            }
          }
        }
      }
    }

    // If converter is OGC API - Features and CRS not provided, set sensible default
    if (selectedConverter.name === 'OGC API - Features' && !hasExplicitCRS) {
      converterDefinition.parameters.push({
        name: 'CRS',
        value: 'EPSG:4326',
      });
    }

    return converterDefinition;
  }

  /**
   * Build a non-FILE datasource type definition from the modal's ngModel-bound
   * form values (keyed by parameter name; bbox settings via the dedicated
   * bboxType/bboxRef/bbox_* keys). FILE data sources are handled by
   * `ResourceImportService` (file upload first) and return null here.
   */
  buildDatasourceTypeDefinition(
    selectedDatasourceType: DatasourceType,
    formValues: { [key: string]: string }
  ): DatasourceTypeDefinition | null {
    const datasourceTypeDefinition: DatasourceTypeDefinition = {
      parameters: [],
      type: selectedDatasourceType.type,
    };

    if (selectedDatasourceType.type === 'FILE') {
      return null;
    }

    if (selectedDatasourceType.parameters.length > 0) {
      for (const parameter of selectedDatasourceType.parameters) {
        const parameterName = parameter.name;
        if (parameterName === 'bbox') {
          const bboxType = formValues['bboxType'];

          datasourceTypeDefinition.parameters.push({
            name: 'bboxType',
            value: bboxType,
          });

          let value: string | undefined;
          if (bboxType === 'ref') {
            value = formValues['bboxRef'];
          } else {
            value =
              formValues['bbox_minx'] +
              ',' +
              formValues['bbox_miny'] +
              ',' +
              formValues['bbox_maxx'] +
              ',' +
              formValues['bbox_maxy'];
          }

          datasourceTypeDefinition.parameters.push({
            name: 'bbox',
            value: value,
          });
        } else {
          const parameterValue = formValues[parameterName];

          if (parameterValue === undefined || parameterValue === null) {
            return datasourceTypeDefinition;
          } else {
            datasourceTypeDefinition.parameters.push({
              name: parameterName,
              value: parameterValue,
            });
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
    const finalValidStartDateProperty =
      validStartDateProperty === '' ? undefined : validStartDateProperty;
    const finalValidEndDateProperty =
      validEndDateProperty === '' ? undefined : validEndDateProperty;
    const finalArisenFromProperty = arisenFromProperty === '' ? undefined : arisenFromProperty;

    const propertyMapping: PropertyMappingDefinition = {
      arisenFromProperty: finalArisenFromProperty,
      identifierProperty: idProperty,
      nameProperty: nameProperty,
      validEndDateProperty: finalValidEndDateProperty,
      validStartDateProperty: finalValidStartDateProperty,
      keepAttributes: keepAttributes,
      keepMissingOrNullValueAttributes: keepMissingValues,
      attributes: [],
    };

    if (!keepAttributes) {
      // add attribute mappings
      attributeMappings_adminView.forEach((attributeMapping_adminView) => {
        propertyMapping.attributes.push({
          name: attributeMapping_adminView.sourceName,
          mappingName: attributeMapping_adminView.destinationName,
          type: attributeMapping_adminView.dataType.apiName,
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
      spatialReferenceKeyProperty: spatialReferenceKeyProperty,
      timeseriesMappings: timeseriesMappings,
      keepMissingOrNullValueIndicator: keepMissingOrNullValueIndicator,
      attributeMappings: undefined,
    };
  }

  /**
   * Build the PUT body for an indicator update (ported from legacy
   * KommonitorImporterHelperService — see ADMIN_AREA_BRIDGE_MIGRATION.md, Modal 3).
   */
  // Note: defaultClassificationMapping is sent although IndicatorPUTInputType does not
  // define it — the backend accepts and applies it on update.
  buildPutBody_indicators(
    scopeProperties: any
  ): IndicatorPUTInputType & { defaultClassificationMapping?: DefaultClassificationMappingType } {
    return {
      indicatorValues: [],
      applicableSpatialUnit: scopeProperties.targetSpatialUnitMetadata.spatialUnitLevel,
      defaultClassificationMapping:
        scopeProperties.currentIndicatorDataset.defaultClassificationMapping,
      permissions: scopeProperties.permissions,
      ownerId: scopeProperties.ownerId,
      isPublic: scopeProperties.isPublic,
    };
  }

  /**
   * Register new spatial unit
   */
  async registerNewSpatialUnit(
    converterDefinition: ConverterDefinition,
    datasourceTypeDefinition: DatasourceTypeDefinition,
    propertyMappingDefinition: PropertyMappingDefinition,
    spatialUnitPostBody_managementAPI: SpatialUnitPOSTInputType,
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log('Trying to POST to importer service to register new spatial unit.');

    const postBody = {
      converter: converterDefinition,
      dataSource: datasourceTypeDefinition,
      propertyMapping: propertyMappingDefinition,
      spatialUnitPostBody: spatialUnitPostBody_managementAPI,
      dryRun: isDryRun,
    };

    return firstValueFrom(
      this.http.post<ImporterResponse>(
        `${this.targetUrlToImporterService}spatial-units`,
        postBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )
      .then((result) => {
        if (!result) {
          throw new Error('No response from importer service');
        }
        return result;
      })
      .catch((error) => {
        console.error('Error while posting to importer service.', error);
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
    spatialUnitPutBody_managementAPI: SpatialUnitPUTInputType,
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log(
      `Trying to POST to importer service to update spatial unit with id '${spatialUnitId}'`
    );

    const postBody = {
      converter: converterDefinition,
      dataSource: datasourceTypeDefinition,
      propertyMapping: propertyMappingDefinition,
      spatialUnitId: spatialUnitId,
      spatialUnitPutBody: spatialUnitPutBody_managementAPI,
      dryRun: isDryRun,
    };

    return firstValueFrom(
      this.http.post<ImporterResponse>(
        `${this.targetUrlToImporterService}spatial-units/update`,
        postBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )
      .then((result) => {
        if (!result) {
          throw new Error('No response from importer service');
        }
        return result;
      })
      .catch((error) => {
        console.error('Error while posting to importer service.', error);
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
    georesourcePostBody_managementAPI: GeoresourcePOSTInputType,
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log('Trying to POST to importer service to register new georesource.');

    const postBody = {
      converter: converterDefinition,
      dataSource: datasourceTypeDefinition,
      propertyMapping: propertyMappingDefinition,
      georesourcePostBody: georesourcePostBody_managementAPI,
      dryRun: isDryRun,
    };

    return firstValueFrom(
      this.http.post<ImporterResponse>(`${this.targetUrlToImporterService}georesources`, postBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
      .then((result) => {
        if (!result) {
          throw new Error('No response from importer service');
        }
        return result;
      })
      .catch((error) => {
        console.error('Error while posting to importer service.', error);
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
    georesourcePutBody_managementAPI: GeoresourcePUTInputType,
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log(
      `Trying to POST to importer service to update georesource with id '${georesourceId}'`
    );

    const postBody = {
      converter: converterDefinition,
      dataSource: datasourceTypeDefinition,
      propertyMapping: propertyMappingDefinition,
      georesourceId: georesourceId,
      georesourcePutBody: georesourcePutBody_managementAPI,
      dryRun: isDryRun,
    };

    return firstValueFrom(
      this.http.post<ImporterResponse>(
        `${this.targetUrlToImporterService}georesources/update`,
        postBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )
      .then((result) => {
        if (!result) {
          throw new Error('No response from importer service');
        }
        return result;
      })
      .catch((error) => {
        console.error('Error while posting to importer service.', error);
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
    indicatorPostBody_managementAPI: IndicatorPOSTInputType,
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log('Trying to POST to importer service to register new indicator.');

    const postBody = {
      converter: converterDefinition,
      dataSource: datasourceTypeDefinition,
      propertyMapping: propertyMappingDefinition,
      indicatorPostBody: indicatorPostBody_managementAPI,
      dryRun: isDryRun,
    };

    return firstValueFrom(
      this.http.post<ImporterResponse>(`${this.targetUrlToImporterService}indicators`, postBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    )
      .then((result) => {
        if (!result) {
          throw new Error('No response from importer service');
        }
        return result;
      })
      .catch((error) => {
        console.error('Error while posting to importer service.', error);
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
    indicatorPutBody_managementAPI: IndicatorPUTInputType,
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    console.log(`Trying to POST to importer service to update indicator with id '${indicatorId}'`);

    const postBody = {
      converter: converterDefinition,
      dataSource: datasourceTypeDefinition,
      propertyMapping: propertyMappingDefinition,
      indicatorId: indicatorId,
      indicatorPutBody: indicatorPutBody_managementAPI,
      dryRun: isDryRun,
    };

    return firstValueFrom(
      this.http.post<ImporterResponse>(
        `${this.targetUrlToImporterService}indicators/update`,
        postBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    )
      .then((result) => {
        if (!result) {
          throw new Error('No response from importer service');
        }
        return result;
      })
      .catch((error) => {
        console.error('Error while posting to importer service.', error);
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
