import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import * as noUiSlider from 'nouislider';

export enum DisplayType {
  NORMAL,
  DATE,
  YEAR
}

export enum SliderType {
  NORMAL,
  RANGE
}

@Component({
  selector: 'custom-slider',
  templateUrl: './custom-slider.component.html',
  styleUrls: ['./custom-slider.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CustomSliderComponent implements AfterViewInit, OnChanges {

  @ViewChild('sliderContainer') sliderContainer!: ElementRef;

  @Input() data:any[] = [];
  @Input() type: SliderType = SliderType.NORMAL;
  @Input() markerPositions: any[] = [0];
  @Input() disabled: boolean = false;
  @Input() displayMode: DisplayType = DisplayType.NORMAL

  @Output() valueChange = new EventEmitter<number | number[]>();

  private sliderInstance: any;
  private manualChange = false;

  errorMsg = '';

  ngAfterViewInit() {

    if(!this.data || this.data.length==0)
      this.errorMsg = 'Data not set or empty';

    if(this.type==SliderType.RANGE && this.markerPositions.length!=2)
      this.errorMsg = 'Type range needs two marker positions';

    if(this.type==SliderType.NORMAL && this.markerPositions.length>1)
      this.errorMsg = 'Type normal needs one marker position only';

    if(this.errorMsg=='')
      this.initSlider();
  }

  ngOnChanges(changes: SimpleChanges): void {

    if(changes['disabled']) {
      if(changes['disabled'].currentValue===true) 
        this.sliderInstance?.disable();
      else
        this.sliderInstance?.enable();
    } else 
      this.sliderInstance?.enable();

    if(changes['markerPositions']) {
  
      if(!this.manualChange) {
        this.markerPositions = changes['markerPositions'].currentValue;
        this.sliderInstance?.set(this.defineMarkerPositions())
      } else
        this.manualChange = false;
    }
  }

  createPipValues(values: number[], maxPips = 5) {
    const step = Math.round(values.length / maxPips);

    return values.filter((_, i) => i % step === 0);
  }

  private initSlider() {
    const pips = this.data.map((_, index) => index);   

    this.sliderInstance = noUiSlider.create(this.sliderContainer.nativeElement, {
      behaviour: 'drag',
      range: {
        min: 0,
        max: this.data.length-1
      },
      start: this.defineMarkerPositions(),
      step: 1,
      tooltips: true,
      connect: (this.type==SliderType.RANGE),
      pips: {
        mode: 'values' as any,
        values: this.createPipValues(pips),
        density: 4,
        format: {
          to: (value) => {
            return this.formatValue(value);
          },
          from: (value:any) => {
            return value;
          }
        }
      },
      format: {
        to: (value) => {
          return this.formatValue(value);
        },
        from: (value:any) => {
          return value;
        }
      }
    });

    this.sliderInstance.on('change', (values, handle, unencoded) => {
      this.manualChange = true;
      this.valueChange.emit(this.reFormatValues(unencoded));
    });
  }

  defineMarkerPositions():number[] {
    // findClosestIndex, cause range (start/end) works with precise ms values, whereas slider data is normalized to 00:00 and 23:59 range values
    
    if(this.type==SliderType.NORMAL)
      return [this.findClosestIndex(this.markerPositions[0])];  

    return [this.findClosestIndex(this.markerPositions[0]), this.findClosestIndex(this.markerPositions[1])];
  }

  findClosestIndex(x:Date) {

    const targetTime = new Date(x).getTime(); // Timestamp
    let closestIndex = 0;
    let minDiff = Math.abs(new Date(this.data[0]).getTime() - targetTime);

    for (let i = 1; i < this.data.length; i++) {
      const diff = Math.abs(new Date(this.data[i]).getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  hasMultipleValuesPerDay() {
    const seenDays = new Set();

    for (const value of this.data) {
      const d = new Date(value);

      // UTC-Tag eindeutig machen (YYYY-MM-DD)
      const dayKey =
        d.getUTCFullYear() + '-' +
        String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
        String(d.getUTCDate()).padStart(2, '0');

      // wenn Tag schon gesehen → mehrere Werte an einem Tag
      if (seenDays.has(dayKey)) {
        return true;
      }

      seenDays.add(dayKey);
    }

    return false;
  }

  formatDateLocal(date) {
    const d = new Date(date);

    const day = d.getDate();      
    const month = d.getMonth() + 1; 
    const year = String(d.getFullYear()).slice(-2);

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }
  
  formatValue(value:number):any {

    value = Math.round(value);

    const displayHours = this.hasMultipleValuesPerDay();
    
    if(this.displayMode == DisplayType.YEAR) 
      return new Date(this.data[value]).getFullYear();

    if(this.displayMode == DisplayType.DATE) {
      
      const date = new Date(this.data[value]);
      if(!displayHours) {
        return date.toLocaleDateString('de-DE');
      }

      return this.formatDateLocal(date);
    }
      
    return this.data[value];
  }

  getSliderValues() {
    const values = this.sliderInstance.noUiSlider.get();
    return Array.isArray(values) ? values : [values];
  }

  reFormatValues(values:number[]):any[] {
    return values.map(e => this.data[Math.round(e)]);
  }
}