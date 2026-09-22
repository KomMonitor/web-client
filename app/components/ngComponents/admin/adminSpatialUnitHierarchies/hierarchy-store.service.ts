import { Injectable, computed, inject, signal } from '@angular/core';
import { SpatialUnitOverviewType } from 'models/data-management-api';
import { MandantService } from 'services/mandant-service/mandant.service';
import {
  SpatialUnitHierarchyApiService,
  toOrderedMembers,
} from 'services/spatial-unit-hierarchy-service/spatial-unit-hierarchy-api.service';
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
  removeFromChain,
} from './hierarchy.model';
import * as select from './hierarchy-selectors';

/**
 * How a chain edit ended.
 *
 * `rejected` is not a failure: the chain rules turned the edit down before
 * anything was sent — the last level cannot be removed, a level cannot sit in
 * one chain twice, and a move past either end goes nowhere. Nothing was
 * written, so there is nothing to announce either.
 */
export type ChainEditResult = 'saved' | 'rejected' | 'failed';

/** The metadata of a new hierarchy, as the create dialog hands it back. */
export interface HierarchyMetadata {
  readonly name: string;
  readonly mandant: string;
  readonly isPublic: boolean;
}

/**
 * What an edit may change. The tenant is missing on purpose: the API refuses to
 * move a hierarchy, so the write sends the one the hierarchy already carries.
 */
export type HierarchyMetadataEdit = Omit<HierarchyMetadata, 'mandant'>;

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
 * **Every change is written straight away.** The two kinds of edit differ in
 * how they get there, and deliberately so:
 *
 * - The **chain** edits — move, insert, remove, assign — are applied first and
 *   sent afterwards, then rolled back if the API refuses. They come one rapid
 *   click after another, so waiting for a round trip before the tree moves
 *   would make the page feel broken.
 * - The **dialog** actions — create, edit metadata, delete — wait for the API
 *   and only then change the list. The user is coming out of a modal anyway, so
 *   a moment's wait costs nothing, and a list that shows a hierarchy which was
 *   never created is worse than a slow one.
 */
@Injectable()
export class HierarchyStoreService {
  private readonly mandantService = inject(MandantService);

  /**
   * Resolves a `mandantId` to the tenant name the page groups by. Handed to
   * every hierarchy so it can derive its own name on each read: the access
   * control metadata arrives during startup, and a page built before it would
   * otherwise keep the raw id long after the real name is available.
   */
  private readonly resolveMandantName = (mandantId: string): string =>
    this.mandantService.mandantNameOf(mandantId);
  private readonly hierarchyApi = inject(SpatialUnitHierarchyApiService);
  private readonly spatialUnitStore = inject(SpatialUnitMetadataStoreService);

  readonly hierarchies = signal<readonly SpatialUnitHierarchy[]>([]);

