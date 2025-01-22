import { ajskommonitorDataExchangeServiceeProvider } from 'app-upgraded-providers';
import { Inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TestService {


  public constructor(
    @Inject('kommonitorDataExchangeService') private ajskommonitorDataExchangeServiceeProvider: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  ) {}
  
  public testMethod(): void {
    return this.ajskommonitorDataExchangeServiceeProvider.availableIndicators;
  }
}
