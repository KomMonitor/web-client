import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { LayerSymbol } from 'services/map-layer-registry-service/map-layer.model';

/**
 * The small symbol in front of a layer's name, drawn from its `LayerSymbol`:
 * a filled square, a dot, a line, an outline, rings for isochrones or an icon
 * for a service. Decorative only, the name next to it says what it is.
 */
@Component({
  selector: 'app-layer-symbol',
  templateUrl: './layer-symbol.component.html',
  styleUrls: ['./layer-symbol.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerSymbolComponent {
  readonly symbol = input.required<LayerSymbol>();
}
