import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { BaseLayerThumbnail } from 'services/map-layer-registry-service/map-layer.model';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { MapLayersPanelUiState } from './map-layers-panel-ui-state.service';

let nextInstance = 0;

/**
 * The base layer block of the layer panel: collapsed it names the active base
 * layer, expanded it shows a gallery with the empty map first and a
 * transparency slider. The gallery is a group of native radio buttons, so
 * arrow keys, tab and screen readers work as for any radio group.
 */
@Component({
  selector: 'app-base-layer-section',
  templateUrl: './base-layer-section.component.html',
  styleUrls: ['./base-layer-section.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TranslateModule],
})
export class BaseLayerSectionComponent {
  protected readonly registry = inject(MAP_LAYER_REGISTRY);
  private readonly uiState = inject(MapLayersPanelUiState);

  /** Unique per instance: the radio group name and the ids labels point to. */
  protected readonly instanceId = `base-layer-section-${++nextInstance}`;

  protected readonly expanded = this.uiState.baseLayersExpanded;
  protected readonly active = this.registry.activeBaseLayer;

  /** Transparency in percent, the inverse of the base layer opacity. */
  protected readonly transparency = computed(() =>
    Math.round((1 - this.registry.baseLayerOpacity()) * 100)
  );

  /** Thumbnails that failed to load show the icon instead. */
  private readonly failedThumbnails = signal<ReadonlySet<string>>(new Set());

  protected toggle(): void {
    this.uiState.toggleBaseLayers();
  }

  protected choose(id: string | null): void {
    this.registry.setBaseLayer(id);
  }

  protected setTransparency(value: string): void {
    this.registry.setBaseLayerOpacity((100 - Number(value)) / 100);
  }

  /** The image to show, or null for the icon. */
  protected image(thumbnail: BaseLayerThumbnail | null): BaseLayerThumbnail | null {
    return thumbnail && !this.failedThumbnails().has(thumbnail.url) ? thumbnail : null;
  }

  protected thumbnailFailed(url: string): void {
    this.failedThumbnails.update((failed) => new Set(failed).add(url));
  }
}
