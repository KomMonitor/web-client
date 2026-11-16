import { CdkContextMenuTrigger, CdkMenuTrigger } from '@angular/cdk/menu';
import { NgTemplateOutlet } from '@angular/common';
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

import { injectLayerActions } from 'services/map-layer-registry-service/layer-actions';
import type { LayerEntryState } from 'services/map-layer-registry-service/map-layer.model';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { LayerActionsMenuComponent, type LayerMenuItem } from './layer-actions-menu.component';
import { LayerSymbolComponent } from './layer-symbol.component';
import { MapLayersPanelUiState } from './map-layers-panel-ui-state.service';

let nextInstance = 0;

/**
 * One layer of the panel: eye toggle, symbol, name, its loading / error /
 * zoom state, the ⋮ menu with its actions (also on right-click) and, opened by
 * the expand button or a click on the name, its transparency.
 */
@Component({
  selector: 'app-layer-row',
  templateUrl: './layer-row.component.html',
  styleUrls: ['./layer-row.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    TranslateModule,
    CdkMenuTrigger,
    CdkContextMenuTrigger,
    LayerActionsMenuComponent,
    LayerSymbolComponent,
  ],
})
export class LayerRowComponent {
  readonly entry = input.required<LayerEntryState>();

  private readonly registry = inject(MAP_LAYER_REGISTRY);
  private readonly uiState = inject(MapLayersPanelUiState);
  private readonly injector = inject(Injector);
  private readonly actions = injectLayerActions();

  private readonly menuTrigger = viewChild<ElementRef<HTMLButtonElement>>('menuTrigger');

  /** Layer ids are no valid element ids ('wfs:<title>'), so the row numbers its own. */
  protected readonly detailsId = `layer-row-${++nextInstance}-details`;

  protected readonly expanded = computed(() => this.uiState.isRowExpanded(this.entry().id));

  /** Transparency in percent, the inverse of the layer opacity. */
  protected readonly transparency = computed(() => Math.round((1 - this.entry().opacity) * 100));

  /** The actions that apply to this layer; follows the entry and the order of its list. */
  protected readonly menuItems = computed<LayerMenuItem[]>(() => {
    const entry = this.entry();
    return this.actions
      .filter((action) => action.appliesTo(entry, this.registry))
      .map((action) => ({
        id: action.id,
        i18nKey: action.i18nKey,
        icon: action.icon,
        disabled: !(action.enabled?.(entry, this.registry) ?? true),
      }));
  });

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

  protected runAction(id: string): void {
    const action = this.actions.find((candidate) => candidate.id === id);
    if (!action) {
      return;
    }
    void action.run(this.entry(), this.registry);
    // Moving the row moves its element, which drops the focus the closing menu
    // gave back to the ⋮ button. A removed row takes this hook with it.
    afterNextRender(() => this.menuTrigger()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Full name for the tooltip, as the row may cut it off. */
  protected fullName(): string {
    const { title, subtitle } = this.entry();
    return subtitle ? `${title} – ${subtitle}` : title;
  }
}
