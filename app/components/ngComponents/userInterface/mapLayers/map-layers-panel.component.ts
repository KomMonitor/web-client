import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

import { LayerGroupComponent } from './layer-group.component';
import { isGroupShown } from './layer-tree.util';

/**
 * The layer panel ("Kartenebenen"): renders the tree of the registry it is
 * given through `MAP_LAYER_REGISTRY` and turns clicks into registry commands.
 * It knows no Leaflet and makes no assumptions about its container, so it can
 * sit in the sidebar or anywhere else.
 */
@Component({
  selector: 'app-map-layers-panel',
  templateUrl: './map-layers-panel.component.html',
  styleUrls: ['./map-layers-panel.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, LayerGroupComponent],
})
export class MapLayersPanelComponent {
  protected readonly registry = inject(MAP_LAYER_REGISTRY);
  protected readonly isGroupShown = isGroupShown;
}
