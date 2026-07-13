import { Component, inject, OnInit, signal } from '@angular/core';
import { GeoressourceExportItem, IndicatorExportItem, sortTimestamps } from '../models';

import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ExportGeoressourceCardComponent } from '../export-georessource-card/export-georessource-card.component';
import { ExportIndicatorCardComponent } from '../export-indicator-card/export-indicator-card.component';
import { ExportingStateService } from '../exporting-state.service';

@Component({
  selector: 'app-export-dataset-list',
  templateUrl: './export-dataset-list.component.html',
  styleUrls: ['./export-dataset-list.component.scss'],
  imports: [ExportIndicatorCardComponent, ExportGeoressourceCardComponent, NgbNavModule],
  standalone: true,
})
export class ExportDatasetListComponent implements OnInit {
  protected srvc = inject(ExportingStateService);

  activeTab: 'indicators' | 'georessources' = 'indicators';

  combinedConfig = signal<{ level: string; selectedIndicatorIds: string[] }>({
    level: '',
    selectedIndicatorIds: [],
  });

  combinedExportType = signal<'none' | 'indicatorsPerLevel' | 'levelsPerIndicator'>('none');

  openMultiSelectId = signal<string | null>(null);

  sortTimestamps = (timestamps: string[]) => sortTimestamps(timestamps);
  sortTimestampsAsc = (timestamps: string[]) => sortTimestamps(timestamps, 'asc');

  ngOnInit(): void {
    if (this.srvc.indicatorItems().length === 0 && this.srvc.georessourceItems().length > 0) {
      this.activeTab = 'georessources';
    }
  }

  isIndicatorItemValid(item: IndicatorExportItem): boolean {
    return this.srvc.isIndicatorItemValid(item);
  }

  isGeoressourceItemValid(item: GeoressourceExportItem): boolean {
    return this.srvc.isGeoressourceItemValid(item);
  }
}
