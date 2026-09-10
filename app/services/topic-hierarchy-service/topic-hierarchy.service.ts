import { Injectable } from '@angular/core';
import { IndicatorsTopicsHierarchy } from 'components/ngComponents/models/indicators.models';
import { WmsDataset } from 'components/ngComponents/models/services.models';

/**
 * Pure computation service for building and querying topic hierarchies.
 * All methods are stateless — they receive data as parameters and return results.
 * TopicHierarchyStoreService calls it and keeps the resulting hierarchies.
 */
@Injectable({
  providedIn: 'root',
})
export class TopicHierarchyService {
  // ---------------------------------------------------------------------------
  // Georesource hierarchy
  // ---------------------------------------------------------------------------

  buildTopicGeoresourceHierarchy(
    availableTopics: any[],
    displayableGeoresources_keywordFiltered: any[],
    wmsDatasets_keywordFiltered: WmsDataset[],
    wfsDatasets_keywordFiltered: any[],
    unmappedKey: string,
    filter?: any
  ): { hierarchy: any[]; unmappedEntries: any } {
    const georesourceTopics = JSON.parse(JSON.stringify(availableTopics)).filter(
      (topic) => topic.topicResource === 'georesource'
    );
    const topicsMap = this.buildTopicsMap_georesources(georesourceTopics, unmappedKey);

    // PROCESS GEORESOURCES
    for (const georesourceMetadata of displayableGeoresources_keywordFiltered) {
      if (topicsMap.has(georesourceMetadata.topicReference)) {
        const georesourceDatasets = topicsMap.get(georesourceMetadata.topicReference);

        // catch any freshly created reachability scenario data sources as they are handled differently
        if (georesourceMetadata.isNewReachabilityDataSource) continue;
        else if (georesourceMetadata.isPOI)
          georesourceDatasets.poiDatasets.push(georesourceMetadata);
        else if (georesourceMetadata.isLOI)
          georesourceDatasets.loiDatasets.push(georesourceMetadata);
        else if (georesourceMetadata.isAOI)
          georesourceDatasets.aoiDatasets.push(georesourceMetadata);

        topicsMap.set(georesourceMetadata.topicReference, georesourceDatasets);
      } else {
        const georesourceDatasets_unmapped = topicsMap.get(unmappedKey);

        if (georesourceMetadata.isNewReachabilityDataSource) continue;
        else if (georesourceMetadata.isPOI)
          georesourceDatasets_unmapped.poiDatasets.push(georesourceMetadata);
        else if (georesourceMetadata.isLOI)
          georesourceDatasets_unmapped.loiDatasets.push(georesourceMetadata);
        else if (georesourceMetadata.isAOI)
          georesourceDatasets_unmapped.aoiDatasets.push(georesourceMetadata);

        topicsMap.set(unmappedKey, georesourceDatasets_unmapped);
      }
    }

    // PROCESS WMS
    for (const wmsMetadata of wmsDatasets_keywordFiltered) {
      if (topicsMap.has(wmsMetadata.topicReference)) {
        if (!filter || (filter && filter.georesourceTopics.includes(wmsMetadata.topicReference))) {
          const georesourceDatasets = topicsMap.get(wmsMetadata.topicReference);
          georesourceDatasets.wmsDatasets.push(wmsMetadata);
          topicsMap.set(wmsMetadata.topicReference, georesourceDatasets);
        }
      } else {
        const georesourceDatasets_unmapped = topicsMap.get(unmappedKey);
        georesourceDatasets_unmapped.wmsDatasets.push(wmsMetadata);
        topicsMap.set(unmappedKey, georesourceDatasets_unmapped);
      }
    }

    // PROCESS WFS
    for (const wfsMetadata of wfsDatasets_keywordFiltered) {
      if (topicsMap.has(wfsMetadata.topicReference)) {
        if (!filter || (filter && filter.georesourceTopics.includes(wfsMetadata.topicReference))) {
          const georesourceDatasets = topicsMap.get(wfsMetadata.topicReference);
          georesourceDatasets.wfsDatasets.push(wfsMetadata);
          topicsMap.set(wfsMetadata.topicReference, georesourceDatasets);
        }
      } else {
        const georesourceDatasets_unmapped = topicsMap.get(unmappedKey);
        georesourceDatasets_unmapped.wfsDatasets.push(wfsMetadata);
        topicsMap.set(unmappedKey, georesourceDatasets_unmapped);
      }
    }

    const { topicsArray, unmappedEntries } = this.addGeoresourceDataToTopicHierarchy(
      georesourceTopics,
      topicsMap,
      unmappedKey
    );
    return { hierarchy: topicsArray, unmappedEntries };
  }

