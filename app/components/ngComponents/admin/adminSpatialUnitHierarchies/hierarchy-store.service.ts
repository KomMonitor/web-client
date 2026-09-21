import { Injectable, computed, inject, signal } from '@angular/core';
import { MandantService } from 'services/mandant-service/mandant.service';
import { SpatialUnitHierarchyApiService } from 'services/spatial-unit-hierarchy-service/spatial-unit-hierarchy-api.service';
import { SpatialUnitMetadataStoreService } from 'services/spatial-unit-metadata-store-service/spatial-unit-metadata-store.service';

import { TreeGap } from '../../common/tree-view/tree-view.model';
import {
  HierarchyChainEntry,
  HierarchyLevel,
  RegisteredLevel,
  SpatialUnitHierarchy,
  appendToChain,
  createHierarchy,
  insertIntoChain,
  moveInChain,
  newId,
  removeFromChain,
} from './hierarchy.model';
import * as select from './hierarchy-selectors';

/** The metadata of a hierarchy, as the dialog hands it back. */
export interface HierarchyMetadata {
  readonly name: string;
  readonly mandant: string;
  readonly isPublic: boolean;
}

/**
 * The state of the hierarchy page: the hierarchies, the spatial unit levels and
 * the tenant on screen — plus every change to them.
 *
 * Provided by the page, not in the root: this is one page's working state, so a
 * fresh one per visit is what is wanted, and tests cannot leak it into each
 * other.
 *
 * Holds no UI: what a change is worth telling the user is decided by the page,
 * which owns the dialogs and the notifications.
 *
 * **Reading is wired to the Data Management API; writing is not yet.** The
 * hierarchies are loaded through `SpatialUnitHierarchyApiService` and the level
 * registry is derived from the spatial unit metadata store, but the edits below
 * still only change the loaded state — persisting them is the next step.
 */
@Injectable()
export class HierarchyStoreService {
  private readonly mandantService = inject(MandantService);
  private readonly hierarchyApi = inject(SpatialUnitHierarchyApiService);
  private readonly spatialUnitStore = inject(SpatialUnitMetadataStoreService);

  readonly hierarchies = signal<readonly SpatialUnitHierarchy[]>([]);

  /** True while the first load is in flight, so the page can say so. */
  readonly loading = signal(true);

  /**
   * Every spatial unit level this instance knows, whether or not a hierarchy
   * uses it — the flat view of the spatial unit metadata store.
   *
   * Derived, not held: spatial unit levels are created and deleted on the
   * spatial units page, and a second copy here would go stale the moment they
   * are.
   */
  readonly levelRegistry = computed<readonly RegisteredLevel[]>(() =>
    this.spatialUnitStore.availableSpatialUnits.map((unit) => ({
      id: unit.spatialUnitId,
      name: unit.spatialUnitLevel,
      datasource: unit.metadata?.datasource ?? '',
      mandant: this.mandantService.mandantNameOf(unit.mandantId ?? '') || (unit.mandantId ?? ''),
    }))
  );

  /**
   * The tenant whose hierarchies are on screen; the empty string is the
   * overview across all of them. Starts at the tenant the user belongs to, so
   * everyone lands in their own data — and without Keycloak in the overview.
   *
   * Written through `selectMandant`, which also unfolds what it switches to.
   */
  readonly selectedMandant = signal(this.mandantService.ownMandant);

  constructor() {
    void this.reload();
  }

  /**
   * Fetches the hierarchies and replaces what the page holds. The tenant on
   * screen is unfolded afterwards, not in the constructor: the hierarchies it
   * would unfold do not exist yet at that point.
   */
  async reload(): Promise<void> {
    this.loading.set(true);
    const overviews = await this.hierarchyApi.getHierarchies();
    this.hierarchies.set(
      overviews.map((overview) =>
        createHierarchy(
          overview,
          this.mandantService.mandantNameOf(overview.mandantId) || overview.mandantId
        )
      )
    );
    this.expandMandant(this.selectedMandant());
    this.loading.set(false);
  }

  /**
   * The levels the create dialog may build a chain from, across all tenants:
   * the dialog lets the user switch the tenant while it is open, so a list
   * filtered by the tenant on screen would go stale the moment they do.
   */
  readonly registeredLevels = computed(() => this.levelRegistry());

  /**
   * The levels the tenant on screen may build chains from. Where no tenant is
   * chosen — an instance without Keycloak — the whole registry is on offer, the
   * same way the list then shows every hierarchy.
   */
  readonly tenantLevels = computed(() =>
    select.levelsOfMandant(this.levelRegistry(), this.selectedMandant())
  );

  /**
   * The tenants of this instance with what each of them holds — the rows of the
   * overview table, and at the same time the entries the switcher lists.
   *
   * Keycloak names the tenants; one that only appears in the hierarchies is
   * listed as well, so the page shows whom its data belongs to even without it.
   */
  readonly mandantOverview = computed(() =>
    select.mandantOverviewRows(this.hierarchies(), this.mandantService.keycloakMandants)
  );

  /** The tenant names, for the dialog to offer where Keycloak names none. */
  readonly mandantNames = computed(() => this.mandantOverview().map((row) => row.name));

  /**
   * Whether a hierarchy can be created at all. The API requires a `mandantId`,
   * and without Keycloak this instance knows no tenants and cannot obtain one —
   * `/organizationalUnits` needs a token itself. The page then shows the
   * hierarchies it can read and says why creating is unavailable.
   *
   * Deliberately *not* modelled on the spatial unit add modal, which hides its
   * owner field and submits anyway: `ownerId` is optional there, `mandantId` is
   * required here, so an enabled button would only ever produce a 400.
   */
  readonly canCreate = computed(() => this.mandantService.mandantRefs.length > 0);

