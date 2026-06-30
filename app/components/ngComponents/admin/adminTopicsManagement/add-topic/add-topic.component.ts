import { Component, Input, inject } from '@angular/core';
import { AdminTopicsManagementService } from '../admin-topics-management.service';
import { AdminTopicsManagementErrorHandlingService } from '../admin-topics-management.component';
import { Topic, TopicResourceType } from '../topic.model';
import { take } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { IndicatorValueService } from '../../../../../services/indicator-value-service/indicator-value.service';

@Component({
  selector: 'app-admin-add-topic',
  templateUrl: './add-topic.component.html',
  styleUrls: ['./add-topic.component.scss'],
  imports: [FormsModule],
  standalone: true,
})
export class AddTopicComponent {
  private srvc = inject(AdminTopicsManagementService);
  private errorHandlingService = inject(AdminTopicsManagementErrorHandlingService);
  private indicatorValueService = inject(IndicatorValueService);

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
        },
        error: (error) => {
          // HttpErrorResponse carries the backend payload in .error; a thrown Error has .message.
          const payload = error?.error ?? error?.message ?? error;
          this.errorHandlingService.errorMessagePart =
            this.indicatorValueService.syntaxHighlightJSON(payload);
        },
      });
  }

  getType() {
    if (this.topicType === 'main') {
      return 'Hauptthema';
    } else {
      return 'Unterthema';
    }
  }
}
