import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ExportFormatSelectionComponent } from '../export-format-selection/export-format-selection.component';
import { ExportItemTimeSelectionComponent } from '../export-item-time-selection/export-item-time-selection.component';
import { ExportType } from '../exporting-state.service';
import { ExportFormat, IndicatorExportItem, SpatialUnit } from '../models';

/**
 * Presentational card for a single indicator export item. It renders the spatial-unit,
 * time and format selection and reports user interactions via outputs — it does not read
 * or mutate the shared ExportingStateService, so it can be reused with isolated state.
 */
@Component({
  selector: 'app-export-indicator-card',
  templateUrl: './export-indicator-card.component.html',
  styleUrls: ['./export-indicator-card.component.scss'],
  imports: [ExportItemTimeSelectionComponent, ExportFormatSelectionComponent],
  standalone: true,
})
export class ExportIndicatorCardComponent {
  @Input({ required: true })
  public exportItem!: IndicatorExportItem;

  @Input()
  public exportType: ExportType = 'single';

  @Input()
  public isValid = false;

  @Input()
  public showRemove = true;

  @Output()
  public spatialUnitToggle = new EventEmitter<string>();

  @Output()
  public formatToggle = new EventEmitter<ExportFormat>();

  @Output()
  public remove = new EventEmitter<void>();

  getIndicatorLevels(): SpatialUnit[] {
    return this.exportItem.dataset.spatialUnits;
  }
}
