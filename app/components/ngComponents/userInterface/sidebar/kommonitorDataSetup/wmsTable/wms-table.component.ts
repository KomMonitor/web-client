import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportButtonVisibilityService } from 'services/export-button-visibility-service/export-button-visibility.service';
import { OgcService } from 'services/ogcServices/ogc.service';
import { WmsDataset } from 'components/ngComponents/models/services.models';

@Component({
  selector: 'app-wms-table',
  templateUrl: './wms-table.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class WmsTableComponent {
  protected readonly exportButtonVisibility = inject(ExportButtonVisibilityService);
  protected readonly ogcService = inject(OgcService);

  @Input() wmsDataList: WmsDataset[] = [];
  @Input() showFavSelection = false;
  @Input() wmsFavItems: string[] = [];

  @Output() wmsToggled = new EventEmitter<WmsDataset>();
  @Output() wmsFavToggled = new EventEmitter<string>();
}
