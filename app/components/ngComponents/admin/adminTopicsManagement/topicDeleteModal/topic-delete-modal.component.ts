import { Component, OnInit, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { Topic } from '../admin-topics-management.component';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataExchangeService } from '../../../../../services/data-exchange-service/data-exchange.service';
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-topic-delete-modal',
  templateUrl: './topic-delete-modal.component.html',
  styleUrls: ['./topic-delete-modal.component.scss'],
  imports: [LoadingOverlayComponent],
  standalone: true,
})
export class TopicDeleteModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private dataExchangeService = inject(DataExchangeService);
  private srvc = inject(AdminTopicsManagementService);
  private sanitizer = inject(DomSanitizer);

  @Input() currentTopic?: Topic;
  topicToDeletePrettyPrint: SafeHtml | string = '';
  loadingData = false;
  errorMessagePart: SafeHtml | string = '';
  successMessage: string = '';

  ngOnInit() {
    if (this.currentTopic) {
      const html = this.dataExchangeService.syntaxHighlightJSON(this.currentTopic);
      this.topicToDeletePrettyPrint = this.sanitizer.bypassSecurityTrustHtml(html);
      this.resetTopicDeleteForm();
    }
  }

  resetTopicDeleteForm() {
    this.errorMessagePart = '';
    this.successMessage = '';
  }

  deleteTopic() {
    const topicId = this.currentTopic?.topicId;
    if (!topicId) {
      return;
    }
    this.loadingData = true;

    this.srvc
      .deleteTopic(topicId)
      .pipe(
        takeUntilDestroyed(),
        finalize(() => {
          this.loadingData = false;
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = 'success';
          // Close modal after a short delay to show success message
          setTimeout(() => {
            this.activeModal.close({ action: 'deleted' });
          }, 1500);
        },
        error: (error: any) => {
          const html = error.data
            ? this.dataExchangeService.syntaxHighlightJSON(error.data)
            : this.dataExchangeService.syntaxHighlightJSON(error);
          this.errorMessagePart = this.sanitizer.bypassSecurityTrustHtml(html);
        },
      });
  }

  hideSuccessAlert() {
    this.successMessage = '';
  }

  hideErrorAlert() {
    this.errorMessagePart = '';
  }

  close() {
    this.activeModal.dismiss('cancel');
  }
}
