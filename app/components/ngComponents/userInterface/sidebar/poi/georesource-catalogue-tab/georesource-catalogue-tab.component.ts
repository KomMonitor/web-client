import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { GeoresourceLayerService } from "components/ngComponents/userInterface/sidebar/poi/georesource-layer.service";
import { GeoresourceFavoritesService } from "components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service";
import { GeoresourceFilterService } from "components/ngComponents/userInterface/sidebar/poi/georesource-filter.service";
import {
  GeoresourcesDataset,
  GeoresourcesTopicsHierarchy,
} from "components/ngComponents/models/georesources.models";
import { GeoresourceTopicTreeComponent } from "../georesource-topic-tree/georesource-topic-tree.component";
import { GeoresourceDatasetTableComponent } from "../georesource-dataset-table/georesource-dataset-table.component";

/**
 * The "Datenkatalog" tab: the per-type filter toggles, the recursive topic tree
 * and the "ohne Themenbezug" (unmapped) dataset list. Filter state comes from
 * {@link GeoresourceFilterService}, layer/favourite side effects from the shared
 * services. Tree-coupled selection (toggle/showAll/zoom) is delegated to the
 * host {@link PoiComponent}.
 */
@Component({
  selector: "app-georesource-catalogue-tab",
  templateUrl: "./georesource-catalogue-tab.component.html",
  styleUrls: ["./georesource-catalogue-tab.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GeoresourceTopicTreeComponent,
    GeoresourceDatasetTableComponent,
  ],
})
export class GeoresourceCatalogueTabComponent {
  @Input() showFavSelection = false;

  @Output() toggleGeoresourceOnMap = new EventEmitter<GeoresourcesDataset>();
  @Output() showAllOnTopic = new EventEmitter<GeoresourcesTopicsHierarchy>();
  @Output() zoomToLayer = new EventEmitter<GeoresourcesDataset>();

  isCollapsed_noTopic = true;
  showAllForTopic_null = false;

  constructor(
    protected dataExchangeService: DataExchangeService,
    protected layerService: GeoresourceLayerService,
    protected favoritesService: GeoresourceFavoritesService,
    protected filterService: GeoresourceFilterService,
  ) {}

  toggleNoTopicHierarchy() {
    this.isCollapsed_noTopic = !this.isCollapsed_noTopic;
  }
}
