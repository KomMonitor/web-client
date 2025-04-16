import { Pipe, PipeTransform } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';

@Pipe({
    name: 'currentlySelectedIndicatorFilter',
    pure: false
})
export class SelectedIndicatorFilter implements PipeTransform {

  constructor(
    private dataExchangeService: DataExchangeService
  ) {}

  transform(items: any[]): any {
      if (!items) {
          return items;
      }
      return items.filter(item => item.indicatorMetadata.indicatorId==this.dataExchangeService.pipedData.selectedIndicator.indicatorId);
  }
}