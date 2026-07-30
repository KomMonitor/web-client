import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ExportType } from '../exporting-state.service';
import { ExportFormat } from '../models';

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
  @Input({ required: true })
  public selectedFormats: ExportFormat[] = [];

  @Input({ required: true })
  public idPrefix!: string;

  @Input()
  public exportType: ExportType = 'single';

  @Output()
  public formatToggle = new EventEmitter<ExportFormat>();

  get availableFormats(): ExportFormat[] {
    return FORMAT_CONFIG[this.exportType];
  }
}
