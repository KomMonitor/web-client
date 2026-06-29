import { Pipe, PipeTransform, inject } from '@angular/core';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';

@Pipe({
  name: 'currentlySelectedIndicatorFilter',
  pure: false,
  standalone: true,
})
export class SelectedIndicatorFilter implements PipeTransform {
  private selectionState = inject(SelectionStateService);

  transform(items: any[]): any {
    if (!items) {
      return items;
    }
    return items.filter(
      (item) =>
        item.indicatorMetadata.indicatorId == this.selectionState.selectedIndicator.indicatorId
    );
  }
}
