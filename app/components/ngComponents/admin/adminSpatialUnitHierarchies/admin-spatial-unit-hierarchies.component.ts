import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MODAL_CONFIRM, MODAL_FORM } from 'util/modal-presets';

import { CollapsibleSectionComponent } from '../../common/collapsible-section/collapsible-section.component';
import { NotificationService } from '../../common/notification/notification.service';
import { TreeGapDirective, TreeRowDirective } from '../../common/tree-view/tree-row.directive';
import { TreeViewComponent } from '../../common/tree-view/tree-view.component';
import { TreeGap } from '../../common/tree-view/tree-view.model';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { createDemoHierarchies, createHierarchy, newHierarchyId } from './hierarchy-demo.data';
import { DemoHierarchy, DemoLevel } from './hierarchy-demo.model';
import { HierarchyDeleteModalComponent } from './hierarchyDeleteModal/hierarchy-delete-modal.component';
import {
  HierarchyModalComponent,
  HierarchyModalResult,
} from './hierarchyModal/hierarchy-modal.component';
import { LevelPickerPanelComponent } from './levelPickerPanel/level-picker-panel.component';

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
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpatialUnitHierarchiesComponent {
  private readonly modalService = inject(NgbModal);
  private readonly notificationService = inject(NotificationService);
  private readonly translateService = inject(TranslateService);

  readonly showIds = signal(false);

  readonly hierarchies = signal<readonly DemoHierarchy[]>(createDemoHierarchies());

  // Note on drag & drop: the tree reorders among siblings, and a chain gives every
  // level exactly one child — so every drop list would hold a single item and a
  // drag could never change anything. Moving a level is what ▲/▼ do instead. The
  // tree keeps its drag & drop for branching trees, where siblings exist.

  /**
   * A hierarchy is a chain, so every level holds exactly one child and only the
   * gap *before* it names a position of its own: the gap after that child would
   * address the same slot as the leading gap one level deeper. The deepest level
   * has no child, so its leading gap is the "append at the end" position.
   */
  protected readonly leadingGapOnly = (gap: TreeGap<DemoLevel>): boolean => gap.index === 0;

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

    modalRef.result.then((result: HierarchyModalResult) => {
      hierarchy.name.set(result.name);
      hierarchy.description.set(result.description);
      hierarchy.mandant.set(result.mandant);
      this.notify('ADMIN_SPATIAL_UNIT_HIERARCHIES.DEMO.UPDATED', { hierarchy: result.name });
    }, this.ignoreDismissal);
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
