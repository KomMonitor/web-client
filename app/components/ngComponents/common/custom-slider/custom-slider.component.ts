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
export class CustomSliderComponent implements AfterViewInit {

  @ViewChild('sliderContainer') sliderContainer!: ElementRef;

  @Input() data:any[] = [];
  @Input() type: SliderType = SliderType.NORMAL;
  @Input() markerPositions: number[] = [0];
  @Input() displayMode: DisplayType = DisplayType.NORMAL

  @Output() valueChange = new EventEmitter<number | number[]>();

  private sliderInstance: any;

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

  private initSlider() {
    this.sliderInstance = this.sliderContainer.nativeElement;

    var pips = this.data.map((_, index) => index);   

    noUiSlider.create(this.sliderInstance, {
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
        values: pips,
        density: 0,
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

    this.sliderInstance.noUiSlider.on('set', (values, handle, unencoded) => {
      this.valueChange.emit(this.reFormatValues(unencoded));
    });
  }

  defineMarkerPositions():number[] {
    return this.markerPositions.map(e => this.data.indexOf(e));
  }

  formatValue(value:number):any {
    if(this.displayMode == DisplayType.YEAR)
      return new Date(this.data[value]).getFullYear();

    if(this.displayMode == DisplayType.DATE) {
      var date = new Date(this.data[value]);
      return date.toLocaleDateString('de-DE');
    }
      
    return this.data[value];
  }

  reFormatValues(values:number[]):any[] {
    return values.map(e => this.data[e]);
  }
}