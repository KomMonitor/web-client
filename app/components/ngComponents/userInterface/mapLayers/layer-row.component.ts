import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { CdkContextMenuTrigger, CdkMenuTrigger } from '@angular/cdk/menu';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import {
  type LayerPanelContext,
  injectLayerActions,
} from 'services/map-layer-registry-service/layer-actions';
import type {
  LayerEntryState,
  LayerInfo,
  LayerInfoItem,
} from 'services/map-layer-registry-service/map-layer.model';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { LayerActionsMenuComponent, type LayerMenuItem } from './layer-actions-menu.component';
import { LayerSymbolComponent } from './layer-symbol.component';
import { MapLayersPanelUiState } from './map-layers-panel-ui-state.service';

let nextInstance = 0;

/** The details below a row while they are open. */
type InfoState =
  | { status: 'loading' }
  | { status: 'ready'; items: LayerInfoItem[]; noteKey?: string }
  | { status: 'unavailable' };

/**
 * One layer of the panel: eye toggle, symbol, name, its loading / error /
 * zoom state, the ⋮ menu with its actions (also on right-click), its
 * transparency (opened by the expand button or a click on the name) and its
 * details (opened from the menu).
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
    CdkDragHandle,
    CdkMenuTrigger,
    CdkContextMenuTrigger,
    LayerActionsMenuComponent,
    LayerSymbolComponent,
  ],
})
export class LayerRowComponent {
  readonly entry = input.required<LayerEntryState>();
  /** Shows the drag handle; the group sets it where layers can be reordered. */
  readonly movable = input(false);

  private readonly registry = inject(MAP_LAYER_REGISTRY);
  private readonly uiState = inject(MapLayersPanelUiState);
  private readonly injector = inject(Injector);
  private readonly actions = injectLayerActions();

  private readonly menuTrigger = viewChild<ElementRef<HTMLButtonElement>>('menuTrigger');
  private readonly infoBox = viewChild<ElementRef<HTMLElement>>('infoBox');

  /** Layer ids are no valid element ids ('wfs:<title>'), so the row numbers its own. */
  protected readonly detailsId = `layer-row-${++nextInstance}-details`;

  protected readonly infoOpen = computed(() => this.uiState.isInfoOpen(this.entry().id));
  protected readonly info = signal<InfoState>({ status: 'loading' });
  /** Counts the requests, so an answer that arrives after a newer one is dropped. */
  private infoRequest = 0;

  private readonly panel: LayerPanelContext = {
    showInfo: (id) => this.uiState.showInfo(id),
  };

  constructor() {
    // (Re)loads the details while they are open, also when the entry is
    // replaced under the same id, e.g. on another date.
    effect(() => {
      if (!this.infoOpen()) {
        return;
      }
      const request = ++this.infoRequest;
      this.info.set({ status: 'loading' });
      this.registry.info(this.entry().id).then(
        (info) => request === this.infoRequest && this.info.set(infoState(info)),
        () => request === this.infoRequest && this.info.set({ status: 'unavailable' })
      );
    });
  }

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
    const infoWasOpen = this.infoOpen();
    void action.run(this.entry(), this.registry, this.panel);
    // Newly opened details take the focus. Otherwise it goes back to the ⋮
    // button: moving the row moves its element, which drops the focus the
    // closing menu gave back. A removed row takes this hook with it.
    afterNextRender(
      () => {
        const target = this.infoOpen() && !infoWasOpen ? this.infoBox() : this.menuTrigger();
        target?.nativeElement.focus();
      },
      { injector: this.injector }
    );
  }

  protected closeInfo(): void {
    this.uiState.closeInfo();
    afterNextRender(() => this.menuTrigger()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Full name for the tooltip, as the row may cut it off. */
  protected fullName(): string {
    const { title, subtitle } = this.entry();
    return subtitle ? `${title} – ${subtitle}` : title;
  }
}

/** Items without a value are left out; nothing left to show counts as unavailable. */
function infoState(info: LayerInfo | undefined): InfoState {
  const items = (info?.items ?? []).filter(
    (item) =>
      item.valueKey || (item.value !== undefined && item.value !== null && item.value !== '')
  );
  return items.length || info?.noteKey
    ? { status: 'ready', items, noteKey: info?.noteKey }
    : { status: 'unavailable' };
}
