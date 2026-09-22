import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccessControlService } from 'services/access-control-service/access-control.service';
import { MetadataBootstrapService } from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { MODAL_CONFIRM, MODAL_FORM, MODAL_WIDE } from 'util/modal-presets';

import { CollapsibleSectionComponent } from '../../common/collapsible-section/collapsible-section.component';
import { NotificationService } from '../../common/notification/notification.service';
import { TreeGapDirective, TreeRowDirective } from '../../common/tree-view/tree-row.directive';
import { TreeViewComponent } from '../../common/tree-view/tree-view.component';
import { TreeGap } from '../../common/tree-view/tree-view.model';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { AdminModalService } from '../adminShared/modal/admin-modal.service';
import { SpatialUnitAddModalComponent } from '../adminSpatialUnitsManagement/spatialUnitAddModal/spatial-unit-add-modal.component';
import { SpatialUnitDeleteModalComponent } from '../adminSpatialUnitsManagement/spatialUnitDeleteModal/spatial-unit-delete-modal.component';
import {
  HierarchyChainEntry,
  HierarchyLevel,
  RegisteredLevel,
  SpatialUnitHierarchy,
} from './hierarchy.model';
import { ChainEditResult, HierarchyStoreService } from './hierarchy-store.service';
import { HierarchyDeleteModalComponent } from './hierarchyDeleteModal/hierarchy-delete-modal.component';
import {
  HierarchyCreateModalComponent,
  HierarchyCreateModalResult,
} from './hierarchyCreateModal/hierarchy-create-modal.component';
import {
  HierarchyEditModalComponent,
  HierarchyEditModalResult,
} from './hierarchyEditModal/hierarchy-edit-modal.component';
import { LevelPickerPanelComponent } from './levelPickerPanel/level-picker-panel.component';
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
 * The hierarchies live in the Data Management API, and every edit below is
 * written there straight away — `HierarchyStoreService` says which of them wait
 * for the answer and which are rolled back if it never comes.
 *
 * The hierarchies, the spatial unit levels and the tenant on screen live in
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
  private readonly metadataBootstrap = inject(MetadataBootstrapService);
  private readonly accessControlService = inject(AccessControlService);

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
  protected async removeLevel(
    hierarchy: SpatialUnitHierarchy,
    level: HierarchyLevel
  ): Promise<void> {
    this.announceChainEdit(await this.store.removeLevel(hierarchy, level), {
      key: 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.REMOVED',
      params: { level: level.name },
    });
  }

  /** Moves a level one step towards the coarse or the fine end of its chain. */
  protected async onMoveLevel(
    hierarchy: SpatialUnitHierarchy,
    level: HierarchyLevel,
    offset: number
  ): Promise<void> {
    this.announceChainEdit(await this.store.moveLevel(hierarchy, level, offset), {
      key: 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.MOVED',
      params: { level: level.name },
    });
  }

  /**
   * How many hierarchies hold this level, but only once that is more than one —
   * 0 means it is this hierarchy's alone and the row says nothing. A level may
   * sit in several chains, and the badge is what makes that visible before an
   * edit here surprises someone looking at another hierarchy.
   */
  protected sharedCount(level: HierarchyLevel): number {
    const used = this.store.levelUsage()[level.id] ?? 0;
    return used > 1 ? used : 0;
  }

  /** Creates a hierarchy from the metadata and the chain the dialog assembled. */
  protected async onCreateHierarchy(): Promise<void> {
    const result = await this.modals.open<
      HierarchyCreateModalComponent,
      HierarchyCreateModalResult
    >(HierarchyCreateModalComponent, MODAL_FORM, {
      existingNames: this.store.hierarchyNames(),
      levelUsage: this.store.levelUsage(),
      registeredLevels: this.store.registeredLevels(),
      // The tenant on screen is the one it is built for; in the overview the
      // dialog picks its own and offers the choice.
      presetMandant: this.store.selectedMandant(),
      knownMandants: this.store.mandantNames(),
    });
    if (!result) {
      return;
    }
    const created = await this.store.addHierarchy(result, result.levels);
    this.notify(
      created
        ? 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.CREATED'
        : 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.CREATE_FAILED',
      { hierarchy: result.name }
    );
  }

  /**
   * Edits the metadata. The chain and its expansion state stay untouched — the
   * dialog only shows the chain, the tree on the page is where it is edited.
   */
  protected async onEditHierarchy(hierarchy: SpatialUnitHierarchy): Promise<void> {
    const result = await this.modals.open<HierarchyEditModalComponent, HierarchyEditModalResult>(
      HierarchyEditModalComponent,
      MODAL_FORM,
      {
        existingNames: this.store.hierarchyNames(),
        currentName: hierarchy.name(),
        currentIsPublic: hierarchy.isPublic(),
        mandant: hierarchy.mandant(),
        chain: hierarchy.chain().map((entry) => entry.name),
        hierarchyId: hierarchy.id,
      }
    );
    if (!result) {
      return;
    }
    const saved = await this.store.updateHierarchyMetadata(hierarchy, result);
    this.notify(
      saved
        ? 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.UPDATED'
        : 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.UPDATE_FAILED',
      { hierarchy: result.name }
    );
  }

  /**
   * Registers a new spatial unit level, through the spatial units page's own
   * wizard: a level exists only with its geometry, and collecting that is what
   * the wizard is for.
   *
   * The tenant travels with it and is fixed there — this page works in one
   * tenant at a time, and a level created for another one would vanish from
   * the view it was started in. In the overview across all tenants nothing is
   * fixed and the wizard asks, as it does on its own page.
   *
   * Afterwards the spatial unit metadata is refetched, because the registry
   * this page derives its levels from is that store, and the hierarchies with
   * it — the wizard may have put the new level into one of them.
   */
  protected async onRegisterLevel(): Promise<void> {
    const result = await this.modals.open<SpatialUnitAddModalComponent, { action?: string }>(
      SpatialUnitAddModalComponent,
      MODAL_WIDE,
      { lockedMandantId: this.store.selectedMandantId() }
    );
    if (result?.action !== 'added') {
      return;
    }
    await this.metadataBootstrap.fetchSpatialUnitsMetadata(
      this.accessControlService.currentKeycloakLoginRoles ?? []
    );
    await this.store.reload();
  }

  /**
   * Deletes the spatial unit dataset behind an unassigned level.
   *
   * Through the spatial units page's own dialog, deliberately: deleting a level
   * takes every indicator dataset on it with it, and that dialog is what warns
   * about the cascade, refetches the indicator metadata afterwards and drops
   * the level from the metadata store. `levelRegistry` is derived from that
   * store, so the row disappears on its own — and the dialog reports the
   * outcome itself, which is why nothing is announced here.
   */
  protected async onDeleteLevel(level: RegisteredLevel): Promise<void> {
    const dataset = this.store.spatialUnitOf(level.id);
    if (!dataset) {
      return;
    }
    await this.modals.open(SpatialUnitDeleteModalComponent, MODAL_CONFIRM, {
      datasetsToDelete: [dataset],
    });
  }

  /** Makes a so far unassigned level the finest level of a chain. */
  protected async onAssignLevel({ level, hierarchy }: LevelAssignment): Promise<void> {
    this.announceChainEdit(await this.store.assignLevel(level, hierarchy), {
      key: 'ADMIN_SPATIAL_UNIT_HIERARCHIES.UNASSIGNED.ASSIGNED',
      params: { level: level.name, hierarchy: hierarchy.name() },
    });
  }

  /** Puts the level the picker chose into the chain, at the gap it was opened at. */
  protected async onInsertLevel(
    hierarchy: SpatialUnitHierarchy,
    gap: TreeGap<HierarchyLevel>,
    level: HierarchyChainEntry
  ): Promise<void> {
    this.announceChainEdit(await this.store.insertLevel(hierarchy, gap, level), {
      key: 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.INSERTED',
      params: { level: level.name },
    });
  }

  /** Drops a hierarchy once the confirmation dialog agrees. */
  protected async onDeleteHierarchy(hierarchy: SpatialUnitHierarchy): Promise<void> {
    if (!(await this.modals.confirm(HierarchyDeleteModalComponent, { hierarchy }))) {
      return;
    }
    const name = hierarchy.name();
    const deleted = await this.store.deleteHierarchy(hierarchy);
    this.notify(
      deleted
        ? 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.DELETED'
        : 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.DELETE_FAILED',
      { hierarchy: name }
    );
  }

  /**
   * The metadata button of a level, in the chain and in the unassigned section
   * alike. Still a scaffold: it only reports the click, and says so.
   *
   * TODO: open `SpatialUnitEditMetadataModalComponent` with the level's spatial
   * unit, the way `admin-spatial-units-management.onClickEditMetadata` does.
   * The levels now carry their real `spatialUnitId`, so the missing piece is
   * only the dialog's own plumbing — it wants the whole `SpatialUnitOverviewType`
   * and a way to report back what it changed.
   */
  protected onShowMetadata(name: string): void {
    this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.ACTION_CLICKED', {
      action: this.translateService.instant('ADMIN_SHARED.METADATA'),
      hierarchy: name,
    });
  }

  /**
   * Says what became of a chain edit. A `rejected` one is silent: the chain
   * rules turned it down before anything was sent, and the disabled button or
   * the unchanged tree already says so.
   */
  private announceChainEdit(
    result: ChainEditResult,
    success: { key: string; params: Record<string, unknown> }
  ): void {
    if (result === 'rejected') {
      return;
    }
    this.notify(
      result === 'saved' ? success.key : 'ADMIN_SPATIAL_UNIT_HIERARCHIES.MSG.SAVE_FAILED',
      success.params
    );
  }

  private notify(key: string, params: Record<string, unknown>): void {
    this.notificationService.show(this.translateService.instant(key, params), {
      autohide: true,
      delay: 3000,
    });
  }
}
