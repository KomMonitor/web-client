import { Injectable, inject } from '@angular/core';
import { IndicatorMetadataStoreService } from 'services/indicator-metadata-store-service/indicator-metadata-store.service';
import { TopicMetadataStoreService } from 'services/topic-metadata-store-service/topic-metadata-store.service';
import { ProcessScriptMetadataStoreService } from 'services/process-script-metadata-store-service/process-script-metadata-store.service';
import { GeoresourceMetadataStoreService } from 'services/georesource-metadata-store-service/georesource-metadata-store.service';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';

/**
 * Indicator keyword/type filtering extracted from DataExchangeService
 * (Prio 7 / B4 — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * The georesource filtering moved with B6e into GeoresourceMetadataStoreService; this service
 * holds the remaining indicator keyword filter. It reads the (already extracted) metadata stores
 * and triggers the indicator hierarchy rebuilds via TopicHierarchyStoreService. The
 * DataExchangeService facade re-exposes displayableIndicators_keywordFiltered + the methods.
 */
@Injectable({
  providedIn: 'root',
})
export class MetadataFilterService {
  private indicatorStore = inject(IndicatorMetadataStoreService);
  private topicStore = inject(TopicMetadataStoreService);
  private processScriptStore = inject(ProcessScriptMetadataStoreService);
  private georesourceStore = inject(GeoresourceMetadataStoreService);
  private topicHierarchyStore = inject(TopicHierarchyStoreService);

  displayableIndicators_keywordFiltered: any;

  onChangeIndicatorKeywordFilter(indicatorNameFilter) {
    this.displayableIndicators_keywordFiltered = JSON.parse(
      JSON.stringify(this.indicatorStore.displayableIndicators)
    );

    if (indicatorNameFilter && indicatorNameFilter != '') {
      this.displayableIndicators_keywordFiltered = this.filterArrayObjectsByValue(
        this.displayableIndicators_keywordFiltered,
        indicatorNameFilter
      );
    }

    this.topicHierarchyStore.buildTopicIndicatorHierarchy(
      this.topicStore.availableTopics,
      this.displayableIndicators_keywordFiltered,
      this.georesourceStore.getAvailableIndiWmsDatasets()
    );
    this.topicHierarchyStore.buildHeadlineIndicatorHierarchy(
      this.displayableIndicators_keywordFiltered,
      this.processScriptStore.availableProcessScripts
    );
    this.topicHierarchyStore.buildComputationIndicatorHierarchy(
      this.displayableIndicators_keywordFiltered,
      this.processScriptStore.availableProcessScripts
    );
  }

  filterIndicators() {
    return (item) => {
      return this.indicatorStore.isDisplayableIndicator(item);
    };
  }

  private filterArrayObjectsByValue(array, string) {
    return array.filter((o) => {
      return Object.keys(o).some((k) => {
        if (typeof o[k] === 'string') return o[k].toLowerCase().includes(string.toLowerCase());
        return false;
      });
    });
  }
}
