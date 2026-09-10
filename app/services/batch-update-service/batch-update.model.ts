import type {
  ConverterConfig,
  DatasourceConfig,
} from 'services/resource-import-service/resource-import.service';

/**
 * Types and pure helpers of the resource-agnostic batch update.
 *
 * Ported from the AngularJS `kommonitorBatchUpdateHelperService`, which was
 * deleted in the migration (`39862b75`) and took the batch-update feature with
 * it. Everything that service did by hand and now has a home elsewhere stays
 * out: the converter/data-source definition builders live in
 * `ResourceImportService`, the file upload in
 * `KommonitorImporterHelperService.uploadNewFile`, and the per-row form state in
 * the modal's `FormArray`. What is left here is the loop contract.
 */

export type BatchResourceType = 'indicator' | 'georesource';

/**
 * One prepared row of the batch list. Deliberately form-agnostic: the modal maps
 * its `FormArray` onto this, so the service never touches form or DOM state.
 *
 * `propertyMapping` and `putBody` arrive **pre-built** because they are the only
 * genuinely resource-type-specific parts, and their builders already exist and
 * are covered by specs (`buildPropertyMapping_indicatorResource` /
 * `buildPropertyMapping_spatialResource`, `buildPutBody_indicators`). Keeping
 * them out is what reduces the legacy service's per-resource-type branching to a
 * single question: which endpoint to call.
 */
export interface BatchUpdateRow {
  /** Shown in the result table — indicator name / dataset name. */
  label: string;
  /** `indicatorId` / `georesourceId`. */
  resourceId: string;
  converter: ConverterConfig;
  datasource: DatasourceConfig;
  propertyMapping: unknown;
  putBody: unknown;
}

export interface BatchUpdateOptions {
  /** Reported after every row so the modal can show progress. */
  onProgress?: (done: number, total: number) => void;
}

export type BatchRowStatus = 'success' | 'error';

export interface BatchUpdateRowResult {
  label: string;
  resourceId: string;
  status: BatchRowStatus;
  /**
   * Server-provided detail as **plain text**, empty when there is none. Safe to
   * render without `[innerHTML]`.
   */
  message: string;
  /**
   * Set instead of `message` when the service itself diagnosed the row, so the
   * caller knows to translate rather than print. Never both.
   */
  messageKey?: string;
  /** Raw importer errors of a rejected dry run, for the collapsible detail block. */
  errors?: unknown[];
}

/** i18n keys of the diagnoses the service produces itself. */
export const BATCH_UPDATE_MESSAGE_KEYS = {
  incompleteRow: 'ADMIN_SHARED_UI.BATCH_UPDATE.ROW_INCOMPLETE',
} as const;

/**
 * Reduces an error to a readable single string.
 *
 * Uses the same detail cascade as `IndicatorValueService.formatError` but
 * returns **plain text**, not syntax-highlighted HTML: the legacy result modal
 * assigned server strings to `innerHTML`, which the Angular result table must
 * not reproduce.
 */
export function formatBatchRowError(error: unknown): string {
  const candidate = error as
    | {
        error?: { message?: unknown } | string;
        data?: { message?: unknown } | string;
        message?: unknown;
      }
    | undefined;

  const detail =
    (typeof candidate?.error === 'object' ? candidate?.error?.message : undefined) ??
    candidate?.error ??
    (typeof candidate?.data === 'object' ? candidate?.data?.message : undefined) ??
    candidate?.data ??
    candidate?.message ??
    error;

  return stringifyDetail(detail);
}

function stringifyDetail(detail: unknown): string {
  if (detail === null || detail === undefined) {
    return '';
  }
  if (typeof detail === 'string') {
    return detail;
  }
  if (typeof detail === 'number' || typeof detail === 'boolean') {
    return String(detail);
  }
  try {
    return JSON.stringify(detail, null, 2);
  } catch {
    // Circular structures: JSON.stringify throws, String() never does.
    return String(detail);
  }
}

/** Counts for the summary toast after a run. */
export function summariseBatchResults(results: readonly BatchUpdateRowResult[]): {
  total: number;
  success: number;
  error: number;
} {
  const success = results.filter((result) => result.status === 'success').length;

  return { total: results.length, success, error: results.length - success };
}
