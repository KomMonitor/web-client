import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-ref-indicator-selector",
  templateUrl: "./ref-indicator-selector.component.html",
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class RefIndicatorSelectorComponent {
  @Input() availableIndicators: any[] = [];
  @Input() label: string = "Referenzindikator";
  @Input() selection: any = null;
  @Output() selectionChange = new EventEmitter<any>();
}
