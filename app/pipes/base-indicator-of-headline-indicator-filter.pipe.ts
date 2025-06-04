import { Pipe, PipeTransform } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Pipe({
    name: 'baseIndicatorOfHeadlineIndicatorFilter',
    pure: false
})
export class BaseIndicatorOfHeadlineIndicatorFilter implements PipeTransform {

  constructor(
    private dataExchangeService: DataExchangeService
  ) {}

  transform(items: any[]): any {
    if (!items) {
      return items;
    } 
    
    var headlineIndicatorEntry = this.dataExchangeService.pipedData.headlineIndicatorHierarchy.filter(element => element.computationIndicator?.indicatorId == this.dataExchangeService.pipedData.selectedIndicator.indicatorId)[0];

    return items.filter(item => {
        
      if(headlineIndicatorEntry){
        var baseIndicators_filtered = headlineIndicatorEntry.baseIndicators.filter(element => element.indicatorId == item.indicatorMetadata.indicatorId);
        if (baseIndicators_filtered.length > 0){
          return true;
        }
      }
      return false;
    });
  }
}