import { Injectable, Inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KommonitorIndicatorDataGridHelperService {

  constructor(
    @Inject('kommonitorDataGridHelperService') private angularJsDataGridHelperService: any
  ) {}

  /**
   * Builds data grid for indicators - delegates to AngularJS service
   */
  buildDataGrid_indicators(indicatorMetadataArray: any[]): void {
    this.angularJsDataGridHelperService.buildDataGrid_indicators(indicatorMetadataArray);
  }
} 