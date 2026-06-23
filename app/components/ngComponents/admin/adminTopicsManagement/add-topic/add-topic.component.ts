import { Component, Input, inject } from '@angular/core';
import { AdminTopicsManagementService } from '../admin-topics-management.service';
import {
  AdminTopicsManagementErrorHandlingService,
  Topic,
  TopicResourceType,
} from '../admin-topics-management.component';
import { take } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { DataExchangeService } from '../../../../../services/data-exchange-service/data-exchange.service';

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
  private dataExchangeService = inject(DataExchangeService);

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
          this.errorHandlingService.errorMessagePart = this.dataExchangeService.syntaxHighlightJSON(
            error?.data || error
          );
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
