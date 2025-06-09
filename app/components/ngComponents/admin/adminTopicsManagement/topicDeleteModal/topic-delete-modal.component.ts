import { Component, OnInit, OnDestroy, Input, Inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { BroadcastService } from 'services/broadcast-service/broadcast.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'topic-delete-modal-new',
  templateUrl: './topic-delete-modal.component.html',
  styleUrls: ['./topic-delete-modal.component.css']
})
export class TopicDeleteModalComponent implements OnInit, OnDestroy {
  @Input() currentTopic: any;
  topicToDeletePrettyPrint: string = '';
  loadingData = false;
  errorMessagePart: string = '';
  successMessage: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    @Inject('kommonitorDataExchangeService') private kommonitorDataExchangeService: any,
    private http: HttpClient,
    private broadcastService: BroadcastService
  ) { }

  ngOnInit() {
    if (this.currentTopic) {
      this.topicToDeletePrettyPrint = this.kommonitorDataExchangeService.syntaxHighlightJSON(this.currentTopic);
      this.resetTopicDeleteForm();
    }
  }

  ngOnDestroy() {
    // No need to unsubscribe since we're not using subscriptions anymore
  }

  resetTopicDeleteForm() {
    this.errorMessagePart = '';
    this.successMessage = '';
  }

  deleteTopic() {
    const topicId = this.currentTopic.topicId;
    this.loadingData = true;

    this.http.delete(
      `${this.kommonitorDataExchangeService.baseUrlToKomMonitorDataAPI}/topics/${topicId}`
    ).subscribe({
      next: async () => {
        await this.kommonitorDataExchangeService.fetchTopicsMetadata(
          this.kommonitorDataExchangeService.currentKeycloakLoginRoles
        );
        this.broadcastService.broadcast('refreshTopicsOverview');
        this.broadcastService.broadcast('refreshAdminDashboardDiagrams');
        this.loadingData = false;
        this.successMessage = 'success';
        // Close modal after a short delay to show success message
        setTimeout(() => {
          this.activeModal.close({ action: 'deleted' });
        }, 1500);
      },
      error: (error) => {
        this.errorMessagePart = error.data ? 
          this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data) :
          this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        this.loadingData = false;
      }
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