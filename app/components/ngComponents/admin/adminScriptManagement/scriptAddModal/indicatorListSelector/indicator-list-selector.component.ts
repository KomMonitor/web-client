import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-indicator-list-selector",
  templateUrl: "./indicator-list-selector.component.html",
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class IndicatorListSelectorComponent {
  @Input() availableIndicators: any[] = [];
  @Input() selectedIndicators: any[] = [];
  @Output() add = new EventEmitter<any>();
  @Output() remove = new EventEmitter<any>();

  tmpSelection: any = null;

  onAdd(): void {
    if (this.tmpSelection) {
      this.add.emit(this.tmpSelection);
      this.tmpSelection = null;
    }
  }
}