  private buildTopicsMap_georesources(
    georesourceTopics: any[],
    unmappedKey: string
  ): Map<any, any> {
    let topicsMap = new Map<any, any>();

    for (const topic of georesourceTopics) {
      topicsMap.set(topic.topicId, {
        poiDatasets: [],
        loiDatasets: [],
        aoiDatasets: [],
        wmsDatasets: [],
        wfsDatasets: [],
      });
      if (topic.subTopics.length > 0) {
        topicsMap = this.addSubTopicsToMap_georesources(topic.subTopics, topicsMap);
      }
    }

    topicsMap.set(unmappedKey, {
      poiDatasets: [],
      loiDatasets: [],
      aoiDatasets: [],
      wmsDatasets: [],
      wfsDatasets: [],
    });
    return topicsMap;
  }

  private addSubTopicsToMap_georesources(
    subTopicsArray: any[],
    topicsMap: Map<any, any>
  ): Map<any, any> {
    for (const subTopic of subTopicsArray) {
      topicsMap.set(subTopic.topicId, {
        poiDatasets: [],
        loiDatasets: [],
        aoiDatasets: [],
        wmsDatasets: [],
        wfsDatasets: [],
      });
      if (subTopic.subTopics.length > 0) {
        topicsMap = this.addSubTopicsToMap_georesources(subTopic.subTopics, topicsMap);
      }
    }
    return topicsMap;
  }

  private addGeoresourceDataToTopicHierarchy(
    topicsArray: any[],
    topicsMap: Map<any, any>,
    unmappedKey: string
  ): { topicsArray: any[]; unmappedEntries: any } {
    for (let topic of topicsArray) {
      const topicsDataEntry = topicsMap.get(topic.topicId);
      topic.poiData = topicsDataEntry.poiDatasets;
      topic.poiCount = topicsDataEntry.poiDatasets.length;
      topic.loiData = topicsDataEntry.loiDatasets;
      topic.loiCount = topicsDataEntry.loiDatasets.length;
      topic.aoiData = topicsDataEntry.aoiDatasets;
      topic.aoiCount = topicsDataEntry.aoiDatasets.length;
      topic.wmsData = topicsDataEntry.wmsDatasets;
      topic.wmsCount = topicsDataEntry.wmsDatasets.length;
      topic.wfsData = topicsDataEntry.wfsDatasets;
      topic.wfsCount = topicsDataEntry.wfsDatasets.length;
      topic.totalCount =
        topic.poiCount + topic.loiCount + topic.aoiCount + topic.wmsCount + topic.wfsCount;
      topic.ownCount = topic.totalCount;

      if (topic.subTopics.length > 0) {
        topic = this.addGeoresourceDataToSubTopics(topic, topicsMap);
      }
    }

    const d = topicsMap.get(unmappedKey);
    const unmappedEntries = {
      poiData: d.poiDatasets,
      poiCount: d.poiDatasets.length,
      loiData: d.loiDatasets,
      loiCount: d.loiDatasets.length,
      aoiData: d.aoiDatasets,
      aoiCount: d.aoiDatasets.length,
      wmsData: d.wmsDatasets,
      wmsCount: d.wmsDatasets.length,
      wfsData: d.wfsDatasets,
      wfsCount: d.wfsDatasets.length,
      totalCount:
        d.poiDatasets.length +
        d.loiDatasets.length +
        d.aoiDatasets.length +
        d.wmsDatasets.length +
        d.wfsDatasets.length,
    };

    return { topicsArray, unmappedEntries };
  }

  private addGeoresourceDataToSubTopics(topic: any, topicsMap: Map<any, any>): any {
    for (let subTopic of topic.subTopics) {
      const topicsDataEntry = topicsMap.get(subTopic.topicId);
      subTopic.poiData = topicsDataEntry.poiDatasets;
      subTopic.poiCount = topicsDataEntry.poiDatasets.length;
      subTopic.loiData = topicsDataEntry.loiDatasets;
      subTopic.loiCount = topicsDataEntry.loiDatasets.length;
      subTopic.aoiData = topicsDataEntry.aoiDatasets;
      subTopic.aoiCount = topicsDataEntry.aoiDatasets.length;
      subTopic.wmsData = topicsDataEntry.wmsDatasets;
      subTopic.wmsCount = topicsDataEntry.wmsDatasets.length;
      subTopic.wfsData = topicsDataEntry.wfsDatasets;
      subTopic.wfsCount = topicsDataEntry.wfsDatasets.length;
      subTopic.totalCount =
        subTopic.poiCount +
        subTopic.loiCount +
        subTopic.aoiCount +
        subTopic.wmsCount +
        subTopic.wfsCount;
      subTopic.ownCount = subTopic.totalCount;

      if (subTopic.subTopics.length > 0) {
        subTopic = this.addGeoresourceDataToSubTopics(subTopic, topicsMap);
      }

      topic.poiCount += subTopic.poiCount;
      topic.loiCount += subTopic.loiCount;
      topic.aoiCount += subTopic.aoiCount;
      topic.wmsCount += subTopic.wmsCount;
      topic.wfsCount += subTopic.wfsCount;
      topic.totalCount += subTopic.totalCount;
    }
    return topic;
  }

