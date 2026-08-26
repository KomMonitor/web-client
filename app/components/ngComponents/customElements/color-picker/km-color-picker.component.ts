import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ColorSketchModule } from 'ngx-color/sketch';

/** Value a control falls back to when it holds null/undefined. */
export const KM_COLOR_PICKER_DEFAULT = '#000000';

/**
 * Colour swatch + popover picker.
 *
 * Works both as a plain two-way bound widget (`[(color)]`) and as a reactive
 * form control (`formControlName`): when no form directive is attached,
 * `registerOnChange` is never called and the component behaves exactly as
 * before. Do not bind `[color]` and a form directive on the same element.
 */
@Component({
  selector: 'km-color-picker',
  standalone: true,
  imports: [ColorSketchModule],
  templateUrl: './km-color-picker.component.html',
  styleUrls: ['./km-color-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KmColorPickerComponent),
      multi: true,
    },
  ],
})
export class KmColorPickerComponent implements ControlValueAccessor {
  @Input() color: string = KM_COLOR_PICKER_DEFAULT;
  @Output() colorChange = new EventEmitter<string>();

  @Input() label: string = 'Farbe wählen';
  @Input() disabled: boolean = false;
  @Input() closeOnOutsideClick: boolean = true;
  @Input() zIndex: number = 2000;

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;

  isOpen: boolean = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

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

  /** ngx-color `(onChange)` — live updates while dragging. */
  onPickerChange(event: any): void {
    this.emitColor(event);
  }

  /** ngx-color `(onChangeComplete)` — fired once the interaction settles. */
  onChangeComplete(event: any): void {
    this.emitColor(event);
  }

  private emitColor(event: any): void {
    const next = event && event.color && event.color.hex ? event.color.hex : this.color;
    if (typeof next === 'string') {
      this.color = next;
      this.colorChange.emit(this.color);
      this.onChange(this.color);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen || !this.closeOnOutsideClick) {
      return;
    }

    const targetNode = event.target as Node | null;
    const hostEl = this.containerRef?.nativeElement;
    if (!hostEl || !targetNode) {
      this.close();
      return;
    }
    if (!hostEl.contains(targetNode)) {
      this.close();
    }
  }

  // --- ControlValueAccessor ---------------------------------------------

  writeValue(value: string | null | undefined): void {
    this.color = typeof value === 'string' && value ? value : KM_COLOR_PICKER_DEFAULT;
  }

  registerOnChange(fn: (value: string) => void): void {
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
}