  /**
   * The number of the newest member write per hierarchy. Answers that arrive
   * after a later edit has started are ignored, so a slow one cannot undo what
   * came after it.
   */
  private readonly chainGeneration = new Map<string, number>();

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
      // Defensively: the generated type declares `userPermissions` required,
      // but the metadata store defaults it away with `|| []` and older answers
      // leave it out.
      canDelete: (unit.userPermissions ?? []).includes('creator'),
    }))
  );

  /**
   * The spatial unit behind a registry entry — what the delete dialog wants.
   *
   * A method, not a computed: the metadata store keeps its id map as a plain
   * `Map`, so this reads nothing reactive and belongs in a click handler.
   */
  spatialUnitOf(levelId: string): SpatialUnitOverviewType | undefined {
    return this.spatialUnitStore.getSpatialUnitMetadataById(levelId);
  }

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
      overviews.map((overview) => createHierarchy(overview, this.resolveMandantName))
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

  /**
   * How many hierarchies each level is part of, by id — the create dialog marks
   * the levels already in use with it, the page badges them.
   *
   * A computed, not a method: every rendered row asks for it, and rebuilding
   * the map per row and change detection run would count the whole tree over
   * and over.
   */
  readonly levelUsage = computed(() => select.levelUsage(this.hierarchies()));

  /**
   * Creates a hierarchy from the metadata and the level chain the dialog
   * assembled, and appends what the API answers with — the response carries
   * the real `hierarchyId`, so nothing has to be reconciled afterwards.
   *
   * The new hierarchy is opened and the page follows it to its tenant, so it
   * stays in view. Answers null when the API refused; nothing was added then.
   */
  async addHierarchy(
    metadata: HierarchyMetadata,
    levels: readonly HierarchyChainEntry[]
  ): Promise<SpatialUnitHierarchy | null> {
    const mandantId = this.mandantService.mandantIdOf(metadata.mandant);
    try {
      const created = await this.hierarchyApi.createHierarchy({
        name: metadata.name,
        mandantId,
        isPublic: metadata.isPublic,
        // Without levels the field stays out of the body rather than going as
        // an empty array: `members` is optional on the POST, and a hierarchy
        // may start empty and be filled on the page afterwards.
        ...(levels.length > 0
          ? { members: toOrderedMembers(levels.map((level) => level.id)) }
          : {}),
      });
      const hierarchy = createHierarchy(created, this.resolveMandantName);
      hierarchy.open.set(true);
      this.hierarchies.update((entries) => [...entries, hierarchy]);
      this.followMandant(metadata.mandant);
      return hierarchy;
    } catch {
      // A rejected POST does not mean nothing was written: the API creates the
      // hierarchy first and validates its members afterwards, so a refused
      // member leaves an empty one behind. Reloading puts it on screen, where
      // it can be deleted, instead of leaving it there unseen.
      //
      // Deliberately not awaited: the caller announces the failure as soon as
      // this returns, and that message must not wait on a second request that
      // may be just as slow to fail.
      void this.reload();
      return null;
    }
  }

  /**
   * Writes the edited metadata. The chain and its expansion state stay
   * untouched — the members endpoint is the only thing that moves those.
   *
   * `mandantId` and `isPublic` always travel with the name: the endpoint is a
   * full replace, and a missing `isPublic` would quietly make the hierarchy
   * private.
   *
   * The tenant is taken off the hierarchy, not off `metadata` — the API refuses
   * to move a hierarchy to another one ("The mandant of a spatial unit
   * hierarchy cannot be changed"), so the dialog does not offer the choice, and
   * sending the id the hierarchy already carries also holds where Keycloak
   * names no tenant for it and its display name is the raw id.
   */
  async updateHierarchyMetadata(
    hierarchy: SpatialUnitHierarchy,
    metadata: HierarchyMetadataEdit
  ): Promise<boolean> {
    const mandantId = hierarchy.mandantId();
    hierarchy.saving.set(true);
    try {
      await this.hierarchyApi.updateHierarchy(hierarchy.id, {
        name: metadata.name,
        mandantId,
        isPublic: metadata.isPublic,
      });
    } catch {
      return false;
    } finally {
      hierarchy.saving.set(false);
    }

    hierarchy.name.set(metadata.name);
    hierarchy.isPublic.set(metadata.isPublic);
    this.followMandant(hierarchy.mandant());
    return true;
  }

  /** Drops a hierarchy. The levels it used stay where they are. */
  async deleteHierarchy(hierarchy: SpatialUnitHierarchy): Promise<boolean> {
    hierarchy.saving.set(true);
    try {
      await this.hierarchyApi.deleteHierarchy(hierarchy.id);
    } catch {
      return false;
    } finally {
      hierarchy.saving.set(false);
    }

    this.hierarchies.update((entries) => entries.filter((entry) => entry !== hierarchy));
    return true;
  }

  /** Moves a level one step along the chain, towards the coarse or the fine end. */
  moveLevel(
    hierarchy: SpatialUnitHierarchy,
    level: HierarchyLevel,
    offset: number
  ): Promise<ChainEditResult> {
    return this.editChain(hierarchy, () => moveInChain(hierarchy, level, offset));
  }

  /**
   * Takes a level out of the chain, if it is not the last one left. `rejected`
   * says it was the last one, so the page announces nothing.
   */
  removeLevel(hierarchy: SpatialUnitHierarchy, level: HierarchyLevel): Promise<ChainEditResult> {
    return this.editChain(hierarchy, () => removeFromChain(hierarchy, level));
  }

  /** Puts a level into the chain at the gap of the tree it was chosen at. */
  insertLevel(
    hierarchy: SpatialUnitHierarchy,
    gap: TreeGap<HierarchyLevel>,
    level: HierarchyChainEntry
  ): Promise<ChainEditResult> {
    return this.editChain(hierarchy, () => {
      const before = hierarchy.chain().length;
      insertIntoChain(hierarchy, gap, level);
      return hierarchy.chain().length > before;
    });
  }

  /**
   * Assigns a level to a hierarchy: it becomes the finest level of that chain.
   * The level itself does not change — a level is not owned by a hierarchy, it
   * is only used by one, and it may be used by several.
   */
  assignLevel(level: RegisteredLevel, hierarchy: SpatialUnitHierarchy): Promise<ChainEditResult> {
    return this.editChain(hierarchy, () => {
      const before = hierarchy.chain().length;
      appendToChain(hierarchy, { id: level.id, name: level.name });
      if (hierarchy.chain().length === before) {
        return false;
      }
      hierarchy.open.set(true);
      return true;
    });
  }

  /**
   * The one path every chain edit takes: apply it, send the whole member list,
   * and put the chain back if the API refuses.
   *
   * The snapshot covers the expansion state as well. `insertIntoChain` marks a
   * new level expanded and `removeFromChain` drops its entry, so restoring only
   * the chain would leave that set describing an edit that never happened.
   *
   * `apply` answers whether it changed anything. A `false` means the chain
   * rules turned the edit down, and nothing is sent.
   */
  private async editChain(
    hierarchy: SpatialUnitHierarchy,
    apply: () => boolean
  ): Promise<ChainEditResult> {
    const chainBefore = hierarchy.chain();
    const expandedBefore = hierarchy.expandedIds();

    if (!apply()) {
      return 'rejected';
    }

    const generation = (this.chainGeneration.get(hierarchy.id) ?? 0) + 1;
    this.chainGeneration.set(hierarchy.id, generation);
    hierarchy.saving.set(true);

    try {
      await this.hierarchyApi.updateMembers(
        hierarchy.id,
        toOrderedMembers(hierarchy.chain().map((entry) => entry.id))
      );
      return 'saved';
    } catch {
      // Only the newest request may act on its outcome. A slower earlier one
      // would otherwise roll the chain back past edits made since.
      if (this.chainGeneration.get(hierarchy.id) === generation) {
        hierarchy.chain.set(chainBefore);
        hierarchy.expandedIds.set(expandedBefore);
      }
      return 'failed';
    } finally {
      if (this.chainGeneration.get(hierarchy.id) === generation) {
        hierarchy.saving.set(false);
      }
    }
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
