import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-temporal-offset-input',
  templateUrl: './temporal-offset-input.component.html',
  standalone: true,
  imports: [TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemporalOffsetInputComponent {
  @Input() temporalOptions: any[] = [];
  @Input() offsetInt: number = 1;
  @Output() offsetIntChange = new EventEmitter<number>();
  @Input() offsetUnit: any = null;
  @Output() offsetUnitChange = new EventEmitter<any>();
}