  // ---------------------------------------------------------------------------
  // Indicator hierarchy
  // ---------------------------------------------------------------------------

  buildTopicIndicatorHierarchy(
    availableTopics: any[],
    displayableIndicators_keywordFiltered: any[],
    availableIndiWmsDatasets: WmsDataset[]
  ): IndicatorsTopicsHierarchy[] {
    const indicatorTopics = JSON.parse(JSON.stringify(availableTopics)).filter(
      (topic) => topic.topicResource === 'indicator'
    );
    const topicsMap = this.buildTopicsMap_indicators(indicatorTopics);

    for (const indicatorMetadata of displayableIndicators_keywordFiltered) {
      if (topicsMap.has(indicatorMetadata.topicReference)) {
        const indicatorArray = topicsMap.get(indicatorMetadata.topicReference)!;
        indicatorArray.push(indicatorMetadata);
        topicsMap.set(indicatorMetadata.topicReference, indicatorArray);
      }
    }

    const tempTopicsData = this.addIndicatorDataToTopicHierarchy(indicatorTopics, topicsMap);
    const result = this.addWmsDataToTopicHierarchyRecursive(
      tempTopicsData,
      availableIndiWmsDatasets
    );
    this.addWmsCountRecursive(result);
    return result;
  }

  private buildTopicsMap_indicators(indicatorTopics: any[]): Map<any, any[]> {
    let topicsMap = new Map<any, any[]>();
    for (const topic of indicatorTopics) {
      topicsMap.set(topic.topicId, []);
      if (topic.subTopics.length > 0) {
        topicsMap = this.addSubTopicsToMap_indicators(topic.subTopics, topicsMap);
      }
    }
    return topicsMap;
  }

  private addSubTopicsToMap_indicators(
    subTopicsArray: any[],
    topicsMap: Map<any, any[]>
  ): Map<any, any[]> {
    for (const subTopic of subTopicsArray) {
      topicsMap.set(subTopic.topicId, []);
      if (subTopic.subTopics.length > 0) {
        topicsMap = this.addSubTopicsToMap_indicators(subTopic.subTopics, topicsMap);
      }
    }
    return topicsMap;
  }

  private addWmsDataToTopicHierarchyRecursive(
    tempTopicsData: IndicatorsTopicsHierarchy[],
    availableIndiWmsDatasets: WmsDataset[]
  ): IndicatorsTopicsHierarchy[] {
    tempTopicsData.forEach((topicData: IndicatorsTopicsHierarchy) => {
      const wmsDatasets = availableIndiWmsDatasets.filter(
        (e) => e.topicReference == topicData.topicId
      );

      if (wmsDatasets.length) {
        topicData.wmsData = wmsDatasets;
        topicData.wmsCount = topicData.wmsData.length;
      } else {
        topicData.wmsData = [];
        topicData.wmsCount = 0;
      }

      if (topicData.subTopics.length) {
        topicData.subTopics = this.addWmsDataToTopicHierarchyRecursive(
          topicData.subTopics,
          availableIndiWmsDatasets
        );
      }
    });

    return tempTopicsData;
  }

  private addWmsCountRecursive(topicData: IndicatorsTopicsHierarchy[]): number {
    let num = 0;

    topicData.forEach((topic: IndicatorsTopicsHierarchy) => {
      num += topic.wmsCount;

      if (topic.subTopics.length) {
        num += this.addWmsCountRecursive(topic.subTopics);
        topic.wmsCount += num;
      }
    });

    return num;
  }

  private addIndicatorDataToTopicHierarchy(topicsArray: any[], topicsMap: Map<any, any[]>): any[] {
    for (let topic of topicsArray) {
      topic.indicatorData = topicsMap.get(topic.topicId);
      topic.indicatorData.sort((a, b) =>
        a.displayOrder > b.displayOrder ? 1 : b.displayOrder > a.displayOrder ? -1 : 0
      );
      topic.indicatorCount = topic.indicatorData.length;
      if (topic.subTopics.length > 0) {
        topic = this.addIndicatorDataToSubTopics(topic, topicsMap);
      }
    }
    return topicsArray;
  }

