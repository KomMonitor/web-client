import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string): any[] {
    if (!items) return [];
    if (!searchText) return items;
    
    searchText = searchText.toLowerCase();
    
    return items.filter(item => {
      if (item.indicatorName) {
        return item.indicatorName.toLowerCase().includes(searchText);
      }
      if (item.georesourceName) {
        return item.georesourceName.toLowerCase().includes(searchText);
      }
      return false;
    });
  }
} 