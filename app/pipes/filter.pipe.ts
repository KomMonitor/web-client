import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true,
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], searchText: string | ((item: any) => boolean), property?: string): any[] {
    if (!items) return [];
    if (!searchText) return items;

    // Predicate form, as in the AngularJS `filter:` this replaced: several
    // templates hand in a filter function instead of a search string.
    if (typeof searchText === 'function') {
      const predicate = searchText;
      return items.filter((item) => predicate(item));
    }

    const needle = searchText.toLowerCase();

    return items.filter((item) => {
      if (property && item[property]) {
        return item[property].toLowerCase().includes(needle);
      }
      if (item.indicatorName) {
        return item.indicatorName.toLowerCase().includes(needle);
      }
      if (item.georesourceName) {
        return item.georesourceName.toLowerCase().includes(needle);
      }
      if (item.datasetName) {
        return item.datasetName.toLowerCase().includes(needle);
      }
      if (item.topicName) {
        return item.topicName.toLowerCase().includes(needle);
      }
      return false;
    });
  }
}
