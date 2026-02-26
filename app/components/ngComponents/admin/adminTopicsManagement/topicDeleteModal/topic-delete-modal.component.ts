import { Component, OnInit, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AdminTopicsManagementService } from "../admin-topics-management.service";
import { Topic } from "../admin-topics-management.component";
import { KommonitorIndicatorDataExchangeService } from "../../../../../services/adminIndicatorUnit/kommonitor-data-exchange.service";
import { CommonModule } from "@angular/common";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { finalize } from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: "topic-delete-modal",
  templateUrl: "./topic-delete-modal.component.html",
  styleUrls: ["./topic-delete-modal.component.css"],
  imports: [CommonModule],
  standalone: true,
})
export class TopicDeleteModalComponent implements OnInit {
  @Input() currentTopic?: Topic;
  topicToDeletePrettyPrint: SafeHtml | string = "";
  loadingData = false;
  errorMessagePart: SafeHtml | string = "";
  successMessage: string = "";

  constructor(
    public activeModal: NgbActiveModal,
    private kommonitorDataExchangeService: KommonitorIndicatorDataExchangeService,
    private srvc: AdminTopicsManagementService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    if (this.currentTopic) {
      const html = this.kommonitorDataExchangeService.syntaxHighlightJSON(
        this.currentTopic,
      );
      this.topicToDeletePrettyPrint =
        this.sanitizer.bypassSecurityTrustHtml(html);
      this.resetTopicDeleteForm();
    }
  }

  resetTopicDeleteForm() {
    this.errorMessagePart = "";
    this.successMessage = "";
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
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = "success";
          // Close modal after a short delay to show success message
          setTimeout(() => {
            this.activeModal.close({ action: "deleted" });
          }, 1500);
        },
        error: (error: any) => {
          const html = error.data
            ? this.kommonitorDataExchangeService.syntaxHighlightJSON(error.data)
            : this.kommonitorDataExchangeService.syntaxHighlightJSON(error);
          this.errorMessagePart = this.sanitizer.bypassSecurityTrustHtml(html);
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
