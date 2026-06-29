import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface LinePatternOption {
  label: string;
  dashArrayValue: string;
  svgString: string;
}

@Component({
  selector: 'km-line-pattern-picker',
  standalone: true,
  imports: [],
  templateUrl: './km-line-pattern-picker.component.html',
  styleUrls: ['./km-line-pattern-picker.component.scss'],
})
export class KmLinePatternPickerComponent implements OnInit {
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

  ngOnInit(): void {
    // If no pattern is selected and options are available, optionally select the first one
    if (!this.selectedPattern && this.options.length > 0) {
      // Don't auto-select - let the parent component decide
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
      this.isOpen = false;
      return;
    }

    if (!hostEl.contains(targetNode)) {
      this.isOpen = false;
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
}
