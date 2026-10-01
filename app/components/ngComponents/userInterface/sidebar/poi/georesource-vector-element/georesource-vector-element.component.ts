import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconTranslate } from 'pipes/icon-translate.pipe';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { FavoriteStarComponent } from 'components/ngComponents/common/favorite-star/favorite-star.component';
import { ExportItemCheckboxComponent } from 'components/ngComponents/userInterface/exporting/export-item-checkbox/export-item-checkbox.component';
import { GeoresourceElementComponent } from 'components/ngComponents/userInterface/sidebar/poi/georesource-element/georesource-element.component';
import { GeoresourceExportModeService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-export-mode.service';

export type GeoresourceVectorKind = 'poi' | 'loi' | 'aoi';

/**
 * One POI/LOI/AOI dataset rendered as a card-style row (symbol, legend
 * preview, title, date selection, export/metadata icons, favourite star).
 * The three geometry types share everything but the symbol icon and the
 * legend preview (POI: marker icon/colour; LOI/AOI: a flat colour swatch
 * off `loiColor`/`aoiColor`) — `kind` picks between them.
 *
 * There is no selection checkbox: clicking the row itself toggles
 * `dataset.isSelected` and loads/unloads the feature on the map, so several
 * rows can be toggled independently. The description is shown as the row's
 * hover title instead of its own column, mirroring `app-topic-element`.
 *
 * Purely presentational beyond that mutation: map/favourite side effects are
 * delegated to the parent via outputs.
 */
@Component({
  selector: 'app-georesource-vector-element',
  templateUrl: './georesource-vector-element.component.html',
  styleUrls: ['./georesource-vector-element.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconTranslate,
    FavoriteStarComponent,
    ExportItemCheckboxComponent,
    GeoresourceElementComponent,
  ],
})
export class GeoresourceVectorElementComponent {
  protected exportButtonVisibility = inject(ExportButtonVisibilityService);
  protected metadataExportService = inject(MetadataExportService);
  protected exportMode = inject(GeoresourceExportModeService);

  @Input({ required: true }) dataset!: GeoresourcesDataset;
  @Input({ required: true }) kind!: GeoresourceVectorKind;
  @Input() showFavSelection = false;
  @Input() showPerDatasetDateColumn = true;
  @Input() isFavorite = false;
  /** Nesting depth of the enclosing topic, for the same per-level row color `app-topic-element` uses. */
  @Input() level = 0;

  @Output() toggleGeoresourceOnMap = new EventEmitter<GeoresourcesDataset>();
  @Output() selectedDateChange = new EventEmitter<GeoresourcesDataset>();
  @Output() zoomToLayer = new EventEmitter<GeoresourcesDataset>();
  @Output() exportGeoresource = new EventEmitter<GeoresourcesDataset>();
  @Output() favToggled = new EventEmitter<string | null | undefined>();

  protected readonly symbolIconClass: Record<GeoresourceVectorKind, string> = {
    poi: 'fas fa-map-marker-alt',
    loi: 'fas fa-minus',
    aoi: 'far fa-square',
  };

  onToggle(): void {
    this.dataset.isSelected = !this.dataset.isSelected;
    this.toggleGeoresourceOnMap.emit(this.dataset);
  }

  /** Stops the zoom click from also bubbling into the row's own toggle handler. */
  onZoom(event: Event): void {
    event.stopPropagation();
    this.zoomToLayer.emit(this.dataset);
  }

  /** LOI/AOI carry their own flat colour field; POI uses the marker legend instead. */
  get legendColor(): string | undefined {
    return this.kind === 'loi' ? this.dataset.loiColor : this.dataset.aoiColor;
  }
}
