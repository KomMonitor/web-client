// indicator-radar.module.ts

import { NgModule } from '@angular/core';
import { ajskommonitorDiagramHelperServiceProvider } from 'app-upgraded-providers';
import { ajskommonitorDataExchangeServiceeProvider } from 'app-upgraded-providers';
import { ajskommonitorFilterHelperServiceProvider } from 'app-upgraded-providers';
import { IndicatorRadarComponent } from './indicator-radar';
@NgModule({
  imports: [

  ],
  providers: [ajskommonitorDiagramHelperServiceProvider,ajskommonitorDataExchangeServiceeProvider,ajskommonitorFilterHelperServiceProvider], 
  declarations: [IndicatorRadarComponent],
  exports: [] 
})
export class IndicatorRadarModule { }
