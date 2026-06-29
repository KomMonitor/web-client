import { CommonModule } from '@angular/common';
import { Component, HostListener, Input, OnInit } from '@angular/core';
import { IndicatorsDataset } from 'components/ngComponents/models/indicators.models';

interface IndicatorTooltipData {
  data: IndicatorsDataset;
  prefix?: string;
}

@Component({
  selector: 'app-indicator-metadata-tooltip',
  templateUrl: './indicator-metadata-tooltip.component.html',
  styleUrls: ['./indicator-metadata-tooltip.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class IndicatorMetadataTooltipComponent {
  @Input() indicatorData!: IndicatorTooltipData;

  mousePosX!: string;
  mousePosY!: string;

  offsetX: number = 20;
  offsetY: number = -100;

  @HostListener('mousemove', ['$event']) onMouseMove(event) {
    this.mousePosX = `${event.clientX + this.offsetX}px`;
    this.mousePosY = `${event.clientY + this.offsetY}px`;
  }

  onMouseover(prefix: string = '') {
    const elem = document.getElementById(`${prefix}tooltip-${this.indicatorData.data.indicatorId}`);
    elem!.style.display = 'block';
  }

  onMouseout(prefix: string = '') {
    const elem = document.getElementById(`${prefix}tooltip-${this.indicatorData.data.indicatorId}`);
    elem!.style.display = 'none';
  }
}
