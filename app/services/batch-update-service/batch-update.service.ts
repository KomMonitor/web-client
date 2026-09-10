import { Injectable, inject } from '@angular/core';
import { KommonitorImporterHelperService } from 'services/adminSpatialUnit/kommonitor-importer-helper.service';
import type { GeoresourcePUTInputType, IndicatorPUTInputType } from 'models/data-management-api';
import type {
  ConverterDefinition,
  DatasourceTypeDefinition,
  ImporterResponse,
  PropertyMappingDefinition,
} from 'services/resource-import-service/resource-import.model';
import { ResourceImportService } from 'services/resource-import-service/resource-import.service';
import {
  BATCH_UPDATE_MESSAGE_KEYS,
  BatchResourceType,
  BatchUpdateOptions,
  BatchUpdateRow,
  BatchUpdateRowResult,
  formatBatchRowError,
} from './batch-update.model';

/**
 * Runs an importer update for a list of prepared rows — the orchestration of the
 * admin batch update, for indicators and georesources alike.
 *
 * Angular port of `kommonitorBatchUpdateHelperService.batchUpdate()` from
 * `origin/master`. The behaviour that matters is kept exactly:
 *
 * - **sequential**, one row after the other. Each row is up to three importer
 *   round trips (file upload, dry run, commit), so a parallel fan-out would put
 *   a very different load on the importer than the released version does.
 * - **dry run before commit**, per row: the real call only happens when the dry
 *   run reports no errors.
 * - **a failing row does not stop the run**; its error is collected and the loop
 *   continues. A batch can therefore end partially applied — there is no
 *   rollback, and never was one.
 *
 * What the legacy service also did and this one does not: touch the DOM (it
 * cleared the result table and rewrote button labels), read files through
 * `document.getElementById`, and broadcast `batchUpdateCompleted`. Progress and
 * results are returned to the caller instead.
 */
@Injectable({ providedIn: 'root' })
export class BatchUpdateService {
  private importerHelper = inject(KommonitorImporterHelperService);
  private resourceImport = inject(ResourceImportService);

  async runBatchUpdate(
    resourceType: BatchResourceType,
    rows: readonly BatchUpdateRow[],
    options: BatchUpdateOptions = {}
  ): Promise<BatchUpdateRowResult[]> {
    const results: BatchUpdateRowResult[] = [];

    for (const [index, row] of rows.entries()) {
      results.push(await this.runRow(resourceType, row));
      options.onProgress?.(index + 1, rows.length);
    }

    return results;
  }

  private async runRow(
    resourceType: BatchResourceType,
    row: BatchUpdateRow
  ): Promise<BatchUpdateRowResult> {
    const converterDefinition = this.resourceImport.buildConverterDefinition(row.converter);

    let datasourceTypeDefinition: DatasourceTypeDefinition | null;
    try {
      // Called once per row and reused for both calls below: for a FILE data
      // source this uploads the file, so rebuilding it between dry run and
      // commit would upload the same file twice.
      datasourceTypeDefinition = await this.resourceImport.buildDatasourceTypeDefinition(
        row.datasource
      );
    } catch (error) {
      return this.errorResult(row, formatBatchRowError(error));
    }

    if (!converterDefinition || !datasourceTypeDefinition) {
      // The Angular builders report incomplete input as null, where the legacy
      // ones always returned an object — so this guard has no counterpart there.
      return {
        ...this.errorResult(row, ''),
        messageKey: BATCH_UPDATE_MESSAGE_KEYS.incompleteRow,
      };
    }

    try {
      const dryRun = await this.callImporter(
        resourceType,
        row,
        converterDefinition,
        datasourceTypeDefinition,
        true
      );

      if (this.importerHelper.importerResponseContainsErrors(dryRun)) {
        return {
          ...this.errorResult(row, formatBatchRowError(dryRun.errors)),
          errors: this.importerHelper.getErrorsFromImporterResponse(dryRun),
        };
      }

      await this.callImporter(
        resourceType,
        row,
        converterDefinition,
        datasourceTypeDefinition,
        false
      );

      return { label: row.label, resourceId: row.resourceId, status: 'success', message: '' };
    } catch (error) {
      return this.errorResult(row, formatBatchRowError(error));
    }
  }

  /** The only place the resource type still matters: which endpoint to post to. */
  private callImporter(
    resourceType: BatchResourceType,
    row: BatchUpdateRow,
    converterDefinition: ConverterDefinition,
    datasourceTypeDefinition: DatasourceTypeDefinition,
    isDryRun: boolean
  ): Promise<ImporterResponse> {
    // Both casts narrow the row's deliberately opaque payloads back to what the
    // importer helper declares. The property-mapping type is the spatial shape
    // even on the indicator endpoint — an inaccuracy that predates this service
    // (`buildPropertyMapping_indicatorResource` returns `any`).
    const propertyMapping = row.propertyMapping as PropertyMappingDefinition;

    return resourceType === 'indicator'
      ? this.importerHelper.updateIndicator(
          converterDefinition,
          datasourceTypeDefinition,
          propertyMapping,
          row.resourceId,
          row.putBody as IndicatorPUTInputType,
          isDryRun
        )
      : this.importerHelper.updateGeoresource(
          converterDefinition,
          datasourceTypeDefinition,
          propertyMapping,
          row.resourceId,
          row.putBody as GeoresourcePUTInputType,
          isDryRun
        );
  }

  private errorResult(row: BatchUpdateRow, message: string): BatchUpdateRowResult {
    return { label: row.label, resourceId: row.resourceId, status: 'error', message };
  }
}
