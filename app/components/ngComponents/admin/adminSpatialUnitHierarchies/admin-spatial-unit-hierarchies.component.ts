import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { MODAL_CONFIRM, MODAL_FORM } from 'util/modal-presets';

import { CollapsibleSectionComponent } from '../../common/collapsible-section/collapsible-section.component';
import { NotificationService } from '../../common/notification/notification.service';
import { TreeGapDirective, TreeRowDirective } from '../../common/tree-view/tree-row.directive';
import { TreeViewComponent } from '../../common/tree-view/tree-view.component';
import { TreeGap } from '../../common/tree-view/tree-view.model';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import {
  createDemoHierarchies,
  createHierarchy,
  createLevelRegistry,
  newHierarchyId,
  newLevelId,
} from './hierarchy-demo.data';
import { DemoHierarchy, DemoLevel, RegisteredLevel, appendToChain } from './hierarchy-demo.model';
import { HierarchyDeleteModalComponent } from './hierarchyDeleteModal/hierarchy-delete-modal.component';
import {
  HierarchyModalComponent,
  HierarchyModalResult,
} from './hierarchyModal/hierarchy-modal.component';
import { LevelPickerPanelComponent } from './levelPickerPanel/level-picker-panel.component';
import { LevelDeleteModalComponent } from './levelDeleteModal/level-delete-modal.component';
import {
  LevelRegisterModalComponent,
  LevelRegisterResult,
} from './levelRegisterModal/level-register-modal.component';
import {
  MandantOverviewRow,
  MandantOverviewTableComponent,
} from './mandantOverviewTable/mandant-overview-table.component';
import { MandantPanelComponent } from './mandantPanel/mandant-panel.component';
import {
  LevelAssignment,
  UnassignedLevelsPanelComponent,
} from './unassignedLevelsPanel/unassigned-levels-panel.component';

/**
 * Management of spatial unit hierarchies — the chains that order spatial unit
 * levels from the coarsest to the finest.
 *
 * The page works on demo data of the design draft: hierarchies can be created,
 * renamed, deleted and their level chains edited, but nothing is persisted —
 * the Data Management API has no hierarchy endpoints yet.
 */
