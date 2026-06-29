import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { KommonitorDataSetupService } from '../kommonitor-data-setup.service';
import { ExportModeService } from '../export-mode.service';
import {
  IndicatorsDataset,
  IndicatorsTopicsHierarchy,
} from 'components/ngComponents/models/indicators.models';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { IndicatorFavFilter } from 'pipes/indicator-fav-filter.pipe';
import { IndicatorMetadataTooltipComponent } from 'components/ngComponents/customElements/indicator-metadata-tooltip/indicator-metadata-tooltip.component';
import { WmsTableComponent } from '../wmsTable/wms-table.component';
import { ExportItemCheckboxComponent } from 'components/ngComponents/userInterface/exporting/export-item-checkbox/export-item-checkbox.component';
import { Indicator } from 'components/ngComponents/userInterface/exporting/models';

@Component({
  selector: 'app-favorites-tab',
  templateUrl: './favorites-tab.component.html',
  styleUrls: ['./favorites-tab.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IndicatorFavFilter,
    IndicatorMetadataTooltipComponent,
    WmsTableComponent,
    ExportItemCheckboxComponent,
  ],
})
export class FavoritesTabComponent implements OnChanges {
  protected readonly selectionState = inject(SelectionStateService);
  private readonly dataSetupService = inject(KommonitorDataSetupService);
  protected readonly exportModeService = inject(ExportModeService);

  @Input() indicatorFavTopicsTree: any[] = [];
  @Input() indicatorTopicFavItems: any[] = [];
  @Input() indicatorFavItems: any[] = [];
  @Input() wmsFavItems: any[] = [];
  @Input() showFavSelection = false;

  @Output() indicatorTopicFavToggled = new EventEmitter<string>();
  @Output() indicatorFavToggled = new EventEmitter<string>();
  @Output() wmsFavToggled = new EventEmitter<string>();
  @Output() indicatorSelected = new EventEmitter<any>();
  @Output() wmsToggled = new EventEmitter<WmsDataset>();

  collapsedTopicIds: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['indicatorFavTopicsTree']) {
      this.collapsedTopicIds = [];
      this.initCollapsedState(this.indicatorFavTopicsTree);
    }
  }

  onTopicClick(topicId: string): void {
    if (this.collapsedTopicIds.includes(topicId)) {
      this.collapsedTopicIds = this.collapsedTopicIds.filter((e) => e !== topicId);
    } else {
      this.collapsedTopicIds.push(topicId);
    }
  }

  checkHierarchyIndicatorSelected(topic: IndicatorsTopicsHierarchy): boolean {
    return this.dataSetupService.isTopicContainingSelectedIndicator(topic);
  }

  toExportIndicator(indicator: IndicatorsDataset): Indicator {
    return this.dataSetupService.toExportIndicator(indicator);
  }

  private initCollapsedState(tree: any[]): void {
    tree.forEach((topic) => {
      this.collapsedTopicIds.push(topic.topicId);
      if (topic.subTopics?.length > 0) {
        this.initCollapsedState(topic.subTopics);
      }
    });
  }
}
