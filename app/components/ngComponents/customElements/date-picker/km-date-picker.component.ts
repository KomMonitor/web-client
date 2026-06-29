import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  Injectable,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

import {
  FormControl,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  NgbDateAdapter,
  NgbDateParserFormatter,
  NgbDateStruct,
  NgbDatepickerModule,
} from '@ng-bootstrap/ng-bootstrap';

// ISO parser/formatter as in spatial unit component
@Injectable()
export class NgbDateISOParserFormatter extends NgbDateParserFormatter {
  parse(value: string | null): NgbDateStruct | null {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return null;
    }
    const [yStr, mStr, dStr] = trimmed.split('-');
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }
    const dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
      return null;
    }
    return { year, month, day };
  }
  format(date: NgbDateStruct | null): string {
    if (!date) {
      return '';
    }
    const y = String(date.year).padStart(4, '0');
    const m = String(date.month).padStart(2, '0');
    const d = String(date.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

@Injectable()
export class NgbDateStringAdapter extends NgbDateAdapter<string> {
  fromModel(value: string | null): NgbDateStruct | null {
    if (!value) {
      return null;
    }
    const trimmed = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return null;
    }
    const [yStr, mStr, dStr] = trimmed.split('-');
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    const dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) {
      return null;
    }
    return { year, month, day };
  }
  toModel(date: NgbDateStruct | null): string | null {
    if (!date) {
      return null;
    }
    const y = String(date.year).padStart(4, '0');
    const m = String(date.month).padStart(2, '0');
    const d = String(date.day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static isValidIso(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const [yStr, mStr, dStr] = value.split('-');
    const y = Number(yStr),
      m = Number(mStr),
      d = Number(dStr);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
      return false;
    }
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  static compare(a: string, b: string): number {
    // returns -1 if a<b, 0 if equal, 1 if a>b
    return a === b ? 0 : a < b ? -1 : 1;
  }

  static todayIso(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

@Component({
  selector: 'km-date-picker',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgbDatepickerModule],
  templateUrl: './km-date-picker.component.html',
  styleUrls: ['./km-date-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KmDatePickerComponent),
      multi: true,
    },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => KmDatePickerComponent), multi: true },
    { provide: NgbDateParserFormatter, useClass: NgbDateISOParserFormatter },
    { provide: NgbDateAdapter, useClass: NgbDateStringAdapter },
  ],
})
export class KmDatePickerComponent implements OnInit, OnChanges, Validator {
  @Input() placeholder: string = 'YYYY-MM-DD';
  @Input() name: string = '';
  @Input() id: string = '';
  @Input() ariaLabel: string = 'Date';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() min: string | null = null; // 'YYYY-MM-DD'
  @Input() max: string | null = null; // 'YYYY-MM-DD'
  @Input() invalid: boolean | null = null; // external override
  @Input() showTodayShortcut: boolean = true;
  @Input() showClear: boolean = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() coerceEmptyToToday: boolean = true; // align with original Add/Edit components
  @Input() coerceInvalidToToday: boolean = true;

  @Output() valueChange = new EventEmitter<string | null>();
  @Output() blur = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() validityChange = new EventEmitter<boolean>();

  control = new FormControl<string | null>(null, { nonNullable: false });

  @ViewChild('inputEl', { static: true }) inputEl!: ElementRef<HTMLInputElement>;

  private onChange: (value: string | null) => void = () => { /* set via registerOnChange */ };
  private onTouched: () => void = () => { /* set via registerOnTouched */ };

  ngOnInit(): void {
    this.control.valueChanges.subscribe((value) => {
      if (this.disabled) {
        return;
      }
      this.onChange(value ?? null);
      this.valueChange.emit(value ?? null);
      this.emitValidity();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (Object.prototype.hasOwnProperty.call(changes, 'disabled')) {
      this.setDisabledState(!!this.disabled);
    }
  }

  // ControlValueAccessor
  writeValue(value: string | null): void {
    this.control.setValue(value ?? null, { emitEvent: false });
    this.emitValidity();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }

  // Validator
  validate(): ValidationErrors | null {
    const value = this.control.value as unknown;

    // Required check: handle non-string values safely
    if (this.required) {
      if (value == null) {
        return { required: true };
      }
      if (typeof value === 'string' && value.trim() === '') {
        return { required: true };
      }
    }

    // If there is a value, it must be a valid ISO string
    if (value != null) {
      if (typeof value !== 'string') {
        return { dateFormat: 'Expected YYYY-MM-DD' };
      }
      if (!NgbDateStringAdapter.isValidIso(value)) {
        return { dateFormat: 'Expected YYYY-MM-DD' };
      }
      if (this.min && NgbDateStringAdapter.compare(value, this.min) < 0) {
        return { minDate: this.min };
      }
      if (this.max && NgbDateStringAdapter.compare(value, this.max) > 0) {
        return { maxDate: this.max };
      }
    }

    return null;
  }

  // UI helpers
  onBlur(): void {
    this.ensureValidOnBlur();
    this.onTouched();
    this.blur.emit();
  }

  onFocus(): void {
    this.focus.emit();
  }

  clear(): void {
    if (this.disabled) {
      return;
    }
    this.control.setValue(null);
  }

  setToday(): void {
    if (this.disabled) {
      return;
    }
    this.control.setValue(NgbDateStringAdapter.todayIso());
  }

  get inputClasses(): string {
    const sizeClass =
      this.size === 'sm' ? 'form-control-sm' : this.size === 'lg' ? 'form-control-lg' : '';
    const invalidClass = this.shouldShowInvalid ? 'is-invalid' : '';
    return ['form-control', sizeClass, invalidClass].filter(Boolean).join(' ');
  }

  get shouldShowInvalid(): boolean {
    if (this.invalid !== null) {
      return !!this.invalid;
    }
    const errors = this.validate();
    return !!errors && (this.control.touched || this.control.dirty);
  }

  private emitValidity(): void {
    const valid = this.validate() === null;
    this.validityChange.emit(valid);
  }

  hasError(code: 'required' | 'dateFormat' | 'minDate' | 'maxDate'): boolean {
    const errors = this.validate();
    return !!errors && !!errors[code];
  }

  private ensureValidOnBlur(): void {
    // Defer until after ngbDatepicker's own blur handling
    setTimeout(() => {
      if (this.disabled) {
        return;
      }

      // Prefer inspecting the raw input value for robustness
      const rawVal =
        this.inputEl && this.inputEl.nativeElement
          ? this.inputEl.nativeElement.value
          : (this.control.value ?? '');
      const raw = (rawVal ?? '').toString();
      const trimmed = raw.trim();

      const controlValue = this.control.value;
      const controlEmpty =
        controlValue == null || (typeof controlValue === 'string' && controlValue.trim() === '');
      const rawEmpty = trimmed === '';

      if (rawEmpty || controlEmpty) {
        if (this.coerceEmptyToToday) {
          this.control.setValue(NgbDateStringAdapter.todayIso());
        } else {
          this.control.setValue(null);
        }
        return;
      }

      // If user typed an invalid date string, coerce to today when enabled
      const invalidRaw = !NgbDateStringAdapter.isValidIso(trimmed);
      const invalidControl =
        typeof controlValue === 'string' && !NgbDateStringAdapter.isValidIso(controlValue);
      if ((invalidRaw || invalidControl) && this.coerceInvalidToToday) {
        this.control.setValue(NgbDateStringAdapter.todayIso());
      }
    }, 0);
  }
}
