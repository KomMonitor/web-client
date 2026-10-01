import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TopicElementComponent,
  TopicElementTopic,
} from 'components/ngComponents/common/topic-element/topic-element.component';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { GeoresourceLayerService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-layer.service';
import { GeoresourceFavoritesService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-favorites.service';
import { GeoresourceFilterService } from 'components/ngComponents/userInterface/sidebar/poi/georesource-filter.service';
import {
  GeoresourcesDataset,
  GeoresourcesTopicsHierarchy,
} from 'components/ngComponents/models/georesources.models';
import { GeoresourceTopicTreeComponent } from '../georesource-topic-tree/georesource-topic-tree.component';
import { GeoresourceVectorElementComponent } from '../georesource-vector-element/georesource-vector-element.component';
import { GeoresourceWmsElementComponent } from '../georesource-wms-element/georesource-wms-element.component';
import { GeoresourceWfsElementComponent } from '../georesource-wfs-element/georesource-wfs-element.component';

/**
 * The "Datenkatalog" tab: the per-type filter toggles, the recursive topic tree
 * and the "ohne Themenbezug" (unmapped) dataset list. Filter state comes from
 * {@link GeoresourceFilterService}, layer/favourite side effects from the shared
 * services. Tree-coupled selection (toggle/showAll/zoom) is delegated to the
 * host {@link PoiComponent}.
 */
@Component({
  selector: 'app-georesource-catalogue-tab',
  templateUrl: './georesource-catalogue-tab.component.html',
  styleUrls: ['./georesource-catalogue-tab.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    GeoresourceTopicTreeComponent,
    GeoresourceVectorElementComponent,
    GeoresourceWmsElementComponent,
    GeoresourceWfsElementComponent,
    TopicElementComponent,
  ],
})
export class GeoresourceCatalogueTabComponent {
  protected topicHierarchyStore = inject(TopicHierarchyStoreService);
  protected layerService = inject(GeoresourceLayerService);
  protected favoritesService = inject(GeoresourceFavoritesService);
  protected filterService = inject(GeoresourceFilterService);

  @Input() showFavSelection = false;

  @Output() toggleGeoresourceOnMap = new EventEmitter<GeoresourcesDataset>();
  @Output() showAllOnTopic = new EventEmitter<GeoresourcesTopicsHierarchy>();
  @Output() zoomToLayer = new EventEmitter<GeoresourcesDataset>();

  isCollapsed_noTopic = true;
  showAllForTopic_null = false;

  toggleNoTopicHierarchy() {
    this.isCollapsed_noTopic = !this.isCollapsed_noTopic;
  }

  /**
   * The "ohne Themenbezug" bucket has no backing topic (just dataset counts), so
   * this wraps it as a minimal topic-like object to render through `app-topic-element`.
   */
  noTopicElement(): TopicElementTopic {
    return {
      topicId: 'no-topic',
      topicName: 'ohne Themenbezug',
      topicDescription: 'Georessourcen-Daten ohne Themenbezug',
      subTopics: [],
      ...this.topicHierarchyStore.topicGeoresourceHierarchy_unmappedEntries,
    };
  }

  /**
   * Toggles every dataset listed under "ohne Themenbezug" on/off the map. Unlike
   * the real topics (toggled via `showAllOnTopic` → `PoiComponent.handleShowAllOnTopic`,
   * which resolves membership through the topic hierarchy), these datasets aren't
   * tracked in any hierarchy, so they're toggled and dispatched directly here.
   */
  onToggleShowAllForNoTopic(selected: boolean): void {
    const entries = this.topicHierarchyStore.topicGeoresourceHierarchy_unmappedEntries;

    const geoDatasets = [...entries.poiData, ...entries.loiData, ...entries.aoiData];
    const relevantGeoDatasets = selected ? geoDatasets : geoDatasets.filter((d) => d.isSelected);
    for (const dataset of relevantGeoDatasets) {
      dataset.isSelected = selected;
      this.toggleGeoresourceOnMap.emit(dataset);
    }

    const relevantWmsDatasets = selected
      ? entries.wmsData
      : entries.wmsData.filter((d) => d.isSelected);
    for (const dataset of relevantWmsDatasets) {
      dataset.isSelected = selected;
      this.layerService.handleWmsOnMap(dataset);
    }

    const relevantWfsDatasets = selected
      ? entries.wfsData
      : entries.wfsData.filter((d) => d.isSelected);
    for (const dataset of relevantWfsDatasets) {
      dataset.isSelected = selected;
      this.layerService.handleWfsOnMap(dataset);
    }
  }
}
