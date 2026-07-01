import { inject, Injectable } from '@angular/core';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import type {
  AttributeMappingRow,
  DatasourceTypeDefinition,
  ImporterDefinitions,
  ImporterObjectsConfig,
  MappingConfigImport,
  MissingImporterFieldsInput,
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

  /** Reads a File as text and parses it as JSON. Rejects on read/parse errors. */
  readJsonFile(file: File): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          resolve(JSON.parse(String(event.target?.result ?? '')));
        } catch {
          reject(new Error('Uploaded MappingConfig File cannot be parsed correctly'));
        }
      };
      reader.onerror = () =>
        reject(new Error('Uploaded MappingConfig File cannot be parsed correctly'));
      reader.readAsText(file);
    });
  }

  /**
   * Resolves a parsed import mapping-config JSON against the importer's available
   * converters / data-source types / attribute-mapping types into a
   * `MappingConfigImport`. Throws when the top-level structure is missing.
   */
  parseMappingConfig(json: any): MappingConfigImport {
    if (!json?.converter || !json?.dataSource || !json?.propertyMapping) {
      throw new Error('Struktur der Datei stimmt nicht mit erwartetem Muster überein.');
    }

    const converter =
      this.importerHelper.getAvailableConverters().find((c) => c.name === json.converter.name) ??
      null;

    let schema = '';
    if (converter?.schemas && json.converter.schema) {
      schema = converter.schemas.find((s) => s === json.converter.schema) ?? '';
    }

    let mimeType = '';
    if (converter?.mimeTypes && json.converter.mimeType) {
      mimeType = converter.mimeTypes.find((m) => m === json.converter.mimeType) ?? '';
    }

    const converterParameters: { [key: string]: string } = {};
    for (const param of json.converter.parameters ?? []) {
      if (param?.name) {
        converterParameters[param.name] = param.value ?? '';
      }
    }

    const datasourceType =
      this.importerHelper
        .getAvailableDatasourceTypes()
        .find((d) => d.type === json.dataSource.type) ?? null;

    const dataSourceParameters: { name: string; value: string }[] = Array.isArray(
      json.dataSource.parameters
    )
      ? json.dataSource.parameters
      : [];

    const datasourceTypeParameters: { [key: string]: string } = {};
    for (const p of dataSourceParameters) {
      if (p?.name && p.name !== 'bbox' && p.name !== 'bboxType') {
        datasourceTypeParameters[p.name] = p.value ?? '';
      }
    }

    const attributeMappingTypes = this.importerHelper.getAttributeMappingTypes();
    const attributeMappings: AttributeMappingRow[] = (json.propertyMapping.attributes ?? []).map(
      (attr: any) => ({
        sourceName: attr.name,
        destinationName: attr.mappingName,
        dataType: attributeMappingTypes.find((t) => t.apiName === attr.type)!,
      })
    );

    const periodOfValidity = json.periodOfValidity
      ? {
          startDate: json.periodOfValidity.startDate ?? '',
          endDate: json.periodOfValidity.endDate ?? '',
        }
      : null;

    return {
      converter,
      schema,
      mimeType,
      converterParameters,
      datasourceType,
      datasourceTypeParameters,
      dataSourceParameters,
      nameProperty: json.propertyMapping.nameProperty,
      idProperty: json.propertyMapping.identifierProperty,
      validStartDate: json.propertyMapping.validStartDateProperty,
      validEndDate: json.propertyMapping.validEndDateProperty,
      keepAttributes: json.propertyMapping.keepAttributes,
      keepMissingValues: json.propertyMapping.keepMissingOrNullValueAttributes,
      attributeMappings,
      periodOfValidity,
    };
  }

  /**
   * Returns the labels of the required importer form fields that are missing or
   * invalid, in display order. An empty array means the form is complete.
   */
  collectMissingImporterFields(input: MissingImporterFieldsInput): string[] {
    const missing: string[] = [];

    const converter = input.converter;
    if (!converter) {
      missing.push('Konverter');
    } else {
      if (converter.schemas?.length && !input.schema) {
        missing.push('Schema');
      }
      if (converter.mimeTypes?.length && !input.mimeType) {
        missing.push('Quellformat');
      }
      for (const param of converter.parameters ?? []) {
        if (param.mandatory && !input.converterParameters?.[param.name]) {
          missing.push(`Konverter-Parameter '${param.name}'`);
        }
      }
    }

    const datasourceType = input.datasourceType;
    if (!datasourceType) {
      missing.push('Datenquelltyp');
    } else if (datasourceType.type === 'FILE') {
      if (!input.hasFile) {
        missing.push('Datei');
      }
    } else {
      if (datasourceType.type === 'OGCAPI_FEATURES') {
        if (!input.bboxType) {
          missing.push('Räumlicher Filter');
        } else if (input.bboxType === 'ref' && !input.bboxRefSpatialUnitLevel) {
          missing.push('Referenzraumebene für Begrenzungsrahmen');
        } else if (input.bboxType === 'literal') {
          const bbox = input.bboxLiteral;
          if (
            bbox.minx === null ||
            bbox.miny === null ||
            bbox.maxx === null ||
            bbox.maxy === null
          ) {
            missing.push('Begrenzungsrahmen (minx, miny, maxx, maxy)');
          }
        }
      }
      for (const param of datasourceType.parameters ?? []) {
        if (param.name === 'bbox') {
          continue;
        }
        const value = input.datasourceTypeParameters?.[param.name];
        if (param.mandatory && (value === undefined || value === null || value === '')) {
          missing.push(`Datenquelle-Parameter '${param.name}'`);
        }
      }
    }

    if (!input.idProperty) {
      missing.push('ID Attributname');
    }
    if (!input.nameProperty) {
      missing.push('NAME Attributname');
    }
    if (!input.startDate) {
      missing.push('Gültig seit (Periodenbeginn)');
    }
    if (input.periodOfValidityInvalid) {
      missing.push('Gültigkeitszeitraum ist ungültig');
    }

    return missing;
  }

  /** Serialises `data` to JSON and triggers a browser download. */
  downloadJson(fileName: string, data: unknown): void {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.download = fileName;
    anchor.href = url;
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
