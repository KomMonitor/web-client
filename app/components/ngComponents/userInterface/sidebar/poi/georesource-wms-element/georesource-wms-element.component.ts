import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { FavoriteStarComponent } from 'components/ngComponents/common/favorite-star/favorite-star.component';
import { GeoresourceElementComponent } from 'components/ngComponents/userInterface/sidebar/poi/georesource-element/georesource-element.component';

/**
 * One WMS layer rendered as a card-style row, the WMS counterpart of
 * {@link GeoresourceVectorElementComponent}. Unlike the vector dataset types, a
 * WMS layer carries no per-dataset date and no zoom-to-layer action (both are
 * meaningless for an external map service), and its "legend" is a
 * lazily-loaded GetLegendGraphic image instead of a marker/colour preview.
 *
 * `dataset` is typed loosely (`any`), matching the rest of the WMS handling
 * in this area; at runtime it is a `WmsDataset`, whose URL/layer name live
 * under `connectionDetails.baseUrl`/`connectionDetails.layerName`.
 */
@Component({
  selector: 'app-georesource-wms-element',
  templateUrl: './georesource-wms-element.component.html',
  styleUrls: ['./georesource-wms-element.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, FavoriteStarComponent, GeoresourceElementComponent],
})
export class GeoresourceWmsElementComponent {
  protected exportButtonVisibility = inject(ExportButtonVisibilityService);
  protected ogcService = inject(OgcService);

  @Input({ required: true }) dataset!: any;
  @Input() showFavSelection = false;
  @Input() isFavorite = false;
  /** Nesting depth of the enclosing topic, for the same per-level row color `app-topic-element` uses. */
  @Input() level = 0;

  @Output() toggleWmsOnMap = new EventEmitter<any>();
  @Output() favToggled = new EventEmitter<string | null | undefined>();

  onToggle(): void {
    this.dataset.isSelected = !this.dataset.isSelected;
    this.toggleWmsOnMap.emit(this.dataset);
  }

  onLoadLegend(): void {
    this.dataset.showLegend = true;
  }
}
