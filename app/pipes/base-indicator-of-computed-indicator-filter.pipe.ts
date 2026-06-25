import { Pipe, PipeTransform } from '@angular/core';
import { TopicHierarchyStoreService } from 'services/topic-hierarchy-store-service/topic-hierarchy-store.service';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';

@Pipe({
    name: 'baseIndicatorOfComputedIndicatorFilter',
    pure: false,
    standalone: true
})
export class BaseIndicatorOfComputedIndicatorFilter implements PipeTransform {

  constructor(
    private topicHierarchyStore: TopicHierarchyStoreService,
    private selectionState: SelectionStateService
  ) {}

  transform(items: any[]): any {

    if (!items) {
      return items;
    } 
    
    var computationIndicatorEntry = this.topicHierarchyStore.computationIndicatorHierarchy.filter(element => element.computationIndicator.indicatorId == this.selectionState.selectedIndicator.indicatorId)[0];

    return items.filter(item => {
        
      if(computationIndicatorEntry){
        var baseIndicators_filtered = computationIndicatorEntry.baseIndicators.filter(element => element.indicatorId == item.indicatorMetadata.indicatorId);
        if (baseIndicators_filtered.length > 0){
          return true;
        }
      }
      return false;
    });
  }
}