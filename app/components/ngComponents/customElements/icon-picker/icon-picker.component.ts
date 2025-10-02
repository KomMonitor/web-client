import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.css']
})
export class IconPickerComponent implements OnInit, OnDestroy {
  @Input() selectedIcon: string = 'home';
  @Input() disabled: boolean = false;
  @Input() placeholder: string = 'Select Icon';
  @Input() buttonClass: string = 'btn btn-info';
  @Input() showSearch: boolean = true;
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() cols: number = 10;
  @Input() rows: number = 6;
  @Input() searchText: string = 'Search icons...';
  @Input() labelHeader: string = '{0} of {1} pages';
  @Input() labelFooter: string = '{0} - {1} of {2} icons';
  
  @Output() iconChange = new EventEmitter<string>();
  @Output() iconSelect = new EventEmitter<string>();

  isOpen = false;
  searchTerm = '';
  
  // Common glyphicon icons that match the original implementation
  availableIcons = [
    'home', 'star', 'heart', 'user', 'cog', 'search', 'plus', 'minus', 
    'check', 'remove', 'edit', 'eye', 'download', 'upload', 'folder', 'file',
    'calendar', 'time', 'map-marker', 'phone', 'envelope', 'globe', 'lock', 'unlock',
    'wrench', 'cog', 'settings', 'info-sign', 'question-sign', 'exclamation-sign',
    'warning-sign', 'ok', 'remove-circle', 'ok-circle', 'ban-circle', 'arrow-left',
    'arrow-right', 'arrow-up', 'arrow-down', 'chevron-left', 'chevron-right',
    'chevron-up', 'chevron-down', 'play', 'pause', 'stop', 'record', 'volume-up',
    'volume-down', 'volume-off', 'headphones', 'music', 'film', 'camera', 'picture',
    'thumbs-up', 'thumbs-down', 'hand-up', 'hand-down', 'hand-right', 'hand-left',
    'resize-full', 'resize-small', 'fullscreen', 'resize-vertical', 'resize-horizontal',
    'move', 'zoom-in', 'zoom-out', 'off', 'signal', 'cog', 'trash', 'list', 'list-alt',
    'indent-left', 'indent-right', 'text-width', 'text-height', 'align-left', 'align-center',
    'align-right', 'align-justify', 'font', 'bold', 'italic', 'text-color', 'list',
    'list-alt', 'ok', 'remove', 'ok-circle', 'remove-circle', 'question-sign',
    'info-sign', 'screenshot', 'remove-circle', 'ok-circle', 'ban-circle', 'arrow-left',
    'arrow-right', 'arrow-up', 'arrow-down', 'share', 'share-alt', 'resize-full',
    'resize-small', 'exclamation-sign', 'warning-sign', 'plane', 'calendar', 'random',
    'comment', 'magnet', 'chevron-up', 'chevron-down', 'retweet', 'shopping-cart',
    'folder-close', 'folder-open', 'resize-vertical', 'resize-horizontal', 'hdd',
    'bullhorn', 'bell', 'certificate', 'thumbs-up', 'thumbs-down', 'hand-right',
    'hand-left', 'hand-up', 'hand-down', 'circle-arrow-right', 'circle-arrow-left',
    'circle-arrow-up', 'circle-arrow-down', 'globe', 'wrench', 'tasks', 'filter',
    'briefcase', 'fullscreen', 'dashboard', 'paperclip', 'heart-empty', 'link',
    'phone', 'pushpin', 'usd', 'gbp', 'sort', 'sort-by-alphabet', 'sort-by-alphabet-alt',
    'sort-by-order', 'sort-by-order-alt', 'sort-by-attributes', 'sort-by-attributes-alt',
    'unchecked', 'expand', 'collapse-down', 'collapse-up', 'log-in', 'flash',
    'log-out', 'new-window', 'record', 'save', 'open', 'saved', 'import', 'export',
    'send', 'floppy-disk', 'floppy-saved', 'floppy-remove', 'floppy-save', 'floppy-open',
    'credit-card', 'transfer', 'cutlery', 'header', 'compressed', 'earphone', 'phone-alt',
    'tower', 'stats', 'sd-video', 'hd-video', 'subtitles', 'sound-stereo', 'sound-dolby',
    'sound-5-1', 'sound-6-1', 'sound-7-1', 'copyright-mark', 'registration-mark',
    'cloud-download', 'cloud-upload', 'tree-conifer', 'tree-deciduous', 'cd',
    'save-file', 'open-file', 'level-up', 'copy', 'paste', 'alert', 'equalizer',
    'king', 'queen', 'pawn', 'bishop', 'knight', 'baby-formula', 'tent', 'blackboard',
    'bed', 'apple', 'erase', 'hourglass', 'lamp', 'duplicate', 'piggy-bank', 'scissors',
    'bitcoin', 'btc', 'xbt', 'yen', 'jpy', 'ruble', 'rub', 'scale', 'ice-lolly',
    'ice-lolly-tasted', 'education', 'option-horizontal', 'option-vertical', 'menu-hamburger',
    'modal-window', 'oil', 'grain', 'sunglasses', 'text-size', 'text-color', 'text-background',
    'object-align-top', 'object-align-bottom', 'object-align-horizontal', 'object-align-left',
    'object-align-vertical', 'object-align-right', 'triangle-right', 'triangle-left',
    'triangle-bottom', 'triangle-top', 'console', 'superscript', 'subscript', 'menu-left',
    'menu-right', 'menu-down', 'menu-up'
  ];

  filteredIcons: string[] = [];
  currentPage = 1;
  totalPages = 1;
  iconsPerPage = 60; // cols * rows

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.filteredIcons = [...this.availableIcons];
    this.updatePagination();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  togglePicker(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchTerm = '';
      this.filterIcons();
    }
  }

  closePicker(): void {
    this.isOpen = false;
    this.searchTerm = '';
    this.filterIcons();
  }

  selectIcon(icon: string): void {
    this.selectedIcon = icon;
    this.iconChange.emit(icon);
    this.iconSelect.emit(icon);
    this.closePicker();
  }

  filterIcons(): void {
    if (!this.searchTerm.trim()) {
      this.filteredIcons = [...this.availableIcons];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredIcons = this.availableIcons.filter(icon => 
        icon.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredIcons.length / this.iconsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  getCurrentPageIcons(): string[] {
    const startIndex = (this.currentPage - 1) * this.iconsPerPage;
    const endIndex = startIndex + this.iconsPerPage;
    return this.filteredIcons.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.icon-picker-container')) {
      this.closePicker();
    }
  }

  getIconClass(icon: string): string {
    return `glyphicon glyphicon-${icon}`;
  }

  getDisplayText(): string {
    return this.selectedIcon || this.placeholder;
  }

  getFormattedLabel(template: string, ...args: any[]): string {
    return template.replace(/\{(\d+)\}/g, (match, index) => {
      return args[parseInt(index)] || match;
    });
  }

  // Expose Math to template
  Math = Math;
}
