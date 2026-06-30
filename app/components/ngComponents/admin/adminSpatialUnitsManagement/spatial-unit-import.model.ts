import type { AttributeMappingType } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';

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
