import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { LayerTreeNode } from 'services/map-layer-registry-service/map-layer.model';

import { LayerRowComponent } from './layer-row.component';
import { MapLayersPanelUiState } from './map-layers-panel-ui-state.service';

/**
 * One group of the panel with its sub groups or layers. Recursive, so it
 * carries deeper trees too; `depth` 0 is a top-level group.
 */
@Component({
  selector: 'app-layer-group',
  templateUrl: './layer-group.component.html',
  styleUrls: ['./layer-group.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, LayerRowComponent, LayerGroupComponent],
})
export class LayerGroupComponent {
  readonly node = input.required<LayerTreeNode>();
  readonly depth = input(0);

  private readonly uiState = inject(MapLayersPanelUiState);

  protected readonly expanded = computed(() => this.uiState.isExpanded(this.node().group.id));
  protected readonly bodyId = computed(() => `map-layer-group-${this.node().group.id}`);

  protected toggle(): void {
    this.uiState.toggle(this.node().group.id);
  }
}
