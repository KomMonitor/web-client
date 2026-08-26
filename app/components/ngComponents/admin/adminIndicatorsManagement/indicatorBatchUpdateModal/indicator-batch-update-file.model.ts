import type {
  Converter,
  DatasourceType,
  TimeseriesMapping,
} from 'services/resource-import-service/resource-import.model';
import { syncParameterControls } from '../../adminShared/importerForm/importer-form.model';
import { isValidTimeseriesMappingList } from '../../adminShared/timeseriesMappingForm/timeseries-mapping-form.model';
import { BatchRowFormGroup } from './indicator-batch-update-form.model';

/**
 * On-disk format of the batch list, kept **byte-compatible with the AngularJS
 * export** so lists users saved from the released client still load: `name` is
 * the bare indicator id, the converter and data source are importer
 * *definitions* (parameters as a name/value array, not flattened properties),
 * and the target spatial unit travels as its level name.
 */
export interface BatchListFileRow {
  name?: string;
  isSelected?: boolean;
  mappingTableName?: string;
  mappingObj?: {
    converter?: {
      name?: string;
      encoding?: string;
      mimeType?: string;
      schema?: string;
      parameters?: { name?: string; value?: string }[];
    };
    dataSource?: {
      type?: string;
      parameters?: { name?: string; value?: string }[];
    };
    propertyMapping?: {
      timeseriesMappings?: unknown;
      spatialReferenceKeyProperty?: string;
      keepMissingOrNullValueIndicator?: boolean;
    };
    targetSpatialUnitName?: string;
  };
}

/** The spatial-unit lookup the conversion needs, narrowed to what it reads. */
export interface SpatialUnitLookup {
  availableSpatialUnits?: { spatialUnitId?: string; spatialUnitLevel?: string }[] | null;
}

export interface BatchListFileContext {
  converters: readonly Converter[];
  datasourceTypes: readonly DatasourceType[];
  spatialUnits: readonly { spatialUnitId?: string; spatialUnitLevel?: string }[];
}

/** Serialises one row into the on-disk format. */
export function batchRowToFileRow(
  row: BatchRowFormGroup,
  spatialUnits: SpatialUnitLookup
): BatchListFileRow {
  const value = row.getRawValue();
  const level = (spatialUnits.availableSpatialUnits ?? []).find(
    (unit) => unit.spatialUnitId === value.targetSpatialUnitId
  )?.spatialUnitLevel;

  return {
    name: value.indicatorId,
    isSelected: value.selected,
    mappingTableName: value.mappingTableName,
    mappingObj: {
      converter: {
        name: value.converter?.name,
        encoding: value.encoding || value.converter?.encodings?.[0],
        mimeType: value.mimeType,
        schema: value.schema || undefined,
        parameters: toParameterArray(value.converterParameters),
      },
      dataSource: {
        type: value.datasourceType?.type,
        // The file itself is never exported — the legacy writer zeroed the NAME
        // parameter on purpose, since a server-side upload name is single-use.
        parameters: toParameterArray(value.datasourceTypeParameters, ['NAME']),
      },
      propertyMapping: {
        timeseriesMappings: value.timeseriesMappings,
        spatialReferenceKeyProperty: value.spatialReferenceKeyProperty,
      },
      targetSpatialUnitName: level,
    },
  };
}

/** Applies one on-disk row onto a freshly built row form. */
export function batchListFileRowToRow(
  row: BatchRowFormGroup,
  fileRow: BatchListFileRow,
  context: BatchListFileContext
): void {
  const mapping = fileRow.mappingObj ?? {};
  const converter =
    context.converters.find((candidate) => candidate.name === mapping.converter?.name) ?? null;
  const datasourceType =
    context.datasourceTypes.find((candidate) => candidate.type === mapping.dataSource?.type) ??
    null;
  const spatialUnitId =
    context.spatialUnits.find((unit) => unit.spatialUnitLevel === mapping.targetSpatialUnitName)
      ?.spatialUnitId ?? '';

  row.patchValue({
    selected: fileRow.isSelected ?? true,
    indicatorId: fileRow.name ?? '',
    mappingTableName: fileRow.mappingTableName ?? '',
    converter,
    mimeType: mapping.converter?.mimeType ?? '',
    encoding: mapping.converter?.encoding ?? '',
    schema: mapping.converter?.schema ?? '',
    datasourceType,
    spatialReferenceKeyProperty: mapping.propertyMapping?.spatialReferenceKeyProperty ?? '',
    targetSpatialUnitId: spatialUnitId,
  });

  const timeseriesMappings = mapping.propertyMapping?.timeseriesMappings;
  if (isValidTimeseriesMappingList(timeseriesMappings)) {
    row.controls.timeseriesMappings.setValue(timeseriesMappings as TimeseriesMapping[]);
  }

  // The parameter records follow the resolved converter / data-source type, so
  // rebuild them before applying the file's values; a converter the importer no
  // longer offers therefore drops its parameters rather than inventing controls.
  syncParameterControls(row.controls.converterParameters, converter?.parameters);
  syncParameterControls(row.controls.datasourceTypeParameters, datasourceType?.parameters);
  applyParameters(row.controls.converterParameters, mapping.converter?.parameters);
  applyParameters(row.controls.datasourceTypeParameters, mapping.dataSource?.parameters, ['NAME']);
}

/** `keepMissingOrNullValueIndicator` of the first row that defines it. */
export function keepMissingValuesFromFile(
  fileRows: readonly BatchListFileRow[]
): boolean | undefined {
  return fileRows.find(
    (fileRow) => fileRow.mappingObj?.propertyMapping?.keepMissingOrNullValueIndicator !== undefined
  )?.mappingObj?.propertyMapping?.keepMissingOrNullValueIndicator;
}

function toParameterArray(
  values: { [key: string]: string },
  skipNames: readonly string[] = []
): { name: string; value: string }[] {
  return Object.entries(values)
    .filter(([name, value]) => !skipNames.includes(name) && value !== '')
    .map(([name, value]) => ({ name, value }));
}

function applyParameters(
  record: { controls: { [key: string]: { setValue(value: string): void } } },
  parameters: readonly { name?: string; value?: string }[] | null | undefined,
  skipNames: readonly string[] = []
): void {
  (parameters ?? []).forEach((parameter) => {
    if (!parameter.name || skipNames.includes(parameter.name)) {
      return;
    }
    record.controls[parameter.name]?.setValue(parameter.value ?? '');
  });
}
