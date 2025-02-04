import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VisualStyleHelperService {

  pipedData:any;

  public constructor(
    @Inject('kommonitorVisualStyleHelperService') private ajskommonitorVisualStyleHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorVisualStyleHelperServiceProvider;
  }

}