import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as noUiSlider from 'nouislider';

@Component({
  standalone: true,
  selector: 'multi-select-slider',
  templateUrl: './multi-select-slider.component.html',
  styleUrls: ['./multi-select-slider.component.scss'],
  imports: [FormsModule],
})
export class MultiSelectSliderComponent implements AfterViewInit, OnChanges {
  @ViewChild('sliderContainer') sliderContainer!: ElementRef;

  @Input() range: number[] = [0, 100];
  @Input() selectedValues!: number[];
  @Input() unit!: string;

  @Output() changer = new EventEmitter<number[]>();

  private sliderInstance: any;

  defaultStartPosition: number = 0.3; // index (between 0 and 1, as there is only min and max)
  selectedValue!: number;

  private cdr = inject(ChangeDetectorRef);

  ngAfterViewInit() {
    this.sliderInstance = noUiSlider.create(this.sliderContainer.nativeElement, {
      range: {
        min: 0,
        max: this.range.length - 1,
      },
      start: this.defaultStartPosition,
      tooltips: false,
      connect: false,
      step: 0.1,
      pips: {
        mode: noUiSlider.PipsMode.Steps,
        density: 10,
        format: {
          to: (value) => {
            return Math.ceil(this.range[1] * value);
          }
        }
      }
    });

    this.selectedValue = Math.ceil(this.range[1] * this.defaultStartPosition);

    this.sliderInstance.on('change', (values, handle, unencoded) => {
      this.selectedValue = Math.ceil(this.range[1] * unencoded[0]);
      this.cdr.detectChanges();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['range'] && this.sliderInstance) {
      this.sliderInstance.updateOptions({
        start: this.defaultStartPosition,
      });
      this.selectedValue = Math.ceil(this.range[1] * this.defaultStartPosition);
    }
  }

  onValueChange(value: number) {
    this.selectedValue = Math.min(this.range[1], Math.max(1, value));
  }

  addSelectedValue() {
    let value = this.selectedValue;

    if (typeof value === 'string') {
      value = parseInt(value);
    }

    if (this.selectedValues.includes(value)) return;

    this.selectedValues.push(value);
    this.selectedValues.sort((a, b) => a - b);

    this.pushValues();
  }

  removeValue(value: number) {
    this.selectedValues.splice(this.selectedValues.indexOf(value), 1);
    this.pushValues();
  }

  pushValues() {
    this.changer.emit(this.selectedValues);
  }
}
