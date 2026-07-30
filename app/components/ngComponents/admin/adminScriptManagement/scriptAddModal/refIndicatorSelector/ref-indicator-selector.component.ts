import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
@Component({
  selector: 'app-ref-indicator-selector',
  templateUrl: './ref-indicator-selector.component.html',
  standalone: true,
  imports: [TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefIndicatorSelectorComponent {
  @Input() availableIndicators: any[] = [];
  @Input() label: string = 'Referenzindikator';
  @Input() selection: any = null;
  @Output() selectionChange = new EventEmitter<any>();
}
