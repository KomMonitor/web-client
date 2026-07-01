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

/**
 * Snapshot of a modal's importer form state used to collect the labels of
 * missing/invalid required fields. The file-presence and bbox-literal checks are
 * pre-computed by the modal (which owns the DOM/raw values) and passed as flags.
 */
export interface MissingImporterFieldsInput {
  converter: Converter | null;
  schema: string;
  mimeType: string;
  converterParameters: { [key: string]: string };
  datasourceType: DatasourceType | null;
  datasourceTypeParameters: { [key: string]: string };
  hasFile: boolean;
  bboxType: string;
  bboxRefSpatialUnitLevel: string;
  bboxLiteral: { minx: unknown; miny: unknown; maxx: unknown; maxy: unknown };
  idProperty: string;
  nameProperty: string;
  startDate: string;
  periodOfValidityInvalid: boolean;
}

/** The three importer definitions produced from an `ImporterObjectsConfig`. */
export interface ImporterDefinitions {
  converterDefinition: ConverterDefinition | null;
  datasourceTypeDefinition: DatasourceTypeDefinition | null;
  propertyMappingDefinition: PropertyMappingDefinition | null;
}

/**
 * A parsed import mapping-config file, resolved against the importer's available
 * converters / data-source types / attribute-mapping types. The modal applies
 * this onto its form fields; the raw `dataSourceParameters` are exposed so each
 * modal can keep its own bbox interpretation.
 */
export interface MappingConfigImport {
  converter: Converter | null;
  schema: string;
  mimeType: string;
  converterParameters: { [key: string]: string };
  datasourceType: DatasourceType | null;
  datasourceTypeParameters: { [key: string]: string };
  dataSourceParameters: { name: string; value: string }[];
  nameProperty: string;
  idProperty: string;
  validStartDate: string;
  validEndDate: string;
  keepAttributes: boolean;
  keepMissingValues: boolean;
  attributeMappings: AttributeMappingRow[];
  periodOfValidity: { startDate: string; endDate: string } | null;
}
