import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { LayerEntryState } from 'services/map-layer-registry-service/map-layer.model';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { LayerSymbolComponent } from './layer-symbol.component';
import { MapLayersPanelUiState } from './map-layers-panel-ui-state.service';

let nextInstance = 0;

/**
 * One layer of the panel: eye toggle, symbol, name, its loading / error /
 * zoom state and, opened by the expand button or a click on the name, its
 * transparency.
 */
@Component({
  selector: 'app-layer-row',
  templateUrl: './layer-row.component.html',
  styleUrls: ['./layer-row.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TranslateModule, LayerSymbolComponent],
})
export class LayerRowComponent {
  readonly entry = input.required<LayerEntryState>();

  private readonly registry = inject(MAP_LAYER_REGISTRY);
  private readonly uiState = inject(MapLayersPanelUiState);

  /** Layer ids are no valid element ids ('wfs:<title>'), so the row numbers its own. */
  protected readonly detailsId = `layer-row-${++nextInstance}-details`;

  protected readonly expanded = computed(() => this.uiState.isRowExpanded(this.entry().id));

  /** Transparency in percent, the inverse of the layer opacity. */
  protected readonly transparency = computed(() => Math.round((1 - this.entry().opacity) * 100));

  protected toggleVisible(): void {
    const entry = this.entry();
    this.registry.setVisible(entry.id, !entry.visible);
  }

  protected toggleExpanded(): void {
    this.uiState.toggleRow(this.entry().id);
  }

  protected setTransparency(value: string): void {
    this.registry.setOpacity(this.entry().id, (100 - Number(value)) / 100);
  }

  /** Full name for the tooltip, as the row may cut it off. */
  protected fullName(): string {
    const { title, subtitle } = this.entry();
    return subtitle ? `${title} – ${subtitle}` : title;
  }
}
