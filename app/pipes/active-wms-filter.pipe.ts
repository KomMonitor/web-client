import { Pipe, PipeTransform } from '@angular/core';
import { WmsDataset } from 'components/ngComponents/models/services.models';

@Pipe({
    name: 'activeWmsFilter',
    pure: false
})
export class ActiveWmsFilter implements PipeTransform {

  constructor(
  ) {}

  transform(items: WmsDataset[]): any {

    if (!items) {
        return items;
    }
    return items.filter(item => item.isSelected===true);
  }
}