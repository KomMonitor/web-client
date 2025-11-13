import { Component, OnInit, Input } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AdminTopicsManagementService } from "../admin-topics-management.service";
import { Topic } from "../admin-topics-management.component";

@Component({
  selector: "topic-edit-modal-new",
  templateUrl: "./topic-edit-modal.component.html",
  styleUrls: ["./topic-edit-modal.component.css"],
})
export class TopicEditModalComponent implements OnInit {
  @Input() topic!: Topic;

  topicForm: FormGroup;
  isSubmitting = false;
  errorMessage = "";
  successMessage = "";

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private srvc: AdminTopicsManagementService
  ) {
    this.topicForm = this.fb.group({
      name: ["", Validators.required],
      description: ["", Validators.required],
    });
  }

  ngOnInit() {
    if (this.topic) {
      this.topicForm.patchValue({
        name: this.topic.topicName,
        description: this.topic.topicDescription,
      });
    } else {
      console.warn("No topic data provided to modal");
    }
  }

  onSubmit() {
    if (this.topicForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = "";
      this.successMessage = "";
      this.srvc
        .editTopic(
          this.topic,
          this.topicForm.value.name,
          this.topicForm.value.description
        )
        .subscribe({
          next: () => {
            this.isSubmitting = false;
            this.successMessage = "success";
            setTimeout(() => {
              this.activeModal.close();
            }, 1500);
          },
          error: (error) => {
            debugger;
            this.isSubmitting = false;
            this.errorMessage =
              error.error || error.message || "Failed to update topic";
          },
        });
    } else {
      console.warn("Form is invalid:", this.topicForm.errors);
    }
  }

  hideSuccessAlert() {
    this.successMessage = "";
  }

  hideErrorAlert() {
    this.errorMessage = "";
  }

  cancel() {
    console.log("Modal cancelled");
    this.activeModal.dismiss("cancel");
  }
}
