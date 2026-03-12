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
export class CustomSliderComponent implements OnInit, AfterViewInit {

  @ViewChild('sliderContainer') sliderContainer!: ElementRef;

  @Input() data:any[] = [];
  @Input() type: SliderType = SliderType.NORMAL;
  @Input() markerPositions: any[] = [0];
  @Input() displayMode: DisplayType = DisplayType.NORMAL

  @Output() valueChange = new EventEmitter<number | number[]>();

  private sliderInstance: any;

  errorMsg = '';

  ngOnInit() {

    if(!this.data || this.data.length==0)
      this.errorMsg = 'Data not set or empty';

    if(this.type==SliderType.RANGE && this.markerPositions.length!=2)
      this.errorMsg = 'Type range needs two marker positions';

    if(this.type==SliderType.NORMAL && this.markerPositions.length>1)
      this.errorMsg = 'Type normal needs one marker position only';
  }

  ngAfterViewInit(): void {
    if(this.errorMsg=='')
      this.initSlider();
  }

  createPipValues(values: number[], maxPips = 5) {
    const step = Math.ceil(values.length / maxPips);

    return values.filter((_, i) => i % step === 0);
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

    this.sliderInstance.noUiSlider.on('set', (values, handle, unencoded) => {
      this.valueChange.emit(this.reFormatValues(unencoded));
    });
  }

  defineMarkerPositions():number[] {
    // getTime, weil "indexOf" bei Date nicht zuverlässig funktioniert
    return this.markerPositions.map(m =>
      this.data.findIndex(d => d.getTime() === m.getTime())
    );
  }
  
  getSliderValues() {
    const values = this.sliderInstance.noUiSlider.get();
    return Array.isArray(values) ? values : [values];
  }

  formatValue(value:number):any {

    value = Math.ceil(value);
    
    if(this.displayMode == DisplayType.YEAR)
      return new Date(this.data[value]).getFullYear();

    if(this.displayMode == DisplayType.DATE) {
      var date = new Date(this.data[value]);
      return date.toLocaleDateString('de-DE');
    }
      
    return this.data[value];
  }

  reFormatValues(values:number[]):any[] {
    return values.map(e => this.data[Math.ceil(e)]);
  }
}