import { Component, Input } from "@angular/core";
import { AdminTopicsManagementService } from "../admin-topics-management.service";
import {
  AdminTopicsManagementErrorHandlingService,
  Topic,
  TopicResourceType,
} from "../admin-topics-management.component";
import { KommonitorIndicatorDataExchangeService } from "../../../../../services/adminIndicatorUnit/kommonitor-data-exchange.service";

@Component({
  selector: "admin-add-topic",
  templateUrl: "./add-topic.component.html",
  styleUrls: ["./add-topic.component.css"],
})
export class AddTopicComponent {
  @Input({ required: true }) topicResourceType!: TopicResourceType;
  @Input() topicType: "main" | "sub" = "main";
  @Input() parentTopic!: Topic;

  newTopicDescription: string = "";
  newTopicTitle: string = "";

  constructor(
    private srvc: AdminTopicsManagementService,
    private kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private errorHandlingService: AdminTopicsManagementErrorHandlingService
  ) {}

  onAddTopic() {
    this.srvc
      .addTopic(
        this.topicType,
        this.topicResourceType,
        this.newTopicTitle,
        this.newTopicDescription,
        this.parentTopic
      )
      .subscribe({
        next: () => {
          this.newTopicDescription = "";
          this.newTopicTitle = "";
        },
        error: (error) => {
          this.errorHandlingService.errorMessagePart =
            this.kommonitorDataExchangeService.syntaxHighlightJSON(
              error.data || error
            );
        },
      });
  }

  getType() {
    if (this.topicType === "main") {
      return "Hauptthema";
    } else {
      return "Unterthema";
    }
  }
}
