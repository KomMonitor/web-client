import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Color picker used for individual class / category colors in the classification
 * step. Mirrors the prototype: the trigger is a plain color swatch (no hex text),
 * and the popover offers a grid of palette colors to click plus a "custom color"
 * row with a native color input and a hex text field.
 */
@Component({
  selector: 'app-classification-color-picker',
  templateUrl: './classification-color-picker.component.html',
  styleUrls: ['./classification-color-picker.component.scss'],
  imports: [CommonModule, TranslateModule],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassificationColorPickerComponent {
  @Input() color = '#cccccc';
  /** Palette colors offered as quick-pick swatches in the popover. */
  @Input() paletteColors: string[] = [];
  /** Tooltip for the trigger swatch. */
  @Input() title = '';
  @Output() colorChange = new EventEmitter<string>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;

  isOpen = false;

  toggle(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  close(): void {
    this.isOpen = false;
  }

  /** Applies a color and notifies the parent. */
  pick(color: string): void {
    this.color = color;
    this.colorChange.emit(color);
  }

  onNativeInput(event: Event): void {
    this.pick((event.target as HTMLInputElement).value);
  }

  onHexChange(event: Event): void {
    let value = (event.target as HTMLInputElement).value.trim();
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)) {
      this.pick(value);
    }
  }

  isSelected(color: string): boolean {
    return color.toLowerCase() === this.color?.toLowerCase();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) {
      return;
    }
    const host = this.containerRef?.nativeElement;
    if (host && !host.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }
}
