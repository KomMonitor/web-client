import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string, property?: string): any[] {
    if (!items) return [];
    if (!searchText) return items;
    
    searchText = searchText.toLowerCase();
    
    return items.filter(item => {
      if (property && item[property]) {
        return item[property].toLowerCase().includes(searchText);
      }
      if (item.indicatorName) {
        return item.indicatorName.toLowerCase().includes(searchText);
      }
      if (item.georesourceName) {
        return item.georesourceName.toLowerCase().includes(searchText);
      }
      if (item.datasetName) {
        return item.datasetName.toLowerCase().includes(searchText);
      }
      if (item.topicName) {
        return item.topicName.toLowerCase().includes(searchText);
      }
      return false;
    });
  }
} 