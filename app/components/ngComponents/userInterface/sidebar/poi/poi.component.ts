import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BroadcastService } from "services/broadcast-service/broadcast.service";
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { ElementVisibilityHelperService } from "services/element-visibility-helper-service/element-visibility-helper.service";
import { GeoresourceLayerService } from "components/ngComponents/userInterface/sidebar/poi/georesource-layer.service";
import { GeoresourceFavoritesService } from "components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service";
import { GeoresourceFilterService } from "components/ngComponents/userInterface/sidebar/poi/georesource-filter.service";
import { GeoresourceExportModeService } from "components/ngComponents/userInterface/sidebar/poi/georesource-export-mode.service";
import {
  GeoresourcesDataset,
  GeoresourcesTopicsHierarchy,
} from "../../../models/georesources.models";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import { POI_SIZES } from "../../../../../services/data-exchange-service/data-exchange.constants";
import { GeoresourceFavTabComponent } from "./georesource-fav-tab/georesource-fav-tab.component";
import { GeoresourceListTabComponent } from "./georesource-list-tab/georesource-list-tab.component";
import { GeoresourceCatalogueTabComponent } from "./georesource-catalogue-tab/georesource-catalogue-tab.component";

@Component({
  selector: "app-poi",
  templateUrl: "./poi.component.html",
  styleUrls: ["./poi.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ExpandableBoxComponent,
    GeoresourceFavTabComponent,
    GeoresourceListTabComponent,
    GeoresourceCatalogueTabComponent,
  ],
})
export class PoiComponent implements OnInit {
  showFavSelection = false;

  readonly poiSizes = POI_SIZES;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    protected dataExchangeService: DataExchangeService,
    protected layerService: GeoresourceLayerService,
    protected favoritesService: GeoresourceFavoritesService,
    protected filterService: GeoresourceFilterService,
    protected exportMode: GeoresourceExportModeService,
    private broadcastService: BroadcastService,
    private elementVisibilityHelperService: ElementVisibilityHelperService,
  ) {}

  ngOnInit(): void {
    window.setTimeout(() => {
      this.init();
    }, 2000);

    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((broadcastMsg) => {
        let title = broadcastMsg.msg;

        switch (title) {
          case "selectedIndicatorDateHasChanged":
            {
              this.layerService.selectedIndicatorDateHasChanged();
            }
            break;
          case "geoFavItemsStored":
            {
              this.favoritesService.favItemsStored();
            }
            break;
          case "LIKEinitialMetadataLoadingCompleted":
            {
              this.init();
            }
            break;
        }
      });
  }

  init() {
    this.filterService.refreshPreppedHierarchy();
    this.favoritesService.buildFavTopicsTree();

    if (
      this.elementVisibilityHelperService.elementVisibility.favSelection ===
      true
    )
      this.showFavSelection = true;

    this.favoritesService.initFromUserInfo();
  }

  searchGeoresourcesTopicsRecursive(
    dataset: GeoresourcesTopicsHierarchy,
    tree: GeoresourcesTopicsHierarchy[],
    type: string,
  ): boolean {
    let match = false;

    tree.forEach((topic) => {
      if (topic.topicId == dataset.topicId) {
        topic.isSelected = dataset.isSelected;

        match = true;
      } else {
        if (topic.subTopics.length) {
          match = this.searchGeoresourcesTopicsRecursive(
            dataset,
            topic.subTopics,
            type,
          );
        }
      }
    });

    return match;
  }

  handleShowAllOnTopic(topic: GeoresourcesTopicsHierarchy, type: string) {
    // check sibling checkbox in favs/data-catalogue dataset
    if (type == "list")
      this.searchGeoresourcesTopicsRecursive(
        topic,
        this.favoritesService.georesourceFavTopicsTree,
        type,
      );
    else
      this.searchGeoresourcesTopicsRecursive(
        topic,
        this.filterService.preppedTopicGeoresourceHierarchy,
        type,
      );

    for (let poi of topic.poiData) {
      poi.isSelected = topic.isSelected;
    }
    for (let loi of topic.loiData) {
      loi.isSelected = topic.isSelected;
    }
    for (let aoi of topic.aoiData) {
      aoi.isSelected = topic.isSelected;
    }

    var relevantDatasets = this.dataExchangeService.getGeoresourceDatasets(
      topic,
      this.filterService.georesourceNameFilter.value,
      this.filterService.showPOI,
      this.filterService.showLOI,
      this.filterService.showAOI,
      this.filterService.showWMS,
      this.filterService.showWFS,
    );

    if (topic.isSelected) {
      relevantDatasets.forEach((element) => {
        element.isSelected = true;
        this.dispatchDatasetToMap(element);
      });
    } else {
      relevantDatasets
        .filter((e) => e.isSelected)
        .forEach((element) => {
          element.isSelected = false;
          this.dispatchDatasetToMap(element);
        });
    }
  }

  private dispatchDatasetToMap(element: any) {
    if (element.isPOI || element.isLOI || element.isAOI)
      this.handleGeoresourceOnMap(element);
    else if (element.layerName) this.layerService.handleWmsOnMap(element);
    else if (element.featureTypeName) this.layerService.handleWfsOnMap(element);
    else console.error("unknown dataset", element);
  }

  handleGeoresourceOnMap(resource: GeoresourcesDataset) {
    this.checkGeoresourcesRecursive(resource);

    if (resource.isSelected) {
      this.layerService.addGeoresourceLayerToMap(resource);
    } else {
      for (const topic of this.dataExchangeService.topicGeoresourceHierarchy) {
        if (topic.topicId === resource.topicReference) topic.isSelected = false;
      }
      this.layerService.removeGeoresourceLayerFromMap(resource);
    }
  }

  checkGeoresourcesRecursive(georesource: GeoresourcesDataset) {
    this.searchGeoresourcesRecursive(
      georesource,
      this.filterService.preppedTopicGeoresourceHierarchy,
    );
  }

  searchGeoresourcesRecursive(
    georesource: GeoresourcesDataset,
    tree: GeoresourcesTopicsHierarchy[],
  ): boolean {
    let match = false;

    tree.forEach((topic) => {
      let poiMatch = topic.poiData.filter(
        (e) => e.georesourceId == georesource.georesourceId,
      );
      let aoiMatch = topic.aoiData.filter(
        (e) => e.georesourceId == georesource.georesourceId,
      );
      let loiMatch = topic.loiData.filter(
        (e) => e.georesourceId == georesource.georesourceId,
      );

      if (poiMatch.length || aoiMatch.length || loiMatch.length) {
        if (!georesource.isSelected) topic.isSelected = false;

        match = true;
      } else {
        if (topic.subTopics.length) {
          match = this.searchGeoresourcesRecursive(
            georesource,
            topic.subTopics,
          );

          if (match && !georesource.isSelected) topic.isSelected = false;
        }
      }
    });

    return match;
  }

  zoomToLayer(georesourceMetadata) {
    // todo $rootScope.$broadcast("zoomToGeoresourceLayer", georesourceMetadata);
  }
}
