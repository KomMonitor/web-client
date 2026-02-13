import { Component, OnDestroy, OnInit } from "@angular/core";
import { BroadcastService } from "../../../../services/broadcast-service/broadcast.service";
import { Subscription } from "rxjs";
import { KommonitorIndicatorDataExchangeService } from "../../../../services/adminIndicatorUnit/kommonitor-data-exchange.service";

export interface Topic {
  topicDescription: string;
  topicId?: string;
  topicName: string;
  topicResource: string;
  topicType: string;
  displayOrder?: number;
  subTopics: Topic[];
}

export type TopicResourceType = "indicator" | "georesource";
export type TopicOrderMode = "custom" | "alphabetical";

import { Injectable } from "@angular/core";
import {
  AdminTopicsManagementService,
  TopicOrderResponseEntry,
} from "./admin-topics-management.service";
import { ExpandableBoxComponent } from "components/ngComponents/common/expandable-box/expandable-box.component";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { TopicOrderSelectionComponent } from "./topicOrderSelection/topic-order-selection.component";
import { TopicListComponent } from "./topicList/topicList.component";
import { AddTopicComponent } from "./add-topic/add-topic.component";
import { AdminContentViewComponent } from "../admin-content-view/admin-content-view.component";

@Injectable({ providedIn: null })
export class AdminTopicsManagementErrorHandlingService {
  errorMessagePart: string = "";
}

@Component({
  selector: "admin-topics-management",
  templateUrl: "./admin-topics-management.component.html",
  styleUrls: ["./admin-topics-management.component.css"],
  providers: [AdminTopicsManagementErrorHandlingService],
  imports: [
    ExpandableBoxComponent,
    FormsModule,
    CommonModule,
    TopicOrderSelectionComponent,
    TopicListComponent,
    AddTopicComponent,
    AdminContentViewComponent,
  ],
  standalone: true,
})
export class AdminTopicsManagementComponent implements OnInit, OnDestroy {
  showTopicIds = false;
  loadingData = false;

  orderModes: TopicOrderResponseEntry[] | undefined;

  private subscription: Subscription | undefined;

  constructor(
    private kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    protected errorHandlingService: AdminTopicsManagementErrorHandlingService,
    private topicSrvc: AdminTopicsManagementService,
    private broadcastService: BroadcastService,
  ) {}

  get filteredIndicatorTopics(): Topic[] {
    return this.kommonitorDataExchangeService.availableTopics.filter(
      (t) => t.topicType === "main" && t.topicResource === "indicator",
    );
  }

  get filteredGeoRessourceTopics(): Topic[] {
    return this.kommonitorDataExchangeService.availableTopics.filter(
      (t) => t.topicType === "main" && t.topicResource === "georesource",
    );
  }

  ngOnInit(): void {
    this.subscription = this.broadcastService.currentBroadcastMsg.subscribe(
      (broadcastMsg) => {
        if (broadcastMsg.msg === "refreshTopicsOverview") {
          // this.refreshTopicsOverview();
        }
      },
    );

    this.topicSrvc.getOrderModes().subscribe({
      next: (modes) => {
        this.orderModes = modes;
      },
      error: (error) => {
        // TODO: Handle error appropriately
        console.error("Failed to fetch topic order modes:", error);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
