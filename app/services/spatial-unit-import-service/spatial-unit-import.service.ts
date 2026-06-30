import { inject, Injectable } from '@angular/core';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import type {
  DatasourceTypeDefinition,
  ImporterDefinitions,
  ImporterObjectsConfig,
} from 'components/ngComponents/admin/adminSpatialUnitsManagement/spatial-unit-import.model';

/**
 * Shared importer logic for the spatial-unit add and edit-features modals.
 * Wraps `KommonitorImporterHelperService` so both modals build the importer
 * definitions through one typed entry point instead of duplicating the thin
 * builder wrappers (which only differed in parameter-name prefixes and the
 * data-source file input id).
 */
@Injectable({ providedIn: 'root' })
export class SpatialUnitImportService {
  private importerHelper = inject(KommonitorImporterHelperService);

  /**
   * Assembles the converter, data-source and property-mapping definitions from a
   * modal's current form state. Any of the three may be null when its form input
   * is incomplete; the caller decides whether the set is complete enough to
   * submit. Rejects if a FILE data-source upload fails.
   */
  async buildImporterObjects(config: ImporterObjectsConfig): Promise<ImporterDefinitions> {
    const converterDefinition = config.converter
      ? this.importerHelper.buildConverterDefinition(
          config.converter,
          config.converterParameterPrefix,
          config.schema,
          config.mimeType,
          config.converterParameterValues
        )
      : null;

    const datasourceTypeDefinition = await this.buildDatasourceTypeDefinition(config);

    const propertyMappingDefinition = this.importerHelper.buildPropertyMapping_spatialResource(
      config.nameProperty,
      config.idProperty,
      config.validStartDate,
      config.validEndDate,
      '',
      config.keepAttributes,
      config.keepMissingValues,
      config.attributeMappings
    );

    return { converterDefinition, datasourceTypeDefinition, propertyMappingDefinition };
  }

  private async buildDatasourceTypeDefinition(
    config: ImporterObjectsConfig
  ): Promise<DatasourceTypeDefinition | null> {
    if (!config.datasourceType) {
      return null;
    }

    // FILE data sources are uploaded directly to the importer; the resulting
    // server-side filename becomes the single NAME parameter.
    if (config.datasourceType.type === 'FILE') {
      const file = config.selectedFile ?? config.fileInputElement?.files?.[0];
      if (!file) {
        return null;
      }
      const uploadedName = await this.importerHelper.uploadNewFile(file, file.name);
      return { type: 'FILE', parameters: [{ name: 'NAME', value: uploadedName }] };
    }

    const formValues = config.datasourceTypeFormValues;
    return this.importerHelper.buildDatasourceTypeDefinition(
      config.datasourceType,
      config.datasourceTypeParameterPrefix,
      config.datasourceFileInputId,
      Object.keys(formValues).length ? formValues : undefined
    );
  }
}
