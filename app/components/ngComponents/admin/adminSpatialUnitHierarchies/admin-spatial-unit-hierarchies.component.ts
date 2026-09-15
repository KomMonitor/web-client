import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MODAL_FORM } from 'util/modal-presets';

import { CollapsibleSectionComponent } from '../../common/collapsible-section/collapsible-section.component';
import { NotificationService } from '../../common/notification/notification.service';
import { TreeGapDirective, TreeRowDirective } from '../../common/tree-view/tree-row.directive';
import { TreeViewComponent } from '../../common/tree-view/tree-view.component';
import { TreeGap } from '../../common/tree-view/tree-view.model';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { AdminModalService } from '../adminShared/modal/admin-modal.service';
import { DemoHierarchy, DemoLevel, RegisteredLevel } from './hierarchy-demo.model';
import { HierarchyStoreService } from './hierarchy-store.service';
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
import { MandantOverviewTableComponent } from './mandantOverviewTable/mandant-overview-table.component';
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
 *
 * The hierarchies, the level registry and the tenant on screen live in
 * `HierarchyStoreService`, which the page provides for itself. What is left
 * here is the dialogs, what the user is told afterwards, and the wiring of the
 * tree.
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
  providers: [HierarchyStoreService],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpatialUnitHierarchiesComponent {
  private readonly modals = inject(AdminModalService);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  /** The page's state; read straight from the template. */
  protected readonly store = inject(HierarchyStoreService);

  readonly showIds = signal(false);

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

  /** Takes a level out of the chain, if it is not the last one left. */
  protected removeLevel(hierarchy: DemoHierarchy, level: DemoLevel): void {
    if (this.store.removeLevel(hierarchy, level)) {
      this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.REMOVED', { level: level.name });
    }
  }

  /** Creates a hierarchy from the metadata and the chain the dialog assembled. */
  protected async onCreateHierarchy(): Promise<void> {
    const result = await this.modals.open<HierarchyModalComponent, HierarchyModalResult>(
      HierarchyModalComponent,
      MODAL_FORM,
      {
        mode: 'create',
        existingNames: this.store.hierarchyNames(),
        levelUsage: this.store.levelUsage(),
        registeredLevels: this.store.registeredLevelNames(),
        // Prefill with the tenant on screen; in the overview the dialog picks its own.
        currentMandant: this.store.selectedMandant(),
        knownMandants: this.store.mandantNames(),
      }
    );
    if (!result) {
      return;
    }
    this.store.addHierarchy(result, result.levels ?? []);
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.CREATED', { hierarchy: result.name });
  }

  /** Edits the metadata. The chain and its expansion state stay untouched. */
  protected async onEditHierarchy(hierarchy: DemoHierarchy): Promise<void> {
    const result = await this.modals.open<HierarchyModalComponent, HierarchyModalResult>(
      HierarchyModalComponent,
      MODAL_FORM,
      {
        mode: 'edit',
        existingNames: this.store.hierarchyNames(),
        currentName: hierarchy.name(),
        currentDescription: hierarchy.description(),
        currentMandant: hierarchy.mandant(),
        knownMandants: this.store.mandantNames(),
      }
    );
    if (!result) {
      return;
    }
    this.store.updateHierarchyMetadata(hierarchy, result);
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.UPDATED', { hierarchy: result.name });
  }

  /** Makes a so far unassigned level the finest level of a chain. */
  protected onAssignLevel({ level, hierarchy }: LevelAssignment): void {
    this.store.assignLevel(level, hierarchy);
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.UNASSIGNED.ASSIGNED', {
      level: level.name,
      hierarchy: hierarchy.name(),
    });
  }

  /** Registers a level for the tenant on screen, without putting it anywhere. */
  protected async onRegisterLevel(): Promise<void> {
    const result = await this.modals.open<LevelRegisterModalComponent, LevelRegisterResult>(
      LevelRegisterModalComponent,
      MODAL_FORM,
      // Against the whole registry: a level name names one level in the instance.
      { existingNames: this.store.registeredLevelNames() }
    );
    if (!result) {
      return;
    }
    this.store.registerLevel(result, this.store.selectedMandant());
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.UNASSIGNED.REGISTERED', { level: result.name });
  }

  /** Drops a level from the registry once the confirmation dialog agrees. */
  protected async onDeleteLevel(level: RegisteredLevel): Promise<void> {
    if (!(await this.modals.confirm(LevelDeleteModalComponent, { level }))) {
      return;
    }
    this.store.deleteLevel(level);
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.UNASSIGNED.DELETED', { level: level.name });
  }

  /** Takes a level the level picker registered inside a chain into the registry. */
  onLevelRegistered(result: LevelRegisterResult, mandant: string): void {
    this.store.registerLevel(result, mandant);
  }

  /** Drops a hierarchy once the confirmation dialog agrees. */
  protected async onDeleteHierarchy(hierarchy: DemoHierarchy): Promise<void> {
    if (!(await this.modals.confirm(HierarchyDeleteModalComponent, { hierarchy }))) {
      return;
    }
    const name = hierarchy.name();
    this.store.deleteHierarchy(hierarchy);
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.DELETED', { hierarchy: name });
  }

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