  private addIndicatorDataToSubTopics(topic: any, topicsMap: Map<any, any[]>): any {
    for (let subTopic of topic.subTopics) {
      subTopic.indicatorData = topicsMap.get(subTopic.topicId);
      subTopic.indicatorData.sort((a, b) =>
        a.displayOrder > b.displayOrder ? 1 : b.displayOrder > a.displayOrder ? -1 : 0
      );
      subTopic.indicatorCount = subTopic.indicatorData.length;
      if (subTopic.subTopics.length > 0) {
        subTopic = this.addIndicatorDataToSubTopics(subTopic, topicsMap);
      }
      topic.indicatorCount += subTopic.indicatorCount;
    }
    return topic;
  }

  // ---------------------------------------------------------------------------
  // Headline / computation indicator hierarchies
  // ---------------------------------------------------------------------------

  buildHeadlineIndicatorHierarchy(
    displayableIndicators_keywordFiltered: any[],
    availableProcessScripts: any[]
  ): any[] {
    const indicatorsMap = new Map<any, any>();
    for (const indicatorMetadata of displayableIndicators_keywordFiltered) {
      indicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
    }

    const headlineIndicatorsArray = displayableIndicators_keywordFiltered.filter(
      (indicatorMetadata) => indicatorMetadata.isHeadlineIndicator == true
    );
    const headlineIndicatorsIdArray = headlineIndicatorsArray.map((m) => m.indicatorId);

    const headlineIndicatorScriptsMap = new Map<any, any>();
    for (const scriptMetadata of availableProcessScripts) {
      if (headlineIndicatorsIdArray.includes(scriptMetadata.indicatorId)) {
        headlineIndicatorScriptsMap.set(scriptMetadata.indicatorId, scriptMetadata);
      }
    }

    const hierarchy: any[] = [];
    for (const headlineIndicatorMetadata of headlineIndicatorsArray) {
      const item: any = { headlineIndicator: headlineIndicatorMetadata, baseIndicators: [] };

      if (headlineIndicatorScriptsMap.has(headlineIndicatorMetadata.indicatorId)) {
        const targetScriptMetadata = headlineIndicatorScriptsMap.get(
          headlineIndicatorMetadata.indicatorId
        );
        for (const requiredIndicatorId of targetScriptMetadata.requiredIndicatorIds) {
          if (indicatorsMap.has(requiredIndicatorId)) {
            item.baseIndicators.push(indicatorsMap.get(requiredIndicatorId));
          }
        }
      }

      hierarchy.push(item);
    }

    return hierarchy;
  }

  buildComputationIndicatorHierarchy(
    displayableIndicators_keywordFiltered: any[],
    availableProcessScripts: any[]
  ): any[] {
    const indicatorsMap = new Map<any, any>();
    for (const indicatorMetadata of displayableIndicators_keywordFiltered) {
      indicatorsMap.set(indicatorMetadata.indicatorId, indicatorMetadata);
    }

    const computationIndicatorsArray = displayableIndicators_keywordFiltered.filter(
      (indicatorMetadata) => indicatorMetadata.creationType == 'COMPUTATION'
    );
    const computationIndicatorsIdArray = computationIndicatorsArray.map((m) => m.indicatorId);

    const computationIndicatorScriptsMap = new Map<any, any>();
    for (const scriptMetadata of availableProcessScripts) {
      if (computationIndicatorsIdArray.includes(scriptMetadata.indicatorId)) {
        computationIndicatorScriptsMap.set(scriptMetadata.indicatorId, scriptMetadata);
      }
    }

    const hierarchy: any[] = [];
    for (const computationIndicatorMetadata of computationIndicatorsArray) {
      const item: any = { computationIndicator: computationIndicatorMetadata, baseIndicators: [] };

      if (computationIndicatorScriptsMap.has(computationIndicatorMetadata.indicatorId)) {
        const targetScriptMetadata = computationIndicatorScriptsMap.get(
          computationIndicatorMetadata.indicatorId
        );
        for (const requiredIndicatorId of targetScriptMetadata.requiredIndicatorIds) {
          if (indicatorsMap.has(requiredIndicatorId)) {
            item.baseIndicators.push(indicatorsMap.get(requiredIndicatorId));
          }
        }
      }

      hierarchy.push(item);
    }

    return hierarchy;
  }

