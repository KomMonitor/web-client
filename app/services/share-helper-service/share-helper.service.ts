import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ShareHelperService {

  pipedData:any;
  currentShareLink!: string;

  public constructor(
    @Inject('kommonitorShareHelperService') private ajskommonitorShareHelperServiceProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {
    this.pipedData = this.ajskommonitorShareHelperServiceProvider;
  }

  generateCurrentShareLink() {
    this.ajskommonitorShareHelperServiceProvider.generateCurrentShareLink();

    this.currentShareLink = this.ajskommonitorShareHelperServiceProvider.currentShareLink;
  }
}