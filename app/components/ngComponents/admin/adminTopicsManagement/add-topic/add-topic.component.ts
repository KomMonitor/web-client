import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  inject,
} from '@angular/core';
import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { AdminTopicsManagementErrorHandlingService } from '../admin-topics-management.component';
import { Topic, TopicResourceType } from '../topic.model';
import { take } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { IndicatorValueService } from '../../../../../services/indicator-value-service/indicator-value.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-add-topic',
  templateUrl: './add-topic.component.html',
  styleUrls: ['./add-topic.component.scss'],
  imports: [FormsModule, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddTopicComponent {
  private srvc = inject(AdminTopicsManagementService);
  private errorHandlingService = inject(AdminTopicsManagementErrorHandlingService);
  private indicatorValueService = inject(IndicatorValueService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) topicResourceType!: TopicResourceType;
  @Input() topicType: 'main' | 'sub' = 'main';
  @Input() parentTopic!: Topic;

  newTopicDescription: string = '';
  newTopicTitle: string = '';

  onAddTopic() {
    this.srvc
      .addTopic(
        this.topicType,
        this.topicResourceType,
        this.newTopicTitle,
        this.newTopicDescription,
        this.parentTopic
      )
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.newTopicDescription = '';
          this.newTopicTitle = '';
          // ngModel fields reset in an async callback (OnPush).
          this.cdr.markForCheck();
        },
        error: (error) => {
          // HttpErrorResponse carries the backend payload in .error; a thrown Error has .message.
          const payload = error?.error ?? error?.message ?? error;
          this.errorHandlingService.errorMessagePart =
            this.indicatorValueService.syntaxHighlightJSON(payload);
        },
      });
  }

  /** Translation key of the topic-type noun, interpolated into the button/placeholder texts. */
  get typeLabelKey(): string {
    return this.topicType === 'main' ? 'ADMIN_TOPICS.ADD.MAIN_TOPIC' : 'ADMIN_TOPICS.ADD.SUB_TOPIC';
  }
}
