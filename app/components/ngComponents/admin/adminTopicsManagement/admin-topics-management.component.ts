import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { DataExchangeService } from 'services/data-exchange-service/data-exchange.service';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TopicEditModalComponent } from './topicEditModal/topic-edit-modal.component';

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
  currentTopic: any;
  topics: any[] = [];

  // Add collapse state tracking
  collapsedTopics: { [key: string]: boolean } = {};

  constructor(
    @Inject('kommonitorDataExchangeService') public kommonitorDataExchangeService: any,
    @Inject('kommonitorCacheHelperService') private kommonitorCacheHelperService: any,
    private broadcastService: BroadcastService,
    private http: HttpClient,
    private modalService: NgbModal
  ) {
    console.log('AdminTopicsManagementComponent constructor initialized');
  }

  get filteredIndicatorTopics() {
    return this.kommonitorDataExchangeService.availableTopics
      .filter(t => t.topicType === 'main' && t.topicResource === 'indicator');
  }

  get filteredGeoresourceTopics() {
    return this.kommonitorDataExchangeService.availableTopics
      .filter(t => t.topicType === 'main' && t.topicResource === 'georesource');
  }

  toggleCollapse(topicId: string, event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.collapsedTopics[topicId] = !this.collapsedTopics[topicId];
    
    // Update unCollapsedTopicIds array to maintain compatibility
    if (this.collapsedTopics[topicId]) {
      const index = this.unCollapsedTopicIds.indexOf(topicId);
      if (index > -1) {
        this.unCollapsedTopicIds.splice(index, 1);
      }
    } else {
      if (!this.unCollapsedTopicIds.includes(topicId)) {
        this.unCollapsedTopicIds.push(topicId);
      }
    }
  }

  isCollapsed(topicId: string): boolean {
    return !this.collapsedTopics[topicId];
  }

  ngOnInit() {
    console.log('AdminTopicsManagementComponent ngOnInit');
    // Initialize any adminLTE box widgets
    ($('.box') as any).boxWidget();

    this.addClickListenerToEachCollapseTrigger();

    // Subscribe to refresh topics overview event
    this.subscription = this.broadcastService.currentBroadcastMsg.subscribe(broadcastMsg => {
      if (broadcastMsg.msg === 'refreshTopicsOverview') {
        this.refreshTopicsOverview();
      }
    });

    this.loadTopics();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private addClickListenerToEachCollapseTrigger() {
    console.log('Setting up collapse triggers');
    setTimeout(() => {
      $('.list-group-item > .collapseTrigger').on('click', (event) => {
        console.log('Collapse trigger clicked:', event.currentTarget);
        $('.glyphicon', event.currentTarget as Element)
          .toggleClass('glyphicon-chevron-right')
          .toggleClass('glyphicon-chevron-down');

        // manage uncollapsed entries
        const clickedTopicId = $(event.currentTarget as HTMLElement).attr('id');
        console.log('Clicked topic ID:', clickedTopicId);
        if (clickedTopicId && this.unCollapsedTopicIds.includes(clickedTopicId)) {
          const index = this.unCollapsedTopicIds.indexOf(clickedTopicId);
          this.unCollapsedTopicIds.splice(index, 1);
          console.log('Removed from unCollapsedTopicIds:', clickedTopicId);
        } else if (clickedTopicId) {
          this.unCollapsedTopicIds.push(clickedTopicId);
          console.log('Added to unCollapsedTopicIds:', clickedTopicId);
        }
      });
    }, 500);
  }

  refreshTopicsOverview() {
    console.log('Refreshing topics overview');
    this.loadingData = true;

    this.unCollapsedTopicIds.forEach(topicId => {
      console.log('Triggering click on topic:', topicId);
      // simulate click on item in order to uncollapse it
      $(`#${topicId}`).trigger('click');
    });

    this.addClickListenerToEachCollapseTrigger();
    this.loadingData = false;
    console.log('Topics overview refresh complete');
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
      ).pipe(timeout(5000)).toPromise();

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
      setTimeout(() => {
        this.loadingData = false;
      }, 500);
    }
  }

  async onAddSubTopic(mainTopic: any, resourceType: string) {
    console.log('onAddSubTopic called with:', { mainTopic, resourceType });
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

    console.log('Created subTopic:', subTopic);

    // Check if subTopic already exists
    if (this.alreadyInSubtopics(subTopic, mainTopic.subTopics)) {
      console.log('SubTopic already exists');
      this.errorMessagePart = 'Ein Unterthema mit dem gleichen Titel existiert bereits.';
      $('#topicsErrorAlert').show();
      this.loadingData = false;
      return;
    }

    mainTopic.subTopics.push(subTopic);
    console.log('Added subTopic to mainTopic.subTopics');

    const putBody = {
      topicName: mainTopic.topicName,
      topicDescription: mainTopic.topicDescription,
      topicResource: resourceType,
      topicType: mainTopic.topicType,
      subTopics: mainTopic.subTopics
    };

    console.log('Sending PUT request with body:', putBody);

    try {
      const response = await this.http.put(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${topicId}`,
        putBody
      ).pipe(timeout(5000)).toPromise();

      console.log('PUT request successful:', response);

      await this.kommonitorDataExchangeService.fetchTopicsMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles);
      console.log('Fetched updated topics metadata');

      this.refreshTopicsOverview();
      console.log('Refreshed topics overview');

      this.broadcastService.broadcast('refreshAdminDashboardDiagrams');
      console.log('Broadcasted refreshAdminDashboardDiagrams');

      // Reset form fields
      mainTopic.newSubTopicTitle_indicator = '';
      mainTopic.newSubTopicDescription_indicator = '';
      mainTopic.newSubTopicTitle_georesource = '';
      mainTopic.newSubTopicDescription_georesource = '';
      console.log('Reset form fields');
    } catch (error: any) {
      console.error('Error in onAddSubTopic:', error);
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data || error);
      $('#topicsErrorAlert').show();
    } finally {
      setTimeout(() => {
        this.loadingData = false;
        console.log('Loading state cleared');
      }, 500);
    }
  }

  async onAddSubSubTopic(subTopic: any, resourceType: string) {
    this.loadingData = true;
    const topicId = subTopic.topicId;

    const subSubTopic = {
      topicResource: resourceType,
      topicType: 'sub',
      subTopics: []
    };

    if (resourceType === 'indicator') {
      subSubTopic['topicName'] = subTopic.newSubTopicTitle_indicator;
      subSubTopic['topicDescription'] = subTopic.newSubTopicDescription_indicator;
    } else {
      subSubTopic['topicName'] = subTopic.newSubTopicTitle_georesource;
      subSubTopic['topicDescription'] = subTopic.newSubTopicDescription_georesource;
    }

    // Check if subSubTopic already exists
    if (this.alreadyInSubtopics(subSubTopic, subTopic.subTopics)) {
      this.errorMessagePart = 'Ein Unterthema mit dem gleichen Titel existiert bereits.';
      $('#topicsErrorAlert').show();
      this.loadingData = false;
      return;
    }

    subTopic.subTopics.push(subSubTopic);

    const putBody = {
      topicName: subTopic.topicName,
      topicDescription: subTopic.topicDescription,
      topicResource: resourceType,
      topicType: subTopic.topicType,
      subTopics: subTopic.subTopics
    };

    try {
      const response = await this.http.put(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${topicId}`,
        putBody
      ).pipe(timeout(5000)).toPromise();

      await this.kommonitorDataExchangeService.fetchTopicsMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles);
      this.refreshTopicsOverview();
      this.broadcastService.broadcast('refreshAdminDashboardDiagrams');

      // Reset form fields
      subTopic.newSubTopicTitle_indicator = '';
      subTopic.newSubTopicDescription_indicator = '';
      subTopic.newSubTopicTitle_georesource = '';
      subTopic.newSubTopicDescription_georesource = '';
    } catch (error: any) {
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data || error);
      $('#topicsErrorAlert').show();
    } finally {
      setTimeout(() => {
        this.loadingData = false;
      }, 500);
    }
  }

  async onAddSubSubSubTopic(subSubTopic: any, resourceType: string) {
    this.loadingData = true;
    const topicId = subSubTopic.topicId;

    const subSubSubTopic = {
      topicResource: resourceType,
      topicType: 'sub',
      subTopics: []
    };

    if (resourceType === 'indicator') {
      subSubSubTopic['topicName'] = subSubTopic.newSubTopicTitle_indicator;
      subSubSubTopic['topicDescription'] = subSubTopic.newSubTopicDescription_indicator;
    } else {
      subSubSubTopic['topicName'] = subSubTopic.newSubTopicTitle_georesource;
      subSubSubTopic['topicDescription'] = subSubTopic.newSubTopicDescription_georesource;
    }

    // Check if subSubSubTopic already exists
    if (this.alreadyInSubtopics(subSubSubTopic, subSubTopic.subTopics)) {
      this.errorMessagePart = 'Ein Unterthema mit dem gleichen Titel existiert bereits.';
      $('#topicsErrorAlert').show();
      this.loadingData = false;
      return;
    }

    subSubTopic.subTopics.push(subSubSubTopic);

    const putBody = {
      topicName: subSubTopic.topicName,
      topicDescription: subSubTopic.topicDescription,
      topicResource: resourceType,
      topicType: subSubTopic.topicType,
      subTopics: subSubTopic.subTopics
    };

    try {
      const response = await this.http.put(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${topicId}`,
        putBody
      ).pipe(timeout(5000)).toPromise();

      await this.kommonitorDataExchangeService.fetchTopicsMetadata(this.kommonitorDataExchangeService.currentKeycloakLoginRoles);
      this.refreshTopicsOverview();
      this.broadcastService.broadcast('refreshAdminDashboardDiagrams');

      // Reset form fields
      subSubTopic.newSubTopicTitle_indicator = '';
      subSubTopic.newSubTopicDescription_indicator = '';
      subSubTopic.newSubTopicTitle_georesource = '';
      subSubTopic.newSubTopicDescription_georesource = '';
    } catch (error: any) {
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data || error);
      $('#topicsErrorAlert').show();
    } finally {
      setTimeout(() => {
        this.loadingData = false;
      }, 500);
    }
  }

  alreadyInSubtopics(newTopic: any, existingTopics: any[]): boolean {
    for (const subTopic of existingTopics) {
      if (subTopic.topicName === newTopic.topicName) {
        return true;
      }
    }
    return false;
  }

  onClickEditTopic(topic: any) {
    console.log('Edit topic clicked:', topic);
    this.currentTopic = topic;
    
    // Open modal using NgbModal
    const modalRef = this.modalService.open(TopicEditModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body'
    });
    
    // Pass the current topic to the modal
    modalRef.componentInstance.currentTopic = topic;
    
    // Handle modal result
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        if (result.action === 'updated') {
          this.loadTopics();
        }
      },
      (reason) => {
        console.log('Modal dismissed with reason:', reason);
      }
    );
  }

  onClickDeleteTopic(topic: any) {
    this.broadcastService.broadcast('openTopicDeleteModal', topic);
  }

  async deleteTopic(topic: any) {
    const topicId = topic.topicId;
    this.loadingData = true;

    try {
      await this.http.delete(
        `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${topicId}`
      ).pipe(timeout(5000)).toPromise();

      await this.kommonitorDataExchangeService.fetchTopicsMetadata(
        this.kommonitorDataExchangeService.currentKeycloakLoginRoles
      );
      this.refreshTopicsOverview();
    } catch (error: any) {
      this.errorMessagePart = this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data || error);
      $('#topicsErrorAlert').show();
    } finally {
      setTimeout(() => {
        this.loadingData = false;
      }, 500);
    }
  }

  hideErrorAlert() {
    $('#topicsErrorAlert').hide();
  }

  loadTopics() {
    console.log('Loading topics...');
    this.kommonitorDataExchangeService.getTopics()
      .then(topics => {
        console.log('Topics loaded:', topics);
        this.topics = topics;
      })
      .catch(error => {
        console.error('Error loading topics:', error);
      });
  }

  onTopicUpdated(updatedTopic: any) {
    console.log('Topic updated:', updatedTopic);
    this.loadTopics();
  }
} 