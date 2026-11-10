import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { MandantService } from 'services/mandant-service/mandant.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { AdminRoleManagementService } from '../admin-role-management.service';
import {
  Coverage,
  DatasetKind,
  Decisions,
  GroupPermissionIds,
  KEEP_DECISION,
  PermissionDataset,
  RIGHT_LEVELS,
  RightAction,
  RightLevel,
  RightsDraft,
  TriState,
  actionsFromDraft,
  buildPermissionsPatch,
  candidateGroups,
  changedDatasetCount,
  coupleAction,
  coverage,
  datasetKey,
  datasetsOfOwner,
  groupsWithoutResourcePermissions,
  initialDraft,
  publicReadLossCount,
  samePatch,
  summarize,
  triState,
} from './dataset-permissions.model';

/** What the group table's dropdown offers; `custom` only results from the per-dataset dialog. */
export type SelectableAction = Exclude<RightAction, 'custom'>;

/**
 * How a save ended. Only `saved` sent anything.
 * - `nothing`: no change was decided, or a save is already running.
 * - `unverified`: the stored rights could not be loaded before sending, so
 *   nothing was sent; `loadFailed()` is set.
 * - `changed`: the stored rights differ from those the review showed, so
 *   nothing was sent; the summary now shows what would be written instead.
 * - `failed`: the request failed; the backend stored nothing.
 * - `saved` with `reloaded: false`: the rights are stored, but the datasets
 *   could not be reloaded, so the current rights on screen are outdated.
 */
export type SaveResult =
  | { status: 'nothing' }
  | { status: 'unverified' }
  | { status: 'changed' }
  | { status: 'failed'; message: string }
  | { status: 'saved'; datasetCount: number; reloaded: boolean };

/**
 * The working state of the dataset-permissions wizard: which datasets of the
 * owner are selected, what is decided per group and right, and what follows
 * from that — coverage, summary and the PATCH body. The rules themselves live
 * in `dataset-permissions.model`; this service only holds the inputs and
 * derives from them.
 *
 * Provided by the wizard dialog, not in the root, so every opening starts
 * fresh. Holds no UI: what a save is worth telling the user is decided by the
 * dialog.
 *
 * The current rights are read from the metadata stores. Those are
 * signal-backed, so after a reload everything derived here follows by itself.
 * The PATCH replaces a group's whole list per dataset, so a list computed from
 * outdated rights would write them back: the stores are therefore reloaded when
 * a run starts, right before sending, and after a save.
 */
@Injectable()
export class DatasetPermissionsWizardStateService {
  private readonly accessControlService = inject(AccessControlService);
  private readonly mandantService = inject(MandantService);
  private readonly indicatorStore = inject(IndicatorMetadataStoreService);
  private readonly georesourceStore = inject(GeoresourceMetadataStoreService);
  private readonly spatialUnitStore = inject(SpatialUnitMetadataStoreService);
  private readonly adminRoleManagementService = inject(AdminRoleManagementService);
  private readonly metadataBootstrapService = inject(MetadataBootstrapService);

  private readonly _ownerId = signal<string | null>(null);
  readonly ownerId = this._ownerId.asReadonly();

  /**
   * The datasets taken out of the selection. Stored this way round because the
   * default is "all selected", and that should hold for datasets that only
   * arrive once the stores have loaded, too.
   */
  private readonly deselected = signal<ReadonlySet<string>>(new Set());

  private readonly _decisions = signal<Decisions>({});
  readonly decisions = this._decisions.asReadonly();

  private readonly _saving = signal(false);
  readonly saving = this._saving.asReadonly();

  private readonly _reloading = signal(false);
  readonly reloading = this._reloading.asReadonly();

  /** Set when the last reload failed: the current rights on screen may be outdated. */
  private readonly _loadFailed = signal(false);
  readonly loadFailed = this._loadFailed.asReadonly();

