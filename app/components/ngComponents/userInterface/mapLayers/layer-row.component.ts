import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import type { LayerEntryState } from 'services/map-layer-registry-service/map-layer.model';
import { MAP_LAYER_REGISTRY } from 'services/map-layer-registry-service/map-layer-registry.service';

/** One layer of the panel: eye toggle and name. */
@Component({
  selector: 'app-layer-row',
  templateUrl: './layer-row.component.html',
  styleUrls: ['./layer-row.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule],
})
export class LayerRowComponent {
  readonly entry = input.required<LayerEntryState>();

  private readonly registry = inject(MAP_LAYER_REGISTRY);

  protected toggleVisible(): void {
    const entry = this.entry();
    this.registry.setVisible(entry.id, !entry.visible);
  }

  /** Full name for the tooltip, as the row may cut it off. */
  protected fullName(): string {
    const { title, subtitle } = this.entry();
    return subtitle ? `${title} – ${subtitle}` : title;
  }
}
