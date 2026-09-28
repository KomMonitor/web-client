import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface EpsgOption {
  code: number;
  label: string;
}

export const PREDEFINED_EPSG_CODES: EpsgOption[] = [
  { code: 4326, label: 'EPSG:4326 – WGS 84 (Geographisch)' },
  { code: 3857, label: 'EPSG:3857 – Web Mercator (Pseudo Mercator)' },
  { code: 4258, label: 'EPSG:4258 – ETRS89 (Geographisch)' },
  { code: 25832, label: 'EPSG:25832 – ETRS89 / UTM Zone 32N' },
  { code: 25833, label: 'EPSG:25833 – ETRS89 / UTM Zone 33N' },
  { code: 31467, label: 'EPSG:31467 – DHDN / Gauß-Krüger Zone 3' },
  { code: 31468, label: 'EPSG:31468 – DHDN / Gauß-Krüger Zone 4' },
  { code: 32632, label: 'EPSG:32632 – WGS 84 / UTM Zone 32N' },
];

const CUSTOM_VALUE = -1;

let nextId = 0;

/**
 * Picks an EPSG code from a list of common codes, or lets the user type any other one.
 *
 * Works both as a plain `[(code)]` widget and as a form control (`formControlName`,
 * `[formControl]`, `ngModel`). The value is the numeric code, or `null` while nothing valid is
 * chosen (e.g. a half-typed custom code) — so `Validators.required` covers "no valid code".
 * A code that is not in `options` opens the free-input field pre-filled with it.
 */
@Component({
  selector: 'km-epsg-picker',
  templateUrl: './km-epsg-picker.component.html',
  styleUrls: ['./km-epsg-picker.component.scss'],
  standalone: true,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KmEpsgPickerComponent),
      multi: true,
    },
  ],
})
export class KmEpsgPickerComponent implements OnChanges, ControlValueAccessor {
  @Input() code: number | null = null;
  @Input() options: EpsgOption[] = PREDEFINED_EPSG_CODES;
  @Input() label: string = 'Koordinatenreferenzsystem (EPSG)';
  @Input() disabled: boolean = false;

  @Output() codeChange = new EventEmitter<number | null>();

  readonly customSentinel = CUSTOM_VALUE;
  readonly selectId = `km-epsg-picker-${nextId++}`;

  /** The value bound to the <select>: a code from `options`, CUSTOM_VALUE or null (unset). */
  selectedDropdownValue: number | null = null;

  /** Number typed into the free-input field */
  customInputRaw: number | null = null;

  /** Validation state for the free-input field */
  customInputValid: boolean | null = null;

  /** Last value we reported; `undefined` until the first emit. */
  private emittedCode: number | null | undefined = undefined;

  private onChange: (value: number | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  get isCustomMode(): boolean {
    return this.selectedDropdownValue === this.customSentinel;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // A host that binds [(code)] echoes our own emits back. Re-applying them would throw away
    // a half-typed custom code (which we report as null), so only react to outside changes.
    if (changes['options'] || (changes['code'] && this.code !== this.emittedCode)) {
      this.applyCode(this.code);
    }
  }

  onDropdownChange(): void {
    this.customInputRaw = null;
    this.customInputValid = null;
    this.emit(this.isCustomMode ? null : this.selectedDropdownValue);
  }

  onCustomInputChange(): void {
    if (this.customInputRaw === null || this.customInputRaw === undefined) {
      this.customInputValid = null;
      this.emit(null);
      return;
    }
    this.customInputValid = isValidEpsgCode(this.customInputRaw);
    this.emit(this.customInputValid ? this.customInputRaw : null);
  }

  markTouched(): void {
    this.onTouched();
  }

  // --- ControlValueAccessor ---------------------------------------------

  writeValue(value: number | null | undefined): void {
    this.code = value ?? null;
    this.applyCode(this.code);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // ----------------------------------------------------------------------

  private emit(value: number | null): void {
    this.code = value;
    this.emittedCode = value;
    this.codeChange.emit(value);
    this.onChange(value);
  }

  /** Mirrors a code set from outside into the dropdown / free-input state. */
  private applyCode(code: number | null): void {
    if (code === null) {
      this.selectedDropdownValue = null;
      this.customInputRaw = null;
      this.customInputValid = null;
    } else if (this.options.some((option) => option.code === code)) {
      this.selectedDropdownValue = code;
      this.customInputRaw = null;
      this.customInputValid = null;
    } else {
      this.selectedDropdownValue = CUSTOM_VALUE;
      this.customInputRaw = code;
      this.customInputValid = isValidEpsgCode(code);
    }
  }
}

function isValidEpsgCode(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 99999;
}
