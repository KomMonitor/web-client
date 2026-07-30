import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

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
}
