import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MODAL_CONFIRM, MODAL_FORM } from 'util/modal-presets';

import { NotificationService } from '../../../common/notification/notification.service';
import {
  TreeGapDirective,
  TreeNodeFooterDirective,
  TreeRowDirective,
} from '../../../common/tree-view/tree-row.directive';
import { TreeViewComponent } from '../../../common/tree-view/tree-view.component';
import { TreeGap, TreeReorderEvent } from '../../../common/tree-view/tree-view.model';
import { AdminModalService } from '../../adminShared/modal/admin-modal.service';
import { AddTopicComponent } from '../add-topic/add-topic.component';
import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { Topic, TopicOrderMode, TopicResourceType } from '../topic.model';
import { TopicDeleteModalComponent } from '../topicDeleteModal/topic-delete-modal.component';
import { TopicEditModalComponent } from '../topicEditModal/topic-edit-modal.component';
import { sortTopicTree } from './topic-sort';

/**
 * One topic hierarchy — indicators or georesources — as a tree.
 *
 * The tree itself is the shared `app-tree-view`; this component only supplies the
 * row content, the inline "add subtopic" form of an opened node and the wiring of
 * a drag & drop to the display-order endpoints.
 */
@Component({
  selector: 'app-topic-tree',
  templateUrl: './topic-tree.component.html',
  styleUrls: ['./topic-tree.component.scss'],
  imports: [
    TranslateModule,
    TreeViewComponent,
    TreeRowDirective,
    TreeNodeFooterDirective,
    TreeGapDirective,
    AddTopicComponent,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicTreeComponent {
  private readonly modals = inject(AdminModalService);
  private readonly srvc = inject(AdminTopicsManagementService);
  private readonly notificationService = inject(NotificationService);
  private readonly translate = inject(TranslateService);

  /** The main topics of one resource type; subtopics hang off them via `subTopics`. */
  readonly topics = input.required<readonly Topic[]>();
  readonly topicResourceType = input.required<TopicResourceType>();
  readonly order = input.required<TopicOrderMode>();
  readonly showTopicIds = input(false);

  /** Number of topic levels the hierarchy may have, the deepest one included. */
  readonly levelLimit = input(4);

  protected readonly expandedIds = signal<ReadonlySet<string>>(new Set<string>());

  /**
   * The topic whose "append subtopic" panel is open, if any. Only one panel is
   * open at a time, like the insert slot of the hierarchy page.
   */
  private readonly openAddParentId = signal<string | null>(null);

  /** The gap whose panel is open — only ever the one below the last main topic. */
  protected readonly openGap = signal<TreeGap<Topic> | null>(null);

  /**
   * Main topics are added at the end of the list, so only that one position gets
   * a line; the subtopics have their own link in the footer of their parent.
   */
  protected readonly trailingRootGapOnly = (gap: TreeGap<Topic>): boolean =>
    gap.parent === null && gap.index === this.sortedTopics().length;

  /**
   * Bumped after a reorder. The new order is written as `displayOrder` onto the
   * topic objects themselves, which no signal watches — this one stands in for
   * them and makes `sortedTopics` recompute.
   */
  private readonly orderVersion = signal(0);

  protected readonly sortedTopics = computed(() => {
    this.orderVersion();
    return sortTopicTree(this.topics(), this.order());
  });

  /** `maxDepth` is the deepest 0-based depth that may still be opened. */
  protected readonly maxDepth = computed(() => this.levelLimit() - 1);

  protected readonly reorderable = computed(() => this.order() === 'custom');

  protected readonly topicId = (topic: Topic): string => topic.topicId ?? '';

  protected subTopicCount(topic: Topic): number {
    return topic.subTopics?.length ?? 0;
  }

  protected isAddPanelOpen(topic: Topic): boolean {
    return this.openAddParentId() === this.topicId(topic);
  }

  protected openAddPanel(topic: Topic): void {
    this.openAddParentId.set(this.topicId(topic));
  }

  protected closeAddPanel(): void {
    this.openAddParentId.set(null);
  }

  /**
   * Persists the new sibling order. The tree hands over a fresh array and never
   * touches the bound one, so the order first has to be written onto the topics
   * as `displayOrder` — which is also what the view sorts by, making the move
   * visible before the request comes back.
   */
  protected onReorder(event: TreeReorderEvent<Topic>): void {
    const siblings = [...event.nodes];
    const previousOrder = siblings.map((topic) => topic.displayOrder);
    this.applyDisplayOrder(siblings);

    const parent = event.parent;
    const request$ = parent
      ? this.srvc.updateSubTopicOrder(parent, siblings)
      : this.srvc.updateMainTopicOrder(this.topicResourceType(), siblings);

    request$.subscribe({
      error: () => {
        siblings.forEach((topic, index) => (topic.displayOrder = previousOrder[index]));
        this.orderVersion.update((version) => version + 1);
        this.notificationService.showError(
          this.translate.instant('ADMIN_TOPICS.MSG.SORT_SAVE_FAILED')
        );
      },
    });
  }

  private applyDisplayOrder(siblings: readonly Topic[]): void {
    siblings.forEach((topic, index) => (topic.displayOrder = index));
    this.orderVersion.update((version) => version + 1);
  }

  protected onClickEditTopic(topic: Topic): void {
    this.modals.open(TopicEditModalComponent, MODAL_FORM, { topic });
  }

  protected onClickDeleteTopic(topic: Topic): void {
    this.modals.open(TopicDeleteModalComponent, MODAL_CONFIRM, { currentTopic: topic });
  }
}
