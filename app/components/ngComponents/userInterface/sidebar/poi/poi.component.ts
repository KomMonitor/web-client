import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { BroadcastMessage } from 'services/broadcast-service/broadcast-message';
import {
  MetadataBootstrapService,
  MetadataLoadingState,
} from 'services/metadata-bootstrap-service/metadata-bootstrap.service';
import { PoiPresentationService } from 'services/poi-presentation-service/poi-presentation.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { ElementVisibilityHelperService } from 'services/element-visibility-helper-service/element-visibility-helper.service';
import { GeoresourceLayerService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';
import { GeoresourceFavoritesService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service';
import { GeoresourceFilterService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-filter.service';
import { GeoresourceExportModeService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-export-mode.service';
import {
  GeoresourcesDataset,
  GeoresourcesTopicsHierarchy,
} from '../../../models/georesources.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpandableBoxComponent } from 'components/ngComponents/common/expandable-box/expandable-box.component';
import { POI_SIZES } from 'services/poi-presentation-service/poi-presentation.service';
import { GeoresourceFavTabComponent } from './georesource-fav-tab/georesource-fav-tab.component';
import { GeoresourceListTabComponent } from './georesource-list-tab/georesource-list-tab.component';
import { GeoresourceCatalogueTabComponent } from './georesource-catalogue-tab/georesource-catalogue-tab.component';

@Component({
  selector: 'app-poi',
  templateUrl: './poi.component.html',
  styleUrls: ['./poi.component.scss'],
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
  protected poiPresentationService = inject(PoiPresentationService);
  private topicHierarchyStore = inject(TopicHierarchyStoreService);
  protected georesourceStore = inject(GeoresourceMetadataStoreService);
  protected layerService = inject(GeoresourceLayerService);
  protected favoritesService = inject(GeoresourceFavoritesService);
  protected filterService = inject(GeoresourceFilterService);
  protected exportMode = inject(GeoresourceExportModeService);
  private broadcastService = inject(BroadcastService);
  private metadataBootstrap = inject(MetadataBootstrapService);
  private elementVisibilityHelperService = inject(ElementVisibilityHelperService);

  showFavSelection = false;

  readonly poiSizes = POI_SIZES;

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // (Re-)initialize whenever metadata loading completes — on the initial load
    // and on every global filter reload. Replaces the former fixed 2s timeout
    // and the former metadata-loading-completed broadcast. No skip() here so a
    // late mount still initializes from the already-completed state.
    this.metadataBootstrap.metadataLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        if (state === MetadataLoadingState.COMPLETE) {
          this.init();
        }
      });

    this.broadcastService.currentBroadcastMsg
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((broadcastMsg) => {
        const title = broadcastMsg.msg;

        switch (title) {
          case BroadcastMessage.SelectedIndicatorDateHasChanged:
            {
              this.layerService.selectedIndicatorDateHasChanged();
            }
            break;
          case BroadcastMessage.GeoFavItemsStored:
            {
              this.favoritesService.favItemsStored();
            }
            break;
        }
      });
  }

  init() {
    this.filterService.refreshPreppedHierarchy();
    this.favoritesService.buildFavTopicsTree();

    if (this.elementVisibilityHelperService.elementVisibility.favSelection === true)
      this.showFavSelection = true;

    this.favoritesService.initFromUserInfo();
  }

  searchGeoresourcesTopicsRecursive(
    dataset: GeoresourcesTopicsHierarchy,
    tree: GeoresourcesTopicsHierarchy[],
    type: string
  ): boolean {
    let match = false;

    tree.forEach((topic) => {
      if (topic.topicId == dataset.topicId) {
        topic.isSelected = dataset.isSelected;

        match = true;
      } else {
        if (topic.subTopics.length) {
          match = this.searchGeoresourcesTopicsRecursive(dataset, topic.subTopics, type);
        }
      }
    });

    return match;
  }

  handleShowAllOnTopic(topic: GeoresourcesTopicsHierarchy, type: string) {
    // check sibling checkbox in favs/data-catalogue dataset
    if (type == 'list')
      this.searchGeoresourcesTopicsRecursive(
        topic,
        this.favoritesService.georesourceFavTopicsTree,
        type
      );
    else
      this.searchGeoresourcesTopicsRecursive(
        topic,
        this.filterService.preppedTopicGeoresourceHierarchy,
        type
      );

    for (const poi of topic.poiData) {
      poi.isSelected = topic.isSelected;
    }
    for (const loi of topic.loiData) {
      loi.isSelected = topic.isSelected;
    }
    for (const aoi of topic.aoiData) {
      aoi.isSelected = topic.isSelected;
    }

    const relevantDatasets = this.georesourceStore.getGeoresourceDatasets(
      topic,
      this.filterService.georesourceNameFilter.value,
      this.filterService.showPOI,
      this.filterService.showLOI,
      this.filterService.showAOI,
      this.filterService.showWMS,
      this.filterService.showWFS
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
    if (element.isPOI || element.isLOI || element.isAOI) this.handleGeoresourceOnMap(element);
    else if (element.layerName) this.layerService.handleWmsOnMap(element);
    else if (element.featureTypeName) this.layerService.handleWfsOnMap(element);
    else console.error('unknown dataset', element);
  }

  handleGeoresourceOnMap(resource: GeoresourcesDataset) {
    this.checkGeoresourcesRecursive(resource);

    if (resource.isSelected) {
      this.layerService.addGeoresourceLayerToMap(resource);
    } else {
      for (const topic of this.topicHierarchyStore.topicGeoresourceHierarchy) {
        if (topic.topicId === resource.topicReference) topic.isSelected = false;
      }
      this.layerService.removeGeoresourceLayerFromMap(resource);
    }
  }

  checkGeoresourcesRecursive(georesource: GeoresourcesDataset) {
    this.searchGeoresourcesRecursive(
      georesource,
      this.filterService.preppedTopicGeoresourceHierarchy
    );
  }

  searchGeoresourcesRecursive(
    georesource: GeoresourcesDataset,
    tree: GeoresourcesTopicsHierarchy[]
  ): boolean {
    let match = false;

    tree.forEach((topic) => {
      const poiMatch = topic.poiData.filter((e) => e.georesourceId == georesource.georesourceId);
      const aoiMatch = topic.aoiData.filter((e) => e.georesourceId == georesource.georesourceId);
      const loiMatch = topic.loiData.filter((e) => e.georesourceId == georesource.georesourceId);

      if (poiMatch.length || aoiMatch.length || loiMatch.length) {
        if (!georesource.isSelected) topic.isSelected = false;

        match = true;
      } else {
        if (topic.subTopics.length) {
          match = this.searchGeoresourcesRecursive(georesource, topic.subTopics);

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
