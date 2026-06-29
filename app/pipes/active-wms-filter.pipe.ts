import { Pipe, PipeTransform } from '@angular/core';
import { WmsDataset } from 'components/ngComponents/models/services.models';

@Pipe({
    name: 'activeWmsFilter',
    pure: false,
    standalone: true
})
export class ActiveWmsFilter implements PipeTransform {

  transform(items: WmsDataset[]): any {

    if (!items) {
        return items;
    }
    return items.filter(item => item.isSelected===true);
  }
}