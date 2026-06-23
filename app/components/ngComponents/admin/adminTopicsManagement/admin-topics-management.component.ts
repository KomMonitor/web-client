import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { BroadcastService } from '../../../../services/broadcast-service/broadcast.service';

export interface Topic {
  topicDescription: string;
  topicId?: string;
  topicName: string;
  topicResource: string;
  topicType: string;
  displayOrder?: number;
  subTopics: Topic[];
}

export type TopicResourceType = 'indicator' | 'georesource';
export type TopicOrderMode = 'custom' | 'alphabetical';

import { Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminTopicsManagementService } from './admin-topics-management.service';

import { DataExchangeService } from '../../../../services/data-exchange-service/data-exchange.service';
import { ExpandableBoxComponent } from '../../common/expandable-box/expandable-box.component';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { AddTopicComponent } from './add-topic/add-topic.component';
import { TopicListComponent } from './topicList/topicList.component';
import { TopicOrderSelectionComponent } from './topicOrderSelection/topic-order-selection.component';

@Injectable({ providedIn: null })
export class AdminTopicsManagementErrorHandlingService {
  errorMessagePart: string = '';
}

@Component({
  selector: 'app-admin-topics-management',
  templateUrl: './admin-topics-management.component.html',
  styleUrls: ['./admin-topics-management.component.scss'],
  providers: [AdminTopicsManagementErrorHandlingService],
  imports: [
    ExpandableBoxComponent,
    FormsModule,
    TopicOrderSelectionComponent,
    TopicListComponent,
    AddTopicComponent,
    AdminContentViewComponent,
  ],
  standalone: true,
})
export class AdminTopicsManagementComponent implements OnInit, OnDestroy {
  protected errorHandlingService = inject(AdminTopicsManagementErrorHandlingService);
  private topicSrvc = inject(AdminTopicsManagementService);
  private broadcastService = inject(BroadcastService);
  private dataExchangeService = inject(DataExchangeService);

  showTopicIds = false;
  loadingData = false;

  indicatorOrder: TopicOrderMode | undefined;
  geoRessourceOrder: TopicOrderMode | undefined;

  private subscription: Subscription | undefined;

  get filteredIndicatorTopics(): Topic[] {
    return this.dataExchangeService.availableTopics.filter(
      (t) => t.topicType === 'main' && t.topicResource === 'indicator'
    );
  }

  get filteredGeoRessourceTopics(): Topic[] {
    return this.dataExchangeService.availableTopics.filter(
      (t) => t.topicType === 'main' && t.topicResource === 'georesource'
    );
  }

  setIndicatorSorting(order: TopicOrderMode) {
    this.indicatorOrder = order;
    this.setSorting('indicator', order);
  }

  setGeoRessourceSorting(order: TopicOrderMode) {
    this.geoRessourceOrder = order;
    this.setSorting('georesource', order);
  }

  private setSorting(topic: TopicResourceType, order: TopicOrderMode) {
    this.topicSrvc.setOrderMode(topic, order).subscribe({
      next: () => {},
      error: (error) => {
        console.error('Failed to set topic order mode:', error);
      },
    });
  }

  ngOnInit(): void {
    this.subscription = this.broadcastService.currentBroadcastMsg.subscribe((broadcastMsg) => {
      if (broadcastMsg.msg === 'refreshTopicsOverview') {
        // this.refreshTopicsOverview();
      }
    });

    this.topicSrvc.getOrderModes().subscribe({
      next: (modes) => {
        this.indicatorOrder = modes.find((mode) => mode.topicResource === 'indicator')?.orderMode;
        this.geoRessourceOrder = modes.find(
          (mode) => mode.topicResource === 'georesource'
        )?.orderMode;
      },
      error: (error) => {
        // TODO: Handle error appropriately
        console.error('Failed to fetch topic order modes:', error);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
