import { Pipe, PipeTransform } from '@angular/core';
import { IndicatorsTopicsHierarchy } from 'components/ngComponents/models/indicators.models';

@Pipe({
  name: 'indicatorFavFilter',
  pure: false,
  standalone: true,
})
export class IndicatorFavFilter implements PipeTransform {
  transform(
    topics: IndicatorsTopicsHierarchy[],
    favTopicsTree: IndicatorsTopicsHierarchy[],
    topicFavItems: string[],
    indicatorFavItems: string[],
    wmsFavItems: string[]
  ): IndicatorsTopicsHierarchy[] {
    if (!topics) return topics;

    topics = topics.filter((e) =>
      this.showTopic(e, favTopicsTree, topicFavItems, indicatorFavItems, wmsFavItems)
    );
    topics = topics.filter((elem) => elem.indicatorCount > 0 || elem.wmsCount > 0);
    topics = topics.sort((a, b) => a.topicName.localeCompare(b.topicName));

    return topics;
  }

  private showTopic(
    topic: IndicatorsTopicsHierarchy,
    favTopicsTree: IndicatorsTopicsHierarchy[],
    topicFavItems: string[],
    indicatorFavItems: string[],
    wmsFavItems: string[]
  ): boolean {
    return (
      this.topicOrIndicatorInFavRecursive([topic], topicFavItems, indicatorFavItems, wmsFavItems) ||
      this.topicInFavTopBottom(topic, favTopicsTree, topicFavItems)
    );
  }

  private topicOrIndicatorInFavRecursive(
    tree: IndicatorsTopicsHierarchy[],
    topicFavItems: string[],
    indicatorFavItems: string[],
    wmsFavItems: string[]
  ): boolean {
    return tree.some(
      (elem) =>
        topicFavItems.includes(elem.topicId) ||
        elem.indicatorData.some((i) => indicatorFavItems.includes(i.indicatorId)) ||
        elem.wmsData.some((w) => wmsFavItems.includes(w.id)) ||
        (elem.subTopics.length > 0 &&
          this.topicOrIndicatorInFavRecursive(
            elem.subTopics,
            topicFavItems,
            indicatorFavItems,
            wmsFavItems
          ))
    );
  }

  private topicInFavTopBottom(
    topic: IndicatorsTopicsHierarchy,
    favTopicsTree: IndicatorsTopicsHierarchy[],
    topicFavItems: string[]
  ): boolean {
    if (topicFavItems.includes(topic.topicId)) return true;

    let parentNext = topic.parent;
    while (parentNext !== undefined) {
      if (this.parentInFavRecursive(favTopicsTree, parentNext, topicFavItems)) return true;
      parentNext = this.findParentNextRecursive(favTopicsTree, parentNext);
    }

    return false;
  }

  private parentInFavRecursive(
    tree: IndicatorsTopicsHierarchy[],
    parentId: string,
    topicFavItems: string[]
  ): boolean {
    return tree.some((elem) => {
      if (elem.topicId === parentId && topicFavItems.includes(parentId)) return true;
      if (elem.subTopics.length > 0)
        return this.parentInFavRecursive(elem.subTopics, parentId, topicFavItems);
      return false;
    });
  }

  private findParentNextRecursive(
    tree: IndicatorsTopicsHierarchy[],
    parent: string
  ): string | undefined {
    for (const elem of tree) {
      if (elem.topicId === parent) return elem.parent;
      if (elem.subTopics.length > 0) {
        const found = this.findParentNextRecursive(elem.subTopics, parent);
        if (found !== undefined) return found;
      }
    }
    return undefined;
  }
}
