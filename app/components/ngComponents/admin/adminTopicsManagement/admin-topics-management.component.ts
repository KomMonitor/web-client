import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { kommonitorCacheHelperService } from 'util/genericServices/kommonitorCacheHelperService/kommonitor-cache-helper-service.module';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { kommonitorDataExchangeService } from 'util/genericServices/kommonitorDataExchangeService/kommonitor-data-exchange-service.module';

@Component({
  selector: 'admin-topics-management-new',
  templateUrl: './admin-topics-management.component.html',
  styleUrls: ['./admin-topics-management.component.css']
})
export class AdminTopicsManagementComponent implements OnInit, OnDestroy {
  newMainTopicTitle_indicator: string = '';
  newMainTopicDescription_indicator: string = '';
  newMainTopicTitle_georesource: string = '';
  newMainTopicDescription_georesource: string = '';
  showTopicIds = false;
  unCollapsedTopicIds: string[] = [];
  errorMessagePart: string = '';
  loadingData = false;
  private subscription: Subscription | undefined;

  constructor(
    public dataExchangeService: DataExchangeService,
    private cacheHelperService: kommonitorCacheHelperService,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    private kommonitorDataExchangeService: kommonitorDataExchangeService
  ) {}

  ngOnInit() {
    // Initialize any adminLTE box widgets
    ($('.box') as any).boxWidget();

    this.addClickListenerToEachCollapseTrigger();

    // Subscribe to refresh topics overview event
    this.subscription = this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      if (broadcastMsg.msg === 'refreshTopicsOverview') {
        this.refreshTopicsOverview();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private addClickListenerToEachCollapseTrigger() {
    setTimeout(() => {
      $('.list-group-item > .collapseTrigger').on('click', (event) => {
        $('.glyphicon', event.currentTarget)
          .toggleClass('glyphicon-chevron-right')
          .toggleClass('glyphicon-chevron-down');

        // manage uncollapsed entries
        const clickedTopicId = $(event.currentTarget).attr('id');
        if (this.unCollapsedTopicIds.includes(clickedTopicId)) {
          const index = this.unCollapsedTopicIds.indexOf(clickedTopicId);
          this.unCollapsedTopicIds.splice(index, 1);
        } else {
          this.unCollapsedTopicIds.push(clickedTopicId);
        }
      });
    }, 500);
  }

  refreshTopicsOverview() {
    this.loadingData = true;

    this.unCollapsedTopicIds.forEach(topicId => {
      // simulate click on item in order to uncollapse it
      $(`#${topicId}`).trigger('click');
    });

    this.addClickListenerToEachCollapseTrigger();
    this.loadingData = false;
  }

  async onAddMainTopic(resourceType: string) {
    const postBody = {
      topicResource: resourceType,
      topicType: 'main',
      subTopics: []
    };

    if (resourceType === 'indicator') {
      postBody['topicName'] = this.newMainTopicTitle_indicator;
      postBody['topicDescription'] = this.newMainTopicDescription_indicator;
    } else {
      postBody['topicName'] = this.newMainTopicTitle_georesource;
      postBody['topicDescription'] = this.newMainTopicDescription_georesource;
    }

    this.loadingData = true;

    try {
      const response = await this.http.post(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics`,
        postBody
      ).toPromise();

      await this.kommonitorDataExchangeService.fetchTopicsMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles);
      this.refreshTopicsOverview();
      this.broadcastService.broadcast('refreshAdminDashboardDiagrams');

      // Reset form fields
      this.newMainTopicTitle_indicator = '';
      this.newMainTopicDescription_indicator = '';
      this.newMainTopicTitle_georesource = '';
      this.newMainTopicDescription_georesource = '';
    } catch (error: any) {
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data || error);
      $('#topicsErrorAlert').show();
    } finally {
      this.loadingData = false;
    }
  }

  async onAddSubTopic(mainTopic: any, resourceType: string) {
    this.loadingData = true;
    const topicId = mainTopic.topicId;

    const subTopic = {
      topicResource: resourceType,
      topicType: 'sub',
      subTopics: []
    };

    if (resourceType === 'indicator') {
      subTopic['topicName'] = mainTopic.newSubTopicTitle_indicator;
      subTopic['topicDescription'] = mainTopic.newSubTopicDescription_indicator;
    } else {
      subTopic['topicName'] = mainTopic.newSubTopicTitle_georesource;
      subTopic['topicDescription'] = mainTopic.newSubTopicDescription_georesource;
    }

    // Check if subTopic already exists
    if (this.alreadyInSubtopics(subTopic, mainTopic.subTopics)) {
      this.errorMessagePart = 'Ein Unterthema mit dem gleichen Titel existiert bereits.';
      $('#topicsErrorAlert').show();
      this.loadingData = false;
      return;
    }

    mainTopic.subTopics.push(subTopic);

    const putBody = {
      topicName: mainTopic.topicName,
      topicDescription: mainTopic.topicDescription,
      topicResource: resourceType,
      topicType: mainTopic.topicType,
      subTopics: mainTopic.subTopics
    };

    try {
      const response = await this.http.put(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${topicId}`,
        putBody
      ).toPromise();

      await this.kommonitorDataExchangeService.fetchTopicsMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles);
      this.refreshTopicsOverview();
      this.broadcastService.broadcast('refreshAdminDashboardDiagrams');
    } catch (error: any) {
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data || error);
      $('#topicsErrorAlert').show();
    } finally {
      this.loadingData = false;
    }
  }

  alreadyInSubtopics(newTopic: any, existingTopics: any[]): boolean {
    return existingTopics.some(topic => topic.topicName === newTopic.topicName);
  }

  onClickEditTopic(topic: any) {
    // Implementation for edit topic modal
  }

  onClickDeleteTopic(topic: any) {
    // Implementation for delete topic modal
  }
} 