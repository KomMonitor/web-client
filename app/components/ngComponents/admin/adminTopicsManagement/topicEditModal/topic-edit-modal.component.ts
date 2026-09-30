import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
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
import { LoadingOverlayComponent } from 'components/ngComponents/common/loading-overlay/loading-overlay.component';
import { FormErrorComponent } from '../../adminShared/formError/form-error.component';
import { notBlankValidator } from '../../adminShared/validators/admin-validators';
import { TranslateModule } from '@ngx-translate/core';

import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-topic-edit-modal',
  templateUrl: './topic-edit-modal.component.html',
  styleUrls: ['./topic-edit-modal.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    LoadingOverlayComponent,
    FormErrorComponent,
  ],
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
  private cdr = inject(ChangeDetectorRef);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @Input({ required: true }) topic!: Topic;

  topicForm: FormGroup<{
    name: FormControl<string | null>;
    description: FormControl<string | null>;
  }>;
  // Signal: toggled from the edit subscription (OnPush).
  isSubmitting = signal(false);

  constructor() {
    this.topicForm = this.fb.group({
      // notBlankValidator: a whitespace-only value counts as missing, too
      name: ['', [Validators.required, notBlankValidator]],
      description: ['', [Validators.required, notBlankValidator]],
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

  /**
   * Saves a valid form; otherwise reveals every field's error and moves the
   * focus to the first invalid field.
   */
  onSubmit() {
    if (this.topicForm.invalid) {
      this.topicForm.markAllAsTouched();
      // OnPush: the touched state alone does not re-render the host's bindings
      this.cdr.markForCheck();
      this.host.nativeElement
        .querySelector<HTMLElement>('input.ng-invalid, textarea.ng-invalid')
        ?.focus();
      return;
    }

    const { name, description } = this.topicForm.getRawValue();
    // Both are set: the required validators passed.
    const topicName = name ?? '';
    const topicDescription = description ?? '';

    this.isSubmitting.set(true);

    this.srvc
      .editTopic(this.topic, topicName, topicDescription)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.notificationService.showSuccess(
            this.translate.instant('ADMIN_TOPICS.EDIT_MODAL.MSG.UPDATED', { name: topicName })
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
