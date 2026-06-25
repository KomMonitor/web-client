import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { GeoFavFilter } from "pipes/georesources-fav-filter.pipe";
import { GeoFavItemFilter } from "pipes/georesources-fav-item-filter.pipe";
import { IconTranslate } from "pipes/icon-translate.pipe";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { MetadataExportService } from "services/metadata-export-service/metadata-export.service";
import { OgcService } from "services/ogcServices/ogc.service";
import { GeoresourceLayerService } from "components/ngComponents/userInterface/sidebar/poi/georesource-layer.service";
import { GeoresourceFavoritesService } from "components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service";
import {
  GeoresourcesDataset,
  GeoresourcesTopicsHierarchy,
} from "components/ngComponents/models/georesources.models";
import { ExportItemCheckboxComponent } from "components/ngComponents/userInterface/exporting/export-item-checkbox/export-item-checkbox.component";
import { GeoresourceExportModeService } from "components/ngComponents/userInterface/sidebar/poi/georesource-export-mode.service";

/**
 * The "Favoriten" tab: a recursive view of the favourite topics/datasets with
 * its own (per-fav-item filtered) dataset table. Favourite state and selection
 * logic come from {@link GeoresourceFavoritesService}; layer side effects from
 * {@link GeoresourceLayerService}. Tree-coupled selection actions
 * (toggle/showAll/zoom) are delegated to the host {@link PoiComponent}.
 */
@Component({
  selector: "app-georesource-fav-tab",
  templateUrl: "./georesource-fav-tab.component.html",
  styleUrls: ["./georesource-fav-tab.component.scss"],
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
  @Input() showFavSelection = false;

  @Output() toggleGeoresourceOnMap = new EventEmitter<GeoresourcesDataset>();
  @Output() showAllOnTopic = new EventEmitter<GeoresourcesTopicsHierarchy>();
  @Output() zoomToLayer = new EventEmitter<GeoresourcesDataset>();

  private expandedFavTopics = new Set<string>();

  constructor(
    protected favoritesService: GeoresourceFavoritesService,
    protected layerService: GeoresourceLayerService,
    protected dataExchangeService: DataExchangeService,
    protected metadataExportService: MetadataExportService,
    protected ogcService: OgcService,
    protected exportMode: GeoresourceExportModeService,
  ) {}

  isFavSubTopicCollapsed(topicId: string) {
    return !this.expandedFavTopics.has(topicId);
  }

  toggleFavSubTopic(topicId: string) {
    if (this.expandedFavTopics.has(topicId))
      this.expandedFavTopics.delete(topicId);
    else this.expandedFavTopics.add(topicId);
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
