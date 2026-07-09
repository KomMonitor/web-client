import {
  ChangeDetectionStrategy,
  Component,
  Injectable,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TopicMetadataStoreService } from '../../../../services/topic-metadata-store-service/topic-metadata-store.service';
import { ExpandableBoxComponent } from '../../common/expandable-box/expandable-box.component';
import { AdminContentViewComponent } from '../admin-content-view/admin-content-view.component';
import { AddTopicComponent } from './add-topic/add-topic.component';
import { AdminTopicsManagementService } from './admin-topics-management.service';
import { Topic, TopicOrderMode, TopicResourceType } from './topic.model';
import { TopicListComponent } from './topicList/topicList.component';
import { TopicOrderSelectionComponent } from './topicOrderSelection/topic-order-selection.component';
import { NotificationService } from '../../common/notification/notification.service';
import { TranslateModule } from '@ngx-translate/core';

// Re-exported for the many existing importers that reference these types via this component.
export { Topic, TopicOrderMode, TopicResourceType } from './topic.model';

@Injectable()
export class AdminTopicsManagementErrorHandlingService {
  // Signal-backed behind a getter/setter shim: the add-topic child writes this
  // from an async subscribe callback while the OnPush overview template reads
  // it — the signal read makes the overview re-render without further wiring.
  private readonly _errorMessagePart = signal('');
  get errorMessagePart(): string {
    return this._errorMessagePart();
  }
  set errorMessagePart(value: string) {
    this._errorMessagePart.set(value);
  }
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

  showTopicIds = false;
  loadingData = false;

  // Signals: assigned from the order-mode fetch subscription (OnPush).
  indicatorOrder = signal<TopicOrderMode | undefined>(undefined);
  geoRessourceOrder = signal<TopicOrderMode | undefined>(undefined);

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
        this.notificationService.showError('Die Sortierung konnte nicht gespeichert werden.');
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
        this.notificationService.showError('Die Sortiermodi konnten nicht geladen werden.');
      },
    });
  }
}