@Component({
  selector: 'app-admin-spatial-unit-hierarchies',
  templateUrl: './admin-spatial-unit-hierarchies.component.html',
  styleUrls: ['./admin-spatial-unit-hierarchies.component.scss'],
  imports: [
    TranslateModule,
    AdminContentViewComponent,
    CollapsibleSectionComponent,
    TreeViewComponent,
    TreeRowDirective,
    TreeGapDirective,
    LevelPickerPanelComponent,
    MandantPanelComponent,
    MandantOverviewTableComponent,
    UnassignedLevelsPanelComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpatialUnitHierarchiesComponent {
  private readonly modalService = inject(NgbModal);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);
  private readonly accessControlService = inject(AccessControlService);

  readonly showIds = signal(false);

  readonly hierarchies = signal<readonly DemoHierarchy[]>(createDemoHierarchies());

  /**
   * Every spatial unit level this instance knows, whether or not a hierarchy
   * uses it. The page owns it because levels are registered and deleted here.
   */
  readonly levelRegistry = signal<readonly RegisteredLevel[]>(createLevelRegistry());

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
  readonly tenantLevelNames = computed(() => {
    const mandant = this.selectedMandant();
    return this.levelRegistry()
      .filter((level) => !mandant || level.mandant === mandant)
      .map((level) => level.name);
  });

  /**
   * The tenant whose hierarchies are on screen; the empty string is the
   * overview across all of them. Starts at the tenant the user belongs to, so
   * everyone lands in their own data — and without Keycloak in the overview.
   *
   * Written through `selectMandant`, which also unfolds what it switches to.
   */
  readonly selectedMandant = signal(this.ownMandant());

  constructor() {
    // The tenant a user starts in is a view they enter as well.
    this.expandMandant(this.selectedMandant());
  }

  /** The tenants flagged as such in Keycloak; empty without it. */
  private readonly keycloakMandants: readonly string[] = this.accessControlService.accessControl
    .filter((unit) => unit.mandant)
    .map((unit) => unit.name);

  /**
   * The tenants of this instance with what each of them holds — the rows of the
   * overview table, and at the same time the entries the switcher lists, which
   * only reads the name and the hierarchy count off them.
   *
   * Keycloak names the tenants; one that only appears in the hierarchies is
   * listed as well, so the page shows whom its data belongs to even without it.
   */
  readonly mandantOverview = computed<readonly MandantOverviewRow[]>(() => {
    // Per tenant: how many hierarchies, and how many of them each level sits in.
    const rows = new Map<string, { hierarchyCount: number; levelUsage: Map<string, number> }>(
      this.keycloakMandants.map((name) => [name, { hierarchyCount: 0, levelUsage: new Map() }])
    );

    for (const hierarchy of this.hierarchies()) {
      const mandant = hierarchy.mandant();
      if (!mandant) {
        continue;
      }
      let row = rows.get(mandant);
      if (!row) {
        row = { hierarchyCount: 0, levelUsage: new Map<string, number>() };
        rows.set(mandant, row);
      }
      row.hierarchyCount += 1;
      for (const entry of hierarchy.chain()) {
        row.levelUsage.set(entry.name, (row.levelUsage.get(entry.name) ?? 0) + 1);
      }
    }

    return [...rows].map(([name, { hierarchyCount, levelUsage }]) => ({
      name,
      hierarchyCount,
      levelCount: levelUsage.size,
      sharedLevelCount: [...levelUsage.values()].filter((count) => count > 1).length,
    }));
  });

  /** The tenant names, for the dialog to offer where Keycloak names none. */
  readonly mandantNames = computed(() => this.mandantOverview().map((row) => row.name));

  /**
   * Switching tenants is a platform administrator's view. Without Keycloak
   * nobody holds that role, so more than one tenant in the data opens the
   * switcher as well — otherwise the draft could not be tried out at all.
   */
  readonly canSwitchMandant = computed(
    () => this.accessControlService.isRealmAdmin || this.mandantOverview().length > 1
  );

  /**
   * The registered levels of the tenant on screen that no hierarchy uses. They
   * are what the section below the list shows — registered, but nowhere to be
   * chosen in the map interface, because only a hierarchy puts a level there.
   *
   * Derived, never stored: a level becomes assigned by appearing in a chain and
   * unassigned again by leaving the last one.
   */
  readonly unassignedLevels = computed(() => {
    const mandant = this.selectedMandant();
    const used = new Set(
      this.hierarchies().flatMap((hierarchy) => hierarchy.chain().map((entry) => entry.name))
    );
    return this.levelRegistry().filter(
      (level) => (!mandant || level.mandant === mandant) && !used.has(level.name)
    );
  });

  /** What the list renders: one tenant's hierarchies, or all of them. */
  readonly visibleHierarchies = computed(() => {
    const mandant = this.selectedMandant();
    return mandant
      ? this.hierarchies().filter((hierarchy) => hierarchy.mandant() === mandant)
      : this.hierarchies();
  });

  /**
   * Whether the tenant overview takes the place of the hierarchy list. Across
   * all tenants the list would mix data of instances that share nothing, so it
   * gives way to one row per tenant. Where the data knows no tenant at all
   * there is nothing to summarize and the list stays.
   */
  readonly showMandantOverview = computed(
    () => !this.selectedMandant() && this.mandantOverview().length > 0
  );

  // Note on drag & drop: the tree reorders among siblings, and a chain gives every
  // level exactly one child — so every drop list would hold a single item and a
  // drag could never change anything. Moving a level is what ▲/▼ do instead. The
  // tree keeps its drag & drop for branching trees, where siblings exist.

  /**
   * The gap predicate of a hierarchy, built once per hierarchy: the tree reads
   * it as an input, and a fresh function on every change detection run would
   * keep writing that input and never settle.
   */
  private readonly gapFilters = new WeakMap<DemoHierarchy, (gap: TreeGap<DemoLevel>) => boolean>();

  protected gapFilter(hierarchy: DemoHierarchy): (gap: TreeGap<DemoLevel>) => boolean {
    let filter = this.gapFilters.get(hierarchy);
    if (!filter) {
      filter = (gap) => this.canInsertAtGap(hierarchy, gap);
      this.gapFilters.set(hierarchy, filter);
    }
    return filter;
  }

  /**
   * A hierarchy is a chain, so every level holds exactly one child and the gap
   * *before* a level is the only position it names on its own: the gap after
   * that child would address the same slot as the leading gap one level deeper.
   *
   * The end of the chain is the exception. The deepest level has no child, so
   * its children area stays folded away — the gap inside it can never be
   * clicked. The gap *after* the deepest level takes its place, and that is the
   * "append at the end" position.
   */
  private canInsertAtGap(hierarchy: DemoHierarchy, gap: TreeGap<DemoLevel>): boolean {
    // Inside the folded-away children area of a childless level; the trailing
    // gap one level up addresses the same position and is reachable.
    if (gap.parent && gap.parent.children.length === 0) {
      return false;
    }
    if (gap.index === 0) {
      return true;
    }
    // A trailing gap only names a position of its own at the end of the chain.
    const siblings = gap.parent ? gap.parent.children : hierarchy.levels();
    return siblings[gap.index - 1]?.children.length === 0;
  }

  /** The chain nests under `children`, not under the tree's `subTopics` default. */
  protected readonly levelChildren = (level: DemoLevel): readonly DemoLevel[] => level.children;
  protected readonly levelId = (level: DemoLevel): string => level.id;

  protected onShowIdsChange(event: Event): void {
    this.showIds.set((event.target as HTMLInputElement).checked);
  }

  protected levelIndex(hierarchy: DemoHierarchy, level: DemoLevel): number {
    return hierarchy.chain().findIndex((entry) => entry.id === level.id);
  }

  protected canMove(hierarchy: DemoHierarchy, level: DemoLevel, offset: number): boolean {
    const target = this.levelIndex(hierarchy, level) + offset;
    return target >= 0 && target < hierarchy.chain().length;
  }

  /**
   * Moves a level one step along the chain, i.e. swaps it with the level above
   * or below it in the hierarchy. The tree re-nests itself from the new order.
   */
  protected moveLevel(hierarchy: DemoHierarchy, level: DemoLevel, offset: number): void {
    const index = this.levelIndex(hierarchy, level);
    const target = index + offset;
    if (index < 0 || target < 0 || target >= hierarchy.chain().length) {
      return;
    }

    hierarchy.chain.update((entries) => {
      const next = [...entries];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  /**
   * Takes a level out of the chain. The neighbours close up, so the level below
   * moves under the one above. The last remaining level cannot be removed — an
   * empty hierarchy has no meaning.
   */
  protected removeLevel(hierarchy: DemoHierarchy, level: DemoLevel): void {
    if (hierarchy.chain().length <= 1) {
      return;
    }

    hierarchy.chain.update((entries) => entries.filter((entry) => entry.id !== level.id));
    // Drop the expansion entry as well, so a re-added level does not come back open.
    hierarchy.expandedIds.update((ids) => {
      const next = new Set(ids);
      next.delete(level.id);
      return next;
    });

    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.REMOVED', { level: level.name });
  }

  /**
   * Creates a hierarchy from the metadata and the level chain the dialog
   * assembled. It is appended to the list, opened and fully expanded.
   */
  protected onCreateHierarchy(): void {
    const modalRef = this.modalService.open(HierarchyModalComponent, MODAL_FORM);
    modalRef.componentInstance.mode = 'create';
    modalRef.componentInstance.existingNames = this.hierarchyNames();
    modalRef.componentInstance.levelUsage = this.levelUsage();
    modalRef.componentInstance.registeredLevels = this.registeredLevelNames();
    // Prefill with the tenant on screen; in the overview the dialog picks its own.
    modalRef.componentInstance.currentMandant = this.selectedMandant();
    modalRef.componentInstance.knownMandants = this.mandantNames();

    modalRef.result.then((result: HierarchyModalResult) => {
      const hierarchy = createHierarchy({
        id: newHierarchyId(),
        name: result.name,
        description: result.description,
        mandant: result.mandant,
        levels: result.levels ?? [],
        open: true,
      });
      this.hierarchies.update((entries) => [...entries, hierarchy]);
      this.followMandant(result.mandant);
      this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.CREATED', { hierarchy: result.name });
    }, this.ignoreDismissal);
  }

  /** Edits the metadata. The chain and its expansion state stay untouched. */
  protected onEditHierarchy(hierarchy: DemoHierarchy): void {
    const modalRef = this.modalService.open(HierarchyModalComponent, MODAL_FORM);
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.existingNames = this.hierarchyNames();
    modalRef.componentInstance.currentName = hierarchy.name();
    modalRef.componentInstance.currentDescription = hierarchy.description();
    modalRef.componentInstance.currentMandant = hierarchy.mandant();
    modalRef.componentInstance.knownMandants = this.mandantNames();

    modalRef.result.then((result: HierarchyModalResult) => {
      hierarchy.name.set(result.name);
      hierarchy.description.set(result.description);
      hierarchy.mandant.set(result.mandant);
      this.followMandant(result.mandant);
      this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.UPDATED', { hierarchy: result.name });
    }, this.ignoreDismissal);
  }

  /**
   * Assigns a level to a hierarchy: it becomes the finest level of that chain.
   * The registry does not change — a level is not owned by a hierarchy, it is
   * only used by one, and it may be used by several.
   */
  protected onAssignLevel({ level, hierarchy }: LevelAssignment): void {
    appendToChain(hierarchy, level.name);
    hierarchy.open.set(true);
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.UNASSIGNED.ASSIGNED', {
      level: level.name,
      hierarchy: hierarchy.name(),
    });
  }

  /** Registers a level for the tenant on screen, without putting it anywhere. */
  protected onRegisterLevel(): void {
    const modalRef = this.modalService.open(LevelRegisterModalComponent, MODAL_FORM);
    // Against the whole registry: a level name names one level in the instance.
    modalRef.componentInstance.existingNames = this.registeredLevelNames();

    modalRef.result.then((result: LevelRegisterResult) => {
      this.onLevelRegistered(result, this.selectedMandant());
      this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.UNASSIGNED.REGISTERED', { level: result.name });
    }, this.ignoreDismissal);
  }

  /** Drops a level from the registry once the confirmation dialog agrees. */
  protected onDeleteLevel(level: RegisteredLevel): void {
    const modalRef = this.modalService.open(LevelDeleteModalComponent, MODAL_CONFIRM);
    modalRef.componentInstance.level = level;

    modalRef.result.then((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      this.levelRegistry.update((levels) => levels.filter((entry) => entry !== level));
      this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.UNASSIGNED.DELETED', { level: level.name });
    }, this.ignoreDismissal);
  }

  /**
   * Takes a level the user registered into the registry. The tenant comes from
   * where it was registered — inside a hierarchy that is the hierarchy's own,
   * which in the tenant-less fallback view need not be the one on screen.
   */
  onLevelRegistered(result: LevelRegisterResult, mandant: string): void {
    this.levelRegistry.update((levels) => [
      ...levels,
      { id: newLevelId(), name: result.name, datasource: result.datasource, mandant },
    ]);
  }

  /** Drops a hierarchy once the confirmation dialog agrees. */
  protected onDeleteHierarchy(hierarchy: DemoHierarchy): void {
    const modalRef = this.modalService.open(HierarchyDeleteModalComponent, MODAL_CONFIRM);
    modalRef.componentInstance.hierarchy = hierarchy;

    modalRef.result.then((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      const name = hierarchy.name();
      this.hierarchies.update((entries) => entries.filter((entry) => entry !== hierarchy));
      this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.DELETED', { hierarchy: name });
    }, this.ignoreDismissal);
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

  /** The tenant the user belongs to, or '' for the overview across all of them. */
  private ownMandant(): string {
    const own = this.accessControlService.currentKomMonitorLoginOrganizationalUnits.find(
      (unit) => unit.mandant
    );
    return own?.name ?? '';
  }

  private hierarchyNames(): string[] {
    return this.hierarchies().map((entry) => entry.name());
  }

  /**
   * How many hierarchies each level is part of. The create dialog marks the
   * levels that are already in use with it — sharing one is allowed, it just
   * should not happen unnoticed.
   */
  private levelUsage(): Record<string, number> {
    const usage: Record<string, number> = {};
    for (const hierarchy of this.hierarchies()) {
      for (const entry of hierarchy.chain()) {
        usage[entry.name] = (usage[entry.name] ?? 0) + 1;
      }
    }
    return usage;
  }

  /** Closing a modal with Esc or the backdrop rejects its result; that is not an error. */
  private readonly ignoreDismissal = (): void => undefined;

  /** Demo feedback: proves the projected header and row buttons receive their clicks. */
  protected onAction(actionKey: string, subject: string): void {
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.ACTION_CLICKED', {
      action: this.translateService.instant(actionKey),
      hierarchy: subject,
    });
  }

  private notify(key: string, params: Record<string, unknown>): void {
    this.notificationService.show(this.translateService.instant(key, params), {
      autohide: true,
      delay: 3000,
    });
  }
}
