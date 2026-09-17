import { Injectable, computed, inject, signal } from '@angular/core';
import {
  KommonitorInputBox,
  ProcessInput,
  ProcessSchedule,
} from 'components/ngComponents/models/schedules.models';
import { CacheHelperServiceService } from 'services/cache-helper-service/cache-helper.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import {
  CatalogueProcess,
  ProcessCatalogStoreService,
} from 'services/process-catalog-store-service/process-catalog-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { ProcessesApiService } from 'services/processes-api-service/processes-api.service';
import {
  CronSelection,
  DEFAULT_CRON_SELECTION,
  buildCron,
  isValidCronPattern,
} from 'services/processes-api-service/cron-builder.util';
import {
  TargetTimeSelection,
  buildScheduleInputs,
  inputKeyForBoxContent,
} from 'services/processes-api-service/schedule-input-builder.util';

/** Which process families the type picker offers. */
export type ProcessFamilyFilter = 'all' | 'indicator' | 'georesource';

/** One box of the generated form, with its inputs already resolved. */
export interface ResolvedInputBox {
  box: KommonitorInputBox;
  /** `[inputKey, declaration]` for every content the process actually declares. */
  inputs: Array<[string, ProcessInput]>;
}

/**
 * The state of the schedule creation dialog.
 *
 * Kept in a service rather than in the modal component because four steps, the
 * generated input form and the submit path all read and write it; passing it
 * down through inputs and outputs produced most of the old dialog's plumbing.
 */
