import { Component, EventEmitter, Input, Output } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ref-indicator-selector',
  templateUrl: './ref-indicator-selector.component.html',
  standalone: true,
  imports: [FormsModule],
})
export class RefIndicatorSelectorComponent {
  @Input() availableIndicators: any[] = [];
  @Input() label: string = 'Referenzindikator';
  @Input() selection: any = null;
  @Output() selectionChange = new EventEmitter<any>();
}
