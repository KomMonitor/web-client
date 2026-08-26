import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface LinePatternOption {
  label: string;
  dashArrayValue: string;
  svgString: string;
}

/**
 * Dropdown for picking a line dash pattern.
 *
 * Works both as a plain `[selectedPattern]` + `(patternChange)` widget and as a
 * reactive form control (`formControlName`). The control value is the
 * `LinePatternOption` *object*, not its dash-array string, because the API body
 * builders read `.dashArrayValue` off it.
 */
@Component({
  selector: 'km-line-pattern-picker',
  standalone: true,
  imports: [],
  templateUrl: './km-line-pattern-picker.component.html',
  styleUrls: ['./km-line-pattern-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KmLinePatternPickerComponent),
      multi: true,
    },
  ],
})
export class KmLinePatternPickerComponent implements OnChanges, ControlValueAccessor {
  private sanitizer = inject(DomSanitizer);

  @Input() selectedPattern: LinePatternOption | null = null;
  @Input() options: LinePatternOption[] = [];
  @Input() label: string = 'Linienmuster wählen';
  @Input() placeholder: string = 'Linienmuster wählen';
  @Input() disabled: boolean = false;
  @Input() closeOnOutsideClick: boolean = true;
  @Input() width: string = '200px';

  @Output() patternChange = new EventEmitter<LinePatternOption | null>();
  @Output() selectionChange = new EventEmitter<LinePatternOption | null>();

  @ViewChild('dropdownContainer', { static: true }) dropdownContainer!: ElementRef<HTMLElement>;

  isOpen: boolean = false;
  private svgSanitizeCache: Map<string, SafeHtml> = new Map();

  private onChange: (value: LinePatternOption | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  ngOnChanges(changes: SimpleChanges): void {
    // `options` can arrive after writeValue() (they are loaded asynchronously in
    // some hosts), so re-resolve the current value against the new list.
    if (changes['options'] && this.selectedPattern) {
      this.selectedPattern = this.resolveOption(this.selectedPattern);
    }
  }

  toggle(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.disabled) {
      return;
    }
    this.isOpen = !this.isOpen;
  }

  close(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.isOpen) {
      this.onTouched();
    }
    this.isOpen = false;
  }

  onContainerClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  selectPattern(pattern: LinePatternOption, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.disabled) {
      return;
    }

    this.selectedPattern = pattern;
    this.patternChange.emit(pattern);
    this.selectionChange.emit(pattern);
    this.onChange(pattern);
    this.close();
  }

  clearSelection(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.disabled) {
      return;
    }

    this.selectedPattern = null;
    this.patternChange.emit(null);
    this.selectionChange.emit(null);
    this.onChange(null);
    this.close();
  }

  getSafeSvgCached(svgString: string): SafeHtml {
    if (!svgString) {
      return '' as unknown as SafeHtml;
    }

    const cached = this.svgSanitizeCache.get(svgString);
    if (cached) {
      return cached;
    }

    const trusted = this.sanitizer.bypassSecurityTrustHtml(svgString);
    this.svgSanitizeCache.set(svgString, trusted);
    return trusted;
  }

  trackByOption(index: number, item: LinePatternOption): string {
    return item?.dashArrayValue ?? index.toString();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen || !this.closeOnOutsideClick) {
      return;
    }

    const targetNode = event.target as Node | null;
    const hostEl = this.dropdownContainer?.nativeElement;
    if (!hostEl || !targetNode) {
      this.close();
      return;
    }

    if (!hostEl.contains(targetNode)) {
      this.close();
    }
  }

  get buttonWidth(): string {
    return this.width;
  }

  get hasSelection(): boolean {
    return !!this.selectedPattern;
  }

  get displayText(): string {
    return this.selectedPattern?.label || this.placeholder;
  }

  // --- ControlValueAccessor ---------------------------------------------

  writeValue(value: LinePatternOption | null | undefined): void {
    this.selectedPattern = value ? this.resolveOption(value) : null;
  }

  registerOnChange(fn: (value: LinePatternOption | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (isDisabled) {
      this.isOpen = false;
    }
  }

  /**
   * Values patched in from an import are structurally equal but not identical
   * to the entries in `options`; resolve by dash-array value so the dropdown
   * highlights the right row. Unknown values are kept as-is.
   */
  private resolveOption(value: LinePatternOption): LinePatternOption {
    return (
      (this.options ?? []).find((option) => option?.dashArrayValue === value.dashArrayValue) ??
      value
    );
  }
}
