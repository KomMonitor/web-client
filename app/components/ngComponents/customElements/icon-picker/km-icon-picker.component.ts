import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { IconTranslate } from 'pipes/icon-translate.pipe';
import {
  GlyphiconIcon,
  IconTranslateService,
} from 'services/icon-translate/icon-translate.service';

/**
 * Searchable grid for picking a POI marker symbol.
 *
 * The control value is always the **Bootstrap-3 glyphicon name** (`map-marker`),
 * never the Font Awesome name it is drawn with — the Data Management API
 * documents `poiSymbolBootstrap3Name` as a glyphicon name, so that is what has
 * to be stored. Rendering goes through `IconTranslateService`, which is also
 * where the list of offered names comes from.
 *
 * Reactive forms only (`formControlName` / `[formControl]`); both call sites use
 * them. `iconNameChange` is there for a host that only wants to observe picks.
 */
@Component({
  selector: 'km-icon-picker',
  standalone: true,
  imports: [IconTranslate],
  templateUrl: './km-icon-picker.component.html',
  styleUrls: ['./km-icon-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KmIconPickerComponent),
      multi: true,
    },
  ],
})
export class KmIconPickerComponent implements ControlValueAccessor {
  private iconService = inject(IconTranslateService);

  @Input() buttonTitle: string = 'Symbol wählen';
  @Input() searchPlaceholder: string = 'Symbol suchen';
  @Input() noResultsText: string = 'Kein Symbol gefunden';
  @Input() unknownValueHint: string = 'Unbekannter Symbolname – wird unverändert gespeichert.';
  @Input() disabled: boolean = false;
  @Input() closeOnOutsideClick: boolean = true;
  @Input() width: string = '100%';

  @Output() iconNameChange = new EventEmitter<string>();

  @ViewChild('dropdownContainer', { static: true }) dropdownContainer!: ElementRef<HTMLElement>;
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  /** The stored value, kept verbatim — see `writeValue`. */
  value: string = '';
  isOpen: boolean = false;
  searchTerm: string = '';

  readonly allIcons: readonly GlyphiconIcon[] = this.iconService.availableIcons();
  /**
   * Recomputed in `onSearchChange`, not derived in a getter: with default change
   * detection and a `document:click` listener a getter would re-filter all 206
   * entries on every tick.
   */
  filteredIcons: readonly GlyphiconIcon[] = this.allIcons;

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

    if (this.isOpen) {
      // Let the panel render before reaching for its search field.
      setTimeout(() => this.searchInput?.nativeElement.focus());
    }
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
    this.resetSearch();
  }

  selectIcon(icon: GlyphiconIcon, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (this.disabled) {
      return;
    }

    this.value = icon.name;
    this.iconNameChange.emit(icon.name);
    this.onChange(icon.name);
    this.close();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;

    const query = this.normalizeQuery(term);
    this.filteredIcons = query
      ? this.allIcons.filter((icon) => icon.name.includes(query) || icon.faName.includes(query))
      : this.allIcons;
  }

  @HostListener('keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (!this.isOpen) {
      return;
    }
    // Keep it off the surrounding modal, even though the modal presets open
    // with `keyboard: false` and would ignore it anyway.
    event.stopPropagation();
    this.close();
  }

  /**
   * The panel sits inside `#dropdownContainer`, so a click in it counts as a
   * click inside the host and needs no handler of its own to swallow it.
   */
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

  /** The table entry behind the stored value, if the table knows it. */
  get selectedIcon(): GlyphiconIcon | undefined {
    return this.iconService.findIcon(this.value);
  }

  /**
   * A stored name that is not in the table. It stays selected and is written
   * back unchanged; the template only says so, it does not correct it.
   */
  get isUnknownValue(): boolean {
    return !!this.value && !this.selectedIcon;
  }

  get buttonWidth(): string {
    return this.width;
  }

  // --- ControlValueAccessor ---------------------------------------------

  writeValue(value: string | null | undefined): void {
    // Verbatim, and without calling onChange: an existing dataset may hold a
    // name this client does not know, and editing an unrelated field must not
    // silently rewrite it.
    this.value = value ?? '';
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
      this.resetSearch();
    }
  }

  private resetSearch(): void {
    this.searchTerm = '';
    this.filteredIcons = this.allIcons;
  }

  /**
   * Accepts what an admin is likely to type: either notation's prefix, a
   * spaced-out name, any casing.
   */
  private normalizeQuery(term: string): string {
    return term
      .trim()
      .toLowerCase()
      .replace(/^(glyphicon-|fa-)/, '')
      .replace(/\s+/g, '-');
  }
}