@Injectable({
  providedIn: 'root',
})
export class ScheduleDraftService {
  private processCatalogStore = inject(ProcessCatalogStoreService);
  private processesApiService = inject(ProcessesApiService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private cacheHelperService = inject(CacheHelperServiceService);

  // --- step 2: what is computed, for whom ---
  readonly familyFilter = signal<ProcessFamilyFilter>('all');
  readonly selectedProcess = signal<CatalogueProcess | undefined>(undefined);
  readonly targetIndicatorId = signal('');
  readonly targetSpatialUnitIds = signal<string[]>([]);

  // --- step 3: the process-specific inputs ---
  readonly processInputs = signal<Record<string, unknown>>({});

  // --- step 4: when it runs ---
  readonly targetTime = signal<TargetTimeSelection>({
    mode: 'MISSING',
    includeDates: [],
    excludeDates: [],
  });
  readonly cronSelection = signal<CronSelection>({ ...DEFAULT_CRON_SELECTION });
  readonly useManualCron = signal(false);
  readonly manualCron = signal('0 0 1 * *');

  /** Set while the process catalogue is still loading (C5). */
  readonly loadingProcesses = signal(false);

  /**
   * Feature properties of the chosen georesource, as a flat
   * `{ propertyName: typeName }` map — that is the shape the Data Management
   * API's `/schema` endpoint returns, not a JSON Schema. Needed by the property
   * and filter pickers, and only available through a separate request.
   */
  readonly georesourceSchema = signal<Record<string, string>>({});

  /**
   * The schedule that already computes the chosen target indicator, if any.
   * There is at most one per indicator, and creating a new one replaces it.
   */
  readonly existingSchedule = signal<ProcessSchedule | undefined>(undefined);

  /** The processes the type picker offers, after the family filter. */
  readonly availableProcesses = computed(() => {
    const filter = this.familyFilter();
    return this.processCatalogStore.processes().filter((process) => {
      if (filter === 'indicator') {
        return process.id.startsWith('KmIndicator');
      }
      if (filter === 'georesource') {
        return process.id.startsWith('KmGeoresource');
      }
      return true;
    });
  });

  /** The boxes of the generated form, in the order the server lists them. */
  readonly inputBoxes = computed<ResolvedInputBox[]>(() => {
    const process = this.selectedProcess();
    const declarations = process?.description.inputs ?? {};
    return (process?.uiParams?.inputBoxes ?? []).map((box) => ({
      box,
      inputs: (box.contents ?? [])
        .map((content) => inputKeyForBoxContent(content))
        .filter((key) => key in declarations)
        .map((key) => [key, declarations[key]] as [string, ProcessInput]),
    }));
  });

  /** The cron pattern that will be submitted. */
  readonly cron = computed(() =>
    this.useManualCron() ? this.manualCron() : buildCron(this.cronSelection())
  );

  /**
   * The dates all selected input indicators have in common — only those can be
   * computed. Georesource-based processes have no such restriction from
   * indicators, so their periods of validity are used instead.
   */
  readonly applicableDates = computed(() => {
    const indicatorIds = this.selectedInputIndicatorIds();
    if (indicatorIds.length > 0) {
      return this.intersectDates(
        indicatorIds.map(
          (id) => this.indicatorStore.getIndicatorMetadataById(id)?.applicableDates ?? []
        )
      );
    }

    const georesourceId = this.processInputs()['georesource_id'] as string | undefined;
    if (georesourceId) {
      const georesource = this.georesourceStore.getGeoresourceMetadataById(georesourceId);
      return (georesource?.availablePeriodsOfValidity ?? [])
        .map((period) => period.startDate as string | undefined)
        .filter((date): date is string => !!date)
        .sort();
    }

    return [];
  });

  readonly isComplete = computed(
    () =>
      !!this.selectedProcess() &&
      !!this.targetIndicatorId() &&
      this.targetSpatialUnitIds().length > 0 &&
      this.requiredInputsFilled() &&
      isValidCronPattern(this.cron())
  );

  /** Loads the catalogue if it is not in memory yet. */
  async ensureProcessesLoaded(): Promise<void> {
    this.loadingProcesses.set(true);
    try {
      await this.processCatalogStore.loadCatalogue();
    } finally {
      this.loadingProcesses.set(false);
    }
  }

  /**
   * Switching the process type discards the inputs of the previous one: they
   * belong to a different set of declarations, and keeping them would submit
   * fields the new process does not know.
   */
  selectProcess(process: CatalogueProcess | undefined): void {
    this.selectedProcess.set(process);
    this.processInputs.set(this.defaultsFor(process));
  }

  setInput(inputKey: string, value: unknown): void {
    this.processInputs.update((inputs) => ({ ...inputs, [inputKey]: value }));
    if (inputKey === 'georesource_id') {
      void this.loadGeoresourceSchema(value as string);
    }
  }

  /**
   * Loads the feature schema of a georesource. A failure leaves the property
   * pickers empty rather than breaking the step — the filter is optional.
   */
  private async loadGeoresourceSchema(georesourceId: string | undefined): Promise<void> {
    // The filter belongs to the georesource it was built for.
    this.processInputs.update((inputs) => ({ ...inputs, comp_filter: undefined }));
    this.georesourceSchema.set({});
    if (!georesourceId) {
      return;
    }
    try {
      const schema = await this.cacheHelperService.fetchSingleGeoresourceSchema(georesourceId);
      this.georesourceSchema.set((schema ?? {}) as Record<string, string>);
    } catch (error) {
      console.error('Could not fetch the schema of georesource ' + georesourceId + ':', error);
    }
  }

  getInput(inputKey: string): unknown {
    return this.processInputs()[inputKey];
  }

  /** Looks up whether the chosen target indicator already has a schedule (C8). */
  async refreshExistingSchedule(): Promise<void> {
    const indicatorId = this.targetIndicatorId();
    if (!indicatorId) {
      this.existingSchedule.set(undefined);
      return;
    }
    const schedules = await this.processesApiService.fetchSchedules();
    this.processScriptStore.setProcessScripts(schedules);
    this.existingSchedule.set(
      schedules.find((schedule) => schedule.inputs?.target_indicator_id === indicatorId)
    );
  }

  /**
   * Creates the schedule, replacing the target indicator's previous one.
   *
   * The delete comes first on purpose: the API keeps at most one schedule per
   * target indicator, and master deletes before posting for the same reason.
   * Returns the new schedule's id, which the API calls `scheduling_id`.
   */
  async submit(): Promise<string> {
    const process = this.selectedProcess();
    if (!process) {
      throw new Error('no process selected');
    }

    const existing = this.existingSchedule();
    if (existing) {
      await this.processesApiService.deleteSchedule(existing.scheduleID);
    }

    const inputs = buildScheduleInputs({
      targetIndicatorId: this.targetIndicatorId(),
      targetSpatialUnitIds: this.targetSpatialUnitIds(),
      targetTime: this.targetTime(),
      cron: this.cron(),
      processInputs: this.processInputs(),
    });

    // Created with the PascalCase id, although schedules report the apiName.
    return await this.processesApiService.createSchedule(process.id, inputs);
  }

  reset(): void {
    this.familyFilter.set('all');
    this.selectedProcess.set(undefined);
    this.targetIndicatorId.set('');
    this.targetSpatialUnitIds.set([]);
    this.processInputs.set({});
    this.targetTime.set({ mode: 'MISSING', includeDates: [], excludeDates: [] });
    this.cronSelection.set({ ...DEFAULT_CRON_SELECTION });
    this.useManualCron.set(false);
    this.manualCron.set('0 0 1 * *');
    this.existingSchedule.set(undefined);
  }

  /** Every declared input that carries a default starts out with it. */
  private defaultsFor(process: CatalogueProcess | undefined): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};
    for (const [key, declaration] of Object.entries(process?.description.inputs ?? {})) {
      const fallback = declaration.schema?.default;
      if (fallback === undefined) {
        continue;
      }
      // Enum defaults arrive as the full option object; only the apiName is
      // submitted, so that is what the field holds.
      if (declaration.schema?.enum && typeof fallback === 'object' && fallback !== null) {
        inputs[key] = (fallback as { apiName?: string }).apiName;
      } else {
        inputs[key] = fallback;
      }
    }
    return inputs;
  }

  /** Indicator ids referenced by the currently filled process inputs. */
  private selectedInputIndicatorIds(): string[] {
    const inputs = this.processInputs();
    const ids: string[] = [];

    for (const key of [
      'computation_id',
      'computation_id_numerator',
      'computation_id_denominator',
      'reference_id',
    ]) {
      const value = inputs[key];
      if (typeof value === 'string' && value) {
        ids.push(value);
      }
    }

    const list = inputs['computation_ids'];
    if (Array.isArray(list)) {
      ids.push(...list.filter((id): id is string => typeof id === 'string'));
    }

    const withPolarity = inputs['computation_ids_with_polarity'];
    if (Array.isArray(withPolarity)) {
      for (const entry of withPolarity) {
        const id = (entry as { value?: { ID?: string } })?.value?.ID;
        if (id) {
          ids.push(id);
        }
      }
    }

    return Array.from(new Set(ids));
  }

  private intersectDates(lists: string[][]): string[] {
    if (lists.length === 0) {
      return [];
    }
    return lists
      .reduce((common, list) => common.filter((date) => list.includes(date)))
      .slice()
      .sort();
  }

  /** Every input the process marks required has to carry a value. */
  private requiredInputsFilled(): boolean {
    const declarations = this.selectedProcess()?.description.inputs ?? {};
    const inputs = this.processInputs();

    return Object.entries(declarations)
      .filter(
        ([key]) =>
          ![
            'target_indicator_id',
            'target_spatial_units',
            'target_time',
            'execution_interval',
          ].includes(key)
      )
      .filter(([, declaration]) => (declaration.schema?.required ?? []).length > 0)
      .every(([key]) => {
        const value = inputs[key];
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== undefined && value !== null && value !== '';
      });
  }
}
