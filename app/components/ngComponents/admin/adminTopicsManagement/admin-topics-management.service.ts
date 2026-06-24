import { Injectable, inject } from '@angular/core';
import { Topic, TopicOrderMode, TopicResourceType } from './admin-topics-management.component';
import { HttpClient } from '@angular/common/http';
import { map, tap, timeout } from 'rxjs';
import { BroadcastService } from '../../../../services/broadcast-service/broadcast.service';
import { EnvConfigService } from '../../../../services/env-config-service/env-config.service';
import { DataExchangeService } from '../../../../services/data-exchange-service/data-exchange.service';
import { AccessControlService } from '../../../../services/access-control-service/access-control.service';

export interface TopicOrderResponseEntry {
  topicResource: TopicResourceType;
  orderMode: TopicOrderMode;
}
@Injectable({
  providedIn: 'root',
})
export class AdminTopicsManagementService {
  private broadcastService = inject(BroadcastService);
  private http = inject(HttpClient);
  private envConfigService = inject(EnvConfigService);
  private dataExchangeService = inject(DataExchangeService);
  private accessControlService = inject(AccessControlService);

  addTopic(
    topicType: 'main' | 'sub',
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

    if (topicType === 'main') {
      const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/topics`;

      return this.http.post(url, newTopic).pipe(
        tap(() => this.reloadTopics()),
        timeout(5000)
      );
    } else {
      if (!parentTopic) {
        throw new Error('Parent topic must be provided when adding a sub topic.');
      }
      if (this.alreadyInSubtopics(newTopicTitle, parentTopic.subTopics)) {
        throw new Error('Ein Unterthema mit dem gleichen Titel existiert bereits.');
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

      const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/topics/${parentTopic.topicId}`;

      return this.http.put(url, putBody).pipe(
        tap(() => this.reloadTopics()),
        timeout(5000)
      );
    }
  }

  deleteTopic(topicId: string) {
    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/topics/${topicId}`;
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
    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/topics/${topic.topicId}`;
    return this.http.put(url, putBody).pipe(
      tap(() => this.reloadTopics()),
      timeout(5000)
    );
  }

  updateSubTopicOrder(parentTopic: Topic, topics: Topic[]) {
    const patchBody = topics.map((t, index) => ({
      topicId: t.topicId,
      displayOrder: index,
    }));
    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/topics/${parentTopic.topicId}/display-order`;
    return this.http.patch(url, patchBody).pipe(
      tap(() => this.reloadTopics()),
      timeout(5000)
    );
  }

  updateMainTopicOrder(topicResourceType: TopicResourceType, mainTopics: Topic[]) {
    const postBody = mainTopics.map((t, index) => ({
      topicId: t.topicId,
      displayOrder: index,
    }));
    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/topics/${topicResourceType}s/display-order`;
    return this.http.post(url, postBody).pipe(
      tap(() => this.reloadTopics()),
      timeout(5000)
    );
  }

  setOrderMode(topicResourceType: TopicResourceType, orderMode: TopicOrderMode) {
    const postBody = {
      orderMode: orderMode,
    };
    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/topics/${topicResourceType}s/display-order/mode`;
    return this.http.post(url, postBody).pipe(timeout(5000));
  }

  getOrderModes() {
    const url = `${this.envConfigService.baseUrlToKomMonitorDataAPI}/public/topics/display-order/mode`;
    return this.http.get<TopicOrderResponseEntry[]>(url).pipe(timeout(5000));
  }

  getOrderMode(topicResourceType: TopicResourceType) {
    return this.getOrderModes().pipe(
      map((res) => res.find((e) => e.topicResource === topicResourceType)?.orderMode)
    );
  }

  private alreadyInSubtopics(topicName: string, existingTopics: Topic[]): boolean {
    return existingTopics.find((st) => st.topicName === topicName) !== undefined;
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
    this.dataExchangeService
      .fetchTopicsMetadata(this.accessControlService.currentKeycloakLoginRoles)
      .then(() => {
        this.broadcastService.broadcast('refreshTopicsOverview');
        this.broadcastService.broadcast('refreshAdminDashboardDiagrams');
      });
  }
}
