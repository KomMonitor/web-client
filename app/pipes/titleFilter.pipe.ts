import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'indicatorNameFilter',
    pure: false
})
export class IndicatorNameFilter implements PipeTransform {
    transform(items: any[], filter: any): any {
        if (!items || !filter) {
            return items;
        }
        return items.filter(item => item.indicatorMetadata.indicatorName.toLowerCase().includes(filter.toLowerCase()));
    }
}