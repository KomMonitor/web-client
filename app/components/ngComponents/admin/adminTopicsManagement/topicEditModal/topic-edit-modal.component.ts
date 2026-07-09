import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
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
import { Topic } from '../topic.model';
import { NotificationService } from 'components/ngComponents/common/notification/notification.service';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-topic-edit-modal',
  templateUrl: './topic-edit-modal.component.html',
  styleUrls: ['./topic-edit-modal.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicEditModalComponent implements OnInit {
  activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder);
  private srvc = inject(AdminTopicsManagementService);
  private destroyRef = inject(DestroyRef);
  private notificationService = inject(NotificationService);
  private translate = inject(TranslateService);

  @Input({ required: true }) topic!: Topic;

  topicForm: FormGroup<{
    name: FormControl<string | null>;
    description: FormControl<string | null>;
  }>;
  // Signal: toggled from the edit subscription (OnPush).
  isSubmitting = signal(false);

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
      return;
    }

    this.isSubmitting.set(true);

    this.srvc
      .editTopic(this.topic, name, description)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notificationService.showSuccess(
            this.translate.instant('ADMIN_TOPICS.EDIT_MODAL.MSG.UPDATED', { name })
          );
          this.activeModal.close(true);
        },
        error: (error) => {
          this.isSubmitting.set(false);
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
    return this.translate.instant('ADMIN_TOPICS.EDIT_MODAL.MSG.UPDATE_FAILED');
  }

  cancel() {
    this.activeModal.dismiss('cancel');
  }
}
