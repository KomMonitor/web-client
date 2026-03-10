import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-filterable-select",
  templateUrl: "./filterable-select.component.html",
  styleUrls: ["./filterable-select.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class FilterableSelectComponent<T> implements OnChanges {
  /** Label displayed above the filter input */
  @Input() label: string | undefined;

  /** Key of the property to display in the options */
  @Input({ required: true }) propertyKey!: string;

  /** Placeholder text for the filter input field */
  @Input() filterPlaceholder: string = "Filter...";

  /** List of options to display; each item must have a property matching `propertyKey` */
  @Input() options: T[] = [];

  /** Non-selectable placeholder shown as the first entry in the list */
  @Input() selectPlaceholder: string = "-- Bitte wählen --";

  /** Number of visible options in the select-area */
  @Input() selectionSize: number = 5;

  /** Emits the selected option whenever the selection changes */
  @Output() selectedItemChange = new EventEmitter<T>();

  filterText: string = "";
  selectedItem: T | null = null;

  get filteredOptions(): T[] {
    if (!this.filterText) return this.options;
    const lower = this.filterText.toLowerCase();
    return this.options.filter((o) =>
      o[this.propertyKey]?.toLowerCase().includes(lower),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["options"]) {
      this.filterText = "";
      this.selectedItem = null;
    }
  }

  onSelectionChange(item: T): void {
    this.selectedItemChange.emit(item);
  }

  reset(): void {
    this.filterText = "";
    this.selectedItem = null;
  }
}
