import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { SelectionStateService } from "services/selection-state-service/selection-state.service";
import { KommonitorDataSetupService } from "../kommonitor-data-setup.service";
import { ExportModeService } from "../export-mode.service";
import {
  IndicatorsDataset,
  IndicatorsTopicsHierarchy,
} from "components/ngComponents/models/indicators.models";
import { WmsDataset } from "components/ngComponents/models/services.models";
import { IndicatorMetadataTooltipComponent } from "components/ngComponents/customElements/indicator-metadata-tooltip/indicator-metadata-tooltip.component";
import { WmsTableComponent } from "../wmsTable/wms-table.component";
import { ExportItemCheckboxComponent } from "components/ngComponents/userInterface/exporting/export-item-checkbox/export-item-checkbox.component";
import { Indicator } from "components/ngComponents/userInterface/exporting/models";

@Component({
  selector: "app-topic-tree",
  templateUrl: "./topic-tree.component.html",
  styleUrls: ["./topic-tree.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    IndicatorMetadataTooltipComponent,
    WmsTableComponent,
    ExportItemCheckboxComponent,
  ],
})
export class TopicTreeComponent implements OnChanges {
  protected readonly selectionState = inject(SelectionStateService);
  private readonly dataSetupService = inject(KommonitorDataSetupService);
  protected readonly exportModeService = inject(ExportModeService);

  @Input() topics: IndicatorsTopicsHierarchy[] = [];
  @Input() showFavSelection = false;
  @Input() indicatorTopicFavItems: string[] = [];
  @Input() indicatorFavItems: string[] = [];
  @Input() wmsFavItems: string[] = [];

  @Output() indicatorClicked = new EventEmitter<any>();
  @Output() wmsToggled = new EventEmitter<WmsDataset>();
  @Output() indicatorTopicFavToggled = new EventEmitter<string>();
  @Output() indicatorFavToggled = new EventEmitter<string>();
  @Output() wmsFavToggled = new EventEmitter<string>();

  collapsedTopicIds: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["topics"]) {
      this.collapsedTopicIds = [];
      this.initCollapsedState(this.topics);
    }
  }

  onTopicClick(topicId: string): void {
    if (this.collapsedTopicIds.includes(topicId)) {
      this.collapsedTopicIds = this.collapsedTopicIds.filter(
        (e) => e !== topicId,
      );
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

  private initCollapsedState(topics: IndicatorsTopicsHierarchy[]): void {
    topics.forEach((topic) => {
      this.collapsedTopicIds.push(topic.topicId);
      if (topic.subTopics.length > 0) {
        this.initCollapsedState(topic.subTopics);
      }
    });
  }
}
