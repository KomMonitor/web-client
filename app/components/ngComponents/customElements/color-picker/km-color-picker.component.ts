import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { ColorSketchModule } from 'ngx-color/sketch';

@Component({
  selector: 'km-color-picker',
  standalone: true,
  imports: [CommonModule, ColorSketchModule],
  templateUrl: './km-color-picker.component.html',
  styleUrls: ['./km-color-picker.component.scss']
})
export class KmColorPickerComponent {
  @Input() color: string = '#000000';
  @Output() colorChange = new EventEmitter<string>();

  @Input() label: string = 'Farbe wählen';
  @Input() disabled: boolean = false;
  @Input() closeOnOutsideClick: boolean = true;
  @Input() zIndex: number = 2000;

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;

  isOpen: boolean = false;

  toggle(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.disabled) { return; }
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

  onChange(event: any): void {
    const next = event && event.color && event.color.hex ? event.color.hex : this.color;
    if (typeof next === 'string') {
      this.color = next;
      this.colorChange.emit(this.color);
    }
  }

  onChangeComplete(event: any): void {
    const next = event && event.color && event.color.hex ? event.color.hex : this.color;
    if (typeof next === 'string') {
      this.color = next;
      this.colorChange.emit(this.color);
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
      this.isOpen = false;
      return;
    }
    if (!hostEl.contains(targetNode)) {
      this.isOpen = false;
    }
  }
}


