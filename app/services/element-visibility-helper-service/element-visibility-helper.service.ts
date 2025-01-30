import { Injectable, Inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ElementVisibilityHelperService {

  pipedData:any;

  public constructor(
    @Inject('kommonitorDataExchangeService') private ajskommonitorElementVisibilityHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorElementVisibilityHelperServiceProvider;
  }
}
