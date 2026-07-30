import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { TopicOrderMode } from '../topic.model';
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

  @Output() selectedOptionChange = new EventEmitter<TopicOrderMode>();

  setOption(mode: TopicOrderMode) {
    this.selectedOptionChange.emit(mode);
  }
}