  // ---------------------------------------------------------------------------
  // Topic lookup utilities
  // ---------------------------------------------------------------------------

  getTopicHierarchyForTopicId(availableTopics: any[], topicReferenceId: any): any[] {
    const topicHierarchyArray: any[] = [];

    for (const mainTopicCandidate of availableTopics) {
      if (mainTopicCandidate.topicId === topicReferenceId) {
        topicHierarchyArray.push(mainTopicCandidate);
        break;
      } else if (
        this.findIdInAnySubTopicHierarchy(topicReferenceId, mainTopicCandidate.subTopics)
      ) {
        topicHierarchyArray.push(mainTopicCandidate);
        return this.addSubTopicHierarchy(
          topicHierarchyArray,
          topicReferenceId,
          mainTopicCandidate.subTopics
        );
      }
    }

    return topicHierarchyArray;
  }

  private addSubTopicHierarchy(
    topicHierarchyArray: any[],
    topicReferenceId: any,
    subTopicsArray: any[]
  ): any[] {
    for (const subTopicCandidate of subTopicsArray) {
      if (subTopicCandidate.topicId === topicReferenceId) {
        topicHierarchyArray.push(subTopicCandidate);
        break;
      } else if (this.findIdInAnySubTopicHierarchy(topicReferenceId, subTopicCandidate.subTopics)) {
        topicHierarchyArray.push(subTopicCandidate);
        topicHierarchyArray = this.addSubTopicHierarchy(
          topicHierarchyArray,
          topicReferenceId,
          subTopicCandidate.subTopics
        );
      }
    }
    return topicHierarchyArray;
  }

  private findIdInAnySubTopicHierarchy(topicReferenceId: any, subTopicsArray: any[]): boolean {
    for (const subTopicCandidate of subTopicsArray) {
      if (subTopicCandidate.topicId === topicReferenceId) return true;
      if (this.findIdInAnySubTopicHierarchy(topicReferenceId, subTopicCandidate.subTopics))
        return true;
    }
    return false;
  }

  referencedTopicIdExists(availableTopics: any[], topicId: any): boolean {
    return this.getTopicHierarchyForTopicId(availableTopics, topicId).length > 0;
  }

  topicHierarchyContainsIndicator(
    availableTopics: any[],
    topic: any,
    indicatorMetadata: any
  ): boolean {
    if (topic === null || topic === '') {
      if (
        indicatorMetadata.topicReference === null ||
        indicatorMetadata.topicReference === '' ||
        !this.referencedTopicIdExists(availableTopics, indicatorMetadata.topicReference)
      ) {
        return true;
      }
      return false;
    }

    if (topic.topicId === indicatorMetadata.topicReference) return true;
    return this.anySubTopicContainsIndicator(availableTopics, topic, indicatorMetadata);
  }

  anySubTopicContainsIndicator(
    availableTopics: any[],
    topic: any,
    indicatorMetadata: any
  ): boolean {
    for (const subTopic of topic.subTopics) {
      if (this.topicHierarchyContainsIndicator(availableTopics, subTopic, indicatorMetadata))
        return true;
    }
    return false;
  }

  topicHierarchyContainsGeoresource(
    availableTopics: any[],
    topic: any,
    georesourceMetadata: any
  ): boolean {
    return this.topicHierarchyContainsIndicator(availableTopics, topic, georesourceMetadata);
  }

  topicHierarchyContainsWms(availableTopics: any[], topic: any, wmsMetadata: any): boolean {
    return this.topicHierarchyContainsIndicator(availableTopics, topic, wmsMetadata);
  }

  topicHierarchyContainsWfs(availableTopics: any[], topic: any, wfsMetadata: any): boolean {
    return this.topicHierarchyContainsIndicator(availableTopics, topic, wfsMetadata);
  }

  getTopicHierarchyDisplayString(availableTopics: any[], topicReferenceId: any): string {
    const topicHierarchyArray = this.getTopicHierarchyForTopicId(availableTopics, topicReferenceId);

    let topicsString = '';
    for (let index = 0; index < topicHierarchyArray.length; index++) {
      if (index === 0) {
        topicsString += topicHierarchyArray[index].topicName;
      } else {
        const numberOfWhitespaces = 2 * index;
        let whitespaceString = '';
        for (let k = 0; k < numberOfWhitespaces; k++) {
          whitespaceString += '&nbsp;';
        }
        topicsString += whitespaceString + topicHierarchyArray[index].topicName;
      }

      if (index < topicHierarchyArray.length) {
        topicsString += '<br/>';
      }
    }

    return topicsString;
  }
}
