import { CommonModule } from "@angular/common";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";

export interface EpsgOption {
  code: number;
  label: string;
}

export const PREDEFINED_EPSG_CODES: EpsgOption[] = [
  { code: 4326, label: "EPSG:4326 – WGS 84 (Geographisch)" },
  { code: 3857, label: "EPSG:3857 – Web Mercator (Pseudo Mercator)" },
  { code: 4258, label: "EPSG:4258 – ETRS89 (Geographisch)" },
  { code: 25832, label: "EPSG:25832 – ETRS89 / UTM Zone 32N" },
  { code: 25833, label: "EPSG:25833 – ETRS89 / UTM Zone 33N" },
  { code: 31467, label: "EPSG:31467 – DHDN / Gauß-Krüger Zone 3" },
  { code: 31468, label: "EPSG:31468 – DHDN / Gauß-Krüger Zone 4" },
  { code: 32632, label: "EPSG:32632 – WGS 84 / UTM Zone 32N" },
];

const CUSTOM_VALUE = -1;

@Component({
  selector: "app-epsg-selector",
  templateUrl: "./epsg-selector.component.html",
  styleUrls: ["./epsg-selector.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class EpsgSelectorComponent implements OnInit {
  @Output() epsgCodeChange = new EventEmitter<number | null>();

  readonly predefinedCodes = PREDEFINED_EPSG_CODES;
  readonly customSentinel = CUSTOM_VALUE;

  /** The value bound to the <select>: either a predefined code or CUSTOM_VALUE */
  selectedDropdownValue: number = this.predefinedCodes[0].code;

  /** Raw text typed into the free-input field */
  customInputRaw: number | undefined = undefined;

  /** Validation state for the free-input field */
  customInputValid: boolean | null = null;

  /** The currently emitted / confirmed EPSG code */
  currentCode: number | null = this.predefinedCodes[0].code;

  get isCustomMode(): boolean {
    return this.selectedDropdownValue === this.customSentinel;
  }

  ngOnInit(): void {
    this.epsgCodeChange.emit(this.currentCode);
  }

  onDropdownChange(): void {
    if (!this.isCustomMode) {
      this.customInputRaw = undefined;
      this.customInputValid = null;
      this.currentCode = this.selectedDropdownValue;
      this.epsgCodeChange.emit(this.currentCode);
    } else {
      this.currentCode = null;
      this.epsgCodeChange.emit(null);
    }
  }

  onCustomInputChange(): void {
    if (this.customInputRaw === undefined) {
      this.customInputValid = null;
      this.currentCode = null;
      this.epsgCodeChange.emit(null);
      return;
    }

    const isValid =
      Number.isInteger(this.customInputRaw) &&
      this.customInputRaw >= 1 &&
      this.customInputRaw <= 99999;

    this.customInputValid = isValid;

    if (isValid) {
      this.currentCode = this.customInputRaw;
      this.epsgCodeChange.emit(this.customInputRaw);
    } else {
      this.currentCode = null;
      this.epsgCodeChange.emit(null);
    }
  }
}
