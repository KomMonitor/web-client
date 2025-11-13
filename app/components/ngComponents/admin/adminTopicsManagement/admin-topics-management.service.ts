import { Inject, Injectable } from "@angular/core";
import { Topic, TopicResourceType } from "./admin-topics-management.component";
import { HttpClient } from "@angular/common/http";
import { tap, timeout } from "rxjs";
import { BroadcastService } from "../../../../services/broadcast-service/broadcast.service";
import { KommonitorIndicatorDataExchangeService } from "../../../../services/adminIndicatorUnit/kommonitor-data-exchange.service";

@Injectable({
  providedIn: "root",
})
export class AdminTopicsManagementService {
  constructor(
    private kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private broadcastService: BroadcastService,
    private http: HttpClient
  ) {}

  addTopic(
    topicType: "main" | "sub",
    resourceType: TopicResourceType,
    newTopicTitle: string,
    newTopicDescription: string,
    parentTopic?: Topic
  ) {
    const newTopic: Topic = {
      topicResource: resourceType,
      topicType,
      topicName: newTopicTitle,
      topicDescription: newTopicDescription,
      subTopics: [],
    };

    if (topicType === "main") {
      const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics`;

      return this.http.post(url, newTopic).pipe(
        tap(() => this.reloadTopics()),
        timeout(5000)
      );
    } else {
      if (!parentTopic) {
        throw new Error(
          "Parent topic must be provided when adding a sub topic."
        );
      }
      if (this.alreadyInSubtopics(newTopicTitle, parentTopic.subTopics)) {
        throw new Error(
          "Ein Unterthema mit dem gleichen Titel existiert bereits."
        );
      }
      parentTopic.subTopics.push(newTopic);
      const putBody: Topic = {
        topicId: parentTopic.topicId,
        topicName: parentTopic.topicName,
        topicDescription: parentTopic.topicDescription,
        topicResource: parentTopic.topicResource,
        topicType: parentTopic.topicType,
        // remove this prepare step later, when incoming data is not corrupted anymore
        subTopics: this.prepareSubTopcis(parentTopic.subTopics),
      };

      const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${parentTopic.topicId}`;

      return this.http.put(url, putBody).pipe(
        tap(() => this.reloadTopics()),
        timeout(5000)
      );
    }
  }

  deleteTopic(topicId: string) {
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${topicId}`;
    return this.http.delete(url).pipe(
      tap(() => this.reloadTopics()),
      timeout(5000)
    );
  }

  editTopic(topic: Topic, topicName: string, topicDescription: string) {
    const putBody: Topic = this.prepareTopic({
      ...topic,
      topicName,
      topicDescription,
    });
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${topic.topicId}`;
    return this.http.put(url, putBody).pipe(
      tap(() => this.reloadTopics()),
      timeout(5000)
    );
  }

  updateTopicOrder(topics: Topic[], parentTopic: Topic) {
    const putBody: Topic = this.prepareTopic({
      ...parentTopic,
      subTopics: topics,
    });
    const url = `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${parentTopic.topicId}`;
    return this.http.put(url, putBody).pipe(
      tap(() => this.reloadTopics()),
      timeout(5000)
    );
  }

  private alreadyInSubtopics(
    topicName: string,
    existingTopics: Topic[]
  ): boolean {
    return (
      existingTopics.find((st) => st.topicName === topicName) !== undefined
    );
  }

  private prepareSubTopcis(subTopcis: Topic[]) {
    return subTopcis?.map((e) => this.prepareTopic(e));
  }

  private prepareTopic(e: Topic) {
    return {
      topicDescription: e.topicDescription,
      topicId: e.topicId,
      topicName: e.topicName,
      topicResource: e.topicResource,
      topicType: e.topicType,
      subTopics: this.prepareSubTopcis(e.subTopics),
    };
  }

  private reloadTopics() {
    this.kommonitorDataExchangeService
      .fetchTopicsMetadata(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles
      )
      .then(() => {
        this.broadcastService.broadcast("refreshTopicsOverview");
        this.broadcastService.broadcast("refreshAdminDashboardDiagrams");
      });
  }
}
