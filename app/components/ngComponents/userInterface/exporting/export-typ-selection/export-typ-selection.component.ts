import { Component, inject } from '@angular/core';
import { ExportingStateService, ExportType } from '../exporting-state.service';
import { ExportFormatSelectionComponent } from '../export-format-selection/export-format-selection.component';

@Component({
  selector: 'app-export-typ-selection',
  templateUrl: './export-typ-selection.component.html',
  styleUrls: ['./export-typ-selection.component.scss'],
  imports: [ExportFormatSelectionComponent],
  standalone: true,
})
export class ExportTypSelectionComponent {
  protected srvc = inject(ExportingStateService);

  options: { val: ExportType; label: string }[] = [
    { val: 'single', label: 'Einzel-Export (Standard)' },
    {
      val: 'spatialUnit',
      label: 'Mehrere Indikatoren für eine Raumebene',
    },
    {
      val: 'multiple',
      label: 'Ein Indikator für mehrere Raumebenen',
    },
  ];

  updateSelectedSpatialUnit(evt: Event): void {
    const value = (evt.target as HTMLSelectElement).value;
    this.srvc.selectedSpatialUnit.set(value);
  }

  setSelectionType(type: ExportType): void {
    this.srvc.exportType.set(type);
  }
}
