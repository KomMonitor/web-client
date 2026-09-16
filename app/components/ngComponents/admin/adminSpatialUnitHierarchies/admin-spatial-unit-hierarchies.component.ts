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
import { HierarchyLevel, RegisteredLevel, SpatialUnitHierarchy } from './hierarchy.model';
import { HierarchyStoreService } from './hierarchy-store.service';
import { HierarchyDeleteModalComponent } from './hierarchyDeleteModal/hierarchy-delete-modal.component';
import {
  HierarchyModalComponent,
  HierarchyModalResult,
} from './hierarchyModal/hierarchy-modal.component';
import {
  LevelPick,
  LevelPickerPanelComponent,
} from './levelPickerPanel/level-picker-panel.component';
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

  protected readonly showIds = signal(false);

  // Note on drag & drop: the tree reorders among siblings, and a chain gives every
  // level exactly one child — so every drop list would hold a single item and a
  // drag could never change anything. Moving a level is what ▲/▼ do instead. The
  // tree keeps its drag & drop for branching trees, where siblings exist.

  /** The chain nests under `children`, not under the tree's `subTopics` default. */
  protected readonly levelChildren = (level: HierarchyLevel): readonly HierarchyLevel[] =>
    level.children;
  protected readonly levelId = (level: HierarchyLevel): string => level.id;

  protected onShowIdsChange(event: Event): void {
    this.showIds.set((event.target as HTMLInputElement).checked);
  }

  /** Takes a level out of the chain, if it is not the last one left. */
  protected removeLevel(hierarchy: SpatialUnitHierarchy, level: HierarchyLevel): void {
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
  protected async onEditHierarchy(hierarchy: SpatialUnitHierarchy): Promise<void> {
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

  /**
   * Puts the level the picker chose into the chain, at the gap the picker was
   * opened at. One the user registered in the picker goes into the registry
   * first, under the hierarchy's tenant — in the tenant-less fallback view that
   * need not be the one on screen.
   */
  protected onInsertLevel(
    hierarchy: SpatialUnitHierarchy,
    gap: TreeGap<HierarchyLevel>,
    { name, registration }: LevelPick
  ): void {
    if (registration) {
      this.store.registerLevel(registration, hierarchy.mandant());
    }
    this.store.insertLevel(hierarchy, gap, name);
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.INSERTED', { level: name });
  }

  /** Drops a hierarchy once the confirmation dialog agrees. */
  protected async onDeleteHierarchy(hierarchy: SpatialUnitHierarchy): Promise<void> {
    if (!(await this.modals.confirm(HierarchyDeleteModalComponent, { hierarchy }))) {
      return;
    }
    const name = hierarchy.name();
    this.store.deleteHierarchy(hierarchy);
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.DELETED', { hierarchy: name });
  }

  /**
   * The metadata button of a level, in the chain and in the unassigned section
   * alike. Demo scaffold: it only reports the click, and says so.
   *
   * TODO: open `SpatialUnitEditMetadataModalComponent` with the level's spatial
   * unit, the way `admin-spatial-units-management.onClickEditMetadata` does.
   * That dialog edits a real `SpatialUnitOverviewType` and writes it back
   * through the API, while the registry here holds demo levels whose `id` only
   * stands in for a `spatialUnitId` — so this waits for the page to read its
   * levels from the Data Management API.
   */
  protected onShowMetadata(name: string): void {
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.ACTION_CLICKED', {
      action: this.translateService.instant('ADMIN_SHARED.METADATA'),
      hierarchy: name,
    });
  }

  private notify(key: string, params: Record<string, unknown>): void {
    this.notificationService.show(this.translateService.instant(key, params), {
      autohide: true,
      delay: 3000,
    });
  }
}
