import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  inject,
} from '@angular/core';
import { Topic, TopicOrderMode, TopicResourceType } from '../topic.model';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgbCollapseModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TopicDeleteModalComponent } from '../topicDeleteModal/topic-delete-modal.component';
import { TopicEditModalComponent } from '../topicEditModal/topic-edit-modal.component';
import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { Injectable } from '@angular/core';
import { AddTopicComponent } from '../add-topic/add-topic.component';
import { SortByOrderPipe } from '../sortByOrder.pipe';
import { NotificationService } from '../../../common/notification/notification.service';

@Injectable({ providedIn: 'root' })
export class ExpandedService {
  expandedTopics: Set<string> = new Set<string>();
}

@Component({
  selector: 'app-topic-list',
  templateUrl: './topicList.component.html',
  styleUrls: ['./topicList.component.scss'],
  imports: [AddTopicComponent, SortByOrderPipe, CdkDropList, NgbCollapseModule, CdkDrag],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicListComponent {
  private modalService = inject(NgbModal);
  private srvc = inject(AdminTopicsManagementService);
  private expandedService = inject(ExpandedService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) topics!: Topic[];
  @Input({ required: true }) levelLimit!: number;
  @Input({ required: true }) topicResourceType!: TopicResourceType;
  @Input({ required: true }) order!: TopicOrderMode;

  @Input() parentTopic: Topic | undefined;
  @Input() showTopicIds = false;
  @Input() level = 1;

  onTopicDropped(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.topics, event.previousIndex, event.currentIndex);

    const revert = () => {
      moveItemInArray(this.topics, event.currentIndex, event.previousIndex);
      this.notificationService.showError('Die Sortierung konnte nicht gespeichert werden.');
      // The in-place revert happens in an async error callback — re-render this
      // OnPush view so the list reflects the restored order.
      this.cdr.markForCheck();
    };

    const request$ = this.parentTopic
      ? this.srvc.updateSubTopicOrder(this.parentTopic, this.topics)
      : this.srvc.updateMainTopicOrder(this.topicResourceType, this.topics);

    request$.subscribe({ error: revert });
  }

  onClickDeleteTopic(topic: Topic) {
    const modalRef = this.modalService.open(TopicDeleteModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false,
    });
    modalRef.componentInstance.currentTopic = topic;
  }

  onClickEditTopic(topic: Topic) {
    const modalRef = this.modalService.open(TopicEditModalComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      container: 'body',
      animation: false,
    });
    modalRef.componentInstance.topic = topic;
  }

  isExpanded(topicId: string): boolean {
    return this.expandedService.expandedTopics.has(topicId);
  }

  isExpandable() {
    return this.level < this.levelLimit;
  }

  toggleExpand(topicId: string) {
    if (this.isExpandable()) {
      if (this.expandedService.expandedTopics.has(topicId)) {
        this.expandedService.expandedTopics.delete(topicId);
      } else {
        this.expandedService.expandedTopics.add(topicId);
      }
    }
  }
}
