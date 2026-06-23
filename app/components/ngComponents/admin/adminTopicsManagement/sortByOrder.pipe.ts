import { Pipe, PipeTransform } from '@angular/core';
import { Topic, TopicOrderMode } from './admin-topics-management.component';

@Pipe({
  name: 'sortByOrder',
  standalone: true,
})
export class SortByOrderPipe implements PipeTransform {
  transform(items: Topic[], order: TopicOrderMode): Topic[] {
    if (items.length > 0) {
      if (order === 'custom') {
        return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      }
      if (order === 'alphabetical') {
        return items.sort((a, b) => a.topicName.localeCompare(b.topicName));
      }
    }
    return [];
  }
}
