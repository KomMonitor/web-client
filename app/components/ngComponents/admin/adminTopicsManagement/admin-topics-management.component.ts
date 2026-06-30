import { Component, Injectable, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TopicMetadataStoreService } from '../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { ExpandableBoxComponent } from '../../common/expandable-box/expandable-box.component';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { AddTopicComponent } from './add-topic/add-topic.component';
import { AdminTopicsManagementService } from './admin-topics-management.service';
import { Topic, TopicOrderMode, TopicResourceType } from './topic.model';
import { TopicListComponent } from './topicList/topicList.component';
import { TopicOrderSelectionComponent } from './topicOrderSelection/topic-order-selection.component';

// Re-exported for the many existing importers that reference these types via this component.
export { Topic, TopicOrderMode, TopicResourceType } from './topic.model';

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
export class AdminTopicsManagementComponent implements OnInit {
  protected errorHandlingService = inject(AdminTopicsManagementErrorHandlingService);
  private topicSrvc = inject(AdminTopicsManagementService);
  private topicStore = inject(TopicMetadataStoreService);

  showTopicIds = false;
  loadingData = false;

  indicatorOrder: TopicOrderMode | undefined;
  geoRessourceOrder: TopicOrderMode | undefined;

  get filteredIndicatorTopics(): Topic[] {
    return this.topicStore.availableTopics.filter(
      (t) => t.topicType === 'main' && t.topicResource === 'indicator'
    );
  }

  get filteredGeoRessourceTopics(): Topic[] {
    return this.topicStore.availableTopics.filter(
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
      next: () => {
        /* result handled via error callback */
      },
      error: (error) => {
        console.error('Failed to set topic order mode:', error);
      },
    });
  }

  ngOnInit(): void {
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
}
