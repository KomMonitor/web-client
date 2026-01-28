import { Component, OnInit, OnDestroy, Input, Inject } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AdminTopicsManagementService } from "../admin-topics-management.service";
import { Topic } from "../admin-topics-management.component";
import { KommonitorIndicatorDataExchangeService } from "../../../../../services/adminIndicatorUnit/kommonitor-data-exchange.service";
import { CommonModule } from "@angular/common";

@Component({
  selector: "topic-delete-modal-new",
  templateUrl: "./topic-delete-modal.component.html",
  styleUrls: ["./topic-delete-modal.component.css"],
  imports: [CommonModule],
  standalone: true
})
export class TopicDeleteModalComponent implements OnInit {
  @Input() currentTopic!: Topic;
  topicToDeletePrettyPrint: string = "";
  loadingData = false;
  errorMessagePart: string = "";
  successMessage: string = "";

  constructor(
    public activeModal: NgbActiveModal,
    private kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private srvc: AdminTopicsManagementService
  ) {}

  ngOnInit() {
    if (this.currentTopic) {
      this.topicToDeletePrettyPrint =
        this.kommonitorDataExchangeService.syntaxHighlightJSON(
          this.currentTopic
        );
      this.resetTopicDeleteForm();
    }
  }

  resetTopicDeleteForm() {
    this.errorMessagePart = "";
    this.successMessage = "";
  }

  deleteTopic() {
    const topicId = this.currentTopic.topicId;
    if (!topicId) {
      return;
    }
    this.loadingData = true;

    this.srvc.deleteTopic(topicId).subscribe({
      next: async () => {
        this.loadingData = false;
        this.successMessage = "success";
        // Close modal after a short delay to show success message
        setTimeout(() => {
          this.activeModal.close({ action: "deleted" });
        }, 1500);
      },
      error: (error) => {
        this.errorMessagePart = error.data
          ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data)
          : this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
        this.loadingData = false;
      },
    });
  }

  hideSuccessAlert() {
    this.successMessage = "";
  }

  hideErrorAlert() {
    this.errorMessagePart = "";
  }

  close() {
    this.activeModal.dismiss("cancel");
  }
}