  /** The groups that can receive rights: the owner's tenant without the owner. */
  readonly groups = computed<GroupPermissionIds[]>(() => {
    const ownerId = this._ownerId();
    if (!ownerId) {
      return [];
    }
    return candidateGroups(this.accessControlService.accessControl, ownerId, (id) =>
      this.mandantService.mandantIdOfOwner(id)
    );
  });

  /**
   * True when the owner's tenant cannot be determined. The wizard then offers
   * no groups at all rather than every group of the instance.
   */
  readonly tenantUnknown = computed(() => {
    const ownerId = this._ownerId();
    return !!ownerId && !this.mandantService.mandantIdOfOwner(ownerId);
  });

  /** Units of the tenant left out of `groups`: they lack a resource viewer or editor permission. */
  readonly groupsLeftOut = computed<string[]>(() => {
    const ownerId = this._ownerId();
    if (!ownerId) {
      return [];
    }
    return groupsWithoutResourcePermissions(
      this.accessControlService.accessControl,
      ownerId,
      (id) => this.mandantService.mandantIdOfOwner(id)
    );
  });

  private readonly groupsById = computed(
    () => new Map(this.groups().map((group) => [group.organizationalUnitId, group]))
  );

  /** Every dataset of the owner, with its current rights. */
  readonly datasets = computed<PermissionDataset[]>(() => {
    const ownerId = this._ownerId();
    if (!ownerId) {
      return [];
    }
    return datasetsOfOwner(ownerId, {
      indicators: this.indicatorStore.availableIndicators,
      georesources: this.georesourceStore.availableGeoresources,
      spatialUnits: this.spatialUnitStore.availableSpatialUnits,
    });
  });

  readonly datasetsByKind = computed<Record<DatasetKind, PermissionDataset[]>>(() => {
    const byKind: Record<DatasetKind, PermissionDataset[]> = {
      indicator: [],
      georesource: [],
      spatialUnit: [],
    };
    for (const dataset of this.datasets()) {
      byKind[dataset.kind].push(dataset);
    }
    return byKind;
  });

  readonly selectedDatasets = computed<PermissionDataset[]>(() => {
    const deselected = this.deselected();
    return this.datasets().filter((dataset) => !deselected.has(datasetKey(dataset)));
  });

  readonly selectionCount = computed(() => ({
    selected: this.selectedDatasets().length,
    total: this.datasets().length,
  }));

  /** Coverage per group and level on the selected datasets. */
  private readonly coverages = computed(() => {
    const datasets = this.selectedDatasets();
    const decisions = this._decisions();
    return new Map(
      this.groups().map((group) => {
        const decision = decisions[group.organizationalUnitId];
        const byLevel = Object.fromEntries(
          RIGHT_LEVELS.map((level) => [level, coverage(group, datasets, decision, level)])
        ) as Record<RightLevel, Coverage>;
        return [group.organizationalUnitId, byLevel];
      })
    );
  });

  readonly summary = computed(() =>
    summarize(this.groups(), this.selectedDatasets(), this._decisions())
  );

  readonly patch = computed(() =>
    buildPermissionsPatch(this.groups(), this.selectedDatasets(), this._decisions())
  );

  /** On how many selected datasets anything changes. */
  readonly changedCount = computed(() =>
    changedDatasetCount(this.groups(), this.selectedDatasets(), this._decisions())
  );

  readonly hasChanges = computed(() => this.patch().length > 0);

  /** On how many selected datasets read access is taken away where anyone may read anyway. */
  readonly publicReadLosses = computed(() =>
    publicReadLossCount(this.groups(), this.selectedDatasets(), this._decisions())
  );

  /**
   * Starts a run for the owner: everything selected, nothing decided, and the
   * current rights reloaded — the stores may still hold those of the first
   * load. Resolves with whether the reload succeeded.
   */
  start(ownerId: string): Promise<boolean> {
    this._ownerId.set(ownerId);
    this.deselected.set(new Set());
    this._decisions.set({});
    return this.reload();
  }

