import type {
  BatchUpdateRow,
  BatchUpdateRowResult,
} from 'services/batch-update-service/batch-update.model';
import type { TimeseriesMapping } from 'services/resource-import-service/resource-import.model';
import {
  BatchRowFormGroup,
  BatchUpdateFormGroup,
  batchRowToConverterConfig,
  batchRowToDatasourceConfig,
} from './indicator-batch-update-form.model';

/**
 * Turns the batch form into the rows `BatchUpdateService` runs.
 *
 * The interesting part is `buildIndicatorScopeProperties`: it decides which
 * access rights and which classification an updated indicator keeps. Both are
 * read from **freshly looked-up** metadata rather than from an object captured
 * in the row, which is where the legacy implementation could work from a stale
 * copy after an earlier row of the same run had already updated the indicator.
 */

/** The join entry of one applicable spatial unit, narrowed to what is read. */
export interface IndicatorSpatialUnitJoin {
  spatialUnitId?: string;
  spatialUnitName?: string;
  permissions?: string[];
  ownerId?: string;
  isPublic?: boolean;
}

/** Indicator metadata, narrowed to what the run needs. */
export interface IndicatorRunMetadata {
  indicatorId?: string;
  indicatorName?: string;
  applicableSpatialUnits?: IndicatorSpatialUnitJoin[];
  permissions?: string[];
  ownerId?: string;
  isPublic?: boolean;
  defaultClassificationMapping?: unknown;
}

export interface IndicatorScopeProperties {
  targetSpatialUnitMetadata: { spatialUnitLevel: string };
  currentIndicatorDataset: { defaultClassificationMapping: unknown };
  permissions: string[] | undefined;
  ownerId: string | undefined;
  isPublic: boolean | undefined;
}

/** i18n keys of the failures that are diagnosed before the importer is called. */
export const BATCH_PREPARE_MESSAGE_KEYS = {
  metadataMissing: 'ADMIN_INDICATORS.BATCH_MODAL.ROW_METADATA_MISSING',
} as const;

/**
 * Access rights and classification of the indicator that is about to be
 * updated.
 *
 * Rights come from the join entry of the target spatial unit and fall back to
 * the indicator's own — the rule the released client uses, and the reason the
 * modal warns that a newly linked spatial unit inherits the metadata rights.
 * Deliberately *not* the edit-features variant, which unions in the owner's
 * default permissions and reads `isPublic` from a user-facing toggle: the batch
 * modal has no such toggle, so a batch run must neither widen nor narrow access.
 *
 * `defaultClassificationMapping` has to travel with the PUT body — the backend
 * applies it on update even though `IndicatorPUTInputType` does not declare it,
 * so leaving it out would blank the indicator's classification on every run.
 */
export function buildIndicatorScopeProperties(
  metadata: IndicatorRunMetadata,
  targetSpatialUnitId: string,
  spatialUnitLevel: string
): IndicatorScopeProperties {
  // Matched on the id only. The legacy lookup also compared `spatialUnitName`
  // against the *id*, which never matched and is therefore dropped.
  const join = (metadata.applicableSpatialUnits ?? []).find(
    (candidate) => candidate.spatialUnitId === targetSpatialUnitId
  );

  return {
    targetSpatialUnitMetadata: { spatialUnitLevel },
    currentIndicatorDataset: {
      defaultClassificationMapping: metadata.defaultClassificationMapping,
    },
    permissions: join ? join.permissions : metadata.permissions,
    ownerId: join ? join.ownerId : metadata.ownerId,
    isPublic: join ? join.isPublic : metadata.isPublic,
  };
}

export interface BatchRowBuilders {
  /** `KommonitorImporterHelperService.buildPropertyMapping_indicatorResource`. */
  buildPropertyMapping(
    spatialReferenceKeyProperty: string,
    timeseriesMappings: TimeseriesMapping[],
    keepMissingValues: boolean
  ): unknown;
  /** `KommonitorImporterHelperService.buildPutBody_indicators`. */
  buildPutBody(scopeProperties: IndicatorScopeProperties): unknown;
}

export interface BatchPrepareContext {
  /** Fresh metadata lookup, i.e. `IndicatorMetadataStoreService.getIndicatorMetadataById`. */
  findIndicator(indicatorId: string): IndicatorRunMetadata | undefined;
  /** Level name of a spatial unit id; the PUT body travels by level, not id. */
  findSpatialUnitLevel(spatialUnitId: string): string | undefined;
  builders: BatchRowBuilders;
}

export interface BatchPrepareResult {
  rows: BatchUpdateRow[];
  /** Rows that could not be prepared, already shaped like a run result. */
  failures: BatchUpdateRowResult[];
}

/**
 * Prepares every row of the list. Rows whose indicator or target spatial unit
 * cannot be resolved any more are reported as failures instead of being sent —
 * the run is otherwise identical to the released behaviour, where **all** rows
 * run and the row checkbox only drives deletion.
 */
export function prepareBatchRows(
  form: BatchUpdateFormGroup,
  context: BatchPrepareContext
): BatchPrepareResult {
  const keepMissingValues = form.controls.keepMissingValues.value;
  const result: BatchPrepareResult = { rows: [], failures: [] };

  form.controls.rows.controls.forEach((row) => {
    const prepared = prepareRow(row, keepMissingValues, context);
    if ('status' in prepared) {
      result.failures.push(prepared);
    } else {
      result.rows.push(prepared);
    }
  });

  return result;
}

function prepareRow(
  row: BatchRowFormGroup,
  keepMissingValues: boolean,
  context: BatchPrepareContext
): BatchUpdateRow | BatchUpdateRowResult {
  const value = row.getRawValue();
  const metadata = context.findIndicator(value.indicatorId);
  const spatialUnitLevel = context.findSpatialUnitLevel(value.targetSpatialUnitId);

  if (!metadata || !spatialUnitLevel) {
    return {
      label: metadata?.indicatorName ?? value.indicatorId,
      resourceId: value.indicatorId,
      status: 'error',
      message: '',
      messageKey: BATCH_PREPARE_MESSAGE_KEYS.metadataMissing,
    };
  }

  const scopeProperties = buildIndicatorScopeProperties(
    metadata,
    value.targetSpatialUnitId,
    spatialUnitLevel
  );

  return {
    label: metadata.indicatorName ?? value.indicatorId,
    resourceId: value.indicatorId,
    converter: batchRowToConverterConfig(row),
    datasource: batchRowToDatasourceConfig(row),
    propertyMapping: context.builders.buildPropertyMapping(
      value.spatialReferenceKeyProperty,
      value.timeseriesMappings,
      keepMissingValues
    ),
    putBody: context.builders.buildPutBody(scopeProperties),
  };
}