  /**
   * Switching tenants is a platform administrator's view. Without Keycloak
   * nobody holds that role, so more than one tenant in the data opens the
   * switcher as well.
   */
  readonly canSwitchMandant = computed(
    () => this.mandantService.isRealmAdmin || this.mandantOverview().length > 1
  );

  /**
   * The levels of the tenant on screen that no hierarchy uses. They are what the
   * section below the list shows — they exist, but are nowhere to be chosen in
   * the map interface, because only a hierarchy puts a level there.
   *
   * Derived, never stored: a level becomes assigned by appearing in a chain and
   * unassigned again by leaving the last one.
   */
  readonly unassignedLevels = computed(() =>
    select.unassignedLevels(this.levelRegistry(), this.hierarchies(), this.selectedMandant())
  );

  /** What the list renders: one tenant's hierarchies, or all of them. */
  readonly visibleHierarchies = computed(() =>
    select.hierarchiesOfMandant(this.hierarchies(), this.selectedMandant())
  );

  /**
   * Whether the tenant overview takes the place of the hierarchy list. Across
   * all tenants the list would mix data of instances that share nothing, so it
   * gives way to one row per tenant. Where the data knows no tenant at all
   * there is nothing to summarize and the list stays.
   */
  readonly showMandantOverview = computed(
    () => !this.selectedMandant() && this.mandantOverview().length > 0
  );

  /** The hierarchy names, for the dialog to check a new one against. */
  hierarchyNames(): string[] {
    return select.hierarchyNames(this.hierarchies());
  }

  /** How many hierarchies each level is part of, by id, for the create dialog. */
  levelUsage(): Record<string, number> {
    return select.levelUsage(this.hierarchies());
  }

  /**
   * Creates a hierarchy from the metadata and the level chain the dialog
   * assembled. It is appended to the list, opened and fully expanded, and the
   * page follows it to its tenant so it stays in view.
   */
  addHierarchy(
    metadata: HierarchyMetadata,
    levels: readonly HierarchyChainEntry[]
  ): SpatialUnitHierarchy {
    const mandantId = this.mandantService.mandantIdOf(metadata.mandant);
    const hierarchy = createHierarchy(
      {
        // Local until the create call answers with the real one.
        hierarchyId: newId(),
        name: metadata.name,
        mandantId,
        isPublic: metadata.isPublic,
        members: levels.map((level, index) => ({
          spatialUnitId: level.id,
          spatialUnitLevel: level.name,
          hierarchyLevel: index,
        })),
      },
      metadata.mandant
    );
    hierarchy.open.set(true);
    this.hierarchies.update((entries) => [...entries, hierarchy]);
    this.followMandant(metadata.mandant);
    return hierarchy;
  }

  /** Writes the edited metadata. The chain and its expansion state stay untouched. */
  updateHierarchyMetadata(hierarchy: SpatialUnitHierarchy, metadata: HierarchyMetadata): void {
    hierarchy.name.set(metadata.name);
    hierarchy.mandant.set(metadata.mandant);
    hierarchy.mandantId.set(this.mandantService.mandantIdOf(metadata.mandant));
    hierarchy.isPublic.set(metadata.isPublic);
    this.followMandant(metadata.mandant);
  }

  /** Drops a hierarchy. The levels it used stay where they are. */
  deleteHierarchy(hierarchy: SpatialUnitHierarchy): void {
    this.hierarchies.update((entries) => entries.filter((entry) => entry !== hierarchy));
  }

  /** Moves a level one step along the chain, towards the coarse or the fine end. */
  moveLevel(hierarchy: SpatialUnitHierarchy, level: HierarchyLevel, offset: number): void {
    moveInChain(hierarchy, level, offset);
  }

  /**
   * Takes a level out of the chain, if it is not the last one left. The return
   * value reports which of the two happened, so the page only announces what
   * actually did.
   */
  removeLevel(hierarchy: SpatialUnitHierarchy, level: HierarchyLevel): boolean {
    return removeFromChain(hierarchy, level);
  }

  /** Puts a level into the chain at the gap of the tree it was chosen at. */
  insertLevel(
    hierarchy: SpatialUnitHierarchy,
    gap: TreeGap<HierarchyLevel>,
    level: HierarchyChainEntry
  ): void {
    insertIntoChain(hierarchy, gap, level);
  }

  /**
   * Assigns a level to a hierarchy: it becomes the finest level of that chain.
   * The level itself does not change — a level is not owned by a hierarchy, it
   * is only used by one, and it may be used by several.
   */
  assignLevel(level: RegisteredLevel, hierarchy: SpatialUnitHierarchy): void {
    appendToChain(hierarchy, { id: level.id, name: level.name });
    hierarchy.open.set(true);
  }

  /**
   * Switches to a tenant, or to the overview across all of them for the empty
   * string. A tenant's view opens with all of its hierarchies unfolded: it is
   * the view the work happens in, and a chain that is folded away says nothing.
   * What the user folds afterwards stays folded until they leave and come back.
   */
  selectMandant(mandant: string): void {
    this.selectedMandant.set(mandant);
    this.expandMandant(mandant);
  }

  private expandMandant(mandant: string): void {
    if (!mandant) {
      return;
    }
    for (const hierarchy of this.hierarchies()) {
      if (hierarchy.mandant() === mandant) {
        hierarchy.open.set(true);
      }
    }
  }

  /**
   * Follows a hierarchy to the tenant the dialog gave it, so it stays in view —
   * from the overview table as well, which shows tenants rather than the
   * hierarchy that was just created or edited.
   */
  private followMandant(mandant: string): void {
    if (mandant) {
      this.selectMandant(mandant);
    }
  }
}
