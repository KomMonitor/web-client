import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminTopicsManagementErrorHandlingService } from './admin-topics-management-error-handling.service';
import { TopicMetadataStoreService } from '../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { CollapsibleSectionComponent } from '../../common/collapsible-section/collapsible-section.component';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { AdminTopicsManagementService } from './admin-topics-management.service';
import { Topic, TopicOrderMode, TopicResourceType } from './topic.model';
import { TopicTreeComponent } from './topicTree/topic-tree.component';
import { TopicOrderSelectionComponent } from './topicOrderSelection/topic-order-selection.component';
import { NotificationService } from '../../common/notification/notification.service';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
// Re-exported for the many existing importers that reference these types via this component.
export { Topic, TopicOrderMode, TopicResourceType } from './topic.model';

@Component({
  selector: 'app-admin-topics-management',
  templateUrl: './admin-topics-management.component.html',
  styleUrls: ['./admin-topics-management.component.scss'],
  providers: [AdminTopicsManagementErrorHandlingService],
  imports: [
    CollapsibleSectionComponent,
    FormsModule,
    TopicOrderSelectionComponent,
    TopicTreeComponent,
    AdminContentViewComponent,
    TranslateModule,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTopicsManagementComponent implements OnInit {
  protected errorHandlingService = inject(AdminTopicsManagementErrorHandlingService);
  private topicSrvc = inject(AdminTopicsManagementService);
  private topicStore = inject(TopicMetadataStoreService);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  showTopicIds = false;
  loadingData = false;

  // Signals: assigned from the order-mode fetch subscription (OnPush).
  indicatorOrder = signal<TopicOrderMode | undefined>(undefined);
  geoRessourceOrder = signal<TopicOrderMode | undefined>(undefined);

  readonly indicatorSectionOpen = signal(true);
  readonly geoRessourceSectionOpen = signal(true);

  // Computed rather than getters: a getter hands the tree a new array on every
  // change detection run, which would re-sort the whole hierarchy each time.
  readonly indicatorTopics = computed(() => this.mainTopicsOf('indicator'));
  readonly geoRessourceTopics = computed(() => this.mainTopicsOf('georesource'));

  private mainTopicsOf(resource: TopicResourceType): Topic[] {
    return this.topicStore.availableTopics.filter(
      (t) => t.topicType === 'main' && t.topicResource === resource
    );
  }

  mainTopicCountLabel(count: number): string {
    return this.translate.instant(
      count === 1 ? 'ADMIN_TOPICS.MAIN_TOPIC_COUNT_ONE' : 'ADMIN_TOPICS.MAIN_TOPIC_COUNT_MANY',
      { count }
    );
  }

  setIndicatorSorting(order: TopicOrderMode) {
    this.indicatorOrder.set(order);
    this.setSorting('indicator', order);
  }

  setGeoRessourceSorting(order: TopicOrderMode) {
    this.geoRessourceOrder.set(order);
    this.setSorting('georesource', order);
  }

  private setSorting(topic: TopicResourceType, order: TopicOrderMode) {
    this.topicSrvc.setOrderMode(topic, order).subscribe({
      error: () => {
        this.notificationService.showError(
          this.translate.instant('ADMIN_TOPICS.MSG.SORT_SAVE_FAILED')
        );
      },
    });
  }

  ngOnInit(): void {
    this.topicSrvc.getOrderModes().subscribe({
      next: (modes) => {
        this.indicatorOrder.set(
          modes.find((mode) => mode.topicResource === 'indicator')?.orderMode
        );
        this.geoRessourceOrder.set(
          modes.find((mode) => mode.topicResource === 'georesource')?.orderMode
        );
      },
      error: () => {
        this.notificationService.showError(
          this.translate.instant('ADMIN_TOPICS.MSG.SORT_MODES_LOAD_FAILED')
        );
      },
    });
  }
}
