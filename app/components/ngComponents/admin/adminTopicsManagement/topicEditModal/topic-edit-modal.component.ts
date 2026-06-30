import { Component, DestroyRef, OnInit, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { Topic } from '../admin-topics-management.component';

const SUCCESS_MESSAGE_TIMEOUT_MS = 1500;

@Component({
  selector: 'app-topic-edit-modal',
  templateUrl: './topic-edit-modal.component.html',
  styleUrls: ['./topic-edit-modal.component.scss'],
  imports: [FormsModule, ReactiveFormsModule],
  standalone: true,
})
export class TopicEditModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder);
  private srvc = inject(AdminTopicsManagementService);
  private destroyRef = inject(DestroyRef);

  @Input({ required: true }) topic!: Topic;

  topicForm: FormGroup<{
    name: FormControl<string | null>;
    description: FormControl<string | null>;
  }>;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.topicForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
    });
  }

  ngOnInit() {
    if (!this.topic) {
      console.error('No topic data provided to modal');
      return;
    }

    this.topicForm.patchValue({
      name: this.topic.topicName,
      description: this.topic.topicDescription,
    });
  }

  onSubmit() {
    if (!this.topicForm.valid) {
      console.warn('Form is invalid:', this.topicForm.errors);
      Object.keys(this.topicForm.controls).forEach((key) => {
        this.topicForm.get(key)?.markAsTouched();
      });
      return;
    }

    const name = this.topicForm.value.name;
    const description = this.topicForm.value.description;

    if (!name || !description) {
      this.errorMessage = 'Name and description are required';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.srvc
      .editTopic(this.topic, name, description)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'success';
          setTimeout(() => {
            this.activeModal.close();
          }, SUCCESS_MESSAGE_TIMEOUT_MS);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = this.getErrorMessage(error);
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
    return 'Failed to update topic';
  }

  hideSuccessAlert() {
    this.successMessage = '';
  }

  hideErrorAlert() {
    this.errorMessage = '';
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }
}
