import { Component, Input, inject } from '@angular/core';
import { Topic, TopicOrderMode, TopicResourceType } from '../topic.model';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgbCollapseModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TopicDeleteModalComponent } from '../topicDeleteModal/topic-delete-modal.component';
import { TopicEditModalComponent } from '../topicEditModal/topic-edit-modal.component';
import { AdminTopicsManagementService } from '../admin-topics-management.service';

import { Injectable } from '@angular/core';
import { AddTopicComponent } from '../add-topic/add-topic.component';

import { SortByOrderPipe } from '../sortByOrder.pipe';

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
})
export class TopicListComponent {
  private modalService = inject(NgbModal);
  private srvc = inject(AdminTopicsManagementService);
  private expandedService = inject(ExpandedService);

  @Input({ required: true }) topics!: Topic[];
  @Input({ required: true }) levelLimit!: number;
  @Input({ required: true }) topicResourceType!: TopicResourceType;
  @Input({ required: true }) order!: TopicOrderMode;

  @Input() parentTopic: Topic | undefined;
  @Input() showTopicIds = false;
  @Input() level = 1;

  dropIndicatorTopics(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.topics, event.previousIndex, event.currentIndex);
    if (this.parentTopic) {
      this.srvc.updateSubTopicOrder(this.parentTopic, this.topics).subscribe({
        next: () => {
          console.log(`Updated topic order successfully.`);
        },
        error: () => {
          console.log(`Failed to update topic order.`);
          // revert local change
          moveItemInArray(this.topics, event.currentIndex, event.previousIndex);
        },
      });
    } else {
      this.srvc.updateMainTopicOrder(this.topicResourceType, this.topics).subscribe({
        next: () => {
          console.log(`Updated main topic order successfully.`);
        },
        error: () => {
          console.log(`Failed to update main topic order.`);
          // revert local change
          moveItemInArray(this.topics, event.currentIndex, event.previousIndex);
        },
      });
    }
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
