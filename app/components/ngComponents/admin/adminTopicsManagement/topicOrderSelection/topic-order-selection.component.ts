import { Component, Input, OnInit } from "@angular/core";
import {
  TopicOrderMode,
  TopicResourceType,
} from "../admin-topics-management.component";
import {
  AdminTopicsManagementService,
  TopicOrderResponseEntry,
} from "../admin-topics-management.service";

@Component({
  selector: "topic-order-selection",
  templateUrl: "./topic-order-selection.component.html",
  styleUrls: ["./topic-order-selection.component.css"],
})
export class TopicOrderSelectionComponent implements OnInit {
  @Input({ required: true }) orderModes!: TopicOrderResponseEntry[];
  @Input({ required: true }) topicResourceType!: TopicResourceType;

  selectedOption: TopicOrderMode | undefined;

  constructor(private topicSrvc: AdminTopicsManagementService) {}

  ngOnInit() {
    const match = this.orderModes.find(
      (mode) => mode.topicResource === this.topicResourceType
    );
    if (match) {
      this.selectedOption = match.orderMode;
    }
  }

  setOption(mode: TopicOrderMode) {
    this.topicSrvc.setOrderMode(this.topicResourceType, mode).subscribe({
      next: () => {},
      error: (error) => {
        console.error("Failed to set topic order mode:", error);
      },
    });
  }
}
