import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TopicOrderMode } from '../admin-topics-management.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-topic-order-selection',
  templateUrl: './topic-order-selection.component.html',
  styleUrls: ['./topic-order-selection.component.css'],
  imports: [FormsModule],
  standalone: true,
})
export class TopicOrderSelectionComponent {
  @Input({ required: true }) orderMode!: TopicOrderMode;

  @Output() selectedOptionChange = new EventEmitter<TopicOrderMode>();

  setOption(mode: TopicOrderMode) {
    this.selectedOptionChange.emit(mode);
  }
}
