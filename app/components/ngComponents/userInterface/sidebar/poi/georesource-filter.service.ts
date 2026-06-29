import { inject, Injectable } from '@angular/core';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { EnvConfigService } from 'services/env-config-service/env-config.service';

/**
 * Holds the shared georesource catalogue filter state (keyword + per-type
 * toggles) and the resulting keyword/type-filtered topic hierarchy. This state
 * is shared across the sidebar header (keyword input), the catalogue tab (type
 * toggles + tree) and the alphabetical list tab, so it lives in a service rather
 * than in {@link PoiComponent}.
 */
@Injectable({ providedIn: 'root' })
export class GeoresourceFilterService {
  private readonly topicHierarchyStore = inject(TopicHierarchyStoreService);
  private readonly georesourceStore = inject(GeoresourceMetadataStoreService);
  private readonly envConfigService = inject(EnvConfigService);

  enabledGeoresourcesInfrastructure = this.envConfigService.enabledGeoresourcesInfrastructure;
  enabledGeoresourcesGeoservices = this.envConfigService.enabledGeoresourcesGeoservices;

  showPOI = this.isGeoresourceInfrastructureEnabled('poi');
  showLOI = this.isGeoresourceInfrastructureEnabled('loi');
  showAOI = this.isGeoresourceInfrastructureEnabled('aoi');
  showWMS = this.isGeoresourceGeoserviceEnabled('wms');
  showWFS = this.isGeoresourceGeoserviceEnabled('wfs');

  georesourceNameFilter: { value: any } = { value: undefined };

  preppedTopicGeoresourceHierarchy!: any;

  isGeoresourceInfrastructureEnabled(id) {
    return this.enabledGeoresourcesInfrastructure.indexOf(id) !== -1;
  }

  isGeoresourceGeoserviceEnabled(id) {
    return this.enabledGeoresourcesGeoservices.indexOf(id) !== -1;
  }

  /** (Re)builds the keyword/type-filtered topic hierarchy for the catalogue. */
  refreshPreppedHierarchy(): void {
    this.preppedTopicGeoresourceHierarchy = this.prepareTopicGeoresourceHierarchyRecursive(
      this.topicHierarchyStore.topicGeoresourceHierarchy
    );
  }

  onChangeGeoresourceKeywordFilter() {
    this.georesourceStore.onChangeGeoresourceKeywordFilter(
      this.georesourceNameFilter.value,
      this.showPOI,
      this.showLOI,
      this.showAOI,
      this.showWMS,
      this.showWFS
    );

    setTimeout(() => {
      this.refreshPreppedHierarchy();
    }, 250);
  }

  prepareTopicGeoresourceHierarchyRecursive(tree: any[]) {
    const retTree: any[] = tree.filter((e) => e.totalCount > 0);

    retTree.forEach((elem: any) => {
      if (elem.poiData.length > 0) {
        elem.poiData.forEach((poiElem) => {
          poiElem.selectedDate = poiElem.availablePeriodsOfValidity[0];
        });
      }
      if (elem.aoiData.length > 0) {
        elem.aoiData.forEach((aoiElem) => {
          aoiElem.selectedDate = aoiElem.availablePeriodsOfValidity[0];
        });
      }
      if (elem.loiData.length > 0) {
        elem.loiData.forEach((loiElem) => {
          loiElem.selectedDate = loiElem.availablePeriodsOfValidity[0];
        });
      }

      if (elem.subTopics.length > 0) {
        elem.subTopics = this.prepareTopicGeoresourceHierarchyRecursive(elem.subTopics);
      }
    });

    return retTree;
  }
}
