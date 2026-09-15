import { Injectable, computed, inject, signal } from '@angular/core';
import { MandantService } from 'services/mandant-service/mandant.service';

import {
  createDemoHierarchies,
  createHierarchy,
  createLevelRegistry,
  newHierarchyId,
  newLevelId,
} from './hierarchy-demo.data';
import {
  DemoHierarchy,
  DemoLevel,
  RegisteredLevel,
  appendToChain,
  canMoveInChain,
  moveInChain,
  removeFromChain,
} from './hierarchy-demo.model';
import * as select from './hierarchy-selectors';

/** The metadata of a hierarchy, as the dialog hands it back. */
export interface HierarchyMetadata {
  readonly name: string;
  readonly description: string;
  readonly mandant: string;
}

/** A level as it is registered, before the registry gives it an id. */
export interface LevelRegistration {
  readonly name: string;
  readonly datasource: string;
}

/**
 * The state of the hierarchy page: the hierarchies, the level registry and the
 * tenant on screen — plus every change to them.
 *
 * Provided by the page, not in the root: this is one page's working state, so a
 * fresh one per visit is what is wanted, and tests cannot leak it into each
 * other.
 *
 * Holds no UI: what a change is worth telling the user is decided by the page,
 * which owns the dialogs and the notifications.
 *
 * The data is still the demo content of the design draft — nothing is persisted,
 * the Data Management API has no hierarchy endpoints yet. When it gets them,
 * this service is where they arrive; the page above it does not change.
 */
@Injectable()
export class HierarchyStoreService {
  private readonly mandantService = inject(MandantService);

  readonly hierarchies = signal<readonly DemoHierarchy[]>(createDemoHierarchies());

  /**
   * Every spatial unit level this instance knows, whether or not a hierarchy
   * uses it. The store owns it because levels are registered and deleted here.
   */
  readonly levelRegistry = signal<readonly RegisteredLevel[]>(createLevelRegistry());

  /**
   * The tenant whose hierarchies are on screen; the empty string is the
   * overview across all of them. Starts at the tenant the user belongs to, so
   * everyone lands in their own data — and without Keycloak in the overview.
   *
   * Written through `selectMandant`, which also unfolds what it switches to.
   */
  readonly selectedMandant = signal(this.mandantService.ownMandant);

  constructor() {
    // The tenant a user starts in is a view they enter as well.
    this.expandMandant(this.selectedMandant());
  }

  /**
   * The names of all registered levels, for the create dialog to build a chain
   * from. Across all tenants on purpose: the dialog lets the user switch the
   * tenant while it is open, so a list filtered by the tenant on screen would
   * go stale the moment they do.
   */
  readonly registeredLevelNames = computed(() => this.levelRegistry().map((level) => level.name));

  /**
   * The level names the tenant on screen may build chains from. Where no tenant
   * is chosen — an instance without Keycloak — the whole registry is on offer,
   * the same way the list then shows every hierarchy.
   */
  readonly tenantLevelNames = computed(() =>
    select.levelsOfMandant(this.levelRegistry(), this.selectedMandant()).map((level) => level.name)
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
   * Switching tenants is a platform administrator's view. Without Keycloak
   * nobody holds that role, so more than one tenant in the data opens the
   * switcher as well — otherwise the draft could not be tried out at all.
   */
  readonly canSwitchMandant = computed(
    () => this.mandantService.isRealmAdmin || this.mandantOverview().length > 1
  );

  /**
   * The registered levels of the tenant on screen that no hierarchy uses. They
   * are what the section below the list shows — registered, but nowhere to be
   * chosen in the map interface, because only a hierarchy puts a level there.
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

  /** How many hierarchies each level is part of, for the create dialog to mark. */
  levelUsage(): Record<string, number> {
    return select.levelUsage(this.hierarchies());
  }

  /**
   * Creates a hierarchy from the metadata and the level chain the dialog
   * assembled. It is appended to the list, opened and fully expanded, and the
   * page follows it to its tenant so it stays in view.
   */
  addHierarchy(metadata: HierarchyMetadata, levels: readonly string[]): DemoHierarchy {
    const hierarchy = createHierarchy({
      id: newHierarchyId(),
      name: metadata.name,
      description: metadata.description,
      mandant: metadata.mandant,
      levels,
      open: true,
    });
    this.hierarchies.update((entries) => [...entries, hierarchy]);
    this.followMandant(metadata.mandant);
    return hierarchy;
  }

  /** Writes the edited metadata. The chain and its expansion state stay untouched. */
  updateHierarchyMetadata(hierarchy: DemoHierarchy, metadata: HierarchyMetadata): void {
    hierarchy.name.set(metadata.name);
    hierarchy.description.set(metadata.description);
    hierarchy.mandant.set(metadata.mandant);
    this.followMandant(metadata.mandant);
  }

  /** Drops a hierarchy. The levels it used stay in the registry. */
  deleteHierarchy(hierarchy: DemoHierarchy): void {
    this.hierarchies.update((entries) => entries.filter((entry) => entry !== hierarchy));
  }

  /** Whether the ▲/▼ button of that level is offered. */
  canMove(hierarchy: DemoHierarchy, level: DemoLevel, offset: number): boolean {
    return canMoveInChain(hierarchy, level, offset);
  }

  /** Moves a level one step along the chain, towards the coarse or the fine end. */
  moveLevel(hierarchy: DemoHierarchy, level: DemoLevel, offset: number): void {
    moveInChain(hierarchy, level, offset);
  }

  /**
   * Takes a level out of the chain, if it is not the last one left. The return
   * value reports which of the two happened, so the page only announces what
   * actually did.
   */
  removeLevel(hierarchy: DemoHierarchy, level: DemoLevel): boolean {
    return removeFromChain(hierarchy, level);
  }

  /**
   * Assigns a level to a hierarchy: it becomes the finest level of that chain.
   * The registry does not change — a level is not owned by a hierarchy, it is
   * only used by one, and it may be used by several.
   */
  assignLevel(level: RegisteredLevel, hierarchy: DemoHierarchy): void {
    appendToChain(hierarchy, level.name);
    hierarchy.open.set(true);
  }

  /**
   * Takes a level the user registered into the registry. The tenant comes from
   * where it was registered — inside a hierarchy that is the hierarchy's own,
   * which in the tenant-less fallback view need not be the one on screen.
   */
  registerLevel(registration: LevelRegistration, mandant: string): void {
    this.levelRegistry.update((levels) => [
      ...levels,
      { id: newLevelId(), name: registration.name, datasource: registration.datasource, mandant },
    ]);
  }

  /** Drops a level from the registry. Only ever asked for an unassigned one. */
  deleteLevel(level: RegisteredLevel): void {
    this.levelRegistry.update((levels) => levels.filter((entry) => entry !== level));
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