  /**
   * Reloads the datasets with their stored rights. Selection and decisions
   * stay; they apply to the reloaded rights.
   */
  async reload(): Promise<boolean> {
    this._reloading.set(true);
    try {
      await this.metadataBootstrapService.reloadDatasetMetadata();
      this._loadFailed.set(false);
      return true;
    } catch {
      this._loadFailed.set(true);
      return false;
    } finally {
      this._reloading.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  isSelected(key: string): boolean {
    return !this.deselected().has(key);
  }

  setSelected(key: string, selected: boolean): void {
    this.setManySelected([key], selected);
  }

  setKindSelected(kind: DatasetKind, selected: boolean): void {
    this.setManySelected(this.datasetsByKind()[kind].map(datasetKey), selected);
  }

  selectionState(kind: DatasetKind): TriState {
    const datasets = this.datasetsByKind()[kind];
    const deselected = this.deselected();
    const selected = datasets.filter((d) => !deselected.has(datasetKey(d))).length;
    return triState(selected, datasets.length);
  }

  private setManySelected(keys: readonly string[], selected: boolean): void {
    this.deselected.update((current) => {
      const next = new Set(current);
      keys.forEach((key) => (selected ? next.delete(key) : next.add(key)));
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // Decisions
  // -------------------------------------------------------------------------

  /** The dropdown of a group's level; granting edit grants read, revoking read revokes edit. */
  setAction(groupId: string, level: RightLevel, action: SelectableAction): void {
    this._decisions.update((decisions) => ({
      ...decisions,
      [groupId]: coupleAction(decisions[groupId] ?? KEEP_DECISION, level, action),
    }));
  }

  coverageOf(groupId: string, level: RightLevel): Coverage | undefined {
    return this.coverages().get(groupId)?.[level];
  }

  /** The values the per-dataset dialog of a group opens with. */
  draftFor(groupId: string): RightsDraft {
    const group = this.groupsById().get(groupId);
    return group ? initialDraft(group, this.selectedDatasets(), this._decisions()[groupId]) : {};
  }

  /** Takes over what the per-dataset dialog hands back, turned into the dropdown values. */
  applyDraft(groupId: string, draft: RightsDraft): void {
    const group = this.groupsById().get(groupId);
    if (!group) {
      return;
    }
    const decision = actionsFromDraft(group, this.selectedDatasets(), draft);
    this._decisions.update((decisions) => ({ ...decisions, [groupId]: decision }));
  }

  /** "Further transfer": keeps the selection, forgets the decisions. */
  resetDecisions(): void {
    this._decisions.set({});
  }

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  /**
   * Sends the PATCH the user reviewed, then reloads the datasets so the
   * current rights on screen are the stored ones.
   *
   * Right before sending, the stored rights are reloaded and the PATCH is
   * computed again. If it differs from the reviewed one, someone changed the
   * rights in between, and nothing is sent: the reviewed lists would undo
   * that change. The decisions stay, so the user only has to check the
   * summary again.
   *
   * A failed request keeps the decisions as well; the backend writes all or
   * nothing, so there is no partial success to account for.
   */
  async save(): Promise<SaveResult> {
    const reviewed = this.patch();
    if (reviewed.length === 0 || this._saving()) {
      return { status: 'nothing' };
    }
    this._saving.set(true);
    try {
      if (!(await this.reload())) {
        return { status: 'unverified' };
      }
      const body = this.patch();
      if (!samePatch(reviewed, body)) {
        return { status: 'changed' };
      }
      const datasetCount = this.changedCount();
      try {
        await firstValueFrom(this.adminRoleManagementService.patchDatasetPermissions(body));
      } catch (error) {
        return { status: 'failed', message: errorMessage(error) };
      }
      this._decisions.set({});
      const reloaded = await this.reload();
      return { status: 'saved', datasetCount, reloaded };
    } finally {
      this._saving.set(false);
    }
  }
}

/** The backend's message where it sent one, else what the HTTP layer reports. */
function errorMessage(error: unknown): string {
  const response = error as { error?: { message?: unknown }; message?: unknown } | null;
  const message = response?.error?.message ?? response?.message;
  return typeof message === 'string' && message ? message : String(error);
}
