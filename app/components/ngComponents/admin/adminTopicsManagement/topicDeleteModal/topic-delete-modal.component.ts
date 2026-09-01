import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  inject,
  signal,
} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { Topic } from '../topic.model';

import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-topic-delete-modal',
  templateUrl: './topic-delete-modal.component.html',
  imports: [LoadingOverlayComponent, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicDeleteModalComponent {
  activeModal = inject(NgbActiveModal);
  private srvc = inject(AdminTopicsManagementService);
  private destroyRef = inject(DestroyRef);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  @Input() currentTopic?: Topic;
  // Signal: toggled from the delete subscription (OnPush).
  loadingData = signal(false);

  /** Cascade size, spelled out in the summary table. */
  get subTopicCount(): number {
    return this.currentTopic?.subTopics?.length ?? 0;
  }

  deleteTopic() {
    const topicId = this.currentTopic?.topicId;
    if (!topicId) {
      return;
    }
    this.loadingData.set(true);

    this.srvc
      .deleteTopic(topicId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingData.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.notificationService.showSuccess(
            this.translate.instant('ADMIN_TOPICS.DELETE_MODAL.MSG.DELETED', {
              name: this.currentTopic?.topicName,
            })
          );
          this.activeModal.close({ action: 'deleted' });
        },
        error: (error: any) => {
          this.notificationService.showError(this.getErrorMessage(error));
        },
      });
  }

  private getErrorMessage(error: any): string {
    if (error?.error && typeof error.error === 'string') {
      return error.error;
    }
    if (error?.message) {
      return error.message;
    }
    return this.translate.instant('ADMIN_TOPICS.DELETE_MODAL.MSG.DELETE_FAILED');
  }

  close() {
    this.activeModal.dismiss('cancel');
  }
}
