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
import type { LayerTreeNode } from 'services/map-layer-registry-service/map-layer.model';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { LayerActionsMenuComponent, type LayerMenuItem } from './layer-actions-menu.component';
import { LayerRowComponent } from './layer-row.component';
import { isGroupShown } from './layer-tree.util';
import { MapLayersPanelUiState } from './map-layers-panel-ui-state.service';

/**
 * One group of the panel with its sub groups or layers. Recursive, so it
 * carries deeper trees too; `depth` 0 is a top-level group. A group whose
 * actions apply (by default: moving top-level groups) gets a ⋮ menu next to
 * its header.
 */
@Component({
  selector: 'app-layer-group',
  templateUrl: './layer-group.component.html',
  styleUrls: ['./layer-group.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    CdkMenuTrigger,
    LayerActionsMenuComponent,
    LayerRowComponent,
    LayerGroupComponent,
  ],
})
export class LayerGroupComponent {
  readonly node = input.required<LayerTreeNode>();
  readonly depth = input(0);

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
