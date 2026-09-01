import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TopicOrderMode, TopicResourceType } from '../topic.model';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-topic-order-selection',
  templateUrl: './topic-order-selection.component.html',
  styleUrls: ['./topic-order-selection.component.scss'],
  imports: [FormsModule, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopicOrderSelectionComponent {
  @Input({ required: true }) orderMode!: TopicOrderMode;

  /**
   * Text of the group's `<legend>`. Lives here rather than beside the component
   * so the label and the options it labels form one labelled group instead of a
   * loose `<div>` that happened to sit above them.
   */
  @Input({ required: true }) label!: string;

  /**
   * Distinguishes the two instances on the page. Both the radio `name` and the
   * `id`/`for` pairs are derived from it: without a distinct `name`, Angular's
   * radio registry treats standalone `ngModel` radios with no name as one group,
   * so picking a mode in one hierarchy would clear the other's selection.
   */
  @Input({ required: true }) topicResourceType!: TopicResourceType;

  @Output() selectedOptionChange = new EventEmitter<TopicOrderMode>();

  get groupName(): string {
    return `topic-order-${this.topicResourceType}`;
  }

  setOption(mode: TopicOrderMode) {
    this.selectedOptionChange.emit(mode);
  }
}
