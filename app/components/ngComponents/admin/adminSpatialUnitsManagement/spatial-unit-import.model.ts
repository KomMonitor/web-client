import type {
  AttributeMappingType,
  Converter,
  ConverterDefinition,
  DatasourceType,
  DatasourceTypeDefinition,
  PropertyMappingDefinition,
} from 'services/adminSpatialUnit/kommonitor-importer-helper.service';

// Re-export the importer definition types from KommonitorImporterHelperService so
// the spatial-unit importer modals and the shared import service share a single
// import surface for these shapes.
export type {
  AttributeMappingType,
  Converter,
  ConverterDefinition,
  DatasourceType,
  DatasourceTypeDefinition,
  PropertyMappingDefinition,
  ImporterResponse,
} from 'services/adminSpatialUnit/kommonitor-importer-helper.service';

/**
 * One row of the admin attribute-mapping table shared by the add and
 * edit-features modals. Consumed by
 * `KommonitorImporterHelperService.buildPropertyMapping_spatialResource`.
 */
export interface AttributeMappingRow {
  sourceName: string;
  destinationName: string;
  dataType: AttributeMappingType;
}

/**
 * Everything `SpatialUnitImportService.buildImporterObjects` needs from a modal
 * to assemble the three importer definitions. The per-modal differences
 * (parameter-name prefixes, the data-source file input id, and the pre-assembled
 * data-source form values incl. bbox) are passed in rather than hard-coded.
 */
export interface ImporterObjectsConfig {
  converter: Converter | null;
  schema: string;
  mimeType: string;
  converterParameterPrefix: string;
  converterParameterValues: { [key: string]: string };
  datasourceType: DatasourceType | null;
  datasourceTypeParameterPrefix: string;
  datasourceFileInputId: string;
  datasourceTypeFormValues: { [key: string]: string };
  selectedFile: File | null;
  fileInputElement: HTMLInputElement | null | undefined;
  idProperty: string;
  nameProperty: string;
  validStartDate: string;
  validEndDate: string;
  keepAttributes: boolean;
  keepMissingValues: boolean;
  attributeMappings: AttributeMappingRow[];
}

/** The three importer definitions produced from an `ImporterObjectsConfig`. */
export interface ImporterDefinitions {
  converterDefinition: ConverterDefinition | null;
  datasourceTypeDefinition: DatasourceTypeDefinition | null;
  propertyMappingDefinition: PropertyMappingDefinition | null;
}
