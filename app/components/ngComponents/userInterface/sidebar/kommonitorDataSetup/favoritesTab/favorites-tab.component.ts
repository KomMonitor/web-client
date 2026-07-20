import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { IndicatorMetadataTooltipComponent } from 'components/ngComponents/customElements/indicator-metadata-tooltip/indicator-metadata-tooltip.component';
import {
  IndicatorsDataset,
  IndicatorsTopicsHierarchy,
} from 'components/ngComponents/models/indicators.models';
import { WmsDataset } from 'components/ngComponents/models/services.models';
import { ExportItemCheckboxComponent } from 'components/ngComponents/userInterface/exporting/export-item-checkbox/export-item-checkbox.component';
import { ExportingStateService } from 'components/ngComponents/userInterface/exporting/exporting-state.service';
import { Indicator } from 'components/ngComponents/userInterface/exporting/models';
import { IndicatorFavFilter } from 'pipes/indicator-fav-filter.pipe';
import { SelectionStateService } from 'services/selection-state-service/selection-state.service';
import { ExportModeService } from '../export-mode.service';
import { KommonitorDataSetupService } from '../kommonitor-data-setup.service';
import { WmsTableComponent } from '../wmsTable/wms-table.component';

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
  private readonly exportState = inject(ExportingStateService);

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

  /** Adds every favourite indicator currently shown in this view to the export selection. */
  selectAllForExport(): void {
    this.collectFavoriteIndicators().forEach((data) =>
      this.exportState.addIndicator(this.toExportIndicator(data))
    );
  }

  /** Removes every favourite indicator shown in this view from the export selection. */
  deselectAllForExport(): void {
    this.collectFavoriteIndicators().forEach((data) =>
      this.exportState.removeIndicator(data.indicatorId)
    );
  }

  /**
   * Collects all favourite indicators from the topic tree: those the user starred
   * individually plus every indicator below a starred topic.
   */
  private collectFavoriteIndicators(): IndicatorsDataset[] {
    const result: IndicatorsDataset[] = [];
    const walk = (topics: any[], ancestorTopicFav: boolean): void => {
      for (const topic of topics ?? []) {
        const topicFav = ancestorTopicFav || this.indicatorTopicFavItems.includes(topic.topicId);
        for (const data of topic.indicatorData ?? []) {
          if (topicFav || this.indicatorFavItems.includes(data.indicatorId)) {
            result.push(data);
          }
        }
        if (topic.subTopics?.length) {
          walk(topic.subTopics, topicFav);
        }
      }
    };
    walk(this.indicatorFavTopicsTree, false);
    return result;
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
