import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconTranslate } from 'pipes/icon-translate.pipe';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { GeoresourcesDataset } from 'components/ngComponents/models/georesources.models';
import { ExportItemCheckboxComponent } from 'components/ngComponents/userInterface/exporting/export-item-checkbox/export-item-checkbox.component';
import { GeoresourceExportModeService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-export-mode.service';
import {
  getWfsColor,
  setWfsColor,
} from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';
import { ColorPickerModule } from 'ngx-color-picker';

/**
 * The set of dataset arrays held by a single node of the georesource topic
 * hierarchy (or by the "unmapped entries" bucket). The arrays are typed as
 * `any[]` to match the rest of the codebase: the runtime objects carry
 * properties (e.g. WMS `url`/`layerName`) that are not declared on the typed
 * models, and the source collections are themselves loosely typed.
 */
export interface GeoresourceDatasetGroup {
  poiData: any[];
  loiData: any[];
  aoiData: any[];
  wmsData: any[];
  wfsData: any[];
}

/**
 * Renders the recurring "Typ / Datensatz / Beschreibung / Legende / Lebenszeit /
 * Export" table for one node of the georesource hierarchy. Previously this table
 * was duplicated for every topic level (0-3) plus the unmapped-entries bucket.
 *
 * The component is purely presentational: layer/map/favourite side effects are
 * delegated to the parent via outputs, while stateless display helpers
 * (legend/capabilities URLs, metadata PDF download, export-button flag) reuse the
 * shared singleton services directly.
 */
@Component({
  selector: 'app-georesource-dataset-table',
  templateUrl: './georesource-dataset-table.component.html',
  styleUrls: ['./georesource-dataset-table.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconTranslate,
    ExportItemCheckboxComponent,
    ColorPickerModule,
  ],
})
export class GeoresourceDatasetTableComponent {
  protected exportButtonVisibility = inject(ExportButtonVisibilityService);
  protected metadataExportService = inject(MetadataExportService);
  protected ogcService = inject(OgcService);
  protected exportMode = inject(GeoresourceExportModeService);

  @Input({ required: true }) datasets!: GeoresourceDatasetGroup;
  @Input() showFavSelection = false;
  @Input() showPerDatasetDateColumn = true;
  @Input() poiFavItems: string[] = [];
  @Input() wmsFavItems: string[] = [];

  @Output() toggleGeoresourceOnMap = new EventEmitter<GeoresourcesDataset>();
  @Output() toggleWmsOnMap = new EventEmitter<any>();
  @Output() toggleWfsOnMap = new EventEmitter<any>();
  @Output() selectedDateChange = new EventEmitter<GeoresourcesDataset>();
  @Output() zoomToLayer = new EventEmitter<GeoresourcesDataset>();
  @Output() exportGeoresource = new EventEmitter<GeoresourcesDataset>();
  @Output() poiFavClick = new EventEmitter<string | null | undefined>();
  @Output() wmsFavClick = new EventEmitter<string | null | undefined>();
  @Output() wfsColorChange = new EventEmitter<any>();

  isPoiFav(id: string | null | undefined): boolean {
    return !!id && this.poiFavItems.includes(id);
  }

  isWmsFav(id: string | null | undefined): boolean {
    return !!id && this.wmsFavItems.includes(id);
  }

  /** Colour shown in the WFS row's swatch, with the Leaflet default as fallback. */
  wfsColor(dataset: any): string {
    return getWfsColor(dataset);
  }

  /**
   * Mirrors how the other outputs here work: mutate the dataset, then emit it —
   * the consumer hands the same object to `GeoresourceLayerService`, which reads
   * the new colour off it.
   */
  onWfsColorChange(color: string, dataset: any): void {
    setWfsColor(dataset, color);
    this.wfsColorChange.emit(dataset);
  }
}
