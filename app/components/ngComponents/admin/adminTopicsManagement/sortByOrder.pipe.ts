import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortByOrder'
})
export class SortByOrderPipe implements PipeTransform {
  transform(items: any[]): any[] {
    if (!items) return [];
    return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }
}