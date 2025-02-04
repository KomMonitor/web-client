import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FilterHelperService {

  pipedData: any;

  public constructor(
    @Inject('kommonitorDataExchangeService') private ajskommonitorFilterHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorFilterHelperServiceProvider;
  }
}