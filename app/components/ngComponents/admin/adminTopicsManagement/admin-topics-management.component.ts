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
  subTopics: Topic[];
}

export type TopicResourceType = "indicator" | "georesource";

import { Injectable } from "@angular/core";

@Injectable({ providedIn: null })
export class AdminTopicsManagementErrorHandlingService {
  errorMessagePart: string = "";
}

@Component({
  selector: "admin-topics-management",
  templateUrl: "./admin-topics-management.component.html",
  styleUrls: ["./admin-topics-management.component.css"],
  providers: [AdminTopicsManagementErrorHandlingService],
})
export class AdminTopicsManagementComponent implements OnInit, OnDestroy {
  showTopicIds = false;
  loadingData = false;

  private subscription: Subscription | undefined;

  constructor(
    private kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    protected errorHandlingService: AdminTopicsManagementErrorHandlingService,
    private broadcastService: BroadcastService
  ) {}

  get filteredIndicatorTopics(): Topic[] {
    return this.kommonitorDataExchangeService.availableTopics.filter(
      (t) => t.topicType === "main" && t.topicResource === "indicator"
    );
  }

  get filteredGeoRessourceTopics(): Topic[] {
    return this.kommonitorDataExchangeService.availableTopics.filter(
      (t) => t.topicType === "main" && t.topicResource === "georesource"
    );
  }

  ngOnInit(): void {
    this.subscription = this.broadcastService.currentBroadcastMsg.subscribe(
      (broadcastMsg) => {
        if (broadcastMsg.msg === "refreshTopicsOverview") {
          // this.refreshTopicsOverview();
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
