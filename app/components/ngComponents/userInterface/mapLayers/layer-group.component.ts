import { CdkDrag, type CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { injectLayerGroupActions } from 'services/map-layer-registry-service/layer-actions';
import type {
  LayerEntryState,
  LayerTreeNode,
} from 'services/map-layer-registry-service/map-layer.model';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { LayerActionsMenuComponent, type LayerMenuItem } from './layer-actions-menu.component';
import { LayerRowComponent } from './layer-row.component';
import { isGroupShown } from './layer-tree.util';
import { MapLayersPanelUiState } from './map-layers-panel-ui-state.service';

/**
 * One group of the panel with its sub groups or layers. Recursive, so it
 * carries deeper trees too; `depth` 0 is a top-level group. A group whose
 * actions apply (by default: moving top-level groups) gets a ⋮ menu next to
 * its header; a movable one a drag handle in front of it. The layers of a
 * group are a list of their own, sorted by dragging their handles.
 */
@Component({
  selector: 'app-layer-group',
  templateUrl: './layer-group.component.html',
  styleUrls: ['./layer-group.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkMenuTrigger,
    LayerActionsMenuComponent,
    LayerRowComponent,
    LayerGroupComponent,
  ],
})
export class LayerGroupComponent {
  readonly node = input.required<LayerTreeNode>();
  readonly depth = input(0);
  /** Shows the drag handle; the panel sets it on top-level groups, which it makes draggable. */
  readonly movable = input(false);

  private readonly registry = inject(MAP_LAYER_REGISTRY);
  private readonly uiState = inject(MapLayersPanelUiState);
  private readonly injector = inject(Injector);
  private readonly actions = injectLayerGroupActions();

  private readonly menuTrigger = viewChild<ElementRef<HTMLButtonElement>>('menuTrigger');

  protected readonly expanded = computed(() => this.uiState.isExpanded(this.node().group.id));
  protected readonly bodyId = computed(() => `map-layer-group-${this.node().group.id}`);

  /** The actions that apply to this group; follows the order of the groups. */
  protected readonly menuItems = computed<LayerMenuItem[]>(() => {
    const node = this.node();
    return this.actions
      .filter((action) => action.appliesTo(node, this.registry))
      .map((action) => ({
        id: action.id,
        i18nKey: action.i18nKey,
        icon: action.icon,
        disabled: !(action.enabled?.(node, this.registry) ?? true),
      }));
  });

  protected readonly isGroupShown = isGroupShown;

  /** The group may be sorted and has something to sort; see also `entryListPosition()`. */
  private readonly rowsSortable = computed(
    () => this.node().group.sortable !== false && this.node().entries.length > 1
  );

  protected isMovable(entry: LayerEntryState): boolean {
    return this.rowsSortable() && entry.capabilities.reorder;
  }

  /** Lists show all entries of their group, so the drop index is the position in the list. */
  protected dropEntry(event: CdkDragDrop<unknown, unknown, string>): void {
    this.registry.moveEntry(event.item.data, event.currentIndex);
  }

  protected toggle(): void {
    this.uiState.toggle(this.node().group.id);
  }

  protected runAction(id: string): void {
    const action = this.actions.find((candidate) => candidate.id === id);
    if (!action) {
      return;
    }
    void action.run(this.node(), this.registry);
    // Moving the group moves its element, which drops the focus the closing
    // menu gave back to the ⋮ button.
    afterNextRender(() => this.menuTrigger()?.nativeElement.focus(), { injector: this.injector });
  }
}
