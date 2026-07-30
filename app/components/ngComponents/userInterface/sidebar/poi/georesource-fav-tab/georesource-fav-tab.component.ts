import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GeoresourcesDataset,
  GeoresourcesTopicsHierarchy,
} from 'components/ngComponents/models/georesources.models';
import { ExportItemCheckboxComponent } from 'components/ngComponents/userInterface/exporting/export-item-checkbox/export-item-checkbox.component';
import { ExportingStateService } from 'components/ngComponents/userInterface/exporting/exporting-state.service';
import { GeoresourceExportModeService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-export-mode.service';
import { GeoresourceFavoritesService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service';
import { GeoresourceLayerService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';
import { GeoFavFilter } from 'pipes/georesources-fav-filter.pipe';
import { GeoFavItemFilter } from 'pipes/georesources-fav-item-filter.pipe';
import { IconTranslate } from 'pipes/icon-translate.pipe';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { MetadataExportService } from 'services/metadata-export-service/metadata-export.service';
import { OgcService } from 'services/ogcServices/ogc.service';

/**
 * The "Favoriten" tab: a recursive view of the favourite topics/datasets with
 * its own (per-fav-item filtered) dataset table. Favourite state and selection
 * logic come from {@link GeoresourceFavoritesService}; layer side effects from
 * {@link GeoresourceLayerService}. Tree-coupled selection actions
 * (toggle/showAll/zoom) are delegated to the host {@link PoiComponent}.
 */
@Component({
  selector: 'app-georesource-fav-tab',
  templateUrl: './georesource-fav-tab.component.html',
  styleUrls: ['./georesource-fav-tab.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GeoFavFilter,
    GeoFavItemFilter,
    IconTranslate,
    ExportItemCheckboxComponent,
  ],
})
export class GeoresourceFavTabComponent {
  protected favoritesService = inject(GeoresourceFavoritesService);
  protected layerService = inject(GeoresourceLayerService);
  protected exportButtonVisibility = inject(ExportButtonVisibilityService);
  protected metadataExportService = inject(MetadataExportService);
  protected ogcService = inject(OgcService);
  protected exportMode = inject(GeoresourceExportModeService);
  private exportState = inject(ExportingStateService);

  @Input() showFavSelection = false;

  @Output() toggleGeoresourceOnMap = new EventEmitter<GeoresourcesDataset>();
  @Output() showAllOnTopic = new EventEmitter<GeoresourcesTopicsHierarchy>();
  @Output() zoomToLayer = new EventEmitter<GeoresourcesDataset>();

  private expandedFavTopics = new Set<string>();

  isFavSubTopicCollapsed(topicId: string) {
    return !this.expandedFavTopics.has(topicId);
  }

  toggleFavSubTopic(topicId: string) {
    if (this.expandedFavTopics.has(topicId)) this.expandedFavTopics.delete(topicId);
    else this.expandedFavTopics.add(topicId);
  }

  /** Adds every favourite georesource currently shown in this view to the export selection. */
  selectAllForExport(): void {
    this.collectFavoriteGeoresources().forEach((dataset) =>
      this.exportState.addGeoressource(this.exportMode.toExportGeoresource(dataset))
    );
  }

  /** Removes every favourite georesource shown in this view from the export selection. */
  deselectAllForExport(): void {
    this.collectFavoriteGeoresources().forEach((dataset) =>
      this.exportState.removeGeoressource(dataset.georesourceId ?? '')
    );
  }

  /**
   * Collects all georesource datasets (POI/AOI/LOI) that are displayed in the
   * favourites view, i.e. those the {@link GeoresourceFavoritesService} deems
   * visible for their topic.
   */
  private collectFavoriteGeoresources(): GeoresourcesDataset[] {
    const result: GeoresourcesDataset[] = [];
    const walk = (topics: GeoresourcesTopicsHierarchy[]): void => {
      for (const topic of topics ?? []) {
        const items = [...topic.poiData, ...topic.aoiData, ...topic.loiData];
        for (const item of items) {
          if (this.favoritesService.FavTabShowPoi(topic, item.georesourceId)) {
            result.push(item);
          }
        }
        if (topic.subTopics?.length) {
          walk(topic.subTopics);
        }
      }
    };
    walk(this.favoritesService.georesourceFavTopicsTree);
    return result;
  }

  /** True if the topic or any of its descendants has a selected dataset. */
  checkHierarchyPoiSelected(topic: GeoresourcesTopicsHierarchy): boolean {
    if (
      topic.poiData.some((e) => e.isSelected === true) ||
      topic.aoiData.some((e) => e.isSelected === true) ||
      topic.loiData.some((e) => e.isSelected === true) ||
      topic.wmsData.some((e: any) => e.isSelected === true)
    ) {
      return true;
    }
    return topic.subTopics.some((sub) => this.checkHierarchyPoiSelected(sub));
  }
}
