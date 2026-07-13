import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ExportFormatSelectionComponent } from '../export-format-selection/export-format-selection.component';
import { ExportItemTimeSelectionComponent } from '../export-item-time-selection/export-item-time-selection.component';
import { ExportType } from '../exporting-state.service';
import { ExportFormat, GeoressourceExportItem } from '../models';

/**
 * Presentational card for a single georesource export item. It renders the time and format
 * selection and reports user interactions via outputs — it does not read or mutate the shared
 * ExportingStateService, so it can be reused with isolated state.
 */
@Component({
  selector: 'app-export-georessource-card',
  templateUrl: './export-georessource-card.component.html',
  styleUrls: ['./export-georessource-card.component.scss'],
  imports: [ExportItemTimeSelectionComponent, ExportFormatSelectionComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportGeoressourceCardComponent {
  readonly exportItem = input.required<GeoressourceExportItem>();
  readonly exportType = input<ExportType>('single');
  readonly isValid = input(false);
  readonly showRemove = input(true);

  readonly formatToggle = output<ExportFormat>();
  readonly remove = output<void>();
}
