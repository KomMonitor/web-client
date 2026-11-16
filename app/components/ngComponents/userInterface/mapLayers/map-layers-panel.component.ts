import { CdkDrag, type CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { BaseLayerSectionComponent } from './base-layer-section.component';
import { LayerGroupComponent } from './layer-group.component';
import { isGroupShown } from './layer-tree.util';

/**
 * The layer panel ("Kartenebenen"): renders the tree of the registry it is
 * given through `MAP_LAYER_REGISTRY` and turns clicks into registry commands.
 * Top-level groups are reordered by dragging their handle, which only asks the
 * registry to move them. It knows no Leaflet and makes no assumptions about its
 * container, so it can sit in the sidebar or anywhere else.
 */
@Component({
  selector: 'app-map-layers-panel',
  templateUrl: './map-layers-panel.component.html',
  styleUrls: ['./map-layers-panel.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, CdkDropList, CdkDrag, BaseLayerSectionComponent, LayerGroupComponent],
})
export class MapLayersPanelComponent {
  protected readonly registry = inject(MAP_LAYER_REGISTRY);

  /** The top-level groups the panel shows, top to bottom. */
  protected readonly shownGroups = computed(() => this.registry.tree().filter(isGroupShown));

  /**
   * Moves the dragged group to where it was dropped. The drop indexes count
   * the shown groups only, so the target is looked up in the whole tree.
   */
  protected dropGroup(event: CdkDragDrop<unknown, unknown, string>): void {
    const tree = this.registry.tree();
    const target = tree.filter(isGroupShown)[event.currentIndex];
    if (target) {
      this.registry.moveGroup(event.item.data, tree.indexOf(target));
    }
  }
}
