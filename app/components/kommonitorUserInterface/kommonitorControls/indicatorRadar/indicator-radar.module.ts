// indicator-radar.module.ts

import { NgModule } from '@angular/core';

import { kommonitorDiagramHelperServiceFactory } from 'app-upgraded-providers';
import { kommonitorDataExchangeServiceFactory } from 'app-upgraded-providers';
import { IndicatorRadarComponent } from './indicator-radar';
@NgModule({
  imports: [
 
  ],
  providers:[kommonitorDataExchangeServiceFactory,kommonitorDiagramHelperServiceFactory],
  declarations: [IndicatorRadarComponent],
  exports: [] 
})
export class IndicatorRadarModule { }
