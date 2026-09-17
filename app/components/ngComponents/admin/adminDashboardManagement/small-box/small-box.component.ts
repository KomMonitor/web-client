import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-small-box',
  templateUrl: './small-box.component.html',
  styleUrls: ['./small-box.component.scss'],
  imports: [],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmallBoxComponent {
  @Input({ required: true }) titleText!: string;
  @Input() descriptionText: string = '';
  @Input() boxColor: string = '#fff';
  @Input() textColor: string = '#fff';
  @Input() iconClass: string | undefined;
  /** Renders the tile as an activatable control and enables `boxClick`. */
  @Input() clickable: boolean = false;
  @Output() boxClick = new EventEmitter<void>();

  onActivate(): void {
    if (this.clickable) {
      this.boxClick.emit();
    }
  }

  /** Space activates the tile like a button, without scrolling the page. */
  onSpace(event: Event): void {
    if (!this.clickable) {
      return;
    }
    event.preventDefault();
    this.onActivate();
  }
}
