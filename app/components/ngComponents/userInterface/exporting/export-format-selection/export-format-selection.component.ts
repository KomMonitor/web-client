import { Component, Input, computed, inject } from '@angular/core';

import { ExportFormat, ExportItem } from '../models';
import { ExportingStateService, ExportType } from '../exporting-state.service';

export const FORMAT_CONFIG: Record<ExportType, ExportFormat[]> = {
  single: ['GeoPackage', 'Excel', 'CSV', 'GeoJSON'],
  spatialUnit: ['GeoPackage', 'Excel', 'CSV'],
  multiple: ['GeoPackage'],
};

@Component({
  selector: 'app-export-format-selection',
  templateUrl: './export-format-selection.component.html',
  styleUrls: ['./export-format-selection.component.scss'],
  imports: [],
  standalone: true,
})
export class ExportFormatSelectionComponent {
  protected srvc = inject(ExportingStateService);

  @Input({ required: true })
  public exportItem!: ExportItem;

  AVAILABLE_FORMATS = computed(() => FORMAT_CONFIG[this.srvc.exportType()]);
}
