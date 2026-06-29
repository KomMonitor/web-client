import { Injectable, inject, signal } from '@angular/core';
import { TopicHierarchyService } from 'services/topic-hierarchy-service/topic-hierarchy.service';
import { IndicatorsTopicsHierarchy } from 'components/ngComponents/models/indicators.models';

/**
 * Holds the built topic/indicator/georesource hierarchies extracted from
 * DataExchangeService (Prio 7 / B5 — see documentation/PRIO7_GOD_SERVICE_SPLIT.md).
 *
 * Stateless w.r.t. the god-service: the input collections (availableTopics,
 * displayable*_keywordFiltered, wms/wfs datasets, process scripts) are passed in by
 * the DataExchangeService facade. This store only delegates to TopicHierarchyService
 * and keeps the resulting hierarchy fields, which the facade re-exposes via getters.
 */
@Injectable({
  providedIn: 'root',
})
export class TopicHierarchyStoreService {
  private topicHierarchyService = inject(TopicHierarchyService);

  // Signal-backed so reactive consumers (computed/templates) re-derive on change,
  // while existing imperative reads/assignments keep working via the getter/setter shim.
  private _topicIndicatorHierarchy = signal<IndicatorsTopicsHierarchy[]>([]);
  get topicIndicatorHierarchy(): IndicatorsTopicsHierarchy[] {
    return this._topicIndicatorHierarchy();
  }
  set topicIndicatorHierarchy(value: IndicatorsTopicsHierarchy[]) {
    this._topicIndicatorHierarchy.set(value);
  }
  headlineIndicatorHierarchy: any[] = [];
  computationIndicatorHierarchy: any[] = [];
  topicGeoresourceHierarchy: any[] = [];
  topicGeoresourceHierarchy_unmappedEntries: any = {};

  buildTopicGeoresourceHierarchy(
    availableTopics,
    displayableGeoresources_keywordFiltered,
    wmsDatasets_keywordFiltered,
    wfsDatasets_keywordFiltered,
    georesourceMapKey_forUnmappedTopicReferences,
    filter: any = undefined
  ) {
    const result = this.topicHierarchyService.buildTopicGeoresourceHierarchy(
      availableTopics,
      displayableGeoresources_keywordFiltered,
      wmsDatasets_keywordFiltered,
      wfsDatasets_keywordFiltered,
      georesourceMapKey_forUnmappedTopicReferences,
      filter
    );
    this.topicGeoresourceHierarchy = result.hierarchy;
    this.topicGeoresourceHierarchy_unmappedEntries = result.unmappedEntries;
  }

  buildComputationIndicatorHierarchy(
    displayableIndicators_keywordFiltered,
    availableProcessScripts
  ) {
    this.computationIndicatorHierarchy =
      this.topicHierarchyService.buildComputationIndicatorHierarchy(
        displayableIndicators_keywordFiltered,
        availableProcessScripts
      );
  }

  buildTopicIndicatorHierarchy(
    availableTopics,
    displayableIndicators_keywordFiltered,
    indiWmsDatasets
  ) {
    this.topicIndicatorHierarchy = this.topicHierarchyService.buildTopicIndicatorHierarchy(
      availableTopics,
      displayableIndicators_keywordFiltered,
      indiWmsDatasets
    );
  }

  buildHeadlineIndicatorHierarchy(displayableIndicators_keywordFiltered, availableProcessScripts) {
    this.headlineIndicatorHierarchy = this.topicHierarchyService.buildHeadlineIndicatorHierarchy(
      displayableIndicators_keywordFiltered,
      availableProcessScripts
    );
  }

  getTopicHierarchyForTopicId(availableTopics, topicReferenceId) {
    return this.topicHierarchyService.getTopicHierarchyForTopicId(
      availableTopics,
      topicReferenceId
    );
  }
}
