import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'ngx-color-picker';
import { IconTranslate } from 'pipes/icon-translate.pipe';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { GeoresourceElementComponent } from 'components/ngComponents/userInterface/sidebar/poi/georesource-element/georesource-element.component';
import {
  getWfsColor,
  setWfsColor,
} from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';

/**
 * One WFS layer rendered as a card-style row, the WFS counterpart of
 * {@link GeoresourceVectorElementComponent}. A WFS layer carries no per-dataset
 * date, no zoom-to-layer action and no favourite (none of the three exist for
 * WFS today, matching the previous table). Its "legend" is either a colour
 * picker swatch (line/area geometry) or the same marker preview POI
 * georesources use (point geometry).
 *
 * `dataset` is typed loosely (`any`), matching the rest of the WFS handling
 * in this area: the runtime objects carry fields (geometryType, loiColor/
 * aoiColor, poiMarker*) that are not part of a single declared model.
 */
@Component({
  selector: 'app-georesource-wfs-element',
  templateUrl: './georesource-wfs-element.component.html',
  styleUrls: ['./georesource-wfs-element.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconTranslate,
    ColorPickerModule,
    GeoresourceElementComponent,
  ],
})
export class GeoresourceWfsElementComponent {
  protected exportButtonVisibility = inject(ExportButtonVisibilityService);
  protected ogcService = inject(OgcService);

  @Input({ required: true }) dataset!: any;
  /** Nesting depth of the enclosing topic, for the same per-level row color `app-topic-element` uses. */
  @Input() level = 0;

  @Output() toggleWfsOnMap = new EventEmitter<any>();
  @Output() wfsColorChange = new EventEmitter<any>();

  onToggle(): void {
    this.dataset.isSelected = !this.dataset.isSelected;
    this.toggleWfsOnMap.emit(this.dataset);
  }

  wfsColor(): string {
    return getWfsColor(this.dataset);
  }

  /**
   * Mirrors how the other outputs here work: mutate the dataset, then emit it —
   * the consumer hands the same object to `GeoresourceLayerService`, which reads
   * the new colour off it.
   */
  onWfsColorChange(color: string): void {
    setWfsColor(this.dataset, color);
    this.wfsColorChange.emit(this.dataset);
  }
}
