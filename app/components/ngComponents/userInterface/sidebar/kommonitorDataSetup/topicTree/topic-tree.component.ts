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
import { DataExchangeService } from "services/data-exchange-service/data-exchange.service";
import { KommonitorDataSetupService } from "../kommonitor-data-setup.service";
import { IndicatorsTopicsHierarchy } from "components/ngComponents/models/indicators.models";
import { WmsDataset } from "components/ngComponents/models/services.models";
import { IndicatorMetadataTooltipComponent } from "components/ngComponents/customElements/indicator-metadata-tooltip/indicator-metadata-tooltip.component";
import { WmsTableComponent } from "../wmsTable/wms-table.component";

@Component({
  selector: "app-topic-tree",
  templateUrl: "./topic-tree.component.html",
  styleUrls: ["./topic-tree.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    IndicatorMetadataTooltipComponent,
    WmsTableComponent,
  ],
})
export class TopicTreeComponent implements OnChanges {
  protected readonly dataExchangeService = inject(DataExchangeService);
  private readonly dataSetupService = inject(KommonitorDataSetupService);

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

  private initCollapsedState(topics: IndicatorsTopicsHierarchy[]): void {
    topics.forEach((topic) => {
      this.collapsedTopicIds.push(topic.topicId);
      if (topic.subTopics.length > 0) {
        this.initCollapsedState(topic.subTopics);
      }
    });
  }
}
