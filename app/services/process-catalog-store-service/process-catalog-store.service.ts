import { Injectable, computed, inject, signal } from '@angular/core';
import {
  KommonitorUiParams,
  ProcessSummary,
} from 'components/ngComponents/models/schedules.models';
import { ProcessesApiService } from 'services/processes-api-service/processes-api.service';

/** A process of the catalogue together with its resolved KomMonitor UI params. */
export interface CatalogueProcess {
  id: string;
  title: string;
  uiParams: KommonitorUiParams | undefined;
  description: ProcessSummary;
}

/**
 * The process catalogue, keyed both ways.
 *
 * Needed because schedules and jobs identify their process by `apiName`
 * (snake_case, e.g. `km_indicator_multiply`) while the catalogue lists and
 * schedules it under its PascalCase `id` (`KmIndicatorMultiply`). The mapping
 * cannot be computed — `KmGeoresourceCountPointsWithinPolygon` carries the
 * apiName `km_georesource_count_pointsWithinPolygon`, which is neither plain
 * snake_case nor derivable — so it has to be read from the descriptions.
 *
 * The `apiName` is absent from the list response, so building the map costs one
 * request per process. It is therefore loaded once and cached in memory.
 */
@Injectable({
  providedIn: 'root',
})
export class ProcessCatalogStoreService {
  private processesApiService = inject(ProcessesApiService);

  private _processes = signal<CatalogueProcess[]>([]);
  readonly processes = this._processes.asReadonly();

  private byApiName = computed(
    () =>
      new Map(
        this._processes()
          .filter((process) => process.uiParams?.apiName)
          .map((process) => [process.uiParams!.apiName, process])
      )
  );
  private byId = computed(() => new Map(this._processes().map((process) => [process.id, process])));

  private loadPromise: Promise<CatalogueProcess[]> | undefined;

  /**
   * Loads the catalogue once. Concurrent callers share the same request batch;
   * later calls resolve from memory.
   */
  async loadCatalogue(): Promise<CatalogueProcess[]> {
    this.loadPromise ??= this.fetchCatalogue();
    return await this.loadPromise;
  }

  /** Drops the cache so the next `loadCatalogue()` hits the server again. */
  invalidate(): void {
    this.loadPromise = undefined;
    this._processes.set([]);
  }

  /** Resolves the `processID` of a schedule or job to its catalogue entry. */
  getProcessByApiName(apiName: string | undefined): CatalogueProcess | undefined {
    return apiName ? this.byApiName().get(apiName) : undefined;
  }

  getProcessById(processId: string | undefined): CatalogueProcess | undefined {
    return processId ? this.byId().get(processId) : undefined;
  }

  /**
   * Display title for a `processID` as it appears on schedules and jobs. Falls
   * back to the raw value: jobs also reference processes that carry no
   * `apiName` at all (`single_export`, `spatial_unit_export`).
   */
  getProcessTitleByApiName(apiName: string | undefined): string {
    return this.getProcessByApiName(apiName)?.title ?? apiName ?? '';
  }

  private async fetchCatalogue(): Promise<CatalogueProcess[]> {
    const summaries = await this.processesApiService.fetchProcesses();
    const descriptions = await Promise.all(
      summaries.map((summary) => this.processesApiService.fetchProcessDescription(summary.id))
    );

    const processes = descriptions
      .filter((description): description is ProcessSummary => !!description)
      .map((description) => ({
        id: description.id,
        title: this.readTitle(description),
        uiParams: this.processesApiService.extractKommonitorUiParams(description),
        description,
      }));

    this._processes.set(processes);
    return processes;
  }

  /** `title` is a plain string on this API, but OGC allows a language map. */
  private readTitle(process: ProcessSummary): string {
    if (typeof process.title === 'string') {
      return process.title;
    }
    return Object.values(process.title ?? {})[0] ?? process.id;
  }
}
